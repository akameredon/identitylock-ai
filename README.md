# IdentityLock AI storefront

Static marketing site with Vercel serverless checkout, Paystack verification, and protected ZIP delivery.

## Current product configuration

- Product: IdentityLock AI Complete Bundle
- Permanent one-time price: **NGN ₦500**
- Currency: **NGN**
- Paystack amount sent to the API: **50,000 kobo**
- Product metadata identifier: `identitylock-ai`

Keep the amount, currency, and product identifier consistent across checkout initialization, verification, and protected download. ₦500 is the approved ongoing product price, not a temporary test price.

## Configuration

1. Keep `PAYSTACK_SECRET_KEY` configured in the Vercel production environment. Use a Paystack live secret for live transactions; never expose it in browser code.
2. Keep the product archive at `.private-assets/IdentityLock_AI_Complete_Bundle.zip`. This is a server-side directory and must never be moved into the public web root.
3. Deploy through the connected Vercel project.

## Payment and delivery flow

- `POST /api/checkout` initializes a one-time NGN ₦500 transaction.
- `GET /api/verify` verifies transaction status, NGN currency, amount (50,000 kobo), and product metadata with Paystack.
- `GET /api/download` independently repeats server-side verification before streaming the protected ZIP.
- The Paystack secret and paid product archive must never be sent to the browser.

## Launch checks

- Confirm the correct Paystack live secret is configured for production.
- Confirm the product archive exists at the exact private path and is readable by the serverless runtime.
- Confirm successful payment verification and protected download; reject pending, failed, wrong-amount, wrong-currency, and wrong-product transactions.
- Verify legal, refund, privacy, and support details for customers.

## Deployment

The project is a static site with Vercel serverless API routes. Use the Vercel project configuration already connected to this repository.
