-- Cover the composite foreign key used by immutable order prompt-version snapshots.
CREATE INDEX IF NOT EXISTS identitylock_order_items_prompt_version_idx
  ON public.identitylock_order_items (prompt_id, prompt_version_id);
