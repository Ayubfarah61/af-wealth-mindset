// Pulls Paddle sales transactions for the dashboard.
// Free tier — uses the existing PADDLE_API_KEY secret (set on the delivery worker).
// For the marketing worker, the user can add it as PADDLE_API_KEY too.

const PADDLE = 'https://api.paddle.com';

export async function fetchSalesSummary(env) {
  if (!env.PADDLE_API_KEY) return { error: 'No Paddle API key' };
  // List transactions in last 30 days, status=completed
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const url = `${PADDLE}/transactions?status=completed&after=${encodeURIComponent(since)}&per_page=100`;
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + env.PADDLE_API_KEY } });
  const data = await r.json();
  if (!r.ok) return { error: data?.error?.detail || 'Paddle API error' };

  const txns = data.data || [];
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = now - 7 * 86400000;

  let salesToday = 0, salesWeek = 0, salesMonth = 0;
  let revenueToday = 0, revenueWeek = 0, revenueMonth = 0;

  for (const t of txns) {
    const at = new Date(t.created_at || t.updated_at);
    const amount = Number(t.details?.totals?.total) / 100 || 0;
    salesMonth++;
    revenueMonth += amount;
    if (at.toISOString().slice(0, 10) === today) {
      salesToday++; revenueToday += amount;
    }
    if (at.getTime() >= sevenDaysAgo) {
      salesWeek++; revenueWeek += amount;
    }
  }

  return {
    today: { count: salesToday, revenue_usd: Math.round(revenueToday * 100) / 100 },
    week: { count: salesWeek, revenue_usd: Math.round(revenueWeek * 100) / 100 },
    month: { count: salesMonth, revenue_usd: Math.round(revenueMonth * 100) / 100 },
  };
}
