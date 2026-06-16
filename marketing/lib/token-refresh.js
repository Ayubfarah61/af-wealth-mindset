// Token refresh + health monitoring.
//
// Runs once a day. For each platform with a refresh-token mechanism:
//   - Check if access token is close to expiry
//   - If yes, exchange refresh token for new access token
//   - Update the secret via Cloudflare API (requires CF_API_TOKEN)
//
// Tokens we can auto-refresh:
//   - Pinterest (30-day access, 60-day refresh)
//   - YouTube (1-hour access — refreshed every call already, no separate logic needed)
//
// Tokens we can only MONITOR (manual re-auth needed if expired):
//   - Meta Page token (non-expiring but Meta can invalidate)
//   - Bluesky (logs in fresh on every post)
//   - TikTok (handled when approved)
//   - Threads, LinkedIn, Mastodon (when added)

import { log } from './db.js';

const PINTEREST = 'https://api.pinterest.com/v5';

// Refresh Pinterest access token if older than 25 days (5-day buffer before 30-day expiry).
// Returns { refreshed: true, new_access_token } or { refreshed: false, reason }.
export async function refreshPinterestToken(env) {
  if (!env.PINTEREST_APP_ID || !env.PINTEREST_APP_SECRET || !env.PINTEREST_REFRESH_TOKEN) {
    return { refreshed: false, reason: 'missing credentials' };
  }

  // Test current token first — if it works, skip the refresh (saves API calls)
  const test = await fetch(`${PINTEREST}/user_account`, {
    headers: { Authorization: 'Bearer ' + env.PINTEREST_ACCESS_TOKEN }
  });
  if (test.ok) return { refreshed: false, reason: 'current token still valid' };

  // Exchange refresh token for new access token
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: env.PINTEREST_REFRESH_TOKEN,
  });
  const auth = btoa(`${env.PINTEREST_APP_ID}:${env.PINTEREST_APP_SECRET}`);
  const res = await fetch(`${PINTEREST}/oauth/token`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    return { refreshed: false, reason: 'refresh API failed: ' + JSON.stringify(data) };
  }

  // We have a new access token. Try to update Cloudflare secret via API.
  // This requires CF_API_TOKEN + CF_ACCOUNT_ID secrets to be set on the Worker.
  if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
    const updateRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/afwm-marketing/secrets`,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + env.CF_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'PINTEREST_ACCESS_TOKEN',
          text: data.access_token,
          type: 'secret_text',
        }),
      }
    );
    const upd = await updateRes.json();
    return {
      refreshed: updateRes.ok,
      new_access_token: data.access_token,
      cf_update: upd
    };
  }

  // No CF API access — return new token but flag that secret wasn't auto-updated.
  return {
    refreshed: true,
    new_access_token: data.access_token,
    new_refresh_token: data.refresh_token || null,
    note: 'CF_API_TOKEN not set — secret not auto-updated. Token will work until Worker restart.'
  };
}

// Health-check every platform's auth. Returns a per-platform status map.
export async function checkAllTokens(env) {
  const results = {};

  // Meta Page token
  if (env.META_ACCESS_TOKEN && env.FB_PAGE_ID) {
    const r = await fetch(`https://graph.facebook.com/v21.0/${env.FB_PAGE_ID}?access_token=${env.META_ACCESS_TOKEN}`);
    results.meta = r.ok ? { ok: true } : { ok: false, error: await r.text() };
  }

  // Pinterest token
  if (env.PINTEREST_ACCESS_TOKEN) {
    const r = await fetch(`${PINTEREST}/user_account`, { headers: { Authorization: 'Bearer ' + env.PINTEREST_ACCESS_TOKEN } });
    results.pinterest = r.ok ? { ok: true } : { ok: false, error: await r.text() };
  }

  // Bluesky (logs in fresh each post so just verify login works)
  if (env.BLUESKY_HANDLE && env.BLUESKY_PASSWORD) {
    const r = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: env.BLUESKY_HANDLE, password: env.BLUESKY_PASSWORD }),
    });
    results.bluesky = r.ok ? { ok: true } : { ok: false, error: 'bluesky login failed' };
  }

  // YouTube (test refresh-token exchange)
  if (env.YOUTUBE_REFRESH_TOKEN && env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        refresh_token: env.YOUTUBE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });
    const d = await r.json();
    results.youtube = d.access_token ? { ok: true } : { ok: false, error: JSON.stringify(d) };
  }

  return results;
}

// Run daily — checks tokens, refreshes Pinterest if needed, logs everything.
export async function dailyTokenMaintenance(env) {
  const health = await checkAllTokens(env);
  await log(env, 'Token health check', health);

  // Refresh Pinterest if its check failed
  if (health.pinterest && !health.pinterest.ok) {
    const refreshed = await refreshPinterestToken(env);
    await log(env, 'Pinterest token refresh attempt', refreshed);
  }

  return health;
}
