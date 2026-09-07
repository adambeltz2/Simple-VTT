import { get } from 'svelte/store';
import { gameState } from './state.js';
import { broadcast, cacheSceneBlob } from './network/peer.js';
import { chunkBlob, compressImageFile, hashBlob } from './network/imageTransfer.js';
import { MSG, TOKEN_MOVE_THROTTLE_MS } from './network/protocol.js';

// GM-only mutations. Each one updates the local (authoritative) store and
// broadcasts the corresponding delta, per docs/ARCHITECTURE.md section 6.

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function addToken({ name, color, x, y, sceneId }) {
  const id = uid('t');
  const token = { scene: sceneId, name, x: Math.round(x), y: Math.round(y), color };
  gameState.update((s) => ({ ...s, tokens: { ...s.tokens, [id]: token } }));
  broadcast({ type: MSG.TOKEN_ADD, id, token });
  return id;
}

let lastMoveSent = 0;

/** Throttled to ~20fps per CLAUDE.md constraint #4; pass force to flush on pointerup. */
export function moveToken(id, x, y, { force = false } = {}) {
  gameState.update((s) => {
    const token = s.tokens[id];
    if (!token) return s;
    return { ...s, tokens: { ...s.tokens, [id]: { ...token, x, y } } };
  });

  const now = performance.now();
  if (force || now - lastMoveSent >= TOKEN_MOVE_THROTTLE_MS) {
    lastMoveSent = now;
    broadcast({ type: MSG.TOKEN_MOVE, id, x: Math.round(x), y: Math.round(y) });
  }
}

export function removeToken(id) {
  gameState.update((s) => {
    const tokens = { ...s.tokens };
    delete tokens[id];
    return { ...s, tokens };
  });
  broadcast({ type: MSG.TOKEN_REMOVE, id });
}

/** Compresses the map image, registers the scene, and streams it to connected players. */
export async function addScene({ name, gridSize, file }) {
  const { blob, width, height } = await compressImageFile(file);
  const bgImageHash = await hashBlob(blob);
  const sceneId = uid('scene');
  const scene = { name, gridSize, bgImageHash, width, height };

  gameState.update((s) => ({ ...s, scenes: { ...s.scenes, [sceneId]: scene } }));
  cacheSceneBlob(sceneId, blob);
  broadcast({ type: MSG.SCENE_ADD, sceneId, scene });

  for await (const chunk of chunkBlob(blob)) {
    broadcast({
      type: MSG.SCENE_IMAGE_CHUNK,
      sceneId,
      index: chunk.index,
      total: chunk.total,
      data: chunk.data
    });
  }

  return sceneId;
}

export function setActiveScene(sceneId) {
  gameState.update((s) => ({ ...s, activeSceneId: sceneId }));
  broadcast({ type: MSG.SCENE_CHANGE, sceneId });
}

export function updateInitiative(initiative) {
  gameState.update((s) => ({ ...s, initiative }));
  broadcast({ type: MSG.INITIATIVE_UPDATE, initiative });
}

export function advanceTurn() {
  const s = get(gameState);
  const count = s.initiative.length;
  const index = count === 0 ? 0 : (s.activeTurnIndex + 1) % count;
  gameState.update((st) => ({ ...st, activeTurnIndex: index }));
  broadcast({ type: MSG.TURN_ADVANCE, index });
}
