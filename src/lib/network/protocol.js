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
  TURN_ADVANCE: 'TURN_ADVANCE',
  FOG_SET: 'FOG_SET',
  FOG_CELL: 'FOG_CELL'
};

// Per CLAUDE.md constraint #4: chunk map images to avoid channel buffer overflow.
export const IMAGE_CHUNK_SIZE = 64 * 1024;

// Per CLAUDE.md constraint #4: throttle token coordinate updates to ~20fps.
export const TOKEN_MOVE_THROTTLE_MS = 50;

// STUN-only ICE can't traverse symmetric/carrier-grade NATs (e.g. a phone on
// cellular connecting to a desktop on wifi), which surfaces to users as a
// WebRTC "negotiation failed" error. Open Relay Project's TURN servers are a
// free, no-signup public relay used widely for exactly this fallback case.
// If this project ever needs guaranteed reliability, swap in a dedicated
// TURN provider (Twilio, Metered, Cloudflare) here.
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];
