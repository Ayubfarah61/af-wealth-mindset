// Content Writer — DEARSON LETTER MODE
// Writes platform captions to accompany the "Dear ___" letter card.
// Card image = the letter itself. Caption = the platform-side hook + soft CTA.

import { callClaude } from '../lib/claude.js';
import { recentCaptions } from '../lib/db.js';

const VOICE = `OUR VOICE (LOCKED):
- Wise elder talking to younger self. Direct. Warm. Slightly stern.
- Banned words EVERYWHERE: "unlock", "transform", "secret", "trick", "hack", "10x", "game-changer", "revolutionary".
- Banned product nouns IN BODY OF LETTER (not in CTA): "budget", "budgeting", "cash flow", "debt payoff", "bookkeeping", "spreadsheet", "template", "tool", "app", "planner", "tracker".`;

const CTA_RULES = `THE CTA (ONE soft line at end of caption only):
  TikTok / Instagram: "Link in bio if this is you." / "Tool in bio if you want out of this." / "Saved this one? Link in bio."
  Facebook: end with "If this is you: <product_url>"
  YouTube description: 1 line + <product_url> + #Shorts + 2 niche tags
  Pinterest description: teaches first, ends with one soft line. Destination URL set automatically.
  If product_id is null: NO product CTA. Use "Follow for more letters." or similar.`;

const PLATFORM_RULES = `
TikTok caption: 80-140 chars. One extra hook line beyond the card + 3-5 hashtags. CTA if product-tied.
Instagram: 120-220 chars. Hook line + 4-6 hashtags. CTA if product-tied.
Facebook: 2-4 short sentences. URL at very end if product-tied.
YouTube Shorts: title 50-70 chars (can be "Dear ___ — short summary"). Description: 1 line + URL + #Shorts + 2 tags.
Pinterest: title 80-100 chars SEO-loaded. Description 200-350 chars.`;

export async function writeProductVideoCopy(env, { video, product, cycle, priorCaptions }) {
  const system = `You are AF Wealth Mindset's CONTENT WRITER (dearson mode).

${VOICE}
${CTA_RULES}
${PLATFORM_RULES}`;

  const user = `Write platform captions for a PRODUCT VIDEO going across all platforms.

The video shows: ${video.scenario || '(spreadsheet walkthrough)'}
Character/persona in video: ${video.persona || 'generic person'}
Raw hook of the video: ${video.hook || '(none)'}

Product (CTA only — never name nouns in caption body):
  Name: ${product.name}
  Pitch: ${product.pitch}
  URL: ${product.url}

Cycle: ${cycle} — ${cycle > 1 ? 'Open with a DIFFERENT angle than prior captions.' : 'First posting.'}

Prior captions for this video (do not repeat):
${priorCaptions.length ? priorCaptions.map(c => '- [' + c.platform + '] ' + c.caption).join('\n') : '(none yet)'}

Return ONLY this JSON object:
{
  "variant": "<short label>",
  "tiktok":   { "caption": "...", "hashtags": ["#tag1"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." }
}`;

  return callClaude(env, { system, user, response_format: 'json', max_tokens: 1500 });
}

export async function writeEngagementCopy(env, { idea, products }) {
  const focusProduct = idea.product_id ? products.find(p => p.id === idea.product_id) : null;

  let letter;
  try { letter = JSON.parse(idea.body); } catch { letter = { persona: '', lines: [], closing: '' }; }

  const system = `You are AF Wealth Mindset's CONTENT WRITER (dearson mode).

${VOICE}
${CTA_RULES}
${PLATFORM_RULES}

This post will be rendered as a 1080×1350 WHITE tweet-style card image. The image shows the "Dear ___" letter. Your job: write the surrounding CAPTION on each platform — NOT to rewrite the letter.`;

  const user = `The research agent gave us this letter to post as an image (do NOT rewrite):

  Dear ${letter.persona},

  ${(letter.lines || []).join('\n  ')}
  ${letter.closing ? '\n  ' + letter.closing : ''}

${focusProduct ? `Product context (CTA only, never name the product noun):
  ${focusProduct.name} — ${focusProduct.pitch}
  URL: ${focusProduct.url}` : 'NOT product-tied — no product CTA.'}

Each caption opens with a tight teaser of the letter's theme (NOT a copy of the body — your own angle), invites readers to save/read the image, ends with the CTA.

Return ONLY this JSON object:
{
  "variant": "<short label>",
  "focus_product_id": ${idea.product_id || 'null'},
  "tiktok":   { "caption": "...", "hashtags": ["#tag1"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." }
}`;

  return callClaude(env, { system, user, response_format: 'json', max_tokens: 1500 });
}

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
