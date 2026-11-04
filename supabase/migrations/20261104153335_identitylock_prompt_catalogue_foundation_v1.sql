-- IdentityLock AI G03: prompt catalogue foundation.
-- Adds isolated catalogue tables; does not alter checkout, delivery, homepage, or existing customer data.

CREATE TABLE public.identitylock_prompt_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug = lower(slug) AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.identitylock_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug = lower(slug) AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  short_description text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES public.identitylock_prompt_categories(id) ON DELETE RESTRICT,
  preview_media_id uuid REFERENCES public.identitylock_media_items(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  current_version_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.identitylock_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.identitylock_prompts(id) ON DELETE RESTRICT,
  version_number integer NOT NULL CHECK (version_number > 0),
  prompt_text text NOT NULL CHECK (length(btrim(prompt_text)) > 0),
  change_note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identitylock_prompt_versions_prompt_version_unique UNIQUE (prompt_id, version_number),
  CONSTRAINT identitylock_prompt_versions_prompt_id_id_unique UNIQUE (prompt_id, id)
);

ALTER TABLE public.identitylock_prompts
  ADD CONSTRAINT identitylock_prompts_current_version_same_prompt_fk
  FOREIGN KEY (id, current_version_id)
  REFERENCES public.identitylock_prompt_versions(prompt_id, id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX identitylock_prompt_categories_active_order_idx
  ON public.identitylock_prompt_categories (sort_order, name) WHERE is_active = true;
CREATE INDEX identitylock_prompts_published_category_order_idx
  ON public.identitylock_prompts (category_id, sort_order, title) WHERE status = 'published';
CREATE INDEX identitylock_prompts_category_id_idx
  ON public.identitylock_prompts (category_id);
CREATE INDEX identitylock_prompts_preview_media_id_idx
  ON public.identitylock_prompts (preview_media_id);
CREATE INDEX identitylock_prompt_versions_prompt_version_idx
  ON public.identitylock_prompt_versions (prompt_id, version_number DESC);

ALTER TABLE public.identitylock_prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identitylock_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identitylock_prompt_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.identitylock_prompt_categories FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.identitylock_prompts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.identitylock_prompt_versions FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.identitylock_prompt_categories TO anon;
GRANT SELECT ON TABLE public.identitylock_prompts TO anon;

GRANT SELECT, INSERT, UPDATE ON TABLE public.identitylock_prompt_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.identitylock_prompts TO authenticated;
GRANT SELECT, INSERT ON TABLE public.identitylock_prompt_versions TO authenticated;

CREATE POLICY identitylock_prompt_categories_public_active_read
  ON public.identitylock_prompt_categories FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY identitylock_prompt_categories_admin_manage
  ON public.identitylock_prompt_categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = (select auth.uid())));

CREATE POLICY identitylock_prompts_public_published_read
  ON public.identitylock_prompts FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.identitylock_prompt_categories c
      WHERE c.id = category_id AND c.is_active = true
    )
  );

CREATE POLICY identitylock_prompts_admin_manage
  ON public.identitylock_prompts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = (select auth.uid())));

CREATE POLICY identitylock_prompt_versions_admin_read
  ON public.identitylock_prompt_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = (select auth.uid())));

CREATE POLICY identitylock_prompt_versions_admin_insert
  ON public.identitylock_prompt_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = (select auth.uid())));

COMMENT ON TABLE public.identitylock_prompt_categories IS 'IdentityLock prompt catalogue categories; public visibility requires active status.';
COMMENT ON TABLE public.identitylock_prompts IS 'Public prompt listing metadata; full prompt text is stored only in the protected versions table.';
COMMENT ON TABLE public.identitylock_prompt_versions IS 'Append-only prompt text versions; no anonymous grants or public RLS policies.';
