# G04 — Exact-Ten Prompt Selection Engine

Status: PASSED — user authorized closure after preview review. PR #16 merged to main as `4d963e5a4f7d51f34717f82ba5bc4cafcd16d0ba`; the production Vercel deployment for that commit is READY.

## Delivered
- Standalone `/catalogue.html` route, not linked from the production homepage.
- Reads active categories and published prompt metadata using the existing Supabase publishable key.
- Does not request prompt versions or prompt bodies.
- Set-based selection engine capped at 10 unique prompt IDs.
- Category filters, text search, responsive prompt cards, selected count, remaining count, progress bar, and ten-prompt review panel.
- Empty-catalogue and retryable network-error states.
- Six Node tests cover exact count, eleventh-selection rejection, deselection, duplicate IDs, invalid IDs, and custom limits.

## Acceptance evidence
1. Six selection-engine tests passed with Node's built-in test runner before merge.
2. The review action remains preview-only and does not create an order or initiate payment.
3. No homepage link was added.
4. No prompt version or prompt body is requested by the catalogue.
5. Existing checkout, verification, ZIP delivery, Paystack settings, database schema, and customer data were not changed by G04.
6. PR #16 merged; Vercel production deployment built from the merge commit and reported READY.

## Explicit boundary
The catalogue remains empty until prompt content is published through the future Admin Studio workflow. A READY deployment is not a substitute for the later full payment/delivery regression gate.

## Next gates
- G05: server-side validation, immutable order snapshot, and Paystack payment integration.
- G06: secure delivery of the exact 10 prompt versions paid for.
- G07: Admin Studio category/prompt/version management and publishing.
- G08: storefront integration and customer experience.
- G09: security, regression, abuse, and capacity testing.
- G10: controlled production release.
