// Pinterest API v5
// Docs: https://developers.pinterest.com/docs/api/v5/pins-create
// Secrets:
//   PINTEREST_ACCESS_TOKEN
//   PINTEREST_BOARD_ID

const API = 'https://api.pinterest.com/v5';

export async function publish(env, { copy, media, productUrl }) {
  if (!env.PINTEREST_ACCESS_TOKEN || !env.PINTEREST_BOARD_ID) throw new Error('Pinterest creds missing');

  // Pinterest pins need an image. For product_video posts, use the thumbnail. For engagement, use media.imageUrl.
  const image = media?.imageUrl || media?.thumbnailUrl;
  if (!image) return { skipped: 'Pinterest requires an image (use thumbnail_url on the video row)' };

  const body = {
    board_id: env.PINTEREST_BOARD_ID,
    title: (copy.title || copy.caption || 'AF Wealth Mindset').slice(0, 100),
    description: (copy.description || copy.caption || '').slice(0, 800),
    // Pinterest's API requires a destination URL on every pin (technical requirement).
    // For engagement posts we point to the homepage (organic discovery), NOT a product page.
    // Only product_video pins point to the actual product URL.
    link: productUrl || 'https://afwealthmindset.com/',
    media_source: { source_type: 'image_url', url: image }
  };

  const res = await fetch(`${API}/pins`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.PINTEREST_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Pinterest: ' + JSON.stringify(data));
  return { externalId: data.id, url: `https://pinterest.com/pin/${data.id}/`, caption: body.title };
}
