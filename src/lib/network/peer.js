import { Peer } from 'peerjs';
import { get } from 'svelte/store';
import { MSG } from './protocol.js';
import { chunkBlob, receiveChunk } from './imageTransfer.js';
import { gameState, role, connectionStatus, statusMessage, peerCount, sceneImageUrls } from '../state.js';

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

/** Become the GM: opens a PeerJS host peer under a short join code. */
export function hostSession() {
  return new Promise((resolve, reject) => {
    const code = generateSessionCode();
    connectionStatus.set('connecting');
    peer = new Peer(code, { debug: 0 });

    peer.on('open', (id) => {
      role.set('gm');
      connectionStatus.set('connected');
      gameState.update((s) => ({ ...s, sessionId: id }));
      resolve(id);
    });

    peer.on('connection', (conn) => {
      connections.set(conn.peer, conn);

      conn.on('open', async () => {
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
        connections.delete(conn.peer);
        peerCount.set(connections.size);
      });
      conn.on('error', () => {
        connections.delete(conn.peer);
        peerCount.set(connections.size);
      });
    });

    peer.on('error', (err) => {
      connectionStatus.set('error');
      statusMessage.set(err.message || 'Connection error.');
      reject(err);
    });
  });
}

/** Join an existing session as a read-only player. */
export function joinSession(code) {
  return new Promise((resolve, reject) => {
    connectionStatus.set('connecting');
    peer = new Peer({ debug: 0 });

    peer.on('open', () => {
      const conn = peer.connect(code.toUpperCase(), { reliable: true });
      hostConnection = conn;

      conn.on('open', () => {
        role.set('player');
        connectionStatus.set('connected');
        gameState.update((s) => ({ ...s, sessionId: code.toUpperCase() }));
        resolve();
      });

      conn.on('data', (msg) => handlePlayerMessage(msg));

      conn.on('close', () => {
        connectionStatus.set('disconnected');
        statusMessage.set('Disconnected from the GM.');
      });

      conn.on('error', (err) => {
        connectionStatus.set('error');
        statusMessage.set(err.message || 'Connection error.');
        reject(err);
      });
    });

    peer.on('error', (err) => {
      connectionStatus.set('error');
      statusMessage.set('Could not reach that session. Check the code and try again.');
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
