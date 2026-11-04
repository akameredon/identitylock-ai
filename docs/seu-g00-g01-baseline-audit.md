# IdentityLock AI — SEU-G00/G01 Baseline Audit

Audit date: 2026-11-04
Repository baseline: `b6868ed54080ed02da198e75acf37c1218c26253`
Production deployment: `dpl_GkMn8vqzFs6ouHt8GidvnfcGc74a` (READY)
Scope: read-only source, production HTML, Vercel deployment/runtime metadata and live Supabase schema/policy inspection.

## Executive assessment

IdentityLock has a working paid prompt-selection and delivery foundation and a recognisable visual identity. The most important storefront gap is that the public prompt catalogue is text-only: prompt cards contain category, number, title, description, tags and a select button, but no associated before/after image.

The backend already contains a Media Library and comparison-pair concept, but it is not yet connected to prompt IDs. The one existing project/pair record is a draft with an empty title, description and disclaimer. The current Admin Studio can create projects, add pairs and reorder pairs; the reviewed UI does not provide project publish-state controls or pair edit/replace controls. The public frontend cannot safely obtain image paths by joining the admin-only media metadata table. This is the main architectural gap to solve in SEU-G02.

No production files, data, settings, media or payments were changed during this audit.

## 1. Production and code baseline

- Vercel project: `identitylock-ai`; framework reported as `null`.
- Runtime: Node.js 24.x.
- Latest production deployment at audit time: `dpl_GkMn8vqzFs6ouHt8GidvnfcGc74a`, state READY, commit `b6868ed54080ed02da198e75acf37c1218c26253`.
- Production homepage, `/catalogue.html` and `/admin.html` returned HTTP 200.
- The repository is a static HTML/CSS/JavaScript frontend with Vercel API routes; no React/Next.js app is present in the current source tree.
- Homepage uses `styles.css`, `homepage.js`, DM Sans and Playfair Display.
- Catalogue uses `catalogue.html`, `catalogue.css`, `catalogue.js` and the shared selection core.

### Existing brand tokens

Current CSS variables:
- ink `#17211e`
- muted `#65716c`
- paper `#f7f7f2`
- green `#1c4438`
- gold `#c59a58`
- line `#e2e5dd`

Retain these as the starting design tokens. The brand already has a warm editorial direction; it needs consistent application and more product imagery, not a random visual rebrand.

## 2. Existing product and routes

- Offer: choose any 10 unique prompts for ₦500, one-time, no account required.
- Five active categories, 16 published prompts with current versions:
  - Traditional & Cultural: 5
  - Professional & Corporate: 3
  - Celebrations & Milestones: 2
  - Weddings & Formal Occasions: 4
  - Luxury & Evening: 2
- Catalogue supports search, category filters, a 10-item selection limit, selection review, email capture and checkout handoff.
- The selection bar displays count, remaining prompts, progress and ₦500 price.
- Prompt cards currently render only text metadata and selection control.
- Homepage includes the promise, one comparison area, workflow explanation, catalogue list, realistic-results disclaimer, offer and FAQ.
- Homepage has CMS fields for original/new image URLs and captions. Live homepage content and private draft both currently contain original and new image URL values. This confirms CMS configuration, not a separate visual inspection that the images loaded correctly.
- Catalogue HTML explicitly includes `noindex,nofollow`; SEO indexing should be a deliberate decision.
- Admin route has `noindex,nofollow`, as expected for an administrative surface.
- The source tree does not contain a static `robots.txt` or `sitemap.xml` at this baseline.

### Current mobile code evidence (not device certification)

- Homepage CSS has a mobile breakpoint at 700 px; it hides the secondary nav link but keeps the main catalogue CTA visible.
- Catalogue CSS has breakpoints at 800 px and 560 px; the prompt grid changes to one column at the narrow breakpoint and a sticky selection bar remains.
- These are source-level findings only. No physical-device screenshot, browser automation, screen-reader or touch-usability test was completed in G00.

## 3. Media backend findings (live, read-only)

The live Supabase project confirms:

| Resource | Current count / setting |
|---|---:|
| `media_assets` legacy metadata rows | 3 |
| `identitylock_media_items` rows | 7 |
| `identitylock_media_projects` rows | 1 |
| `identitylock_comparison_pairs` rows | 1 |
| `identitylock_media_versions` rows | 0 |
| Storage objects in `identitylock-media` | 7 |

The single project is titled `My image`, category `Personal`, and status `draft`. It has one pair, but the pair title, description and disclaimer are empty. The project/pair is not a published customer-facing category example.

The existing Media Library bucket:
- is public;
- has a 20 MiB object-size limit;
- allows JPEG, PNG, WebP and GIF;
- has an anonymous/authenticated SELECT policy for objects in this bucket;
- restricts object insert/update/delete to the IdentityLock admin helper.

Important privacy rule: every object in this bucket must be treated as public content. Do not store private customer photographs, identity documents or other confidential uploads here. If customer photo uploads are ever added, design a separate private bucket with explicit consent, retention and deletion rules.

The metadata table `identitylock_media_items` has admin-only SELECT/INSERT/UPDATE grants and policies. `identitylock_comparison_pairs` has a public SELECT grant/policy only when its project is published. Because the public role cannot read the joined media-item rows, the current public client cannot safely resolve the pair's storage paths through the existing nested relationship.

### Required G02 design response

Do not simply grant public SELECT on all media-item metadata: it includes admin-oriented fields such as uploader, hashes and metadata.

Instead, implement a narrow public projection (for example a tightly filtered published-comparison view or read-only RPC) that exposes only the fields needed to render an approved pair: public image URL/path, dimensions, safe alt text, caption/disclaimer, prompt/category association and ordering. It must return only published examples and must never return full prompt text or private/admin fields. Review the exact SQL security model and grants before applying it.

### Required data relationship

Current comparison pairs point to `project_id`, not to a prompt ID or a prompt category foreign key. Project category is free text. Add a deliberate relationship so each prompt can own one or more approved before/after examples. Category galleries should be derived from the prompt's current category, not maintained as a second inconsistent category list.

The homepage currently stores direct HTTPS image URLs in `site_settings`. G02 should let an administrator select approved Media Library assets rather than manually pasting URLs, while preserving the current published homepage values until the new system is ready.

### Admin UI gaps

Source review confirms:
- Projects & Comparisons can create projects.
- It can add before/after pairs.
- It can reorder existing pairs.
- The project form does not expose a publish status field.
- The pair list has no edit/replace action for existing pairs.
- Prompt Catalogue Manager manages categories and prompt versions but has no visual-pair association.
- Homepage Manager exposes image URL text fields rather than a Media Library picker.

These are implementation gaps, not evidence that the existing upload controls are broken. The user previously confirmed the Media Library upload controls work; this audit does not re-test an upload.

## 4. Competitor and market pattern review

### PromptBase — prompt marketplace
Reference: https://promptbase.com/shop

Observed patterns:
- Distinguishes prompts, agent skills, bundles and apps.
- Provides filters for product type, media type, price and model.
- Makes browsing/search a first-class part of the marketplace.
- Supports the principle that prompt products need previews and metadata that help buyers compare before purchase.

Adopt: visual cards, useful category/model metadata where relevant, filters, preview details and clear purchase/delivery expectations.

### Aragon AI — AI portrait and image tools
Reference: https://www.aragon.ai/

Observed patterns:
- Uses before/after examples prominently.
- Shows related transformation tools and their purpose.
- Makes privacy and customer proof visible near conversion content.

Adopt: strong transformation demonstrations, adjacent-use-case discovery and clear privacy/limitations explanations. Do not copy scale claims, review counts or guarantees.

### BetterPic — AI headshot service
Reference: https://www.betterpic.io/pricing

Observed patterns:
- Packages list deliverables, styles, timing, support and redo/edit allowances.
- Pricing FAQs address output realism, source images, usage rights and payment safety.

Adopt: precise "what you get", usage guidance, support expectations and FAQ content. Do not invent turnaround times, refunds, rights or guarantees that IdentityLock does not provide.

### Baymard — ecommerce product-page research
Reference: https://baymard.com/research/product-page

Baymard reports 1,300+ product-page usability issues identified through testing and a current benchmark where 49% of 344 sites reached decent/good overall product-page UX while 51% were mediocre or worse. The practical lesson is to treat prompt cards/details as product pages: images, clear explanations, comparison, navigation and decision support matter.

## 5. Standards and acceptance framework

- WCAG 2.2 AA engineering target: https://www.w3.org/TR/WCAG22/
- Core Web Vitals good thresholds: LCP <= 2.5 seconds, INP <= 200 ms, CLS <= 0.1 at the 75th percentile: https://developers.google.com/search/docs/appearance/core-web-vitals
- Security: least-privilege access, RLS, minimal public image metadata, private prompt text, safe encoding and no secret keys in frontend.
- SEO: indexable public category metadata if appropriate, descriptive titles, canonical URLs, sitemap/robots review, no indexing of Admin Studio or private delivery.
- Image rights: every public example needs permission and must not be misrepresented as guaranteed output.

### Measurements not yet completed

No reliable baseline was collected for:
- Lighthouse/PageSpeed mobile or desktop scores;
- field Core Web Vitals;
- actual iPhone/Android visual rendering;
- keyboard-only or screen-reader usability;
- formal WCAG conformance;
- checkout conversion, bounce or repeat-purchase rates;
- sustained load or concurrent capacity.

These must be measured in G00/G05; they must not be inferred from source code or a successful HTTP 200 response.

## 6. v0 and Generative UI findings

References:
- Design Systems 2.0: https://v0.app/docs/design-systems-2
- FAQ / current GitHub integration: https://v0.app/docs/faqs
- Pricing: https://v0.app/pricing
- Generative UI concepts: https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces

Distinction:
- v0 is an AI-assisted interface/code generation and design-system workflow.
- Generative UI is a runtime pattern for rendering structured interactive UI from model/tool output.
- IdentityLock's normal shopping flow should remain deterministic. AI-generated UI is not needed for category browsing, selection, payment or delivery.

Safe use:
- Prototype the approved design system and reusable UI in v0 if the free allowance is sufficient.
- Connect the existing GitHub repository only through a branch/PR workflow.
- v0 documentation describes automatic branch/commit/PR integration and no direct push to main.
- v0's current Free plan lists $5 monthly credits and a 7 message/day limit; this is not unlimited usage. Do not purchase a paid plan or additional credits for this project.
- The existing project is vanilla HTML/CSS/JS and Vercel reports no framework. v0 commonly uses Next.js/React/TypeScript/Tailwind/shadcn in its starter. Do not accept a full framework rewrite by default. Prototype first and port only reviewed components or make an incremental migration proposal.

## 7. Risk register

| Risk | Severity | Required response |
|---|---|---|
| No prompt-to-visual relationship | Critical | Add prompt-linked pair model in G02 |
| Public bucket exposes every stored object | High | Keep only approved public assets there; separate private storage for any future customer uploads |
| Admin-only media metadata blocks public path resolution | High | Minimal published-only public projection |
| Existing pair project is draft and incomplete | High | Do not treat it as a live example; build draft/preview/publish workflow |
| Admin cannot edit/replace existing pair or publish project | High | Extend Admin Studio with safe editing/versioning |
| Catalogue noindex | Medium | Decide SEO policy and public category routes |
| Large original image files (some >2 MB) | Medium | Generate responsive derivatives and optimise delivery without altering originals |
| v0 starter may imply a new framework | Medium | Prototype only; no unreviewed migration |
| Legacy `/api/download` and `/api/verify` still read `req.query` | Medium | Separate DEP0169 follow-up; historical logs included these routes |
| No field metrics or conversion instrumentation | Medium | Establish privacy-conscious baseline before claiming conversion improvements |

## 8. DEP0169 note carried into the baseline

The current 7-day Vercel aggregate showed 33 historical warnings across `/api/download`, `/api/prompt-set-delivery`, `/api/prompt-set-verify` and `/api/verify`. Trace evidence previously identified the Vercel `req.query` getter as the cause in the two prompt-set routes; those two were changed to WHATWG URL parsing and deployed in `b6868ed`.

A 30-minute query at this audit time still displayed four historical occurrences, all last seen at 18:08:33Z on the prior deployment `dpl_72TL5CytpYArYVmXpKigXdhDK8sq`; the log query identified those entries on that old deployment. No later occurrence was shown in the sampled logs. This is not proof of a long-term resolution.

The legacy source files `api/download.js` and `api/verify.js` still access `req.query.reference`. They were included in the historical affected-route aggregate and should be handled in the separate deprecation cleanup before claiming the warning is resolved across the entire application.

## 9. G00/G01 status at handoff

- Repository, production HTML, project settings and deployment inventory: inspected.
- Live prompt/category counts and relevant media tables: inspected read-only.
- Storage bucket configuration and relevant RLS policies: inspected read-only.
- Competitor and standards research: completed at desk-research level.
- Initial design tokens and component inventory: proposed in the SEU master plan.
- Physical-device, browser screenshot, Lighthouse, screen-reader and conversion analytics: not yet measured.
- No production or database mutations were performed.

**G00 status: IN PROGRESS — source/data baseline established; visual/device/performance evidence still required.**

**G01 status: DESIGN BLUEPRINT DRAFTED — requires high-fidelity preview and design review before G01 can pass.**
