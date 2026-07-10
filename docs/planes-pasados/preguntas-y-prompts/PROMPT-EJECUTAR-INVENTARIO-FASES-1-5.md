# Prompt cerrado: ejecutar inventario avanzado fases 1 a 5

Usa este prompt en Codex para implementar las fases 1 a 5 del inventario avanzado.

```text
Actua como arquitecto full-stack senior especializado en e-commerce, inventario, Supabase/PostgreSQL, RLS, transacciones SQL, React, TanStack Start, Vercel Functions y Flow API.

Objetivo:
Implementar inventario avanzado hasta Fase 5 del documento:
- docs/PLAN-INVENTARIO-AVANZADO.md

Alcance exacto:
Implementar SOLO Fases 1 a 5:

1. Estados de orden mas expresivos.
2. Tabla stock_reservations.
3. RPC atomico para crear orden y reservar stock.
4. Confirmacion Flow usando reservas.
5. Expiracion automatica/opportunistic de reservas.

No implementar por ahora:
- inventory_movements.
- ajustes manuales admin.
- notificaciones bajo stock.
- cambios visuales grandes.
- refactor global.
- cambios en auth.
- cambios inseguros de RLS.
- service_role en frontend.
- cambios en src/routes/_authenticated/route.tsx.
- force push, rebase, amend o squash de commits publicados.

Contexto actual:
- Proyecto: TanStack Start + React + Supabase + Vercel Functions + Flow API.
- Ya existe inventario basico documentado en:
  - docs/INVENTARIO-PRODUCTOS.md
- Ya existe plan avanzado en:
  - docs/PLAN-INVENTARIO-AVANZADO.md
- Ya existe migracion:
  - supabase/migrations/20260707010000_product_inventory.sql
- Ya existe RPC:
  - public.confirm_order_and_decrement_stock(order_id, flow_status, flow_status_text)
- Ya existe checkout Flow en:
  - api/flow/create-payment.ts
  - api/flow/confirm.ts
  - api/flow/order-status.ts
- Helpers Flow/backend:
  - src/server/flow/checkout.ts
  - src/server/flow/supabase.ts
  - src/server/flow/flow.ts
  - src/server/flow/http.ts
  - src/server/flow/env.ts
- Servicios/productos:
  - src/services/products.service.ts
  - src/utils/inventory.ts
- UI que valida stock:
  - src/routes/carrito.tsx
  - src/routes/checkout.tsx
  - src/routes/producto.$slug.tsx
  - src/components/product/ProductCard.tsx
  - src/components/admin/ProductForm.tsx
  - src/routes/_authenticated/admin.index.tsx

Reglas obligatorias:
1. Antes de editar, audita:
   - supabase/migrations/*
   - api/flow/create-payment.ts
   - api/flow/confirm.ts
   - src/server/flow/checkout.ts
   - src/server/flow/supabase.ts
   - src/types/product.ts
   - src/types/cart.ts
   - src/integrations/supabase/types.ts
   - docs/INVENTARIO-PRODUCTOS.md
   - docs/PLAN-INVENTARIO-AVANZADO.md
2. No romper productos existentes.
3. Productos con track_inventory = false deben seguir funcionando igual.
4. No descontar stock definitivo al iniciar pago.
5. Al crear pago Flow, reservar stock temporalmente si track_inventory = true y allow_backorder = false.
6. Al confirmar pago exitoso, convertir reserva en venta y descontar stock definitivo.
7. Si Flow falla/cancela, liberar reserva.
8. Si la reserva expiro antes de confirmar pago exitoso, NO descontar stock automaticamente; marcar estado operativo claro.
9. Toda logica critica debe vivir en SQL/RPC backend, no en frontend.
10. Mantener idempotencia ante notificaciones duplicadas de Flow.

Implementacion requerida:

A. Crear nueva migracion SQL segura.

Agregar estados a orders.status:
- stock_reserved
- reservation_expired
- stock_conflict
- requires_manual_review

Si el constraint actual se llama orders_status_check, reemplazarlo de forma segura sin borrar datos.

Crear tabla public.stock_reservations:
- id uuid primary key default gen_random_uuid()
- order_id uuid not null references public.orders(id) on delete cascade
- product_id uuid not null references public.products(id)
- quantity integer not null
- status text not null default 'active'
- expires_at timestamptz not null
- created_at timestamptz not null default now()
- confirmed_at timestamptz null
- released_at timestamptz null

Constraints:
- quantity > 0
- status in ('active', 'confirmed', 'released', 'expired')

Indices:
- stock_reservations_product_status_idx on (product_id, status)
- stock_reservations_order_id_idx on (order_id)
- stock_reservations_expires_at_idx on (expires_at)

Grants/RLS:
- REVOKE ALL FROM anon, authenticated.
- GRANT ALL TO service_role.
- ENABLE RLS.
- Si se agrega SELECT a authenticated, que sea solo orden propia/admin y sin escrituras cliente. Preferir cerrar cliente en esta fase.

B. Crear RPC public.expire_stock_reservations().

Debe:
- Buscar reservas active con expires_at <= now().
- Marcarlas expired.
- Marcar ordenes asociadas como reservation_expired solo si siguen en pending, stock_reserved o redirected.
- Ser idempotente.
- SECURITY DEFINER.
- SET search_path = public.
- EXECUTE solo service_role.

C. Crear RPC public.create_order_with_stock_reservation(...).

Firma sugerida, ajustable si el tipado del proyecto lo requiere:

public.create_order_with_stock_reservation(
  p_user_id uuid,
  p_commerce_order text,
  p_customer jsonb,
  p_items jsonb,
  p_reservation_minutes integer default 15
)

Debe retornar al menos:
- order_id
- commerce_order
- public_lookup_token
- subtotal
- total
- currency

Debe:
- Ejecutar expire_stock_reservations() al inicio.
- Validar que p_items sea array de productId/quantity.
- Bloquear productos con FOR UPDATE.
- Recalcular precio, currency, nombre, slug desde products.
- Validar is_active.
- Validar availability != 'out_of_stock'.
- Validar CLP.
- Para track_inventory = true y allow_backorder = false:
  - calcular reservas activas no expiradas por producto.
  - validar stock_quantity - reserved_quantity >= requested_quantity.
  - crear reserva active con expires_at = now() + p_reservation_minutes.
- Para track_inventory = false o allow_backorder = true:
  - no crear reserva.
- Crear orders con status stock_reserved si hubo reservas, o pending/redirected segun convenga antes de Flow.
- Crear order_items con snapshot actual.
- No llamar Flow desde SQL.
- No descontar stock_quantity.
- Si falla validacion, abortar toda la transaccion.

D. Ajustar api/flow/create-payment.ts.

Debe:
- Mantener validacion Zod del body.
- Mantener auth opcional actual.
- Agregar llamada al RPC create_order_with_stock_reservation.
- Dejar de crear orders/order_items manualmente en TS si el RPC ya lo hace.
- Llamar Flow solo despues de que el RPC reserve/cree orden.
- Si Flow payment/create falla:
  - liberar o expirar reservas de esa orden mediante RPC/update seguro.
  - marcar orden failed.
- Al guardar respuesta Flow:
  - status = redirected.
  - flow_token, flow_url, flow_status, flow_raw_status.
- Devolver redirectUrl, commerceOrder, publicLookupToken.

E. Crear o ajustar RPC para confirmacion con reservas.

Reemplazar o extender el RPC actual con uno nuevo:

public.confirm_order_payment_and_capture_stock(
  p_order_id uuid,
  p_flow_status jsonb,
  p_flow_status_text text
)

Debe:
- Bloquear orden FOR UPDATE.
- Ser idempotente si orden ya esta paid.
- Si orden esta failed/cancelled/expired/reservation_expired/stock_conflict/requires_manual_review, retornar estado claro.
- Bloquear reservas de la orden FOR UPDATE.
- Si hay reservas active no expiradas:
  - descontar products.stock_quantity -= reservation.quantity
  - marcar reservas confirmed
  - marcar orden paid
- Si hay reservas vencidas:
  - no descontar stock automaticamente
  - marcar orden requires_manual_review o stock_conflict
  - conservar paid_at si Flow pago exitoso
  - dejar detalle en flow_raw_status
- Si no hay reservas porque productos no controlan inventario o permiten backorder:
  - marcar paid sin descontar stock para track_inventory false
  - para allow_backorder true, permitir paid y no impedir por stock
- Nunca dejar stock negativo.

F. Ajustar api/flow/confirm.ts.

Debe:
- Seguir verificando Flow server-side con payment/getStatus.
- Mantener validateFlowStatusMatchesOrder.
- Si localStatus === paid:
  - llamar confirm_order_payment_and_capture_stock.
  - responder 200 a Flow incluso si hay conflicto operativo ya registrado, para evitar retries infinitos.
- Si localStatus es failed/cancelled:
  - liberar reservas activas de la orden.
- Mantener idempotencia.

G. Actualizar tipado.

Actualizar:
- src/server/flow/supabase.ts
- src/integrations/supabase/types.ts
- cualquier tipo de status usado en UI si aplica.

H. UI minima.

No hacer rediseño.

Solo ajustar mensajes si aparece:
- reservation_expired
- stock_conflict
- requires_manual_review

En checkout/resultado, mostrar mensaje claro:
- Pago recibido, pero el stock requiere revision manual.
- Tu reserva expiro antes de confirmar el pago.
- Contactaremos al cliente para resolver.

I. Documentacion.

Actualizar:
- docs/INVENTARIO-PRODUCTOS.md
- docs/PLAN-INVENTARIO-AVANZADO.md

Crear:
- docs/INVENTARIO-RESERVAS-STOCK.md

Debe documentar:
- stock_quantity vs reservas activas.
- flujo create-payment.
- flujo confirm.
- expiracion de reservas.
- estados nuevos.
- riesgo resuelto.
- casos pendientes.

Validacion obligatoria:
1. npm run build
2. npm run lint
3. Si lint global falla por CRLF preexistente, ejecutar ESLint acotado a archivos tocados.

Pruebas manuales esperadas:
1. Producto sin control de stock sigue comprable.
2. Producto con stock 5 reserva al iniciar Flow.
3. Segundo checkout no puede reservar mas de stock disponible descontando reservas activas.
4. Si Flow falla, reserva se libera.
5. Si Flow confirma paid antes de expirar reserva, stock_quantity descuenta.
6. Confirm duplicado de Flow no descuenta dos veces.
7. Reserva vencida pasa a reservation_expired.
8. Pago exitoso con reserva vencida queda en requires_manual_review o stock_conflict, no descuenta automaticamente.
9. Producto con allow_backorder true permite venta aunque stock sea 0.

Resultado final que debes entregar:
- Diagnostico breve.
- Migraciones creadas.
- RPCs creados/modificados.
- Archivos modificados.
- Como quedo el flujo de reserva.
- Como quedo el flujo de confirmacion Flow.
- Como se libera/expira una reserva.
- Resultado de build/lint.
- Riesgos pendientes despues de Fase 5.

No hagas commit a menos que se te pida explicitamente.
```
