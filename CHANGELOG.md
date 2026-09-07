# Changelog

All notable changes to this project are documented in this file. Format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This project has not yet been deployed or tagged — everything so far lives
under `[Unreleased]`.

## [Unreleased]

### Added
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
