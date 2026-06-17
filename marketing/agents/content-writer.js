// Content Writer — PURE EDUCATION MODE (LOCKED)
//
// CRITICAL RULE: Engagement posts (text + dearson card image) are AUDIENCE-BUILDING ONLY.
//   - NO links of any kind (no product URL, no "link in bio", no "swipe up", no "see more")
//   - NO product mentions (don't name the product, the bio, the website)
//   - NO CTAs (no "save this", "follow for more", "tag a friend", "comment below")
//   - NO selling language whatsoever
//
// The post is a piece of free wisdom. That's it. The reader learns something. They follow because
// the content was good, not because we asked them to. Trust compounds. Audience grows.
//
// PRODUCT VIDEOS (when uploaded later) are the ONLY thing that sells. Different rules apply there.

import { callClaude } from '../lib/claude.js';
import { recentCaptions } from '../lib/db.js';

const VOICE = `OUR VOICE (LOCKED):
- Wise elder talking to younger self. Calm. Direct. Slightly stern when needed.
- We TEACH. We do not sell. Ever. Not even a little.
- Banned words EVERYWHERE: "unlock", "transform", "secret", "trick", "hack", "10x", "game-changer", "revolutionary", "buy", "shop", "store", "link", "bio", "sale", "discount", "now", "today only".
- Banned product nouns EVERYWHERE: "budget", "budgeting", "cash flow", "debt payoff", "bookkeeping", "spreadsheet", "template", "tool", "app", "planner", "tracker", "product", "purchase".`;

const CAPTION_RULES = `CAPTION RULES (ENGAGEMENT POSTS — STRICT):
- The caption is education + hashtags. Nothing else.
- It expands ONE idea from the on-image letter. Adds depth, not noise.
- ABSOLUTELY NO LINKS. No URLs. No "link in bio". No "see profile". No "DM me". Nothing that points anywhere.
- NO CTA AT ALL. Not even "follow for more" or "save this" or "tag a friend".
- Just teaching + 3-6 hashtags blended naturally.
- The reader follows because the content was good. We do not ask.`;

const PLATFORM_RULES = `
TikTok caption: 80-160 chars. Pure teaching expansion + 3-5 hashtags. No links. No CTAs.
Instagram caption: 120-250 chars. Same — wisdom expansion + 4-6 hashtags. No links. No CTAs.
Facebook caption: 2-4 short teaching sentences. NO link. NO CTA.
YouTube Shorts: title is the on-image hook restated. Description: 1-2 teaching lines + 3-4 hashtags. NO link.
Pinterest: title 80-100 chars SEO-loaded (educational keywords). Description 200-350 chars of pure teaching. NO link in description. Destination URL is set on the pin but we do NOT mention it in the text.
Bluesky: 200-280 chars (300 max). Same rule — teaching only, no links.
Threads: 300-450 chars. Teaching only.`;

export async function writeProductVideoCopy(env, { video, product, cycle, priorCaptions }) {
  // PRODUCT VIDEOS sell. Different rules.
  const system = `You are AF Wealth Mindset's CONTENT WRITER (product-video mode).

This is a PRODUCT VIDEO post — the ONLY type of post where we sell.

${VOICE.replace(/"buy", "shop", "store", "link", "bio", "sale", "discount", "now", "today only",?\s*/, '')}

For product videos ONLY, you may include:
- ONE soft CTA at the end: "Link in bio" / "If you want the tool, it's in our bio" / for FB & YT, the actual URL.
- The product URL on platforms that allow links.
${PLATFORM_RULES.replace(/No links\. No CTAs?\./g, 'Soft CTA + URL where allowed.')}`;

  const user = `Write platform captions for a PRODUCT VIDEO across all platforms.

The video shows: ${video.scenario || '(spreadsheet walkthrough)'}
Character/persona: ${video.persona || 'generic person'}
Raw hook: ${video.hook || '(none)'}

Product (this is the ONE post type where you reference it):
  Name: ${product.name}
  Pitch: ${product.pitch}
  URL: ${product.url}

Cycle ${cycle}. ${cycle > 1 ? 'Use a different angle from prior captions.' : ''}

Prior captions for this video:
${priorCaptions.length ? priorCaptions.map(c => '- [' + c.platform + '] ' + c.caption).join('\n') : '(none)'}

Return ONLY this JSON object:
{
  "variant": "<short label>",
  "tiktok":   { "caption": "...", "hashtags": ["#tag1"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." },
  "bluesky":  { "caption": "..." },
  "threads":  { "caption": "..." }
}`;

  return callClaude(env, { system, user, response_format: 'json', max_tokens: 1500 });
}

export async function writeEngagementCopy(env, { idea, products }) {
  // ENGAGEMENT POSTS = pure education, no selling. 5-pillar format from Trend Scout.
  let post;
  try { post = JSON.parse(idea.body); } catch { post = { pillar: '', hook: '', body: '', closer: '' }; }

  const system = `You are AF Wealth Mindset's CONTENT WRITER (pure education mode).

${VOICE}

${CAPTION_RULES}

${PLATFORM_RULES}

Trend Scout gave you a finished short-form post (hook + body + closer) written in one of 5 pillars:
psychology, principles, story, mistakes, statistics.

Your job: PORT that post to each platform's voice and length. Keep the SAME idea, hook, and tone — just adjust pacing/length to fit. Do NOT invent a new template, do NOT add "Dear ___" framing, do NOT add CTAs.

PLATFORM PORTING RULES:
- TikTok / Instagram / Bluesky: keep the hook as the opening line, condense body to fit char limits, end with the closer if there's room. Add 3-5 fitting hashtags at the end (no #money #tips spam — pick specific tags tied to the pillar).
- Facebook / Threads / LinkedIn: use the full hook + body + closer. These platforms reward longer text — keep paragraph breaks.
- YouTube Shorts: title = hook (≤ 70 chars). Description = body + 3-4 hashtags.
- Pinterest: title = hook rephrased as an SEO-loaded statement (80-100 chars). Description = body (200-350 chars).`;

  const user = `Trend Scout's post (pillar: ${post.pillar}):

HOOK:
${post.hook}

BODY:
${post.body}

CLOSER:
${post.closer || '(none)'}

Port this same idea to every platform. Keep the voice. Keep the hook. Just adjust length.

ABSOLUTELY DO NOT:
- include any URL
- write "link in bio"
- write "save this", "follow for more", "tag a friend", "comment below"
- mention any product, tool, template, spreadsheet, app
- ask the reader to do anything
- use sales language
- start with "Dear "

Return ONLY this JSON object:
{
  "variant": "<short label>",
  "tiktok":   { "caption": "...", "hashtags": ["#tag1"] },
  "instagram":{ "caption": "...", "hashtags": ["#tag1"] },
  "facebook": { "caption": "..." },
  "youtube":  { "title": "...", "description": "..." },
  "pinterest":{ "title": "...", "description": "..." },
  "bluesky":  { "caption": "..." },
  "threads":  { "caption": "..." }
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
