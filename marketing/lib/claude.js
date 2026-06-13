// Anthropic API client — straight fetch, no SDK (Workers-friendly).
// Default model: Haiku 4.5 — cheap, fast, plenty smart for marketing copy.
// Override with env.CLAUDE_MODEL if you want Sonnet for nuance.

const API = 'https://api.anthropic.com/v1/messages';

export async function callClaude(env, { system, user, model, max_tokens = 1500, response_format = 'text' }) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');
  const body = {
    model: model || env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
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
  const raw = data.content?.[0]?.text || '';
  if (response_format === 'json') return safeJson(raw);
  return raw;
}

// Claude likes to wrap JSON in fences. Strip them, then parse.
function safeJson(text) {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  // first { to last }
  const first = t.indexOf('{');
  const firstArr = t.indexOf('[');
  const start = firstArr !== -1 && (firstArr < first || first === -1) ? firstArr : first;
  if (start === -1) throw new Error('No JSON in Claude response: ' + text.slice(0, 200));
  const endChar = t[start] === '[' ? ']' : '}';
  const end = t.lastIndexOf(endChar);
  return JSON.parse(t.slice(start, end + 1));
}
