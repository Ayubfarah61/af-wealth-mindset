/**
 * AF Wealth Mindset - PayPal v6 CardFields Worker
 * Cloudflare Worker for handling PayPal Advanced Checkout
 * Deploy with: wrangler publish
 */

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  PAYPAL_CLIENT_ID_SANDBOX: 'AURFqW9BM7AQJBnTjmCKCcMuKKN-fxthcmfY7U5kuAHq1ttVmTwozQ3dtfcqnwg2Vu3yI8OydJAhJ9Z7',
  PAYPAL_SECRET_SANDBOX: 'EHpxFlZAjyLa0CmSRgSlNyyvCCGuqp8DMipSp8zjpQnNtnVo25aHGaqcEjHnxE-7w8EhO8SZ-yk0Ow3a',
  PAYPAL_API_BASE: 'https://api-m.sandbox.paypal.com', // SANDBOX
  CORS_ORIGIN: 'https://afwealthmindset.com'
};

// ============================================================
// CORS Headers
// ============================================================

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CONFIG.CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// ============================================================
// PayPal API Requests
// ============================================================

async function getPayPalAccessToken() {
  try {
    const auth = btoa(`${CONFIG.PAYPAL_CLIENT_ID_SANDBOX}:${CONFIG.PAYPAL_SECRET_SANDBOX}`);
    
    const response = await fetch(`${CONFIG.PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal token error:', error);
      throw new Error('Failed to get PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.error('Token fetch error:', err);
    throw err;
  }
}

async function createPayPalOrder(accessToken, orderData) {
  try {
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: orderData.amount
          },
          description: orderData.description,
          custom_id: orderData.email
        }
      ],
      payer: {
        email_address: orderData.email,
        name: {
          given_name: orderData.name || 'Customer'
        }
      },
      application_context: {
        return_url: `${CONFIG.CORS_ORIGIN}/orders.html?success=1`,
        cancel_url: `${CONFIG.CORS_ORIGIN}/checkout.html`,
        shipping_preference: 'NO_SHIPPING'
      }
    };

    const response = await fetch(`${CONFIG.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal order creation error:', error);
      throw new Error('Failed to create PayPal order');
    }

    const order = await response.json();
    console.log('Order created:', order.id);
    return order;
  } catch (err) {
    console.error('Order creation error:', err);
    throw err;
  }
}

async function capturePayPalOrder(accessToken, orderId) {
  try {
    const response = await fetch(`${CONFIG.PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal capture error:', error);
      throw new Error('Failed to capture PayPal order');
    }

    const order = await response.json();
    console.log('Order captured:', order.id);
    return order;
  } catch (err) {
    console.error('Capture error:', err);
    throw err;
  }
}

async function createCardFieldsSession(accessToken) {
  try {
    const response = await fetch(`${CONFIG.PAYPAL_API_BASE}/v3/payment-experience/payment-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: 'CARD_FIELDS_SESSION',
        payment_source: {
          card: {}
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('CardFields session error:', error);
      throw new Error('Failed to create CardFields session');
    }

    const session = await response.json();
    return session.id;
  } catch (err) {
    console.error('CardFields session error:', err);
    throw err;
  }
}

async function submitCardOrder(accessToken, orderData) {
  try {
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: orderData.amount
          },
          description: orderData.description,
          custom_id: orderData.email
        }
      ],
      payer: {
        email_address: orderData.email,
        name: {
          given_name: orderData.name || 'Customer'
        }
      },
      payment_source: {
        card: {
          number: orderData.cardNumber,
          expiry: orderData.cardExpiry,
          security_code: orderData.cardCvv,
          name: {
            given_name: orderData.cardholderName
          }
        }
      }
    };

    const response = await fetch(`${CONFIG.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Card order error:', error);
      throw new Error('Failed to process card payment');
    }

    const order = await response.json();
    return order;
  } catch (err) {
    console.error('Card order error:', err);
    throw err;
  }
}

// ============================================================
// Route Handlers
// ============================================================

async function handleCreateOrder(request) {
  try {
    const data = await request.json();
    
    // Validate input
    if (!data.amount || !data.email) {
      return new Response(JSON.stringify({ error: 'Missing amount or email' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Create order
    const order = await createPayPalOrder(accessToken, {
      amount: parseFloat(data.amount).toFixed(2),
      currency: data.currency || 'USD',
      description: data.description || 'Digital Product',
      email: data.email,
      name: data.name || 'Customer'
    });

    return new Response(JSON.stringify({
      id: order.id,
      status: order.status
    }), {
      status: 201,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Create order error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
}

async function handleCaptureOrder(request, orderId) {
  try {
    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Capture order
    const order = await capturePayPalOrder(accessToken, orderId);

    // Extract payment details
    const capture = order.purchase_units[0]?.payments?.captures[0];
    
    return new Response(JSON.stringify({
      id: order.id,
      status: order.status,
      capture_id: capture?.id,
      amount: capture?.amount?.value,
      payer_email: order.payer?.email_address
    }), {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Capture order error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
}

async function handleCardPayment(request) {
  try {
    const data = await request.json();
    
    // Validate input
    if (!data.amount || !data.email || !data.cardNumber || !data.cardExpiry || !data.cardCvv) {
      return new Response(JSON.stringify({ error: 'Missing card or order details' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Submit card order
    const order = await submitCardOrder(accessToken, {
      amount: parseFloat(data.amount).toFixed(2),
      currency: data.currency || 'USD',
      description: data.description || 'Digital Product',
      email: data.email,
      name: data.name || 'Customer',
      cardNumber: data.cardNumber,
      cardExpiry: data.cardExpiry,
      cardCvv: data.cardCvv,
      cardholderName: data.cardholderName || 'Customer'
    });

    // Extract payment details
    const capture = order.purchase_units[0]?.payments?.captures[0];

    return new Response(JSON.stringify({
      id: order.id,
      status: order.status,
      capture_id: capture?.id,
      amount: capture?.amount?.value || data.amount,
      payer_email: order.payer?.email_address || data.email
    }), {
      status: 201,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Card payment error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
}

async function handleHealthCheck() {
  return new Response(JSON.stringify({
    status: 'ok',
    worker: 'afwm-paypal-api',
    version: '1.0.0'
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
    if (path === '/paypal-api/health' && request.method === 'GET') {
      return handleHealthCheck();
    }

    if (path === '/paypal-api/checkout/orders/create' && request.method === 'POST') {
      return handleCreateOrder(request);
    }

    if (path === '/paypal-api/checkout/card/submit' && request.method === 'POST') {
      return handleCardPayment(request);
    }

    if (path.match(/^\/paypal-api\/checkout\/orders\/[a-zA-Z0-9-]+\/capture$/) && request.method === 'POST') {
      const orderId = path.split('/')[4];
      return handleCaptureOrder(request, orderId);
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
};
