# IdentityLock AI — Studio Phase 1

## Scope

This phase introduces an isolated, branch-only customer image-brief builder at `/studio.html`. It does not replace the current homepage, prompt catalogue, prompt checkout, prompt delivery or Admin Studio.

## Customer decisions represented

- Initial launch market: Nigeria; customer-facing pricing will be NGN.
- Intended AI provider: OpenAI, with GPT Image 2.6 Sunburst as the first model to validate.
- Intended free offer: one welcome image per eligible verified customer, subject to 20 daily and 300 monthly campaign limits.
- Free image branding: no watermark.
- Default customer image retention: 30 days, subject to a visible policy and deletion controls.
- Guest-first journey with email verification for free-credit eligibility.
- Customer can choose occasion, outfit, colour, accessories, background, pose, framing, lighting and photography style, plus write a natural-language request.
- Identity-preservation instructions are included in the prepared brief by default.

## Phase 1 prototype boundary

The page currently:
- Lets a user select a local image for an in-browser preview.
- Validates file type (JPEG, PNG, WebP) and 15 MB maximum in the browser.
- Lets a user choose the image-editing preferences.
- Produces a human-readable image brief from the selections.
- Does not upload, store or transmit the photo.
- Does not call OpenAI, Paystack or Supabase.
- Does not grant or consume a free credit.
- Clearly labels the free offer and generation flow as planned / not yet connected.

This boundary is intentional. No customer photo is sent to an unimplemented backend, and the prototype does not imply that generation or payment is already live.

## Next engineering gates

1. Review the preview deployment on desktop and mobile.
2. Add server-side validation and a provider-independent image-generation adapter.
3. Create separate image-order, generation-job, credit-ledger and campaign-control data structures through additive migrations only.
4. Create a separate private customer-image bucket; do not use the existing public `identitylock-media` bucket.
5. Implement email verification, abuse controls, consent, deletion and 30-day retention worker.
6. Integrate OpenAI image edits server-side only; API key remains a sensitive server environment variable.
7. Record actual API usage and quality results before setting the production cost allowance or retail price.
8. Add Paystack image-package checkout separately from the existing ten-prompt checkout.
9. Extend Admin Studio only after the data model and permissions have been reviewed.
10. Run end-to-end QA and a limited pilot before public release.

## Non-negotiable preservation rules

- Do not alter or delete existing prompt orders, prompt versions, public gallery media or admin audit history.
- Do not change the existing fixed ₦500 / ten-prompt checkout contract as part of the image studio work.
- Do not put customer uploads in public storage.
- Do not expose Supabase service-role or OpenAI credentials to browser code.
- Do not deploy this branch to the production domain until it has been reviewed and accepted.
- The public-repository ZIP exposure identified in the audit remains a separate security issue. It requires a secure backup and an explicit, coordinated Git-history remediation; it is not silently changed by this feature branch.

## Acceptance criteria for this phase

- `/studio.html` loads without changing the production homepage.
- Mobile layout remains usable at narrow viewport widths.
- Occasion selection updates the summary.
- All style selections and custom text appear in the prepared brief.
- Invalid file types and files larger than 15 MB are rejected in the browser.
- Photo preview is local-only and can be removed.
- The page clearly states that upload, payment, credits and generation are not yet connected.
