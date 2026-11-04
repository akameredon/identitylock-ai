# G06 — Paid prompt-set delivery

Status: **G06 PASSED** — paid-only delivery RPC, delivery API, callback page, production deployment, and no-order security smoke tests are verified. Production deployment commit: `4c59ce65906811cbdfaf13401d07cea6ffdc1a54` (READY).

## Customer flow
1. Paystack returns the customer to `/prompt-success.html?reference=...`.
2. The page calls `GET /api/prompt-set-verify?reference=...`; this independently verifies the Paystack transaction and atomically marks the order paid.
3. Only after verification succeeds, the page calls `GET /api/prompt-set-delivery?reference=...`.
4. The delivery endpoint reads the paid order through the server-only `get_identitylock_prompt_order_delivery(text)` RPC.
5. The page renders the exact ten immutable prompt-version snapshots with per-prompt copy, copy-all, and a downloadable plain-text file.

## Security design
- Delivery accepts only the generated `ILP-[A-Za-z0-9]{32}` reference format.
- The database function is `SECURITY INVOKER`, has an empty search path, and is executable only by `service_role`. `anon` and `authenticated` cannot execute it.
- The function returns content only for an order whose database status is `paid`, whose amount is exactly 50,000 kobo, currency is NGN, and which has exactly ten order-item snapshots.
- Each item joins through the composite `(prompt_id, prompt_version_id)` key. Later prompt edits do not alter a customer's purchased text.
- The API uses the production Supabase secret only server-side. It never exposes the secret, order email, or internal order ID.
- Delivery responses use `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`.
- The customer page does not store prompt content in localStorage or other persistent browser storage. It uses textContent for rendered titles and prompt text.

## Database changes
- `20261104171326_identitylock_prompt_order_delivery_v1`: adds the paid-only read RPC.
- `20261104171447_identitylock_prompt_order_version_fk_index_v1`: adds the composite FK covering index for `(prompt_id, prompt_version_id)`.
- Both migrations are applied to the production Supabase project.
- Advisor review confirms the new RPC is not SECURITY DEFINER and is not executable by anon/authenticated. The new unindexed composite-FK finding was resolved with the second migration. Existing unrelated advisor findings remain documented for G09.

## Verification evidence
- Rollback-only SQL integration test created ten temporary prompts and immutable versions, created an order, confirmed pending orders are not deliverable, marked the order paid, and confirmed the RPC returns the exact ten version bodies in their saved order. The transaction was rolled back.
- Follow-up SQL confirms the temporary QA category, prompts, versions, orders, and order items were not retained.
- Node test suite: 26 passed, 0 failed, including five delivery endpoint tests, checkout/payment tests, and selection tests.
- `node --check` passed for `api/prompt-set-delivery.js` and `prompt-success.js`.

## G06 closure
- PR #21 merged to `main`: https://github.com/akameredon/identitylock-ai/pull/21
- Production deployment `dpl_6XVTAR8D9aAfLx64WAHZVEy87Hcm` is READY.
- Production callback page, CSS, and JS each return 200.
- Production delivery API rejects malformed references with 400 and returns 404 for a well-formed reference with no paid order. This exercised the production service-role RPC without creating or exposing any order.
- Production homepage remains on the old fixed-bundle checkout and contains no link to the new catalogue.

## Release boundary
- No customer payment was made during G06 verification.
- The catalogue currently contains zero published categories/prompts; G07 must enable prompt publishing and populate the library before customers can select a real set.
- The homepage still uses the legacy checkout. G08 controls public storefront linking only after G06/G07 are complete.
- Do not direct customers to the new checkout until the production callback and delivery route are verified.
