// AF Wealth Mindset - Shared App Logic

const PRODUCTS = [
  {
    id: 1,
    name: "Financial Freedom Blueprint",
    originalPrice: 99, price: 49, edition: "Gold Edition",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7Q3JX1W98ibjLfG7zgYua0LftaBJnne38Uwz5LvchTBu5ny1dlEDPVfVib30GiiXMZl2aVQRq4rCky6ZoePPs-JrR1mvLqLtmNhslkUNk_1g_mR0hZzJp4IwzqSi4QZee8O5OKLI4MNLdwZMljyns6q-y7G14UpLo-X1159Re5moZl9Ryl6Q5fCdZG1mp0gbSB_2l8OHxEMR2Hp-BfhsnFqKN-6zEKwv3e3m0T3wq5JsrBr-BHuPWwi5nCgSueLI7v4Lp2vE2_so",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "Master your financial destiny with our curated vault of professional strategies, high-conversion frameworks, and exclusive resources designed for the modern wealth-builder.",
    features: [
      { icon: "update", title: "Lifetime Updates", desc: "Stay ahead with monthly content refreshes" },
      { icon: "description", title: "Professional Templates", desc: "Ready-to-use executive layouts" },
      { icon: "auto_stories", title: "Exclusive Resource Guide", desc: "The exact tools used by top industry leaders" },
      { icon: "verified_user", title: "Premium Support", desc: "Direct line to our expert strategy team" }
    ]
  },
  {
    id: 2,
    name: "Wealth Accelerator Course",
    originalPrice: 249, price: 129, edition: "Pro Edition",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBp6yiUT8Q9h-2lfgo4pg7G8XWqktsZw5S7hOMVelvOM3SE3VZg7l8HMVdapk422nSc8BwQSZWGYHkkUbsKXgRRGv3wxPJACleYy8g6wvCjLjfWWYd-CR6evXapDbZOy7oJit9InCLqQBp6ghAK3x7fKQAnybiEEhg4Nf4Zht821gOrKCTojXnc4p4N5frHO_HtoBxpNLniWTaovmQD46FD3WOkFbMYdZDtQfCLnquZtORgBCoXlDE5WklA24S3uhJYz5Pm7gwW5Sg",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "Accelerate your path to wealth with our comprehensive 12-module course featuring proven strategies from industry leaders and successful entrepreneurs.",
    features: [
      { icon: "play_circle", title: "12-Module Video Course", desc: "HD video lessons you can watch anywhere" },
      { icon: "description", title: "Workbooks & Templates", desc: "Actionable worksheets for each module" },
      { icon: "groups", title: "Private Community", desc: "Connect with like-minded wealth builders" },
      { icon: "calendar_month", title: "Monthly Q&A Sessions", desc: "Live coaching with industry experts" }
    ]
  },
  {
    id: 3,
    name: "Passive Income Guide",
    originalPrice: 75, price: 29, edition: "Digital Edition",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_-QDuyckMHzM_k9zNI3bJbnm2HZXwDFEayAXvl4dSXEWS36I1dAB2L18Yg3Vu1mjEVCHNPadvjk2YsCs3Qp3E8HD0USyPrEQ4MWHTUtm_2r-aHOKa7IPtT93l4dE5sClJ-l8aQaZiaw6xDBVhZhOufnZuatf2-o7ofvACk8Z-ZV6Xg2dpX_2OapVAiUOoSYT-GgKIZBZV4BAV0pocwqJBV0vme0Q5uVwnatt8KVI1mhvt41GOB3K99yLLs_kPmfXE2qYPPRYXBGI",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "Discover 10+ proven passive income streams and build a portfolio that earns while you sleep. Perfect for beginners and experienced investors alike.",
    features: [
      { icon: "account_balance", title: "10+ Income Streams", desc: "Diversified strategies for consistent income" },
      { icon: "map", title: "Step-by-Step Roadmap", desc: "Clear path from $0 to passive income" },
      { icon: "build", title: "Tools & Resources", desc: "Curated list of the best tools available" },
      { icon: "support_agent", title: "Email Support", desc: "Get answers to your questions anytime" }
    ]
  },
  {
    id: 4,
    name: "Elite Mastermind Access",
    originalPrice: 499, price: 299, edition: "Exclusive Edition",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDq3sQhkxEChSweuHF8gM59pH_UGLFlp6_bw6V0j0MmHrTKNbt-o9Vc4_VAbtQ4VNlNdTn-lxRD8qfh3f4oUyfJJdCKCMXlDq1Hu07Ya8cw909FejwFnIWa2jxcufbSr373fhsiKizj4xGpOClbkY4HKLQsuQmHXobMM8bY8Tnwju4uHxWLDUCgKzQuEYoLdCanEsy34tstV8782sD1abTO8JDaO7vVK5soTbmU9xZZOg86JNoGQJ8xsZPZltHXe4CU8OUfRU2DWPk",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "Join our exclusive mastermind group for high-achievers. Direct access to top mentors, weekly live coaching, and a private network of successful entrepreneurs.",
    features: [
      { icon: "groups", title: "Private Mastermind Group", desc: "Exclusive access for serious wealth builders" },
      { icon: "live_tv", title: "Weekly Live Coaching", desc: "Real-time sessions with top coaches" },
      { icon: "person", title: "Direct Mentor Access", desc: "Personalized guidance from industry leaders" },
      { icon: "star", title: "VIP Resources", desc: "Premium tools and insider information" }
    ]
  },
  {
    id: 5,
    name: "Startup Kit v2.0",
    originalPrice: 120, price: 60, edition: "Business Edition",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-LQHnHBbyAZtGO3ZDobbOr6tgXvoeqtjWx5qO38evmPQBs3CRA_ybqbzKW91wytJyt4S38UV3mg4pxz8S8rDMOBwXWtcrukt85Xo7iAiS37dpgMcONbHrUiArKAmpqfZ9MaoLPvEnhlfOjZUFoI3rXfvgY8ezIsnPeVVPnlr2xSutkjXv7cYNdc_wpYPXjszYbwzsX4QA_CKf-qbIrVI6RP_L4EKEFzmfOCsVRje111c84mUZrRM-wjdKsWM4Nzwl0CpcV-y3X-E",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWJv1jPQoGKf9-cMWDMr8xuscN-eyA2V7CLJICU-dA2wJi3q7UTuxkKbHQOZGOQ6UMYFhALCBigCxGs9DMStJu8Lot-_qVmBhfnphzj_V3VTce4plV4feMOlRXX24Nnf-TkBMpdk5DzNRR2F70uWy6K_ub5zvW268AGh32UfKr240O3w4qC74qz6veFdUsvetLFR8Ww3pOUcYFEq3n5k3R_BEjtfFWZ0xH99RFf_5gAIborYGibP6FOCu8U-0ea6ai1a2zIcsTOmA",
    description: "Everything you need to launch your business from day one. Business plan templates, financial projections, brand identity guide, and a complete launch checklist.",
    features: [
      { icon: "article", title: "Business Plan Template", desc: "Professional, investor-ready template" },
      { icon: "trending_up", title: "Financial Projections", desc: "Spreadsheet tools for forecasting growth" },
      { icon: "palette", title: "Brand Identity Guide", desc: "Create a compelling brand from scratch" },
      { icon: "checklist", title: "Launch Checklist", desc: "50-point checklist to launch confidently" }
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
