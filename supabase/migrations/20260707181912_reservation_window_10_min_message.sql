-- Set Flow stock reservation window to 10 minutes and return a clearer
-- customer-facing message when stock is temporarily reserved by another order.

CREATE OR REPLACE FUNCTION public.create_order_with_stock_reservation(
  p_user_id UUID,
  p_commerce_order TEXT,
  p_customer JSONB,
  p_items JSONB,
  p_reservation_minutes INTEGER DEFAULT 10
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

  -- Keep production behavior at a fixed 10-minute reservation window even if
  -- an older deployment sends a longer explicit value.
  p_reservation_minutes := 10;

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
        IF v_product.stock_quantity > 0 AND v_product.reserved_quantity > 0 THEN
          RAISE EXCEPTION 'Este producto esta reservado temporalmente por otra compra. Si no se completa el pago, podria volver a estar disponible en unos minutos.';
        END IF;

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

  INSERT INTO public.orders AS inserted_order (
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
  RETURNING inserted_order.id, inserted_order.public_lookup_token
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

REVOKE EXECUTE ON FUNCTION public.create_order_with_stock_reservation(UUID, TEXT, JSONB, JSONB, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock_reservation(UUID, TEXT, JSONB, JSONB, INTEGER)
  TO service_role;
