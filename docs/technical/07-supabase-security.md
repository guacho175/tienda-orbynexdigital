# 07 - Seguridad y Politicas de Acceso en Supabase

Este documento resume el estado vigente de RLS, grants y funciones Supabase.

## Roles

| Rol             | Uso                    | Acceso                                                   |
| --------------- | ---------------------- | -------------------------------------------------------- |
| `anon`          | Cliente publico        | Lectura de productos activos.                            |
| `authenticated` | Usuario logueado/admin | Lectura propia; admin obtiene permisos por `user_roles`. |
| `service_role`  | Backend/API            | Acceso total desde entorno server-side.                  |

## Politicas RLS Vigentes

### `public.user_roles`

- `authenticated` solo lee sus propios roles.
- Politica optimizada con `(SELECT auth.uid())`.

### `public.products`

Politica SELECT consolidada:

- `anon` y `authenticated` pueden leer productos activos.
- admins autenticados pueden leer todo.

Politicas admin separadas:

- insert;
- update;
- delete.

Todas las comprobaciones admin usan `public.user_roles` y `(SELECT auth.uid())`.

### `public.orders`

Politica SELECT consolidada:

- usuario autenticado ve sus propias ordenes;
- admin ve todas.

No hay insert/update/delete directos para clientes.

### `public.order_items`

Politica SELECT consolidada:

- usuario autenticado ve items de sus propias ordenes;
- admin ve todos.

No hay insert/update/delete directos para clientes.

### `public.stock_reservations`

- RLS activo.
- Sin politicas publicas.
- Manipulacion solo por backend/RPC.

### `public.product_audit_events`

- Solo admins pueden leer.
- Solo admins pueden insertar eventos propios.

### `public.stock_movements`

- Solo admins pueden leer.
- Solo admins pueden insertar movimientos manuales (`manual_adjustment`, `manual_return`, `manual_correction`) desde source `admin`.

## Funciones RPC

### RPCs criticas de checkout

Usan permisos restringidos y se ejecutan desde backend:

- `create_order_with_stock_reservation`
- `confirm_order_payment_and_capture_stock`
- `release_order_stock_reservations`
- `expire_stock_reservations`

### RPC admin de inventario

`adjust_product_stock_admin`:

- `SECURITY INVOKER`;
- ejecutable por `authenticated`;
- depende de RLS admin para permitir o rechazar;
- actualiza producto e inserta movimiento en una sola operacion.

## Advisors Supabase

Ultima correccion aplicada:

- `20260709232902_optimize_rls_policies_advisors.sql`

Resultado:

- `supabase db lint --schema public --fail-on none`: sin errores.
- `supabase db advisors --type all --level warn --fail-on none`: sin issues.

## Reglas Que No Se Deben Romper

- No exponer `service_role` en frontend.
- No desactivar RLS.
- No crear politicas de escritura directa en `orders`, `order_items` ni `stock_reservations`.
- No usar `auth.role()` en nuevas politicas.
- En nuevas politicas usar `TO authenticated`/`TO anon` y `(SELECT auth.uid())`.
- Toda tabla nueva en `public` debe tener RLS y grants explicitos.
