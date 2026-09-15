/**
 * Mints short-lived Cloudflare TURN credentials for the VTT frontend.
 *
 * The frontend is a static bundle (see CLAUDE.md's "Zero Backend" rule) and
 * can never hold the Cloudflare TURN API token itself, since anything in the
 * bundle is public. This Worker is the one small, secret-holding exception:
 * it takes no game-state role and does nothing but exchange the secret for a
 * short-lived (TTL-bound) credential pair on each request, per Cloudflare's
 * documented TURN auth flow:
 * https://developers.cloudflare.com/realtime/turn/generate-credentials/
 *
 * Required secrets (set via `wrangler secret put <name>`):
 *   - TURN_KEY_ID       — the Turn Key ID from the Cloudflare dashboard.
 *   - TURN_KEY_API_TOKEN — an API token scoped to Realtime TURN Token Edit.
 *
 * Required var (in wrangler.toml [vars] or dashboard):
 *   - ALLOWED_ORIGIN — the deployed frontend origin, for CORS.
 */

const CREDENTIAL_TTL_SECONDS = 3600; // 1 hour

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCorsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const resp = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ttl: CREDENTIAL_TTL_SECONDS })
        }
      );

      if (!resp.ok) {
        const detail = await resp.text();
        return new Response(JSON.stringify({ error: 'turn_credential_request_failed', detail }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { iceServers } = await resp.json();
      return new Response(JSON.stringify({ iceServers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'turn_credential_request_failed', detail: err.message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

function buildCorsHeaders(origin, allowedOrigin) {
  const allow = allowedOrigin && origin === allowedOrigin ? origin : allowedOrigin || '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
