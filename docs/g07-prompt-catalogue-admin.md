# G07 — Admin prompt catalogue

Status: IN_PROGRESS. The Admin Studio Prompt Catalogue tab and append-only prompt editor are implemented on `feat/g07-prompt-catalogue-admin`; preview deployment is READY. Production merge and authorized-admin write verification remain.

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

## Remaining
- Merge and confirm production deployment.
- Confirm an authorized administrator can create a category, save a draft prompt, publish it, append a second version, and archive without deleting history.
- Populate the initial prompt library with reviewed content before G08 storefront integration. Do not expose an empty catalogue to customers.
