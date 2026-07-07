# Plan reservas de stock, cron y mensajes claros

Fecha: 2026-07-07

## Objetivo

Aplicar un flujo de reserva de stock mas claro y predecible para checkout Flow:

- Reserva temporal de stock por 10 minutos.
- Limpieza automatica de reservas vencidas.
- Mensaje claro cuando otro cliente intenta comprar una unidad reservada.
- Catalogo, detalle y carrito deben mostrar disponibilidad vendible, no solo stock fisico.
- Mantener RLS, service role y secretos fuera del cliente.

## Estado actual observado

El bloqueo de stock funciona correctamente en backend:

- La primera pestana que avanza a Flow crea una reserva activa.
- La segunda pestana no puede comprar la misma ultima unidad.
- El RPC descuenta reservas activas al calcular stock disponible.

Problemas actuales:

- `api/flow/create-payment.ts` envia `p_reservation_minutes: 15`.
- El catalogo y el detalle muestran `products.stock_quantity`, que es stock fisico, no stock vendible.
- Sin cron, `expire_stock_reservations()` solo se ejecuta de forma oportunista cuando otro flujo llama los RPC.
- El mensaje actual dice `Stock disponible: 0`, pero no explica que la unidad podria estar reservada temporalmente.

## Decision funcional

Usar reserva de 10 minutos.

Razon:

- 5 minutos maximiza rotacion, pero puede ser agresivo para pagos con autenticacion bancaria.
- 10 minutos da margen razonable para Flow sin dejar el inventario bloqueado demasiado tiempo.
- 15 minutos es valido, pero se siente largo para productos de bajo stock.

Mensaje publico para conflicto por reserva:

```text
Este producto esta reservado temporalmente por otra compra. Si no se completa el pago, podria volver a estar disponible en unos minutos.
```

No exponer:

- Email, usuario, orden, token, hora exacta de expiracion, ID de reserva.
- Cantidad reservada por otros clientes.

Exponer solo informacion generica de disponibilidad temporal no es un riesgo relevante para este e-commerce.

## Cambios propuestos

### 1. Constante de reserva Flow

Archivo probable:

- `api/flow/create-payment.ts`

Cambiar:

- `p_reservation_minutes: 15`

Por:

- `p_reservation_minutes: 10`

Idealmente extraer constante server-side:

```ts
const FLOW_STOCK_RESERVATION_MINUTES = 10;
```

No debe venir desde frontend.

### 2. Migracion SQL para mensaje y default

Crear una nueva migracion Supabase, no editar solo la ya aplicada en produccion.

Objetivo:

- Reemplazar `public.create_order_with_stock_reservation(...)`.
- Mantener `SECURITY DEFINER`.
- Mantener `SET search_path = public`.
- Mantener `EXECUTE` solo para `service_role`.
- Cambiar default de `p_reservation_minutes` a `10`.
- Cuando `stock_quantity > 0`, `reserved_quantity > 0` y `available_quantity < requested_quantity`, lanzar el mensaje de reserva temporal.
- Cuando el producto realmente no tenga stock fisico, mantener mensaje de agotado/stock insuficiente.

Regla de mensaje:

- Si no hay stock fisico: `Producto agotado`.
- Si hay stock fisico, pero esta ocupado por reservas activas vigentes: mensaje de reserva temporal.
- Si el usuario pide mas unidades que el total fisico: mensaje de stock insuficiente con cantidad disponible.

### 3. Endpoint cron protegido

Crear endpoint server-side:

- `api/stock/expire-reservations.ts`

Metodo:

- `GET`

Seguridad:

- Requiere `Authorization: Bearer ${CRON_SECRET}`.
- Si falta `CRON_SECRET`, responder `500` o `503` sin ejecutar limpieza.
- Si el header no coincide, responder `401`.
- No loguear el secreto.

Accion:

- Crear cliente Supabase admin con `SUPABASE_SERVICE_ROLE_KEY`.
- Llamar RPC `expire_stock_reservations()`.
- Responder JSON con conteos:
  - `expiredReservations`
  - `expiredOrders`

### 4. Configurar Vercel Cron

Crear `vercel.json` si no existe:

```json
{
  "crons": [
    {
      "path": "/api/stock/expire-reservations",
      "schedule": "* * * * *"
    }
  ]
}
```

Preferencia:

- Cron cada 1 minuto para que una reserva de 10 minutos se libere cerca del minuto 10.
- Si el plan de Vercel limita frecuencia, usar fallback `*/5 * * * *`.

Variable necesaria en Vercel:

- `CRON_SECRET`

Valor:

- String aleatorio largo.
- No usar prefijo `VITE_`.
- No commitear.

Referencia Vercel:

- Vercel ejecuta cron por HTTP `GET` al `path` definido en `vercel.json`.
- Vercel recomienda `CRON_SECRET`; lo envia como header `Authorization: Bearer <secret>`.
- Documentacion: https://vercel.com/docs/cron-jobs y https://vercel.com/docs/cron-jobs/manage-cron-jobs

### 5. Disponibilidad publica sin exponer reservas

Problema:

- Las vistas publicas leen `products.stock_quantity`, pero eso no descuenta reservas activas.

Solucion recomendada:

Crear endpoint server-side publico:

- `api/products/availability.ts`

Metodo:

- `POST`

Input:

```json
{
  "productIds": ["uuid-1", "uuid-2"]
}
```

Validaciones:

- `productIds` array.
- Maximo 100 IDs por request.
- UUID validos.

Accion:

- Usar service role solo en servidor.
- Ejecutar `expire_stock_reservations()` antes de calcular disponibilidad.
- Consultar productos y reservas activas vigentes.
- Devolver solo:
  - `productId`
  - `availableQuantity`
  - `temporarilyReserved`
  - `canPurchase`

No devolver:

- `reservedQuantity`
- `orderId`
- `reservationId`
- `expiresAt`
- datos de cliente.

Motivo:

- Evita abrir `stock_reservations` a `anon`.
- Evita crear una funcion `SECURITY DEFINER` publica callable por navegador.
- Mantiene la fuente de verdad en backend.

### 6. Integracion catalogo, detalle y carrito

Archivos probables:

- `src/services/products.service.ts`
- `src/utils/inventory.ts`
- `src/routes/producto.$slug.tsx`
- `src/routes/catalogo.tsx`
- `src/routes/carrito.tsx`
- `src/routes/checkout.tsx`

Comportamiento esperado:

- Catalogo/detalle muestran stock vendible.
- Si `availableQuantity = 0` por reserva temporal, mostrar estado:
  - `Reservado temporalmente`
  - texto corto: `Podria volver a estar disponible en unos minutos.`
- Deshabilitar "Agregar al carrito" cuando `canPurchase = false`.
- Si el producto ya estaba en carrito, checkout debe mostrar el mensaje largo definido.
- No tratar una reserva temporal como agotado fisico definitivo.
- `out_of_stock_behavior = hide_product` debe aplicar para stock fisico 0, no necesariamente para reserva temporal.

### 7. Checkout y errores

Archivo probable:

- `api/flow/create-payment.ts`

Comportamiento:

- Si el RPC responde conflicto de reserva, devolver HTTP `409`.
- Frontend debe mostrar el mensaje claro sin filtrar SQL tecnico.
- Mantener generic fallback para otros errores.

Mensaje final al usuario:

```text
Este producto esta reservado temporalmente por otra compra. Si no se completa el pago, podria volver a estar disponible en unos minutos.
```

### 8. Documentacion

Actualizar:

- `docs/INVENTARIO-PRODUCTOS.md`
- `docs/INVENTARIO-RESERVAS-STOCK.md`

Agregar:

- Duracion oficial de reserva: 10 minutos.
- Cron de limpieza.
- Variable `CRON_SECRET`.
- Explicacion de disponibilidad vendible vs stock fisico.

## Orden de aplicacion

1. Crear migracion SQL de default 10 minutos y mensaje por reserva temporal.
2. Crear endpoint `api/stock/expire-reservations.ts`.
3. Crear `vercel.json` con cron.
4. Crear endpoint `api/products/availability.ts`.
5. Integrar disponibilidad en productos publicos.
6. Ajustar mensajes en checkout/carrito/detalle.
7. Actualizar docs.
8. Ejecutar validaciones.
9. Aplicar migracion a produccion.
10. Configurar `CRON_SECRET` en Vercel.
11. Deploy a produccion.
12. Probar flujo real multi-pestana.

## Validacion tecnica

Local:

- `npm run build`
- ESLint acotado a archivos tocados si `npm run lint` global sigue fallando por CRLF preexistente.
- `supabase db lint --db-url <pooler-url>` contra produccion o entorno equivalente.

SQL:

- Confirmar funcion con:
  - `SECURITY DEFINER = true`
  - `search_path=public`
  - `anon` sin `EXECUTE`
  - `authenticated` sin `EXECUTE`
  - `service_role` con `EXECUTE`

Pruebas funcionales:

1. Producto con `stock_quantity = 1`, `track_inventory = true`, `allow_backorder = false`.
2. Pestana A inicia Flow.
3. Pestana B ve producto como reservado temporalmente o no puede comprar.
4. Pestana B recibe mensaje claro.
5. No pagar en Flow.
6. Esperar 10 minutos mas una corrida cron.
7. Producto vuelve a estar disponible.
8. Pagar dentro de los 10 minutos.
9. Confirmacion Flow descuenta stock una sola vez.
10. Webhook duplicado no descuenta de nuevo.

## Riesgos y mitigaciones

Riesgo: mostrar disponibilidad temporal puede permitir inferir interes en un producto.

Mitigacion:

- Mensaje generico.
- No mostrar usuario, cantidad reservada ni expiracion exacta.

Riesgo: Vercel Cron no dispara en local.

Mitigacion:

- Probar endpoint localmente con header `Authorization`.
- Verificar cron despues del deploy en Vercel.

Riesgo: cron falla y reservas quedan activas hasta otra accion.

Mitigacion:

- Mantener expiracion oportunista dentro de RPCs.
- El cron es capa operativa, no unica fuente de verdad.

Riesgo: catalogo queda cacheado por `PRODUCTS_STALE_TIME_MS = 5 * 60 * 1000`.

Mitigacion:

- Reducir stale time para disponibilidad o separar disponibilidad en una consulta con menor cache.
- Reconsultar disponibilidad al entrar a detalle, carrito y checkout.

## Criterio de listo

Listo solo si:

- Reserva dura 10 minutos.
- Cron protegido queda configurado.
- Producto reservado no se ofrece como disponible.
- Segundo comprador recibe mensaje claro.
- Reservas vencidas se liberan sin accion manual.
- No se abre `stock_reservations` a `anon` ni `authenticated`.
- Build y lint acotado pasan.
- Validacion SQL de permisos pasa.

