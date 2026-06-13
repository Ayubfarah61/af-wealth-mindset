// Director Agent
// 3 engagement posts per day, rotated across all 4 products so each gets balanced coverage.
// Product videos slot into the schedule when videos exist (one every other day at 00:30 UTC).
// Each post is a "Dear ___" psychological letter from the Trend Scout — no product noun in body.

import { nextVideoToPost, scheduleEntry, markIdeaUsed, log } from '../lib/db.js';
import { generateDailyIdeas } from './trend-scout.js';

// 3 daily slots — spread across global prime times.
const ENGAGEMENT_SLOTS_UTC = ['13:00', '18:00', '23:00'];
// 13:00 UTC = 9am ET / 6am PT / 2pm UK   — morning hook
// 18:00 UTC = 1pm ET / 10am PT / 7pm UK  — lunch / UK evening
// 23:00 UTC = 6pm ET / 3pm PT / 11pm UK  — US evening peak

const PRODUCT_SLOT_UTC = '00:30';    // 7:30pm ET / 4:30pm PT — fits videos when registered

function isoAt(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
}

function daysSinceEpoch(date) {
  return Math.floor(date.getTime() / 86400000);
}

async function topIdeasAny(env, limit) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM ideas WHERE used = 0 ORDER BY id ASC LIMIT ?`
  ).bind(limit).all();
  return results;
}

// Counts already-scheduled posts per product for a given day, so we can balance.
async function dayProductCounts(env, dayIso) {
  const { results } = await env.DB.prepare(`
    SELECT product_id, COUNT(*) AS n
    FROM calendar
    WHERE date(scheduled_at) = date(?)
    GROUP BY product_id
  `).bind(dayIso).all();
  const map = {};
  results.forEach(r => { map[r.product_id || 0] = r.n; });
  return map;
}

// Pick an idea whose product is least-used today and least-used overall.
// Falls back to "any oldest" if no product-balanced match available.
function pickBalancedIdea(pool, dayCounts, productIds) {
  if (!pool.length) return null;

  // Score each product by (today's count, lifetime usage proxy via id sequence)
  const targetProducts = productIds.slice().sort((a, b) => (dayCounts[a] || 0) - (dayCounts[b] || 0));

  for (const pid of targetProducts) {
    const idx = pool.findIndex(i => i.product_id === pid);
    if (idx !== -1) return pool[idx];
  }
  // No product-matched idea — return oldest as fallback
  return pool[0];
}

// Plan the next 2 days if not already scheduled.
export async function plan(env) {
  // Get the 4 product IDs so we know what to balance across.
  const { results: products } = await env.DB.prepare(
    `SELECT id FROM products ORDER BY id`
  ).all();
  const productIds = products.map(p => p.id);

  // Refresh ideas if pool is thin.
  const { results: poolCount } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ideas WHERE used = 0`
  ).all();
  if (!poolCount[0] || poolCount[0].n < 15) {
    await generateDailyIdeas(env, 16);
  }

  const planned = [];

  for (let i = 1; i <= 2; i++) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + i);
    day.setUTCHours(0, 0, 0, 0);

    // Optional: product video every other day if we have videos to post.
    if (daysSinceEpoch(day) % 2 === 0) {
      const already = await env.DB.prepare(
        `SELECT id FROM calendar WHERE type='product_video' AND date(scheduled_at)=date(?)`
      ).bind(day.toISOString()).first();
      if (!already) {
        const video = await nextVideoToPost(env);
        if (video) {
          const cycle = (video.run_count || 0) + 1;
          const id = await scheduleEntry(env, {
            type: 'product_video',
            productId: video.product_id,
            videoId: video.id,
            when: isoAt(day, PRODUCT_SLOT_UTC),
            cycle,
            notes: JSON.stringify({ pickedBy: 'director', rotation: 'longest-idle' })
          });
          planned.push({ kind: 'product_video', id, videoId: video.id, cycle });
        }
      }
    }

    // 3 engagement posts per day, one per slot, each tied to a different product when possible.
    const dayIso = day.toISOString();
    const dayCounts = await dayProductCounts(env, dayIso);
    const pool = await topIdeasAny(env, 80);

    for (const hhmm of ENGAGEMENT_SLOTS_UTC) {
      const slotIso = isoAt(day, hhmm);
      const already = await env.DB.prepare(
        `SELECT id FROM calendar WHERE type='engagement' AND scheduled_at=?`
      ).bind(slotIso).first();
      if (already) continue;

      if (!pool.length) break;

      const idea = pickBalancedIdea(pool, dayCounts, productIds);
      if (!idea) break;

      const id = await scheduleEntry(env, {
        type: 'engagement',
        productId: idea.product_id,
        videoId: null,
        when: slotIso,
        cycle: 1,
        notes: JSON.stringify({ id: idea.id, category: idea.category, body: idea.body, product_id: idea.product_id })
      });
      await markIdeaUsed(env, idea.id);

      // Update local trackers so the next slot picks a DIFFERENT product
      dayCounts[idea.product_id || 0] = (dayCounts[idea.product_id || 0] || 0) + 1;
      const idx = pool.findIndex(p => p.id === idea.id);
      if (idx >= 0) pool.splice(idx, 1);

      planned.push({ kind: 'engagement', id, slot: hhmm, product_id: idea.product_id, idea: idea.body.slice(0, 80) });
    }
  }

  await log(env, `Director planned ${planned.length} slots`, { planned });
  return planned;
}
