# AFWM Marketing Brain

A 4-agent system that posts to TikTok, Instagram, Facebook, YouTube, and Pinterest on a schedule — and rewrites itself when content rotates.

## What it does

| Agent | Job |
|---|---|
| **Director** | Plans the next 48h: 1 product video every other day + 2 engagement posts every day. Rotates across all 20 videos by "longest idle first." |
| **Trend Scout** | Once a day, generates 12 fresh angles (hooks, jokes, hot takes, screenshot ideas, comparisons) the director draws from. |
| **Content Writer** | For each scheduled slot, writes platform-tailored copy: TikTok hook + IG Reels caption + FB post + YT title/description + Pinterest pin. On re-cycles it sees prior captions and writes fresh angles. |
| **Publisher** (per platform) | Posts via official APIs: TikTok Content Posting, Meta Graph (IG+FB), YouTube Data v3, Pinterest v5. |

All decisions and metrics live in Cloudflare D1 (`afwm-marketing`). Dashboard is at the Worker's root URL.

## What you need before launch

1. **Cloudflare account** (already have it)
2. **Anthropic API key** (have it) — paste it as `ANTHROPIC_API_KEY` secret
3. **20 product videos** — 5 per product (id 2, 3, 4, 5). Each video uploaded somewhere with a **public mp4 URL** (R2, Bunny.net, or YouTube unlisted with a direct CDN link). Public Drive/Dropbox links DO NOT work — platforms can't pull from them.
4. **Per-platform OAuth tokens** (see below)
5. **A nice 1080×1350 thumbnail per video** for Pinterest (Pinterest is the highest-ROI platform for digital templates, don't skip it)

## Deploy

```sh
# from the repo root
cd marketing

# 1) create the database
wrangler d1 create afwm-marketing
# paste the returned database_id into wrangler.toml

# 2) load the schema (creates tables + seeds the 4 products)
wrangler d1 execute afwm-marketing --remote --file=memory/schema.sql

# 3) set secrets (one-time)
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put ADMIN_TOKEN          # any long random string — you use it to log into the dashboard

# 4) deploy
wrangler deploy
```

Open the printed URL. Paste your `ADMIN_TOKEN`. You're in.

## Add your 20 videos

Two ways:

**A) Dashboard (easy)** — fill the "Register a product video" form once per video.

**B) Bulk via API:**
```sh
curl -X POST https://afwm-marketing.<account>.workers.dev/api/videos \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 4,
    "slot": 1,
    "source_url": "https://pub-xxx.r2.dev/debt-1-doctor-cooking.mp4",
    "thumbnail_url": "https://pub-xxx.r2.dev/debt-1-doctor-cooking.jpg",
    "persona": "doctor earning $6k/mo",
    "scenario": "cooking dinner",
    "hook": "doctor making 6k cant afford weekly groceries — until this sheet"
  }'
```

## Platform OAuth (one-time per platform)

### Meta (Instagram + Facebook) — easiest
1. https://developers.facebook.com → Create app → "Business" type
2. Connect your Facebook Page → connect Instagram (must be a Business/Creator IG)
3. Use Graph API Explorer to grab a **long-lived Page access token** with: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
4. `wrangler secret put META_ACCESS_TOKEN`
5. `wrangler secret put FB_PAGE_ID` (find in Page Settings)
6. `wrangler secret put IG_USER_ID` (Graph API Explorer: `GET /me/accounts` → `instagram_business_account.id`)

### YouTube
1. https://console.cloud.google.com → enable YouTube Data API v3
2. Create OAuth 2.0 Client (Web app), add `https://developers.google.com/oauthplayground` as redirect URI
3. In OAuth Playground, authorize scope `https://www.googleapis.com/auth/youtube.upload` and exchange for refresh token
4. `wrangler secret put YOUTUBE_CLIENT_ID`
5. `wrangler secret put YOUTUBE_CLIENT_SECRET`
6. `wrangler secret put YOUTUBE_REFRESH_TOKEN`

### Pinterest
1. https://developers.pinterest.com → Create app, get approved (instant for basic posting)
2. Generate an access token with `boards:read,pins:write,pins:read`
3. Get your Board ID (the board where pins should go — make a "Budget & Money Templates" board)
4. `wrangler secret put PINTEREST_ACCESS_TOKEN`
5. `wrangler secret put PINTEREST_BOARD_ID`

### TikTok
1. https://developers.tiktok.com → Apps → Add the **Content Posting API** product
2. Approval takes 1–4 weeks. **While you wait:** keep `TIKTOK_DRAFT_ONLY=1` in `wrangler.toml`. Videos land in your TikTok drafts; you tap publish manually (~10 sec each).
3. When approved, flip `TIKTOK_DRAFT_ONLY=0` and redeploy.
4. `wrangler secret put TIKTOK_ACCESS_TOKEN`

## How posting cadence works

- **Every 30 minutes** the executor wakes up, checks for due calendar items, runs the Content Writer, fans out to all enabled platforms, and logs results.
- **Once a day at 06:00 UTC** the Director plans the next 48h and the Trend Scout refills the idea pool.
- Each of the 20 product videos rotates at **longest-idle first**. Once all 20 are posted, the rotation restarts with `cycle=2` — the Content Writer is told "you already posted this, write a different angle."
- 2 engagement posts/day go out at 14:00 UTC (~9am ET) and 22:00 UTC (~5pm ET).
- TikTok skips engagement posts (no video). Pinterest skips engagement posts that lack an image.

## Cost expectations

- Cloudflare Workers + D1: $0/mo at this volume (free tier)
- Claude Haiku 4.5 (default): ~3¢/day = **~$1/mo** for content gen
- Bump to Sonnet via `CLAUDE_MODEL` env var if you want sharper copy: ~$5–10/mo
- Platform APIs: $0 except X (which we're skipping unless you want to pay $200/mo)

When sales start: route 1% to ads via Meta + Pinterest. The system already knows which posts converted (post URLs → UTMs to your product page) — you can read winners from the dashboard and boost manually.

## Manual overrides

- **Skip a post**: dashboard → upcoming → "skip"
- **Force-generate ideas**: dashboard → "Generate ideas"
- **Force a plan run**: dashboard → "Plan next 48h"
- **Force-execute due items**: dashboard → "Execute due now"
- **Pull a video from rotation**: `UPDATE videos SET active=0 WHERE id=?` via wrangler d1 execute

## What's intentionally not in this system

- **Image generation for engagement posts.** Engagement posts need an image for IG/Pinterest. Easiest path: drop in 10–20 reusable templated images to a public bucket, then add a column `engagement_images.url` and round-robin them. Holler when you're ready and I'll wire it.
- **Analytics pull-back.** Wired the `metrics` table; the per-platform "fetch insights" code is stubbed. Easy to add once you have real posts going.
- **A/B testing.** Right now Content Writer picks one angle. Easy upgrade: write 2, post to two platforms, score after 7 days.
