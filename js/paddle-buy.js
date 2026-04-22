// ── Paddle Buy — shared across product & pricing pages ────────
// Drop-in: include AFTER app.js on any page that has Buy buttons

var PADDLE_TOKEN = 'live_0096b61dc9f98e29253a9991992';

var PADDLE_PRICE_MAP = {
  2: 'pri_01kpqtwd3gxej4n3zmwj7q3jna',
  3: 'pri_01kpr10frj3w82ek1jjbzrd9wn',
  4: 'pri_01kpr12ct1sz1aqvnyweskx44x',
  5: 'pri_01kpr142by79r7r16pg9xgv570'
};

Paddle.Initialize({
  token: PADDLE_TOKEN,
  eventCallback: function (data) {
    if (data.name === 'checkout.completed') {
      _paddleSuccess(data);
    }
  }
});

// Called directly from every Buy / Get Access button
function buyNow(productId) {
  var priceId = PADDLE_PRICE_MAP[productId];
  if (!priceId) return;
  Paddle.Checkout.open({
    settings: { displayMode: 'overlay', theme: 'dark', locale: 'en' },
    items:    [{ priceId: priceId, quantity: 1 }]
  });
}

// Show success overlay after payment — no redirect, no new page
function _paddleSuccess(data) {
  var txId = (data.data && data.data.transaction_id)
    ? data.data.transaction_id : ('PAD-' + Date.now());

  // Try to figure out which product was bought from the price ID
  var boughtPriceId = data.data && data.data.items && data.data.items[0]
    ? data.data.items[0].price_id : null;
  if (boughtPriceId && typeof addOrder === 'function') {
    for (var pid in PADDLE_PRICE_MAP) {
      if (PADDLE_PRICE_MAP[pid] === boughtPriceId) {
        addOrder(parseInt(pid), 7.99, 'Paddle', txId);
        break;
      }
    }
  }

  // Build and inject success overlay
  var el = document.createElement('div');
  el.id  = 'paddle-success-overlay';
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'background:rgba(11,18,32,0.96)', 'backdrop-filter:blur(10px)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'padding:24px', 'font-family:Manrope,sans-serif'
  ].join(';');

  el.innerHTML =
    '<div style="max-width:420px;width:100%;background:#0d1628;border:1px solid rgba(31,230,209,0.25);'
    + 'border-radius:24px;padding:48px 32px;text-align:center;">'

    + '<span class="material-symbols-outlined" style="font-size:64px;color:#1FE6D1;display:block;margin-bottom:20px;">check_circle</span>'

    + '<h2 style="font-size:1.6rem;font-weight:800;color:#D7B46A;margin:0 0 12px;">You\'re all set!</h2>'

    + '<p style="color:rgba(246,241,231,0.6);font-size:0.9rem;line-height:1.7;margin:0 0 8px;">'
    + 'Payment confirmed. Your download link is heading to your inbox right now.'
    + '</p>'

    + '<p style="color:rgba(246,241,231,0.3);font-size:0.75rem;margin:0 0 28px;">'
    + 'Didn\'t get it? Check spam or email '
    + '<a href="mailto:sales@afwealthmindset.com" style="color:#1FE6D1;">sales@afwealthmindset.com</a>'
    + '</p>'

    + '<a href="/index.html" style="display:inline-block;padding:14px 36px;background:#D7B46A;'
    + 'color:#0B1220;font-weight:800;border-radius:12px;font-size:0.9rem;text-decoration:none;'
    + 'letter-spacing:0.03em;">Back to Home</a>'

    + '</div>';

  document.body.appendChild(el);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
