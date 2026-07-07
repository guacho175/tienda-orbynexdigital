-- Advanced inventory phases 1-5: order states, stock reservations and Flow capture.
-- Critical stock decisions stay in Postgres RPCs invoked only with service_role.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'pending',
      'stock_reserved',
      'redirected',
      'paid',
      'failed',
      'cancelled',
      'expired',
      'reservation_expired',
      'stock_conflict',
      'requires_manual_review'
    )
  );

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ NULL,
  released_at TIMESTAMPTZ NULL,
  CONSTRAINT stock_reservations_quantity_positive_check CHECK (quantity > 0),
  CONSTRAINT stock_reservations_status_check CHECK (
    status IN ('active', 'confirmed', 'released', 'expired')
  )
);

CREATE INDEX IF NOT EXISTS stock_reservations_product_status_idx
  ON public.stock_reservations (product_id, status);
CREATE INDEX IF NOT EXISTS stock_reservations_order_id_idx
  ON public.stock_reservations (order_id);
CREATE INDEX IF NOT EXISTS stock_reservations_expires_at_idx
  ON public.stock_reservations (expires_at);

REVOKE ALL ON public.stock_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.stock_reservations TO service_role;

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.expire_stock_reservations()
RETURNS TABLE(expired_reservations INTEGER, expired_orders INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_reservations INTEGER := 0;
  v_expired_orders INTEGER := 0;
BEGIN
  WITH expired AS (
    UPDATE public.stock_reservations
    SET
      status = 'expired',
      released_at = now()
    WHERE status = 'active'
      AND expires_at <= now()
    RETURNING order_id
  ),
  updated_orders AS (
    UPDATE public.orders o
    SET
      status = 'reservation_expired',
      flow_raw_status = COALESCE(o.flow_raw_status, '{}'::jsonb)
        || jsonb_build_object(
          'reservation_status',
          'expired',
          'reservation_expired_at',
          now()
        )
    WHERE o.id IN (SELECT DISTINCT order_id FROM expired)
      AND o.status IN ('pending', 'stock_reserved', 'redirected')
    RETURNING o.id
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM expired),
    (SELECT COUNT(*)::INTEGER FROM updated_orders)
  INTO v_expired_reservations, v_expired_orders;

  expired_reservations := v_expired_reservations;
  expired_orders := v_expired_orders;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_with_stock_reservation(
  p_user_id UUID,
  p_commerce_order TEXT,
  p_customer JSONB,
  p_items JSONB,
  p_reservation_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(
  order_id UUID,
  commerce_order TEXT,
  public_lookup_token UUID,
  subtotal NUMERIC,
  total NUMERIC,
  currency TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_expires_at TIMESTAMPTZ;
  v_requested_count INTEGER := 0;
  v_processed_count INTEGER := 0;
  v_has_reservations BOOLEAN := false;
  v_subtotal NUMERIC(12,2) := 0;
  v_order_id UUID;
  v_public_lookup_token UUID;
  v_currency TEXT := 'CLP';
  v_product RECORD;
  v_available_quantity INTEGER;
  v_unit_price NUMERIC(12,2);
  v_item_subtotal NUMERIC(12,2);
BEGIN
  PERFORM public.expire_stock_reservations();

  IF p_commerce_order IS NULL OR btrim(p_commerce_order) = '' THEN
    RAISE EXCEPTION 'commerce_order is required';
  END IF;

  IF p_reservation_minutes IS NULL OR p_reservation_minutes < 1 OR p_reservation_minutes > 120 THEN
    RAISE EXCEPTION 'reservation_minutes must be between 1 and 120';
  END IF;

  IF jsonb_typeof(p_customer) <> 'object'
    OR COALESCE(p_customer->>'name', '') = ''
    OR COALESCE(p_customer->>'email', '') = ''
  THEN
    RAISE EXCEPTION 'customer name and email are required';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) item
    WHERE jsonb_typeof(item) <> 'object'
      OR NOT item ? 'productId'
      OR NOT item ? 'quantity'
      OR (item->>'quantity') !~ '^[0-9]+$'
      OR (item->>'quantity')::INTEGER < 1
      OR (item->>'quantity')::INTEGER > 99
  ) THEN
    RAISE EXCEPTION 'items must contain productId and quantity between 1 and 99';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_requested_count
  FROM (
    SELECT DISTINCT (item->>'productId')::UUID AS product_id
    FROM jsonb_array_elements(p_items) item
  ) requested;

  v_expires_at := v_now + make_interval(mins => p_reservation_minutes);

  -- Acquire product locks in a standalone statement. In READ COMMITTED, this
  -- makes the later reservation SUM run after waiting transactions commit.
  FOR v_product IN
    WITH input_items AS (
      SELECT
        (item->>'productId')::UUID AS product_id,
        (item->>'quantity')::INTEGER AS quantity
      FROM jsonb_array_elements(p_items) item
    ),
    requested AS (
      SELECT product_id, SUM(quantity)::INTEGER AS quantity
      FROM input_items
      GROUP BY product_id
    )
    SELECT p.id
    FROM requested
    JOIN public.products p ON p.id = requested.product_id
    ORDER BY p.id
    FOR UPDATE OF p
  LOOP
    NULL;
  END LOOP;

  FOR v_product IN
    WITH input_items AS (
      SELECT
        (item->>'productId')::UUID AS product_id,
        (item->>'quantity')::INTEGER AS quantity
      FROM jsonb_array_elements(p_items) item
    ),
    requested AS (
      SELECT product_id, SUM(quantity)::INTEGER AS quantity
      FROM input_items
      GROUP BY product_id
    )
    SELECT
      p.*,
      requested.quantity AS requested_quantity,
      COALESCE((
        SELECT SUM(sr.quantity)::INTEGER
        FROM public.stock_reservations sr
        WHERE sr.product_id = p.id
          AND sr.status = 'active'
          AND sr.expires_at > v_now
      ), 0) AS reserved_quantity
    FROM requested
    JOIN public.products p ON p.id = requested.product_id
    ORDER BY p.id
  LOOP
    v_processed_count := v_processed_count + 1;

    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product % is not active', v_product.name;
    END IF;

    IF v_product.availability = 'out_of_stock' THEN
      RAISE EXCEPTION '% esta agotado.', v_product.name;
    END IF;

    IF v_product.currency <> 'CLP' THEN
      RAISE EXCEPTION 'Only CLP products are supported for Flow checkout';
    END IF;

    v_unit_price := ROUND(v_product.price::NUMERIC, 2);
    IF v_unit_price < 0 THEN
      RAISE EXCEPTION 'Invalid product price for %', v_product.name;
    END IF;

    v_item_subtotal := ROUND(v_unit_price * v_product.requested_quantity, 2);
    v_subtotal := ROUND(v_subtotal + v_item_subtotal, 2);

    IF v_product.track_inventory AND NOT v_product.allow_backorder THEN
      v_available_quantity := v_product.stock_quantity - v_product.reserved_quantity;

      IF v_available_quantity < v_product.requested_quantity THEN
        RAISE EXCEPTION '% no tiene stock suficiente. Stock disponible: %.',
          v_product.name,
          GREATEST(v_available_quantity, 0);
      END IF;

      v_has_reservations := true;
    END IF;
  END LOOP;

  IF v_processed_count <> v_requested_count THEN
    RAISE EXCEPTION 'One or more products do not exist';
  END IF;

  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'Order total must be greater than zero';
  END IF;

  IF v_subtotal <> FLOOR(v_subtotal) THEN
    RAISE EXCEPTION 'CLP Flow payments require an integer amount';
  END IF;

  INSERT INTO public.orders (
    commerce_order,
    user_id,
    status,
    currency,
    subtotal,
    discount_total,
    shipping_total,
    tax_total,
    total,
    customer_name,
    customer_email,
    customer_phone,
    customer_comment,
    expires_at
  )
  VALUES (
    p_commerce_order,
    p_user_id,
    CASE WHEN v_has_reservations THEN 'stock_reserved' ELSE 'pending' END,
    v_currency,
    v_subtotal,
    0,
    0,
    0,
    v_subtotal,
    p_customer->>'name',
    p_customer->>'email',
    NULLIF(p_customer->>'phone', ''),
    NULLIF(p_customer->>'comment', ''),
    CASE WHEN v_has_reservations THEN v_expires_at ELSE NULL END
  )
  RETURNING id, public_lookup_token
  INTO v_order_id, v_public_lookup_token;

  FOR v_product IN
    WITH input_items AS (
      SELECT
        (item->>'productId')::UUID AS product_id,
        (item->>'quantity')::INTEGER AS quantity
      FROM jsonb_array_elements(p_items) item
    ),
    requested AS (
      SELECT product_id, SUM(quantity)::INTEGER AS quantity
      FROM input_items
      GROUP BY product_id
    )
    SELECT p.*, requested.quantity AS requested_quantity
    FROM requested
    JOIN public.products p ON p.id = requested.product_id
    ORDER BY p.id
  LOOP
    v_unit_price := ROUND(v_product.price::NUMERIC, 2);
    v_item_subtotal := ROUND(v_unit_price * v_product.requested_quantity, 2);

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_slug,
      unit_price,
      quantity,
      subtotal,
      currency
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.slug,
      v_unit_price,
      v_product.requested_quantity,
      v_item_subtotal,
      v_product.currency
    );

    IF v_product.track_inventory AND NOT v_product.allow_backorder THEN
      INSERT INTO public.stock_reservations (
        order_id,
        product_id,
        quantity,
        status,
        expires_at
      )
      VALUES (
        v_order_id,
        v_product.id,
        v_product.requested_quantity,
        'active',
        v_expires_at
      );
    END IF;
  END LOOP;

  order_id := v_order_id;
  commerce_order := p_commerce_order;
  public_lookup_token := v_public_lookup_token;
  subtotal := v_subtotal;
  total := v_subtotal;
  currency := v_currency;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_order_stock_reservations(
  p_order_id UUID,
  p_order_status TEXT DEFAULT NULL,
  p_flow_status JSONB DEFAULT NULL,
  p_flow_status_text TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, released_count INTEGER, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_released_count INTEGER := 0;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF p_order_status IS NOT NULL
    AND p_order_status NOT IN ('failed', 'cancelled', 'expired', 'reservation_expired')
  THEN
    RAISE EXCEPTION 'Invalid release order status: %', p_order_status;
  END IF;

  WITH released AS (
    UPDATE public.stock_reservations sr
    SET
      status = 'released',
      released_at = v_now
    WHERE sr.order_id = p_order_id
      AND sr.status = 'active'
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER
  INTO v_released_count
  FROM released;

  IF v_order.status <> 'paid' THEN
    UPDATE public.orders
    SET
      status = COALESCE(p_order_status, public.orders.status),
      flow_status = COALESCE(p_flow_status_text, public.orders.flow_status),
      flow_raw_status = CASE
        WHEN p_flow_status IS NULL THEN public.orders.flow_raw_status
        ELSE COALESCE(public.orders.flow_raw_status, '{}'::jsonb) || p_flow_status
      END,
      confirmed_at = CASE
        WHEN p_order_status IN ('failed', 'cancelled', 'expired') THEN v_now
        ELSE public.orders.confirmed_at
      END,
      failed_at = CASE
        WHEN p_order_status = 'failed' THEN v_now
        ELSE public.orders.failed_at
      END
    WHERE id = p_order_id;
  END IF;

  success := true;
  message := 'Order reservations released';
  released_count := v_released_count;
  status := COALESCE(p_order_status, v_order.status);
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_order_payment_and_capture_stock(
  p_order_id UUID,
  p_flow_status JSONB,
  p_flow_status_text TEXT DEFAULT '2'
)
RETURNS TABLE(success BOOLEAN, message TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_reservation_count INTEGER := 0;
  v_active_valid_count INTEGER := 0;
  v_problem_reservation_count INTEGER := 0;
  v_conflict_message TEXT;
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
    status := 'paid';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_order.status IN ('failed', 'cancelled', 'expired', 'stock_conflict', 'requires_manual_review') THEN
    success := false;
    message := 'Order already has terminal status: ' || v_order.status;
    status := v_order.status;
    RETURN NEXT;
    RETURN;
  END IF;

  PERFORM 1
  FROM public.stock_reservations
  WHERE order_id = p_order_id
  FOR UPDATE;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (
      WHERE stock_reservations.status = 'active'
        AND stock_reservations.expires_at > v_now
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE stock_reservations.status <> 'active'
        OR stock_reservations.expires_at <= v_now
    )::INTEGER
  INTO v_reservation_count, v_active_valid_count, v_problem_reservation_count
  FROM public.stock_reservations
  WHERE order_id = p_order_id;

  IF v_reservation_count > 0 AND v_problem_reservation_count > 0 THEN
    UPDATE public.stock_reservations sr
    SET
      status = 'expired',
      released_at = COALESCE(sr.released_at, v_now)
    WHERE sr.order_id = p_order_id
      AND sr.status = 'active'
      AND sr.expires_at <= v_now;

    UPDATE public.orders
    SET
      status = 'requires_manual_review',
      flow_status = p_flow_status_text,
      flow_raw_status = jsonb_build_object(
        'source', 'payment/getStatus',
        'flowStatus', p_flow_status,
        'reservation_error', 'Payment confirmed after reservation was no longer active'
      ),
      paid_at = COALESCE(paid_at, v_now),
      confirmed_at = v_now
    WHERE id = p_order_id;

    success := false;
    message := 'Payment confirmed but stock reservation requires manual review';
    status := 'requires_manual_review';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_reservation_count > 0 AND v_active_valid_count <> v_reservation_count THEN
    UPDATE public.orders
    SET
      status = 'requires_manual_review',
      flow_status = p_flow_status_text,
      flow_raw_status = jsonb_build_object(
        'source', 'payment/getStatus',
        'flowStatus', p_flow_status,
        'reservation_error', 'Reservation state mismatch'
      ),
      paid_at = COALESCE(paid_at, v_now),
      confirmed_at = v_now
    WHERE id = p_order_id;

    success := false;
    message := 'Reservation state mismatch';
    status := 'requires_manual_review';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_active_valid_count > 0 THEN
    PERFORM 1
    FROM public.products p
    JOIN public.stock_reservations sr ON sr.product_id = p.id
    WHERE sr.order_id = p_order_id
      AND sr.status = 'active'
      AND sr.expires_at > v_now
    FOR UPDATE OF p;

    SELECT string_agg(
      format('%s stock disponible: %s, reservado: %s', p.name, p.stock_quantity, sr.quantity),
      '; '
    )
    INTO v_conflict_message
    FROM public.stock_reservations sr
    JOIN public.products p ON p.id = sr.product_id
    WHERE sr.order_id = p_order_id
      AND sr.status = 'active'
      AND sr.expires_at > v_now
      AND p.stock_quantity < sr.quantity;

    IF v_conflict_message IS NOT NULL THEN
      UPDATE public.orders
      SET
        status = 'stock_conflict',
        flow_status = p_flow_status_text,
        flow_raw_status = jsonb_build_object(
          'source', 'payment/getStatus',
          'flowStatus', p_flow_status,
          'inventory_error', v_conflict_message
        ),
        paid_at = COALESCE(paid_at, v_now),
        confirmed_at = v_now
      WHERE id = p_order_id;

      success := false;
      message := 'Payment confirmed but stock cannot be captured without going negative';
      status := 'stock_conflict';
      RETURN NEXT;
      RETURN;
    END IF;

    UPDATE public.products p
    SET stock_quantity = p.stock_quantity - reserved.quantity
    FROM (
      SELECT product_id, SUM(quantity)::INTEGER AS quantity
      FROM public.stock_reservations
      WHERE order_id = p_order_id
        AND stock_reservations.status = 'active'
        AND expires_at > v_now
      GROUP BY product_id
    ) reserved
    WHERE p.id = reserved.product_id
      AND p.track_inventory = true
      AND p.allow_backorder = false;

    UPDATE public.stock_reservations sr
    SET
      status = 'confirmed',
      confirmed_at = v_now
    WHERE sr.order_id = p_order_id
      AND sr.status = 'active'
      AND sr.expires_at > v_now;
  END IF;

  UPDATE public.orders
  SET
    status = 'paid',
    flow_status = p_flow_status_text,
    flow_raw_status = p_flow_status,
    paid_at = COALESCE(paid_at, v_now),
    confirmed_at = v_now
  WHERE id = p_order_id;

  success := true;
  message := CASE
    WHEN v_active_valid_count > 0 THEN 'Order confirmed and stock reservation captured'
    ELSE 'Order confirmed without stock reservation'
  END;
  status := 'paid';
  RETURN NEXT;
END;
$$;

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
BEGIN
  RETURN QUERY
  SELECT result.success, result.message
  FROM public.confirm_order_payment_and_capture_stock(
    p_order_id,
    p_flow_status,
    p_flow_status_text
  ) result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stock_reservations()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order_with_stock_reservation(UUID, TEXT, JSONB, JSONB, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_order_stock_reservations(UUID, TEXT, JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_order_payment_and_capture_stock(UUID, JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_order_and_decrement_stock(UUID, JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.expire_stock_reservations()
  TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock_reservation(UUID, TEXT, JSONB, JSONB, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.release_order_stock_reservations(UUID, TEXT, JSONB, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment_and_capture_stock(UUID, JSONB, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_decrement_stock(UUID, JSONB, TEXT)
  TO service_role;
