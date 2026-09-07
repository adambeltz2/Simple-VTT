# CLAUDE.md - Project Context & Instructions

## Status
Initial implementation complete (see `CHANGELOG.md`). Not yet pushed to
GitHub or deployed anywhere. Decisions below marked *(locked in)* are what
was actually built, resolving the "or" options from the original spec in
`docs/ARCHITECTURE.md`.

## Project Overview
Minimalist P2P VTT is a frictionless, zero-setup Virtual Tabletop designed to be hosted as a static frontend application (optimized for GitHub Pages). It uses WebRTC Data Channels for real-time peer-to-peer state synchronization, designating the Game Master (GM) as the authoritative host.

## Tech Stack
- **Frontend Framework:** Svelte 4 (via Vite) *(locked in — chosen over Preact)* for minimal bundle size and fast load times.
- **Rendering:** Native HTML5 Canvas API (strictly 2D, no WebGL/3D overhead). Board, grid, and tokens are all drawn to a single canvas rather than DOM overlays, for consistent hit-testing and drag performance.
- **Networking:** WebRTC (`RTCDataChannel`) for zero-cost, low-latency P2P sync.
- **Signaling:** PeerJS *(locked in — chosen over Supabase)*, using PeerJS's free public cloud broker strictly for the initial SDP handshake via a short (5-character) join code. Once a `DataConnection` opens, all traffic is direct P2P.
- **Hosting:** Fully static delivery (`vite build` output in `dist/`), `base: './'` for portable subpath deployment (e.g. GitHub Pages project sites).

## Development Commands
- **Install dependencies:** `npm install`
- **Run local dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`

## Architectural Rules & Constraints
1. **Zero Backend:** Do NOT introduce Node.js backend logic, standard WebSockets (Socket.io), or server-side database persistence for the ongoing game state.
2. **State Authority:** The GM client is the single source of truth. Connected player clients hold read-only views. State is synchronized via delta payloads (e.g., `TOKEN_MOVE`, `SCENE_CHANGE`).
3. **No A/V Integration:** Do NOT add WebRTC audio or video streaming features. The design explicitly relies on external tools (like Discord) to preserve bandwidth.
4. **Data Size Limits:** WebRTC data channels have limitations. Throttle token coordinate updates (e.g., limit `pointermove` to ~20fps). Chunk and compress map images (to WEBP) before sending them over the connection to prevent channel buffer overflow.
5. **No Heavy Libraries:** Avoid bringing in bloated rendering engines (Three.js, PixiJS) or complex ruleset automation. Keep the UI as lightweight native DOM elements floating over the canvas.

## Core Data Structures
When modifying state management, adhere to this core JSON tree structure:
```json
{
  "sessionId": "string (4-6 chars)",
  "activeSceneId": "string",
  "initiative": [
    { "id": "string", "name": "string", "value": "number" }
  ],
  "activeTurnIndex": "number",
  "scenes": {
    "[scene_id]": { 
      "name": "string", 
      "gridSize": "number", 
      "bgImageHash": "string" 
    }
  },
  "tokens": {
    "[token_id]": { 
      "scene": "string", 
      "name": "string", 
      "x": "number", 
      "y": "number", 
      "color": "string (hex)" 
    }
  }
}