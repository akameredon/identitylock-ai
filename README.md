# IdentityLock AI storefront

Static marketing site with Vercel serverless checkout, Paystack verification, and protected ZIP delivery.

## Configuration
1. Add `PAYSTACK_SECRET_KEY` in Vercel project environment variables. Start with a Paystack test secret.
2. Place the finished `IdentityLock_AI_Complete_Bundle.zip` in `private-assets/` (never in public/).
3. Deploy to Vercel.
4. Test with Paystack test credentials and confirm the API verifies USD 19 (1900 cents) before switching live.

## Payment flow
- POST /api/checkout initializes a USD 19 one-time transaction.
- GET /api/verify verifies amount, currency, status and product metadata server-side.
- GET /api/download repeats the same server-side verification before streaming the ZIP.
- No secret key or paid files are shipped to the browser.

## Important
Paystack USD acceptance is account- and region-dependent. Verify USD is enabled for the merchant integration before launch. Test mode does not collect real money. Live launch requires a live Paystack secret key and successful live-mode test, plus configured legal/support details and product ZIP.

## Deploy
Connect this private GitHub repository to Vercel, framework preset Other, build command empty, output directory . (or deploy with Vercel CLI). Set production environment variables before enabling sales.