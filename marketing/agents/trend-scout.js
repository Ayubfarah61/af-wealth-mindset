// Trend Scout / Research Agent — PSYCHOLOGY-FIRST MODE
//
// Job: every day, research and surface PSYCHOLOGICAL pain-angles tied to each product.
// The angle must NAME the feeling, the moment, the shame, the cycle — never the task.
//
// Examples of correct vs wrong framing:
//   ❌ "5 ways to budget better"        ← names the task (budgeting)
//   ✅ "The Sunday-night dread before opening your bank app"   ← names the feeling
//
//   ❌ "How to manage cash flow"        ← names the task
//   ✅ "The 3-week cycle of feeling rich then broke"           ← names the cycle
//
//   ❌ "Pay off debt faster"            ← names the task
//   ✅ "Why minimum payments feel like running on a treadmill" ← names the feeling
//
//   ❌ "Track your business profit"     ← names the task
//   ✅ "Why busy business owners still can't pay themselves"   ← names the contradiction
//
// The reader recognizes themselves first. The product is mentioned LATER, in the caption,
// never in the body of the lesson.

import { callClaude } from '../lib/claude.js';
import { getProducts, saveIdeas, log } from '../lib/db.js';

// Per-product psychological territory the scout researches in.
const PRODUCT_PSYCH_MAP = {
  2: { // Ultimate Budget Planner
    name: 'awareness / visibility',
    feelings: ['avoidance of bank app', 'sunday-night money dread', 'shame after impulse buys', 'why raises never feel like raises', 'fighting about money when income is fine', 'the small lie when partner asks "how much did you spend"', 'numbness scrolling spending', 'the calendar of regret'],
    never_say: ['budget', 'budgeting', 'budget planner', 'track your spending', 'expense tracker']
  },
  3: { // Profit Tracker
    name: 'business honesty / margin reality',
    feelings: ['busy but broke business owner', 'revenue illusion', 'cant take a vacation from your own work', 'feeling guilty paying yourself', 'why year 2 is harder than year 1', 'comparing yourself to your gross', 'the lie of "growing"', 'shame of not knowing your margin'],
    never_say: ['bookkeeping', 'profit tracker', 'track profit', 'business spreadsheet']
  },
  4: { // Debt Payoff Dashboard
    name: 'powerlessness / progress invisibility',
    feelings: ['treadmill feeling of minimums', 'debt feels permanent', 'why people quit at month 4', 'the mental weight of 6 different bills', 'shame at the loan totals', 'the silence when you check the balance', 'paying everything and feeling no closer', 'avoiding the apps because the numbers hurt'],
    never_say: ['debt payoff', 'pay off debt', 'debt dashboard', 'debt tracker']
  },
  5: { // 12-Month Cash Flow Budget
    name: 'forward sight / future blindness',
    feelings: ['the 3-week cycle of rich-then-broke', 'december sneaks up empty', 'saying yes to costs you cant cover next quarter', 'living one bad month from disaster', 'the dread before a big annual bill', 'why bonuses disappear', 'the surprise tax-time pit', 'no idea where you will be in 90 days'],
    never_say: ['cash flow', 'cash flow planner', 'cash flow budget', '12-month plan']
  }
};

export async function generateDailyIdeas(env, count = 12) {
  const products = await getProducts(env);

  const system = `You are AF Wealth Mindset's RESEARCH AGENT.

YOUR JOB: surface real PSYCHOLOGICAL PAIN ANGLES that real people feel about money — the kind of angles that get screenshotted and saved because they make someone go "this is me."

OUR VOICE:
- We are EDUCATORS. We never sell in the post body.
- Wise-elder talking to younger self. Direct. Warm. Slightly stern when needed.
- Short sentences. Plain words. Second-person address.
- Banned words (never use): "unlock", "transform", "game-changer", "10x", "secret", "trick", "you won't believe", "revolutionary", "hack".

THE FORMAT — copy @dearson_ig (millions of views per post):
  Line 1: "Dear ___" — direct-address letter opener that NAMES THE FEELING/CYCLE, not the task
  Body: 30-90 words. EITHER a numbered list (3-7 short items) OR 2-4 short sentences.
  Each line stands alone. Punchy. Each item ≤ 14 words.

STRICT RULES YOU MUST FOLLOW:
1. The body NEVER mentions the product noun. NEVER use the words: "budget", "budgeting", "budget planner", "cash flow", "cash flow planner", "debt payoff", "debt tracker", "bookkeeping", "profit tracker", "spreadsheet", "template", "tool", "app".
2. The body NEVER tells someone to use a thing. It only names the FEELING, the CYCLE, the SHAME, the CONTRADICTION, the MOMENT.
3. The body does NOT contain a CTA. The CTA happens later in the caption, not here.
4. Each idea is tied to ONE product (we route the CTA later). But the BODY only talks psychology.

EXAMPLES OF CORRECT IDEAS:

  product_id 2 (awareness):
    "Dear me before I knew where the money went: You will check your bank app on a Sunday night and feel a small dread. That dread is not about the numbers. It is about not knowing. You can fix the not knowing in one weekend. You cannot fix it by hoping."

  product_id 3 (business honesty):
    "Dear business owner who feels busy but broke: 1) You are looking at the wrong number. 2) Revenue is the number that makes people congratulate you. 3) Margin is the number that lets you sleep. 4) Until you know both, you do not own a business — you own a job that pays in receipts."

  product_id 4 (debt powerlessness):
    "Dear me on month 4 of payments: You feel like you are running on a treadmill. That feeling is not weakness. It is a missing dashboard. You cannot see progress because no one shows you progress. Find the one that shows you what is moving and what is stuck. The shame goes when the picture appears."

  product_id 5 (forward sight):
    "Dear me three weeks before December: 1) The bills you are ignoring know the date. 2) The gifts you have not bought are already on the calendar. 3) Your future self is screaming and you cannot hear her yet. 4) Look at the next 12 months on one page. The panic loses its grip when the months are visible."

  product_id null (general brand):
    "Dear me at 22: The reason you keep saying 'I don't know where it went' is that you have never let yourself look. Looking is not punishment. Looking is the only door out."`;

  const productsList = products.map(p => {
    const m = PRODUCT_PSYCH_MAP[p.id];
    return `  id=${p.id}: ${p.name}
    psychological territory: ${m.name}
    feeling-angles to pull from (rotate, do not reuse same one twice in a batch):
${m.feelings.map(f => '      - ' + f).join('\n')}
    NEVER USE these words for this product: ${m.never_say.join(', ')}`;
  }).join('\n\n');

  const user = `Research and write ${count} fresh PSYCHOLOGICAL ANGLE post bodies for today.

Rules:
- Each idea ties to EXACTLY ONE product id from the list below (rotate so each product gets at least 2 ideas).
- Body is the "Dear ___" letter as described. NEVER mention the product noun. NEVER pitch.
- Each "Dear ___" header must NAME A FEELING/MOMENT/CYCLE, not a task.

Products and their psychological territory:
${productsList}

Return ONLY this JSON array:
[
  {
    "category": "wisdom-list" | "hard-truth" | "cycle-name" | "moment-name" | "myth-bust",
    "product_id": <2|3|4|5|null>,
    "body": "Dear ___: ..."
  }
]
Exactly ${count} items. Distribute roughly evenly across the 4 products.`;

  const ideas = await callClaude(env, { system, user, response_format: 'json', max_tokens: 3500 });
  if (!Array.isArray(ideas) || !ideas.length) throw new Error('Trend Scout returned no ideas');
  await saveIdeas(env, ideas);
  await log(env, `Trend Scout saved ${ideas.length} ideas`, { sample: ideas.slice(0, 3) });
  return ideas;
}
