// Content Writer Agent
// Generates platform-tailored captions for one video or one engagement post.
// Returns: { tiktok, instagram, facebook, youtube, pinterest } each shaped per platform.

import { callClaude } from '../lib/claude.js';
import { recentCaptions } from '../lib/db.js';

const PLATFORM_RULES = `
TikTok caption: 100-150 chars max. Hook first 3 words. 3-5 punchy hashtags. No links (bio link only). End with CTA "link in bio".
Instagram Reels caption: 125-220 chars. Strong hook. 5-8 hashtags blended into a 1-line caption + 1 line CTA. "Link in bio."
Facebook caption: 1-2 sentences, plain language. 0-2 hashtags. Direct CTA with the URL.
YouTube Shorts title: 60 chars max, curiosity gap. Description: 1 line hook + URL + 3 hashtags (#Shorts + 2 niche).
Pinterest pin title: 100 chars max, SEO-loaded ("Free monthly budget Excel template..."). Description: 200-400 chars, keyword-rich, plain English. Destination URL is the product page.
`;

export async function writeProductVideoCopy(env, { video, product, cycle, priorCaptions }) {
  const system = `You are AF Wealth Mindset's senior direct-response copywriter.
You sell $7.99 Excel templates to people who hate budgeting apps.
Voice: blunt, helpful, zero hype, sounds human. Never use the word "unlock" or "transform". Use "track", "see", "know", "stop guessing".
Currency: USD. Audience: US/UK/CA/AU adults 25-55.

Platform rules:
${PLATFORM_RULES}`;

  const user = `Product: ${product.name}
Pitch: ${product.pitch}
URL: ${product.url}
Price: $${product.price_usd}
Video hook: ${video.hook || '(none)'}
Scenario on screen: ${video.scenario || '(spreadsheet walkthrough)'}
Persona/character: ${video.persona || 'generic budgeter'}
Cycle: ${cycle} (1 = first run, 2+ = re-post — must be different from prior captions)

Prior captions for THIS video (do not repeat tone or hook):
${priorCaptions.length ? priorCaptions.map(c => '- [' + c.platform + '] ' + c.caption).join('\n') : '(none yet)'}

Return ONLY this JSON object:
{
  "variant": "<short label for this angle, e.g. 'cooking-doctor-cycle-${cycle}'>",
  "tiktok":   { "caption": "...", "hashtags": ["#tag1", "#tag2"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1", "#tag2"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." }
}`;

  return callClaude(env, { system, user, response_format: 'json', max_tokens: 1500 });
}

export async function writeEngagementCopy(env, { idea, products }) {
  const system = `You are AF Wealth Mindset's social media manager.
Write a short engagement post (joke, hot take, screenshot caption, mini-story, trending hook) that subtly steers toward a $7.99 Excel budget/profit/debt template.
Voice: blunt, witty, helpful. Never preachy. Sound like a real person, not a brand.

Platform rules:
${PLATFORM_RULES}`;

  const user = `Today's angle (from Trend Scout): ${idea.body}
Category: ${idea.category}
Product catalog (mention naturally — don't list):
${products.map(p => '- ' + p.name + ' ($' + p.price_usd + '): ' + p.pitch + ' — ' + p.url).join('\n')}

This is a NO-VIDEO post (image or text only). Pinterest needs an image-friendly title.
Pick ONE product to soft-CTA toward. Be subtle.

Return ONLY this JSON object:
{
  "variant": "<short label>",
  "focus_product_id": <product id you steered toward>,
  "tiktok":   { "caption": "...", "hashtags": ["#tag1"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." }
}`;

  return callClaude(env, { system, user, response_format: 'json', max_tokens: 1500 });
}

// Wrapper used by the director
export async function writeCopy(env, calendarEntry) {
  if (calendarEntry.type === 'product_video') {
    const priorCaptions = await recentCaptions(env, calendarEntry.video_id, 8);
    return writeProductVideoCopy(env, {
      video: {
        hook: calendarEntry.hook,
        scenario: calendarEntry.scenario,
        persona: calendarEntry.persona,
        url: calendarEntry.video_url
      },
      product: {
        name: calendarEntry.product_name,
        pitch: calendarEntry.product_pitch,
        url: calendarEntry.product_url,
        price_usd: 7.99
      },
      cycle: calendarEntry.cycle,
      priorCaptions
    });
  }
  // engagement
  const { results: products } = await env.DB.prepare('SELECT * FROM products').all();
  const idea = JSON.parse(calendarEntry.notes || '{}');
  return writeEngagementCopy(env, { idea, products });
}
