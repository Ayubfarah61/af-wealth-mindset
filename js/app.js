// AF Wealth Mindset — Shared App Logic

// ============= SOCIAL LINKS =============
const SOCIAL_LINKS = [
  { icon: 'tiktok',       url: 'https://www.tiktok.com/@afwealthsystems',      title: 'TikTok' },
  { icon: 'photo_camera', url: 'https://www.instagram.com/afwealthmindset/',   title: 'Instagram' },
  { icon: 'face_6',       url: 'https://www.facebook.com/AFWealthMidnset',     title: 'Facebook' },
  { icon: 'close',        url: 'https://x.com/AFWealth67',                     title: 'X / Twitter' }
];

function renderSocialFooter(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <span class="text-signature-teal text-xs font-bold tracking-[0.2em] uppercase">Follow Us</span>
    <div class="flex justify-center gap-8">
      ${SOCIAL_LINKS.map(s => `
        <a class="text-gold hover:text-signature-teal transition-colors" href="${s.url}" target="_blank" rel="noopener" title="${s.title}">
          <span class="material-symbols-outlined text-2xl">${s.icon}</span>
        </a>`).join('')}
    </div>`;
}

// ============= PRODUCTS =============
const PRODUCTS = [
  {
    id: 1,
    name: "Cashflow Secrets",
    originalPrice: 400,
    price: 97,
    edition: "11-Module Digital Course",
    badge: "⭐ Featured",
    affiliateUrl: "https://moneyripples.com/cashflow-secrets-affiliate/?aff=AyubFarah67",
    image: "/images/product1.jpg",
    heroImage: "/images/product1.jpg",
    description: "Stop trading your time for money. Created by self-made millionaire Chris Miles (CNN Money, US News, Bankrate), Cashflow Secrets is the step-by-step system that takes you from financial stress to financial freedom — without a new job, side hustle, or extreme sacrifice.",
    fullDescription: `Stop Trading Your Time for Money. Start Making Money Work for YOU.

You've been working hard your entire life — and somehow there's still more month than money. You're tired. You're frustrated. And deep down, you KNOW there has to be a better way.

Cashflow Secrets is the step-by-step financial freedom course by self-made millionaire Chris Miles — as seen on CNN Money, US News, and Bankrate.com. Chris went from over $1 MILLION in debt after the 2008 recession to becoming a millionaire AGAIN by 2016. No new business. No side hustle. Just proven strategies to unlock the money already hiding in your life.`,
    features: [
      { icon: "play_circle",    title: "11 In-Depth Modules",               desc: "Mindset → tracking → debt → passive income & more" },
      { icon: "calculate",      title: "Cashflow Optimizer Spreadsheet",    desc: "Your personal financial command centre — FREE inside" },
      { icon: "verified_user",  title: "60-Day Money-Back Guarantee",       desc: "Zero risk — full refund if you're not satisfied" },
      { icon: "person",         title: "By Chris Miles",                    desc: "Self-made millionaire featured on CNN Money & US News" }
    ],
    modules: [
      "What Needs to Change (Introduction)",
      "The Scarcity Mindset Dilemma",
      "Track & Plan Your Spending (Without Budgeting)",
      "Sell Your Unused Assets",
      "Insurance Savings Secrets",
      "Hidden Tax Savings",
      "Good Debt vs. Bad Debt",
      "Passive vs. Active Income",
      "Infinite Banking & Double Arbitrage",
      "Using Mint to Track Spending",
      "Cashflow Optimization + Spreadsheet"
    ]
  },
  {
    id: 2,
    name: "The Money Control Code",
    originalPrice: 14.99,
    price: 6.99,
    edition: "6-Chapter Digital Guide",
    badge: "🔥 Best Value",
    image: "/images/product2.png",
    heroImage: "/images/product2.png",
    description: "Stop letting your money run your life. The Money Control Code reveals why willpower NEVER works with money — and replaces it with a structural 4-pillar system that runs on autopilot, giving you total authority over every dollar you earn.",
    fullDescription: `Stop Letting Your Money Run Your Life. It's Time to Take Back Control.

You're earning money — maybe even good money — and somehow there's still nothing left at the end of the month. You're not broke. You're not stupid. You're just running without a system. And that ends right here.

The Money Control Code is the step-by-step wealth-building guide that reveals why willpower NEVER works with money — and replaces it with a structural system that runs on autopilot. No new income needed. No extreme sacrifice. Just a proven 4-pillar system that puts YOU in command permanently.`,
    features: [
      { icon: "auto_stories",   title: "6 Power-Packed Chapters",          desc: "From income illusion to total debt elimination" },
      { icon: "description",    title: "Personal Financial Rule Sheet",     desc: "Your written financial constitution — print & use today" },
      { icon: "checklist",      title: "Weekly Review Template",            desc: "15-min weekly ritual to keep your money on track" },
      { icon: "verified_user",  title: "30-Day Money-Back Guarantee",       desc: "Zero risk — every penny back, no questions asked" }
    ]
  },
  {
    id: 3,
    name: "Personal Finance Tracker",
    originalPrice: null,
    price: null,
    edition: "Digital Tool",
    badge: "🔜 Coming Soon",
    comingSoon: true,
    image: "/images/logo.png",
    heroImage: "/images/logo.png",
    description: "A comprehensive personal finance tracking system to manage your income, expenses, savings goals and investments — all in one place. Coming soon.",
    features: [
      { icon: "account_balance_wallet", title: "Income & Expense Tracking", desc: "Monitor every dollar in and out" },
      { icon: "savings",                title: "Savings Goal Planner",      desc: "Set and hit your financial milestones" },
      { icon: "trending_up",            title: "Investment Dashboard",      desc: "See your net worth grow over time" },
      { icon: "notifications",          title: "Smart Alerts",              desc: "Never miss a bill or overspend again" }
    ]
  },
  {
    id: 4,
    name: "Small Business Bookkeeping System",
    originalPrice: null,
    price: null,
    edition: "Business Tool",
    badge: "🔜 Coming Soon",
    comingSoon: true,
    image: "/images/logo.png",
    heroImage: "/images/logo.png",
    description: "A complete bookkeeping system built for small business owners. Manage invoices, expenses, payroll, and tax-ready reports without an accountant. Coming soon.",
    features: [
      { icon: "receipt_long",   title: "Invoice Management",   desc: "Create and send professional invoices" },
      { icon: "account_balance",title: "Expense Tracking",     desc: "Categorize and monitor all business costs" },
      { icon: "groups",         title: "Payroll Ready",        desc: "Simplified payroll for small teams" },
      { icon: "description",    title: "Tax-Ready Reports",    desc: "Export clean reports for your accountant" }
    ]
  }
];

// ============= BANK DETAILS =============
const BANK_DETAILS = {
  bankName:      "Premier Bank Kenya",
  accountName:   "Ayub Farah Jama",
  accountNumber: "0019705302",
  sortCode:      "74005",
  swift:         "IFCBKENAXXX"
};

// ============= AUTH =============
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('afwm_user') || 'null'); } catch { return null; }
}
function isLoggedIn() { return !!getCurrentUser(); }

function register(name, email, password) {
  const users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return { error: 'An account with this email already exists.' };
  const user = { id: Date.now(), name, email, password, orders: [], joinedAt: new Date().toISOString() };
  users.push(user);
  localStorage.setItem('afwm_users', JSON.stringify(users));
  localStorage.setItem('afwm_user', JSON.stringify(user));
  return { success: true, user };
}

function login(email, password) {
  const users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return { error: 'Invalid email or password.' };
  localStorage.setItem('afwm_user', JSON.stringify(user));
  return { success: true, user };
}

function logout() {
  localStorage.removeItem('afwm_user');
  window.location.href = '/';
}

// ============= ORDERS =============
function addOrder(productId, amount, paymentMethod, transactionId) {
  const product = PRODUCTS.find(p => p.id == productId);
  const order = {
    id: 'ORD-' + Date.now(),
    productId, productName: product ? product.name : 'Digital Product',
    productImage: product ? product.image : '',
    amount, paymentMethod, transactionId,
    status: 'Completed', date: new Date().toISOString()
  };
  const user = getCurrentUser();
  if (user) {
    const users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
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
  const user = getCurrentUser();
  if (!user) return [];
  const users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
  const found = users.find(u => u.id === user.id);
  return found ? (found.orders || []) : [];
}

// ============= UTILS =============
function getProductFromURL() {
  const id = parseInt(new URLSearchParams(window.location.search).get('id'));
  return PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
}
function formatPrice(n) { return '$' + parseFloat(n).toFixed(2); }

function initHeader() {
  const user = getCurrentUser();
  const link = document.getElementById('nav-auth-link');
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
