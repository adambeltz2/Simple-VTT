import { writable } from 'svelte/store';

/**
 * Core JSON state tree, matching the schema in CLAUDE.md / docs/ARCHITECTURE.md.
 * The GM's copy of this store is the single source of truth; players receive
 * it via STATE_SYNC and mutate their local copy only in response to network
 * messages (see network/peer.js).
 */
export function createInitialState() {
  return {
    sessionId: '',
    activeSceneId: null,
    initiative: [],
    activeTurnIndex: 0,
    scenes: {},
    tokens: {}
  };
}

export const gameState = writable(createInitialState());

export const role = writable(null); // 'gm' | 'player' | null
export const connectionStatus = writable('disconnected'); // disconnected | connecting | connected | error
export const statusMessage = writable('');
export const peerCount = writable(0);

// sceneId -> object URL for the decoded WEBP background image. Kept out of
// gameState because it's binary/local, not part of the synced JSON tree.
export const sceneImageUrls = writable({});
