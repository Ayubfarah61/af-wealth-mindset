// Anthropic API client with a HARD daily spend cap.
//
// Default model: Haiku 4.5 — $1/M input, $5/M output.
// Default daily cap: $0.10/day (~$3/month max).  Override with env.DAILY_USD_CAP.
//
// If the cap is hit, callClaude throws BudgetExceeded — the caller logs and skips,
// no calls are sent, so your $5 balance survives even a runaway loop.

const API = 'https://api.anthropic.com/v1/messages';

// $ per million tokens — keep in sync with model
const PRICE = {
  'claude-haiku-4-5-20251001': { in: 1.00, out: 5.00 },
  'claude-sonnet-4-6':         { in: 3.00, out: 15.00 },
  'claude-opus-4-7':           { in: 15.00, out: 75.00 }
};

export class BudgetExceeded extends Error {
  constructor(used, cap) {
    super(`Daily budget hit: $${used.toFixed(4)} of $${cap.toFixed(2)}`);
    this.used = used;
    this.cap = cap;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function getTodaySpend(env) {
  const row = await env.DB.prepare('SELECT usd FROM spend WHERE day = ?').bind(today()).first();
  return row ? row.usd : 0;
}

async function recordSpend(env, model, usage) {
  const price = PRICE[model] || PRICE['claude-haiku-4-5-20251001'];
  const cost = (usage.input_tokens / 1_000_000) * price.in +
               (usage.output_tokens / 1_000_000) * price.out;
  await env.DB.prepare(`
    INSERT INTO spend (day, input_tokens, output_tokens, usd, calls)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(day) DO UPDATE SET
      input_tokens = input_tokens + excluded.input_tokens,
      output_tokens = output_tokens + excluded.output_tokens,
      usd = usd + excluded.usd,
      calls = calls + 1
  `).bind(today(), usage.input_tokens || 0, usage.output_tokens || 0, cost).run();
  return cost;
}

export async function callClaude(env, { system, user, model, max_tokens = 1500, response_format = 'text' }) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');

  const cap = Number(env.DAILY_USD_CAP || '0.10');
  const used = await getTodaySpend(env);
  if (used >= cap) throw new BudgetExceeded(used, cap);

  const useModel = model || env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
  const body = {
    model: useModel,
    max_tokens,
    system: system || undefined,
    messages: [{ role: 'user', content: user }]
  };
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (data.usage) await recordSpend(env, useModel, data.usage);

  const raw = data.content?.[0]?.text || '';
  if (response_format === 'json') return safeJson(raw);
  return raw;
}

function safeJson(text) {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const first = t.indexOf('{');
  const firstArr = t.indexOf('[');
  const start = firstArr !== -1 && (firstArr < first || first === -1) ? firstArr : first;
  if (start === -1) throw new Error('No JSON in Claude response: ' + text.slice(0, 200));
  const endChar = t[start] === '[' ? ']' : '}';
  const end = t.lastIndexOf(endChar);
  return JSON.parse(t.slice(start, end + 1));
}
