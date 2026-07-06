# Flow API - Fase 3: resultado de checkout

Fecha: 2026-07-06  
Estado: implementado para sandbox en Vercel.

## Estado actual exacto

El flujo Flow API queda cerrado para sandbox:

1. `/checkout` envia ids de productos, cantidades y datos del cliente a `POST /api/flow/create-payment`.
2. El backend recalcula productos desde Supabase, crea `orders` y `order_items`, llama `payment/create` y devuelve `redirectUrl`.
3. El carrito no se limpia al iniciar Flow.
4. `create-payment` envia a Flow una `urlReturn` por orden:

```text
https://tienda-orbynexdigital.vercel.app/checkout/resultado?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>&lookup=<TOKEN_PUBLICO>
```

5. Flow redirige al cliente a `/checkout/resultado`.
6. `/checkout/resultado` consulta:

```text
/api/flow/order-status?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>
```

7. La pantalla muestra `paid`, `pending`, `failed`, `cancelled` o `expired`.
8. El carrito solo se limpia cuando `order-status` devuelve `status = paid`.
9. `POST /api/flow/confirm` recibe el `token` de Flow, consulta `payment/getStatus` server-side y actualiza la orden idempotentemente.

## Variables esperadas en Vercel

Server-side:

```text
FLOW_API_KEY=
FLOW_SECRET_KEY=
FLOW_BASE_URL=https://sandbox.flow.cl/api
FLOW_RETURN_URL=https://tienda-orbynexdigital.vercel.app/checkout/resultado
FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.vercel.app/api/flow/confirm
APP_PUBLIC_URL=https://tienda-orbynexdigital.vercel.app
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PUBLISHABLE_KEY=
```

Frontend publicas:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

No crear ni cargar:

```text
VITE_FLOW_API_KEY
VITE_FLOW_SECRET_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY
```

Si el retorno vuelve a `*.lovable.app`, revisar y corregir en Vercel Environment Variables:

- `APP_PUBLIC_URL`
- `FLOW_RETURN_URL`
- `FLOW_CONFIRMATION_URL`

Despues de cambiarlas, hacer redeploy.

## Como probar pago sandbox

1. Abrir `https://tienda-orbynexdigital.vercel.app/checkout` con productos en el carrito.
2. Completar nombre, email y telefono.
3. Click en `Pagar con Flow`.
4. Confirmar que el navegador redirige a Flow sandbox.
5. Completar pago sandbox.
6. Confirmar retorno a:

```text
https://tienda-orbynexdigital.vercel.app/checkout/resultado?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>&lookup=<TOKEN_PUBLICO>
```

7. En la pantalla de resultado, usar `Actualizar estado` si el webhook aun no termino.

## Como revisar orders en Supabase

```sql
select
  commerce_order,
  status,
  total,
  flow_status,
  paid_at,
  confirmed_at,
  failed_at,
  created_at
from public.orders
order by created_at desc
limit 10;
```

Para verificar que el webhook actualizo `paid`, buscar la ultima orden y confirmar:

- `status = 'paid'`
- `flow_status = '2'`
- `paid_at is not null`
- `confirmed_at is not null`

## Como verificar admin

```sql
select u.email, r.role
from public.user_roles r
join auth.users u on u.id = r.user_id
where u.email = 'galindez175@gmail.com';
```

Si no tiene rol:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'galindez175@gmail.com'
on conflict (user_id, role) do nothing;
```

## Como confirmar que el carrito solo se limpia con paid

1. Antes de pagar, confirmar que `localStorage.shop_cart_v1` tiene items.
2. Click en `Pagar con Flow`: el carrito debe seguir en `localStorage`.
3. Si `/checkout/resultado` muestra `pending`, `failed`, `cancelled` o `expired`, el carrito debe seguir intacto.
4. Cuando `/api/flow/order-status` devuelve `paid`, la pantalla ejecuta `clear()` y `localStorage.shop_cart_v1` queda como `[]`.

## Logs

En Vercel revisar:

- Requests a `POST /api/flow/create-payment`.
- Requests a `POST /api/flow/confirm`.
- Requests a `GET /api/flow/order-status`.

Los logs no deben imprimir `FLOW_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, firmas ni tokens completos.

## Pendiente antes de produccion real

- Cambiar `FLOW_BASE_URL` a produccion solo con credenciales productivas.
- Confirmar `APP_PUBLIC_URL`, `FLOW_RETURN_URL` y `FLOW_CONFIRMATION_URL` del dominio productivo.
- Ejecutar pago real controlado de bajo monto.
- Confirmar conciliacion de `orders` con Flow.
- Definir politica de stock/fulfillment si se agregan descuentos de stock, emails o facturacion.
