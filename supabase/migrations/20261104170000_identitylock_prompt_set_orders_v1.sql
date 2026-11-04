-- IdentityLock AI G05: private guest orders and immutable 10-prompt snapshots.
-- Additive only. Existing fixed-bundle checkout and customer data are untouched.

CREATE TABLE public.identitylock_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL
    CHECK (length(btrim(customer_email)) BETWEEN 5 AND 254)
    CHECK (customer_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  amount_kobo integer NOT NULL DEFAULT 50000 CHECK (amount_kobo = 50000),
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paystack_reference text NOT NULL UNIQUE
    CHECK (paystack_reference ~ '^[A-Za-z0-9.-]{8,100}$'),
  paystack_transaction_id text UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identitylock_orders_paid_timestamp_check
    CHECK (status <> 'paid' OR paid_at IS NOT NULL)
);

CREATE TABLE public.identitylock_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.identitylock_orders(id) ON DELETE RESTRICT,
  prompt_id uuid NOT NULL,
  prompt_version_id uuid NOT NULL,
  title_snapshot text NOT NULL,
  slug_snapshot text NOT NULL,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identitylock_order_items_unique_prompt UNIQUE (order_id, prompt_id),
  CONSTRAINT identitylock_order_items_unique_position UNIQUE (order_id, position),
  CONSTRAINT identitylock_order_items_exact_version_fk
    FOREIGN KEY (prompt_id, prompt_version_id)
    REFERENCES public.identitylock_prompt_versions(prompt_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX identitylock_orders_status_created_idx
  ON public.identitylock_orders (status, created_at DESC);
CREATE INDEX identitylock_order_items_order_position_idx
  ON public.identitylock_order_items (order_id, position);

ALTER TABLE public.identitylock_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identitylock_order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.identitylock_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.identitylock_order_items FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.identitylock_orders TO service_role;
GRANT SELECT, INSERT ON TABLE public.identitylock_order_items TO service_role;

CREATE OR REPLACE FUNCTION public.identitylock_reject_prompt_order_item_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Prompt order snapshots are immutable';
END;
$$;

REVOKE ALL ON FUNCTION public.identitylock_reject_prompt_order_item_mutation() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER identitylock_order_items_immutable
BEFORE UPDATE OR DELETE ON public.identitylock_order_items
FOR EACH ROW EXECUTE FUNCTION public.identitylock_reject_prompt_order_item_mutation();

CREATE OR REPLACE FUNCTION public.create_identitylock_prompt_order(
  p_email text,
  p_prompt_ids uuid[],
  p_paystack_reference text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid;
  v_distinct_count integer;
  v_eligible_count integer;
  v_inserted_count integer;
BEGIN
  IF p_email IS NULL
     OR length(btrim(p_email)) NOT BETWEEN 5 AND 254
     OR btrim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' THEN
    RAISE EXCEPTION 'A valid customer email is required';
  END IF;

  IF p_prompt_ids IS NULL OR cardinality(p_prompt_ids) <> 10
     OR array_position(p_prompt_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Exactly 10 distinct prompt IDs are required';
  END IF;

  SELECT count(DISTINCT u.prompt_id)
    INTO v_distinct_count
    FROM unnest(p_prompt_ids) AS u(prompt_id);

  IF v_distinct_count <> 10 THEN
    RAISE EXCEPTION 'Exactly 10 distinct prompt IDs are required';
  END IF;

  IF p_paystack_reference IS NULL
     OR p_paystack_reference !~ '^[A-Za-z0-9.-]{8,100}$' THEN
    RAISE EXCEPTION 'Invalid payment reference';
  END IF;

  SELECT count(*)
    INTO v_eligible_count
    FROM unnest(p_prompt_ids) AS requested(prompt_id)
    JOIN public.identitylock_prompts p ON p.id = requested.prompt_id
    JOIN public.identitylock_prompt_categories c
      ON c.id = p.category_id AND c.is_active = true
    JOIN public.identitylock_prompt_versions v
      ON v.id = p.current_version_id AND v.prompt_id = p.id
    WHERE p.status = 'published';

  IF v_eligible_count <> 10 THEN
    RAISE EXCEPTION 'All 10 prompts must be currently published with an active category and current version';
  END IF;

  INSERT INTO public.identitylock_orders (
    customer_email, amount_kobo, currency, status, paystack_reference
  )
  VALUES (lower(btrim(p_email)), 50000, 'NGN', 'pending', p_paystack_reference)
  RETURNING id INTO v_order_id;

  INSERT INTO public.identitylock_order_items (
    order_id, prompt_id, prompt_version_id, title_snapshot, slug_snapshot, position
  )
  SELECT
    v_order_id,
    p.id,
    p.current_version_id,
    p.title,
    p.slug,
    requested.position::smallint
  FROM unnest(p_prompt_ids) WITH ORDINALITY AS requested(prompt_id, position)
  JOIN public.identitylock_prompts p ON p.id = requested.prompt_id
  JOIN public.identitylock_prompt_categories c
    ON c.id = p.category_id AND c.is_active = true
  JOIN public.identitylock_prompt_versions v
    ON v.id = p.current_version_id AND v.prompt_id = p.id
  WHERE p.status = 'published'
  ORDER BY requested.position;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  IF v_inserted_count <> 10 THEN
    RAISE EXCEPTION 'Could not snapshot all 10 prompt versions';
  END IF;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_identitylock_prompt_order(text, uuid[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_identitylock_prompt_order(text, uuid[], text) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_identitylock_prompt_order_paid(
  p_order_id uuid,
  p_paystack_reference text,
  p_transaction_id text,
  p_amount_kobo integer,
  p_currency text,
  p_paid_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_updated_id uuid;
  v_item_count integer;
BEGIN
  IF p_order_id IS NULL OR p_paystack_reference IS NULL
     OR p_transaction_id IS NULL OR length(p_transaction_id) = 0
     OR p_amount_kobo <> 50000 OR p_currency <> 'NGN'
     OR p_paid_at IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_item_count
    FROM public.identitylock_order_items i
   WHERE i.order_id = p_order_id;

  IF v_item_count <> 10 THEN
    RETURN false;
  END IF;

  UPDATE public.identitylock_orders
     SET status = 'paid',
         paystack_transaction_id = p_transaction_id,
         paid_at = p_paid_at,
         updated_at = now()
   WHERE id = p_order_id
     AND paystack_reference = p_paystack_reference
     AND amount_kobo = p_amount_kobo
     AND currency = p_currency
     AND status = 'pending'
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NOT NULL THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM public.identitylock_orders o
     WHERE o.id = p_order_id
       AND o.paystack_reference = p_paystack_reference
       AND o.paystack_transaction_id = p_transaction_id
       AND o.amount_kobo = p_amount_kobo
       AND o.currency = p_currency
       AND o.status = 'paid'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_identitylock_prompt_order_paid(uuid, text, text, integer, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_identitylock_prompt_order_paid(uuid, text, text, integer, text, timestamptz) TO service_role;

COMMENT ON TABLE public.identitylock_orders IS 'Private guest prompt-set payment orders; exactly 10 prompt versions per order.';
COMMENT ON TABLE public.identitylock_order_items IS 'Immutable snapshots of the exact prompt versions purchased in each order.';
