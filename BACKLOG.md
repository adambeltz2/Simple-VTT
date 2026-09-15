# Backlog

Planned work not yet implemented, roughly prioritized. Nothing here is
scheduled — pull items up as needed. Shipped work moves to
[`CHANGELOG.md`](CHANGELOG.md) instead of staying here.

## Up next (in this order)
- [ ] **1. Sample-scene onboarding tutorial.** A "Load Sample Scene"
      button (GM, shown when there are no scenes yet) that seeds a
      canvas-generated placeholder map plus a few sample tokens, so a new
      GM can see how scenes/tokens/initiative/fog work without needing
      their own map first. Pairs well with a short first-run walkthrough
      pointing at the toolbar/scene manager/initiative tracker.

## Near-term
- [ ] Reconnection handling: detect a dropped GM/player connection *during
      an active session* (distinct from session resume, shipped in v0.2.0,
      which only covers a full page refresh) and allow rejoining without a
      full state loss.
- [ ] Scene management polish: rename and delete scenes, confirm before
      overwriting/replacing a scene's image.
- [ ] Validate/guard against a GM uploading a session with zero connected
      players still queuing very large image transfers (currently fine, but
      untested at scale).
- [ ] Persist scene image blobs via IndexedDB so a GM resume restores map
      art, not just scene metadata (session resume itself shipped in v0.2.0).
- [ ] Deploy `cloudflare-turn-worker/` to a live Cloudflare account and set
      `VITE_TURN_WORKER_URL` in production. The worker code and client-side
      wiring (`fetchIceServers()` in `protocol.js`, with Open Relay as
      automatic fallback) are in place; what's left is the one-time
      Cloudflare-side setup in `cloudflare-turn-worker/README.md` (create
      the TURN app, set the `TURN_KEY_ID`/`TURN_API_TOKEN` secrets, deploy).

## Medium-term
- [ ] Measurement/ruler tool snapped to grid size.
- [ ] Drag-and-drop reordering in the initiative tracker (currently
      up/down buttons only).
- [ ] Mobile/touch gesture refinement (pinch-zoom on the board, larger hit
      targets for tokens on small screens).

## Longer-term / infra
- [ ] Unit-level tests for the protocol/state reducer logic in isolation
      (`src/lib/network/peer.js`, `src/lib/actions.js`) — the E2E Playwright
      suite (shipped in v0.4.0, CI-gated) covers real user flows but not
      fast, isolated reducer-logic checks.
- [ ] Accessibility pass: keyboard navigation for the initiative tracker and
      scene list, ARIA labeling for icon-only buttons.
- [ ] Multiple simultaneous GM support / GM handoff (currently a session has
      exactly one authoritative host for its lifetime).

## Explicitly out of scope
Per `CLAUDE.md`: no backend/server-side persistence, no WebSocket
alternative to WebRTC, no audio/video, no 3D or heavy rendering engines, no
hardcoded ruleset automation.
