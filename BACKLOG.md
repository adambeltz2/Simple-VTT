# Backlog

Planned work not yet implemented, roughly prioritized. Nothing here is
scheduled — pull items up as needed.

## Near-term
- [ ] Reconnection handling: detect a dropped GM/player connection and allow
      rejoining the same session without a full state loss.
- [ ] Persist the last-used session code / role in `localStorage` for quick
      rejoin after an accidental refresh.
- [ ] Scene management polish: rename and delete scenes, confirm before
      overwriting/replacing a scene's image.
- [ ] Validate/guard against a GM uploading a session with zero connected
      players still queuing very large image transfers (currently fine, but
      untested at scale).

## Medium-term
- [ ] Fog of war layer (GM-controlled reveal/hide regions per scene).
- [ ] Measurement/ruler tool snapped to grid size.
- [ ] Drag-and-drop reordering in the initiative tracker (currently
      up/down buttons only).
- [ ] Mobile/touch gesture refinement (pinch-zoom on the board, larger hit
      targets for tokens on small screens).
- [ ] Configurable STUN/TURN servers — currently relies on PeerJS's default
      public cloud broker and Google STUN only, so sessions behind strict or
      symmetric NATs may fail to connect peer-to-peer.

## Longer-term / infra
- [ ] Automated tests for the protocol/state reducer logic
      (`src/lib/network/peer.js`, `src/lib/actions.js`).
- [ ] GitHub Actions workflow to build and deploy `dist/` to GitHub Pages on
      push to main (project has no CI yet — see README deployment section).
- [ ] Accessibility pass: keyboard navigation for the initiative tracker and
      scene list, ARIA labeling for icon-only buttons.
- [ ] Multiple simultaneous GM support / GM handoff (currently a session has
      exactly one authoritative host for its lifetime).

## Explicitly out of scope
Per `CLAUDE.md`: no backend/server-side persistence, no WebSocket
alternative to WebRTC, no audio/video, no 3D or heavy rendering engines, no
hardcoded ruleset automation.
