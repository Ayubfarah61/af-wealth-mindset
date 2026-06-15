# AFWM Marketing Brain — Locked Format Spec

## ⚠️ CRITICAL — TWO POST TYPES, TWO DIFFERENT RULES

### Engagement posts (text + card image) = AUDIENCE BUILDING ONLY
- These are 3×/day, the bread and butter
- **PURE EDUCATION.** NO links, NO product mentions, NO CTAs, NO "link in bio", NO selling language whatsoever
- Hashtags ARE allowed (they're for discoverability, not selling)
- The reader learns one thing per post. They follow because content is good, not because we asked.
- These posts build the audience.

### Product video posts = WHERE WE SELL
- Only run when user has uploaded product videos (one per slot)
- THIS is where CTAs, "link in bio", product URLs go
- Currently inactive (no videos uploaded)
- These posts convert the audience to customers.

**Never blur the two.** A salesy engagement post burns trust faster than 10 educational posts can build it.

---


**THIS DOCUMENT IS LAW.** Every agent reads it. The Trend Scout, Content Writer, and Card Renderer all conform to what's below. Do not drift.

---

## 1. The Brand

- **Name:** AF Wealth Mindset
- **Handle:** @afwealthmindset
- **Tagline:** Money. Discipline. Truth.
- **Voice:** Wise, blunt, slightly threatening, never preachy. Insider-knowledge energy. We tell you what others won't.
- **Banned words EVERYWHERE:** "unlock", "transform", "game-changer", "10x", "secret" (use "what they don't tell you" instead), "trick", "hack", "you won't believe", "revolutionary".
- **Banned product nouns in BODY (engagement posts):** "budget", "budgeting", "cash flow", "debt payoff", "bookkeeping", "spreadsheet", "template", "tool", "app", "planner", "tracker".
  - These may appear in the caption CTA only, never in the on-card body.

---

## 2. The Logo (LOCKED — v2)

- **Canonical SVG source:** `/images/logo.svg` (perfectly scalable, edit this to redesign)
- **Public URL:** `https://afwealthmindset.com/images/logo.svg`
- **PNG renders:**
  - `/images/logo.png` — 1024×1024 (TikTok app icon, profile pictures)
  - `/images/logo-512.png` — 512×512 (smaller profile pics)
  - `/images/logo-200.png` — 200×200 (site header)
  - `/images/favicon-64.png` — 64×64 (browser tab)
- **Composition (fixed):** Navy `#10243E` coin · Teal `#0F766E` ring · Ivory `#F7F8F5` "AFWM" wordmark · Gold `#B88935→#D7B46A` bar chart · Bright teal `#1FE6D1` arrow soaring up-right
- **Used:**
  - Website header — `<img src="/images/logo-200.png">`
  - Every generated post card — top-left and bottom-right watermark, pulled from public URL
  - Every social profile picture (TikTok, IG, FB, YouTube, Pinterest) — upload `logo.png` (1024×1024) once
- **DO NOT redraw or AI-recreate.** To regenerate PNGs from SVG: `npx sharp-cli -i images/logo.svg -o images/logo.png resize 1024 1024`

---

## 3. The Post Format — "FORBIDDEN KNOWLEDGE" cards

### 3a. Hook structure (the headline)

Every post leads with ONE of these formulas. No exceptions:

1. **Number + threatening claim**
   - "3 questions your bank hopes you never ask yourself"
   - "5 reasons small businesses fail in year two"
   - "7 silent killers of family wealth"

2. **What they don't tell you**
   - "What your accountant won't say out loud"
   - "Business school will never teach this"
   - "The truth about minimum payments"

3. **Why most people / Why nobody told you**
   - "Why most people quit paying debt at month 4"
   - "Why your raises never feel like raises"
   - "Why nobody told you what to do with the bonus"

4. **Money rule X will never touch**
   - "3 money rules your professor will never touch"
   - "The rule your bank uses that they'll never explain to you"

### 3b. Body structure

- Optional one-line LEAD (16-20 words, italicized when card-rendered)
- THEN: a numbered list — **3 to 7 items**, each ≤ 18 words
- Numbers shown as **01, 02, 03** (zero-padded) — feels official/document-like
- No emojis anywhere in the body

### 3c. Tone

- Blunt insider warnings.
- Second person ("you", "your") almost always.
- Slight threat: name a regret, a future pain, a cycle they're trapped in.
- Never preachy. Never "you should". Use "you will" / "you are" / "they will not".

### 3d. CTA — caption only, never in body

| Platform | CTA style |
|---|---|
| TikTok | "Link in bio if this hit." or "Tool in bio if you want out of this cycle." |
| Instagram | "Save this. Link in bio." |
| Facebook | "If this is you: <product_url>" |
| YouTube | Description: 1 line of the hook + `<product_url>` + #Shorts |
| Pinterest | Description teaches first, ends with one soft line. Destination link = product URL. |

If `product_id == null`, NO product CTA. Just "Follow for more."

---

## 4. The Visual Card — "Leaked Classified Document"

Dimensions: **1080×1350** portrait (IG, Pinterest, FB feed safe).

### Colour palette (LOCKED)

| Use | Hex |
|---|---|
| Background top | `#1a2438` |
| Background bottom | `#050810` |
| Body text | `#F6F1E7` (ivory) |
| Dim text | `rgba(246,241,231,0.85)` |
| Gold accent (logo, headline highlight, numbers, brackets) | `#D7B46A` |
| Gold bright (hover, logo center) | `#F4D77A` |
| Gold deep (logo shadow) | `#B88935` |

### Typography (LOCKED)

| Element | Font | Weight | Size |
|---|---|---|---|
| Brand name | Manrope | 800 | 18pt |
| Brand tagline | Manrope | 600 | 12pt, uppercase, 0.05em spacing |
| Classified stamp | Manrope | 800 | 10pt, uppercase, 0.25em spacing, 1.5px gold border |
| **The hook headline** | **Cormorant Garamond Italic** | **700** | **44pt, line-height 1.1** |
| Lead line | Manrope | 500 | 18pt italic, 85% opacity |
| Numbered list item | Manrope | 500 | 19pt |
| Number prefix (01, 02…) | Manrope | 800 | 16pt, gold (#D7B46A) |
| Footer URL | Manrope | 700 | 12pt, uppercase, 0.12em spacing |

### Structural elements (LOCKED)

- Gold corner brackets top-left and bottom-right (50×50, 2px, opacity 0.5)
- Top: 50×50 gold coin logo + "AF Wealth Mindset" + "Money. Discipline. Truth."
- Bracket-stamped classified label (e.g. "WHAT THEY DON'T TELL YOU")
- Hook headline (italic serif, gold accent on key word)
- Numbered list (each row separated by faint gold underline rgba(215,180,106,0.15))
- Bottom: thin gold divider → `afwealthmindset.com` (left, gold) + 22×22 gold coin watermark (right)

### Reference

The canonical visual template lives in `marketing/card-preview.html`. Updating that file = updating the spec.

---

## 5. The Rotation (LOCKED)

- **3 posts per day** at slot times: 13:00, 18:00, 23:00 UTC
- Each day rotates through products: 2 → 3 → 4 → 5 → 2 → 3 → 4 → 5 → ...
- Trend Scout regenerates idea pool whenever fewer than 15 unused ideas remain.

---

## 5b. Cover Banners (LOCKED)

| Platform | File | Size | URL |
|---|---|---|---|
| YouTube | `cover-youtube.svg` / `.png` | 2048×1152 | `/images/cover-youtube.png` |
| Facebook Page | `cover-facebook.svg` / `.png` | 1640×624 | `/images/cover-facebook.png` |
| X / Twitter | `cover-twitter.svg` / `.png` | 1500×500 | `/images/cover-twitter.png` |

To regenerate after editing an SVG:
```
npx --yes sharp-cli -i images/cover-<platform>.svg -o images/cover-<platform>.png resize <W> <H>
```

## 6. Profile Picture Standardization

When user updates each platform's profile picture, use:
`https://afwealthmindset.com/images/logo.png`

Platforms to update manually (once each, ~30 sec per platform):

- [ ] Instagram (@afwealthmindset)
- [ ] Facebook (AF Wealth Mindset Page)
- [ ] TikTok (@afwealthmindset)
- [ ] YouTube (@afwealthmindset)
- [ ] Pinterest (afwealthmindset) — already updated ✓
- [ ] X / Twitter

For TikTok app icon (developer portal submission): same file at 1024×1024.

---

## 7. Future format evolution

If the user later wants to change the format:
1. Update this SPEC.md
2. Update both `agents/trend-scout.js` and `agents/content-writer.js` to reference new rules
3. Update `card-preview.html` if visuals change
4. Re-deploy the Worker

Never edit the prompts ad-hoc without also updating this file. The spec is the source of truth.
