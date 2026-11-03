# IdentityLock AI storefront

Static marketing site with Vercel serverless checkout, Paystack verification, and protected ZIP delivery.

## Current product configuration

- Product: IdentityLock AI Complete Bundle
- One-time price: **NGN ₦24,900**
- Currency: **NGN**
- Paystack amount sent to the API: **2,490,000 kobo**
- Product metadata identifier: `identitylock-ai`

Keep the amount, currency, and product identifier consistent across checkout initialization, verification, and protected download.

## Configuration

1. Add `PAYSTACK_SECRET_KEY` to the Vercel environment for the intended deployment. Use a Paystack test secret for test-mode validation.
2. Keep the product archive at `.private-assets/IdentityLock_AI_Complete_Bundle.zip`. This is a server-side directory and must never be moved into the public web root.
3. Deploy through the connected Vercel project.
4. Test checkout and verification with Paystack test credentials before enabling live transactions.

## Payment and delivery flow

- `POST /api/checkout` initializes a one-time NGN ₦24,900 transaction.
- `GET /api/verify` verifies transaction status, NGN currency, amount (2,490,000 kobo), and product metadata with Paystack.
- `GET /api/download` independently repeats server-side verification before streaming the protected ZIP.
- The Paystack secret and paid product archive must never be sent to the browser.

## Launch checks

- Confirm the correct Paystack test/live secret is configured for the intended Vercel environment.
- Confirm the product archive exists at the exact private path and is readable by the serverless runtime.
- Test successful, pending, failed, wrong-amount, wrong-currency, and wrong-product verification paths in test mode.
- Confirm download is denied unless Paystack independently verifies a successful matching transaction.
- Verify legal, refund, privacy, and support details before accepting live payments.

## Deployment

The project is a static site with Vercel serverless API routes. Use the Vercel project configuration already connected to this repository. Do not change the production deployment or payment environment as part of a preview-only repair.
