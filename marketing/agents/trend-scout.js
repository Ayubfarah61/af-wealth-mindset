// Trend Scout — DEARSON LETTER MODE (LOCKED)
//
// Format: "Dear ___" letter, just like @dearson_ig tweet screenshots.
// Body = a list of short punchy statements (each ≤ 12 words, one per line)
// + an optional closing summary line.
//
// NO numbered list with "01, 02". NO "3 questions" hooks. NO classified document chrome.
// Just the letter. Black text on white card. Tweet aesthetic.

import { callClaude } from '../lib/claude.js';
import { getProducts, saveIdeas, log } from '../lib/db.js';

const PRODUCT_TERRITORY = {
  2: {
    label: 'AWARENESS / MONEY VISIBILITY',
    personas: ['broke me at 22', 'me before I knew where it went', 'me on Sunday night', 'me with a fresh raise', 'me who avoids the bank app', 'me who lies about spending', 'me at the gas pump'],
    never_say: ['budget', 'budgeting', 'budget planner', 'track your spending', 'expense tracker']
  },
  3: {
    label: 'BUSINESS HONESTY / MARGIN',
    personas: ['small business owner', 'business owner who works weekends', 'me at year two', 'freelancer making six figures', 'busy but broke business owner', 'me before I knew margin'],
    never_say: ['bookkeeping', 'profit tracker', 'business spreadsheet', 'track profit']
  },
  4: {
    label: 'DEBT PSYCHOLOGY / PROGRESS',
    personas: ['me with six debts', 'me on month four', 'me staring at the minimum payment', 'me afraid to open the loan app', 'me feeling no progress', 'me ready to give up'],
    never_say: ['debt payoff', 'pay off debt', 'debt dashboard', 'debt tracker']
  },
  5: {
    label: 'FORWARD SIGHT / FUTURE',
    personas: ['me three weeks after payday', 'me before December', 'me ignoring annual bills', 'me three months from broke', 'me after the bonus', 'me at tax time'],
    never_say: ['cash flow', 'cash flow planner', '12-month plan']
  }
};

export async function generateDailyIdeas(env, count = 12) {
  const products = await getProducts(env);

  const system = `You are AF Wealth Mindset's RESEARCH AGENT.

YOU WRITE "DEAR ___" LETTERS in the @dearson_ig style. That's it. No other format exists.

EXACT TEMPLATE (study this — every letter must look like this):

  Dear Son,

  Be BORING.
  Build boring business.
  Do boring workouts.
  Read boring books.
  Do boring courses.
  Eat boring foods.

  As a man who wants to go far in life, learn to be bored, silent, and alone.

That is what you produce. A letter opener. Short punchy lines. A closing line.

OUR VOICE:
- Wise elder talking to younger self. Direct. Warm. Slightly stern.
- Second person. Short sentences. Plain words.
- Banned: "unlock", "transform", "secret", "trick", "hack", "10x", "game-changer", "revolutionary".
- Banned product nouns inside the letter: "budget", "budgeting", "cash flow", "debt payoff", "bookkeeping", "profit tracker", "spreadsheet", "template", "tool", "app", "planner", "tracker".

STRUCTURE (every idea):
- persona: the "Dear ___" subject. 3-8 words. NAMES A FEELING/MOMENT/IDENTITY, never a task.
- lines: 3-6 short body statements. Each ≤ 12 words. Each stands alone on its own line.
- closing: ONE summary sentence (12-26 words) tying it together. Can be omitted if not needed.

GOLD EXAMPLES (style/level, do not copy verbatim):

  persona: "broke me at 22"
  lines: ["Stop guessing where the money went.", "Open the bank app on Sunday.", "Write down every dollar for one week.", "Do not hide. Look."]
  closing: "You cannot fix what you refuse to see. The number is the truth. The avoidance is the wound."

  persona: "small business owner"
  lines: ["Revenue is the noise.", "Profit is the signal.", "Pay yourself first.", "Know your margin before you grow.", "A busy week is not a wealthy week."]
  closing: "If you cannot say your profit margin without checking, you do not own a business. You own a job that pays in receipts."

  persona: "me with six debts"
  lines: ["Pick one to attack.", "Watch only that one.", "Make minimum on the rest.", "Celebrate the small line moving.", "Do not quit at month four."]
  closing: "You feel like nothing is changing because you cannot see it. Find the page that shows the line move. The shame goes when the picture appears."

  persona: "me three weeks after payday"
  lines: ["The rich feeling is a 14-day window.", "Annual bills already have your name.", "December was on your calendar in January.", "Look at the next 12 months on one page."]
  closing: "You do not have a money problem. You have a sight problem. The future is loud. You just cannot hear it yet."`;

  const productsList = products.map(p => {
    const t = PRODUCT_TERRITORY[p.id];
    return `  id=${p.id}: ${p.name}  [${t.label}]
    PERSONA SEEDS (riff, don't copy):
${t.personas.map(h => '      • Dear ' + h).join('\n')}
    NEVER USE these words in lines/closing: ${t.never_say.join(', ')}`;
  }).join('\n\n');

  const user = `Write ${count} fresh "Dear ___" letters for today.

Distribute roughly evenly across the 4 products (so each gets ~${Math.floor(count/4)} letters).

Products and their territories:
${productsList}

Return ONLY this JSON array (exactly ${count} items):
[
  {
    "product_id": 2 | 3 | 4 | 5,
    "persona": "broke me at 22",
    "lines": ["short statement 1", "short statement 2", "short statement 3"],
    "closing": "optional summary sentence tying it together (or empty string)"
  }
]

Rules check before you return:
- Every "lines" array has 3-6 items, each ≤ 12 words.
- Every "persona" is 3-8 words and names a feeling/moment/identity, NOT a task.
- "closing" is empty string OR a single sentence 12-26 words.
- No banned words. No product nouns inside lines/closing.
- No emojis anywhere. No numbered prefixes ("1.", "01.", etc.) — each line stands alone.`;

  const ideas = await callClaude(env, { system, user, response_format: 'json', max_tokens: 3500 });
  if (!Array.isArray(ideas) || !ideas.length) throw new Error('Trend Scout returned no ideas');

  // Store the FULL letter structure in body as JSON so the card renderer can reconstruct it.
  const rows = ideas.map(i => ({
    category: 'dearson-letter',
    product_id: i.product_id,
    body: JSON.stringify({
      persona: i.persona,
      lines: i.lines,
      closing: i.closing || ''
    })
  }));

  await saveIdeas(env, rows);
  await log(env, `Trend Scout saved ${ideas.length} dearson letters`, { sample: ideas.slice(0, 2) });
  return ideas;
}
