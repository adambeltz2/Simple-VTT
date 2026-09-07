// WebRTC data channel payload types, per docs/ARCHITECTURE.md section 6.
export const MSG = {
  STATE_SYNC: 'STATE_SYNC',
  TOKEN_ADD: 'TOKEN_ADD',
  TOKEN_MOVE: 'TOKEN_MOVE',
  TOKEN_REMOVE: 'TOKEN_REMOVE',
  SCENE_ADD: 'SCENE_ADD',
  SCENE_IMAGE_CHUNK: 'SCENE_IMAGE_CHUNK',
  SCENE_CHANGE: 'SCENE_CHANGE',
  INITIATIVE_UPDATE: 'INITIATIVE_UPDATE',
  TURN_ADVANCE: 'TURN_ADVANCE'
};

// Per CLAUDE.md constraint #4: chunk map images to avoid channel buffer overflow.
export const IMAGE_CHUNK_SIZE = 64 * 1024;

// Per CLAUDE.md constraint #4: throttle token coordinate updates to ~20fps.
export const TOKEN_MOVE_THROTTLE_MS = 50;
