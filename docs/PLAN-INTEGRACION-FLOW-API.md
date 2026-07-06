# Plan tecnico cerrado: integracion Flow API sandbox

Fecha: 2026-07-06  
Estado: Fase 2 endpoints server-side implementados localmente en rama `feature/flow-api-dynamic-checkout`; checkout/frontend pendientes
Alcance: reemplazar o complementar `payment_url` con pago dinamico Flow API para carritos con varios productos, sin romper el flujo actual.

## 1. Auditoria del proyecto

### Stack real

- Framework: TanStack Start v1 + TanStack Router file-based.
- Frontend: React 19, Vite, Tailwind CSS v4, shadcn/ui.
- Backend actual: Supabase/Lovable Cloud para DB, Auth y Storage.
- Deploy: Vercel, con build `bun run build`.
- Server-side existente: `src/server.ts`, `src/start.ts`, middleware de TanStack Start, y `src/integrations/supabase/client.server.ts` con cliente `service_role` para uso server-only.
- No hay endpoints API propios aun.
- No hay tablas `orders` ni `order_items`.

### Carrito

- Vive en `src/store/cart.store.tsx`.
- Persiste en `localStorage` con `commerceConfig.cartStorageKey` (`shop_cart_v1`).
- Guarda `productId`, `slug`, `name`, `price`, `currency`, `image_url`, `payment_url`, `payment_button_label`, `quantity`.
- Calcula `subtotal` y `total` en cliente.
- Para Flow API, este carrito debe tratarse como input no confiable. El backend solo debe aceptar ids y cantidades; precios y totales deben recalcularse desde Supabase.

### Productos desde Supabase

- Servicio principal: `src/services/products.service.ts`.
- Tabla: `public.products`.
- Campos relevantes: `id`, `name`, `slug`, `price`, `currency`, `is_active`, `availability`, `payment_url`, `payment_button_label`, `image_url`.
- Lectura publica: solo productos activos por RLS.
- Admin CRUD: protegido por RLS segun `public.user_roles`.

### Checkout actual

- Ruta: `src/routes/checkout.tsx`.
- Valida datos de cliente con Zod: `name`, `email`, `phone`, `comment`.
- Flujo principal actual: enviar pedido por WhatsApp y limpiar carrito.
- Fallback actual: si hay un solo item y ese item tiene `payment_url`, muestra boton externo.
- Si hay varios productos con `payment_url`, muestra mensaje para coordinar pago por WhatsApp.
- No existe creacion de orden local ni confirmacion de pago server-side.

### Capacidad server-side en Vercel

- El proyecto ya corre con TanStack Start y tiene server entry.
- Para Flow se recomienda agregar Vercel Functions bajo `api/flow/*`.
- Esto permite endpoints HTTP publicos estables para Flow sin cambiar el router de TanStack, sin depender de una ruta React y sin llamar Flow desde el navegador.

## 2. Documentacion oficial Flow consultada

Referencia oficial revisada: https://developers.flow.cl/en/api

Puntos confirmados para el plan:

- `payment/create` crea una orden de pago y recibe, entre otros, `apiKey`, `commerceOrder`, `subject`, `currency`, `amount`, `email`, `urlConfirmation`, `urlReturn`, `optional`, `timeout` y `s`.
- La firma `s` se calcula con los parametros ordenados alfabeticamente y concatenados como `keyvalue`, usando HMAC-SHA256 con el secret.
- `payment/create` responde con `url` y `token`; la URL final de redireccion se arma como `url + "?token=" + token`.
- Flow notificara `urlConfirmation` enviando el `token`.
- El servidor debe consultar `payment/getStatus` con el `token` para obtener el estado real.

Nota: antes de codificar, confirmar en la misma documentacion vigente el mapping exacto de codigos numericos de estado Flow. El modelo local debe guardar `flow_status` crudo y solo mapear a estados internos con una tabla explicita validada contra sandbox.

## 3. Decision tecnica

### Elegido: Vercel Functions

Usar Vercel Functions para:

- `POST /api/flow/create-payment`
- `POST /api/flow/confirm`
- `GET /api/flow/order-status`

Justificacion:

- El proyecto ya esta desplegado en Vercel.
- Flow necesita un `urlConfirmation` publico y estable; Vercel Functions lo entrega directo bajo el mismo dominio.
- No cambia el router ni la arquitectura de TanStack.
- No obliga a mover logica a Supabase Edge Functions ni a operar un segundo deploy surface.
- Permite guardar secrets server-side en Vercel sin exponerlos en `VITE_*`.
- Permite usar `SUPABASE_SERVICE_ROLE_KEY` solo dentro de endpoints server-side para crear y actualizar ordenes sin abrir RLS al cliente.

Alternativas descartadas:

- TanStack server functions: utiles para RPC app-cliente, pero no son la opcion mas limpia para un webhook publico de Flow y podrian acoplar el pago al router/app.
- Supabase Edge Functions: tecnicamente validas, pero agregan otro runtime y otro proceso de deploy/secrets. Convienen solo si se decide centralizar pagos en Supabase fuera de Vercel.

## 4. Arquitectura recomendada

### Frontend

- Mantener `CartProvider` y `localStorage`.
- Mantener WhatsApp como alternativa.
- Mantener `payment_url` como fallback para un unico producto.
- Agregar boton "Pagar con Flow" para carritos con uno o mas productos.
- Enviar a `/api/flow/create-payment`:
  - `items`: `productId`, `quantity`.
  - `customer`: `name`, `email`, `phone`, `comment`.
  - No enviar total como fuente de verdad.
- Redirigir a la URL devuelta por el backend.
- Crear/usar una ruta de retorno, por ejemplo `/checkout/resultado?order=<commerceOrder>`.
- En la ruta de retorno, consultar estado local; nunca marcar pagado desde React.

### Vercel Functions

- Validar metodo HTTP.
- Validar forma del body.
- Consultar productos en Supabase con `service_role`.
- Recalcular precio, moneda y total desde DB.
- Validar productos activos, cantidades y disponibilidad.
- Crear `orders` en estado `pending`.
- Crear `order_items` con snapshot de precio/nombre.
- Firmar request a Flow server-side.
- Llamar `payment/create`.
- Guardar `flow_token`, `flow_url`, `commerce_order`, `flow_status` si aplica.
- Devolver solo `redirectUrl` y `orderId`/`commerceOrder` publico.

### Supabase

- Mantener `products` como fuente de verdad.
- Agregar `orders` y `order_items`.
- Mantener RLS activa.
- No permitir que cliente actualice estados de pago.
- Permitir lectura limitada de orden por owner o por `public_lookup_token` si se soporta checkout invitado.

## 5. Tablas nuevas necesarias

### `orders`

Campos recomendados:

- `id uuid primary key default gen_random_uuid()`
- `commerce_order text not null unique`
- `user_id uuid null references auth.users(id)`
- `status text not null`
- `currency text not null default 'CLP'`
- `subtotal numeric(12,2) not null`
- `discount_total numeric(12,2) not null default 0`
- `shipping_total numeric(12,2) not null default 0`
- `tax_total numeric(12,2) not null default 0`
- `total numeric(12,2) not null`
- `customer_name text not null`
- `customer_email text not null`
- `customer_phone text null`
- `customer_comment text null`
- `flow_token text null unique`
- `flow_url text null`
- `flow_status text null`
- `flow_raw_status jsonb null`
- `paid_at timestamptz null`
- `confirmed_at timestamptz null`
- `failed_at timestamptz null`
- `expires_at timestamptz null`
- `public_lookup_token uuid not null default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Restricciones:

- `status in ('pending','redirected','paid','failed','cancelled','expired')`.
- `total >= 0`.
- `currency = 'CLP'` mientras el catalogo opere solo en CLP.

### `order_items`

Campos recomendados:

- `id uuid primary key default gen_random_uuid()`
- `order_id uuid not null references public.orders(id) on delete cascade`
- `product_id uuid not null references public.products(id)`
- `product_name text not null`
- `product_slug text not null`
- `unit_price numeric(12,2) not null`
- `quantity integer not null`
- `subtotal numeric(12,2) not null`
- `currency text not null default 'CLP'`
- `created_at timestamptz not null default now()`

Restricciones:

- `quantity > 0`.
- `unit_price >= 0`.
- `subtotal = unit_price * quantity` si se implementa como generated column o check viable.
- Indice por `order_id`.
- Indice por `product_id`.

## 6. Estados de orden recomendados

- `pending`: orden creada localmente antes de llamar Flow.
- `redirected`: Flow creo pago y se guardo `flow_token`; usuario puede ser redirigido.
- `paid`: confirmado server-side tras `payment/getStatus`.
- `failed`: Flow informa rechazo/error definitivo.
- `cancelled`: pago cancelado por usuario o estado equivalente confirmado.
- `expired`: timeout o estado vencido confirmado.

Regla critica: `paid` solo se asigna desde `/api/flow/confirm` o un proceso server-side que consulte Flow. Nunca desde la return URL.

## 7. Variables de entorno necesarias

En Vercel, server-side:

- `FLOW_API_KEY`
- `FLOW_SECRET_KEY`
- `FLOW_BASE_URL=https://sandbox.flow.cl/api`
- `FLOW_RETURN_URL=https://<dominio>/checkout/resultado`
- `FLOW_CONFIRMATION_URL=https://<dominio>/api/flow/confirm`
- `APP_PUBLIC_URL=https://<dominio>`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY` si algun endpoint necesita validar JWT de usuario

En frontend, mantener solo variables publicas actuales:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Prohibido:

- `VITE_FLOW_SECRET_KEY`
- `VITE_FLOW_API_KEY`
- cualquier secret Flow o service role con prefijo publico.

## 8. Endpoints necesarios

### `POST /api/flow/create-payment`

Entrada:

- `items: { productId: string; quantity: number }[]`
- `customer: { name: string; email: string; phone?: string; comment?: string }`

Responsabilidad:

- Validar body.
- Recalcular carrito desde `products`.
- Crear `orders` + `order_items`.
- Firmar y llamar `payment/create`.
- Guardar token/url de Flow.
- Responder `{ redirectUrl, commerceOrder }`.

Errores esperados:

- `400`: carrito vacio, cantidades invalidas, producto inexistente/inactivo.
- `409`: producto no disponible o conflicto de estado.
- `500`: error interno o Flow no disponible, sin filtrar secrets.

### `POST /api/flow/confirm`

Entrada esperada:

- `token` enviado por Flow segun documentacion oficial.

Responsabilidad:

- Validar presencia de `token`.
- Consultar `payment/getStatus` server-side.
- Buscar `orders.flow_token`.
- Comparar `commerce_order`, monto y moneda si Flow los entrega en respuesta.
- Actualizar estado local idempotentemente.
- Responder a Flow con status HTTP claro.

Regla:

- Si la orden ya esta `paid`, no reprocesar stock, email ni fulfillment.

### `GET /api/flow/order-status`

Entrada:

- `commerceOrder` + `public_lookup_token`, o un identificador publico equivalente.

Responsabilidad:

- Devolver estado local seguro para la pagina de retorno.
- No consultar secrets desde cliente.
- No exponer datos de otros clientes.

## 9. Cambios requeridos en checkout

- Mantener validacion Zod del formulario.
- Agregar accion `handleFlowPayment`.
- Construir payload con `productId` y `quantity`; no mandar total confiable.
- Deshabilitar boton mientras se crea el pago.
- Mostrar error si el backend rechaza el carrito.
- Redirigir con `window.location.href = redirectUrl`.
- Mantener boton WhatsApp.
- Mantener boton `payment_url` externo para un solo producto como fallback.
- Cambiar el mensaje de varios productos: ya no debe forzar WhatsApp si Flow esta disponible; debe ofrecer Flow dinamico y WhatsApp.
- No limpiar carrito al iniciar pago. Limpiarlo solo cuando estado local sea `paid` o cuando el usuario confirme que quiere abandonar.

## 10. Flujo exacto de pago

1. Usuario agrega productos al carrito.
2. Carrito persiste en `localStorage`.
3. Usuario entra a `/checkout` y completa datos.
4. React valida datos basicos.
5. React llama `POST /api/flow/create-payment` con ids/cantidades/datos cliente.
6. Vercel Function consulta `products` desde Supabase con `service_role`.
7. Backend valida que cada producto exista, este activo y tenga disponibilidad valida.
8. Backend recalcula total.
9. Backend crea `orders` en `pending`.
10. Backend crea `order_items`.
11. Backend llama `payment/create` en sandbox Flow.
12. Backend guarda `flow_token`, `flow_url` y cambia estado a `redirected`.
13. Backend responde `redirectUrl`.
14. Browser redirige a Flow.
15. Flow procesa pago.
16. Flow llama `POST /api/flow/confirm` con `token`.
17. Confirm endpoint llama `payment/getStatus` server-side.
18. Confirm endpoint actualiza la orden segun estado real.
19. Usuario vuelve a `FLOW_RETURN_URL`.
20. React consulta `GET /api/flow/order-status`.
21. UI muestra `paid`, `pending/redirected`, `failed`, `cancelled` o `expired`.
22. Carrito se limpia solo si la orden local esta `paid`.

## 11. Riesgos de seguridad

- `localStorage` puede ser manipulado: no confiar en precios, nombres, moneda ni total.
- `payment_url` debe coexistir pero no debe usarse para inferir pago completado.
- `SUPABASE_SERVICE_ROLE_KEY` en Vercel permite bypass RLS: usar solo en endpoints server-side, nunca en archivos cliente ni imports compartidos.
- RLS de `orders` debe impedir updates desde cliente.
- Return URL no prueba pago: solo es navegacion de usuario.
- Webhook/confirmation puede repetirse: implementar idempotencia.
- Logs no deben imprimir `FLOW_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, firmas ni tokens completos.
- Si se acepta checkout invitado, la lectura de estado requiere `public_lookup_token` no adivinable.
- Si se descuenta stock en el futuro, debe ocurrir idempotentemente despues de confirmacion o reservarse antes con expiracion.

## 12. Plan de pruebas sandbox

### Preparacion

- Configurar credenciales sandbox en Vercel.
- Configurar `FLOW_CONFIRMATION_URL` apuntando al deployment publico.
- Configurar `FLOW_RETURN_URL` apuntando a `/checkout/resultado`.
- Confirmar que Vercel Functions reciben trafico publico.

### Casos funcionales

1. Carrito de un producto sin `payment_url`: crea pago Flow.
2. Carrito de un producto con `payment_url`: muestra Flow y fallback externo.
3. Carrito multiproducto: crea una orden con varios `order_items`.
4. Retorno antes del webhook: UI muestra pendiente.
5. Webhook confirmado: orden pasa a `paid`; retorno muestra pagado.
6. Pago rechazado/cancelado/vencido: orden refleja estado no pagado.

### Casos de seguridad

1. Manipular precio en `localStorage`: backend cobra precio real de Supabase.
2. Manipular cantidad negativa/cero: backend rechaza.
3. Producto inactivo en carrito: backend rechaza.
4. Producto inexistente: backend rechaza.
5. Repetir webhook con mismo token: no duplica efectos.
6. Llamar `order-status` de otra orden sin token publico: denegado.
7. Secrets faltantes: endpoint falla controlado sin filtrar valores.

### Evidencia minima antes de pasar a produccion

- Logs Vercel sin secrets.
- Orden `pending -> redirected -> paid` en Supabase.
- `order_items` coincide con precios actuales de `products`.
- `payment_url` antiguo sigue funcionando.
- WhatsApp sigue funcionando.

## 13. Fases de implementacion

### Fase 1: Preparacion DB

Estado: implementada localmente.

- Migracion creada: `supabase/migrations/20260705225916_orders_flow_api_phase_1.sql`.
- Crea `public.orders` y `public.order_items`.
- Define constraints, indices, trigger `updated_at`, grants y RLS.
- Lectura cliente limitada a ordenes propias o admin.
- Escritura directa desde `anon`/`authenticated` denegada; futuras Vercel Functions deberan usar `service_role` solo server-side.
- Tipos Supabase no regenerados: no hay comando local seguro documentado para generarlos.
- Checkout, endpoints Flow, webhook y frontend siguen pendientes.

### Fase 2: Endpoints server-side

Estado: implementada localmente.

- Creados `api/flow/create-payment.ts`, `api/flow/confirm.ts` y `api/flow/order-status.ts`.
- Creados helpers server-only bajo `src/server/flow/` para HTTP, env, firma Flow, Supabase admin y recalculo de carrito.
- `create-payment` valida payload, recalcula productos desde `public.products`, crea `orders`/`order_items`, llama `payment/create` y guarda `flow_token`/`flow_url`.
- `confirm` recibe token, consulta `payment/getStatus`, compara monto/moneda/commerceOrder y actualiza estado con idempotencia basica.
- `order-status` expone estado acotado con `commerceOrder` + `publicLookupToken`.
- Documentacion de pruebas: `docs/FLOW-FASE-2-ENDPOINTS.md`.
- Pendiente operativo: configurar variables server-side en Vercel y probar sandbox real.

### Fase 3: Checkout frontend

- Agregar boton Flow en `/checkout`.
- Mantener WhatsApp y `payment_url`.
- Agregar estados loading/error.
- Crear `/checkout/resultado`.

### Fase 4: Seguridad e idempotencia

- Endurecer RLS.
- Probar webhook duplicado.
- Validar no exposicion de secrets en build.
- Revisar logs.

### Fase 5: QA sandbox y documentacion

- Ejecutar plan de pruebas.
- Documentar variables.
- Documentar paso a produccion.
- Actualizar `docs/DEPLOY-VERCEL.md` y estado del proyecto.

## 14. Archivos a tocar en una implementacion futura

Documentacion:

- `docs/PLAN-INTEGRACION-FLOW-API.md`
- `docs/DEPLOY-VERCEL.md`
- `docs/ESTADO-ACTUAL-TEMPLATE.md`

Migraciones:

- `supabase/migrations/<timestamp>_orders_flow.sql`

Backend:

- `api/flow/create-payment.ts`
- `api/flow/confirm.ts`
- `api/flow/order-status.ts`
- `src/server/flow/*` o equivalente server-only
- `src/server/orders/*` o equivalente server-only

Frontend:

- `src/routes/checkout.tsx`
- nueva ruta `src/routes/checkout.resultado.tsx` o equivalente segun naming de TanStack Router
- tipos de orden si se agregan en `src/types/`

No tocar:

- `src/routes/_authenticated/route.tsx`
- router/arquitectura base
- sistema actual `payment_url`
- Supabase/Lovable como backend principal
- Mercado Pago

## 15. Cierre sandbox 2026-07-06

Estado: implementado el cierre de Flow API sandbox en Vercel.

Cambios clave:

- `POST /api/flow/create-payment` ahora construye `urlReturn` usando `FLOW_RETURN_URL` y agrega `commerceOrder`, `publicLookupToken` y `lookup`.
- La return URL exacta enviada a Flow queda:

```text
https://tienda-orbynexdigital.vercel.app/checkout/resultado?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>&lookup=<TOKEN_PUBLICO>
```

- `GET /api/flow/order-status` acepta `publicLookupToken`, `lookup` o `public_lookup_token`.
- Se creo `/checkout/resultado`.
- La ruta de resultado consulta `order-status`, muestra `paid`, `pending`, `failed`, `cancelled` o `expired`, y limpia el carrito solo si `status = paid`.
- WhatsApp checkout y `payment_url` externo se mantienen sin cambios.
- No se agregaron tablas, migraciones ni cambios RLS.
- No se tocaron `ProductForm`, admin ni `src/routes/_authenticated/route.tsx`.

Variables correctas para Vercel sandbox:

```text
APP_PUBLIC_URL=https://tienda-orbynexdigital.vercel.app
FLOW_RETURN_URL=https://tienda-orbynexdigital.vercel.app/checkout/resultado
FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.vercel.app/api/flow/confirm
```

Si aparece `*.lovable.app` en el retorno, actualizar esas variables en Vercel Environment Variables y hacer redeploy.
