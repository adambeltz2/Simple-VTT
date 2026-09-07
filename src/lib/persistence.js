import { get } from 'svelte/store';
import { gameState, role } from './state.js';

const STORAGE_KEY = 'vtt:last-session';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // stale resume prompts aren't useful past a day

export function saveSession(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }));
  } catch {
    // localStorage unavailable (private browsing, quota, disabled) - resume just won't be offered.
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

let saveTimer = null;

/**
 * Keeps the persisted session in sync with live state so a refresh can offer
 * to resume it. The GM's full game state is debounced (token drags fire this
 * up to 20x/second) and saved a moment after things settle; a player only
 * needs its session code persisted once, since rejoining always triggers a
 * fresh STATE_SYNC from the GM.
 */
export function watchAndPersist() {
  gameState.subscribe((s) => {
    if (!s.sessionId) return;
    const currentRole = get(role);

    if (currentRole === 'gm') {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveSession({ role: 'gm', sessionId: s.sessionId, gameState: s });
      }, 300);
    } else if (currentRole === 'player') {
      saveSession({ role: 'player', sessionId: s.sessionId });
    }
  });
}
