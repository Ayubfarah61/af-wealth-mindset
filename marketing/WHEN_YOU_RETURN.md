# 🛬 When You Return — One-Page Checklist

Everything you need to do, in priority order. Each item has the exact click or copy step.

---

## ⏱️ Status right now

**Dashboard:** https://afwm-marketing.eastafricaexchangecoltd.workers.dev
**Admin token:** `SfkHLG1cRNcujl4v1GV-NcQTOu94LG0MjNxJYOMd`

### What's auto-running (no action needed)
- ✅ Facebook (653 followers) — 3 posts/day
- ✅ Instagram (316 followers) — 3 posts/day
- ✅ Bluesky — 3 posts/day
- ✅ Trend Scout — generating fresh letters daily at 06:00 UTC
- ✅ Director — planning next 48h daily
- ✅ Site visitor tracking — every page hit logged
- ✅ 60 unique branded card images rotating

### Pending platform approvals (no action — just wait for email)
- 🟡 Pinterest Standard access (submitted, 1-3 days)
- 🟡 TikTok Content Posting API (submitted? see below — 1-4 weeks)

---

## 🎯 Quick action items (do these in order)

### 1. Submit TikTok demo video (3 min)

The Pinterest video works perfectly for TikTok too — same content requirements.

- Open https://developers.tiktok.com/app/7650913914103973909/pending
- Scroll to **Demo video** section in App review
- Upload `C:\Users\ADMIN\Downloads\202606150204.mp4` (same file as Pinterest)
- Fill **Description**:
  ```
  AF Wealth Mindset uploads daily branded image cards (educational money-tracking tips) to our own TikTok account using TikTok's Content Posting API. We post to drafts only; a human reviewer publishes each post. Sells one-time Excel and Google Sheets templates. No financial advice. No subscriptions.
  ```
- Solve CAPTCHA
- Click **Submit for review**

### 2. Add `PADDLE_API_KEY` so Sales counter activates (1 min)

Open PowerShell, paste:
```powershell
cd "C:\Users\ADMIN\Downloads\the money making\af-wealth-mindset\marketing"
```

Then:
```powershell
$key = "YOUR_PADDLE_API_KEY_HERE"
[Console]::Write($key); $key | npx wrangler secret put PADDLE_API_KEY
```

(Get it from https://vendors.paddle.com → Developer Tools → API Keys)

### 3. Add Threads platform (~10 min)

Say "**add Threads**" to me when you're back. I drive Chrome. You click "Allow" once. We're done.

What happens:
- I open Meta dashboard
- You add the Threads use case (1 click)
- You generate a token in Graph Explorer (1 login + 1 Allow click)
- I upload secrets + deploy
- Result: 4 active platforms

### 4. Add LinkedIn (~15 min)

Say "**add LinkedIn**" when you're back.

What happens:
- I open developer.linkedin.com
- You sign in and confirm company page access
- You authorize OAuth (1 click)
- I upload secrets + deploy
- Result: 5 active platforms

### 5. Add Mastodon (~5 min)

Say "**add Mastodon**" when you're back. Pre-requisite: have a Mastodon account (free, 60-sec signup at mastodon.social).

What happens:
- Open your Mastodon settings
- Create an Application (Profile → Settings → Development → New Application)
- Copy access token → paste to me
- I upload + deploy
- Result: 6 active platforms

### 6. (Optional) Upload product videos (when ready)

When you have your 20 product videos (5 per product × 4 products):
- Upload them to a public URL (R2 bucket, Bunny.net, or YouTube unlisted with direct mp4 link)
- Open the dashboard → "Register a product video" form
- Fill: product, slot 1-5, video URL, thumbnail URL, persona, scenario, hook
- Result: YouTube starts auto-posting + product-video rotation activates

---

## 📊 What the dashboard shows when you return

**Hero row 1:**
- Sales today (count + $ revenue) — needs Paddle key first
- Total followers across platforms (live numbers)
- Next post countdown

**Hero row 2:**
- Posts today (across all platforms)
- Site visitors today + last 7 days
- Spend today / cap

**Platform health cards:** live/error/waiting badge per platform with today's count and lifetime stats.

**Tables:** upcoming queue, recent posts (with links), director log, spend history.

**Auto-refreshes every 60 seconds.**

---

## 🐛 If something's broken when you check in

### "No posts going out"
1. Open dashboard → check Status banner
2. Click "Execute due now" button
3. If still nothing: `cd marketing && npx wrangler tail afwm-marketing` to see logs

### "Pinterest still says pending"
- Normal. Check email — they'll send approved/denied notice in 1-3 days.
- If still nothing after 5 days: log into developers.pinterest.com and check the upgrade request page.

### "TikTok rejected the demo video"
- Re-record with the script in `WHEN_YOU_RETURN.md` (this file's section above) emphasizing "no financial advice" and "we post our own content only"
- Resubmit at https://developers.tiktok.com/app/7650913914103973909/pending

### "A platform is failing today"
- Dashboard recent posts table shows the exact error
- Most common: token expired → just say "fix [platform] token" to me, I'll drive the re-auth

### "I want to stop the agents posting for a day"
- Open the dashboard → click "skip" next to any upcoming post
- Or in PowerShell: `cd marketing && npx wrangler d1 execute afwm-marketing --remote --command "UPDATE calendar SET status='skipped' WHERE status='pending' AND date(scheduled_at) = date('now');"`

---

## 💰 Cost breakdown (so you know what you're paying)

| Service | Monthly | Notes |
|---|---|---|
| Cloudflare Workers (paid plan) | $5 | Required for cron triggers + D1 |
| Cloudflare D1 | $0 | Free tier covers this volume |
| Anthropic Claude API | ~$1-2 | Capped at $2.40/month by the daily $0.08 cap |
| Resend (delivery emails) | $0 | Free tier 3k emails/mo |
| **Total per month** | **~$7** | Whole marketing system + delivery |

When sales come in, you can bump `DAILY_USD_CAP` to $0.20 for better content quality (~$6/mo Anthropic).

---

## 🔐 Secrets reference (already set, in case you ever need to redo one)

```
ANTHROPIC_API_KEY        ✓ set
ADMIN_TOKEN              ✓ SfkHLG1cRNcujl4v1GV-NcQTOu94LG0MjNxJYOMd
YOUTUBE_CLIENT_ID        ✓ set
YOUTUBE_CLIENT_SECRET    ✓ set
YOUTUBE_REFRESH_TOKEN    ✓ set
PINTEREST_ACCESS_TOKEN   ✓ set (Trial mode — works in sandbox, prod after approval)
PINTEREST_REFRESH_TOKEN  ✓ set
PINTEREST_APP_ID         ✓ 1555617
PINTEREST_APP_SECRET     ✓ set
PINTEREST_BOARD_ID       ✓ 881157552033548026
META_ACCESS_TOKEN        ✓ set (Page token, non-expiring)
FB_PAGE_ID               ✓ 104938751537732
IG_USER_ID               ✓ 17841406751128539
BLUESKY_HANDLE           ✓ afwealthmindset.bsky.social
BLUESKY_PASSWORD         ✓ set
PADDLE_API_KEY           ✗ NOT SET — add to enable sales counter
THREADS_ACCESS_TOKEN     ✗ NOT SET — to enable Threads platform
THREADS_USER_ID          ✗ NOT SET
LINKEDIN_ACCESS_TOKEN    ✗ NOT SET — to enable LinkedIn platform
MASTODON_INSTANCE        ✗ NOT SET — to enable Mastodon
MASTODON_ACCESS_TOKEN    ✗ NOT SET
TIKTOK_ACCESS_TOKEN      ✗ NOT SET (waiting on app review)
```

---

## ✍️ Re-recording the demo video (if Pinterest or TikTok asks)

See `marketing/SPEC.md` section "Demo video script" for the exact 75-second script — same one used for both submissions.

---

## 🛟 If you're stuck on anything

Just type the issue. The system saves your full context in memory across conversations, so I'll pick up where we left off.

Sleep / travel well. The brain runs without you.
