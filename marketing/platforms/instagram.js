// Instagram Graph API (business / creator accounts only, via a connected Facebook Page).
// Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
// Secrets:
//   IG_USER_ID            (the Instagram business account id)
//   META_ACCESS_TOKEN     (long-lived Page access token — works for FB + IG)

const GRAPH = 'https://graph.facebook.com/v21.0';

export async function publish(env, { copy, media, productUrl, type }) {
  if (!env.IG_USER_ID || !env.META_ACCESS_TOKEN) throw new Error('IG creds missing');
  const caption = [copy.caption, ...(copy.hashtags || [])].filter(Boolean).join(' ').slice(0, 2200);

  let createParams;
  if (type === 'product_video' && media?.videoUrl) {
    createParams = { media_type: 'REELS', video_url: media.videoUrl, caption };
  } else if (media?.imageUrl) {
    createParams = { image_url: media.imageUrl, caption };
  } else {
    // No image generated yet for engagement posts — IG requires media. Skip cleanly.
    return { skipped: 'IG requires an image or video' };
  }

  const create = await postForm(`${GRAPH}/${env.IG_USER_ID}/media`, env, createParams);
  if (!create.id) throw new Error('IG create: ' + JSON.stringify(create));

  // For Reels we should poll status; for simplicity wait 8s then publish.
  if (createParams.media_type === 'REELS') {
    await new Promise(r => setTimeout(r, 8000));
  }

  const pub = await postForm(`${GRAPH}/${env.IG_USER_ID}/media_publish`, env, { creation_id: create.id });
  if (!pub.id) throw new Error('IG publish: ' + JSON.stringify(pub));
  return { externalId: pub.id, url: `https://instagram.com/p/${pub.id}`, caption };
}

async function postForm(url, env, params) {
  const body = new URLSearchParams({ ...params, access_token: env.META_ACCESS_TOKEN });
  const res = await fetch(url, { method: 'POST', body });
  return res.json();
}
