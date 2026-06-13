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
      const media = item.type === 'product_video'
        ? { videoUrl: item.video_url, thumbnailUrl: item.thumbnail_url }
        : null;
      const results = await fanOut(env, {
        copy,
        media,
        productUrl: item.product_url,
        type: item.type
      });
      for (const r of results) {
        const p = copy[r.platform] || {};
        await recordPost(env, {
          calendarId: item.id,
          platform: r.platform,
          externalId: r.externalId,
          url: r.url,
          caption: p.caption || p.title || '',
          hashtags: (p.hashtags || []).join(' '),
          variant: copy.variant,
          status: r.ok ? 'live' : 'failed',
          error: r.error
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
  return {
    products, videos, upcoming, recent, log, spend,
    budget: { daily_cap_usd: Number(env.DAILY_USD_CAP || '0.10') }
  };
}

function json(data) {
  return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json' } });
}

function dashboardHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>AFWM Marketing Brain</title>
<style>
  body{font:14px/1.5 system-ui,sans-serif;max-width:1100px;margin:24px auto;padding:0 16px;color:#0B1220;background:#F6F1E7}
  h1{color:#B88935;margin:0 0 4px}
  h2{margin-top:28px;color:#0B1220}
  input,button,textarea{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid #d6c79a;background:#fff}
  button{background:#0B1220;color:#F6F1E7;border-color:#0B1220;cursor:pointer}
  button.ghost{background:#fff;color:#0B1220}
  table{width:100%;border-collapse:collapse;margin-top:8px;background:#fff;border-radius:8px;overflow:hidden}
  th,td{padding:8px 10px;border-bottom:1px solid #eadfbd;font-size:13px;text-align:left;vertical-align:top}
  th{background:#eadfbd}
  .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .pill{display:inline-block;padding:2px 8px;border-radius:99px;background:#eadfbd;color:#0B1220;font-size:11px}
  .ok{background:#cfe8c9}.bad{background:#f3c0c0}.warn{background:#f3dca0}
  textarea{width:100%;min-height:80px;font-family:ui-monospace,monospace}
</style></head><body>
<h1>AFWM Marketing Brain</h1>
<p>Bearer token required for the API. Paste it once:</p>
<div class="row"><input id="tok" placeholder="ADMIN_TOKEN" style="flex:1"/>
<button onclick="save()">Save</button>
<button class="ghost" onclick="run('/api/ideas')">Generate ideas</button>
<button class="ghost" onclick="run('/api/plan')">Plan next 48h</button>
<button class="ghost" onclick="run('/api/execute')">Execute due now</button>
<button class="ghost" onclick="load()">Refresh</button></div>

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

<h2>Spend (last 14 days)</h2>
<div id="budgetline" style="margin-top:4px"></div>
<table id="spend"><thead><tr><th>Day</th><th>USD</th><th>Calls</th><th>In tokens</th><th>Out tokens</th></tr></thead><tbody></tbody></table>

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
async function load(){
  document.getElementById('tok').value = T();
  if(!T()) return;
  const r = await fetch('/api/state',{headers:H()});
  if(!r.ok){ alert('auth failed'); return; }
  const d = await r.json();
  const tb = id => document.querySelector('#'+id+' tbody');
  tb('videos').innerHTML = d.videos.map(v => '<tr><td>'+v.product_id+'</td><td>'+v.slot+'</td><td>'+(v.persona||'')+'</td><td>'+(v.scenario||'')+'</td><td>'+(v.times_posted||0)+'</td></tr>').join('');
  tb('upcoming').innerHTML = d.upcoming.map(u => '<tr><td>'+u.scheduled_at+'</td><td><span class="pill">'+u.type+'</span></td><td>'+(u.product_id||'-')+' / '+(u.video_id||'-')+'</td><td>'+u.cycle+'</td><td><button class="ghost" onclick="skip('+u.id+')">skip</button></td></tr>').join('');
  tb('recent').innerHTML = d.recent.map(p => '<tr><td>'+p.posted_at+'</td><td>'+p.platform+'</td><td><span class="pill '+(p.status==='live'?'ok':'bad')+'">'+p.status+'</span></td><td>'+(p.caption||'').slice(0,90)+'</td><td>'+(p.url?'<a target=_blank href='+p.url+'>open</a>':'')+'</td></tr>').join('');
  tb('log').innerHTML = d.log.map(l => '<tr><td>'+l.at+'</td><td>'+l.decision+'</td></tr>').join('');
  const today = (d.spend||[])[0] || { usd: 0, day: 'today' };
  const cap = d.budget?.daily_cap_usd || 0.10;
  const pct = Math.min(100, (today.usd / cap) * 100);
  document.getElementById('budgetline').innerHTML = '<span class="pill '+(pct>80?'bad':pct>50?'warn':'ok')+'">Today: $'+today.usd.toFixed(4)+' / $'+cap.toFixed(2)+' cap ('+pct.toFixed(0)+'%)</span>';
  tb('spend').innerHTML = (d.spend||[]).map(s => '<tr><td>'+s.day+'</td><td>$'+s.usd.toFixed(4)+'</td><td>'+s.calls+'</td><td>'+s.input_tokens+'</td><td>'+s.output_tokens+'</td></tr>').join('');
}
async function skip(id){ await fetch('/api/calendar/'+id+'/skip',{method:'POST',headers:H()}); load(); }
load();
</script>
</body></html>`;
}
