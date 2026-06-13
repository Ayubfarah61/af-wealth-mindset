// TikTok Content Posting API
// Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
// Requires: an approved Content Posting API app + a long-lived user access token.
// Secret: TIKTOK_ACCESS_TOKEN  (refresh handled out of band — see README)
// Until app approval clears, set TIKTOK_DRAFT_ONLY=1 — videos land in user's drafts.

const API = 'https://open.tiktokapis.com/v2';

export async function publish(env, { copy, media, productUrl, type }) {
  if (!env.TIKTOK_ACCESS_TOKEN) throw new Error('TIKTOK_ACCESS_TOKEN missing');
  const caption = [copy.caption, ...(copy.hashtags || [])].filter(Boolean).join(' ').slice(0, 2200);

  if (type !== 'product_video' || !media?.videoUrl) {
    // TikTok requires video. Engagement posts skip TikTok.
    return { skipped: 'tiktok needs a video' };
  }

  const draftOnly = env.TIKTOK_DRAFT_ONLY === '1';
  const init = await fetch(`${API}/post/publish/inbox/video/init/`, {
    method: 'POST',
    headers: authHeaders(env),
    body: JSON.stringify({
      source_info: { source: 'PULL_FROM_URL', video_url: media.videoUrl },
      post_info: draftOnly ? undefined : {
        title: caption,
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false
      }
    })
  });
  const data = await init.json();
  if (!init.ok || data.error?.code !== 'ok') throw new Error('TikTok init: ' + JSON.stringify(data));
  return { externalId: data.data?.publish_id, url: null, caption };
}

function authHeaders(env) {
  return {
    Authorization: 'Bearer ' + env.TIKTOK_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  };
}
