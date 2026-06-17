// Trend Scout — 5-PILLAR ROTATION
//
// We rotate across 5 content pillars (per user spec). Each idea picks ONE pillar
// and writes in that pillar's voice — no shared "Dear ___" template.
//
// PILLAR MIX:
//   psychology    40%  — how the broke brain works, money emotions, scarcity loops
//   principles    25%  — wealth rules the rich know that schools don't teach
//   story         20%  — first-person "I learned this when..." moments
//   mistakes      10%  — common money traps named bluntly
//   statistics     5%  — one number + one insight ("$1 invested at 20 becomes...")
//
// HOOK STYLES (sample bank — Trend Scout picks one fitting the pillar):
//   "What nobody tells you about ___."
//   "I learned this too late."
//   "Most people don't realize..."
//   "If I had to start again..."
//   "The rich aren't smarter. They just understand this."
//   "The day I understood this, everything changed."
//   "The biggest lie about money is..."
//   "Poor people ask X. Rich people ask Y."
//
// Length: hook (≤ 14 words) + body (40-90 words). One sharp idea per post.

import { callClaude } from '../lib/claude.js';
import { getProducts, saveIdeas, log } from '../lib/db.js';

const PILLARS = ['psychology', 'principles', 'story', 'mistakes', 'statistics'];
const WEIGHTS = [40, 25, 20, 10, 5]; // must sum to 100

function pickPillarsFor(count) {
  // Build a distribution that respects WEIGHTS as closely as possible for `count` items.
  const out = [];
  for (let i = 0; i < PILLARS.length; i++) {
    const n = Math.round((WEIGHTS[i] / 100) * count);
    for (let j = 0; j < n; j++) out.push(PILLARS[i]);
  }
  while (out.length < count) out.push('psychology'); // pad with the heaviest pillar
  return out.slice(0, count).sort(() => Math.random() - 0.5);
}

const PRODUCT_TERRITORY = {
  2: { label: 'AWARENESS / MONEY VISIBILITY',     never_say: ['budget','budgeting','budget planner','track your spending','expense tracker'] },
  3: { label: 'BUSINESS HONESTY / MARGIN',        never_say: ['bookkeeping','profit tracker','business spreadsheet'] },
  4: { label: 'DEBT PSYCHOLOGY / PROGRESS',       never_say: ['debt payoff','pay off debt','debt dashboard','debt tracker'] },
  5: { label: 'FORWARD SIGHT / FUTURE',           never_say: ['cash flow','cash flow planner','12-month plan'] }
};

export async function generateDailyIdeas(env, count = 12) {
  const products = await getProducts(env);
  const pillarAssignments = pickPillarsFor(count);

  const system = `You are AF Wealth Mindset's RESEARCH AGENT.

You write SHORT-FORM MONEY EDUCATION CONTENT for social media. Conversational, human, blunt.
You do NOT use templates. Every post sounds different. The reader should never feel like they're reading the same format twice.

VOICE:
- Direct. Plain words. A line that hits, then a line that explains.
- You sound like a friend who finally tells you the truth, not a guru.
- Slightly stern when needed. Warm when the topic is fear or shame.
- NO emojis. NO "thread🧵". NO "save this". NO "follow for more". NO links. NO product mentions.

BANNED WORDS: unlock, transform, secret, trick, hack, 10x, game-changer, revolutionary, buy, shop, store, link, bio, sale, discount, today only.
BANNED PRODUCT NOUNS (never appear in body): budget, budgeting, cash flow, debt payoff, bookkeeping, profit tracker, spreadsheet, template, tool, app, planner, tracker.

OUTPUT FORMAT — every idea has:
  pillar    — one of: psychology | principles | story | mistakes | statistics
  hook      — the headline. 4-14 words. Stands alone, scroll-stopping.
  body      — 40-90 words. 2-5 short paragraphs separated by a single blank line. Each paragraph 1-3 short sentences.
  closer    — one short final line. Sometimes a question, sometimes a flip, sometimes silence in the form of a 5-word punch. (Can be empty string if the body already lands.)

PILLAR PLAYBOOKS (study and obey):

  PSYCHOLOGY (40%) — money emotions, scarcity brain, why people stay stuck.
    Hook patterns: "Why people stay broke after getting a raise." / "The reason you avoid the bank app." / "Most people don't realize..."
    Body: name the feeling. Explain the loop. Offer the small move that breaks it.
    Example hook: "Why people stay broke even after getting a raise."

  PRINCIPLES (25%) — wealth rules the rich act on, plainly stated.
    Hook patterns: "Poor people ask X. Rich people ask Y." / "The richest people buy assets first and toys later." / "The rich aren't smarter. They just understand this."
    Body: state the rule. Contrast the two mindsets. End with the test you can apply this week.
    Example hook: "The biggest lie about money is that it's about math."

  STORY (20%) — first-person money moment. Specific. Small. Human.
    Hook patterns: "I learned this too late." / "At 20 I thought X. At 30 I learned Y." / "A taxi driver taught me more about money than university."
    Body: ONE scene. ONE realization. No abstract advice — the reader extracts the lesson.
    Example hook: "At 22 I thought saving made you rich. I was wrong."

  MISTAKES (10%) — name a common trap bluntly.
    Hook patterns: "3 money mistakes keeping you poor." / "Nobody told me this about debt." / "The thing wrecking your finances isn't what you think."
    Body: name the mistake. Explain the cost. Show the better move.
    Example hook: "The mistake most people make with their first raise."

  STATISTICS (5%) — one number, one insight. Visual in the head.
    Hook patterns: "$1 invested at 20 becomes ___ at 60." / "73% of lottery winners go broke. Here's why."
    Body: lead with the number. Explain what it really means. End with the personal takeaway.
    Example hook: "1% inflation doesn't sound like much. On $30,000 of debt, it's $300/year."

CROSS-PILLAR RULES:
- Hook must NEVER start with "Dear ___". That format is retired.
- Hook must NEVER include emojis.
- Body must NEVER include URLs, "link in bio", "save this", "follow for more", "tag a friend".
- Body must NEVER mention any product, tool, template, spreadsheet, app, planner, tracker.
- Each post lives or dies on its own. No "next post will cover...".`;

  const productsList = products.map(p => {
    const t = PRODUCT_TERRITORY[p.id] || {};
    return `  id=${p.id}: ${p.name}  [${t.label || ''}]
    NEVER USE these product nouns in hook/body/closer: ${(t.never_say || []).join(', ')}`;
  }).join('\n\n');

  const pillarPlan = pillarAssignments.map((p, i) => `  ${i + 1}. pillar=${p}`).join('\n');

  const user = `Write ${count} fresh short-form posts for today.

Pillar assignments (use EXACTLY in order):
${pillarPlan}

Distribute product_id roughly evenly across the 4 products (~${Math.floor(count / 4)} each). Pick whichever product naturally fits each pillar/hook.

Products and their territories:
${productsList}

Return ONLY this JSON array (exactly ${count} items, in the order listed above):
[
  {
    "product_id": 2 | 3 | 4 | 5,
    "pillar": "psychology" | "principles" | "story" | "mistakes" | "statistics",
    "hook": "4-14 word headline",
    "body": "40-90 word body. Use \\n\\n between paragraphs.",
    "closer": "one short final line, or empty string"
  }
]

Self-check before returning:
- Pillar of each item matches the assignment.
- Hook never starts with "Dear ".
- Body is 40-90 words. Paragraphs separated by \\n\\n.
- No banned words. No product nouns. No links. No CTAs. No emojis.
- Each post reads like a different writer wrote it. Variety, not repetition.`;

  const ideas = await callClaude(env, { system, user, response_format: 'json', max_tokens: 4000 });
  if (!Array.isArray(ideas) || !ideas.length) throw new Error('Trend Scout returned no ideas');

  // Store the pillar post in body as JSON so the renderer/writer can use it intact.
  const rows = ideas.map(i => ({
    category: 'pillar-' + (i.pillar || 'psychology'),
    product_id: i.product_id,
    body: JSON.stringify({
      pillar: i.pillar,
      hook: i.hook,
      body: i.body,
      closer: i.closer || ''
    })
  }));

  await saveIdeas(env, rows);
  await log(env, `Trend Scout saved ${ideas.length} pillar posts`, {
    distribution: pillarAssignments.reduce((m, p) => (m[p] = (m[p] || 0) + 1, m), {}),
    sample: ideas.slice(0, 2)
  });
  return ideas;
}
