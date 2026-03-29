/**
 * AF Wealth Mindset - API Worker
 * Cloudflare Worker
 */

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  CORS_ORIGIN: 'https://afwealthmindset.com'
};

// ============================================================
// CORS Headers
// ============================================================

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CONFIG.CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// ============================================================
// Health Check
// ============================================================

async function handleHealthCheck() {
  return new Response(JSON.stringify({
    status: 'ok',
    worker: 'afwm-api',
    version: '2.0.0'
  }), {
    status: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}

// ============================================================
// Router
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    // Routes
    if (path === '/api/health' && request.method === 'GET') {
      return handleHealthCheck();
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
};
