// YouTube Data API v3 — uploads via resumable URL.
// Docs: https://developers.google.com/youtube/v3/docs/videos/insert
// Secrets (Worker):
//   YOUTUBE_REFRESH_TOKEN  — long-lived
//   YOUTUBE_CLIENT_ID
//   YOUTUBE_CLIENT_SECRET
// We exchange refresh -> access token at runtime.

const UPLOAD = 'https://www.googleapis.com/upload/youtube/v3/videos';
const OAUTH = 'https://oauth2.googleapis.com/token';

async function accessToken(env) {
  const body = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    client_secret: env.YOUTUBE_CLIENT_SECRET,
    refresh_token: env.YOUTUBE_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });
  const res = await fetch(OAUTH, { method: 'POST', body });
  const data = await res.json();
  if (!data.access_token) throw new Error('YT token: ' + JSON.stringify(data));
  return data.access_token;
}

export async function publish(env, { copy, media, productUrl, type }) {
  if (!env.YOUTUBE_REFRESH_TOKEN) throw new Error('YT creds missing');
  if (type !== 'product_video' || !media?.videoUrl) {
    return { skipped: 'YouTube needs a video' };
  }
  const token = await accessToken(env);

  // 1) Pull the video bytes (Workers can stream up to ~100MB free; for >100MB use a queue/cron from R2)
  const videoRes = await fetch(media.videoUrl);
  if (!videoRes.ok) throw new Error('YT pull failed: ' + videoRes.status);
  const videoBlob = await videoRes.blob();

  // 2) Initialize resumable upload
  const metadata = {
    snippet: {
      title: copy.title || copy.caption?.slice(0, 95) || 'AF Wealth Mindset',
      description: (copy.description || '') + (productUrl ? '\n\n' + productUrl : ''),
      tags: ['budget', 'spreadsheet', 'excel', 'personal finance', 'debt', 'cashflow'],
      categoryId: '26' // Howto & Style
    },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }
  };

  const init = await fetch(`${UPLOAD}?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/*'
    },
    body: JSON.stringify(metadata)
  });
  if (!init.ok) throw new Error('YT init: ' + await init.text());
  const sessionUrl = init.headers.get('location');
  if (!sessionUrl) throw new Error('YT no session URL');

  // 3) Send bytes
  const up = await fetch(sessionUrl, { method: 'PUT', body: videoBlob });
  const data = await up.json();
  if (!up.ok || !data.id) throw new Error('YT upload: ' + JSON.stringify(data));
  return { externalId: data.id, url: `https://youtube.com/watch?v=${data.id}`, caption: metadata.snippet.title };
}
