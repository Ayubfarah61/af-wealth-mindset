// Director Agent
// Two responsibilities:
//   1. Plan: every day at planning time, fill the calendar for the next 48h.
//      - 1 product-video slot every other day (rotation across 20 videos)
//      - 2 engagement slots every day (drawn from Trend Scout ideas)
//   2. Execute: each tick, pull due calendar entries, generate copy, fan out to all platforms.

import { nextVideoToPost, scheduleEntry, markIdeaUsed, log } from '../lib/db.js';
import { generateDailyIdeas } from './trend-scout.js';

// Slots in UTC. Pick times that hit prime evening across US time zones.
const PRODUCT_SLOT_UTC = '00:30';    // 7:30pm ET / 4:30pm PT
const ENGAGEMENT_SLOTS_UTC = ['14:00', '22:00']; // 9am ET, 5pm ET / 6am PT, 2pm PT

function isoAt(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
}

function daysSinceEpoch(date) {
  return Math.floor(date.getTime() / 86400000);
}

// Plan tomorrow and the day after if not already planned.
export async function plan(env) {
  // 1) Make sure we have fresh ideas for today (refresh every 24h).
  const { results: recent } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ideas WHERE used = 0 AND created_at >= datetime('now','-1 day')`
  ).all();
  if (!recent[0] || recent[0].n < 6) {
    await generateDailyIdeas(env, 12);
  }

  const planned = [];
  for (let i = 1; i <= 2; i++) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + i);
    day.setUTCHours(0, 0, 0, 0);

    // Product video every other day (even days since epoch).
    if (daysSinceEpoch(day) % 2 === 0) {
      // Skip if already scheduled
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

    // 2 engagement posts every day
    const ideas = await topIdeasAny(env, 50); // any category
    const pool = ideas.length ? ideas : await (async () => {
      await generateDailyIdeas(env, 12);
      return topIdeasAny(env, 50);
    })();

    for (const hhmm of ENGAGEMENT_SLOTS_UTC) {
      const already = await env.DB.prepare(
        `SELECT id FROM calendar WHERE type='engagement' AND scheduled_at=?`
      ).bind(isoAt(day, hhmm)).first();
      if (already) continue;

      const idea = pickIdea(pool);
      if (!idea) continue;
      const id = await scheduleEntry(env, {
        type: 'engagement',
        productId: idea.product_id,
        videoId: null,
        when: isoAt(day, hhmm),
        cycle: 1,
        notes: JSON.stringify({ id: idea.id, category: idea.category, body: idea.body, product_id: idea.product_id })
      });
      await markIdeaUsed(env, idea.id);
      // remove from local pool
      const idx = pool.findIndex(p => p.id === idea.id);
      if (idx >= 0) pool.splice(idx, 1);
      planned.push({ kind: 'engagement', id, idea: idea.body.slice(0, 60) });
    }
  }

  await log(env, `Director planned ${planned.length} slots`, { planned });
  return planned;
}

function pickIdea(pool) {
  if (!pool.length) return null;
  // Prefer mix: rotate through categories
  // Take the oldest unused first (id ascending). Simple and deterministic.
  pool.sort((a, b) => a.id - b.id);
  return pool[0];
}

// Get the topIdeas helper to work with null category too
// (override the one in db.js inline so we don't need to ship two queries)
async function topIdeasAny(env, limit) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM ideas WHERE used = 0 ORDER BY id ASC LIMIT ?`
  ).bind(limit).all();
  return results;
}
