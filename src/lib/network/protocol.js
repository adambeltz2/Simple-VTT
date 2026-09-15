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
// WebRTC "negotiation failed" error. This is the fallback used whenever the
// dedicated Cloudflare TURN worker (see fetchIceServers below) is unreachable
// or not configured: Open Relay Project's free, no-signup public relay.
export const FALLBACK_ICE_SERVERS = [
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

// Cloudflare's TURN service issues short-lived credentials that must be
// minted server-side (the API token that authorizes minting can't live in a
// static bundle). `cloudflare-turn-worker/` is a small Worker that holds that
// secret and returns nothing but a fresh { iceServers } pair — set its
// deployed URL here via VITE_TURN_WORKER_URL (see cloudflare-turn-worker/README.md).
const TURN_WORKER_URL = import.meta.env.VITE_TURN_WORKER_URL;

/**
 * Fetches fresh TURN credentials from the Cloudflare Worker. Falls back to
 * the static Open Relay servers (still STUN + best-effort TURN) if the
 * worker URL isn't configured or the request fails for any reason — a
 * missing/flaky TURN provider should degrade connectivity, not crash the app.
 */
export async function fetchIceServers() {
  if (!TURN_WORKER_URL) return FALLBACK_ICE_SERVERS;
  try {
    const resp = await fetch(TURN_WORKER_URL);
    if (!resp.ok) throw new Error(`Worker responded ${resp.status}`);
    const { iceServers } = await resp.json();
    if (!Array.isArray(iceServers) || iceServers.length === 0) throw new Error('Empty iceServers');
    return [{ urls: 'stun:stun.l.google.com:19302' }, ...iceServers];
  } catch {
    return FALLBACK_ICE_SERVERS;
  }
}
