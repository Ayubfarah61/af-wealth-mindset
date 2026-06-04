/**
 * AF Wealth Mindset - Delivery Worker
 *
 * Handles Paddle webhook fulfillment after a successful payment.
 * The Worker verifies Paddle, identifies the purchased product, and emails
 * the customer the Excel and Google Sheets delivery links.
 */

const ALLOWED_ORIGINS = [
  'https://afwealthmindset.com',
  'https://www.afwealthmindset.com'
];

const PRODUCT_BY_PRICE_ID = {
  pri_01kpqtwd3gxej4n3zmwj7q3jna: {
    id: 2,
    name: 'The Ultimate Budget Planner'
  },
  pri_01kpr10frj3w82ek1jjbzrd9wn: {
    id: 3,
    name: 'The Profit Tracker'
  },
  pri_01kpr12ct1sz1aqvnyweskx44x: {
    id: 4,
    name: 'Debt Payoff Dashboard'
  },
  pri_01kpr142by79r7r16pg9xgv570: {
    id: 5,
    name: '12-Month Cash Flow Budget'
  }
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' }
  });
}

function handleHealth(request) {
  return json(request, {
    status: 'ok',
    worker: 'afwm-delivery',
    version: '5.0.0',
    payment_provider: 'paddle',
    delivery: 'email'
  });
}

function parsePaddleSignature(header) {
  const parts = {};
  if (!header) return parts;

  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!parts[key]) parts[key] = [];
    parts[key].push(value);
  });

  return parts;
}

async function hmacSha256Hex(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifyPaddleWebhook(rawBody, signatureHeader, secret, toleranceSeconds) {
  if (!secret) throw new Error('Missing PADDLE_WEBHOOK_SECRET');

  const parsed = parsePaddleSignature(signatureHeader);
  const timestamp = parsed.ts && parsed.ts[0];
  const signatures = parsed.h1 || [];
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}:${rawBody}`);
  return signatures.some((signature) => timingSafeEqual(signature, expected));
}

function readProductLinks(env) {
  const configured = env.PRODUCT_LINKS ? JSON.parse(env.PRODUCT_LINKS) : {};

  Object.keys(PRODUCT_BY_PRICE_ID).forEach((priceId) => {
    const product = PRODUCT_BY_PRICE_ID[priceId];
    configured[priceId] = {
      ...(configured[priceId] || {}),
      ...removeEmpty({
        excelUrl: env[`PRODUCT_${product.id}_EXCEL_URL`],
        googleSheetUrl: env[`PRODUCT_${product.id}_GOOGLE_SHEET_URL`],
        guideUrl: env[`PRODUCT_${product.id}_GUIDE_URL`]
      })
    };
  });

  return configured;
}

function removeEmpty(object) {
  const cleaned = {};
  Object.keys(object).forEach((key) => {
    if (object[key]) cleaned[key] = object[key];
  });
  return cleaned;
}

function findPurchasedPriceIds(event) {
  const items = (event.data && event.data.items) || [];
  const priceIds = [];

  items.forEach((item) => {
    const priceId = item.price_id || (item.price && item.price.id);
    if (priceId && !priceIds.includes(priceId)) priceIds.push(priceId);
  });

  return priceIds.filter((priceId) => PRODUCT_BY_PRICE_ID[priceId]);
}

async function getCustomerEmail(event, env) {
  const directEmail =
    event.data?.customer?.email ||
    event.data?.customer_email ||
    event.data?.email ||
    event.data?.billing_details?.email;

  if (directEmail) return directEmail;
  if (!event.data?.customer_id || !env.PADDLE_API_KEY) return null;

  const apiBase = env.PADDLE_API_BASE || 'https://api.paddle.com';
  const response = await fetch(`${apiBase}/customers/${event.data.customer_id}`, {
    headers: {
      Authorization: `Bearer ${env.PADDLE_API_KEY}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) return null;

  const payload = await response.json();
  return payload?.data?.email || null;
}

function buildDeliveryEmail(products, transactionId, supportEmail) {
  const productBlocks = products.map((product) => {
    const links = [];

    if (product.excelUrl) {
      links.push(`<li><a href="${escapeHtml(product.excelUrl)}">Download the Excel file</a></li>`);
    }
    if (product.googleSheetUrl) {
      links.push(`<li><a href="${escapeHtml(product.googleSheetUrl)}">Open the Google Sheets copy link</a></li>`);
    }
    if (product.guideUrl) {
      links.push(`<li><a href="${escapeHtml(product.guideUrl)}">Open the setup guide</a></li>`);
    }

    return `
      <div style="padding:18px 0;border-top:1px solid #eadfbd;">
        <h2 style="font-size:18px;margin:0 0 8px;color:#0B1220;">${escapeHtml(product.name)}</h2>
        <ul style="margin:0;padding-left:20px;line-height:1.8;">${links.join('')}</ul>
      </div>`;
  }).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0B1220;line-height:1.6;">
      <h1 style="font-size:24px;margin-bottom:8px;">Your AF Wealth Mindset download is ready</h1>
      <p>Thank you for your purchase. Your product access links are below.</p>
      ${productBlocks}
      <p style="font-size:13px;color:#586071;">Transaction: ${escapeHtml(transactionId || 'Paddle')}</p>
      <p>If you need help, reply to this email or contact <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>
    </div>`;

  const text = [
    'Your AF Wealth Mindset download is ready',
    '',
    'Thank you for your purchase. Your product access links are below.',
    '',
    ...products.flatMap((product) => {
      const lines = [product.name];
      if (product.excelUrl) lines.push(`Excel: ${product.excelUrl}`);
      if (product.googleSheetUrl) lines.push(`Google Sheets: ${product.googleSheetUrl}`);
      if (product.guideUrl) lines.push(`Guide: ${product.guideUrl}`);
      lines.push('');
      return lines;
    }),
    `Transaction: ${transactionId || 'Paddle'}`,
    `Support: ${supportEmail}`
  ].join('\n');

  return { html, text };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendDeliveryEmail(env, to, products, transactionId) {
  if (!env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  const supportEmail = env.SUPPORT_EMAIL || 'sales@afwealthmindset.com';
  const fromEmail = env.FROM_EMAIL || `AF Wealth Mindset <${supportEmail}>`;
  const message = buildDeliveryEmail(products, transactionId, supportEmail);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: products.length === 1
        ? `Your ${products[0].name} download is ready`
        : 'Your AF Wealth Mindset downloads are ready',
      html: message.html,
      text: message.text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function handlePaddleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('Paddle-Signature');
  const toleranceSeconds = Number(env.PADDLE_WEBHOOK_TOLERANCE_SECONDS || 300);
  const verified = await verifyPaddleWebhook(rawBody, signature, env.PADDLE_WEBHOOK_SECRET, toleranceSeconds);

  if (!verified) {
    return json(request, { error: 'Invalid Paddle signature' }, 401);
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type;

  if (!['transaction.completed', 'transaction.paid'].includes(eventType)) {
    return json(request, { ok: true, ignored: eventType });
  }

  const priceIds = findPurchasedPriceIds(event);
  if (priceIds.length === 0) {
    return json(request, { error: 'No supported AF Wealth product in webhook' }, 422);
  }

  const productLinks = readProductLinks(env);
  const products = priceIds.map((priceId) => ({
    ...PRODUCT_BY_PRICE_ID[priceId],
    ...(productLinks[priceId] || {})
  }));

  const missingLinks = products.filter((product) => !product.excelUrl && !product.googleSheetUrl && !product.guideUrl);
  if (missingLinks.length > 0) {
    return json(request, { error: 'Product delivery links are missing', products: missingLinks.map((p) => p.name) }, 500);
  }

  const customerEmail = await getCustomerEmail(event, env);
  if (!customerEmail) {
    return json(request, { error: 'Customer email not found. Add PADDLE_API_KEY so the Worker can fetch customer details.' }, 500);
  }

  const transactionId = event.data?.id || event.notification_id || event.event_id;
  await sendDeliveryEmail(env, customerEmail, products, transactionId);

  return json(request, { ok: true, delivered_to: customerEmail, products: products.map((product) => product.name) });
}

async function handleTestDelivery(request, env) {
  if (!env.DELIVERY_TEST_TOKEN) {
    return json(request, { error: 'Missing DELIVERY_TEST_TOKEN' }, 403);
  }

  const authorization = request.headers.get('Authorization') || '';
  if (authorization !== `Bearer ${env.DELIVERY_TEST_TOKEN}`) {
    return json(request, { error: 'Unauthorized' }, 401);
  }

  const body = await request.json();
  const priceId = body.priceId || 'pri_01kpqtwd3gxej4n3zmwj7q3jna';
  const product = PRODUCT_BY_PRICE_ID[priceId];
  if (!product) return json(request, { error: 'Unknown priceId' }, 422);

  const productLinks = readProductLinks(env);
  const deliveryProduct = { ...product, ...(productLinks[priceId] || {}) };
  await sendDeliveryEmail(env, body.email, [deliveryProduct], 'TEST-DELIVERY');

  return json(request, { ok: true, delivered_to: body.email, product: deliveryProduct.name });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    try {
      if (path === '/api/health' && request.method === 'GET') {
        return handleHealth(request);
      }

      if (path === '/api/paddle-webhook' && request.method === 'POST') {
        return handlePaddleWebhook(request, env);
      }

      if (path === '/api/test-delivery' && request.method === 'POST') {
        return handleTestDelivery(request, env);
      }

      return json(request, { error: 'Not Found' }, 404);
    } catch (error) {
      return json(request, { error: error.message || 'Server error' }, 500);
    }
  }
};
