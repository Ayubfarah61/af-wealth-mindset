// Facebook Page Graph API
// Docs: https://developers.facebook.com/docs/pages-api/posts
// Secrets:
//   FB_PAGE_ID
//   META_ACCESS_TOKEN  (same Page access token used for IG)

const GRAPH = 'https://graph.facebook.com/v21.0';

export async function publish(env, { copy, media, productUrl, type }) {
  if (!env.FB_PAGE_ID || !env.META_ACCESS_TOKEN) throw new Error('FB creds missing');
  // Engagement posts are pure education — no product URL appended.
  // Only product_video posts include the URL.
  const isProductVideo = type === 'product_video';
  const message = isProductVideo && productUrl
    ? copy.caption + '\n\n' + productUrl
    : copy.caption;

  let endpoint, params;
  if (isProductVideo && media?.videoUrl) {
    endpoint = `${GRAPH}/${env.FB_PAGE_ID}/videos`;
    params = { file_url: media.videoUrl, description: message };
  } else if (media?.imageUrl) {
    endpoint = `${GRAPH}/${env.FB_PAGE_ID}/photos`;
    params = { url: media.imageUrl, caption: message };
  } else {
    endpoint = `${GRAPH}/${env.FB_PAGE_ID}/feed`;
    params = { message };
  }

  const body = new URLSearchParams({ ...params, access_token: env.META_ACCESS_TOKEN });
  const res = await fetch(endpoint, { method: 'POST', body });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error('FB: ' + JSON.stringify(data));
  return { externalId: data.id, url: data.permalink_url || null, caption: message };
}
