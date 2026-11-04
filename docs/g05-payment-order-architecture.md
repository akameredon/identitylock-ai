# G05 — Payment and Immutable Order Snapshot

Status: IN_PROGRESS — additive order schema and isolated checkout/verification endpoints are being implemented. The user confirmed `SUPABASE_SECRET_KEY` was created with Sensitive visibility in Vercel Production. Do not read or print its value.

## Objective
Allow a guest customer to choose exactly 10 unique published prompts and pay exactly ₦500 (50,000 kobo, NGN). The server, not the browser, decides which prompt versions are purchased and records an immutable order snapshot before Paystack checkout begins.

## Non-negotiable compatibility boundary
- Preserve the existing fixed-bundle purchase at `/api/checkout.js`, `/api/verify.js`, `/api/download.js`, and `success.html`.
- Do not alter its ₦500 amount, `identitylock-ai` metadata contract, ZIP asset, or existing customer delivery.
- Build the prompt-set purchase with separate API routes, separate Paystack metadata, and separate order records.
- No public homepage link is added in G05; G08 owns that.
- No prompt body is sent to the browser in G05; G06 owns delivery.
- No account, wallet, subscription, or stored credit balance.

## Proposed guest checkout flow
1. Browser submits only a valid email and exactly 10 prompt UUIDs to a new prompt-set checkout endpoint.
2. Server validates the payload shape, exactly 10 distinct UUIDs, and email format. It ignores any client-supplied price, title, version, or payment status.
3. Server calls a narrowly scoped Postgres RPC using a server-only Supabase secret key. The RPC validates that all 10 prompts are currently published, belong to active categories, and have a current version. It creates the order and all 10 item snapshots in one database transaction.
4. Each order item stores prompt ID, exact prompt-version ID, title/slug snapshot, and stable position. The prompt body remains in the protected prompt-version table for G06.
5. Server initializes Paystack with a server-generated unique reference, fixed amount 50000, currency NGN, and metadata identifying the new prompt-set product and order ID.
6. Customer is redirected to Paystack. A separate prompt-set callback/verification endpoint verifies the transaction server-side and checks transaction success, exact reference, NGN currency, exact amount, product metadata, and matching order ID before changing the order to paid.
7. Repeated callback/verification attempts are idempotent: an already-paid order remains paid and is not paid twice.

## Proposed database objects
- `identitylock_orders`: order UUID, validated customer email, fixed amount/currency, unique Paystack reference, unique Paystack transaction ID when available, payment status, timestamps.
- `identitylock_order_items`: order ID, prompt ID, exact prompt-version ID, title/slug snapshot, position. Enforce exactly 10 rows per completed order through the creation RPC and verification checks; enforce unique prompt and position per order.
- `create_identitylock_prompt_order(...)`: transactionally validates the 10 prompt IDs and inserts the order plus item snapshots. SECURITY INVOKER (not SECURITY DEFINER), callable only by the server role.
- `mark_identitylock_prompt_order_paid(...)`: atomic, conditional, idempotent payment-state transition callable only by the server role.
- Enable RLS and revoke access from PUBLIC, anon, and authenticated for order tables. Do not expose order or customer data through the browser Data API.
- Revoke default PUBLIC function execution and grant only the required server role. No new SECURITY DEFINER function.

## Server configuration prerequisite
Current Vercel project environment-variable inventory shows `PAYSTACK_SECRET_KEY` only; no Supabase server secret is configured. G05 requires `SUPABASE_SECRET_KEY` in the Vercel **Production** environment for server-side order creation and verification. Use the new Supabase secret-key format (`sb_secret_...`) and keep it exclusively in server environment variables. Never place it in browser JavaScript, HTML, GitHub, or chat. The existing publishable key remains the only Supabase key used in the browser.

The Supabase secret key bypasses RLS and must only be used by server code that validates requests and exposes narrowly scoped operations. Do not retrieve or print its value during environment inspection.

## API separation
- New prompt-set checkout endpoint: accepts email + prompt IDs; server chooses fixed price and snapshot.
- New prompt-set verification endpoint: accepts only the Paystack reference and validates it with Paystack.
- Existing ZIP checkout/verification/download routes remain unchanged.
- No download endpoint is added in G05; G06 will implement protected delivery of the exact versions in the order snapshot.

## Required G05 tests
- Reject fewer/more than 10 IDs, duplicates, malformed UUIDs, invalid email, unpublished prompts, inactive categories, and prompts without a current version.
- Reject any client attempt to override price, currency, version IDs, titles, or payment status.
- Confirm a valid order has exactly 10 distinct item snapshots and each version belongs to its prompt.
- Confirm Paystack initialization always uses 50000 NGN and the server-generated reference/order metadata.
- Reject failed, pending, wrong-currency, wrong-amount, wrong-reference, wrong-product, and wrong-order payments.
- Confirm repeated verification is idempotent and cannot transition a different order.
- Confirm anonymous/authenticated browser roles cannot read or write orders or snapshots.
- Confirm the legacy ZIP checkout and delivery regression tests still pass.

## Out of scope
- Admin Studio prompt publishing (G07).
- Customer prompt-text delivery/download (G06).
- Homepage/storefront link and visual integration (G08).
- Production launch approval (G10).
- Unrelated Supabase advisor cleanup (G09).

## References
- Paystack transaction initialization: https://paystack.com/docs/api/transaction/
- Paystack payment verification: https://paystack.com/docs/payments/verify-payments/
- Supabase API keys and server-only secret key handling: https://supabase.com/docs/guides/getting-started/api-keys
