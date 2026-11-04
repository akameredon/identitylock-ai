# G03 — Prompt Catalogue Foundation

Status: database foundation applied and verified; Admin Studio catalogue screens are intentionally scheduled for G07.

## Scope

G03 establishes the durable catalogue foundation for IdentityLock AI's approved product:

- Customers will eventually browse published prompt listings and select any 10.
- The price remains NGN ₦500 for a purchase of exactly 10 prompts.
- Prompt text is not exposed through the public catalogue API before purchase.
- Each purchase in a later gate must snapshot the exact prompt version sold.
- Admins manage catalogue metadata and publish/unpublish entries.
- Prompt versions are append-only; edits create a new version rather than overwrite sold text.

G03 does not change the live checkout, payment verification, ZIP delivery, homepage, or customer records.

## Proposed data model

### `identitylock_prompt_categories`

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `description text not null default ''`
- `sort_order integer not null default 0`
- `is_active boolean not null default true`
- `created_at`, `updated_at` timestamps

Public readers can see active categories. Administrators can manage categories.

### `identitylock_prompts`

- `id uuid primary key`
- `slug text unique not null`
- `title text not null`
- `short_description text not null default ''`
- `category_id uuid not null` referencing categories
- `preview_media_id uuid nullable` referencing existing `identitylock_media_items` with delete restricted
- `status text` constrained to `draft | published | archived`
- `sort_order integer not null default 0`
- `tags text[] not null default '{}'`
- `current_version_id uuid nullable`
- `created_by`, `updated_by` references `auth.users` with delete set null
- `created_at`, `updated_at` timestamps

Public readers can see metadata for published prompts only. The catalogue contains teasers and preview imagery, not the paid prompt body.

### `identitylock_prompt_versions`

- `id uuid primary key`
- `prompt_id uuid not null` referencing prompts
- `version_number integer not null check (version_number > 0)`
- `prompt_text text not null`
- `change_note text not null default ''`
- `created_by` references `auth.users` with delete set null
- `created_at timestamptz not null default now()`
- unique `(prompt_id, version_number)`
- unique `(prompt_id, id)` to support a composite current-version foreign key

Prompt versions are append-only. Admins may read and insert versions but not update or delete them. The prompt's `current_version_id` points to a version belonging to that same prompt. A new edit creates a new version and advances this pointer in one transaction.

## Security and API exposure

Supabase's Data API exposure defaults changed on 2026-10-30. New public-schema tables must receive explicit grants if they are to be reached through the Data API.

- Enable RLS on all three tables.
- Explicitly grant `SELECT` to `anon` only where public catalogue reads are intended.
- Grant authenticated table privileges required by Admin Studio, then enforce administrator membership with the existing `admin_users` allow-list in RLS.
- Never grant anonymous access to prompt versions or prompt bodies.
- Do not use user-editable `user_metadata` for authorization.
- Do not add a new SECURITY DEFINER function for catalogue access.
- Use `(select auth.uid())` in policy predicates where appropriate.
- Preserve existing RLS policies and all existing media, payment, and delivery data.

## Indexes and constraints

- Unique indexes for category and prompt slugs.
- Index published prompt ordering by category and sort order.
- Index prompt versions by prompt and version number.
- Partial indexes only where they support a demonstrated query pattern.
- Foreign keys must have supporting indexes where PostgreSQL does not create them automatically.

## Acceptance checks for G03

1. Migration is committed in the repository and applied through a tracked Supabase migration workflow.
2. All new tables have RLS enabled and explicit Data API grants.
3. Anonymous queries return only active categories and published prompt metadata.
4. Anonymous queries cannot read prompt-version rows or prompt text.
5. An authenticated non-admin cannot read or mutate catalogue records.
6. An authorized Admin Studio user can create a category, draft prompt, and first prompt version.
7. Prompt version updates are append-only; an edit creates a new version and safely advances the current pointer.
8. Existing tables, rows, Storage objects, checkout, verification, download, and homepage remain unchanged.
9. Supabase security and performance advisors are reviewed after schema application.
10. Tests verify no public prompt body exposure and no cross-prompt current-version pointer.

## Implementation sequencing

G03 adds the catalogue schema and administrative catalogue foundation only. Exact-ten selection belongs to G04; order records and Paystack integration belong to G05; purchase delivery belongs to G06. No new checkout route should be enabled before those gates pass.

## Environment constraint recorded

The available execution environment did not expose a Supabase CLI binary at the time this design was prepared. Per the project's migration governance, the schema must not be applied as an untracked direct SQL change or as a remote-only migration without a matching repository migration. The migration workflow must be established before applying DDL.
