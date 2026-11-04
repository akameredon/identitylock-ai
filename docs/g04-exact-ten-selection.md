# G04 — Exact-Ten Prompt Selection Engine

Status: IN_PROGRESS. G03 is formally PASSED. G04 is limited to the public catalogue browser and exact-ten selection state; payment and delivery remain locked for later gates.

## Product rules

- A customer may select any 10 distinct published prompts.
- The selected count must never exceed 10.
- Duplicate IDs must not increase the count.
- The selection is valid only when exactly 10 unique prompt IDs are selected.
- Price display is ₦500 for a complete set of 10.
- No customer account, wallet, stored credit, or subscription is introduced.
- Selection is temporary browser state. It is not an order or proof of purchase.
- Payment, order creation, server-side selection validation, and delivery are not part of G04.

## Implementation boundary

- Build a standalone `/catalogue.html` route and its own CSS/JavaScript, initially available through the Vercel preview only.
- Do not add a public homepage link until G08.
- Read only active categories and published prompt metadata using the existing Supabase publishable key.
- Query prompt fields required for display only: `id`, `slug`, `title`, `short_description`, `category_id`, `sort_order`, and `tags`.
- Do not request or read `identitylock_prompt_versions`; prompt bodies remain private.
- Media previews are deliberately omitted in G04 because the existing media catalogue table is admin-only. A public preview-media projection, if needed, will be designed separately without exposing private media metadata.
- Do not change `api/checkout.js`, `api/verify.js`, `api/download.js`, Paystack configuration, or the existing ₦500 complete-bundle checkout.
- Do not seed permanent prompt content before the Admin Studio publishing workflow exists.

## Selection state model

- Maintain a Set of selected prompt UUIDs.
- Each prompt card has an accessible select/deselect control.
- A persistent selection summary displays the count and remaining slots.
- Disable additional selection at 10; selecting an already-selected prompt toggles it off.
- The continue action is enabled only at exactly 10.
- In G04 the continue action is a preview-only confirmation; it must not start payment or create an order. G05 owns that handoff.
- On reload, selection resets. No personal data or payment information is stored.

## Data loading and failure behavior

- Load active categories first and published prompts for those categories.
- Filter locally by category and search text without changing the underlying eligible prompt set.
- Render an explicit empty state when no prompts have been published.
- Render a retryable error state for network/API failure.
- Never fall back to hard-coded sample prompts on the live route.
- Treat all catalogue strings as untrusted text and render with safe DOM text APIs, not HTML interpolation.

## G04 acceptance checks

1. Public catalogue reads only active categories and published prompt metadata.
2. Prompt bodies and version rows are never requested or exposed.
3. Zero through nine selections remain invalid and cannot continue.
4. Exactly ten distinct prompt IDs is valid and enables the preview-only continue action.
5. An eleventh selection is prevented; deselection returns the count to nine.
6. Duplicate IDs do not inflate the count.
7. Category filtering and text search do not lose or silently add selections.
8. Empty catalogue and API error states are usable on mobile.
9. The route is not linked from the production homepage during G04.
10. Existing payment, verification, delivery, homepage, Admin Studio, and customer data remain unchanged.

## Later gates

- G05: server-side validation of exactly 10 published prompt IDs, immutable order snapshot, and Paystack payment integration.
- G06: secure delivery of the 10 exact prompt versions paid for.
- G07: Admin Studio category/prompt/version management and publishing workflow.
- G08: public storefront integration, visual presentation, examples, and customer experience.
- G09: security, regression, abuse, and capacity testing.
- G10: controlled production release.
