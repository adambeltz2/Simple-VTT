# Changelog

All notable changes to this project are documented in this file. Format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The project is continuously deployed to GitHub Pages from `main`; each
version below corresponds to a git tag (`vX.Y.Z`) at the commit that shipped it.

## [Unreleased]

## [0.4.0] - 2026-09-07

### Added
- **Connection diagnostics.** `src/lib/diagnostics.js` records every
  connection-lifecycle and WebRTC/ICE state-change event (peer open,
  connection open/close/error, ICE connection/gathering state, and a
  candidate-type summary via `getStats()` when ICE fails or disconnects —
  showing whether a relay/TURN candidate was even reachable). Surfaced via
  a new "Show connection log" panel (`DiagnosticsPanel.svelte`) on every
  screen, with a one-click copy button. Prompted by a real report of a
  connection failing even with the v0.2.0 TURN fallback in place — this
  won't fix every network, but it turns "it didn't work" into an actual
  diagnosable log.
- **Version number in the footer**, injected at build time from
  `package.json` via a Vite `define` (`__APP_VERSION__`), plus proper
  GitHub and Buy-Me-a-Coffee icons (inline SVG, no external requests).
- **Permanent, committed Playwright test suite** (`tests/`) covering the
  full host/join/scene/token/initiative flow, session resume, and fog of
  war — real headless-Chromium instances over real WebRTC connections, no
  mocking. `npm test` runs it locally (`playwright.config.js` auto-starts
  the dev server).
- **CI test gate.** `.github/workflows/deploy.yml` now runs the test suite
  in its own job before building; a failure stops the pipeline before
  anything is built or deployed, so a regression can't reach production
  silently.
- **Browser Support section** in the README documenting real constraints:
  restrictive networks/firewalls, in-app WebView browsers, private-browsing
  `localStorage` behavior, the `crypto.subtle` secure-context requirement,
  and the one-role-per-browser limitation.

### Verified
- Full existing test suite plus the new committed Playwright specs, run
  both locally and as the actual CI gate on this release's deploy.

## [0.3.0] - 2026-09-07

### Added
- **Fog of war.** Per-scene, grid-aligned reveal/hide mask, GM-controlled:
  - Toggle "Enabled" in the new Fog of War panel to create the mask for the
    active scene (all cells hidden by default).
  - "Reveal Brush" / "Hide Brush" paint tools (click-and-drag) toggle
    individual grid cells; "Reveal All" / "Hide All" bulk-set the whole
    scene.
  - GM sees a translucent tint over hidden cells (can still see the map and
    tokens); players see hidden cells as fully opaque, which also hides any
    tokens underneath.
  - Two new small delta payloads (`FOG_CELL` per-cell, `FOG_SET` for
    enable/disable/bulk) follow the same broadcast pattern as
    `TOKEN_MOVE`/`SCENE_CHANGE`. Fog data lives on the scene object, so it
    rides the existing `STATE_SYNC` and session-resume persistence for free
    — no new sync path needed.
  - `src/lib/components/FogControls.svelte` (new),
    `BoardCanvas.svelte` (paint interaction + rendering),
    `actions.js` (`setFogEnabled`, `setFogCell`, `setAllFog`).

### Verified
- New fog-of-war smoke test (8 checks: enable/disable, brush painting,
  bulk reveal/hide, GM-vs-player rendering difference, sync to a connected
  player) plus full regression of the v0.1.0/v0.2.0 test suites — all
  passing with zero console errors, locally and on the live deployment.

## [0.2.0] - 2026-09-07

### Added
- **Session resume.** Refreshing the tab no longer loses the session: the
  role and session code (plus, for the GM, the full game-state JSON) are
  persisted to `localStorage` and offered back as a "Resume session ABCDE"
  prompt on next load. GM resume re-hosts under the same join code; players
  rejoin normally and get a fresh `STATE_SYNC`. Scene *images* are not
  restored (binary blobs aren't persisted) — only scene metadata — so a
  resumed GM will need to re-upload map art. (`src/lib/persistence.js`,
  `JoinScreen.svelte`, `hostSession(explicitCode)` in `peer.js`)
- **TURN server fallback.** Added Open Relay Project's free public TURN
  servers alongside Google STUN in the WebRTC ICE configuration
  (`ICE_SERVERS` in `protocol.js`), used by both `hostSession` and
  `joinSession`.
- **Friendlier connection error messages** for the known PeerJS/WebRTC
  failure modes (`unavailable-id`, `webrtc`/negotiation failure,
  `peer-unavailable`) instead of raw error text.
- **Footer** with links to the GitHub repo and a Buy Me a Coffee page,
  shown on every screen (`Footer.svelte`).

### Fixed
- WebRTC connections failing between peers on very different networks (e.g.
  a phone on cellular data hosting, a desktop on wifi joining), surfaced as
  "Negotiation of connection to `<code>` failed." STUN alone can't traverse
  symmetric/carrier-grade NATs; the TURN fallback above resolves the common
  case. (Reported against a live session; a residual failure is still
  possible if both the direct path and the relay are blocked by a very
  restrictive network — see README's Known Limitations.)

### Verified
- Full regression + new resume/footer smoke tests (headless Chromium),
  including simulated reload-and-resume, all passing with zero console
  errors, both locally and against the live GitHub Pages deployment.

## [0.1.0] - 2026-09-07

### Added
- GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the
  app and deploys `dist/` to GitHub Pages via `actions/deploy-pages` on
  every push to `main`. Pages is configured with source "GitHub Actions"
  (no `gh-pages` branch). Live at https://adambeltz2.github.io/Simple-VTT/.
- Initial project scaffold: Vite + Svelte 4, static build config (`base: './'`
  for portable GitHub Pages deployment).
- Core game state store (`src/lib/state.js`) matching the JSON schema defined
  in `CLAUDE.md` (sessionId, activeSceneId, initiative, activeTurnIndex,
  scenes, tokens).
- PeerJS-based networking layer (`src/lib/network/peer.js`): host/join a
  session via a short 5-character code, GM-to-player broadcast, full-state
  sync on connect, and late-joiner scene backfill.
- WebRTC message protocol (`src/lib/network/protocol.js`): `STATE_SYNC`,
  `TOKEN_ADD`/`TOKEN_MOVE`/`TOKEN_REMOVE`, `SCENE_ADD`/`SCENE_IMAGE_CHUNK`/
  `SCENE_CHANGE`, `INITIATIVE_UPDATE`, `TURN_ADVANCE`.
- Image transfer pipeline (`src/lib/network/imageTransfer.js`): client-side
  downscale + WEBP compression, SHA-256-based scene image hashing, 64KB
  chunking for background transfer, and receiver-side reassembly.
- GM action layer (`src/lib/actions.js`) that mutates local authoritative
  state and broadcasts deltas in one call.
- Canvas board rendering (`BoardCanvas.svelte`): grid, background map,
  tokens with name labels, pointer-based token dragging throttled to ~20fps
  for the GM, read-only rendering for players.
- Scene manager UI: upload a map image, name it, set grid size, switch the
  active scene.
- Initiative tracker UI: add/remove/reorder combatants (GM), advance turn,
  read-only synced view for players.
- Join screen: host a session (generates a code) or join one (enter a code),
  with connection status/error feedback.
- Project documentation: this changelog, `BACKLOG.md`, `README.md`, and an
  updated `CLAUDE.md` reflecting the implementation decisions actually made.
- Relocated the original architecture spec to `docs/ARCHITECTURE.md`.

### Fixed
- Removed an unused CSS selector in `SceneManager.svelte` and resolved
  Svelte a11y lint warnings on the `TokenModal` backdrop (proper ARIA
  roles, Escape-to-cancel keyboard support).

### Verified
- `npm run build` produces a clean production bundle with no compiler
  warnings.
- End-to-end smoke test (headless Chromium, two independent browser
  contexts acting as GM and player) confirmed over a real WebRTC
  connection: hosting/joining by code, full state sync on join, scene
  image upload/compression/chunked P2P transfer, token add and drag-move
  sync, and initiative tracker add/reorder/turn-advance sync — all with
  zero console errors on either side.
