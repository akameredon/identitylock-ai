# G05 — Prompt-Set Checkout Implementation

Status: IN_PROGRESS. The schema and isolated server routes are implemented. A post-merge preview smoke test exposed a Vercel CommonJS/ESM startup incompatibility; the corrective change is on `fix/g05-commonjs-runtime` and awaits preview verification.

## Product contract
- A guest submits an email address and exactly 10 distinct published prompt UUIDs.
- The server fixes the price at 50,000 kobo (₦500), NGN.
- The server resolves each prompt's current published version and creates an immutable ten-item order snapshot before Paystack initialization.
- Prompt text is not exposed in this gate; G06 owns secure delivery.
- No account, wallet, stored credit, or subscription.
- Existing fixed-bundle ZIP checkout and delivery remain unchanged.

## Database
Applied migrations:
- `20261104170000_identitylock_prompt_set_orders_v1`
- `20261104171000_identitylock_prompt_order_privilege_tightening_v1`

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
- Live verification confirms RLS enabled, browser roles have no SELECT, and service_role has no DELETE/TRUNCATE on either table.
- Both order tables currently contain zero rows.

## Server routes
- `POST /api/prompt-set-checkout`: validates exactly ten unique UUIDs and email, creates server-side snapshot, initializes Paystack at 50,000 NGN kobo.
- `GET /api/prompt-set-verify?reference=...`: verifies transaction with Paystack and atomically marks the matching order paid.
- Supabase secret key is sent only through the `apikey` header, never as a bearer JWT.
- These routes are separate from legacy ZIP checkout/verify/download routes.

## Runtime defect and correction
- The first merged implementation imported an `.mjs` helper from Vercel `.js` API handlers. The Vercel Node 26 runtime logged `ERR_REQUIRE_ESM` and returned FUNCTION_INVOCATION_FAILED for both routes.
- Corrective branch: `fix/g05-commonjs-runtime`.
- Correction adds a CommonJS `api/prompt-set-core.cjs` helper and loads it from the two handlers with `require()`. The unit test imports the CommonJS helper.
- Do not mark this correction complete until a new preview deployment is READY and both routes return their expected method/validation responses.

## Evidence
- Original core unit suite: 9 passed, 0 failed before runtime deployment.
- SQL negative tests rejected nine IDs and duplicate IDs.
- Both order tables remained empty after negative tests.
- RPC privilege checks: anon/authenticated denied; service_role allowed; all RPCs SECURITY INVOKER.
- Preview logs exposed the startup error above. No order was created and no Paystack transaction was initiated.
- Legacy route source files `api/checkout.js` and `api/verify.js` have not been modified by the G05 correction. PR #18 introduced separate route files; production legacy ZIP routes remain separate.
- The Vercel environment listing shows `SUPABASE_SECRET_KEY` targeted to Production only and reports its stored type as encrypted/config (not sensitive). The value was not read. A type-only attempt to change it to sensitive was rejected by Vercel because the connector cannot supply the required visibility field; no environment value was changed. Reconcile this in Vercel UI before production use.
- No preview secrets are configured in the Preview target; do not copy production secrets into Preview. Use test credentials only if preview payment testing is later authorized.

## Remaining before G05 can pass
1. Verify the corrective preview deployment builds and both routes execute without startup errors.
2. Exercise invalid/unpublished selection rejection without creating an order; verify order count remains zero.
3. Verify Paystack mismatch and paid-transition idempotency with provider-safe test data or a mocked transaction; no live charge without explicit approval.
4. Verify legacy fixed-bundle checkout, verification and download still work, without making a live purchase.
5. Confirm the production environment variable visibility is Sensitive using Vercel's UI; its value must never be displayed.
6. Keep the new prompt-set checkout unlinked from the public homepage until G08 and do not mark G05 PASSED until the remaining evidence is recorded.

## Later gates
- G06: exact prompt-text delivery for paid snapshots.
- G07: Admin Studio prompt/category/version publishing.
- G08: storefront checkout UI, homepage link and before/after presentation.
- G09: security, abuse, regression and capacity testing.
- G10: production release approval.
