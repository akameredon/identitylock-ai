# IdentityLock AI — Visual Media Management

## Scope of this first implementation increment

This branch introduces an additive database foundation for the visual media manager. It intentionally does not modify existing Admin Studio files, the current `media_assets` records, Storage bucket policies, published homepage content, checkout, Paystack, payment verification, or secure delivery.

## Included schema

- `identitylock_media_items`: metadata catalogue for the existing `identitylock-media` bucket, with a 20 MB metadata constraint and JPEG/PNG/WebP/GIF MIME allow-list.
- `identitylock_media_projects`: project records, descriptions, categories, draft/published/archived state and manual ordering.
- `identitylock_comparison_pairs`: atomic original/transformed pair references, captions, disclaimer and ordering.
- `identitylock_media_versions`: immutable file-version references and crop/position metadata.
- `identitylock_publication_snapshots`: JSON snapshots intended for preview and restore workflows.
- `identitylock_media_backups`: backup manifests and retention metadata.

All six tables have RLS enabled. Admin access follows the existing `admin_users.user_id` allow-list pattern found in the current Admin Studio. Public reads are limited to published project and pair metadata. Media item metadata, versions, snapshots and backup manifests remain admin-only.

## Important limitations / deployment gates

1. The existing bucket is present, but its current Storage policies and bucket-level MIME/size settings have not been inspected. The migration does not change them.
2. The existing `media_assets` schema was not available in repository SQL files. This migration deliberately creates a separate metadata catalogue rather than assuming its primary key or altering it.
3. The backup table stores manifests only. A scheduled worker/Edge Function and verified object-copy process are still required for actual daily and pre-publication backups and the 90-day/indefinite retention rules.
4. GIF animation preservation depends on storing and serving the original GIF object unchanged. Do not route GIF originals through lossy image conversion.
5. Exact duplicate detection can use `content_hash`; visual similarity requires a separately implemented perceptual-hash worker. No records are automatically merged or deleted.
6. The migration should be reviewed against the live Supabase schema and policies before application. In particular, confirm `public.admin_users(user_id)` exists and is unique/indexed, and test the policies with the authorised administrator and anonymous visitor roles.

## Rollout sequence

1. Inspect live schema, bucket settings, Storage policies and existing media metadata.
2. Review and apply this additive migration in a non-production environment first.
3. Add Storage policy changes only after inspecting current policies; keep writes limited to authorised Admin Studio users.
4. Implement and test the uploader (20 MB; JPEG/PNG/WebP/GIF), bulk uploads, metadata indexing, filters, project/pair editor and manual ordering.
5. Implement draft preview and immutable pre-publish snapshots; publication remains explicit.
6. Add a real backup worker, object-copy verification, daily scheduling, retention enforcement and usage alerts.
7. Implement comparison viewer, responsive slider, shareable project routes, usage-reference warnings, undo/redo and restore.
8. Run RLS, upload, GIF, mobile, accessibility, restore and payment-regression tests before merge/deploy.

## Explicit non-goals

No live database migration, Storage policy update, object deletion, automatic publication, payment change, or production deployment is performed by this branch.
