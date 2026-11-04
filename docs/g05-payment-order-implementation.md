# G05 — Prompt-Set Checkout Implementation

Status: IN_PROGRESS. The database, isolated server routes, and catalogue-to-checkout browser handoff are implemented. Runtime correction is merged; provider-to-database POST verification and catalogue content availability remain outstanding.

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

### Customer selection handoff (added after G04 QA)
- The original G04 catalogue page intentionally stopped at a preview-only confirmation. It did not submit selected IDs to the new G05 endpoint; this is why the user's real ₦500 test followed the legacy fixed-bundle route.
- The standalone catalogue review now collects a guest email and POSTs exactly ten currently loaded prompt UUIDs to `/api/prompt-set-checkout`.
- The browser does not send or control price; the server still fixes NGN 500.
- The old homepage and fixed-bundle checkout remain unchanged. The new route remains unlinked from the public homepage until G08.
- Live catalogue query currently returns zero categories and zero published prompts. G07 Admin Studio publishing must populate the library before a customer can make a real selection.

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
- Preview logs exposed the startup error above. The corrective preview build is READY; smoke requests now return 405 for GET on the POST-only checkout route and 400 for a malformed verification reference, with no function startup crash. Runtime logs show no further ESM startup error.
- A rollback-only SQL integration test created ten temporary published prompts and versions, called the order-creation RPC, confirmed exactly ten snapshot rows, marked the order paid, repeated the same transaction successfully (idempotent), and rejected a different transaction ID and mismatched amount. The transaction was rolled back; both order tables still contain zero rows.
- The nine Node validation tests pass against the corrected CommonJS helper.
- Legacy ZIP route smoke checks on the same preview: GET `/api/checkout` returned 405, invalid-reference `/api/verify` returned 400, and invalid-reference `/api/download` returned 400. These checks did not initialize Paystack or create a purchase.
- Legacy route source files `api/checkout.js` and `api/verify.js` have not been modified by the G05 correction. PR #18 introduced separate route files; production legacy ZIP routes remain separate.
- The Vercel environment listing shows `SUPABASE_SECRET_KEY` targeted to Production only and reports its stored type as encrypted/config (not sensitive). The value was not read. A type-only attempt to change it to sensitive was rejected by Vercel because the connector cannot supply the required visibility field; no environment value was changed. Reconcile this in Vercel UI before production use.
- No preview secrets are configured in the Preview target; do not copy production secrets into Preview. Use test credentials only if preview payment testing is later authorized.

## Remaining before G05 can pass
1. Run a deployed POST request with a deliberately unpublished UUID selection and confirm it is rejected without creating an order. The available Vercel fetch connector only performs GET, so this remains untested here.
2. Verify the actual Paystack-to-Supabase HTTP verification path using Paystack test credentials or a mocked provider-safe integration. Do not initiate a live charge without explicit approval.
3. Run non-purchasing regression checks for the existing fixed-bundle checkout, verification and download routes; source files were not changed by either G05 PR.
4. Confirm production environment variable metadata remains Sensitive; a type-only metadata read (without decryption) has reported both required secrets as Sensitive/secret for Production. Never read or display their values.
5. Keep the new prompt-set checkout unlinked from the public homepage until G08. G05 remains IN_PROGRESS until the remaining checks and visibility discrepancy are resolved.

## Later gates
- G06: exact prompt-text delivery for paid snapshots.
- G07: Admin Studio prompt/category/version publishing.
- G08: storefront checkout UI, homepage link and before/after presentation.
- G09: security, abuse, regression and capacity testing.
- G10: production release approval.
