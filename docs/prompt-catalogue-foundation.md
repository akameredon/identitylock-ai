# G03 — Prompt Catalogue Foundation

Status: database foundation applied, repository migrations merged, and production deployment READY. Admin Studio catalogue screens are intentionally scheduled for G07.

## Scope

G03 establishes the durable catalogue foundation for IdentityLock AI's approved product:

- Customers will browse published prompt listings and select any 10.
- The price remains NGN ₦500 for exactly 10 prompts.
- Prompt text is not exposed through the public catalogue API before purchase.
- Each later purchase must snapshot the exact prompt version sold.
- Admins manage catalogue metadata and publish/unpublish entries.
- Prompt versions are append-only; edits create a new version rather than overwrite sold text.

G03 does not change the live checkout, payment verification, ZIP delivery, homepage, or customer records.

## Applied data model

### `identitylock_prompt_categories`

- UUID primary key; unique lowercase URL-safe slug.
- Name (1–100 characters), description, sort order, active flag.
- Creation and update timestamps.

### `identitylock_prompts`

- UUID primary key; unique lowercase URL-safe slug.
- Title (1–160 characters), short description, category, optional existing media preview.
- Status constrained to `draft | published | archived`.
- Sort order, tags, current version pointer, creator/updater references and timestamps.
- The current-version composite foreign key guarantees the selected version belongs to this same prompt.

### `identitylock_prompt_versions`

- UUID primary key, prompt reference, positive version number, non-empty prompt text, change note, creator and creation timestamp.
- Unique `(prompt_id, version_number)` and `(prompt_id, id)`.
- Authenticated administrators can SELECT and INSERT versions; no UPDATE or DELETE privilege is granted.
- Versions are append-only. An edit inserts a new version and advances the prompt pointer in one transaction.

## Security and API exposure

- RLS is enabled on all three tables.
- `anon` has SELECT only on categories and prompts, filtered to active categories and published prompts whose category is active.
- `anon` has no access to prompt versions or prompt bodies.
- Authenticated catalogue management is restricted by the existing `admin_users` allow-list.
- Prompt versions have no authenticated UPDATE or DELETE grant.
- No new SECURITY DEFINER functions were introduced.
- Explicit Data API grants are present.

## Tracked migrations

The following migrations are committed under `supabase/migrations/` and recorded in the target Supabase project:

1. `20261104153335_identitylock_prompt_catalogue_foundation_v1.sql`
2. `20261104153528_identitylock_prompt_catalogue_public_policy_split_v1.sql`
3. `20261104153553_identitylock_prompt_catalogue_fk_indexes_v1.sql`

The first creates the three tables, constraints, RLS, policies, grants and core indexes. The second separates guest read policies from authenticated admin policies. The third indexes creator/updater and current-version foreign keys.

## Indexes and constraints

- Unique indexes for category and prompt slugs.
- Published prompt ordering index by category and sort order.
- Prompt versions indexed by prompt and version number.
- Foreign-key indexes cover category, preview media, creator/updater, current version and version creator references.
- Foreign keys use RESTRICT where deleting a referenced catalogue item could orphan historical or sold content.

## Verification completed

- All three tables exist and have RLS enabled.
- Anonymous SELECT is granted only on categories and prompts; anonymous writes are not granted.
- Anonymous access to prompt versions is not granted.
- Authenticated version privileges are SELECT and INSERT only.
- Admin RLS policy and version creation/current-pointer update were exercised in a rollback-only transaction using the authorized administrator identity; no QA rows remain.
- The composite current-version foreign key was inspected in PostgreSQL.
- Supabase security and performance advisors were reviewed. Existing project-level warnings remain documented for G09; no unrelated security settings or existing policies were changed.
- Vercel production deployment for the merge commit is READY and aliases `https://identitylock-ai.vercel.app`.
- Existing checkout, verification, download, homepage, media and customer records were not changed by G03.

## Known project-level advisor findings

The security advisor continues to report two pre-existing authenticated-executable SECURITY DEFINER functions (`is_identitylock_admin()` and `is_identitylock_owner()`) and disabled leaked-password protection. The performance advisor continues to report existing RLS initialization-plan warnings in the wider project. These are not introduced by the catalogue migrations and are reserved for G09 review.

## Implementation sequencing

G03 establishes the database foundation only. Exact-ten selection belongs to G04; order records and Paystack integration belong to G05; purchase delivery belongs to G06; catalogue management screens belong to G07. No new checkout route should be enabled before those gates pass.
