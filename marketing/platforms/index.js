// Platform registry — single import surface for the director.
import * as tiktok from './tiktok.js';
import * as instagram from './instagram.js';
import * as facebook from './facebook.js';
import * as youtube from './youtube.js';
import * as pinterest from './pinterest.js';

export const PLATFORMS = { tiktok, instagram, facebook, youtube, pinterest };

// Fan out: given copy for ONE calendar entry, post to every enabled platform in parallel.
// `copy` is the JSON from content-writer.
// `media` is { videoUrl, thumbnailUrl } for product_video, or null for engagement (text/image).
export async function fanOut(env, { copy, media, productUrl, type }) {
  const enabled = (env.ENABLED_PLATFORMS || 'tiktok,instagram,facebook,youtube,pinterest').split(',').map(s => s.trim());
  const results = [];
  await Promise.all(enabled.map(async (name) => {
    const adapter = PLATFORMS[name];
    if (!adapter) return;
    try {
      const r = await adapter.publish(env, { copy: copy[name], media, productUrl, type, allCopy: copy });
      results.push({ platform: name, ok: true, ...r });
    } catch (err) {
      results.push({ platform: name, ok: false, error: String(err.message || err) });
    }
  }));
  return results;
}
