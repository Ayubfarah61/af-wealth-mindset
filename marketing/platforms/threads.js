// Threads platform adapter — uses Meta's Threads API.
// Threads requires its own OAuth token (separate from Facebook/IG Graph token).
// Secrets:
//   THREADS_USER_ID
//   THREADS_ACCESS_TOKEN

const API = 'https://graph.threads.net/v1.0';

export async function publish(env, { copy, media, productUrl }) {
  if (!env.THREADS_USER_ID || !env.THREADS_ACCESS_TOKEN) throw new Error('Threads creds missing');

  // Threads cap is 500 chars. Append URL if there's room.
  const raw = (copy.caption || '') + (productUrl ? '\n\n' + productUrl : '');
  const text = raw.length > 500 ? raw.slice(0, 497) + '...' : raw;

  // Step 1: create the media container
  const createParams = new URLSearchParams({
    media_type: media?.imageUrl ? 'IMAGE' : 'TEXT',
    text,
    access_token: env.THREADS_ACCESS_TOKEN,
  });
  if (media?.imageUrl) createParams.set('image_url', media.imageUrl);

  const create = await fetch(`${API}/${env.THREADS_USER_ID}/threads`, {
    method: 'POST',
    body: createParams,
  });
  const createData = await create.json();
  if (!create.ok || !createData.id) throw new Error('Threads create: ' + JSON.stringify(createData));

  // Image containers need a brief wait before publishing
  if (media?.imageUrl) await new Promise(r => setTimeout(r, 3000));

  // Step 2: publish
  const publishParams = new URLSearchParams({
    creation_id: createData.id,
    access_token: env.THREADS_ACCESS_TOKEN,
  });
  const pub = await fetch(`${API}/${env.THREADS_USER_ID}/threads_publish`, {
    method: 'POST',
    body: publishParams,
  });
  const pubData = await pub.json();
  if (!pub.ok || !pubData.id) throw new Error('Threads publish: ' + JSON.stringify(pubData));

  return {
    externalId: pubData.id,
    url: `https://www.threads.net/@${env.THREADS_USERNAME || 'afwealthmindset'}/post/${pubData.id}`,
    caption: text,
  };
}
