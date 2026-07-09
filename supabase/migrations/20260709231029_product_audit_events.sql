CREATE TABLE IF NOT EXISTS public.product_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'product_update',
  before_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  changed_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_audit_events_product_id_created_at_idx
  ON public.product_audit_events (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS product_audit_events_created_at_idx
  ON public.product_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS product_audit_events_created_by_idx
  ON public.product_audit_events (created_by);

GRANT SELECT, INSERT ON public.product_audit_events TO authenticated;
GRANT ALL ON public.product_audit_events TO service_role;

ALTER TABLE public.product_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view product audit events" ON public.product_audit_events;
DROP POLICY IF EXISTS "Admins can insert product audit events" ON public.product_audit_events;

CREATE POLICY "Admins can view product audit events"
  ON public.product_audit_events
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

CREATE POLICY "Admins can insert product audit events"
  ON public.product_audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );
