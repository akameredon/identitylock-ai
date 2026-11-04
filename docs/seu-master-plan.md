# IdentityLock AI — Storefront Experience Upgrade (SEU)

Status: **Approved workstream — six gated stages**
Owner: IdentityLock AI
Baseline date: 2026-11-04
Production: https://identitylock-ai.vercel.app/
Repository: https://github.com/akameredon/identitylock-ai
Supabase project: `zcyxoucbglsyrqzqksjc`

## Product outcome

Make IdentityLock immediately understandable and visually convincing: a visitor should understand that the product sells ten identity-preserving wardrobe/style prompts for one ₦500 payment, see genuine before/after examples for the looks they are considering, select exactly ten, pay securely, and receive the exact saved prompt versions.

This is a storefront and customer-experience upgrade, not a replacement of the existing payment/order/delivery platform.

## Non-negotiable preservation rules

- Keep the ₦500 price and server-authoritative exact-ten validation.
- Keep Paystack server-side verification and paid-only delivery.
- Keep immutable prompt-version snapshots and historical orders.
- Keep private full prompt text private; public pages may show only approved listing metadata and published visual examples.
- Keep the legacy bundle route available unless a separately approved retirement plan is adopted.
- Do not delete, reset, truncate, or overwrite existing media, prompt versions, orders, or payment records.
- No customer photo upload feature is included in this workstream. If it is proposed later, it requires a separate private-storage and consent/retention design.
- No new paid subscription or service is required for the approved baseline work. v0 may be used on its free allowance only; if that allowance is exhausted, continue with the existing repository/tooling rather than buying credits.

## Six gates

### SEU-G00 — Baseline audit and requirements lock

Deliverables:
1. Source-backed inventory of public routes, current UI, frontend stack, catalogue, Admin Studio, media model, access policies, checkout and delivery boundaries.
2. Competitor pattern review covering prompt marketplaces and AI image/portrait products.
3. Mobile/accessibility/SEO/performance/security baseline and explicit items not yet measurable.
4. Risk register and accepted scope.

Pass conditions:
- Existing customer and payment paths are mapped.
- Data and access boundaries are verified from live schema/policies.
- Known gaps have severity and remediation ownership.
- No unverified claim of device, accessibility or performance certification.

### SEU-G01 — Design system and visual architecture

Deliverables:
1. IdentityLock visual system and token definitions.
2. Reusable component inventory and responsive page blueprints.
3. Homepage, category browsing, prompt detail/preview, selection, checkout handoff and post-purchase delivery flows.
4. v0 usage plan that preserves GitHub PR workflow and does not force a framework migration.

Pass conditions:
- Design direction is approved before storefront implementation.
- The system works with the existing stack or documents a measured reason for an incremental migration.
- All critical components have mobile and desktop behaviour, focus states and content rules.

### SEU-G02 — Backend visual catalogue and Admin Studio

Deliverables:
- A safe association between each prompt and its approved original/transformed visual pair.
- Optional category gallery derived from prompt/category relationships.
- Admin image picker using existing media assets, captions, alt text, disclaimers and manual ordering.
- Draft, preview and publish lifecycle.
- Minimal public projection of published image metadata; admin-only metadata remains private.
- Safe replacement/versioning that preserves originals and historical references.

Pass conditions:
- Every active published prompt can be assigned at least one relevant pair.
- Admin can create, preview, publish, reorder and replace a pair without editing code.
- Anonymous users cannot read admin-only media metadata, unpublished pairs, private prompt text or customer records.
- Existing media and homepage content remain intact.

### SEU-G03 — Storefront and GenUI-ready frontend

Deliverables:
- Refined homepage with immediate product explanation and genuine proof.
- Visual category discovery and visual prompt cards.
- Prompt-level before/after comparison and clear prompt purpose.
- Search, category filtering and accessible selection.
- Persistent, understandable 0/10–10/10 selection state and ₦500 price.
- Responsive mobile and desktop layouts.

Pass conditions:
- 16/16 published prompts have a relevant, approved example before production release.
- Customers can understand, compare and select without losing selection state.
- No private prompt body is exposed before verified payment.

### SEU-G04 — Trust, customer psychology and repeat visits

Deliverables:
- Honest usage instructions and compatibility guidance.
- Clear limits: prompts guide an external image model; they do not guarantee pixel-perfect identity retention.
- Genuine reviews/examples only, with permission.
- Better FAQs, support, privacy and refund/terms visibility.
- Useful new-collection discovery and optional locally saved favourites; no forced account.
- Search-engine content strategy for public metadata pages.

Pass conditions:
- No fake testimonials, invented ratings, false scarcity or misleading guarantees.
- Customers can understand what they receive, what they need and what results cannot be guaranteed.

### SEU-G05 — Quality assurance and controlled launch

Deliverables:
- Functional, security, accessibility, mobile, visual and performance testing.
- Payment/order/delivery regression suite.
- Image loading, fallback, broken-image and low-bandwidth checks.
- Reviewed PR, preview verification, production deployment and post-deploy checks.

Pass conditions:
- Core Web Vitals targets are met where field data is available or lab evidence is clearly labelled.
- WCAG 2.2 AA audit is completed for key flows; no claim of certification without a formal audit.
- Existing payment and delivery protections pass regression checks.
- Deployment is READY and production smoke tests pass.

## Design principles

1. **Outcome before explanation:** show what changes and what remains before asking for a purchase.
2. **One clear next action:** browse, compare, select, review, pay.
3. **Visual proof must be real:** each pair uses the same original person and a genuine, approved transformation.
4. **Honest expectations:** show sample-result disclaimers and never promise perfect identity preservation.
5. **Low cognitive load:** simple language, five clear categories, useful search and no unnecessary pop-ups.
6. **Mobile first:** selection, examples and checkout controls must work comfortably on a phone.
7. **Fast by default:** responsive derivatives, lazy loading below the fold, explicit image dimensions and no heavy effects that delay the product.
8. **Accessible by design:** semantic structure, keyboard operation, visible focus, sufficient contrast, useful alt text, reduced-motion support and appropriately sized touch targets.
9. **Repeat visits through value:** fresh collections and useful discovery, not manipulative urgency.
10. **Preserve the working business:** visual improvements must not weaken payment, delivery, privacy or data integrity.

## Design system direction (SEU-G01 proposal)

Retain the existing recognizable editorial palette and typography, then standardise it:

| Token | Initial value | Purpose |
|---|---|---|
| Ink | #17211e | Main text |
| Muted | #65716c | Supporting text |
| Paper | #f7f7f2 | Warm page background |
| Forest | #1c4438 | Primary action and brand |
| Gold | #c59a58 | Restrained accent |
| Line | #e2e5dd | Borders and dividers |
| Display type | Playfair Display | Editorial headlines |
| UI type | DM Sans | Body, labels and controls |

These values are inherited from the current production CSS, not a new untested brand palette.

Layout proposal:
- Content maximum width: approximately 1,200 px.
- Mobile gutters: 16–22 px; desktop gutters: 24–48 px.
- Consistent 4 px spacing base and predictable card radii.
- Mobile-first breakpoints around 560, 700, 800 and 1,024 px, adjusted after real-device testing.
- Restrained motion; respect `prefers-reduced-motion`.

Reusable components:
- SiteHeader and MobileNavigation
- HeroComparison
- CategoryCard and CategoryGallery
- PromptCard and PromptDetail
- BeforeAfterSlider (with keyboard-accessible alternative)
- SearchAndFilters
- SelectionDock and SelectionReview
- Trust/HowItWorks/FAQ sections
- SecureDeliveryPromptCard

## Required customer experience

1. Landing: understand the promise, ₦500 offer and ten-prompt mechanic immediately.
2. Discovery: browse five categories and see the visual result of each relevant prompt.
3. Evaluation: compare original and transformed image, read what changes/what stays and view honest limitations.
4. Selection: choose exactly ten, see progress and price continuously, remove or replace choices easily.
5. Checkout: confirm the ten chosen prompts and email; continue through the existing verified Paystack flow.
6. Delivery: view ten saved prompt versions with individual copy, copy-all and TXT download, plus simple usage guidance.
7. Return: discover new styles and collections without requiring an account.

## Recognised standards and measurement targets

- Accessibility: WCAG 2.2 AA as the engineering target (not a certification claim).
- Core Web Vitals good thresholds at the 75th percentile: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1.
- Security: least privilege, RLS, minimal public projections, no public prompt bodies, safe output encoding and no secrets in browser code.
- SEO: descriptive public category/product metadata, canonical URLs, sitemap/robots review and noindex only where deliberate.
- Privacy: use only images with the required rights/consent. The current media bucket is public; it is not suitable for private customer photos.

## v0 / GenUI decision

v0 is an AI-assisted UI/code generation and design-system workflow. Generative UI is a runtime interaction pattern in which an AI model can return structured interactive UI; it is not a synonym for every modern frontend.

Use v0 to prototype and standardise the design system if the free allowance is sufficient. Connect through GitHub and keep all changes on branches and pull requests. Do not deploy generated code directly to production or accept a default Next.js/React rewrite without a measured architecture decision.

The existing project is static HTML/CSS/JavaScript (Vercel reports no framework). Prefer incremental components compatible with the current stack. A future migration may be evaluated separately if it clearly improves maintainability, performance or accessibility.

## References

- v0 Design Systems 2.0: https://v0.app/docs/design-systems-2
- v0 FAQ / GitHub integration and preview workflow: https://v0.app/docs/faqs
- v0 current pricing: https://v0.app/pricing
- PromptBase marketplace: https://promptbase.com/shop
- Aragon AI: https://www.aragon.ai/
- BetterPic pricing and FAQ: https://www.betterpic.io/pricing
- Baymard product-page UX research: https://baymard.com/research/product-page
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Google Core Web Vitals: https://developers.google.com/search/docs/appearance/core-web-vitals

## Change control

All implementation work must start from the latest main commit on a dedicated branch, include tests and evidence, and be reviewed before merge. Production changes are made only after the relevant gate passes. No payment transaction is required for QA.
