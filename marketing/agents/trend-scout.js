// Trend Scout Agent
// Once per day: generates a fresh batch of angles (jokes, hot takes, hooks, screenshot ideas,
// trending formats) and saves them as `ideas` rows. The director picks 2/day for engagement posts.

import { callClaude } from '../lib/claude.js';
import { getProducts, saveIdeas, log } from '../lib/db.js';

const CATEGORIES = ['hook', 'joke', 'hot-take', 'screenshot', 'trend-format', 'story', 'tip', 'comparison'];

export async function generateDailyIdeas(env, count = 12) {
  const products = await getProducts(env);

  const system = `You are AF Wealth Mindset's social media trend scout.
You generate raw post angles for a brand that sells $7.99 Excel budget/profit/debt/cash-flow templates.

Each idea must:
- Be specific (a real one-liner, joke, screenshot caption, or trending format), not a topic
- Be safe to post as-is (no platform will flag it)
- Lean into a single emotion: relief, validation, shock, FOMO, humor, anger at apps
- NOT mention prices, NOT use the word "transform" or "unlock"
- Be cycleable across TikTok / IG / Pinterest / X / FB / YouTube without rewriting

Categories you can use: ${CATEGORIES.join(', ')}.

Examples of GOOD ideas (just style, do not copy):
  hook: "POV: you finally checked your bank account after avoiding it for 3 weeks"
  joke: "Budgeting apps in 2025: $14.99/mo to tell you that you spent $14.99/mo on a budgeting app"
  hot-take: "If your budget app needs a subscription it is not saving you money, it IS the expense"
  screenshot: "Screenshot a debt payoff dashboard going from 6 red bars to 2 — caption: month 4 vs month 11"
  comparison: "Mint shut down. YNAB is $109/yr. This is a $7.99 spreadsheet you own forever."

Mix categories — don't return 10 jokes.`;

  const user = `Generate ${count} fresh post angles for today.

Each one must be tied to ONE product when relevant (or null for general brand):
${products.map(p => `  id=${p.id}: ${p.name} — ${p.pitch}`).join('\n')}

Return ONLY this JSON array:
[
  { "category": "hook", "product_id": 4, "body": "the exact post angle in one sentence" },
  ...
]
Exactly ${count} items.`;

  const ideas = await callClaude(env, { system, user, response_format: 'json', max_tokens: 2500 });
  if (!Array.isArray(ideas) || !ideas.length) throw new Error('Trend Scout returned no ideas');
  await saveIdeas(env, ideas);
  await log(env, `Trend Scout saved ${ideas.length} ideas`, { sample: ideas.slice(0, 3) });
  return ideas;
}
