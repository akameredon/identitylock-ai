-- IdentityLock AI G06: paid prompt-set delivery read model.
-- Returns only the ten immutable prompt versions for a paid order.
-- The function runs as the caller and is executable only by service_role.

CREATE OR REPLACE FUNCTION public.get_identitylock_prompt_order_delivery(
  p_paystack_reference text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'order_id', o.id,
    'paid_at', o.paid_at,
    'items', jsonb_agg(
      jsonb_build_object(
        'position', i.position,
        'title', i.title_snapshot,
        'slug', i.slug_snapshot,
        'prompt_text', v.prompt_text
      )
      ORDER BY i.position
    )
  )
  FROM public.identitylock_orders o
  JOIN public.identitylock_order_items i
    ON i.order_id = o.id
  JOIN public.identitylock_prompt_versions v
    ON v.prompt_id = i.prompt_id
   AND v.id = i.prompt_version_id
  WHERE o.paystack_reference = p_paystack_reference
    AND o.status = 'paid'
    AND o.amount_kobo = 50000
    AND o.currency = 'NGN'
    AND p_paystack_reference ~ '^ILP-[A-Za-z0-9]{32}$'
  GROUP BY o.id
  HAVING count(i.id) = 10;
$$;

REVOKE ALL ON FUNCTION public.get_identitylock_prompt_order_delivery(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_identitylock_prompt_order_delivery(text)
  TO service_role;

COMMENT ON FUNCTION public.get_identitylock_prompt_order_delivery(text)
  IS 'Returns the exact ten immutable prompt versions for a paid IdentityLock guest order; executable only by service_role.';
