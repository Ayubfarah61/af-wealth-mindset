// Content Writer Agent — PSYCHOLOGY-FIRST, NO SELLING IN BODY
//
// Rules:
//  - The post body / video text / image text is the "Dear ___" psychological letter.
//    It NEVER mentions the product noun and NEVER contains a CTA.
//  - The CTA lives ONLY in the caption/description, as a single soft closing line.
//  - "link in bio" goes only on platforms where bio links are how it works (TikTok, IG).
//  - Facebook/YouTube descriptions include the actual product URL.
//  - Pinterest's description still teaches, and the destination link is the product URL.

import { callClaude } from '../lib/claude.js';
import { recentCaptions } from '../lib/db.js';

const VOICE = `OUR VOICE (locked):
- We are EDUCATORS, never sellers. The post body is the lesson. Nothing else.
- Wise-elder talking to younger self. Direct. Warm. Calm.
- Short sentences. Plain words. Second person.
- Banned words EVERYWHERE (body and captions): "unlock", "transform", "game-changer", "10x", "secret", "trick", "you won't believe", "revolutionary", "hack".
- Banned product nouns IN THE BODY (only): "budget", "budgeting", "cash flow", "debt payoff", "bookkeeping", "profit tracker", "spreadsheet", "template", "tool", "app", "planner", "tracker".
  These may appear in captions/descriptions, but NEVER inside the "Dear ___" letter body.`;

const FORMAT = `THE BODY FORMAT — copy @dearson_ig:
  Line 1: "Dear ___" — names a feeling/cycle/moment, never a task
  Body: numbered list (3-7 items, each ≤ 14 words) OR 2-4 short sentences
  Total body: 30-90 words. Punchy. Each line stands alone.
  No emojis in the body.

THE CTA — single soft line in the CAPTION, not the body:
  - TikTok, Instagram: "Link in bio if you want clarity on this."  or  "There's a tool in our bio that does this for you if you want it."
  - Facebook: end the post with: "If you want the full picture: <product_url>"
  - YouTube description: 1 line summary of the lesson + "<product_url>" on its own line + 3 hashtags.
  - Pinterest description: leads with the lesson, ends with one soft line. Destination link is the product URL automatically.
  - If product_id is null (general brand), NO product CTA — only "Follow for more letters like this." or similar.`;

const PLATFORM_RULES = `
TikTok caption: 80-140 chars. One extra hook line + 3-5 hashtags. End with CTA only if product-tied.
Instagram Reels caption: 120-220 chars. Hook line + 4-6 hashtags blended. CTA only if product-tied.
Facebook: 2-4 short sentences. URL at the very end if product-tied.
YouTube Shorts: title 50-70 chars curiosity gap (can be the "Dear ___" header). Description: 1 line + URL + #Shorts + 2 hashtags.
Pinterest: title 80-100 chars SEO-loaded. Description: 200-350 chars, still teaches, one soft closing line.`;

export async function writeProductVideoCopy(env, { video, product, cycle, priorCaptions }) {
  const system = `You are AF Wealth Mindset's CONTENT WRITER.

${VOICE}

${FORMAT}

Platform rules:
${PLATFORM_RULES}`;

  const user = `Write platform captions for a PRODUCT VIDEO going out across all platforms.

The video shows: ${video.scenario || '(spreadsheet walkthrough)'}
Character/persona in video: ${video.persona || 'generic person'}
Raw hook of the video: ${video.hook || '(none)'}

This video belongs to this product (mention only in CAPTION CTA, never inside the post body if you write any):
  Product: ${product.name}
  Pitch: ${product.pitch}
  URL: ${product.url}

Cycle: ${cycle} — ${cycle > 1 ? 'Open with a DIFFERENT psychological angle than prior captions below.' : 'First posting.'}

Prior captions for this video (do not repeat):
${priorCaptions.length ? priorCaptions.map(c => '- [' + c.platform + '] ' + c.caption).join('\n') : '(none yet)'}

For platforms where the caption is shown over a feeling-first hook, lead with the FEELING (e.g. "The Sunday night dread before opening your bank app —"), not the topic.

Return ONLY this JSON object:
{
  "variant": "<short label for this angle>",
  "tiktok":   { "caption": "...", "hashtags": ["#tag1", "#tag2"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1", "#tag2"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." }
}`;

  return callClaude(env, { system, user, response_format: 'json', max_tokens: 1500 });
}

export async function writeEngagementCopy(env, { idea, products }) {
  const focusProduct = idea.product_id ? products.find(p => p.id === idea.product_id) : null;

  const system = `You are AF Wealth Mindset's CONTENT WRITER.

${VOICE}

${FORMAT}

Platform rules:
${PLATFORM_RULES}

This is an IMAGE/TEXT-CARD post. The "Dear ___" letter from the research agent is the image content (rendered on screen). Your job is to write CAPTIONS for each platform — not change the body.`;

  const user = `The research agent gave us this letter to post (do NOT rewrite or summarize the body; treat it as the on-image content):

  Category: ${idea.category}
  Body (this goes ON the image, exactly as is):
  ${idea.body}

${focusProduct ? `This letter is tied to product:
  ${focusProduct.name} — ${focusProduct.pitch}
  URL: ${focusProduct.url}

Soft-CTA at end of caption only. Never mention the product noun. Use phrasings like:
  - "Link in bio if you want clarity on this."
  - "There's a tool in our bio if you want this on autopilot."
  - "Get the full picture — link in bio."
` : `This letter is NOT tied to any product. Do NOT add a product CTA. End with "Follow for more letters like this." or similar.`}

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
