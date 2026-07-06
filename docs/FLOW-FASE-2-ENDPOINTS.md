# Flow API - Fase 2: Endpoints Vercel

Fecha: 2026-07-06
Rama: `feature/flow-api-dynamic-checkout`

## Alcance

Esta fase agrega solo endpoints server-side para Flow sandbox:

- `POST /api/flow/create-payment`
- `POST /api/flow/confirm`
- `GET /api/flow/order-status`

No modifica checkout, frontend, WhatsApp, `payment_url`, ProductForm ni rutas publicas.

## Archivos Creados

- `api/flow/create-payment.ts`
- `api/flow/confirm.ts`
- `api/flow/order-status.ts`
- `src/server/flow/http.ts`
- `src/server/flow/env.ts`
- `src/server/flow/flow.ts`
- `src/server/flow/supabase.ts`
- `src/server/flow/checkout.ts`

## Variables En Vercel

Configurar como variables server-side en Vercel:

```text
FLOW_API_KEY=
FLOW_SECRET_KEY=
FLOW_BASE_URL=https://sandbox.flow.cl/api
FLOW_RETURN_URL=https://<dominio>/checkout/resultado
FLOW_CONFIRMATION_URL=https://<dominio>/api/flow/confirm
APP_PUBLIC_URL=https://<dominio>
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

No usar prefijos publicos para secrets:

- No `VITE_FLOW_API_KEY`.
- No `VITE_FLOW_SECRET_KEY`.
- No `NEXT_PUBLIC_FLOW_*`.
- No `VITE_SUPABASE_SERVICE_ROLE_KEY`.

## `POST /api/flow/create-payment`

Entrada esperada:

```json
{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  "customer": {
    "name": "Cliente Demo",
    "email": "cliente@example.com",
    "phone": "+56912345678",
    "comment": "Comentario opcional"
  }
}
```

Responsabilidades:

- Valida payload.
- Trata el carrito como input no confiable.
- Consulta `public.products` con `SUPABASE_SERVICE_ROLE_KEY` server-side.
- Recalcula precios y total desde DB.
- Rechaza productos inexistentes, inactivos, `out_of_stock`, moneda no `CLP` o montos invalidos.
- Crea `orders` en `pending`.
- Crea `order_items`.
- Firma `payment/create` con HMAC-SHA256 server-side.
- Guarda `flow_token`, `flow_url`, `commerce_order` y estado `redirected`.

Respuesta:

```json
{
  "redirectUrl": "https://sandbox.flow.cl/app/web/pay.php?token=...",
  "commerceOrder": "ORD-...",
  "publicLookupToken": "..."
}
```

Prueba con curl:

```bash
curl -X POST "https://<dominio>/api/flow/create-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productId": "<UUID_PRODUCTO_ACTIVO>", "quantity": 1 }
    ],
    "customer": {
      "name": "Cliente Demo",
      "email": "cliente@example.com",
      "phone": "+56912345678",
      "comment": "Prueba sandbox"
    }
  }'
```

Luego abrir `redirectUrl` y completar el pago en sandbox.

## `POST /api/flow/confirm`

Flow llama este endpoint via `POST` `application/x-www-form-urlencoded` con:

```text
token=<FLOW_TOKEN>
```

Responsabilidades:

- Recibe token.
- Consulta `payment/getStatus` server-side.
- Busca orden local por `orders.flow_token`.
- Compara `commerceOrder`, moneda y monto cuando Flow los entrega.
- Actualiza `orders.status` de forma idempotente:
  - Flow `1` -> local `redirected`.
  - Flow `2` -> local `paid`.
  - Flow `3` -> local `failed`.
  - Flow `4` -> local `cancelled`.
- Si la orden ya esta `paid`, responde 200 sin reprocesar.

Prueba manual despues de crear un pago:

```bash
curl -X POST "https://<dominio>/api/flow/confirm" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "token=<FLOW_TOKEN>"
```

En sandbox, la prueba real es completar el pago desde `redirectUrl` y revisar que Flow invoque `FLOW_CONFIRMATION_URL`.

## `GET /api/flow/order-status`

Entrada:

```text
/api/flow/order-status?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>
```

Respuesta publica acotada:

```json
{
  "commerceOrder": "ORD-...",
  "status": "paid",
  "flowStatus": "2",
  "currency": "CLP",
  "total": 12000,
  "paidAt": "...",
  "confirmedAt": "...",
  "failedAt": null,
  "expiresAt": null,
  "createdAt": "..."
}
```

Prueba:

```bash
curl "https://<dominio>/api/flow/order-status?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>"
```

## Verificacion En Supabase

```sql
select commerce_order, status, flow_status, flow_token, flow_url, total, currency, paid_at, confirmed_at, failed_at
from public.orders
order by created_at desc
limit 10;

select oi.order_id, oi.product_id, oi.product_name, oi.unit_price, oi.quantity, oi.subtotal
from public.order_items oi
join public.orders o on o.id = oi.order_id
where o.commerce_order = '<ORDEN>';
```

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` solo se usa dentro de Vercel Functions.
- El navegador no llama Flow directamente.
- Los precios no vienen del cliente.
- La return URL no marca pago como exitoso.
- `confirm` verifica siempre con Flow antes de actualizar estado.
- No hay descuento de stock, emails, factura ni fulfillment en esta fase.

## Pendiente Para Fase 3

Integrar el frontend:

- Agregar boton Flow en `/checkout`.
- Mantener WhatsApp y `payment_url`.
- Redirigir a `redirectUrl`.
- Crear `/checkout/resultado`.
- Consultar `order-status` usando `commerceOrder` y `publicLookupToken`.

## Actualizacion 2026-07-06 - cierre sandbox Vercel

Fase 3 de resultado implementada en `docs/FLOW-FASE-3-RESULTADO-CHECKOUT.md`.

Dominio oficial para sandbox:

```text
APP_PUBLIC_URL=https://tienda-orbynexdigital.vercel.app
FLOW_RETURN_URL=https://tienda-orbynexdigital.vercel.app/checkout/resultado
FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.vercel.app/api/flow/confirm
```

`create-payment` ahora envia a Flow una `urlReturn` especifica por orden:

```text
https://tienda-orbynexdigital.vercel.app/checkout/resultado?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>&lookup=<TOKEN_PUBLICO>
```

`order-status` acepta `publicLookupToken`, `lookup` o `public_lookup_token` como token publico de consulta.
