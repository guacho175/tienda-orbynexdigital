# Inventario con reservas de stock

Fecha: 2026-07-07

## Resumen

Se implementaron las Fases 1 a 5 del plan de inventario avanzado para el checkout Flow:

- Estados de orden mas expresivos.
- Tabla `public.stock_reservations`.
- RPC atomico para crear orden y reservar stock.
- Confirmacion Flow con captura de reservas.
- Expiracion opportunistic de reservas vencidas.

No se implementaron movimientos de inventario, ajustes manuales admin ni notificaciones de bajo stock.

## Stock fisico vs reservas activas

`products.stock_quantity` representa stock fisico no vendido.

`stock_reservations` representa unidades apartadas temporalmente mientras el cliente paga en Flow. Una reserva activa reduce el stock vendible, pero no descuenta stock definitivo.

La ventana operativa definida para checkout Flow es 10 minutos.

Disponibilidad vendible:

```sql
products.stock_quantity
- sum(stock_reservations.quantity where status = 'active' and expires_at > now())
```

Solo se crean reservas para productos con:

- `track_inventory = true`
- `allow_backorder = false`

Productos sin control de inventario o con backorder permitido siguen comprables sin crear reservas.

## Estados nuevos

`orders.status` ahora permite:

- `stock_reserved`: la orden tiene reservas activas antes de redirigir a Flow.
- `reservation_expired`: la reserva vencio antes de una confirmacion definitiva.
- `stock_conflict`: Flow pago, pero capturar stock dejaria stock negativo.
- `requires_manual_review`: Flow pago, pero la reserva ya no estaba activa o el caso requiere conciliacion manual.

## Flujo create-payment

`POST /api/flow/create-payment`:

1. Valida el body con Zod.
2. Agrega cantidades duplicadas por producto.
3. Llama `public.create_order_with_stock_reservation(...)` con `service_role`.
4. El RPC ejecuta `public.expire_stock_reservations()` al inicio.
5. El RPC bloquea productos con `FOR UPDATE`.
6. Recalcula precio, moneda, nombre y slug desde `products`.
7. Valida producto activo, disponibilidad, CLP y stock vendible.
8. Crea `orders`, `order_items` y reservas activas en una transaccion.
9. El backend llama Flow solo despues de que la reserva existe.
10. Si Flow responde bien, guarda `flow_token`, `flow_url`, `flow_status` y marca `redirected`.
11. Si Flow falla, llama `public.release_order_stock_reservations(...)` y marca `failed`.

No se descuenta `stock_quantity` al iniciar pago.

Si otro cliente intenta comprar stock fisico que esta totalmente reservado, la UI debe mostrar:

```text
Este producto esta reservado temporalmente por otra compra. Si no se completa el pago, podria volver a estar disponible en unos minutos.
```

El mensaje no expone cliente, orden, token, reserva ni hora exacta de expiracion.

## Flujo confirm

`POST /api/flow/confirm`:

1. Recibe el `token` enviado por Flow.
2. Consulta `payment/getStatus` server-side.
3. Valida `commerceOrder`, moneda y monto contra la orden local.
4. Si Flow confirma pago exitoso, llama `public.confirm_order_payment_and_capture_stock(...)`.
5. Si Flow falla, cancela o expira, llama `public.release_order_stock_reservations(...)`.
6. Responde `200` a Flow incluso cuando queda un conflicto operativo ya registrado, para evitar retries infinitos.

## Captura de stock

`public.confirm_order_payment_and_capture_stock(...)`:

- Bloquea la orden con `FOR UPDATE`.
- Es idempotente si la orden ya esta `paid`.
- Bloquea reservas de la orden.
- Si las reservas activas siguen vigentes, bloquea productos y descuenta `stock_quantity`.
- Marca reservas como `confirmed`.
- Marca la orden como `paid`.
- Si no hay reservas porque los productos no controlan inventario o permiten backorder, marca `paid` sin descontar stock.
- Si la reserva vencio o fue liberada, marca `requires_manual_review`, conserva `paid_at` y no descuenta stock.
- Si capturar stock dejaria stock negativo, marca `stock_conflict`, conserva `paid_at` y no descuenta stock.

## Expiracion y liberacion

`public.expire_stock_reservations()`:

- Marca reservas `active` vencidas como `expired`.
- Marca ordenes en `pending`, `stock_reserved` o `redirected` como `reservation_expired`.
- Es idempotente.
- Se ejecuta opportunistic al crear nuevas ordenes.
- Tambien se ejecuta por Vercel Cron cada minuto desde `GET /api/stock/expire-reservations`, protegido con `CRON_SECRET`.

`public.release_order_stock_reservations(...)`:

- Libera reservas activas de una orden.
- Se usa cuando `payment/create` falla o cuando Flow reporta `failed`, `cancelled` o `expired`.
- No toca ordenes ya `paid`.

## RLS y permisos

`stock_reservations`:

- RLS activado.
- `anon` y `authenticated` sin permisos directos.
- `service_role` con permisos completos.

RPCs nuevas:

- `public.expire_stock_reservations()`
- `public.create_order_with_stock_reservation(...)`
- `public.release_order_stock_reservations(...)`
- `public.confirm_order_payment_and_capture_stock(...)`

Todas quedan con `EXECUTE` revocado para `PUBLIC`, `anon` y `authenticated`, y concedido solo a `service_role`.

## Riesgo resuelto

Antes, dos clientes podian iniciar pago contra el mismo `stock_quantity`; el primero que confirmaba descontaba y el segundo podia terminar en conflicto despues de pagar.

Ahora, el primer checkout reserva unidades. El segundo checkout calcula stock vendible descontando reservas activas y no puede reservar mas de lo disponible.

## Disponibilidad publica

El frontend no consulta `public.stock_reservations` directamente.

`POST /api/products/availability` usa `service_role` server-side, ejecuta `public.expire_stock_reservations()` y devuelve solo:

- `availableQuantity`
- `canPurchase`
- `temporarilyReserved`

No devuelve IDs de reserva, ordenes, clientes, tokens ni `expires_at`.

## Casos pendientes

- Tabla `inventory_movements`.
- Ajustes manuales admin.
- Filtros y notificaciones de bajo stock.
- Flujo de conciliacion admin para `requires_manual_review` y `stock_conflict`.
