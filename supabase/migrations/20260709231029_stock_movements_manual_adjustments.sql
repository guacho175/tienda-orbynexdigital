CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity_delta INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'admin',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.stock_reservations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_movements_quantity_delta_not_zero CHECK (quantity_delta <> 0),
  CONSTRAINT stock_movements_stock_after_nonnegative CHECK (stock_after >= 0),
  CONSTRAINT stock_movements_type_check CHECK (
    movement_type IN (
      'manual_adjustment',
      'manual_return',
      'manual_correction',
      'flow_sale',
      'reservation_created',
      'reservation_released'
    )
  )
);

CREATE INDEX IF NOT EXISTS stock_movements_product_id_created_at_idx
  ON public.stock_movements (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx
  ON public.stock_movements (created_at DESC);

CREATE INDEX IF NOT EXISTS stock_movements_created_by_idx
  ON public.stock_movements (created_by);

CREATE INDEX IF NOT EXISTS stock_movements_order_id_idx
  ON public.stock_movements (order_id);

CREATE INDEX IF NOT EXISTS stock_movements_reservation_id_idx
  ON public.stock_movements (reservation_id);

GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admins can insert stock movements" ON public.stock_movements;

CREATE POLICY "Admins can view stock movements"
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert stock movements"
  ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND source = 'admin'
    AND movement_type IN ('manual_adjustment', 'manual_return', 'manual_correction')
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.adjust_product_stock_admin(
  p_product_id UUID,
  p_quantity_delta INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_movement_type TEXT DEFAULT 'manual_adjustment'
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_product public.products;
  v_updated_product public.products;
  v_stock_after INTEGER;
BEGIN
  IF p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'quantity_delta must be different from zero';
  END IF;

  IF p_movement_type NOT IN ('manual_adjustment', 'manual_return', 'manual_correction') THEN
    RAISE EXCEPTION 'invalid manual movement type: %', p_movement_type;
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  v_stock_after := v_product.stock_quantity + p_quantity_delta;

  IF v_stock_after < 0 THEN
    RAISE EXCEPTION 'stock cannot be negative';
  END IF;

  UPDATE public.products
  SET
    stock_quantity = v_stock_after,
    track_inventory = true
  WHERE id = p_product_id
  RETURNING * INTO v_updated_product;

  INSERT INTO public.stock_movements (
    product_id,
    movement_type,
    quantity_delta,
    stock_before,
    stock_after,
    reason,
    source,
    created_by
  )
  VALUES (
    p_product_id,
    p_movement_type,
    p_quantity_delta,
    v_product.stock_quantity,
    v_stock_after,
    NULLIF(BTRIM(p_reason), ''),
    'admin',
    (SELECT auth.uid())
  );

  RETURN v_updated_product;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.adjust_product_stock_admin(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_product_stock_admin(UUID, INTEGER, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock_admin(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock_admin(UUID, INTEGER, TEXT, TEXT) TO service_role;
