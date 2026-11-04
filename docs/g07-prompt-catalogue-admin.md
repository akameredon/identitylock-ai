# G07 — Admin prompt catalogue

Status: **G07 PASSED** — Prompt Catalogue tab, versioned editor, production deployment, and authorized-admin RLS write simulation are verified. Production deployment commit: `8e553c787e3731c42fe08ccd2adac0e6fd79956e` (READY).

## Admin capabilities
- Create and edit prompt categories, including active/inactive status and sort order.
- Create prompts with title, slug, category, short description, tags and sort order.
- Save draft or publish a prompt by appending a new immutable version.
- View saved version history and identify the current version.
- Archive a prompt without deleting it or any version.
- Search the prompt library.
- No delete controls are exposed for categories, prompts or versions.

## Security and data integrity
- Existing Supabase RLS policies permit only authenticated users present in `admin_users` to manage categories/prompts and read/insert prompt versions.
- Full prompt text remains in `identitylock_prompt_versions`, which has no anon grants or public SELECT policy.
- The public catalogue queries only listing metadata from categories and prompts; it never selects full prompt text.
- New edits append a version and update the prompt's current-version pointer. Historical versions and paid order snapshots remain intact.
- Publishing is blocked in the UI when a category is inactive.
- Category deactivation hides its prompts from the public catalogue without deleting content or order history.

## Verification
- Preview Admin Studio HTML, JS and CSS return 200; new tab and all required editor controls are present.
- `node --check admin.js` passed.
- Static safety suite: 4 passed, 0 failed. It checks the tab/editor, category/prompt/version loading, append-only version writes, absence of destructive prompt/category/version operations, and that the public catalogue selects metadata only.
- Database policies and grants are grounded in the existing G03 migration. No new production data has been inserted or changed by this PR.

## G07 closure
- PR #22 merged to `main`: https://github.com/akameredon/identitylock-ai/pull/22
- Production deployment `dpl_4Ym26MFjQGsbk1JHTEYFD17GuSUX` is READY.
- Production Admin Studio HTML, JS and CSS return 200 and contain the new tab and editor controls.
- A rollback-only SQL test ran as the `authenticated` role with an authorized admin identity: create category, create draft prompt, insert version 1, publish, append version 2, and archive. The test confirmed two versions remained; the transaction was rolled back.

## Next gate
- G08 must seed/review the initial public catalogue, verify the customer selection flow against real published content, and integrate the new storefront without breaking the legacy bundle flow. Do not expose an empty catalogue to customers.
