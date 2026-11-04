-- Cover prompt catalogue foreign keys for predictable delete/update checks and joins.
CREATE INDEX identitylock_prompts_created_by_idx ON public.identitylock_prompts (created_by);
CREATE INDEX identitylock_prompts_updated_by_idx ON public.identitylock_prompts (updated_by);
CREATE INDEX identitylock_prompts_current_version_fk_idx ON public.identitylock_prompts (id, current_version_id);
CREATE INDEX identitylock_prompt_versions_created_by_idx ON public.identitylock_prompt_versions (created_by);
