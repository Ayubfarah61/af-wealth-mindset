// AF Wealth Mindset - Shared App Logic

// One readable finance palette for the full website.
var AFWM_THEME = {
  background: '#F8F6F1',
  surface: '#FFFFFF',
  text: '#102033',
  muted: '#667085',
  navy: '#0B1F33',
  teal: '#0E7C75',
  gold: '#B88A2E',
  border: '#E5DED2',
  danger: '#C2413B'
};

function afwmIsHomePage() {
  var path = window.location.pathname.replace(/\/+/g, '/');
  return path === '/' || path === '/index.html' || path.endsWith('/index.html');
}

function afwmMoneyFormat(n) {
  return '$' + parseFloat(n).toFixed(2).replace('.00', '');
}

function setReadableStyle(el) {
  if (!el || !el.style) return;
  var style = (el.getAttribute('style') || '').toLowerCase();
  var text = (el.textContent || '').trim();
  var isButton = el.matches('button, a, [role="button"]') || el.closest('button');
  var isCta = isButton && (style.indexOf('1fe6d1') !== -1 || style.indexOf('buyNow') !== -1 || text.indexOf('GET') !== -1 || text.indexOf('Access') !== -1 || text.indexOf('Partner') !== -1);

  if (style.indexOf('#0b1220') !== -1 || style.indexOf('rgba(11,18,32') !== -1 || style.indexOf('rgba(11, 18, 32') !== -1) {
    if (!isCta) {
      el.style.background = AFWM_THEME.surface;
      el.style.backgroundColor = AFWM_THEME.surface;
    }
  }
  if (style.indexOf('#f6f1e7') !== -1) el.style.color = AFWM_THEME.text;
  if (style.indexOf('rgba(246,241,231') !== -1 || style.indexOf('rgba(246, 241, 231') !== -1) el.style.color = AFWM_THEME.muted;
  if (style.indexOf('#d7b46a') !== -1) el.style.color = AFWM_THEME.gold;
  if (style.indexOf('#1fe6d1') !== -1) el.style.color = AFWM_THEME.teal;

  if (style.indexOf('rgba(215,180,106') !== -1 || style.indexOf('rgba(215, 180, 106') !== -1) el.style.borderColor = AFWM_THEME.border;
  if (style.indexOf('rgba(31,230,209') !== -1 || style.indexOf('rgba(31, 230, 209') !== -1) el.style.borderColor = 'rgba(14,124,117,0.24)';

  if (isCta) {
    el.style.background = AFWM_THEME.teal;
    el.style.backgroundColor = AFWM_THEME.teal;
    el.style.color = '#FFFFFF';
    el.style.borderColor = AFWM_THEME.teal;
    el.style.boxShadow = '0 10px 24px rgba(14,124,117,0.18)';
  }
}

function simplifyHomePage() {
  if (!afwmIsHomePage()) return;

  var hero = document.querySelector('main > div[style*="radial-gradient"]');
  if (hero) {
    hero.style.padding = '22px 18px 18px';
    hero.style.marginBottom = '8px';
    hero.style.background = 'linear-gradient(135deg,#FFFFFF 0%,#F8F6F1 68%,rgba(14,124,117,0.08) 100%)';
    hero.style.border = '1px solid ' + AFWM_THEME.border;
    hero.style.borderRadius = '14px';
    var logo = hero.querySelector('img');
    if (logo) {
      logo.style.width = '112px';
      logo.style.height = '112px';
    }
    var title = hero.querySelector('h1');
    if (title) {
      title.style.marginTop = '8px';
      title.style.color = AFWM_THEME.gold;
      title.style.fontSize = '1rem';
    }
    var sub = hero.querySelector('p');
    if (sub) {
      sub.style.color = AFWM_THEME.muted;
      sub.style.textAlign = 'center';
      sub.style.maxWidth = '680px';
    }
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll('section, main > div'));
  for (var i = 0; i < sections.length; i++) {
    var txt = (sections[i].textContent || '').replace(/\s+/g, ' ').trim();
    if (txt.indexOf('Pick the template that matches') !== -1 || txt.indexOf('Spreadsheet Systems That Make Money Clear') !== -1) {
      sections[i].style.display = 'none';
    }
  }

  var productList = null;
  var divs = document.querySelectorAll('main > div');
  for (var j = 0; j < divs.length; j++) {
    if ((divs[j].textContent || '').indexOf('Ultimate Budget Planner') !== -1) {
      productList = divs[j];
      break;
    }
  }
  if (productList) {
    productList.style.marginTop = '14px';
    productList.style.marginBottom = '42px';
    productList.style.gap = '12px';
  }
}

function applyUnifiedTheme() {
  if (!document.getElementById('afwm-unified-theme')) {
    var css = document.createElement('style');
    css.id = 'afwm-unified-theme';
    css.textContent = `
      :root { color-scheme: light; }
      html, body { background: ${AFWM_THEME.background} !important; color: ${AFWM_THEME.text} !important; }
      body, p, span, div, li, summary, input, textarea { color: ${AFWM_THEME.text}; }
      header { background: rgba(255,255,255,0.97) !important; border-bottom: 1px solid ${AFWM_THEME.border} !important; }
      footer { background: ${AFWM_THEME.surface} !important; border-top: 1px solid ${AFWM_THEME.border} !important; }
      main { background: transparent !important; }
      .bg-midnight, .bg-midnight\/40, .bg-midnight\/80, .dark\:bg-background-dark { background-color: ${AFWM_THEME.background} !important; }
      .bg-white { background-color: ${AFWM_THEME.surface} !important; }
      .text-ivory, .text-ivory\/30, .text-ivory\/40, .text-ivory\/50, .text-ivory\/60, .text-ivory\/70 { color: ${AFWM_THEME.text} !important; }
      .text-gold, .hover\:text-gold:hover, [class*="text-gold"] { color: ${AFWM_THEME.gold} !important; }
      .text-signature-teal, [class*="text-signature-teal"] { color: ${AFWM_THEME.teal} !important; }
      .bg-gold { background-color: ${AFWM_THEME.gold} !important; color: ${AFWM_THEME.navy} !important; }
      .bg-signature-teal, .bg-signature-teal\/10, .hover\:bg-signature-teal\/20:hover { background-color: rgba(14,124,117,0.10) !important; }
      .border-gold\/10, .border-gold\/15, .border-gold\/20, .border-gold\/25, .border-gold\/30 { border-color: ${AFWM_THEME.border} !important; }
      .border-signature-teal\/15, .border-signature-teal\/20, .border-signature-teal\/30 { border-color: rgba(14,124,117,0.24) !important; }
      section, details, [class*="rounded"], [style*="border-radius"] { border-color: ${AFWM_THEME.border}; }
      input { background: ${AFWM_THEME.surface} !important; color: ${AFWM_THEME.text} !important; border-color: ${AFWM_THEME.border} !important; }
      h1, h2, h3, h4, strong { color: ${AFWM_THEME.text} !important; }
      h1 span, h2 span, .price, [class*="text-gold"] { color: ${AFWM_THEME.gold} !important; }
      p { line-height: 1.65; }
      a { text-decoration-thickness: 1px; }
      button[onclick*="buyNow"], a[href*="moneyripples"], button[style*="GET"], button[style*="Access"], a[style*="Partner"] {
        background: ${AFWM_THEME.teal} !important;
        color: #FFFFFF !important;
        border-color: ${AFWM_THEME.teal} !important;
      }
      @media (max-width: 640px) {
        main { padding-left: 14px !important; padding-right: 14px !important; }
        h1 { font-size: clamp(1.75rem, 9vw, 2.7rem) !important; line-height: 1.08 !important; }
        h2 { line-height: 1.16 !important; }
        button, a { max-width: 100%; }
      }
    `;
    document.head.appendChild(css);
  }

  document.documentElement.classList.remove('dark');
  document.body.style.background = AFWM_THEME.background;
  document.body.style.color = AFWM_THEME.text;

  var styled = document.querySelectorAll('[style]');
  for (var i = 0; i < styled.length; i++) setReadableStyle(styled[i]);

  var cards = document.querySelectorAll('section, details, [style*="border-radius"], .rounded-xl, .rounded-2xl');
  for (var c = 0; c < cards.length; c++) {
    var el = cards[c];
    if (!el.closest('button') && !el.closest('a')) {
      var bg = (el.style.background || '').toLowerCase();
      if (bg.indexOf('linear-gradient') === -1 && bg.indexOf('radial-gradient') === -1) el.style.backgroundColor = AFWM_THEME.surface;
      el.style.borderColor = AFWM_THEME.border;
    }
  }

  simplifyHomePage();
}

function scheduleTheme() {
  applyUnifiedTheme();
  setTimeout(applyUnifiedTheme, 150);
  setTimeout(applyUnifiedTheme, 500);
  setTimeout(applyUnifiedTheme, 1200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleTheme);
} else {
  scheduleTheme();
}
window.addEventListener('load', scheduleTheme);
var afwmThemeInterval = setInterval(applyUnifiedTheme, 1200);
if (window.MutationObserver) {
  var afwmObserver = new MutationObserver(function() { scheduleTheme(); });
  afwmObserver.observe(document.documentElement, { childList: true, subtree: true });
}

// ============= SOCIAL LINKS =============
var SOCIAL_LINKS = [
  { fa: 'fa-tiktok',     url: 'https://www.tiktok.com/@afwealthsystems',    title: 'TikTok' },
  { fa: 'fa-youtube',    url: 'https://www.youtube.com/@afwealthmindset',   title: 'YouTube' },
  { fa: 'fa-instagram',  url: 'https://www.instagram.com/afwealthmindset/', title: 'Instagram' },
  { fa: 'fa-facebook',   url: 'https://www.facebook.com/AFWealthMindset',   title: 'Facebook' },
  { fa: 'fa-x-twitter',  url: 'https://x.com/AFWealth67',                   title: 'X / Twitter' }
];

function renderSocialFooter(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var html = '';
  for (var i = 0; i < SOCIAL_LINKS.length; i++) {
    var s = SOCIAL_LINKS[i];
    html += '<a style="color:' + AFWM_THEME.gold + ';font-size:22px;transition:color 0.2s;" href="' + s.url + '" target="_blank" rel="noopener" title="' + s.title + '" onmouseover="this.style.color=\'' + AFWM_THEME.teal + '\'" onmouseout="this.style.color=\'' + AFWM_THEME.gold + '\'">';
    html += '<i class="fa-brands ' + s.fa + '"></i></a>';
  }
  el.innerHTML = html;
}

// ============= PRODUCTS =============
var PRODUCTS = [
  {
    id: 2,
    name: 'The Ultimate Budget Planner',
    originalPrice: 29.99,
    price: 7.99,
    edition: 'Excel & Google Sheets Template',
    badge: 'New',
    image: '/images/product2.png',
    heroImage: '/images/product2.png',
    description: 'Track income, expenses, budgets, and savings with a clean automated spreadsheet built for real life. Excel and Google Sheets are both included.',
    features: [
      { icon: 'bar_chart',      title: '11 Automated Charts',           desc: 'Dashboards that update as you type' },
      { icon: 'table_chart',    title: '8 Linked Sheets',               desc: 'Setup, Income, Expenses, Monthly, Annual and more' },
      { icon: 'laptop',         title: 'Excel & Google Sheets',         desc: 'Both formats included' },
      { icon: 'verified_user',  title: '14-Day Money-Back Guarantee',   desc: 'Full refund, no questions asked' }
    ]
  },
  {
    id: 3,
    name: 'The Profit Tracker',
    originalPrice: 49,
    price: 7.99,
    edition: 'Excel Template (.xlsx)',
    badge: 'New',
    image: '/images/product3.png',
    heroImage: '/images/product3.png',
    description: 'Track income, expenses, profit, and growth with monthly, annual, and 5-year dashboards. Delivered as an Excel file.',
    features: [
      { icon: 'attach_money',  title: 'Income & Expense Tracker',      desc: 'Transactions auto-categorized and auto-totaled' },
      { icon: 'dashboard',     title: 'Monthly + Annual Dashboards',   desc: 'Auto-updating visuals for profit clarity' },
      { icon: 'trending_up',   title: '5-Year Growth Dashboard',       desc: 'See your business trend over time' },
      { icon: 'verified_user', title: '14-Day Money-Back Guarantee',   desc: 'Full refund, no questions asked' }
    ]
  },
  {
    id: 4,
    name: 'Debt Payoff Dashboard',
    originalPrice: 29.99,
    price: 7.99,
    edition: 'Excel & Google Sheets Template',
    badge: 'New',
    image: '/images/product4.png',
    heroImage: '/images/product4.png',
    description: 'Track up to 6 debt accounts, visualize payoff progress, and see where to focus first. Private, simple, and subscription-free.',
    features: [
      { icon: 'dashboard',     title: 'Real-Time Debt Dashboard',     desc: 'Total debt, interest, and net reduction' },
      { icon: 'flag',          title: 'Smart Priority Alerts',        desc: 'Flags your highest-interest debt automatically' },
      { icon: 'trending_down', title: 'Visual Progress Charts',       desc: 'Watch debt move downward month by month' },
      { icon: 'verified_user', title: '14-Day Money-Back Guarantee',  desc: 'Full refund, no questions asked' }
    ]
  },
  {
    id: 5,
    name: '12-Month Cash Flow Budget',
    originalPrice: 29.99,
    price: 7.99,
    edition: 'Excel & Google Sheets Template',
    badge: 'New',
    image: '/images/product5.png',
    heroImage: '/images/product5.png',
    description: 'Plan money coming in and money going out across a full year, with a dashboard and low-balance alert.',
    features: [
      { icon: 'account_balance_wallet', title: '12-Month Cash Flow Sheet',  desc: 'Inflows and outflows tracked side-by-side' },
      { icon: 'dashboard',              title: 'Executive Dashboard',        desc: 'Live KPI tiles and charts' },
      { icon: 'warning',                title: 'Minimum Balance Alert',      desc: 'Warns before a month dips too low' },
      { icon: 'verified_user',          title: '14-Day Money-Back Guarantee', desc: 'Full refund, no questions asked' }
    ]
  }
];

// ============= AUTH =============
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('afwm_user') || 'null'); } catch(e) { return null; }
}
function isLoggedIn() { return !!getCurrentUser(); }

function register(name, email, password) {
  var users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
  if (users.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); }))
    return { error: 'An account with this email already exists.' };
  var user = { id: Date.now(), name: name, email: email, password: password, orders: [], joinedAt: new Date().toISOString() };
  users.push(user);
  localStorage.setItem('afwm_users', JSON.stringify(users));
  localStorage.setItem('afwm_user', JSON.stringify(user));
  return { success: true, user: user };
}

function login(email, password) {
  var users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
  var user = users.find(function(u) { return u.email.toLowerCase() === email.toLowerCase() && u.password === password; });
  if (!user) return { error: 'Invalid email or password.' };
  localStorage.setItem('afwm_user', JSON.stringify(user));
  return { success: true, user: user };
}

function logout() {
  localStorage.removeItem('afwm_user');
  window.location.href = '/';
}

// ============= ORDERS =============
function addOrder(productId, amount, paymentMethod, transactionId) {
  var product = null;
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id == productId) { product = PRODUCTS[i]; break; }
  }
  var order = {
    id: 'ORD-' + Date.now(),
    productId: productId,
    productName: product ? product.name : 'Digital Product',
    productImage: product ? product.image : '',
    amount: amount,
    paymentMethod: paymentMethod,
    transactionId: transactionId,
    status: 'Completed',
    date: new Date().toISOString()
  };
  var user = getCurrentUser();
  if (user) {
    var users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
    var idx = -1;
    for (var j = 0; j < users.length; j++) { if (users[j].id === user.id) { idx = j; break; } }
    if (idx !== -1) {
      if (!users[idx].orders) users[idx].orders = [];
      users[idx].orders.unshift(order);
      localStorage.setItem('afwm_users', JSON.stringify(users));
      localStorage.setItem('afwm_user', JSON.stringify(users[idx]));
    }
  }
  localStorage.setItem('afwm_last_order', JSON.stringify(order));
  return order;
}

function getOrders() {
  var user = getCurrentUser();
  if (!user) return [];
  var users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === user.id) return users[i].orders || [];
  }
  return [];
}

// ============= UTILS =============
function getProductFromURL() {
  var id = parseInt(new URLSearchParams(window.location.search).get('id'));
  for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) return PRODUCTS[i]; }
  return PRODUCTS[0];
}

function formatPrice(n) { return afwmMoneyFormat(n); }

function initHeader() {
  var user = getCurrentUser();
  var link = document.getElementById('nav-auth-link');
  if (link) {
    if (user) {
      link.textContent = user.name.split(' ')[0];
      link.href = '/profile.html';
      link.classList.add('text-gold');
    } else {
      link.textContent = 'Sign Up';
      link.href = '/signup.html';
    }
  }
  scheduleTheme();
}
