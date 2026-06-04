# AF Wealth Mindset Delivery Setup

The website now has the backend code needed to deliver products after Paddle payment.

The delivery flow is:

1. Customer pays through Paddle.
2. Paddle sends a webhook to the Cloudflare Worker.
3. The Worker verifies the payment is real.
4. The Worker finds the product that was bought.
5. The Worker emails the customer the Excel and Google Sheets links.

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

Add `PRODUCT_LINKS` as JSON.

Replace the placeholder links with the real Excel download links and Google Sheets copy links.

```json
{
  "pri_01kpqtwd3gxej4n3zmwj7q3jna": {
    "excelUrl": "PASTE_BUDGET_PLANNER_EXCEL_LINK",
    "googleSheetUrl": "PASTE_BUDGET_PLANNER_GOOGLE_SHEETS_COPY_LINK"
  },
  "pri_01kpr10frj3w82ek1jjbzrd9wn": {
    "excelUrl": "PASTE_PROFIT_TRACKER_EXCEL_LINK",
    "googleSheetUrl": "PASTE_PROFIT_TRACKER_GOOGLE_SHEETS_COPY_LINK"
  },
  "pri_01kpr12ct1sz1aqvnyweskx44x": {
    "excelUrl": "PASTE_DEBT_DASHBOARD_EXCEL_LINK",
    "googleSheetUrl": "PASTE_DEBT_DASHBOARD_GOOGLE_SHEETS_COPY_LINK"
  },
  "pri_01kpr142by79r7r16pg9xgv570": {
    "excelUrl": "PASTE_CASH_FLOW_BUDGET_EXCEL_LINK",
    "googleSheetUrl": "PASTE_CASH_FLOW_BUDGET_GOOGLE_SHEETS_COPY_LINK"
  }
}
```

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
