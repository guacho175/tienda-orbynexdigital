# Inventario de productos

Fecha: 2026-07-07

## Resumen

El mini-commerce ahora soporta inventario por producto sin romper productos existentes. Los productos actuales quedan con `track_inventory = false`, por lo que siguen visibles y comprables como antes hasta que el admin active control de stock.

## Campos agregados

En `public.products`:

- `stock_quantity integer not null default 0`
- `track_inventory boolean not null default false`
- `allow_backorder boolean not null default false`
- `low_stock_threshold integer not null default 3`
- `out_of_stock_behavior text not null default 'show_sold_out'`

Restricciones:

- `stock_quantity >= 0`
- `low_stock_threshold >= 0`
- `out_of_stock_behavior in ('show_sold_out', 'hide_product')`

## track_inventory

`track_inventory = false` significa que el producto no descuenta stock. Es el modo recomendado para servicios digitales, consultorias o productos sin limite operativo claro.

`track_inventory = true` activa validacion de stock en UI, carrito, checkout Flow y confirmacion de pago.

## show_sold_out vs hide_product

`show_sold_out` mantiene el producto visible cuando `stock_quantity = 0`, pero lo muestra como `Agotado` y bloquea compra.

`hide_product` oculta automaticamente el producto de home, catalogo y detalle publico cuando `stock_quantity = 0` y `allow_backorder = false`.

El admin siempre puede ver todos los productos, incluso agotados u ocultos por stock.

## Configuracion admin

En `ProductForm`, el admin puede configurar:

- Controlar inventario.
- Stock disponible.
- Umbral de pocas unidades.
- Permitir venta sin stock.
- Comportamiento al agotarse: mostrar agotado u ocultar del catalogo.

El listado admin muestra badges:

- Sin control de stock.
- Stock: X.
- Pocas unidades: X.
- Agotado.
- Oculto por stock.

## Catalogo y home

Las consultas publicas muestran productos activos que cumplen una de estas reglas:

- No controlan inventario.
- Controlan inventario y tienen stock mayor a 0.
- Permiten backorder.
- Estan agotados pero configurados como `show_sold_out`.

Productos con `track_inventory = true`, `stock_quantity = 0`, `allow_backorder = false` y `out_of_stock_behavior = 'hide_product'` no aparecen en home ni catalogo.

## Detalle de producto

El detalle publico:

- Muestra stock disponible si el producto controla inventario.
- Muestra `Ultimas unidades` si `stock_quantity <= low_stock_threshold`.
- Muestra `Agotado` si no hay stock y no se permite backorder.
- Bloquea `Agregar al carrito` si no se puede comprar.
- Oculta `payment_url` externo si el producto esta agotado.
- Permite consultar por WhatsApp cuando un producto visible esta agotado.

## Carrito

El carrito consulta productos frescos desde Supabase para validar el snapshot local:

- Si un producto ya no existe, esta inactivo u oculto por stock, bloquea checkout.
- Si `quantity > stock_quantity`, muestra aviso y permite ajustar al maximo disponible.
- Si stock llega a 0, muestra aviso y obliga a eliminar o corregir antes de checkout.

Esta validacion es solo UX. La validacion real ocurre en servidor y base de datos.

## Flow y reservas

`POST /api/flow/create-payment` recalcula productos desde Supabase antes de crear el pago:

- Valida que el producto exista.
- Valida que este activo.
- Valida `availability`.
- Valida `track_inventory`, `allow_backorder`, `stock_quantity` y reservas activas.
- Rechaza cantidad mayor al stock vendible con mensaje claro.
- Sigue recalculando precio y total server-side.
- Crea la orden, los items y las reservas temporales con `public.create_order_with_stock_reservation(...)`.

Segun la documentacion oficial de Flow, la confirmacion llega por POST con un token y el backend debe consultar `payment/getStatus` antes de marcar pagado.

## Descuento de stock

No se descuenta stock al iniciar el pago.

Cuando se inicia un pago Flow, los productos con `track_inventory = true` y `allow_backorder = false` quedan reservados temporalmente en `public.stock_reservations` por 10 minutos.

Cuando Flow confirma pago exitoso, `api/flow/confirm.ts` llama el RPC:

```sql
public.confirm_order_payment_and_capture_stock(order_id, flow_status, flow_status_text)
```

Ese RPC:

- Bloquea la orden con `FOR UPDATE`.
- Es idempotente si la orden ya esta `paid`.
- Bloquea reservas y productos con `FOR UPDATE`.
- Revalida que la reserva siga activa y vigente.
- Descuenta stock dentro de la transaccion solo al capturar una reserva vigente.
- Marca reservas como `confirmed`.
- Marca la orden como `paid`.
- Si la reserva vencio antes de confirmar el pago, marca `requires_manual_review` y no descuenta stock.
- Si capturar stock dejaria stock negativo, marca `stock_conflict` y no descuenta stock.

El RPC anterior `public.confirm_order_and_decrement_stock(...)` queda como wrapper de compatibilidad hacia la confirmacion nueva.

`EXECUTE` del RPC queda revocado para `PUBLIC`, `anon` y `authenticated`, y concedido solo a `service_role`.

## Reservas temporales

La tabla `public.stock_reservations` guarda reservas por orden y producto:

- `active`: reserva vigente.
- `confirmed`: reserva capturada como venta.
- `released`: reserva liberada por fallo/cancelacion/expiracion de Flow.
- `expired`: reserva vencida por tiempo.

`public.expire_stock_reservations()` libera reservas vencidas de forma idempotente y marca ordenes pendientes como `reservation_expired`.

La limpieza automatica queda configurada con Vercel Cron llamando `GET /api/stock/expire-reservations` cada minuto. El endpoint exige `Authorization: Bearer CRON_SECRET`; `CRON_SECRET` debe existir en Vercel como variable server-side y no debe usar prefijo `VITE_`.

Las vistas publicas consultan `POST /api/products/availability` para obtener disponibilidad vendible sin exponer `public.stock_reservations` al navegador. Ese endpoint devuelve solo `availableQuantity`, `canPurchase` y `temporarilyReserved`.

`public.release_order_stock_reservations(...)` libera reservas activas cuando `payment/create` falla o cuando Flow reporta `failed`, `cancelled` o `expired`.

Mas detalle: `docs/INVENTARIO-RESERVAS-STOCK.md`.

## WhatsApp y payment_url

No hay un boton WhatsApp checkout activo en la pantalla actual de checkout. El helper de WhatsApp sigue disponible, y cualquier UI que lo use debe aplicar la misma validacion de carrito antes de abrir el enlace.

`payment_url` externo se mantiene para productos individuales, pero se oculta o bloquea si el producto esta agotado.

## Riesgos y pendientes

Pendientes de inventario avanzado:

- Historial de movimientos de inventario.
- Auditoria por usuario/admin.
- Notificaciones por bajo stock.
- Reposicion y ajustes manuales con motivo.
- Vista/admin de conciliacion para `requires_manual_review` y `stock_conflict`.

La decision actual evita descontar stock por pagos abandonados y cierra la ventana de competencia del checkout Flow con reservas activas. La expiracion existe de forma opportunistic dentro de los RPC y tambien por cron programado para liberar inventario aunque no haya trafico nuevo.
