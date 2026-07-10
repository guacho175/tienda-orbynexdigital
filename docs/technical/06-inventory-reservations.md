# 06 - Gestion de Inventario y Reservas de Stock

El sistema separa stock fisico, reservas temporales y movimientos historicos.

## Stock Fisico

`products.stock_quantity` representa unidades reales disponibles en bodega.

Reglas:

- Si `track_inventory = false`, el producto se trata como servicio o venta sin limite.
- Si `allow_backorder = true`, se permite vender aunque el stock sea bajo o cero.
- Si `out_of_stock_behavior = hide_product`, el producto agotado se oculta del catalogo publico.

## Stock Vendible

El stock vendible descuenta reservas activas:

```text
stock_vendible = max(0, stock_quantity - reservas_activas)
```

La disponibilidad publica se consulta con `/api/products/availability`.

## Reservas de 10 Minutos

Durante checkout Flow:

1. La API llama `create_order_with_stock_reservation`.
2. La RPC bloquea filas de productos con `FOR UPDATE`.
3. Inserta orden y reservas `active`.
4. El usuario es redirigido a Flow.
5. Si paga dentro de la ventana, `confirm_order_payment_and_capture_stock` confirma reserva y descuenta stock fisico.
6. Si no paga, el cron expira reservas.

Estados de `stock_reservations`:

- `active`
- `confirmed`
- `released`
- `expired`

## Movimientos de Stock

La tabla `stock_movements` guarda historial operativo.

Implementado actualmente:

- ajustes manuales desde `/admin/edit/$id`;
- devoluciones manuales;
- correcciones manuales.

Previsto para fases futuras:

- `flow_sale`;
- `reservation_created`;
- `reservation_released`.

## Ajuste Manual Admin

El panel admin usa la RPC:

```sql
public.adjust_product_stock_admin(
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text,
  p_movement_type text
)
```

Esta RPC:

- valida que el delta no sea cero;
- bloquea el producto con `FOR UPDATE`;
- evita stock final negativo;
- actualiza `products.stock_quantity`;
- fuerza `track_inventory = true`;
- inserta un registro en `stock_movements`;
- corre como `SECURITY INVOKER`, por lo que respeta RLS del admin autenticado.

## Auditoria Relacionada

Cada ajuste manual tambien genera evento `stock_adjustment` en `product_audit_events`.

## Reglas de Seguridad

- El frontend publico no actualiza stock directamente.
- `orders`, `order_items` y `stock_reservations` no aceptan escrituras directas de clientes.
- Los cambios automaticos de Flow siguen encapsulados en API/RPC.
