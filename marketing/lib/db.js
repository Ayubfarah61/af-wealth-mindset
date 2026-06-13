// Thin wrapper around D1 — used by every agent and platform.
// `env.DB` is the D1 binding declared in wrangler.toml.

export async function getProducts(env) {
  const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY id').all();
  return results;
}

export async function getProduct(env, id) {
  return env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
}

export async function getActiveVideos(env, productId) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM videos WHERE product_id = ? AND active = 1 ORDER BY slot'
  ).bind(productId).all();
  return results;
}

// Pick the video that's been posted the longest ago (or never) for the rotation.
export async function nextVideoToPost(env) {
  const { results } = await env.DB.prepare(`
    SELECT v.*,
      (SELECT MAX(c.scheduled_at) FROM calendar c WHERE c.video_id = v.id AND c.status = 'published') AS last_used,
      (SELECT COUNT(*) FROM calendar c WHERE c.video_id = v.id AND c.status = 'published') AS run_count
    FROM videos v
    WHERE v.active = 1
    ORDER BY (last_used IS NULL) DESC, last_used ASC, v.id ASC
    LIMIT 1
  `).all();
  return results[0] || null;
}

export async function scheduleEntry(env, { type, productId, videoId, when, cycle, notes }) {
  const result = await env.DB.prepare(`
    INSERT INTO calendar (scheduled_at, type, product_id, video_id, cycle, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(when, type, productId || null, videoId || null, cycle || 1, notes || null).run();
  return result.meta.last_row_id;
}

export async function dueEntries(env, limit = 5) {
  const { results } = await env.DB.prepare(`
    SELECT c.*, v.source_url AS video_url, v.thumbnail_url, v.hook, v.scenario, v.persona,
           p.name AS product_name, p.pitch AS product_pitch, p.url AS product_url
    FROM calendar c
    LEFT JOIN videos v ON v.id = c.video_id
    LEFT JOIN products p ON p.id = c.product_id
    WHERE c.status = 'pending' AND c.scheduled_at <= datetime('now')
    ORDER BY c.scheduled_at ASC
    LIMIT ?
  `).bind(limit).all();
  return results;
}

export async function markCalendar(env, id, status, notes) {
  await env.DB.prepare('UPDATE calendar SET status = ?, notes = COALESCE(?, notes) WHERE id = ?')
    .bind(status, notes || null, id).run();
}

export async function recordPost(env, { calendarId, platform, externalId, url, caption, hashtags, variant, status, error }) {
  await env.DB.prepare(`
    INSERT INTO posts (calendar_id, platform, external_id, url, caption, hashtags, variant, status, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(calendarId, platform, externalId || null, url || null, caption, hashtags || null, variant || null, status || 'live', error || null).run();
}

export async function recentCaptions(env, videoId, limit = 5) {
  const { results } = await env.DB.prepare(`
    SELECT p.caption, p.variant, p.platform
    FROM posts p
    JOIN calendar c ON c.id = p.calendar_id
    WHERE c.video_id = ?
    ORDER BY p.posted_at DESC
    LIMIT ?
  `).bind(videoId, limit).all();
  return results;
}

export async function topIdeas(env, category, limit = 20) {
  const { results } = await env.DB.prepare(`
    SELECT * FROM ideas
    WHERE category = ? AND used = 0
    ORDER BY id DESC
    LIMIT ?
  `).bind(category, limit).all();
  return results;
}

export async function saveIdeas(env, ideas) {
  const stmts = ideas.map(i =>
    env.DB.prepare('INSERT INTO ideas (category, product_id, body) VALUES (?, ?, ?)')
      .bind(i.category, i.product_id || null, i.body)
  );
  if (stmts.length) await env.DB.batch(stmts);
}

export async function markIdeaUsed(env, id) {
  await env.DB.prepare('UPDATE ideas SET used = 1 WHERE id = ?').bind(id).run();
}

export async function log(env, decision, payload) {
  await env.DB.prepare('INSERT INTO director_log (decision, payload) VALUES (?, ?)')
    .bind(decision, payload ? JSON.stringify(payload) : null).run();
}
