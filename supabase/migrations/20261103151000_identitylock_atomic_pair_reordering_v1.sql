-- Atomic comparison-pair order swap.
-- SECURITY INVOKER preserves caller RLS; execution is limited to authenticated users.
CREATE OR REPLACE FUNCTION public.swap_identitylock_comparison_pair_order(first_pair_id uuid, second_pair_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth
AS $function$
DECLARE
  first_project uuid;
  second_project uuid;
  first_order integer;
  second_order integer;
BEGIN
  IF first_pair_id IS NULL OR second_pair_id IS NULL OR first_pair_id = second_pair_id THEN
    RAISE EXCEPTION 'Two different comparison pairs are required';
  END IF;

  PERFORM 1
  FROM public.identitylock_comparison_pairs
  WHERE id IN (first_pair_id, second_pair_id)
  ORDER BY id
  FOR UPDATE;

  SELECT project_id, sort_order INTO first_project, first_order
  FROM public.identitylock_comparison_pairs WHERE id = first_pair_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'First comparison pair was not found'; END IF;

  SELECT project_id, sort_order INTO second_project, second_order
  FROM public.identitylock_comparison_pairs WHERE id = second_pair_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Second comparison pair was not found'; END IF;

  IF first_project IS DISTINCT FROM second_project THEN
    RAISE EXCEPTION 'Comparison pairs must belong to the same project';
  END IF;

  UPDATE public.identitylock_comparison_pairs
  SET sort_order = CASE
    WHEN id = first_pair_id THEN second_order
    WHEN id = second_pair_id THEN first_order
    ELSE sort_order
  END
  WHERE id IN (first_pair_id, second_pair_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.swap_identitylock_comparison_pair_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.swap_identitylock_comparison_pair_order(uuid, uuid) TO authenticated;
