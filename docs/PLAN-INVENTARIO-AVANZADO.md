# Plan de inventario avanzado

Fecha: 2026-07-07

## Objetivo

Estandarizar el flujo de stock para evitar overselling, mantener trazabilidad y separar correctamente los estados de pago, reserva, descuento y problemas operativos.

Estado actualizado: las Fases 1 a 5 estan implementadas. El checkout Flow ahora crea reservas temporales antes de redirigir a Flow, captura stock solo al confirmar pago exitoso y expira/libera reservas sin descontar stock por pagos abandonados.

Documento operativo: `docs/INVENTARIO-RESERVAS-STOCK.md`.

## Principio recomendado

Separar cuatro conceptos:

1. Stock fisico disponible.
2. Stock reservado temporalmente.
3. Stock vendido/descontado definitivamente.
4. Stock ajustado manualmente por admin.

La regla operativa recomendada:

- Al iniciar checkout: reservar stock por un tiempo limitado.
- Al confirmar pago exitoso: convertir reserva en venta y descontar stock definitivo.
- Si el pago falla, se cancela o expira: liberar reserva.
- Si la reserva expira antes del pago: no marcar la orden como pagada automaticamente; dejar estado de conflicto operativo.

## Fase 0 - Estado actual estabilizado

Estado: implementado.

Incluye:

- Campos de inventario en `products`.
- Validacion publica y admin.
- Validacion server-side en `create-payment`.
- Descuento atomico en `confirm`.
- RPC restringido a `service_role`.

Riesgo aceptado:

- Dos clientes pueden iniciar pago con el mismo stock disponible.
- El primero que confirma descuenta.
- El segundo queda en conflicto si Flow confirma pero ya no hay stock.

Esta fase sirve para una tienda pequena o con bajo volumen, pero no es el flujo ideal para inventario fisico limitado.

## Fase 1 - Estados de orden mas expresivos

Estado: implementado.

Objetivo: dejar de reutilizar `failed` para casos de pago exitoso sin stock.

Cambios de datos:

- Extender `orders.status` con:
  - `stock_conflict`
  - `stock_reserved`
  - `reservation_expired`
  - `requires_manual_review`

Cambios backend:

- Si Flow confirma pago exitoso pero no hay stock suficiente, marcar:
  - `status = 'stock_conflict'`
  - `paid_at = now()`
  - `confirmed_at = now()`
  - detalle en `flow_raw_status`

Ventaja:

- No se pierde la verdad financiera: el pago fue exitoso.
- El problema queda como operacion/inventario, no como fallo de pago.

## Fase 2 - Tabla de reservas de stock

Estado: implementado.

Objetivo: reservar unidades al crear el pago para cerrar la ventana de competencia.

Crear tabla `stock_reservations`:

- `id uuid primary key`
- `order_id uuid references orders(id)`
- `product_id uuid references products(id)`
- `quantity integer not null`
- `status text not null`
- `expires_at timestamptz not null`
- `created_at timestamptz not null default now()`
- `confirmed_at timestamptz null`
- `released_at timestamptz null`

Estados sugeridos:

- `active`
- `confirmed`
- `released`
- `expired`

Indices:

- `(product_id, status)`
- `(order_id)`
- `(expires_at)` para expiracion.

Regla de disponibilidad:

```sql
available_to_sell =
  products.stock_quantity
  - sum(active stock_reservations.quantity where expires_at > now())
```

Importante:

- `products.stock_quantity` representa stock fisico no vendido.
- Las reservas activas reducen stock vendible, pero no descuentan definitivamente.

## Fase 3 - RPC atomico para crear orden y reservar stock

Estado: implementado.

Objetivo: que `create-payment` no haga lectura y escritura separadas para stock.

Crear RPC:

RPC implementado: `public.create_order_with_stock_reservation(p_user_id, p_commerce_order, p_customer, p_items, p_reservation_minutes)`.

Debe:

- Bloquear productos afectados con `FOR UPDATE`.
- Validar producto activo.
- Validar precio/currency desde DB.
- Calcular reservas activas no expiradas.
- Validar disponibilidad real.
- Crear `orders` en `stock_reserved`.
- Crear `order_items`.
- Crear `stock_reservations` en `active`.
- Retornar orden, items calculados, total y token publico.

`api/flow/create-payment.ts` deberia:

- Validar shape del body.
- Llamar RPC.
- Crear pago en Flow.
- Guardar `flow_token`, `flow_url` y pasar orden a `redirected`.
- Si Flow falla, liberar reservas.

## Fase 4 - Confirmacion Flow con reserva

Estado: implementado.

Objetivo: confirmar pago y convertir reserva en venta.

Reemplazar o extender RPC actual por:

```sql
confirm_order_payment_and_capture_stock(
  p_order_id uuid,
  p_flow_status jsonb,
  p_flow_status_text text
)
```

Si Flow pago exitoso:

- Bloquear orden.
- Validar idempotencia.
- Bloquear reservas activas de la orden.
- Si reservas siguen activas y no expiraron:
  - descontar `products.stock_quantity -= reservation.quantity`
  - marcar reservas `confirmed`
  - marcar orden `paid`
- Si reservas expiraron:
  - marcar orden `requires_manual_review` o `stock_conflict`
  - no descontar stock automaticamente

Si Flow falla/cancela:

- marcar orden `failed` o `cancelled`
- liberar reservas `active`

## Fase 5 - Expiracion automatica de reservas

Estado: implementado como expiracion opportunistic. Cron programado queda pendiente.

Objetivo: liberar reservas abandonadas.

Opciones:

1. Vercel Cron llamando endpoint server-side.
2. Supabase scheduled job si esta disponible en el entorno.
3. Liberacion opportunistic: antes de crear/reservar stock, ejecutar RPC que expire reservas vencidas.

Recomendacion practica para este proyecto:

- Implementar primero liberacion opportunistic en RPC.
- Agregar despues un Vercel Cron cada 5 minutos.

RPC sugerido:

```sql
expire_stock_reservations()
```

Debe:

- Marcar reservas `active` vencidas como `expired`.
- Marcar ordenes relacionadas como `reservation_expired` si siguen sin pago.

## Fase 6 - Movimientos de inventario

Objetivo: trazabilidad completa.

Crear tabla `inventory_movements`:

- `id uuid primary key`
- `product_id uuid not null`
- `order_id uuid null`
- `reservation_id uuid null`
- `movement_type text not null`
- `quantity_delta integer not null`
- `reason text null`
- `created_by uuid null`
- `created_at timestamptz not null default now()`
- `metadata jsonb null`

Tipos:

- `sale`
- `reservation_created`
- `reservation_released`
- `reservation_expired`
- `manual_adjustment`
- `restock`
- `correction`

Regla:

- Todo cambio definitivo o relevante en inventario debe crear movimiento.

## Fase 7 - Ajustes manuales admin

Objetivo: permitir reposicion y correcciones con control.

UI admin:

- Boton `Ajustar stock`.
- Campo cantidad.
- Selector de motivo:
  - reposicion
  - correccion
  - perdida
  - devolucion
  - otro
- Comentario obligatorio para correcciones negativas.

Backend:

- RPC `adjust_product_stock(...)`.
- Solo admin.
- No permitir stock negativo.
- Registrar `inventory_movements`.

## Fase 8 - Notificaciones y bajo stock

Objetivo: operar inventario sin revisar producto por producto.

Implementar:

- Badge admin por bajo stock.
- Filtro `Pocas unidades`.
- Filtro `Agotados`.
- Notificacion visual en admin.
- Opcional: email/WhatsApp interno si stock cae bajo umbral.

La notificacion debe dispararse al confirmar venta o ajuste manual, no desde frontend publico.

## Fase 9 - WhatsApp checkout y payment_url estandarizados

WhatsApp:

- Si se reactiva checkout por WhatsApp para pedidos reales, debe crear orden/reserva server-side antes de abrir WhatsApp.
- Si es solo consulta comercial, no debe reservar stock.

payment_url:

- Para links externos estaticos, el flujo no puede garantizar captura atomica si el pago ocurre fuera del backend.
- Recomendacion: mantener `payment_url` solo para productos sin inventario o servicios.
- Para productos con `track_inventory = true`, preferir Flow dinamico.

Regla recomendada:

- Si `track_inventory = true`, ocultar `payment_url` externo y forzar checkout dinamico.
- Si `track_inventory = false`, permitir `payment_url`.

## Orden recomendado de implementacion

1. Fase 1: estados de orden mas expresivos.
2. Fase 2: tabla `stock_reservations`.
3. Fase 3: RPC de crear orden + reservar stock.
4. Fase 4: confirmar pago + capturar reserva.
5. Fase 5: expiracion de reservas.
6. Fase 6: movimientos de inventario.
7. Fase 7: ajustes manuales admin.
8. Fase 8: alertas de bajo stock.
9. Fase 9: endurecer reglas para WhatsApp/payment_url.

## Decision recomendada para este proyecto

Implementar primero Fases 1 a 5. Ese bloque entrega el mayor valor:

- Cierra overselling en checkout Flow.
- Evita descontar stock por pagos abandonados.
- Mantiene idempotencia.
- Mejora soporte cuando Flow paga pero la reserva expiro.
- Deja una base limpia para auditoria y movimientos.

Fases 6 a 9 son mejoras operativas para cuando la tienda tenga mas productos, mas administradores o mayor volumen.
