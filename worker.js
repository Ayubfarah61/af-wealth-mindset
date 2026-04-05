/**
 * AF Wealth Mindset - Worker
 * Cloudflare Worker — Health check + CORS
 *
 * PayPal has been removed. Payments are now handled by Paddle (Merchant of Record).
 * This worker is kept for future webhook handling if needed.
 */

const CORS_ORIGIN = 'https://afwealthmindset.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}

function handleHealth() {
  return json({ status: 'ok', worker: 'afwm-payments', version: '4.0.0', payment_provider: 'paddle' });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (path === '/api/health' && request.method === 'GET') {
      return handleHealth();
    }

    return json({ error: 'Not Found' }, 404);
  }
};
