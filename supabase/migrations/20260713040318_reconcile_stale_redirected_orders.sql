-- Reconcile historical Flow sandbox orders that stayed in `redirected`.
--
-- Context:
-- - These rows were created before the current reservation window started
--   writing `expires_at` / `stock_reservations`.
-- - Read-only diagnostics on 2026-07-13 showed all target rows had no
--   stock_reservations, no paid_at, no failed_at, and Flow getStatus returned
--   401 with the local sandbox credentials, so no payment evidence could be
--   confirmed from Flow.
-- - The update is intentionally ID-scoped and uses the existing release RPC so
--   terminal paid orders remain protected by the current business rules.

DO $$
DECLARE
  v_order RECORD;
  v_reconciled_count INTEGER := 0;
BEGIN
  FOR v_order IN
    SELECT o.id
    FROM public.orders o
    JOIN (
      VALUES
        ('5d9d4995-e2d2-4e20-8f70-a840c9ec2e79'::uuid),
        ('7efd7de7-c41d-47f5-852c-a94d23ee540c'::uuid),
        ('27df4034-427d-420c-8f4e-b3578d7e6704'::uuid),
        ('e12b55f2-ca5d-41bc-b2f1-4b46e309b9d4'::uuid),
        ('854dc3bb-9419-45d1-b566-76a4eacc1660'::uuid),
        ('60995d99-6da2-4531-95b7-8d0740b7d3a8'::uuid),
        ('c08d60db-773a-46f1-90c3-ecf60e4d34fa'::uuid),
        ('f20b6f6f-72a6-47ae-8b9e-f5e3333a4adf'::uuid)
    ) AS target(id) ON target.id = o.id
    WHERE o.status = 'redirected'
      AND o.paid_at IS NULL
      AND o.failed_at IS NULL
      AND o.expires_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.stock_reservations sr
        WHERE sr.order_id = o.id
      )
  LOOP
    PERFORM public.release_order_stock_reservations(
      v_order.id,
      'expired',
      jsonb_build_object(
        'source', 'historical_redirected_reconciliation',
        'reason', 'stale redirected order without stock reservations',
        'flow_check', 'payment/getStatus returned 401 with local sandbox credentials before reconciliation',
        'reconciled_at', now()
      ),
      'historical_expired'
    );

    v_reconciled_count := v_reconciled_count + 1;
  END LOOP;

  RAISE NOTICE 'Reconciled % historical redirected orders', v_reconciled_count;
END $$;
