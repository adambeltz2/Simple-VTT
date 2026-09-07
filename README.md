# Minimalist P2P VTT

**Play now:** https://adambeltz2.github.io/Simple-VTT/ — open it in a
browser, no install, no account, no Node/npm required. One person clicks
"Host a Game," everyone else opens the same link and clicks "Join a Game"
with the code shown. (Node/npm are only needed if you want to modify the
source — see [Local Development](#local-development) below.)

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
- **Session resume** — accidentally refresh the tab? Both GM and players get
  a "Resume session" prompt to pick back up where they left off (GM state
  minus scene images, which aren't persisted — see Known Limitations).
- **Fog of war** — GM enables a grid-aligned reveal/hide mask per scene,
  paints it with a brush or bulk reveal/hide, and sees through it while
  players only see what's been revealed (tokens included).
- **Connection diagnostics** — a "Show connection log" panel (bottom of
  every screen) records every WebRTC/ICE state change and connection
  event, with a one-click copy button, so a failed connection can actually
  be diagnosed instead of just reported as "didn't work."

## Tech Stack

- **Svelte 4 + Vite** for a small, fast-loading static bundle.
- **PeerJS** (`RTCDataChannel` wrapper) for WebRTC signaling (via PeerJS's
  free public cloud broker) and the P2P data transport itself.
- **HTML5 Canvas** for board/token rendering — no 3D or heavy rendering
  engines.
- Ships as static HTML/JS/CSS — no backend, suitable for GitHub Pages or any
  static host.

## Local Development

Only needed if you're modifying the code — playing the game requires none
of this (see the live link above). Requires [Node.js](https://nodejs.org/)
(LTS) and npm.

```bash
npm install
npm run dev       # start the local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

Open two browser windows against the dev server to test host/join locally —
one as GM ("Host a Game"), one as a player ("Join a Game") using the code
shown in the GM window.

## Testing

```bash
npx playwright install --with-deps chromium   # one-time, downloads a browser
npm test
```

The suite (`tests/`) drives real headless-Chromium instances against a real
WebRTC connection — no mocking — covering the full host/join/scene/token/
initiative flow, session resume, and fog of war. `playwright.config.js`
auto-starts the dev server, so `npm test` alone is enough day to day.

## Deploying to GitHub Pages

Deployment is automated and test-gated: on every push to `main`,
`.github/workflows/deploy.yml` runs the Playwright suite first — a failure
stops the pipeline before anything builds or deploys — then builds with
`npm run build` and publishes `dist/` to GitHub Pages via
`actions/deploy-pages` (also runnable manually via `workflow_dispatch`). The
repo's Pages source is set to "GitHub Actions" — no `gh-pages` branch
involved.

`vite.config.js` sets `base: './'` so the built assets resolve correctly at
the Pages project subpath (`https://adambeltz2.github.io/Simple-VTT/`), and
injects the current `package.json` version as a build-time constant (shown
in the footer).

## Project Structure

```
src/
  main.js                    entry point
  App.svelte                 role-based router (join / GM / player)
  lib/
    state.js                 core game state store + connection/role stores
    actions.js                GM-only mutations (mutate + broadcast)
    persistence.js           localStorage session-resume read/write
    diagnostics.js           connection-log store (WebRTC/ICE event history)
    network/
      peer.js                PeerJS session hosting/joining, message handling
      protocol.js            message types, ICE servers, tuning constants
      imageTransfer.js       WEBP compression, chunking, reassembly
    components/
      JoinScreen.svelte      host/join landing screen + resume prompt
      GMView.svelte          GM layout (board + toolbar + side panels)
      PlayerView.svelte      read-only player layout
      BoardCanvas.svelte     canvas rendering, token drag, fog painting
      Toolbar.svelte         session code, peer count, add-token toggle
      SceneManager.svelte    map upload + scene switching
      FogControls.svelte     fog enable/disable, brushes, bulk reveal/hide
      InitiativeTracker.svelte
      TokenModal.svelte      new-token name/color form
      DiagnosticsPanel.svelte  connection-log viewer + copy button
      Footer.svelte          GitHub / Buy Me a Coffee links + version
docs/
  ARCHITECTURE.md            full technical specification
tests/
  core-flow.spec.js          host/join/scene/token/initiative, end-to-end
  session-resume.spec.js     footer content, resume/forget flows
  fog-of-war.spec.js         enable/disable, brushes, bulk actions, GM-vs-player
  fixtures/test-map.png      small fixture image used by scene-upload tests
```

## Browser Support

Needs a modern browser with WebRTC data channels — current Chrome, Firefox,
Safari, and Edge all work. A few things worth knowing:

- **Restrictive networks.** Corporate/school firewalls and some mobile
  carriers block WebRTC (or all non-HTTP UDP/TCP) at the network policy
  level. No client-side fix exists for this — TURN doesn't help if the
  relay itself is blocked too. Use the connection-log panel (bottom of the
  screen) to check whether any relay candidate was even reachable.
- **In-app browsers** (the WebView inside Instagram, TikTok, etc.) can have
  buggy or restricted WebRTC support. Open the link in a real browser if a
  connection won't establish there.
- **Private/Incognito windows** may disable or heavily throttle
  `localStorage`; session resume will simply have nothing to offer (this is
  handled gracefully, not a crash).
- **`crypto.subtle`** (used to hash scene images) requires a secure context
  — fine on GitHub Pages (HTTPS) and `localhost`, but would silently break
  on a plain HTTP self-host.
- **One role per browser at a time.** Two tabs in the *same* browser both
  trying to host (or both trying to join as the same player) will conflict,
  since each needs its own PeerJS peer ID — use a second browser or a
  private window instead.

## Known Limitations

See [`BACKLOG.md`](BACKLOG.md) for planned work. Notably: WebRTC connectivity
falls back to a free public TURN relay (Open Relay Project) when a direct
P2P path can't be established (e.g. very different networks like phone data
vs. wifi), but a very restrictive network blocking both the direct path and
the relay can still fail to connect (see Browser Support above); session
resume (above) covers a page refresh, but there's no reconnection handling
for a connection that drops *during* an active session.

## License

MIT — see [`LICENSE`](LICENSE).
