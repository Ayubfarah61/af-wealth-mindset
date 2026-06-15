// Real metrics puller — follower counts + recent post engagement per platform.
// Cached in D1 `platform_metrics` table to avoid hammering APIs on every dashboard load.

const FB_GRAPH = 'https://graph.facebook.com/v21.0';
const PINTEREST = 'https://api.pinterest.com/v5';
const YOUTUBE = 'https://www.googleapis.com/youtube/v3';

export async function fetchFacebookMetrics(env) {
  if (!env.FB_PAGE_ID || !env.META_ACCESS_TOKEN) return null;
  const r = await fetch(`${FB_GRAPH}/${env.FB_PAGE_ID}?fields=followers_count,fan_count&access_token=${env.META_ACCESS_TOKEN}`);
  const data = await r.json();
  if (data.error) return { error: data.error.message };
  return { followers: data.followers_count || data.fan_count || 0 };
}

export async function fetchInstagramMetrics(env) {
  if (!env.IG_USER_ID || !env.META_ACCESS_TOKEN) return null;
  const r = await fetch(`${FB_GRAPH}/${env.IG_USER_ID}?fields=followers_count,media_count&access_token=${env.META_ACCESS_TOKEN}`);
  const data = await r.json();
  if (data.error) return { error: data.error.message };
  return { followers: data.followers_count || 0, total_posts: data.media_count || 0 };
}

export async function fetchInstagramPostInsights(env, mediaId) {
  if (!env.META_ACCESS_TOKEN || !mediaId) return null;
  const fields = 'like_count,comments_count,timestamp,permalink';
  const r = await fetch(`${FB_GRAPH}/${mediaId}?fields=${fields}&access_token=${env.META_ACCESS_TOKEN}`);
  const data = await r.json();
  if (data.error) return null;
  return { likes: data.like_count || 0, comments: data.comments_count || 0, url: data.permalink };
}

export async function fetchPinterestMetrics(env) {
  if (!env.PINTEREST_ACCESS_TOKEN) return null;
  const r = await fetch(`${PINTEREST}/user_account`, { headers: { Authorization: 'Bearer ' + env.PINTEREST_ACCESS_TOKEN } });
  const data = await r.json();
  if (data.code) return { error: data.message };
  return { followers: data.follower_count || 0, monthly_views: data.monthly_views || 0 };
}

export async function fetchBlueskyMetrics(env) {
  if (!env.BLUESKY_HANDLE) return null;
  const r = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${env.BLUESKY_HANDLE}`);
  const data = await r.json();
  if (data.error) return { error: data.error };
  return { followers: data.followersCount || 0, total_posts: data.postsCount || 0 };
}

export async function fetchYoutubeMetrics(env) {
  if (!env.YOUTUBE_REFRESH_TOKEN || !env.YOUTUBE_CLIENT_ID) return null;
  // Need to exchange refresh for access token first
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      refresh_token: env.YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return { error: 'token refresh failed' };

  const r = await fetch(`${YOUTUBE}/channels?part=statistics&mine=true`, {
    headers: { Authorization: 'Bearer ' + tokenData.access_token },
  });
  const data = await r.json();
  const stats = data.items?.[0]?.statistics;
  if (!stats) return null;
  return {
    followers: Number(stats.subscriberCount) || 0,
    total_posts: Number(stats.videoCount) || 0,
    total_views: Number(stats.viewCount) || 0,
  };
}

// Aggregate all platforms. Returns { facebook: {...}, instagram: {...}, ... }
export async function fetchAllMetrics(env) {
  const [fb, ig, pin, bsky, yt] = await Promise.all([
    fetchFacebookMetrics(env).catch(e => ({ error: String(e) })),
    fetchInstagramMetrics(env).catch(e => ({ error: String(e) })),
    fetchPinterestMetrics(env).catch(e => ({ error: String(e) })),
    fetchBlueskyMetrics(env).catch(e => ({ error: String(e) })),
    fetchYoutubeMetrics(env).catch(e => ({ error: String(e) })),
  ]);
  return { facebook: fb, instagram: ig, pinterest: pin, bluesky: bsky, youtube: yt };
}

// Cache metrics in D1 so we don't refetch on every dashboard hit.
// Refresh every 30 minutes.
const METRICS_CACHE_TTL_MIN = 30;

export async function getCachedMetrics(env) {
  const row = await env.DB.prepare(
    `SELECT data, captured_at FROM metrics_cache WHERE id = 1`
  ).first();

  const now = Date.now();
  const cached = row?.data ? JSON.parse(row.data) : null;
  const ageMin = row?.captured_at ? (now - new Date(row.captured_at).getTime()) / 60000 : Infinity;

  if (cached && ageMin < METRICS_CACHE_TTL_MIN) return { ...cached, _cached_min_ago: Math.round(ageMin) };

  const fresh = await fetchAllMetrics(env);
  await env.DB.prepare(
    `INSERT INTO metrics_cache (id, data, captured_at) VALUES (1, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, captured_at = excluded.captured_at`
  ).bind(JSON.stringify(fresh)).run();
  return { ...fresh, _cached_min_ago: 0 };
}
