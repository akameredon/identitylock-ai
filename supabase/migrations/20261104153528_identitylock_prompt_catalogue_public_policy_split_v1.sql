-- Public catalogue reads are guest-only. Authenticated access is reserved for admins.
-- This avoids overlapping permissive SELECT policies for the authenticated role.

DROP POLICY identitylock_prompt_categories_public_active_read ON public.identitylock_prompt_categories;
CREATE POLICY identitylock_prompt_categories_public_active_read
  ON public.identitylock_prompt_categories FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY identitylock_prompts_public_published_read ON public.identitylock_prompts;
CREATE POLICY identitylock_prompts_public_published_read
  ON public.identitylock_prompts FOR SELECT TO anon
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.identitylock_prompt_categories c
      WHERE c.id = category_id AND c.is_active = true
    )
  );
