# Cloudflare TURN credential worker

Mints short-lived TURN credentials from [Cloudflare's TURN service](https://developers.cloudflare.com/realtime/turn/)
for the Simple VTT frontend. This is the one non-static piece of the project
(see `CLAUDE.md`'s "Zero Backend" rule) and exists only because minting a
credential requires an API secret that can never live in the static bundle.
It holds no game state and does nothing else.

## One-time setup

1. In the Cloudflare dashboard, create a **TURN app** (Realtime > TURN).
   Note the **Turn Key ID**.
2. Create an API token scoped to that TURN app's **Edit** permission. Note
   the token value — this is shown once.
3. Install deps and log in to Wrangler:
   ```sh
   cd cloudflare-turn-worker
   npm install
   npx wrangler login
   ```
4. Set the secrets (never commit these):
   ```sh
   npx wrangler secret put TURN_KEY_ID
   npx wrangler secret put TURN_API_TOKEN
   ```
5. Edit `wrangler.toml`'s `ALLOWED_ORIGIN` to the deployed frontend's origin
   (e.g. `https://<user>.github.io`), then deploy:
   ```sh
   npm run deploy
   ```
   Wrangler prints the Worker's URL (`https://simple-vtt-turn.<subdomain>.workers.dev`).
6. Point the frontend at it: set `VITE_TURN_WORKER_URL` to that URL, either
   in a local `.env` (see `.env.example` at the repo root) or as a repository
   variable (`vars.VITE_TURN_WORKER_URL`) so `.github/workflows/deploy.yml`
   picks it up at build time.

If `VITE_TURN_WORKER_URL` is unset, or this Worker is unreachable, the
frontend falls back to the free Open Relay Project TURN servers — nothing
breaks, connectivity in NAT-hostile networks is just less reliable.

## Local dev

```sh
npm run dev
```

Runs the worker locally via `wrangler dev`; point `VITE_TURN_WORKER_URL` in
the app's `.env` at the printed local URL, and set `ALLOWED_ORIGIN` in
`wrangler.toml` to `http://localhost:5173` (or your `npm run dev` port).
