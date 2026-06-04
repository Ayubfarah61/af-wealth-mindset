/**
 * AF Wealth Mindset - Delivery Worker
 *
 * Handles Paddle webhook fulfillment after a successful payment. The Worker
 * verifies Paddle, identifies the purchased product, emails delivery links,
 * and lets paid customers recover downloads from the order page.
 */

const BASE_URL = 'https://afwealthmindset.com';
const ALLOWED_ORIGINS = ['https://afwealthmindset.com', 'https://www.afwealthmindset.com'];

const PRODUCT_BY_PRICE_ID = {
  pri_01kpqtwd3gxej4n3zmwj7q3jna: { id: 2, name: 'The Ultimate Budget Planner' },
  pri_01kpr10frj3w82ek1jjbzrd9wn: { id: 3, name: 'The Profit Tracker' },
  pri_01kpr12ct1sz1aqvnyweskx44x: { id: 4, name: 'Debt Payoff Dashboard' },
  pri_01kpr142by79r7r16pg9xgv570: { id: 5, name: '12-Month Cash Flow Budget' }
};

const DEFAULT_PRODUCT_LINKS = {
  pri_01kpqtwd3gxej4n3zmwj7q3jna: {
    excelUrl: `${BASE_URL}/api/download/budget-planner.xlsx`,
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1hP7f4zWHZILUcW5G7xs1qCyqj1RmWed8/copy'
  },
  pri_01kpr10frj3w82ek1jjbzrd9wn: {
    excelUrl: `${BASE_URL}/api/download/profit-tracker.xlsx`
  },
  pri_01kpr12ct1sz1aqvnyweskx44x: {
    excelUrl: `${BASE_URL}/api/download/debt-payoff-dashboard.xlsx`,
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1xnBdyY61F-YCG5JbWnRbekjYAc0s8LzH/copy'
  },
  pri_01kpr142by79r7r16pg9xgv570: {
    excelUrl: `${BASE_URL}/api/download/cash-flow-budget.xlsx`,
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1ZTNBP-eeR4L8q-2gggWt9GRSDCoAJ25m5TfdaKNtBk4/copy'
  }
};

const R2_FILE_BY_DOWNLOAD_KEY = {
  'budget-planner.xlsx': 'Monthly Budget Tracker Sample.xlsx',
  'profit-tracker.xlsx': 'Business bookkeeping.xlsx',
  'debt-payoff-dashboard.xlsx': 'Debt Payoff Dashboard  Excel Template Sample.xlsx',
  'cash-flow-budget.xlsx': '12-Month Cash Flow Budget  Excel Template Sample.xlsx'
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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
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

function removeEmpty(object) {
  const cleaned = {};
  Object.keys(object).forEach((key) => {
    if (object[key]) cleaned[key] = object[key];
  });
  return cleaned;
}

function readProductLinks(env) {
  const configured = {
    ...DEFAULT_PRODUCT_LINKS,
    ...(env.PRODUCT_LINKS ? JSON.parse(env.PRODUCT_LINKS) : {})
  };

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

function findPurchasedPriceIds(event) {
  const items = (event.data && event.data.items) || [];
  const priceIds = [];
  items.forEach((item) => {
    const priceId = item.price_id || (item.price && item.price.id);
    if (priceId && !priceIds.includes(priceId)) priceIds.push(priceId);
  });
  return priceIds.filter((priceId) => PRODUCT_BY_PRICE_ID[priceId]);
}

function findPurchasedPriceIdsFromTransaction(transaction) {
  const items = transaction?.items || [];
  const priceIds = [];
  items.forEach((item) => {
    const priceId = item.price_id || item.price?.id || item.price?.price_id;
    if (priceId && PRODUCT_BY_PRICE_ID[priceId] && !priceIds.includes(priceId)) priceIds.push(priceId);
  });
  return priceIds;
}

async function getCustomerDetails(event, env) {
  const directCustomer = event.data?.customer || {};
  const directBilling = event.data?.billing_details || {};
  const directEmail = directCustomer.email || event.data?.customer_email || event.data?.email || directBilling.email;
  const directName = directCustomer.name || event.data?.customer_name || directBilling.name || directBilling.full_name;
  if (directEmail && directName) return { email: directEmail, name: directName };

  let apiCustomer = {};
  if (event.data?.customer_id && env.PADDLE_API_KEY) {
    const apiBase = env.PADDLE_API_BASE || 'https://api.paddle.com';
    const response = await fetch(`${apiBase}/customers/${event.data.customer_id}`, {
      headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, Accept: 'application/json' }
    });
    if (response.ok) apiCustomer = (await response.json())?.data || {};
  }

  return { email: directEmail || apiCustomer.email || null, name: directName || apiCustomer.name || null };
}

async function fetchPaddleTransaction(env, transactionId) {
  if (!env.PADDLE_API_KEY) throw new Error('Missing PADDLE_API_KEY');
  const apiBase = env.PADDLE_API_BASE || 'https://api.paddle.com';
  const response = await fetch(`${apiBase}/transactions/${encodeURIComponent(transactionId)}?include=customer`, {
    headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, Accept: 'application/json' }
  });
  if (!response.ok) return { ok: false, status: response.status };
  const payload = await response.json();
  return { ok: true, data: payload.data };
}

function transactionCustomerEmail(transaction) {
  return transaction?.customer?.email || transaction?.customer_email || transaction?.billing_details?.email || null;
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'there';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buttonLink(url, label) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 16px;background:#0B1220;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">${escapeHtml(label)}</a>`;
}

function buildDeliveryEmail(products, transactionId, supportEmail, customerName) {
  const greetingName = customerName ? escapeHtml(firstName(customerName)) : 'there';
  const productBlocks = products.map((product) => {
    const links = [];
    if (product.excelUrl) links.push(buttonLink(product.excelUrl, 'Download Excel file'));
    if (product.googleSheetUrl) links.push(buttonLink(product.googleSheetUrl, 'Open Google Sheets copy'));
    if (product.guideUrl) links.push(buttonLink(product.guideUrl, 'Open setup guide'));
    return `<div style="padding:22px 0;border-top:1px solid #eadfbd;"><h2 style="font-size:18px;margin:0 0 12px;color:#0B1220;">${escapeHtml(product.name)}</h2><div style="display:flex;flex-direction:column;gap:10px;">${links.join('')}</div></div>`;
  }).join('');

  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0B1220;line-height:1.6;background:#ffffff;"><div style="padding:28px 28px 8px;border-bottom:4px solid #D7B46A;"><p style="margin:0 0 6px;color:#7c6a36;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">AF Wealth Mindset</p><h1 style="font-size:25px;line-height:1.25;margin:0;color:#0B1220;">Your purchase is ready</h1></div><div style="padding:26px 28px;"><p style="font-size:16px;margin:0 0 12px;">Hi ${greetingName},</p><p style="margin:0 0 18px;">Thank you for your purchase. Your product access is ready below.</p>${productBlocks}<div style="margin-top:22px;padding:16px;background:#f7f4ea;border:1px solid #eadfbd;border-radius:10px;"><p style="margin:0;font-size:14px;color:#4f5562;">Save this email so you can return to your files later. You can also get your files from the order download page on our website using this email address and your transaction ID. If a Google Sheets link opens, choose <strong>Make a copy</strong> to save it to your own Google Drive.</p></div><p style="margin:16px 0 0;">${buttonLink(`${BASE_URL}/orders.html`, 'Open order download page')}</p><p style="font-size:13px;color:#586071;margin:22px 0 0;">Transaction: ${escapeHtml(transactionId || 'Paddle')}</p><p style="font-size:14px;margin:14px 0 0;">Need help? Reply to this email or contact <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p></div></div>`;

  const text = [
    `Hi ${customerName ? firstName(customerName) : 'there'},`,
    '',
    'Thank you for your purchase. Your product access is ready below.',
    '',
    ...products.flatMap((product) => {
      const lines = [product.name];
      if (product.excelUrl) lines.push(`Excel: ${product.excelUrl}`);
      if (product.googleSheetUrl) lines.push(`Google Sheets copy: ${product.googleSheetUrl}`);
      if (product.guideUrl) lines.push(`Guide: ${product.guideUrl}`);
      lines.push('');
      return lines;
    }),
    'Save this email so you can return to your files later.',
    `You can also get your files from the order download page: ${BASE_URL}/orders.html`,
    'Use the same email address and this transaction ID.',
    `Transaction: ${transactionId || 'Paddle'}`,
    `Support: ${supportEmail}`
  ].join('\n');

  return { html, text };
}

async function sendDeliveryEmail(env, to, products, transactionId, customerName) {
  if (!env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  const supportEmail = env.SUPPORT_EMAIL || 'sales@afwealthmindset.com';
  const fromEmail = env.FROM_EMAIL || `AF Wealth Mindset <${supportEmail}>`;
  const message = buildDeliveryEmail(products, transactionId, supportEmail, customerName);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: products.length === 1 ? `Your ${products[0].name} is ready` : 'Your AF Wealth Mindset products are ready',
      html: message.html,
      text: message.text
    })
  });
  if (!response.ok) throw new Error(`Email failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function handlePaddleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('Paddle-Signature');
  const toleranceSeconds = Number(env.PADDLE_WEBHOOK_TOLERANCE_SECONDS || 300);
  const verified = await verifyPaddleWebhook(rawBody, signature, env.PADDLE_WEBHOOK_SECRET, toleranceSeconds);
  if (!verified) return json(request, { error: 'Invalid Paddle signature' }, 401);

  const event = JSON.parse(rawBody);
  if (!['transaction.completed', 'transaction.paid'].includes(event.event_type)) {
    return json(request, { ok: true, ignored: event.event_type });
  }

  const priceIds = findPurchasedPriceIds(event);
  if (priceIds.length === 0) return json(request, { error: 'No supported AF Wealth product in webhook' }, 422);

  const productLinks = readProductLinks(env);
  const products = priceIds.map((priceId) => ({ ...PRODUCT_BY_PRICE_ID[priceId], ...(productLinks[priceId] || {}) }));
  const customer = await getCustomerDetails(event, env);
  if (!customer.email) return json(request, { error: 'Customer email not found. Add PADDLE_API_KEY so the Worker can fetch customer details.' }, 500);

  const transactionId = event.data?.id || event.notification_id || event.event_id;
  await sendDeliveryEmail(env, customer.email, products, transactionId, customer.name);
  return json(request, { ok: true, delivered_to: customer.email, products: products.map((product) => product.name) });
}

async function handleOrderDownloads(request, env) {
  const body = await request.json();
  const email = normalizeEmail(body.email);
  const transactionId = String(body.transactionId || body.orderId || '').trim();
  if (!email || !transactionId) return json(request, { error: 'Enter the email and transaction ID from your receipt.' }, 400);
  if (!transactionId.startsWith('txn_')) return json(request, { error: 'Enter the Paddle transaction ID that starts with txn_.' }, 400);

  const transactionResult = await fetchPaddleTransaction(env, transactionId);
  if (!transactionResult.ok) return json(request, { error: 'Order not found. Check the transaction ID from your receipt.' }, 404);

  const transaction = transactionResult.data;
  if (!['completed', 'paid', 'billed'].includes(transaction.status)) {
    return json(request, { error: 'This order is not marked paid yet.' }, 403);
  }

  const paddleEmail = normalizeEmail(transactionCustomerEmail(transaction));
  if (!paddleEmail || paddleEmail !== email) return json(request, { error: 'This email does not match that order.' }, 403);

  const priceIds = findPurchasedPriceIdsFromTransaction(transaction);
  if (priceIds.length === 0) return json(request, { error: 'No AF Wealth Mindset download products were found for this order.' }, 404);

  const productLinks = readProductLinks(env);
  const products = priceIds.map((priceId) => ({
    id: PRODUCT_BY_PRICE_ID[priceId].id,
    name: PRODUCT_BY_PRICE_ID[priceId].name,
    ...(productLinks[priceId] || {})
  }));

  return json(request, { ok: true, transactionId: transaction.id, products });
}

async function handleTestDelivery(request, env) {
  if (!env.DELIVERY_TEST_TOKEN) return json(request, { error: 'Missing DELIVERY_TEST_TOKEN' }, 403);
  if ((request.headers.get('Authorization') || '') !== `Bearer ${env.DELIVERY_TEST_TOKEN}`) {
    return json(request, { error: 'Unauthorized' }, 401);
  }
  const body = await request.json();
  const priceId = body.priceId || 'pri_01kpqtwd3gxej4n3zmwj7q3jna';
  const product = PRODUCT_BY_PRICE_ID[priceId];
  if (!product) return json(request, { error: 'Unknown priceId' }, 422);
  const productLinks = readProductLinks(env);
  const deliveryProduct = { ...product, ...(productLinks[priceId] || {}) };
  await sendDeliveryEmail(env, body.email, [deliveryProduct], 'TEST-DELIVERY', body.name || 'Test Buyer');
  return json(request, { ok: true, delivered_to: body.email, product: deliveryProduct.name });
}

async function handleDownload(request, env, key) {
  if (!key || key.includes('..') || key.includes('/')) return json(request, { error: 'Invalid key' }, 422);
  const r2Key = R2_FILE_BY_DOWNLOAD_KEY[key] || key;
  const object = await env.PRODUCTS.get(r2Key);
  if (!object) return json(request, { error: 'File not found' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Disposition', `attachment; filename="${key}"`);
  headers.set('Cache-Control', 'private, no-store');
  return new Response(object.body, { headers });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request) });

    try {
      if (path === '/api/health' && request.method === 'GET') {
        return json(request, { status: 'ok', worker: 'afwm-delivery', version: '5.4.0', payment_provider: 'paddle', delivery: 'email+r2+order-lookup' });
      }
      if (path === '/api/paddle-webhook' && request.method === 'POST') return handlePaddleWebhook(request, env);
      if (path === '/api/order-downloads' && request.method === 'POST') return handleOrderDownloads(request, env);
      if (path === '/api/test-delivery' && request.method === 'POST') return handleTestDelivery(request, env);
      if (path.startsWith('/api/download/') && request.method === 'GET') return handleDownload(request, env, decodeURIComponent(path.replace('/api/download/', '')));
      return json(request, { error: 'Not Found' }, 404);
    } catch (error) {
      return json(request, { error: error.message || 'Server error' }, 500);
    }
  }
};
