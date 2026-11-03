-- IdentityLock production hardening: restrict anonymous grants and index foreign keys.
-- Existing authenticated admin policies and existing public read surfaces are preserved.

REVOKE ALL PRIVILEGES ON TABLE public.admin_users, public.admin_audit_log, public.media_assets FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.site_settings, public.site_pages FROM anon;
GRANT SELECT ON TABLE public.site_settings, public.site_pages TO anon;

REVOKE ALL ON FUNCTION public.is_identitylock_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_identitylock_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_identitylock_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_identitylock_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_identitylock_owner() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_identitylock_owner() TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS admin_audit_log_actor_id_idx ON public.admin_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS identitylock_comparison_pairs_original_media_id_idx ON public.identitylock_comparison_pairs (original_media_id);
CREATE INDEX IF NOT EXISTS identitylock_comparison_pairs_transformed_media_id_idx ON public.identitylock_comparison_pairs (transformed_media_id);
CREATE INDEX IF NOT EXISTS identitylock_media_backups_created_by_idx ON public.identitylock_media_backups (created_by);
CREATE INDEX IF NOT EXISTS identitylock_media_items_uploaded_by_idx ON public.identitylock_media_items (uploaded_by);
CREATE INDEX IF NOT EXISTS identitylock_media_projects_created_by_idx ON public.identitylock_media_projects (created_by);
CREATE INDEX IF NOT EXISTS identitylock_media_projects_updated_by_idx ON public.identitylock_media_projects (updated_by);
CREATE INDEX IF NOT EXISTS identitylock_media_versions_created_by_idx ON public.identitylock_media_versions (created_by);
CREATE INDEX IF NOT EXISTS identitylock_publication_snapshots_published_by_idx ON public.identitylock_publication_snapshots (published_by);
CREATE INDEX IF NOT EXISTS media_assets_created_by_idx ON public.media_assets (created_by);
CREATE INDEX IF NOT EXISTS site_pages_updated_by_idx ON public.site_pages (updated_by);
CREATE INDEX IF NOT EXISTS site_settings_updated_by_idx ON public.site_settings (updated_by);
