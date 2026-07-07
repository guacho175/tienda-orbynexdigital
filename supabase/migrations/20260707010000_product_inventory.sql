-- Product inventory: per-product stock controls and atomic paid-order stock decrement.
-- Existing products keep track_inventory = false so the public catalog behavior stays unchanged.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS out_of_stock_behavior TEXT NOT NULL DEFAULT 'show_sold_out';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_quantity_nonnegative_check,
  DROP CONSTRAINT IF EXISTS products_low_stock_threshold_nonnegative_check,
  DROP CONSTRAINT IF EXISTS products_out_of_stock_behavior_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_stock_quantity_nonnegative_check CHECK (stock_quantity >= 0),
  ADD CONSTRAINT products_low_stock_threshold_nonnegative_check CHECK (low_stock_threshold >= 0),
  ADD CONSTRAINT products_out_of_stock_behavior_check CHECK (
    out_of_stock_behavior IN ('show_sold_out', 'hide_product')
  );

CREATE INDEX IF NOT EXISTS products_inventory_public_idx
  ON public.products (
    is_active,
    track_inventory,
    stock_quantity,
    allow_backorder,
    out_of_stock_behavior,
    display_order
  );

CREATE OR REPLACE FUNCTION public.confirm_order_and_decrement_stock(
  p_order_id UUID,
  p_flow_status JSONB,
  p_flow_status_text TEXT DEFAULT '2'
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF v_order.status = 'paid' THEN
    success := true;
    message := 'Order already paid';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_order.status IN ('failed', 'cancelled', 'expired') THEN
    success := false;
    message := 'Order already has terminal status: ' || v_order.status;
    RETURN NEXT;
    RETURN;
  END IF;

  FOR v_item IN
    SELECT
      oi.product_id,
      oi.product_name,
      oi.quantity,
      p.stock_quantity,
      p.track_inventory,
      p.allow_backorder
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
    FOR UPDATE OF p
  LOOP
    IF v_item.track_inventory
      AND NOT v_item.allow_backorder
      AND v_item.stock_quantity < v_item.quantity
    THEN
      UPDATE public.orders
      SET
        status = 'failed',
        flow_status = p_flow_status_text,
        flow_raw_status = jsonb_build_object(
          'source', 'payment/getStatus',
          'flowStatus', p_flow_status,
          'inventory_error', format(
            'Insufficient stock for %s. Available: %s.',
            v_item.product_name,
            v_item.stock_quantity
          )
        ),
        confirmed_at = v_now,
        failed_at = v_now
      WHERE id = p_order_id;

      success := false;
      message := format(
        'El producto %s no tiene stock suficiente. Stock disponible: %s.',
        v_item.product_name,
        v_item.stock_quantity
      );
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;

  UPDATE public.products p
  SET stock_quantity = GREATEST(p.stock_quantity - oi.quantity, 0)
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id
    AND p.track_inventory = true;

  UPDATE public.orders
  SET
    status = 'paid',
    flow_status = p_flow_status_text,
    flow_raw_status = p_flow_status,
    paid_at = COALESCE(paid_at, v_now),
    confirmed_at = v_now
  WHERE id = p_order_id;

  success := true;
  message := 'Order confirmed and stock decremented';
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_order_and_decrement_stock(UUID, JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_decrement_stock(UUID, JSONB, TEXT)
  TO service_role;
