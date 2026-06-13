// Trend Scout / Research Agent — FORBIDDEN KNOWLEDGE MODE (LOCKED)
//
// Format is law. See marketing/SPEC.md.
//
// Every idea is one of these hook patterns (no exceptions):
//   - "N questions <authority> hopes you never ask"
//   - "N reasons <bad outcome> happens"
//   - "What they don't tell you about <topic>"
//   - "Why most people <action> at <moment>"
//   - "N money rules your <authority> will never touch"
//   - "The truth about <thing>"
//   - "N silent killers of <thing>"
//
// Body: numbered list 3-7 items, each ≤ 18 words. No product nouns. No CTAs.
// The body is what gets rendered on the visual card image. Make it screenshot-able.

import { callClaude } from '../lib/claude.js';
import { getProducts, saveIdeas, log } from '../lib/db.js';

const PRODUCT_TERRITORY = {
  2: {
    label: 'AWARENESS / VISIBILITY',
    hooks: [
      'questions your bank hopes you never ask',
      'reasons your raises never feel like raises',
      'truths about where the money actually goes',
      'lies you tell yourself when the card declines',
      'why most people avoid opening the bank app on Sunday'
    ],
    never_say: ['budget', 'budgeting', 'budget planner', 'track your spending', 'expense tracker']
  },
  3: {
    label: 'BUSINESS HONESTY / MARGIN',
    hooks: [
      'reasons small businesses fail in year two',
      'lies business owners tell themselves about revenue',
      'questions your accountant won\'t ask you',
      'what business school will never teach you about cash',
      'why "busy" feels like "broke"'
    ],
    never_say: ['bookkeeping', 'profit tracker', 'business spreadsheet', 'track profit']
  },
  4: {
    label: 'DEBT POWERLESSNESS / PROGRESS',
    hooks: [
      'why most people quit paying debt at month 4',
      'lies the minimum payment is telling you',
      'silent killers of debt-payoff momentum',
      'what nobody told you about avalanche vs snowball',
      'why you avoid logging into the loan app'
    ],
    never_say: ['debt payoff', 'pay off debt', 'debt dashboard', 'debt tracker']
  },
  5: {
    label: 'FORWARD SIGHT / FUTURE BLINDNESS',
    hooks: [
      'money rules your professor will never touch',
      'reasons December always sneaks up empty',
      'why bonuses disappear in 14 days',
      'truths about the bills you do not see coming',
      'what the next 90 days already know about your account'
    ],
    never_say: ['cash flow', 'cash flow planner', '12-month plan']
  }
};

const STAMPS_BY_PRODUCT = {
  2: ['WHAT THEY DON\'T TELL YOU', 'THE BANK\'S PLAYBOOK', 'INSIDE THE NUMBERS', 'THE QUIET TRUTH'],
  3: ['BUSINESS SCHOOL WON\'T TEACH THIS', 'THE OWNER\'S BLIND SPOT', 'YEAR TWO REALITY', 'BEHIND THE REVENUE'],
  4: ['THE 4-MONTH WALL', 'WHAT MINIMUM PAYMENTS HIDE', 'THE PROGRESS LIE', 'INSIDE THE PAYOFF GAME'],
  5: ['THE 14-DAY ILLUSION', 'CALENDAR YOU IGNORED', 'WHAT 90 DAYS KNOW', 'THE SURPRISE BILL FORMULA']
};

export async function generateDailyIdeas(env, count = 12) {
  const products = await getProducts(env);

  const system = `You are AF Wealth Mindset's RESEARCH AGENT operating in FORBIDDEN KNOWLEDGE MODE.

YOUR JOB: surface scary, curiosity-driven, "they don't want you to know this" angles that get screenshotted and DM'd.

OUR VOICE (LOCKED):
- Insider warnings. Slight threat. We tell you what your bank / accountant / professor / boss / family won't.
- Second person ("you", "your"). Blunt. Calm.
- Banned words: "unlock", "transform", "secret", "trick", "hack", "10x", "game-changer", "you won't believe", "revolutionary", "transform your life".

HOOK PATTERNS (every idea must use ONE — no exceptions):
  A. "N questions <authority> hopes you never ask yourself"
  B. "N reasons <bad outcome>"
  C. "What they don't tell you about <thing>"
  D. "Why most people <action> at <moment>"
  E. "N money rules your <authority> will never touch"
  F. "The truth about <thing>"
  G. "N silent killers of <thing>"
  H. "N lies you've been told about <thing>"

BODY (LOCKED):
- Optional 1-line LEAD before the list (16-20 words, sharp).
- Numbered list: 3 to 7 items, each ≤ 18 words.
- Each item names a feeling, contradiction, cycle, or moment — NOT a task.
- NEVER mention products, tools, apps, spreadsheets, budgets, trackers, planners.
- NEVER include a CTA. The CTA lives in the caption later.

GOLD EXAMPLES (use as reference for level, do NOT copy text):
  product_id 2:
    HOOK: "3 questions your bank hopes you never ask yourself"
    LIST: ["Where did the last $1,000 you spent actually go?",
           "What is your true monthly burn rate — not your guess?",
           "If your income stopped today, how many weeks until you panic?"]
    STAMP: "WHAT THEY DON'T TELL YOU"

  product_id 3:
    HOOK: "5 reasons small businesses fail in year two"
    LIST: ["Revenue grew. Margin didn't. Nobody warned them.",
           "The owner paid everyone but themselves.",
           "Busy was confused with profitable for 18 months.",
           "Taxes hit. Reserves didn't exist.",
           "The numbers were never on one page."]
    STAMP: "BUSINESS SCHOOL WON'T TEACH THIS"

  product_id 4:
    HOOK: "Why most people quit paying debt at month 4"
    LEAD: "It is not the money. It is the silence."
    LIST: ["The first three months feel like sacrifice with no proof.",
           "The brain needs to see progress, not just feel it.",
           "Without one page showing the line move, you give up."]
    STAMP: "THE 4-MONTH WALL"

  product_id 5:
    HOOK: "3 money rules your professor will never touch"
    LIST: ["Every dollar you can't see in 90 days is already spent.",
           "Annual bills don't care that you live month-to-month.",
           "December was on your calendar in January. You ignored it."]
    STAMP: "THE 14-DAY ILLUSION"`;

  const productsList = products.map(p => {
    const t = PRODUCT_TERRITORY[p.id];
    const s = STAMPS_BY_PRODUCT[p.id];
    return `  id=${p.id}: ${p.name}  [${t.label}]
    HOOK SEEDS (riff, don't copy):
${t.hooks.map(h => '      • ' + h).join('\n')}
    STAMP options: ${s.join(' / ')}
    NEVER USE these words in body: ${t.never_say.join(', ')}`;
  }).join('\n\n');

  const user = `Research and write ${count} fresh FORBIDDEN-KNOWLEDGE post cards for today.

Distribute roughly even across the 4 products (so each gets ~${Math.floor(count/4)} ideas).

Products and their territories:
${productsList}

Return ONLY this JSON array (exactly ${count} items):
[
  {
    "category": "number-questions" | "number-reasons" | "what-they-dont-tell" | "why-most-people" | "money-rules" | "truth-about" | "silent-killers" | "lies-youve-been-told",
    "product_id": 2 | 3 | 4 | 5,
    "stamp": "<the classified stamp text, ALL CAPS, ≤ 35 chars>",
    "hook": "<the hook headline, 6-12 words>",
    "accent_word": "<the one or two words inside the hook to render in gold>",
    "lead": "<optional 1-line lead, 14-20 words, OR empty string>",
    "list": [
      "first numbered item, ≤ 18 words",
      "second numbered item",
      "third numbered item"
    ]
  }
]

Rules check before you return:
- Every hook follows one of patterns A-H.
- Every "list" has 3-7 items.
- "accent_word" must be a substring of "hook".
- No banned words. No product nouns inside lead/list/hook.
- No emojis anywhere.`;

  const ideas = await callClaude(env, { system, user, response_format: 'json', max_tokens: 4000 });
  if (!Array.isArray(ideas) || !ideas.length) throw new Error('Trend Scout returned no ideas');

  // Store the FULL idea object (stamp, hook, lead, list) in `body` as JSON
  // so the Card Renderer can reconstruct the card visually.
  const rows = ideas.map(i => ({
    category: i.category,
    product_id: i.product_id,
    body: JSON.stringify({
      stamp: i.stamp,
      hook: i.hook,
      accent_word: i.accent_word,
      lead: i.lead || '',
      list: i.list
    })
  }));

  await saveIdeas(env, rows);
  await log(env, `Trend Scout saved ${ideas.length} forbidden-knowledge cards`, { sample: ideas.slice(0, 2) });
  return ideas;
}
