// AF Wealth Mindset - Shared App Logic

const PRODUCTS = [
  {
    id: 1,
    name: "Cashflow Secrets",
    originalPrice: 197,
    price: 97,
    edition: "11-Module Digital Course",
    badge: "⭐ Featured",
    // Affiliate product — bypasses checkout, goes directly to partner site
    affiliateUrl: "https://moneyripples.com/cashflow-secrets-affiliate/?aff=AyubFarah67",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDq3sQhkxEChSweuHF8gM59pH_UGLFlp6_bw6V0j0MmHrTKNbt-o9Vc4_VAbtQ4VNlNdTn-lxRD8qfh3f4oUyfJJdCKCMXlDq1Hu07Ya8cw909FejwFnIWa2jxcufbSr373fhsiKizj4xGpOClbkY4HKLQsuQmHXobMM8bY8Tnwju4uHxWLDUCgKzQuEYoLdCanEsy34tstV8782sD1abTO8JDaO7vVK5soTbmU9xZZOg86JNoGQJ8xsZPZltHXe4CU8OUfRU2DWPk",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "Unlock additional money from your current situation — no new job, business, or side hustle required. Chris Miles' proven 11-module system teaches you to optimize your cashflow and build wealth by working RIGHT, not just harder.",
    features: [
      { icon: "play_circle", title: "11 Comprehensive Modules", desc: "Mindset, tracking, debt, passive income & more" },
      { icon: "calculate", title: "Cashflow Optimizer Spreadsheet", desc: "Track & optimize your monthly cashflow instantly" },
      { icon: "verified_user", title: "60-Day Money-Back Guarantee", desc: "100% risk-free — full refund if unsatisfied" },
      { icon: "person", title: "Taught by Chris Miles", desc: "Featured on CNN Money, US News & Bankrate.com" }
    ]
  },
  {
    id: 2,
    name: "Personal Finance Tracker",
    originalPrice: null,
    price: null,
    edition: "Digital Tool",
    badge: "🔜 Coming Soon",
    comingSoon: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_-QDuyckMHzM_k9zNI3bJbnm2HZXwDFEayAXvl4dSXEWS36I1dAB2L18Yg3Vu1mjEVCHNPadvjk2YsCs3Qp3E8HD0USyPrEQ4MWHTUtm_2r-aHOKa7IPtT93l4dE5sClJ-l8aQaZiaw6xDBVhZhOufnZuatf2-o7ofvACk8Z-ZV6Xg2dpX_2OapVAiUOoSYT-GgKIZBZV4BAV0pocwqJBV0vme0Q5uVwnatt8KVI1mhvt41GOB3K99yLLs_kPmfXE2qYPPRYXBGI",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "A comprehensive personal finance tracking system to manage your income, expenses, savings goals and investments — all in one place. Full details coming soon.",
    features: [
      { icon: "account_balance_wallet", title: "Income & Expense Tracking", desc: "Monitor every dollar in and out" },
      { icon: "savings", title: "Savings Goal Planner", desc: "Set and hit your financial milestones" },
      { icon: "trending_up", title: "Investment Dashboard", desc: "See your net worth grow over time" },
      { icon: "notifications", title: "Smart Alerts", desc: "Never miss a bill or overspend again" }
    ]
  },
  {
    id: 3,
    name: "Small Business Bookkeeping System",
    originalPrice: null,
    price: null,
    edition: "Business Tool",
    badge: "🔜 Coming Soon",
    comingSoon: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-LQHnHBbyAZtGO3ZDobbOr6tgXvoeqtjWx5qO38evmPQBs3CRA_ybqbzKW91wytJyt4S38UV3mg4pxz8S8rDMOBwXWtcrukt85Xo7iAiS37dpgMcONbHrUiArKAmpqfZ9MaoLPvEnhlfOjZUFoI3rXfvgY8ezIsnPeVVPnlr2xSutkjXv7cYNdc_wpYPXjszYbwzsX4QA_CKf-qbIrVI6RP_L4EKEFzmfOCsVRje111c84mUZrRM-wjdKsWM4Nzwl0CpcV-y3X-E",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "A complete bookkeeping system built for small business owners. Manage invoices, expenses, payroll, and tax-ready reports without an accountant. Full details coming soon.",
    features: [
      { icon: "receipt_long", title: "Invoice Management", desc: "Create and send professional invoices" },
      { icon: "account_balance", title: "Expense Tracking", desc: "Categorize and monitor all business costs" },
      { icon: "groups", title: "Payroll Ready", desc: "Simplified payroll tracking for small teams" },
      { icon: "description", title: "Tax-Ready Reports", desc: "Export clean reports for your accountant" }
    ]
  }
];

// ============= AUTH =============
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('afwm_user') || 'null'); } catch { return null; }
}
function isLoggedIn() { return !!getCurrentUser(); }

function register(name, email, password) {
  const users = JSON.parse(localStorage.getItem('afwm_users') || '[]');
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: 'An account with this email already exists.' };
  }
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
    status: 'Completed',
    date: new Date().toISOString()
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
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
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
