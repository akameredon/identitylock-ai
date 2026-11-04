# G05 — Prompt-Set Checkout Implementation

Status: IN_PROGRESS. Additive schema and isolated server routes are implemented on `feat/g05-prompt-set-payments`. The PR remains draft pending end-to-end provider and order validation.

## Product contract
- A guest submits an email address and exactly 10 distinct published prompt UUIDs.
- The server fixes the price at 50,000 kobo (₦500), NGN.
- The server resolves each prompt's current published version and creates an immutable ten-item order snapshot before Paystack initialization.
- Prompt text is not exposed in this gate; G06 owns secure delivery.
- No account, wallet, stored credit, or subscription.
- Existing fixed-bundle ZIP checkout and delivery remain unchanged.

## Database
Applied migrations:
- `20261104170000_identitylock_prompt_set_orders_v1.sql`
- `20261104171000_identitylock_prompt_order_privilege_tightening_v1.sql`

Tables:
- `identitylock_orders`: customer email, fixed amount/currency, unique Paystack reference and transaction ID, status and timestamps.
- `identitylock_order_items`: exact prompt/version IDs, title and slug snapshots, stable positions 1–10.

Security:
- RLS enabled; no table grants to PUBLIC, anon or authenticated.
- Service role: orders SELECT/INSERT/UPDATE; order items SELECT/INSERT only.
- Order item UPDATE/DELETE rejected by trigger; service role TRUNCATE privilege revoked.
- RPCs are SECURITY INVOKER, not SECURITY DEFINER; execute granted only to service_role.
- Composite FK guarantees each snapshot version belongs to its prompt.
- Payment transition requires ten snapshot rows and matching order/reference/amount/currency; repeat verification of the same transaction is idempotent.

## Server routes
- `POST /api/prompt-set-checkout`: validates exactly ten unique UUIDs and email, creates server-side snapshot, initializes Paystack at 50,000 NGN kobo.
- `GET /api/prompt-set-verify?reference=...`: verifies transaction with Paystack and atomically marks the matching order paid.
- Supabase secret key is sent only through the `apikey` header, never as a bearer JWT. It is read only from the Vercel server environment and was not retrieved or printed.
- These routes are separate from legacy ZIP checkout/verify/download routes.

## Evidence so far
- Node test suite: 9 tests passed, 0 failed.
- SQL negative tests: nine IDs rejected; duplicate IDs rejected.
- Order and order-item tables remain at zero rows after negative tests.
- Both tables have RLS enabled; browser roles have no grants.
- Service-role grants were narrowed after inspecting Supabase default privileges.
- All three RPCs: SECURITY INVOKER; anon/authenticated execution denied; service_role execution allowed.
- Vercel preview deployment for commit `001ee9bf8347eabde6a5581989bd21c89fb6e2fb` reported READY.
- Vercel build compiled both new API routes; no build error.
- The user confirmed `SUPABASE_SECRET_KEY` was created with Sensitive visibility in Production. Its value was not read.

## Remaining before G05 can pass
1. Verify the preview checkout route can reach the Supabase RPC using the Sensitive Production key, without revealing the key.
2. Test invalid and unpublished selections through the deployed route; confirm no order is created.
3. Verify Paystack transaction mismatch and idempotency behavior without initiating an unapproved live charge (mock/provider-safe test or controlled test environment).
4. Recheck the existing fixed-bundle checkout and download routes remain unchanged.
5. Complete a safe end-to-end preview test when published prompts exist.

## Later gates
- G06: exact prompt-text delivery for paid snapshots.
- G07: Admin Studio prompt/category/version publishing.
- G08: storefront checkout UI, homepage link and before/after presentation.
- G09: security, abuse, regression and capacity testing.
- G10: production release approval.
