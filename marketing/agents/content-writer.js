// Content Writer Agent — EDUCATOR-FIRST MODE
// Locked to the @dearson_ig "Dear ___" wisdom-list format.
// Every post DELIVERS the lesson. Product mention is soft, end-only, optional.

import { callClaude } from '../lib/claude.js';
import { recentCaptions } from '../lib/db.js';

const VOICE = `OUR VOICE (locked):
- We are EDUCATORS, not sellers. Teach first. Sell never directly.
- Wise-elder talking to younger self. Direct. Warm. Calm. Slightly stern when needed.
- Short sentences. Plain words. Second-person address.
- Never use: "unlock", "transform", "game-changer", "10x", "secret", "trick", "you won't believe", "revolutionary".
- Yes use: "track", "see", "know", "stop", "decide", "watch out for".
- A real human reading this should feel TAUGHT, not pitched.`;

const FORMAT = `THE FORMAT WE COPY (@dearson_ig — millions of views per post):
  Line 1: "Dear ___" — direct-address letter opener
  Lines 2-N: a numbered list OR 2-4 short sentences of advice
  Total body: 30-90 words. Punchy. Each line stands alone.
  No emojis except at MOST one in the very last line.

PRODUCT CTA RULES:
  - The post body NEVER mentions the product.
  - Only AFTER the lesson is fully delivered, the caption may end with ONE soft line like:
      "If you want a sheet that tracks this for you — link in bio."
      "There's a template that does this on autopilot if you want it."
  - On Facebook the URL goes in the caption (not "link in bio").
  - On Pinterest the destination link is the product URL; the description still teaches first.
  - If the post is not tied to a product, no CTA at all — just the lesson + one closing line.`;

const PLATFORM_RULES = `
TikTok: caption 80-140 chars. The post itself (video text) delivers the lesson. Caption is one extra hook line + 3-5 hashtags. End with "link in bio" only if product-tied.
Instagram Reels: caption 120-220 chars. Hook line + 1-2 lines of context + 4-6 hashtags blended. "link in bio" only if product-tied.
Facebook: 2-4 short sentences in the caption. 0-1 hashtags. Direct URL at end if product-tied.
YouTube Shorts: title 50-70 chars curiosity-gap. Description: 1 hook line + URL (if product-tied) + #Shorts + 2 niche hashtags.
Pinterest: title 80-100 chars SEO-loaded ("Dear paycheck-to-paycheck me — 4 rules to escape" type). Description: 200-350 chars, keyword-rich, still leads with the lesson, ends with a soft CTA to the linked product.`;

export async function writeProductVideoCopy(env, { video, product, cycle, priorCaptions }) {
  const system = `You are AF Wealth Mindset's CONTENT WRITER.

${VOICE}

${FORMAT}

Platform rules:
${PLATFORM_RULES}`;

  const user = `You are writing platform captions for a PRODUCT VIDEO that will go out on all platforms.

The video shows: ${video.scenario || '(spreadsheet walkthrough)'}
Character/persona in video: ${video.persona || 'generic budgeter'}
Raw hook of the video: ${video.hook || '(none)'}

This video promotes — but does NOT sell — this product:
  Product: ${product.name}
  Pitch: ${product.pitch}
  URL: ${product.url}
  Price: $${product.price_usd}

Cycle: ${cycle} — ${cycle > 1 ? 'This video has been posted before. Open with a DIFFERENT angle than the prior captions.' : 'First posting.'}

Prior captions for THIS video (do not repeat tone or hook):
${priorCaptions.length ? priorCaptions.map(c => '- [' + c.platform + '] ' + c.caption).join('\n') : '(none yet)'}

Write each caption so it TEACHES first. The lesson should connect to what the video shows. End with the soft CTA only on platforms where it fits.

Return ONLY this JSON object:
{
  "variant": "<short label for this angle, e.g. 'dear-broke-22-cycle-${cycle}'>",
  "tiktok":   { "caption": "...", "hashtags": ["#tag1", "#tag2"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1", "#tag2"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." }
}`;

  return callClaude(env, { system, user, response_format: 'json', max_tokens: 1500 });
}

export async function writeEngagementCopy(env, { idea, products }) {
  const system = `You are AF Wealth Mindset's CONTENT WRITER.

${VOICE}

${FORMAT}

Platform rules:
${PLATFORM_RULES}

THIS is a NO-VIDEO post (text-card or image). The "Dear ___" letter IS the post — the body of the letter must be visible/readable on-screen in the image. Make it punchy enough to screenshot.`;

  const user = `Write platform captions for an engagement post built on this raw idea:

  Category: ${idea.category}
  Idea (already in our voice): ${idea.body}

Product context — if the idea naturally maps to one, soft-CTA toward it at the end of platforms that allow it. If not, NO CTA:
${products.map(p => '- id=' + p.id + ': ' + p.name + ' ($' + p.price_usd + '): ' + p.pitch + ' — ' + p.url).join('\n')}

For platforms that use an image (Instagram, Pinterest, Facebook): the post is the "Dear ___" letter text itself, plus the caption sells the click/save.
For YouTube Shorts: title pulls the hook from the letter, description includes the full letter + soft CTA.
For TikTok: this is text-on-screen content — caption is one extra hook + hashtags.

Return ONLY this JSON object:
{
  "variant": "<short label>",
  "focus_product_id": <product id you steered toward, or null>,
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
  const { results: products } = await env.DB.prepare('SELECT * FROM products').all();
  const idea = JSON.parse(calendarEntry.notes || '{}');
  return writeEngagementCopy(env, { idea, products });
}
