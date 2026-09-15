import { Peer } from 'peerjs';
import { get } from 'svelte/store';
import { MSG, fetchIceServers } from './protocol.js';
import { chunkBlob, receiveChunk } from './imageTransfer.js';
import { gameState, role, connectionStatus, statusMessage, peerCount, sceneImageUrls } from '../state.js';
import { logEvent } from '../diagnostics.js';

// PeerJS brokers only the SDP handshake via its free public cloud signaling
// server; once a DataConnection opens, all traffic flows peer-to-peer over
// the underlying RTCDataChannel. See docs/ARCHITECTURE.md section 3.

let peer = null;
const connections = new Map(); // GM side: playerPeerId -> DataConnection
let hostConnection = null; // Player side: DataConnection to the GM
const sceneBlobs = new Map(); // GM side: sceneId -> Blob, kept for late joiners

// Excludes visually ambiguous characters (0/O, 1/I) from join codes.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateSessionCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function sendJSON(conn, msg) {
  if (conn && conn.open) conn.send(msg);
}

/**
 * WebRTC negotiation failures give almost no detail by default. This attaches
 * to the underlying RTCPeerConnection (PeerJS exposes it as `.peerConnection`
 * once negotiation starts) and logs every ICE state transition, plus a
 * candidate-type summary via getStats() when ICE actually fails/disconnects —
 * telling us whether a relay (TURN) candidate was even reachable, as opposed
 * to only host/srflx ones.
 */
function attachIceDiagnostics(conn, label) {
  let attempts = 0;
  const tryAttach = () => {
    const pc = conn.peerConnection;
    if (!pc) {
      if (attempts++ < 20) setTimeout(tryAttach, 100);
      return;
    }
    logEvent('info', `[${label}] ICE connection state: ${pc.iceConnectionState}`);
    pc.addEventListener('iceconnectionstatechange', () => {
      logEvent('info', `[${label}] ICE connection state changed: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        summarizeIceFailure(pc, label);
      }
    });
    pc.addEventListener('icegatheringstatechange', () => {
      logEvent('info', `[${label}] ICE gathering state: ${pc.iceGatheringState}`);
    });
  };
  tryAttach();
}

async function summarizeIceFailure(pc, label) {
  try {
    const stats = await pc.getStats();
    const candidateTypes = new Set();
    stats.forEach((report) => {
      if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
        candidateTypes.add(`${report.type}=${report.candidateType}`);
      }
    });
    const summary = candidateTypes.size ? [...candidateTypes].join(', ') : 'none gathered';
    logEvent(
      'error',
      `[${label}] ICE state is now ${pc.iceConnectionState}. Candidates seen: ${summary}. ` +
        `${candidateTypes.size && ![...candidateTypes].some((c) => c.includes('relay')) ? 'No relay (TURN) candidate was found — the TURN server may be unreachable or blocked on this network.' : ''}`
    );
  } catch (e) {
    logEvent('error', `[${label}] ICE failed and getStats() also failed: ${e.message}`);
  }
}

function friendlyErrorMessage(err) {
  if (err.type === 'unavailable-id') {
    return 'That session code is still active from before. Wait a few seconds and try Resume again.';
  }
  if (err.type === 'webrtc' || /negotiation/i.test(err.message || '')) {
    return "Couldn't establish a direct connection — this can happen between very different networks (e.g. phone data vs. wifi) if both a direct route and the relay fallback are blocked. Try again, or connect both devices to the same wifi.";
  }
  if (err.type === 'peer-unavailable') {
    return 'No session found with that code. Double check it and try again.';
  }
  return err.message || 'Connection error.';
}

/** GM-only: send a message to every connected player. */
export function broadcast(msg) {
  for (const conn of connections.values()) sendJSON(conn, msg);
}

/** GM-only: cache a scene's decoded blob locally so late joiners can be backfilled. */
export function cacheSceneBlob(sceneId, blob) {
  sceneBlobs.set(sceneId, blob);
  sceneImageUrls.update((m) => ({ ...m, [sceneId]: URL.createObjectURL(blob) }));
}

async function sendSceneImage(sceneId, conn) {
  const blob = sceneBlobs.get(sceneId);
  if (!blob) return;
  for await (const chunk of chunkBlob(blob)) {
    sendJSON(conn, {
      type: MSG.SCENE_IMAGE_CHUNK,
      sceneId,
      index: chunk.index,
      total: chunk.total,
      data: chunk.data
    });
  }
}

/**
 * Become the GM: opens a PeerJS host peer under a short join code.
 * Pass an explicit code to re-host an existing session (e.g. resuming after
 * a refresh) instead of generating a fresh one.
 */
export async function hostSession(explicitCode) {
  const code = explicitCode || generateSessionCode();
  connectionStatus.set('connecting');
  logEvent('info', `Hosting session ${code}: fetching ICE servers…`);
  const iceServers = await fetchIceServers();
  logEvent('info', `Hosting session ${code} (${iceServers.length} ICE server(s))…`);

  return new Promise((resolve, reject) => {
    peer = new Peer(code, { debug: 0, config: { iceServers } });

    peer.on('open', (id) => {
      logEvent('info', `Host peer opened as ${id}`);
      role.set('gm');
      connectionStatus.set('connected');
      gameState.update((s) => ({ ...s, sessionId: id }));
      resolve(id);
    });

    peer.on('connection', (conn) => {
      logEvent('info', `Incoming connection from ${conn.peer}`);
      connections.set(conn.peer, conn);
      attachIceDiagnostics(conn, conn.peer);

      conn.on('open', async () => {
        logEvent('info', `Connection with ${conn.peer} open`);
        peerCount.set(connections.size);

        // Full snapshot first, then backfill every buffered scene image so a
        // late joiner ends up with the same board state as everyone else.
        sendJSON(conn, { type: MSG.STATE_SYNC, state: get(gameState) });
        const scenes = get(gameState).scenes;
        for (const sceneId of Object.keys(scenes)) {
          sendJSON(conn, { type: MSG.SCENE_ADD, sceneId, scene: scenes[sceneId] });
          await sendSceneImage(sceneId, conn);
        }
      });

      conn.on('close', () => {
        logEvent('warn', `Connection with ${conn.peer} closed`);
        connections.delete(conn.peer);
        peerCount.set(connections.size);
      });
      conn.on('error', (err) => {
        logEvent('error', `Connection with ${conn.peer} error: ${err.type || err.name || ''} ${err.message || ''}`);
        connections.delete(conn.peer);
        peerCount.set(connections.size);
      });
    });

    peer.on('disconnected', () => logEvent('warn', 'Host peer disconnected from the signaling server'));

    peer.on('error', (err) => {
      logEvent('error', `Host peer error: ${err.type || err.name || ''} ${err.message || ''}`);
      connectionStatus.set('error');
      statusMessage.set(friendlyErrorMessage(err));
      reject(err);
    });
  });
}

/** Join an existing session as a read-only player. */
export async function joinSession(code) {
  const upperCode = code.toUpperCase();
  connectionStatus.set('connecting');
  logEvent('info', `Joining session ${upperCode}: fetching ICE servers…`);
  const iceServers = await fetchIceServers();
  logEvent('info', `Joining session ${upperCode} (${iceServers.length} ICE server(s))…`);

  return new Promise((resolve, reject) => {
    peer = new Peer({ debug: 0, config: { iceServers } });

    peer.on('open', (id) => {
      logEvent('info', `Player peer opened as ${id}, connecting to ${upperCode}…`);
      const conn = peer.connect(upperCode, { reliable: true });
      hostConnection = conn;
      attachIceDiagnostics(conn, 'GM');

      conn.on('open', () => {
        logEvent('info', `Connection to ${upperCode} open`);
        role.set('player');
        connectionStatus.set('connected');
        gameState.update((s) => ({ ...s, sessionId: upperCode }));
        resolve();
      });

      conn.on('data', (msg) => handlePlayerMessage(msg));

      conn.on('close', () => {
        logEvent('warn', `Connection to ${upperCode} closed`);
        connectionStatus.set('disconnected');
        statusMessage.set('Disconnected from the GM.');
      });

      conn.on('error', (err) => {
        logEvent('error', `Connection to ${upperCode} error: ${err.type || err.name || ''} ${err.message || ''}`);
        connectionStatus.set('error');
        statusMessage.set(friendlyErrorMessage(err));
        reject(err);
      });
    });

    peer.on('disconnected', () => logEvent('warn', 'Player peer disconnected from the signaling server'));

    peer.on('error', (err) => {
      logEvent('error', `Player peer error: ${err.type || err.name || ''} ${err.message || ''}`);
      connectionStatus.set('error');
      statusMessage.set(friendlyErrorMessage(err));
      reject(err);
    });
  });
}

function handlePlayerMessage(msg) {
  switch (msg.type) {
    case MSG.STATE_SYNC:
      gameState.set(msg.state);
      break;

    case MSG.SCENE_ADD:
      gameState.update((s) => ({ ...s, scenes: { ...s.scenes, [msg.sceneId]: msg.scene } }));
      break;

    case MSG.SCENE_IMAGE_CHUNK: {
      const url = receiveChunk(msg.sceneId, msg.index, msg.total, msg.data);
      if (url) sceneImageUrls.update((m) => ({ ...m, [msg.sceneId]: url }));
      break;
    }

    case MSG.SCENE_CHANGE:
      gameState.update((s) => ({ ...s, activeSceneId: msg.sceneId }));
      break;

    case MSG.TOKEN_ADD:
      gameState.update((s) => ({ ...s, tokens: { ...s.tokens, [msg.id]: msg.token } }));
      break;

    case MSG.TOKEN_MOVE:
      gameState.update((s) => {
        const token = s.tokens[msg.id];
        if (!token) return s;
        return { ...s, tokens: { ...s.tokens, [msg.id]: { ...token, x: msg.x, y: msg.y } } };
      });
      break;

    case MSG.TOKEN_REMOVE:
      gameState.update((s) => {
        const tokens = { ...s.tokens };
        delete tokens[msg.id];
        return { ...s, tokens };
      });
      break;

    case MSG.INITIATIVE_UPDATE:
      gameState.update((s) => ({ ...s, initiative: msg.initiative }));
      break;

    case MSG.TURN_ADVANCE:
      gameState.update((s) => ({ ...s, activeTurnIndex: msg.index }));
      break;

    case MSG.FOG_SET:
      gameState.update((s) => ({
        ...s,
        scenes: { ...s.scenes, [msg.sceneId]: { ...s.scenes[msg.sceneId], fog: msg.fog } }
      }));
      break;

    case MSG.FOG_CELL:
      gameState.update((s) => {
        const scene = s.scenes[msg.sceneId];
        if (!scene?.fog) return s;
        const revealed = scene.fog.revealed.slice();
        revealed[msg.index] = msg.revealed;
        return { ...s, scenes: { ...s.scenes, [msg.sceneId]: { ...scene, fog: { ...scene.fog, revealed } } } };
      });
      break;
  }
}

export function disconnect() {
  connections.forEach((c) => c.close());
  connections.clear();
  hostConnection?.close();
  peer?.destroy();
  peer = null;
  hostConnection = null;
  connectionStatus.set('disconnected');
}
