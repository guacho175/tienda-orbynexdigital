CREATE INDEX IF NOT EXISTS idx_orders_unclaimed_customer_email_normalized
  ON public.orders (lower(btrim(customer_email)))
  WHERE user_id IS NULL;

CREATE OR REPLACE FUNCTION public.link_guest_orders_to_user(
  p_user_id UUID,
  p_email TEXT
)
RETURNS TABLE(linked_orders INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(btrim(p_email));
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user id is required';
  END IF;

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email is required';
  END IF;

  UPDATE public.orders
  SET
    user_id = p_user_id,
    updated_at = now()
  WHERE user_id IS NULL
    AND lower(btrim(customer_email)) = v_email;

  GET DIAGNOSTICS linked_orders = ROW_COUNT;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_guest_orders_to_user(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_guest_orders_to_user(UUID, TEXT)
  TO service_role;
