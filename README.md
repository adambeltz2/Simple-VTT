# Minimalist P2P VTT

A frictionless, zero-setup Virtual Tabletop. No accounts, no installs, no
backend server, and no subscription — the GM's browser hosts the session and
players join with a short code, with all game state synced directly
browser-to-browser over WebRTC.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design spec
and [`CLAUDE.md`](CLAUDE.md) for the architectural rules this project is
built against.

## Features

- **Host or join in seconds** — the GM generates a short join code; players
  type it in and connect directly, no signup.
- **P2P sync over WebRTC data channels** — the GM's client is the single
  source of truth; player clients hold a synced, read-only view.
- **Canvas-based board** — a grid, background map, and colored tokens with
  names, rendered on HTML5 Canvas.
- **Scene/map management** — the GM uploads an image, it's downscaled and
  compressed to WEBP client-side, then streamed to players in 64KB chunks in
  the background so scene switches feel instant.
- **Token engine** — GM drags tokens around the board; movement is throttled
  to ~20fps before being broadcast, with clients rendering the live position.
- **Initiative tracker** — GM adds/removes/reorders combatants and advances
  turns; players see a live, read-only view with the active turn highlighted.

## Tech Stack

- **Svelte 4 + Vite** for a small, fast-loading static bundle.
- **PeerJS** (`RTCDataChannel` wrapper) for WebRTC signaling (via PeerJS's
  free public cloud broker) and the P2P data transport itself.
- **HTML5 Canvas** for board/token rendering — no 3D or heavy rendering
  engines.
- Ships as static HTML/JS/CSS — no backend, suitable for GitHub Pages or any
  static host.

## Getting Started

Requires [Node.js](https://nodejs.org/) (LTS) and npm.

```bash
npm install
npm run dev       # start the local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

Open two browser windows against the dev server to test host/join locally —
one as GM ("Host a Game"), one as a player ("Join a Game") using the code
shown in the GM window.

## Deploying to GitHub Pages

This project has not yet been pushed to GitHub or deployed anywhere — the
steps below are for when you're ready:

1. `git init && git add . && git commit -m "Initial commit"`
2. Create a GitHub repository and push this branch to it.
3. `npm run build` to produce `dist/`.
4. Deploy `dist/` to the `gh-pages` branch (e.g. via the `gh-pages` npm
   package or a GitHub Actions workflow) or point GitHub Pages at `dist/`
   using your CI of choice.

`vite.config.js` already sets `base: './'` so the built assets resolve
correctly whether the app is served from a domain root or a Pages project
subpath (`https://<user>.github.io/<repo>/`).

## Project Structure

```
src/
  main.js                    entry point
  App.svelte                 role-based router (join / GM / player)
  lib/
    state.js                 core game state store + connection/role stores
    actions.js                GM-only mutations (mutate + broadcast)
    network/
      peer.js                PeerJS session hosting/joining, message handling
      protocol.js            message type + tuning constants
      imageTransfer.js       WEBP compression, chunking, reassembly
    components/
      JoinScreen.svelte      host/join landing screen
      GMView.svelte          GM layout (board + toolbar + scene/initiative panels)
      PlayerView.svelte      read-only player layout
      BoardCanvas.svelte     canvas rendering + token drag interaction
      Toolbar.svelte         session code, peer count, add-token toggle
      SceneManager.svelte    map upload + scene switching
      InitiativeTracker.svelte
      TokenModal.svelte      new-token name/color form
docs/
  ARCHITECTURE.md            full technical specification
```

## Known Limitations

See [`BACKLOG.md`](BACKLOG.md) for planned work. Notably: no TURN server is
configured (falls back to PeerJS's default cloud broker and public STUN),
so connections behind strict/symmetric NATs may fail; there's no
reconnection-after-drop handling yet.

## License

MIT — see [`LICENSE`](LICENSE).
