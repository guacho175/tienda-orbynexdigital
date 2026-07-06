-- Flow API phase 1: local order tables and read-only client RLS.
-- This prepares the database only. It does not create Flow endpoints,
-- webhooks, frontend checkout changes, or secrets.

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_order TEXT NOT NULL UNIQUE,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  currency TEXT NOT NULL DEFAULT 'CLP',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NULL,
  customer_comment TEXT NULL,
  flow_token TEXT NULL UNIQUE,
  flow_url TEXT NULL,
  flow_status TEXT NULL,
  flow_raw_status JSONB NULL,
  paid_at TIMESTAMPTZ NULL,
  confirmed_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  public_lookup_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check CHECK (
    status IN ('pending', 'redirected', 'paid', 'failed', 'cancelled', 'expired')
  ),
  CONSTRAINT orders_currency_check CHECK (currency = 'CLP'),
  CONSTRAINT orders_subtotal_nonnegative_check CHECK (subtotal >= 0),
  CONSTRAINT orders_discount_total_nonnegative_check CHECK (discount_total >= 0),
  CONSTRAINT orders_shipping_total_nonnegative_check CHECK (shipping_total >= 0),
  CONSTRAINT orders_tax_total_nonnegative_check CHECK (tax_total >= 0),
  CONSTRAINT orders_total_nonnegative_check CHECK (total >= 0),
  CONSTRAINT orders_customer_email_basic_check CHECK (
    customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT order_items_quantity_positive_check CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_nonnegative_check CHECK (unit_price >= 0),
  CONSTRAINT order_items_subtotal_nonnegative_check CHECK (subtotal >= 0),
  CONSTRAINT order_items_currency_check CHECK (currency = 'CLP'),
  CONSTRAINT order_items_subtotal_matches_quantity_check CHECK (subtotal = unit_price * quantity)
);

-- Keep direct client writes closed. Future trusted Vercel Functions should use
-- service_role server-side and still validate cart/prices before writing.
REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.order_items FROM anon, authenticated;

GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS orders_commerce_order_idx
  ON public.orders (commerce_order);
CREATE INDEX IF NOT EXISTS orders_user_id_idx
  ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_flow_token_idx
  ON public.orders (flow_token);
CREATE INDEX IF NOT EXISTS orders_public_lookup_token_idx
  ON public.orders (public_lookup_token);
CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx
  ON public.order_items (product_id);
