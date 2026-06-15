// AF Wealth Mindset — Marketing Brain Worker
// One Worker. Runs on cron. Also serves a tiny dashboard + admin API.
//
// Cron triggers (set in wrangler.toml):
//   "*/30 * * * *"  — every 30 min: execute any due calendar items
//   "0 6 * * *"      — daily 06:00 UTC: Trend Scout + Director plan
//
// HTTP routes (basic auth via Bearer ADMIN_TOKEN):
//   GET  /                  — dashboard HTML
//   GET  /api/state         — products + upcoming + recent posts
//   POST /api/videos        — register a video {product_id, slot, source_url, ...}
//   POST /api/plan          — force planner run
//   POST /api/execute       — force executor run
//   POST /api/ideas         — force Trend Scout
//   POST /api/calendar/:id/skip — skip a queued item

import { plan } from './agents/director.js';
import { generateDailyIdeas } from './agents/trend-scout.js';
import { writeCopy } from './agents/content-writer.js';
import { fanOut } from './platforms/index.js';
import { dueEntries, markCalendar, recordPost, log } from './lib/db.js';
import { getCachedMetrics } from './lib/metrics.js';
import { fetchSalesSummary } from './lib/sales.js';

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCron(event, env));
  },
  async fetch(request, env, ctx) {
    return handleHttp(request, env);
  }
};

async function handleCron(event, env) {
  if (event.cron === '0 6 * * *') {
    try { await generateDailyIdeas(env, 12); } catch (e) { await log(env, 'trend-scout failed', { error: String(e) }); }
    try { await plan(env); } catch (e) { await log(env, 'planner failed', { error: String(e) }); }
  } else {
    await executeDue(env);
  }
}

async function executeDue(env) {
  const items = await dueEntries(env, 5);
  for (const item of items) {
    try {
      const copy = await writeCopy(env, item);
      // Engagement posts: rotate through 8 dearson-style cards per product
      // (32 total static images). Slot = ((calendar_id - 1) mod 8) + 1.
      const cardImageUrl = item.type === 'engagement' && item.product_id
        ? `https://afwealthmindset.com/images/cards/card-product-${item.product_id}-${(item.id - 1) % 15 + 1}.png`
        : null;
      const media = item.type === 'product_video'
        ? { videoUrl: item.video_url, thumbnailUrl: item.thumbnail_url }
        : { imageUrl: cardImageUrl };
      const results = await fanOut(env, {
        copy,
        media,
        // Engagement posts: pure education, NO product URL passed to platforms.
        // Only product_video posts include the URL (those are the ones that sell).
        productUrl: item.type === 'product_video' ? item.product_url : null,
        type: item.type
      });
      for (const r of results) {
        const p = copy[r.platform] || {};
        // Treat platform "skipped" (no video / no image / missing setup) as a separate status,
        // not "live". Keeps the dashboard honest.
        const status = r.skipped ? 'skipped' : (r.ok ? 'live' : 'failed');
        await recordPost(env, {
          calendarId: item.id,
          platform: r.platform,
          externalId: r.externalId,
          url: r.url,
          caption: p.caption || p.title || '',
          hashtags: (p.hashtags || []).join(' '),
          variant: copy.variant,
          status,
          error: r.error || r.skipped || null
        });
      }
      const allFailed = results.length && results.every(r => !r.ok && !r.skipped);
      await markCalendar(env, item.id, allFailed ? 'failed' : 'published',
        JSON.stringify({ results }));
      await log(env, `Published calendar #${item.id}`, { type: item.type, results });
    } catch (e) {
      await markCalendar(env, item.id, 'failed', String(e.message || e));
      await log(env, `Execute failed for #${item.id}`, { error: String(e) });
    }
  }
  return items.length;
}

// ── HTTP ────────────────────────────────────────────────────────────────────

async function handleHttp(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response(dashboardHtml(), { headers: { 'Content-Type': 'text/html' } });
  }

  // Public visitor tracking pixel — no auth, called from website pages.
  if (url.pathname === '/api/track.gif' && request.method === 'GET') {
    const path = url.searchParams.get('p') || '/';
    const ref = request.headers.get('Referer') || '';
    const ua = request.headers.get('User-Agent') || '';
    const country = request.cf?.country || '';
    const day = new Date().toISOString().slice(0, 10);
    try {
      await env.DB.prepare(`INSERT INTO visits (day, path, referer, ua, country) VALUES (?, ?, ?, ?, ?)`)
        .bind(day, path.slice(0, 200), ref.slice(0, 200), ua.slice(0, 250), country).run();
    } catch (_) {}
    const gif = new Uint8Array([0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,0x80,0x00,0x00,0x00,0x00,0x00,0xff,0xff,0xff,0x21,0xf9,0x04,0x01,0x00,0x00,0x00,0x00,0x2c,0x00,0x00,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0x02,0x02,0x44,0x01,0x00,0x3b]);
    return new Response(gif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

if (!url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
  const auth = request.headers.get('Authorization') || '';
  if (auth !== 'Bearer ' + env.ADMIN_TOKEN) return new Response('Unauthorized', { status: 401 });

  if (url.pathname === '/api/state' && request.method === 'GET') return json(await loadState(env));
  if (url.pathname === '/api/plan' && request.method === 'POST') return json({ planned: await plan(env) });
  if (url.pathname === '/api/execute' && request.method === 'POST') return json({ executed: await executeDue(env) });
  if (url.pathname === '/api/ideas' && request.method === 'POST') return json({ ideas: await generateDailyIdeas(env, 12) });

  if (url.pathname === '/api/videos' && request.method === 'POST') {
    const body = await request.json();
    const r = await env.DB.prepare(`
      INSERT INTO videos (product_id, slot, source_url, thumbnail_url, duration_sec, hook, scenario, persona)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(product_id, slot) DO UPDATE SET
        source_url=excluded.source_url,
        thumbnail_url=excluded.thumbnail_url,
        duration_sec=excluded.duration_sec,
        hook=excluded.hook,
        scenario=excluded.scenario,
        persona=excluded.persona,
        active=1
    `).bind(body.product_id, body.slot, body.source_url, body.thumbnail_url || null,
            body.duration_sec || null, body.hook || null, body.scenario || null, body.persona || null).run();
    return json({ ok: true, id: r.meta.last_row_id });
  }

  const skip = url.pathname.match(/^\/api\/calendar\/(\d+)\/skip$/);
  if (skip && request.method === 'POST') {
    await markCalendar(env, Number(skip[1]), 'skipped', 'manual skip');
    return json({ ok: true });
  }

  return new Response('Not found', { status: 404 });
}

async function loadState(env) {
  const { results: products } = await env.DB.prepare('SELECT * FROM products ORDER BY id').all();
  const { results: videos } = await env.DB.prepare(
    'SELECT v.*, (SELECT COUNT(*) FROM calendar c WHERE c.video_id=v.id AND c.status=\'published\') AS times_posted FROM videos v ORDER BY product_id, slot'
  ).all();
  const { results: upcoming } = await env.DB.prepare(
    'SELECT * FROM calendar WHERE status=\'pending\' ORDER BY scheduled_at LIMIT 20'
  ).all();
  const { results: recent } = await env.DB.prepare(
    'SELECT * FROM posts ORDER BY posted_at DESC LIMIT 30'
  ).all();
  const { results: log } = await env.DB.prepare(
    'SELECT * FROM director_log ORDER BY at DESC LIMIT 30'
  ).all();
  const { results: spend } = await env.DB.prepare(
    'SELECT * FROM spend ORDER BY day DESC LIMIT 14'
  ).all();

  // Per-platform aggregates: live / failed / skipped counts (all time + today)
  const { results: byPlatform } = await env.DB.prepare(`
    SELECT platform, status, COUNT(*) AS n
    FROM posts
    GROUP BY platform, status
  `).all();
  const { results: byPlatformToday } = await env.DB.prepare(`
    SELECT platform, status, COUNT(*) AS n
    FROM posts
    WHERE date(posted_at) = date('now')
    GROUP BY platform, status
  `).all();

  // Roll into a per-platform object the UI can read directly
  const enabled = (env.ENABLED_PLATFORMS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allPlatforms = ['tiktok','instagram','facebook','youtube','pinterest','threads','bluesky'];
  const platforms = allPlatforms.map(name => {
    const row = (status) => byPlatform.find(r => r.platform === name && r.status === status)?.n || 0;
    const rowToday = (status) => byPlatformToday.find(r => r.platform === name && r.status === status)?.n || 0;
    return {
      name,
      enabled: enabled.includes(name),
      total_live: row('live'),
      total_failed: row('failed'),
      live_today: rowToday('live'),
      failed_today: rowToday('failed'),
    };
  });

  // Next scheduled engagement post
  const next = upcoming.find(u => u.type === 'engagement') || upcoming[0] || null;
  const ideaPool = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ideas WHERE used = 0`).first();

  // Real metrics from each platform's API (cached 30 min in D1)
  const metrics = await getCachedMetrics(env).catch(e => ({ error: String(e) }));
  // Paddle sales (skipped if no key)
  const sales = await fetchSalesSummary(env).catch(e => ({ error: String(e) }));
  // Site visitors today + last 7 days
  const visitorsToday = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM visits WHERE day = date('now')`
  ).first();
  const visitors7d = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM visits WHERE day >= date('now','-7 days')`
  ).first();
  const visitors = { today: visitorsToday?.n || 0, week: visitors7d?.n || 0 };

  return {
    products, videos, upcoming, recent, log, spend,
    platforms,
    metrics,
    sales,
    visitors,
    next_post: next,
    idea_pool: ideaPool?.n || 0,
    budget: { daily_cap_usd: Number(env.DAILY_USD_CAP || '0.10') },
    server_now: new Date().toISOString(),
  };
}

function json(data) {
  return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json' } });
}

function dashboardHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>AFWM Marketing Brain</title>
<style>
  body{font:14px/1.5 system-ui,sans-serif;max-width:1180px;margin:24px auto;padding:0 16px;color:#0F141A;background:#F7F8F5}
  h1{color:#0F766E;margin:0 0 4px;font-size:24px;letter-spacing:0.02em}
  h2{margin-top:32px;color:#0F141A;font-size:18px;border-bottom:2px solid #0F766E;padding-bottom:6px;display:inline-block}
  input,button,textarea,select{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid #d0d4d8;background:#fff}
  button{background:#0F141A;color:#F7F8F5;border-color:#0F141A;cursor:pointer}
  button.ghost{background:#fff;color:#0F141A}
  button:hover{filter:brightness(1.1)}
  table{width:100%;border-collapse:collapse;margin-top:8px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  th,td{padding:10px 12px;border-bottom:1px solid #eef0f2;font-size:13px;text-align:left;vertical-align:top}
  th{background:#eef0f2;font-weight:700}
  .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .pill{display:inline-block;padding:3px 10px;border-radius:99px;background:#eef0f2;color:#0F141A;font-size:11px;font-weight:700}
  .ok{background:#d4edda;color:#155724}
  .bad{background:#f8d7da;color:#721c24}
  .warn{background:#fff3cd;color:#856404}
  .info{background:#cfe5ff;color:#004085}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px}
  .card{background:#fff;border-radius:10px;padding:14px 16px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  .card .pname{font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#0F141A}
  .card .big{font-size:22px;font-weight:800;color:#0F766E;margin-top:6px}
  .card .small{font-size:12px;color:#5B6770;margin-top:2px}
  .hero{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin-top:14px}
  .hero .card{padding:18px 20px}
  textarea{width:100%;min-height:80px;font-family:ui-monospace,monospace}
  a{color:#0F766E}
</style></head><body>
<h1>AFWM Marketing Brain</h1>
<p style="margin:0;color:#5B6770">Paste your admin token once. The dashboard auto-refreshes every 60 seconds.</p>

<!-- Status banner -->
<div id="statusbanner" style="margin:14px 0;padding:14px 18px;background:#fff;border-radius:10px;border-left:6px solid #0F766E;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
  <div style="font-weight:800;color:#0F766E;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Status</div>
  <div id="statustext" style="margin-top:6px;color:#172033;font-size:14px;line-height:1.55">loading…</div>
</div>
<div class="row" style="margin-top:8px"><input id="tok" placeholder="ADMIN_TOKEN" style="flex:1"/>
<button onclick="save()">Save</button>
<button class="ghost" onclick="run('/api/ideas')">Generate ideas</button>
<button class="ghost" onclick="run('/api/plan')">Plan next 48h</button>
<button class="ghost" onclick="run('/api/execute')">Execute due now</button>
<button class="ghost" onclick="load()">Refresh</button></div>

<!-- Hero stats — TOP ROW: business metrics -->
<div class="hero">
  <div class="card">
    <div class="pname">Sales today</div>
    <div class="big" id="salestoday">—</div>
    <div class="small" id="salessub"></div>
  </div>
  <div class="card">
    <div class="pname">Followers (all)</div>
    <div class="big" id="totalfollowers">—</div>
    <div class="small" id="followersub"></div>
  </div>
  <div class="card">
    <div class="pname">Next post</div>
    <div class="big" id="nextpost">—</div>
    <div class="small" id="nextpostsub"></div>
  </div>
</div>

<!-- Hero stats — SECOND ROW: ops metrics -->
<div class="hero">
  <div class="card">
    <div class="pname">Posts today</div>
    <div class="big" id="poststoday">—</div>
    <div class="small" id="postssub">across all platforms</div>
  </div>
  <div class="card">
    <div class="pname">Idea pool</div>
    <div class="big" id="ideapool">—</div>
    <div class="small">unused "Dear ___" letters in memory</div>
  </div>
  <div class="card">
    <div class="pname">Spend today</div>
    <div class="big" id="spendtoday">—</div>
    <div class="small" id="spendsub"></div>
  </div>
</div>

<h2>Platforms — live status</h2>
<div class="grid" id="platforms"></div>

<h2>Register a product video</h2>
<div class="row">
  <select id="pid"><option value="2">2 — Budget Planner</option><option value="3">3 — Profit Tracker</option><option value="4">4 — Debt Payoff</option><option value="5">5 — Cash Flow</option></select>
  <input id="slot" type="number" min="1" max="5" placeholder="slot 1-5" style="width:90px"/>
  <input id="src" placeholder="public mp4 URL" style="flex:1;min-width:260px"/>
</div>
<div class="row" style="margin-top:8px">
  <input id="thumb" placeholder="thumbnail URL (for Pinterest)" style="flex:1;min-width:260px"/>
  <input id="persona" placeholder="persona, e.g. doctor 6k/mo" style="width:200px"/>
  <input id="scenario" placeholder="scenario, e.g. cooking" style="width:200px"/>
</div>
<div class="row" style="margin-top:8px">
  <input id="hook" placeholder="short raw hook" style="flex:1"/>
  <button onclick="addVideo()">Save video</button>
</div>

<h2>Videos in rotation</h2>
<table id="videos"><thead><tr><th>Product</th><th>Slot</th><th>Persona</th><th>Scenario</th><th>Posted</th></tr></thead><tbody></tbody></table>

<h2>Upcoming (next 20)</h2>
<table id="upcoming"><thead><tr><th>When (UTC)</th><th>Type</th><th>Product/Video</th><th>Cycle</th><th></th></tr></thead><tbody></tbody></table>

<h2>Recent posts</h2>
<table id="recent"><thead><tr><th>When</th><th>Platform</th><th>Status</th><th>Caption</th><th>Link</th></tr></thead><tbody></tbody></table>

<h2>Spend history (last 14 days)</h2>
<table id="spend"<thead><tr><th>Day</th><th>USD</th><th>Calls</th><th>In tokens</th><th>Out tokens</th></tr></thead><tbody></tbody></table>

<h2>Director log</h2>
<table id="log"><thead><tr><th>When</th><th>Decision</th></tr></thead><tbody></tbody></table>

<script>
const T = () => localStorage.getItem('afwm_tok') || '';
function save(){ localStorage.setItem('afwm_tok', document.getElementById('tok').value); load(); }
function H(){ return { 'Authorization':'Bearer '+T(), 'Content-Type':'application/json' }; }
async function run(p){ const r = await fetch(p,{method:'POST',headers:H()}); alert(await r.text()); load(); }
async function addVideo(){
  const body = {
    product_id: +document.getElementById('pid').value,
    slot: +document.getElementById('slot').value,
    source_url: document.getElementById('src').value,
    thumbnail_url: document.getElementById('thumb').value,
    persona: document.getElementById('persona').value,
    scenario: document.getElementById('scenario').value,
    hook: document.getElementById('hook').value
  };
  const r = await fetch('/api/videos',{method:'POST',headers:H(),body:JSON.stringify(body)});
  alert(await r.text()); load();
}
function fmtCountdown(targetIso, nowIso){
  const t = new Date(targetIso).getTime();
  const n = new Date(nowIso).getTime();
  let s = Math.max(0, Math.round((t - n) / 1000));
  const d = Math.floor(s/86400); s -= d*86400;
  const h = Math.floor(s/3600); s -= h*3600;
  const m = Math.floor(s/60);
  if (d) return d+'d '+h+'h '+m+'m';
  if (h) return h+'h '+m+'m';
  return m+'m';
}
const PLATFORM_LABELS = {
  tiktok:'TikTok', instagram:'Instagram', facebook:'Facebook',
  youtube:'YouTube', pinterest:'Pinterest', threads:'Threads', bluesky:'Bluesky'
};
const PLATFORM_NOTES = {
  tiktok:'awaiting app approval — drafts only',
  instagram:'auto-posting cards',
  facebook:'auto-posting cards',
  youtube:'waits for product videos',
  pinterest:'Trial mode — needs Standard approval',
  threads:'auto-posting',
  bluesky:'auto-posting',
};

async function load(){
  document.getElementById('tok').value = T();
  if(!T()) return;
  const r = await fetch('/api/state',{headers:H()});
  if(!r.ok){ alert('auth failed'); return; }
  const d = await r.json();
  const tb = id => document.querySelector('#'+id+' tbody');

  // Hero: next post countdown
  if (d.next_post) {
    document.getElementById('nextpost').textContent = fmtCountdown(d.next_post.scheduled_at, d.server_now);
    document.getElementById('nextpostsub').textContent = new Date(d.next_post.scheduled_at).toUTCString() + ' · ' + (d.next_post.type === 'engagement' ? 'engagement letter' : 'product video');
  } else {
    document.getElementById('nextpost').textContent = 'nothing queued';
    document.getElementById('nextpostsub').textContent = 'click "Plan next 48h"';
  }

  document.getElementById('ideapool').textContent = d.idea_pool;

  // Sales (Paddle)
  const sales = d.sales || {};
  if (sales.error) {
    document.getElementById('salestoday').textContent = '—';
    document.getElementById('salessub').textContent = sales.error;
  } else {
    document.getElementById('salestoday').textContent = (sales.today?.count || 0) + ' sales';
    document.getElementById('salessub').textContent = '$' + (sales.today?.revenue_usd || 0).toFixed(2) + ' today · $' + (sales.week?.revenue_usd || 0).toFixed(2) + ' this week';
  }

  // Followers
  const m = d.metrics || {};
  const sumFollowers = ['facebook','instagram','pinterest','bluesky','youtube'].reduce((a, k) => a + (m[k]?.followers || 0), 0);
  document.getElementById('totalfollowers').textContent = sumFollowers.toLocaleString();
  const platformLines = [];
  if (m.facebook?.followers != null) platformLines.push('FB ' + m.facebook.followers);
  if (m.instagram?.followers != null) platformLines.push('IG ' + m.instagram.followers);
  if (m.bluesky?.followers != null) platformLines.push('Bluesky ' + m.bluesky.followers);
  if (m.pinterest?.followers != null) platformLines.push('Pin ' + m.pinterest.followers);
  if (m.youtube?.followers != null) platformLines.push('YT ' + m.youtube.followers);
  document.getElementById('followersub').textContent = platformLines.join(' · ') || 'no metrics yet';

  // Posts today count
  const postsToday = (d.platforms||[]).reduce((a, p) => a + (p.live_today || 0), 0);
  document.getElementById('poststoday').textContent = postsToday;
  const v = d.visitors || { today: 0, week: 0 };
  document.getElementById('postssub').textContent = v.today + ' site visitors today · ' + v.week + ' last 7d';

  // Status banner — what's running, what needs them
  const live = (d.platforms||[]).filter(p => p.enabled && p.live_today > 0).map(p => PLATFORM_LABELS[p.name]);
  const waiting = (d.platforms||[]).filter(p => p.enabled && p.live_today === 0 && p.failed_today === 0).map(p => PLATFORM_LABELS[p.name]);
  const failing = (d.platforms||[]).filter(p => p.failed_today > 0).map(p => PLATFORM_LABELS[p.name]);
  let status = '';
  if (live.length) status += '<span class="pill ok">✓ Live posting</span> ' + live.join(', ') + '<br/>';
  if (failing.length) status += '<span class="pill bad">✗ Errors today</span> ' + failing.join(', ') + '<br/>';
  if (waiting.length) status += '<span class="pill info">⏸ Waiting</span> ' + waiting.join(', ') + '<br/>';
  document.getElementById('statustext').innerHTML = status || 'system idle';

  const today = (d.spend||[])[0] || { usd: 0, day: 'today', calls: 0 };
  const cap = d.budget?.daily_cap_usd || 0.10;
  const pct = Math.min(100, (today.usd / cap) * 100);
  document.getElementById('spendtoday').textContent = '$'+today.usd.toFixed(4);
  document.getElementById('spendsub').textContent = today.calls + ' API calls · ' + pct.toFixed(0) + '% of $' + cap.toFixed(2) + ' daily cap';

  // Platforms cards
  document.getElementById('platforms').innerHTML = (d.platforms||[]).map(p => {
    const status = !p.enabled ? '<span class="pill warn">disabled</span>'
      : p.failed_today > 0 ? '<span class="pill bad">errors today</span>'
      : p.live_today > 0 ? '<span class="pill ok">posting</span>'
      : '<span class="pill info">enabled</span>';
    return '<div class="card"><div class="pname">'+PLATFORM_LABELS[p.name]+' '+status+'</div>'
      + '<div class="big">'+p.live_today+' <span style="font-size:14px;color:#5B6770">today</span></div>'
      + '<div class="small">'+p.total_live+' lifetime · '+p.total_failed+' failures</div>'
      + '<div class="small" style="margin-top:6px;color:#0F141A">'+PLATFORM_NOTES[p.name]+'</div></div>';
  }).join('');

  tb('videos').innerHTML = d.videos.map(v => '<tr><td>'+v.product_id+'</td><td>'+v.slot+'</td><td>'+(v.persona||'')+'</td><td>'+(v.scenario||'')+'</td><td>'+(v.times_posted||0)+'</td></tr>').join('') || '<tr><td colspan="5" style="color:#5B6770">No product videos uploaded yet. Add them via /api/videos.</td></tr>';
  tb('upcoming').innerHTML = d.upcoming.map(u => '<tr><td>'+u.scheduled_at+' <span class="small" style="color:#5B6770">('+fmtCountdown(u.scheduled_at,d.server_now)+')</span></td><td><span class="pill">'+u.type+'</span></td><td>'+(u.product_id||'-')+' / '+(u.video_id||'-')+'</td><td>'+u.cycle+'</td><td><button class="ghost" onclick="skip('+u.id+')">skip</button></td></tr>').join('');
  tb('recent').innerHTML = d.recent.map(p => '<tr><td>'+p.posted_at+'</td><td>'+PLATFORM_LABELS[p.platform]+'</td><td><span class="pill '+(p.status==='live'?'ok':'bad')+'">'+p.status+'</span></td><td>'+(p.caption||'').slice(0,90)+'</td><td>'+(p.url?'<a target=_blank href='+p.url+'>open</a>':p.error?'<span style="color:#721c24">'+p.error.slice(0,50)+'</span>':'')+'</td></tr>').join('');
  tb('log').innerHTML = d.log.map(l => '<tr><td>'+l.at+'</td><td>'+l.decision+'</td></tr>').join('');
  tb('spend').innerHTML = (d.spend||[]).map(s => '<tr><td>'+s.day+'</td><td>$'+s.usd.toFixed(4)+'</td><td>'+s.calls+'</td><td>'+s.input_tokens+'</td><td>'+s.output_tokens+'</td></tr>').join('');
}
// auto-refresh every 60s
setInterval(load, 60000);
async function skip(id){ await fetch('/api/calendar/'+id+'/skip',{method:'POST',headers:H()}); load(); }
load();
</script>
</body></html>`;
}
