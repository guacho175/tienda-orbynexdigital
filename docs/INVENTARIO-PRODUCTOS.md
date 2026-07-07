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

## Flow

`POST /api/flow/create-payment` recalcula productos desde Supabase antes de crear el pago:

- Valida que el producto exista.
- Valida que este activo.
- Valida `availability`.
- Valida `track_inventory`, `allow_backorder` y `stock_quantity`.
- Rechaza cantidad mayor al stock con mensaje claro.
- Sigue recalculando precio y total server-side.

Segun la documentacion oficial de Flow, la confirmacion llega por POST con un token y el backend debe consultar `payment/getStatus` antes de marcar pagado.

## Descuento de stock

No se descuenta stock al iniciar el pago.

Cuando Flow confirma pago exitoso, `api/flow/confirm.ts` llama el RPC:

```sql
public.confirm_order_and_decrement_stock(order_id, flow_status, flow_status_text)
```

Ese RPC:

- Bloquea la orden con `FOR UPDATE`.
- Es idempotente si la orden ya esta `paid`.
- Bloquea productos de `order_items` con `FOR UPDATE`.
- Revalida stock antes de descontar.
- Descuenta stock dentro de la transaccion.
- Marca la orden como `paid`.
- Si no hay stock suficiente al confirmar, marca la orden como `failed` y deja detalle en `flow_raw_status`.

`EXECUTE` del RPC queda revocado para `PUBLIC`, `anon` y `authenticated`, y concedido solo a `service_role`.

## WhatsApp y payment_url

No hay un boton WhatsApp checkout activo en la pantalla actual de checkout. El helper de WhatsApp sigue disponible, y cualquier UI que lo use debe aplicar la misma validacion de carrito antes de abrir el enlace.

`payment_url` externo se mantiene para productos individuales, pero se oculta o bloquea si el producto esta agotado.

## Riesgos y pendientes

Pendientes de inventario avanzado:

- Reservas temporales de stock al iniciar pago.
- Expiracion automatica de reservas.
- Historial de movimientos de inventario.
- Auditoria por usuario/admin.
- Notificaciones por bajo stock.
- Estado separado para pagos exitosos sin stock al confirmar, en vez de reutilizar `failed`.
- Reposicion y ajustes manuales con motivo.

La decision actual evita descontar stock por pagos abandonados, pero todavia existe una ventana de competencia entre iniciar pago y confirmar. El RPC evita stock negativo al confirmar, pero no reserva unidades durante el pago.
