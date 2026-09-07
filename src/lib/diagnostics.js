import { writable } from 'svelte/store';

export const connectionLog = writable([]);

const MAX_ENTRIES = 300;

/**
 * Records a connection-lifecycle event both to the in-page diagnostics panel
 * and the browser console, so a failure (especially WebRTC/ICE negotiation,
 * which otherwise only surfaces as one generic error) can actually be
 * diagnosed instead of just reported as "didn't work."
 */
export function logEvent(level, message) {
  const entry = { ts: Date.now(), level, message };
  connectionLog.update((log) => {
    const next = [...log, entry];
    return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
  });

  const line = `[VTT] ${message}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function formatLog(log) {
  return log
    .map((e) => `${new Date(e.ts).toISOString()} [${e.level.toUpperCase()}] ${e.message}`)
    .join('\n');
}

export function clearLog() {
  connectionLog.set([]);
}
