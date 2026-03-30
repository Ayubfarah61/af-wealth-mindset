/**
 * AF Wealth Mindset - Payments Worker
 * Cloudflare Worker — PayPal Orders API
 *
 * Secrets required (set via: wrangler secret put SECRET_NAME):
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_SECRET
 *
 * Sandbox API base: https://api-m.sandbox.paypal.com
 * Live API base:    https://api-m.paypal.com
 */

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com'; // Switch to live when ready
const CORS_ORIGIN = 'https://afwealthmindset.com';

// ============================================================
// CORS
// ============================================================

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

// ============================================================
// PayPal Auth
// ============================================================

async function getAccessToken(env) {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error('PayPal auth failed');
  const data = await res.json();
  return data.access_token;
}

// ============================================================
// POST /api/orders/create
// ============================================================

async function handleCreateOrder(request, env) {
  const body = await request.json();

  if (!body.amount || !body.email) {
    return json({ error: 'Missing amount or email' }, 400);
  }

  try {
    const token = await getAccessToken(env);
    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: parseFloat(body.amount).toFixed(2)
          },
          description: body.description || 'Digital Product',
          custom_id: body.email
        }],
        application_context: {
          shipping_preference: 'NO_SHIPPING'
        }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Create order error:', err);
      throw new Error('Failed to create order');
    }

    const order = await res.json();
    return json({ id: order.id, status: order.status }, 201);
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}

// ============================================================
// POST /api/orders/:id/capture
// ============================================================

async function handleCaptureOrder(orderId, env) {
  try {
    const token = await getAccessToken(env);
    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Capture error:', err);
      throw new Error('Failed to capture order');
    }

    const order = await res.json();
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];

    return json({
      id: order.id,
      status: order.status,
      capture_id: capture?.id,
      amount: capture?.amount?.value,
      payer_email: order.payer?.email_address
    });
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}

// ============================================================
// Health Check
// ============================================================

function handleHealth() {
  return json({ status: 'ok', worker: 'afwm-payments', version: '3.0.0' });
}

// ============================================================
// Router
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (path === '/api/health' && request.method === 'GET') {
      return handleHealth();
    }

    if (path === '/api/orders/create' && request.method === 'POST') {
      return handleCreateOrder(request, env);
    }

    const captureMatch = path.match(/^\/api\/orders\/([A-Z0-9]+)\/capture$/);
    if (captureMatch && request.method === 'POST') {
      return handleCaptureOrder(captureMatch[1], env);
    }

    return json({ error: 'Not Found' }, 404);
  }
};
