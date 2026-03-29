// AF Wealth Mindset — Shared App Logic

// ============= SOCIAL LINKS =============
var SOCIAL_LINKS = [
  { fa: 'fa-tiktok',     url: 'https://www.tiktok.com/@afwealthsystems',    title: 'TikTok' },
  { fa: 'fa-youtube',    url: 'https://www.youtube.com/@afwealthmindset',   title: 'YouTube' },
  { fa: 'fa-instagram',  url: 'https://www.instagram.com/afwealthmindset/', title: 'Instagram' },
  { fa: 'fa-facebook',   url: 'https://www.facebook.com/AFWealthMidnset',   title: 'Facebook' },
  { fa: 'fa-x-twitter',  url: 'https://x.com/AFWealth67',                   title: 'X / Twitter' }
];

function renderSocialFooter(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var html = '';
  for (var i = 0; i < SOCIAL_LINKS.length; i++) {
    var s = SOCIAL_LINKS[i];
    html += '<a style="color:#D7B46A;font-size:22px;transition:color 0.2s;" href="' + s.url + '" target="_blank" rel="noopener" title="' + s.title + '" onmouseover="this.style.color=\'#1FE6D1\'" onmouseout="this.style.color=\'#D7B46A\'">';
    html += '<i class="fa-brands ' + s.fa + '"></i></a>';
  }
  el.innerHTML = html;
}

// ============= PRODUCTS =============
var PRODUCTS = [
  {
    id: 1,
    name: 'Cashflow Secrets — The Course That Changes Everything',
    originalPrice: 400,
    price: 97,
    edition: '11-Module Digital Course',
    badge: 'Featured',
    affiliateUrl: 'https://moneyripples.com/cashflow-secrets-affiliate/?aff=AyubFarah67',
    image: '/images/product1.jpg',
    heroImage: '/images/product1.jpg',
    description: 'Stop trading your time for money. Created by self-made millionaire Chris Miles (CNN Money, US News, Bankrate), Cashflow Secrets is the step-by-step system that takes you from financial stress to financial freedom — without a new job, side hustle, or extreme sacrifice.',
    features: [
      { icon: 'play_circle',   title: '11 In-Depth Modules',            desc: 'Mindset, tracking, debt, passive income and more' },
      { icon: 'calculate',     title: 'Cashflow Optimizer Spreadsheet', desc: 'Your personal financial command centre — FREE inside' },
      { icon: 'verified_user', title: '60-Day Money-Back Guarantee',    desc: 'Zero risk — full refund if not satisfied' },
      { icon: 'person',        title: 'By Chris Miles',                 desc: 'Self-made millionaire featured on CNN Money and US News' }
    ],
    modules: [
      'What Needs to Change (Introduction)',
      'The Scarcity Mindset Dilemma',
      'Track and Plan Your Spending (Without Budgeting)',
      'Sell Your Unused Assets',
      'Insurance Savings Secrets',
      'Hidden Tax Savings',
      'Good Debt vs. Bad Debt',
      'Passive vs. Active Income',
      'Infinite Banking and Double Arbitrage',
      'Using Mint to Track Spending',
      'Cashflow Optimization + Spreadsheet'
    ]
  },
  {
    id: 2,
    name: 'The Money Control Code',
    originalPrice: 14.99,
    price: 6.99,
    edition: '6-Chapter Digital Guide',
    badge: 'Best Value',
    image: '/images/product2.png',
    heroImage: '/images/product2.png',
    description: 'Stop letting your money run your life. The Money Control Code reveals why willpower NEVER works with money — and replaces it with a structural 4-pillar system that runs on autopilot, giving you total authority over every dollar you earn.',
    features: [
      { icon: 'auto_stories',  title: '6 Power-Packed Chapters',      desc: 'From income illusion to total debt elimination' },
      { icon: 'description',   title: 'Personal Financial Rule Sheet', desc: 'Your written financial constitution — print and use today' },
      { icon: 'checklist',     title: 'Weekly Review Template',        desc: '15-min weekly ritual to keep your money on track' },
      { icon: 'verified_user', title: '30-Day Money-Back Guarantee',   desc: 'Zero risk — every penny back, no questions asked' }
    ]
  },
  {
    id: 3,
    name: 'Personal Finance Tracker',
    originalPrice: null,
    price: null,
    edition: 'Digital Tool',
    badge: 'Coming Soon',
    comingSoon: true,
    image: '/images/logo.png',
    heroImage: '/images/logo.png',
    description: 'A comprehensive personal finance tracking system to manage your income, expenses, savings goals and investments — all in one place. Coming soon.',
    features: [
      { icon: 'account_balance_wallet', title: 'Income and Expense Tracking', desc: 'Monitor every dollar in and out' },
      { icon: 'savings',                title: 'Savings Goal Planner',        desc: 'Set and hit your financial milestones' },
      { icon: 'trending_up',            title: 'Investment Dashboard',        desc: 'See your net worth grow over time' },
      { icon: 'notifications',          title: 'Smart Alerts',                desc: 'Never miss a bill or overspend again' }
    ]
  },
  {
    id: 4,
    name: 'Small Business Bookkeeping System',
    originalPrice: null,
    price: null,
    edition: 'Business Tool',
    badge: 'Coming Soon',
    comingSoon: true,
    image: '/images/logo.png',
    heroImage: '/images/logo.png',
    description: 'A complete bookkeeping system built for small business owners. Manage invoices, expenses, payroll, and tax-ready reports without an accountant. Coming soon.',
    features: [
      { icon: 'receipt_long',    title: 'Invoice Management', desc: 'Create and send professional invoices' },
      { icon: 'account_balance', title: 'Expense Tracking',   desc: 'Categorize and monitor all business costs' },
      { icon: 'groups',          title: 'Payroll Ready',      desc: 'Simplified payroll for small teams' },
      { icon: 'description',     title: 'Tax-Ready Reports',  desc: 'Export clean reports for your accountant' }
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

function formatPrice(n) { return '$' + parseFloat(n).toFixed(2); }

function initHeader() {
  var user = getCurrentUser();
  var link = document.getElementById('nav-auth-link');
  if (!link) return;
  if (user) {
    link.textContent = user.name.split(' ')[0];
    link.href = '/profile.html';
    link.classList.add('text-gold');
  } else {
    link.textContent = 'Sign Up';
    link.href = '/signup.html';
  }
}
