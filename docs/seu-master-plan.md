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
1. IdentityLock visual system and token definitions, including restrained liquid-glass surface tokens and fallbacks.
2. Reusable component inventory and responsive page blueprints, including bento discovery and a rule-based guided style finder.
3. Homepage, category browsing, prompt detail/preview, selection, checkout handoff and post-purchase delivery flows.
4. GenUI boundary and future runtime contract; do not label a static/rule-based finder as AI-generated GenUI.
5. v0 usage plan that preserves GitHub PR workflow and does not force a framework migration.

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

## SEU-G01 refined visual direction — premium intelligent visual commerce

The design decision is to combine IdentityLock's existing warm editorial identity with a restrained, contemporary interaction layer. Trends are used only where they improve clarity, confidence, or speed to purchase.

### Experience principles

- **Premium editorial foundation:** retain Forest, Ink, Paper and Gold with Playfair Display + DM Sans. Avoid generic neon-purple AI styling.
- **Selective liquid glass:** use translucent, blurred surfaces only for the sticky navigation, contextual helper surfaces and floating selection dock. Keep text-heavy content, prompt cards and forms on solid high-contrast surfaces. Provide a solid fallback when backdrop filters are unavailable.
- **Bento discovery:** use a modular category overview to make the five collections scannable, then return to a consistent prompt-card grid for comparison and selection. Do not make the catalogue visually irregular at the expense of scanning.
- **Visual-first product proof:** every published prompt should have its own approved original/transformed pair, a clear caption and a short explanation of what the prompt changes. A comparison control must have a keyboard/touch alternative and must not imply guaranteed identity preservation.
- **Purposeful motion:** subtle state transitions, selected-state feedback and progress updates. Respect `prefers-reduced-motion`; no scroll-jacking, autoplay galleries or decorative animation that delays interaction.
- **Mobile-first purchase controls:** keep the ten-item count and ₦500 price visible without obscuring content. On small screens the dock must account for safe-area insets, wrap cleanly and never cover form controls.
- **Trust before persuasion:** explain exactly what is delivered, that an external image tool is needed, and that output varies. No fabricated reviews, ratings, scarcity, guarantees or misleading security badges.

### Guided discovery / GenUI boundary

The prototype includes a **rule-based guided style finder**: a visitor selects an occasion and desired direction, and the interface composes a relevant shortlist with next actions. This tests the interaction pattern without introducing an AI dependency or sending customer data to a model.

This is **GenUI-ready, not yet a live model-generated interface**. A true GenUI runtime would require a separately approved model/tool contract, a constrained component schema, validated inputs, safe rendering, fallbacks, latency/cost limits and privacy review. It must never generate or expose private prompt bodies before verified payment. Do not add a chatbot merely to claim GenUI.

### Page architecture

1. **Homepage:** clear promise, ₦500 / any ten offer, one strong authentic hero comparison, three-step explanation and prominent browse action.
2. **Category discovery:** five visual category tiles in a bento-inspired layout; category counts and descriptions remain legible.
3. **Guided finder:** optional short interaction for visitors who are unsure where to start; it filters/recommends only from published public metadata.
4. **Prompt catalogue:** consistent cards with prompt title, purpose, approved before/after pair, honest sample note and add/remove action.
5. **Selection dock:** persistent 0/10–10/10 count, fixed ₦500 total, clear remaining count and accessible review action.
6. **Selection review and checkout handoff:** plain-language confirmation of exactly ten selections; existing email and Paystack flow remain authoritative.
7. **Paid delivery:** preserve the existing verified delivery experience and immutable prompt snapshots; visual refresh must not expose prompt text earlier.

### Component and state contracts

- `GlassHeader`: translucent surface, solid fallback, clear focus and readable contrast.
- `BentoCategoryGrid`: responsive editorial tiles; semantic links and visible counts.
- `GuidedStyleFinder`: occasion + style intent controls, recommendation explanation, clear reset and direct category/catalogue action. No account or personal-photo upload.
- `BeforeAfterComparison`: approved pair only, labelled endpoints, touch/keyboard support, reduced-motion-safe.
- `PromptCard`: stable card geometry, image ratio, category, short outcome description, sample disclaimer and selection state.
- `SelectionDock`: count, price, progress, remaining count and review. Mobile safe-area and content clearance required.
- `SelectionReview`: exact selected titles, remove/replace path, no payment until exactly ten.
- `TrustDetails`: delivery explanation, external-tool requirement, realistic-results disclaimer and support/terms links.

### Visual effects and implementation constraints

- Glass is an accent, not the base material: target 1–2 prominent glass surfaces per viewport; use opaque backgrounds for body copy and cards.
- Blur should be modest and layered over a sufficiently opaque tint; never rely on blur alone for contrast.
- Use CSS tokens for surface opacity, blur, shadow, border and motion duration so effects can be tuned or disabled centrally.
- Prefer CSS transitions and native controls over a new animation dependency.
- No heavy 3D, WebGL, parallax, autoplay video or large client framework for decorative effect.
- Keep the current vanilla HTML/CSS/JavaScript and Vercel API architecture unless profiling demonstrates a clear need to change it.
- Image optimisation, responsive srcsets, explicit dimensions, lazy loading below the fold and low-bandwidth fallbacks are required before launch.

### G01 acceptance checklist

- [ ] Desktop and narrow-mobile preview reviewed at realistic widths.
- [ ] Glass surfaces remain readable in light conditions and degrade to solid surfaces when unsupported.
- [ ] Guided finder works with keyboard, screen-reader labels and no model/API dependency.
- [ ] Category and prompt information hierarchy is understandable without animation.
- [ ] Selection remains exactly-ten, displays ₦500 consistently and never obscures controls.
- [ ] Reduced-motion and focus-visible states are defined.
- [ ] Before/after placeholders are clearly marked as placeholders; no fabricated examples.
- [ ] No production routes, payment endpoints, customer data or database schema are changed in G01.
- [ ] Design decision and responsive behaviour are documented before G02 data-model work begins.

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
