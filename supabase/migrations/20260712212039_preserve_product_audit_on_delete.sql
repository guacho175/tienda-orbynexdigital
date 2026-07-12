ALTER TABLE public.product_audit_events
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.product_audit_events
  DROP CONSTRAINT IF EXISTS product_audit_events_product_id_fkey;

ALTER TABLE public.product_audit_events
  ADD CONSTRAINT product_audit_events_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.set_product_active_with_audit(
  p_product_id UUID,
  p_is_active BOOLEAN
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_before public.products%ROWTYPE;
  v_after public.products%ROWTYPE;
BEGIN
  SELECT *
  INTO v_before
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado.';
  END IF;

  UPDATE public.products
  SET is_active = p_is_active
  WHERE id = p_product_id
  RETURNING * INTO v_after;

  IF v_before.is_active IS DISTINCT FROM v_after.is_active THEN
    INSERT INTO public.product_audit_events (
      product_id,
      event_type,
      before_snapshot,
      after_snapshot,
      changed_fields,
      created_by
    )
    VALUES (
      p_product_id,
      'product_update',
      to_jsonb(v_before),
      to_jsonb(v_after),
      ARRAY['is_active']::TEXT[],
      (SELECT auth.uid())
    );
  END IF;

  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_product_with_audit(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
BEGIN
  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado.';
  END IF;

  INSERT INTO public.product_audit_events (
    product_id,
    event_type,
    before_snapshot,
    after_snapshot,
    changed_fields,
    created_by
  )
  VALUES (
    p_product_id,
    'product_delete',
    to_jsonb(v_product),
    '{}'::jsonb,
    ARRAY['product']::TEXT[],
    (SELECT auth.uid())
  );

  DELETE FROM public.products
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_product_active_with_audit(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_with_audit(UUID) TO authenticated;
