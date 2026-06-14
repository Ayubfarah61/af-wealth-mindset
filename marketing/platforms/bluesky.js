// Bluesky platform adapter — free, open API, no review needed.
// Posts up to 300 chars with one image, no platform approval gate.
// Secrets:
//   BLUESKY_HANDLE   — e.g. afwealthmindset.bsky.social
//   BLUESKY_PASSWORD — App password from bsky.app/settings/app-passwords (NOT your real password)

const PDS = 'https://bsky.social/xrpc';

// Get a session token (~2hr, refreshed on every post — cheap)
async function login(env) {
  const res = await fetch(`${PDS}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: env.BLUESKY_HANDLE,
      password: env.BLUESKY_PASSWORD,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.accessJwt) throw new Error('Bluesky login: ' + JSON.stringify(data));
  return data;
}

async function uploadBlob(jwt, did, imageUrl) {
  const img = await fetch(imageUrl);
  if (!img.ok) throw new Error('Bluesky image fetch failed: ' + img.status);
  const bytes = await img.arrayBuffer();
  const mime = img.headers.get('content-type') || 'image/png';
  const up = await fetch(`${PDS}/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jwt, 'Content-Type': mime },
    body: bytes,
  });
  const data = await up.json();
  if (!up.ok || !data.blob) throw new Error('Bluesky blob upload: ' + JSON.stringify(data));
  return data.blob;
}

export async function publish(env, { copy, media, productUrl, type }) {
  if (!env.BLUESKY_HANDLE || !env.BLUESKY_PASSWORD) throw new Error('Bluesky creds missing');

  // Bluesky caps at 300 chars. Use the IG caption shaped to fit.
  const raw = (copy.caption || '') + (productUrl ? '\n' + productUrl : '');
  const text = raw.length > 300 ? raw.slice(0, 297) + '...' : raw;

  const session = await login(env);
  const jwt = session.accessJwt;
  const did = session.did;

  // Build the post record
  const record = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString(),
    langs: ['en'],
  };

  // Attach image if available
  const imageUrl = media?.imageUrl || media?.thumbnailUrl;
  if (imageUrl) {
    try {
      const blob = await uploadBlob(jwt, did, imageUrl);
      record.embed = {
        $type: 'app.bsky.embed.images',
        images: [
          {
            alt: copy.caption || 'AF Wealth Mindset',
            image: blob,
            aspectRatio: { width: 1080, height: 1350 },
          },
        ],
      };
    } catch (e) {
      // Continue text-only if image fails
    }
  }

  // Detect URL in text and embed as link card (for product URL clickability)
  // Simple regex — finds the first http(s) URL in the text.
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch && !record.embed) {
    record.embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: urlMatch[1],
        title: 'AF Wealth Mindset',
        description: 'Real spreadsheets. Forbidden insight.',
      },
    };
  }

  // Bluesky requires byte-offset facets for clickable URLs in text.
  // Compute facets so the URL renders as a link.
  if (urlMatch) {
    const enc = new TextEncoder();
    const before = text.slice(0, urlMatch.index);
    const byteStart = enc.encode(before).length;
    const byteEnd = byteStart + enc.encode(urlMatch[1]).length;
    record.facets = [
      {
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: urlMatch[1] }],
      },
    ];
  }

  const post = await fetch(`${PDS}/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: did,
      collection: 'app.bsky.feed.post',
      record,
    }),
  });
  const data = await post.json();
  if (!post.ok || !data.uri) throw new Error('Bluesky post: ' + JSON.stringify(data));

  // URI format: at://did:plc:xxx/app.bsky.feed.post/yyy — translate to bsky.app URL
  const rkey = data.uri.split('/').pop();
  const handle = env.BLUESKY_HANDLE.replace(/^@/, '');
  return {
    externalId: data.uri,
    url: `https://bsky.app/profile/${handle}/post/${rkey}`,
    caption: text,
  };
}
