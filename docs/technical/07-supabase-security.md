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

La ruta `/admin/orders` usa el cliente Supabase normal y depende de estas politicas RLS. No usa
`service_role`, no consulta tokens internos de Flow y no agrega permisos de escritura sobre
`orders` ni `order_items`.

La ruta `/admin/users` consume `api/admin/users.ts`. Ese endpoint usa cliente admin solo en
backend para listar usuarios Auth y agregar compras; antes valida `auth.getUser(jwt)` y exige una
fila `user_roles.role = 'admin'` para el solicitante. La respuesta no incluye tokens de Flow,
`flow_raw_status`, `flow_token`, metadata cruda de Auth ni llaves de servidor.

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

## Validacion de identidad y cache de rol admin

- La ruta protegida padre `src/routes/_authenticated/route.tsx` mantiene
  `supabase.auth.getUser()` como validacion autoritativa de identidad. No se reemplaza por
  `getSession()`, lectura de `localStorage`, cookies sin validar ni claims decodificados en cliente.
- Las rutas hijas administrativas reutilizan el `user` ya validado por la ruta padre. La ruta
  `src/routes/_authenticated/admin.tsx` no vuelve a llamar `getUser()`.
- El servicio `src/services/admin-access.service.ts` consulta solo la existencia del rol `admin` en
  `user_roles` para el `user_id` recibido, seleccionando unicamente `role`, filtrando por
  `user_id` y `role = 'admin'`, y limitando la respuesta a una fila.
- React Query cachea la comprobacion de rol con clave `["admin-access", user.id]`,
  `staleTime: 60_000`, `gcTime: 300_000` y `retry: 1`. Esta cache es una optimizacion de interfaz,
  no una barrera de seguridad.
- Si la consulta de rol falla o no devuelve rol admin, el acceso se cierra por defecto y la UI
  conserva el destino actual para usuarios sin permisos.
- RLS sigue siendo la autorizacion definitiva para lectura y escritura de datos. Una revocacion de
  rol puede tardar hasta 60 segundos en reflejarse en la visibilidad de la interfaz, pero las
  operaciones contra Supabase quedan bloqueadas inmediatamente por las politicas RLS vigentes.
- Al cerrar sesion se limpia la cache de React Query. Al iniciar sesion o actualizar usuario se
  invalida explicitamente `["admin-access"]` junto con las consultas dependientes de usuario.
- La vista `/cuenta` puede mostrar un boton hacia `/admin` si `["admin-access", user.id]` devuelve
  rol admin. Ese boton es solo navegacion; no reemplaza la proteccion de ruta ni RLS.

## API admin server-only de usuarios

- `api/admin/users.ts` requiere `Authorization: Bearer <access_token>`.
- El access token se valida con Supabase Auth mediante `auth.getUser(jwt)`.
- La autorizacion de administrador se comprueba contra `public.user_roles`, no contra metadata de
  usuario ni claims editables.
- `auth.admin.listUsers()` se ejecuta solamente en servidor con variables `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY`.
- Los filtros avanzados pueden escanear hasta 500 usuarios iniciales para no hacer barridos
  indefinidos. Si la base crece, se debe migrar a una tabla `profiles`/`customers` indexada o a una
  vista segura no expuesta.
- La conciliacion de `status = 'redirected'` se mantiene como diagnostico. No hay migracion ni
  boton de cancelacion masiva que cambie estados sin consultar primero Flow.
