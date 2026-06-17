// Platform registry — single import surface for the director.
import * as tiktok from './tiktok.js';
import * as instagram from './instagram.js';
import * as facebook from './facebook.js';
import * as youtube from './youtube.js';
import * as pinterest from './pinterest.js';
import * as threads from './threads.js';
import * as bluesky from './bluesky.js';
import * as mastodon from './mastodon.js';
import * as linkedin from './linkedin.js';
import * as telegram from './telegram.js';

export const PLATFORMS = { tiktok, instagram, facebook, youtube, pinterest, threads, bluesky, mastodon, linkedin, telegram };

// Fan out: given copy for ONE calendar entry, post to every enabled platform in parallel.
// Each platform gets 2 attempts (initial + 1 retry after 4 seconds). Errors logged with detail.
export async function fanOut(env, { copy, media, productUrl, type }) {
  const enabled = (env.ENABLED_PLATFORMS || 'tiktok,instagram,facebook,youtube,pinterest').split(',').map(s => s.trim());
  const results = [];
  await Promise.all(enabled.map(async (name) => {
    const adapter = PLATFORMS[name];
    if (!adapter) return;
    let lastErr = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const r = await adapter.publish(env, { copy: copy[name], media, productUrl, type, allCopy: copy });
        results.push({ platform: name, ok: true, attempts: attempt, ...r });
        return;
      } catch (err) {
        lastErr = String(err.message || err);
        // Skip retry for known permanent errors (auth, missing creds, scope, no-video)
        const permanent = /missing|invalid|unauthor|forbidden|scope|trial access|needs a video|needs an image|needs a image/i.test(lastErr);
        if (permanent) break;
        if (attempt === 1) await new Promise(r => setTimeout(r, 4000));
      }
    }
    results.push({ platform: name, ok: false, attempts: 2, error: lastErr });
  }));
  return results;
}
