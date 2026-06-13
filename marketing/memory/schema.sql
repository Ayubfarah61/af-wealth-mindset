-- AF Wealth Mindset Marketing Brain
-- D1 database name: afwm-marketing
-- Apply with: wrangler d1 execute afwm-marketing --file=memory/schema.sql

-- Products on the site (4 templates)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  pitch TEXT NOT NULL,             -- short positioning ("Excel sheet that tracks 6 debt accounts")
  url TEXT NOT NULL,               -- canonical product page
  price_usd REAL NOT NULL DEFAULT 7.99,
  has_google_sheets INTEGER NOT NULL DEFAULT 0
);

-- Product video assets the user has uploaded (5 per product × 4 = 20)
-- Each video has a source URL (YouTube unlisted, R2, Bunny — anywhere with a public URL we can re-upload from)
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  slot INTEGER NOT NULL,           -- 1..5 within product
  source_url TEXT NOT NULL,        -- mp4 we can pull
  thumbnail_url TEXT,
  duration_sec INTEGER,
  hook TEXT,                       -- short raw hook ("doctor making 6k budgets dinner")
  scenario TEXT,                   -- what's on screen (cooking / walking / etc)
  persona TEXT,                    -- doctor / freelancer / etc
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(product_id, slot)
);

-- Calendar of planned + posted items
-- Type:  product_video = one of the 20 rotation videos
--        engagement   = a daily joke / trend / hook (no product video)
CREATE TABLE IF NOT EXISTS calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheduled_at TEXT NOT NULL,      -- ISO timestamp UTC
  type TEXT NOT NULL CHECK (type IN ('product_video','engagement')),
  product_id INTEGER REFERENCES products(id),
  video_id INTEGER REFERENCES videos(id),
  cycle INTEGER NOT NULL DEFAULT 1, -- 1 = first run, 2 = second pass with fresh copy, etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','failed','skipped')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_due ON calendar(status, scheduled_at);

-- Posts actually published, per platform
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id INTEGER REFERENCES calendar(id),
  platform TEXT NOT NULL CHECK (platform IN ('tiktok','instagram','facebook','youtube','pinterest')),
  external_id TEXT,                -- platform's post / media id
  url TEXT,                        -- public link
  caption TEXT NOT NULL,           -- exact caption posted
  hashtags TEXT,
  variant TEXT,                    -- which angle/persona/rewrite was used
  posted_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','failed','deleted')),
  error TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_recent ON posts(posted_at DESC);

-- Metrics snapshots (poll once a day per post for first 14 days)
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  captured_at TEXT NOT NULL DEFAULT (datetime('now')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0          -- only available on some platforms
);
CREATE INDEX IF NOT EXISTS idx_metrics_post ON metrics(post_id, captured_at DESC);

-- Trend / angle ideas the Trend Scout generates, with which performed
CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  category TEXT NOT NULL,          -- 'hook','joke','controversial','screenshot','trend','testimonial'
  product_id INTEGER REFERENCES products(id),
  body TEXT NOT NULL,              -- the actual text/idea
  used INTEGER NOT NULL DEFAULT 0,
  score INTEGER                    -- back-filled from metrics after use
);

-- Daily director log so we can see what the brain decided each tick
CREATE TABLE IF NOT EXISTS director_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  decision TEXT NOT NULL,          -- "queued 4 platform posts for video #12"
  payload TEXT                     -- JSON
);
CREATE INDEX IF NOT EXISTS idx_log_recent ON director_log(at DESC);

-- Seed the 4 products
INSERT OR REPLACE INTO products (id, name, pitch, url, price_usd, has_google_sheets) VALUES
  (2, 'The Ultimate Budget Planner', 'Excel sheet that tracks income, expenses, and savings on autopilot — 11 charts, 8 linked sheets.', 'https://afwealthmindset.com/product.html?id=2', 7.99, 0),
  (3, 'The Profit Tracker', 'Bookkeeping Excel sheet for small businesses — monthly, annual, and 5-year profit dashboards.', 'https://afwealthmindset.com/product.html?id=3', 7.99, 0),
  (4, 'Debt Payoff Dashboard', 'Pay off up to 6 debts with one dashboard that shows exactly which to attack next.', 'https://afwealthmindset.com/product.html?id=4', 7.99, 1),
  (5, '12-Month Cash Flow Budget', '12-month cash flow planner with a minimum-balance alert that warns you before a month goes short.', 'https://afwealthmindset.com/product.html?id=5', 7.99, 1);
