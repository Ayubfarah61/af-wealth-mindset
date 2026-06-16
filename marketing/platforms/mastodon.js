// Mastodon adapter — works on any instance.
// Free, federated, no app review.
// Secrets:
//   MASTODON_INSTANCE      e.g. "mastodon.social" or "mas.to" (without https://)
//   MASTODON_ACCESS_TOKEN  generate at: https://YOUR_INSTANCE/settings/applications/new

export async function publish(env, { copy, media, productUrl, type, allCopy }) {
  if (!env.MASTODON_INSTANCE || !env.MASTODON_ACCESS_TOKEN) throw new Error('Mastodon creds missing');

  // Fall back to IG/TikTok caption if no mastodon-specific copy
  const fallback = (allCopy && (allCopy.instagram || allCopy.tiktok || allCopy.facebook)) || {};
  copy = (copy && copy.caption) ? copy : fallback;

  // Mastodon limit varies by instance (default 500). Cap at 480 to be safe.
  const raw = copy.caption || '';
  const text = raw.length > 480 ? raw.slice(0, 477) + '...' : raw;

  const headers = {
    Authorization: 'Bearer ' + env.MASTODON_ACCESS_TOKEN,
  };

  // Upload media if present
  let mediaIds = [];
  const imageUrl = media?.imageUrl || media?.thumbnailUrl;
  if (imageUrl) {
    try {
      const img = await fetch(imageUrl);
      const blob = await img.blob();
      const form = new FormData();
      form.append('file', blob, 'card.png');
      form.append('description', (copy.caption || 'AF Wealth Mindset').slice(0, 1500));
      const up = await fetch(`https://${env.MASTODON_INSTANCE}/api/v2/media`, {
        method: 'POST',
        headers,
        body: form,
      });
      const m = await up.json();
      if (m.id) mediaIds.push(m.id);
    } catch (_) {}
  }

  // Post the status
  const body = new URLSearchParams({
    status: text,
    visibility: 'public',
  });
  mediaIds.forEach(id => body.append('media_ids[]', id));

  const res = await fetch(`https://${env.MASTODON_INSTANCE}/api/v1/statuses`, {
    method: 'POST',
    headers,
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error('Mastodon: ' + JSON.stringify(data));

  return {
    externalId: data.id,
    url: data.url,
    caption: text,
  };
}
