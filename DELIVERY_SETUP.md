# AF Wealth Mindset Delivery Setup

The website now has the backend code needed to deliver products after Paddle payment.

The delivery flow is:

1. Customer pays through Paddle.
2. Paddle sends a webhook to the Cloudflare Worker.
3. The Worker verifies the payment is real.
4. The Worker finds the product that was bought.
5. The Worker emails the customer the correct product links.

## Product Files Found Locally

The final Excel files are in:

`D:\My site\Files`

Current file mapping:

| Product | Paddle price ID | Excel file (D:\My site\Files) | Google Sheets link |
|---|---|---|---|
| The Ultimate Budget Planner | `pri_01kpqtwd3gxej4n3zmwj7q3jna` | yes | **Excel only** — no Google Sheets version |
| The Profit Tracker | `pri_01kpr10frj3w82ek1jjbzrd9wn` | yes | **Excel only** — no Google Sheets version |
| Debt Payoff Dashboard | `pri_01kpr12ct1sz1aqvnyweskx44x` | yes | `https://docs.google.com/spreadsheets/d/1h2nIW5JYBZy8A5J9MQspJosbg7JdxtvpJnhLkIjdgtg/copy` |
| 12-Month Cash Flow Budget | `pri_01kpr142by79r7r16pg9xgv570` | yes | `https://docs.google.com/spreadsheets/d/1sUcqPBMOUN_KjfZZJORFYyviHWMJ8ahHpnu5tEFTkz4/copy` |

Only the Debt Payoff Dashboard and the 12-Month Cash Flow Budget have Google Sheets versions. The Ultimate Budget Planner and The Profit Tracker are delivered as Excel files only — their delivery emails will not show a "Open Google Sheets copy" button.

### Next Step: Upload Excel Files To Cloudflare R2

Upload the four final Excel files from `D:\My site\Files` to the `afwm-products` R2 bucket, then update `PRODUCT_LINKS` (see below) with the public R2 URLs.

### How-To Video Links (Placeholder)

The Worker now supports an optional `videoUrl` per product — a short explainer video showing how to use that template. This is currently empty for all products. When a video is ready for a product, add it via:

- `PRODUCT_LINKS` JSON (`videoUrl` field), or
- the per-product env var `PRODUCT_<id>_VIDEO_URL` (e.g. `PRODUCT_2_VIDEO_URL` for The Ultimate Budget Planner)

where `<id>` is the product's numeric ID (2 = Ultimate Budget Planner, 3 = Profit Tracker, 4 = Debt Payoff Dashboard, 5 = 12-Month Cash Flow Budget).

If set, the delivery email will include a "Watch how-to video" button/link automatically — no code changes needed.

## Where The Files Should Go

Do not put paid Excel files in the public GitHub repo.

Use:

- Excel files: Cloudflare R2 bucket, recommended bucket name `afwm-products`
- Google Sheets: Google Drive copy links

## Cloudflare Deployment

The GitHub workflow now deploys both:

- Cloudflare Pages website: `af-wealth-mindset`
- Cloudflare Worker delivery API: `afwm-delivery-api`

The Worker is routed to:

- `https://afwealthmindset.com/api/*`
- `https://www.afwealthmindset.com/api/*`

## What Still Needs To Be Connected

These values must be added in Cloudflare Worker secrets or environment variables.

### Required Email Values

Use Resend or another email provider supported by the Worker code.

- `RESEND_API_KEY`
- `FROM_EMAIL`
- `SUPPORT_EMAIL`

Recommended:

- `FROM_EMAIL`: `AF Wealth Mindset <sales@afwealthmindset.com>`
- `SUPPORT_EMAIL`: `sales@afwealthmindset.com`

### Required Paddle Values

- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_API_KEY`

The webhook URL to add inside Paddle is:

`https://afwealthmindset.com/api/paddle-webhook`

Subscribe the webhook to:

- `transaction.paid`
- `transaction.completed`

### Required Product Links

Add `PRODUCT_LINKS` as JSON in the Cloudflare Worker after the Excel files are uploaded to R2.

Replace the `PASTE_*_EXCEL_R2_LINK` placeholders with the real R2 links.

```json
{
  "pri_01kpqtwd3gxej4n3zmwj7q3jna": {
    "excelUrl": "PASTE_BUDGET_PLANNER_EXCEL_R2_LINK",
    "videoUrl": "PASTE_BUDGET_PLANNER_HOWTO_VIDEO_LINK"
  },
  "pri_01kpr10frj3w82ek1jjbzrd9wn": {
    "excelUrl": "PASTE_PROFIT_TRACKER_EXCEL_R2_LINK",
    "videoUrl": "PASTE_PROFIT_TRACKER_HOWTO_VIDEO_LINK"
  },
  "pri_01kpr12ct1sz1aqvnyweskx44x": {
    "excelUrl": "PASTE_DEBT_DASHBOARD_EXCEL_R2_LINK",
    "googleSheetUrl": "https://docs.google.com/spreadsheets/d/1h2nIW5JYBZy8A5J9MQspJosbg7JdxtvpJnhLkIjdgtg/copy",
    "videoUrl": "PASTE_DEBT_DASHBOARD_HOWTO_VIDEO_LINK"
  },
  "pri_01kpr142by79r7r16pg9xgv570": {
    "excelUrl": "PASTE_CASH_FLOW_BUDGET_EXCEL_R2_LINK",
    "googleSheetUrl": "https://docs.google.com/spreadsheets/d/1sUcqPBMOUN_KjfZZJORFYyviHWMJ8ahHpnu5tEFTkz4/copy",
    "videoUrl": "PASTE_CASH_FLOW_BUDGET_HOWTO_VIDEO_LINK"
  }
}
```

Any field left as `PASTE_...` or empty (`""`) is simply omitted from the delivery email — it's safe to leave placeholders until the real links are ready.

## Test Delivery

After the secrets are added, test before starting marketing.

The Worker has this endpoint:

`POST https://afwealthmindset.com/api/test-delivery`

It requires this header:

`Authorization: Bearer YOUR_DELIVERY_TEST_TOKEN`

And this JSON body:

```json
{
  "email": "your-test-email@example.com",
  "priceId": "pri_01kpqtwd3gxej4n3zmwj7q3jna"
}
```

## Important

Do not start paid ads until these checks pass:

- Payment succeeds in Paddle.
- Paddle webhook reaches Cloudflare.
- Email arrives in inbox.
- Excel link opens or downloads.
- Google Sheets copy link opens.
- Support email is correct.
