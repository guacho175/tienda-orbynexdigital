# Plan maestro: usuarios/clientes admin y conciliacion de pagos iniciados antiguos

Fecha: 2026-07-13
Estado: plan aprobado para ejecucion posterior, sin codigo aplicado en esta pasada.

## 1. Objetivo

Crear una seccion admin de usuarios/clientes que permita ver informacion util de usuarios autenticados y clientes compradores, sin exponer `auth.users` al frontend ni romper RLS, Flow, checkout, WhatsApp, `payment_url`, reservas o confirmacion de pagos.

Tambien dejar definido el tratamiento correcto para ordenes antiguas con estado `redirected` / `Pago iniciado` que ya superaron la ventana operativa y no quedaron en `paid`, `failed`, `cancelled`, `expired` o `reservation_expired`.

## 2. Aclaracion tecnica: estado `Pago iniciado`

En el codigo actual, `Pago iniciado` corresponde a `orders.status = 'redirected'`.

Flujo vigente:

- `createPaymentWorkflow()` crea la orden y llama la RPC `create_order_with_stock_reservation`.
- La reserva Flow se fija en 10 minutos (`p_reservation_minutes: 10` y migracion que fuerza 10 minutos).
- Si Flow crea el pago correctamente, la orden pasa a `redirected`.
- Si Flow confirma pago, `confirmPaymentWorkflow()` debe llevar la orden a `paid`.
- Si Flow informa fallo/cancelacion/expiracion, `confirmPaymentWorkflow()` debe liberar reservas y marcar `failed`, `cancelled` o `expired`.
- `expire_stock_reservations()` marca reservas activas vencidas como `expired` y ordenes `pending`, `stock_reserved` o `redirected` como `reservation_expired`.
- El endpoint `api/stock/expire-reservations.ts` ejecuta esa expiracion por cron usando `CRON_SECRET`.

Conclusion:

- `redirected` es un estado transicional, no deberia quedar por dias.
- La ventana normal esperada es alrededor de 10 minutos para ordenes con reserva.
- Una orden en `redirected` desde dias anteriores es deuda historica o evidencia de que la expiracion/confirmacion no corrio para ese caso.
- Corregir historicos con migracion controlada es mejor que agregar primero un boton manual de cancelar, porque evita dejar datos viejos incoherentes y mantiene la UI operativa limpia.
- Aun asi, antes de cambiar historicos hay que confirmar si Flow recibio pago para esas ordenes. Si existe `flow_token`, lo mas seguro es consultar `payment/getStatus` desde servidor antes de decidir.

## 3. Decision recomendada para los 5 registros antiguos

No actualizar masivamente todos los `redirected` antiguos a ciegas.

Orden recomendado:

1. Crear una conciliacion server-side que lea ordenes `redirected` vencidas.
2. Si tienen `flow_token`, consultar Flow `payment/getStatus`.
3. Si Flow responde pagado, pasar por el flujo de confirmacion existente para llegar a `paid`, `stock_conflict` o `requires_manual_review`.
4. Si Flow responde rechazado/cancelado, liberar reservas y marcar `failed` o `cancelled`.
5. Si Flow sigue pendiente pero la orden esta fuera de ventana, marcar `reservation_expired` solo si no hay evidencia de pago.
6. Para registros muy antiguos sin `flow_token`, usar migracion de backfill a `reservation_expired` con comentario en `flow_raw_status`.

## 4. Arquitectura objetivo de usuarios/clientes

### 4.1 Ruta admin nueva

- URL: `/admin/users`
- Archivo probable: `src/routes/_authenticated/admin.users.tsx`
- Debe vivir bajo `/_authenticated/admin`, reutilizando:
  - `supabase.auth.getUser()` de la ruta protegida padre;
  - `getAdminAccess(user.id)`;
  - `AdminShell`;
  - RLS como barrera final para datos comerciales.

### 4.2 Servicio server-side obligatorio

No consultar `auth.users` desde el navegador.

Crear endpoint server-side:

- `api/admin/users.ts`
- Metodo: `GET`
- Requiere `Authorization: Bearer <access_token>`
- Valida token con Supabase Auth en servidor.
- Verifica rol admin consultando `public.user_roles`.
- Usa `supabase.auth.admin.listUsers()` solo en servidor.
- Agrega informacion comercial desde `orders` y `order_items`.
- Devuelve solo campos necesarios al frontend.

Referencia oficial: `auth.admin.listUsers()` debe llamarse solo desde servidor y nunca exponer `service_role` en navegador.

### 4.3 Servicio frontend

- Archivo: `src/services/admin-users.service.ts`
- Llama `GET /api/admin/users`.
- Obtiene access token desde `supabase.auth.getSession()`.
- No importa `client.server.ts`.
- No usa `service_role`.

## 5. Que datos mostrar en usuarios/clientes

### 5.1 Campos de identidad seguros

Desde Supabase Auth, devolver solo:

- `id`
- `email`
- `created_at`
- `last_sign_in_at`
- `email_confirmed_at` o estado de confirmacion
- proveedor principal si esta disponible sin exponer tokens
- rol interno (`admin` o `user`) desde `public.user_roles`

No devolver:

- tokens;
- identities completas si incluyen datos excesivos;
- `raw_user_meta_data` completo;
- `raw_app_meta_data` completo;
- factores MFA detallados;
- informacion sensible de sesiones.

### 5.2 Campos comerciales utiles

Agregados desde `orders`:

- total de pedidos asociados por `user_id`;
- total gastado en pedidos `paid`;
- cantidad de pedidos pagados;
- cantidad de pedidos pendientes/transicionales;
- cantidad de pedidos con revision manual o conflicto de stock;
- ultima compra;
- primer pedido;
- ultimo estado de pedido;
- correos de compra usados en pedidos, limitados y normalizados;
- pedidos invitados vinculables por email confirmado si aplica.

### 5.3 Clasificacion util para operar

Mostrar badges o filtros:

- `Admin`
- `Cliente registrado`
- `Cliente con compras`
- `Sin compras`
- `Correo pendiente`
- `Tiene pedidos en revision`
- `Tiene pagos iniciados vencidos`

## 6. Vista admin esperada

### 6.1 Listado

La vista `/admin/users` debe incluir:

- buscador por email;
- filtro por rol;
- filtro por estado de correo confirmado;
- filtro por clientes con compras;
- filtro por usuarios con pedidos en revision;
- paginacion;
- tabla desktop;
- tarjetas mobile;
- estado loading/error/vacio.

Columnas sugeridas:

- Usuario
- Rol
- Correo
- Registro
- Ultimo acceso
- Compras pagadas
- Total gastado
- Ultima compra
- Alertas

### 6.2 Detalle expandible

Por usuario:

- resumen de cuenta;
- ultimos pedidos asociados;
- totales;
- pedidos en `redirected` antiguos si existen;
- pedidos en `requires_manual_review` o `stock_conflict`;
- correo confirmado o pendiente;
- link a `/admin/orders` con filtro por email o usuario.

No agregar en primera fase:

- eliminar usuarios;
- cambiar emails;
- resetear contrasenas;
- promover o degradar roles;
- impersonation;
- exportaciones masivas.

## 7. Conciliacion de `redirected` antiguos

### 7.1 Diagnostico previo obligatorio

Crear reporte SQL de solo lectura:

```sql
select
  id,
  commerce_order,
  status,
  flow_status,
  flow_token is not null as has_flow_token,
  created_at,
  expires_at,
  paid_at,
  confirmed_at,
  total,
  customer_email
from public.orders
where status = 'redirected'
  and created_at < now() - interval '30 minutes'
order by created_at asc;
```

### 7.2 Opcion recomendada: conciliador server-side

Crear endpoint admin temporal o script server-side:

- valida admin;
- lista ordenes `redirected` vencidas;
- consulta Flow cuando exista `flow_token`;
- reutiliza `confirmPaymentWorkflow()` o RPCs existentes;
- registra resultado;
- no expone token al frontend.

### 7.3 Migracion historica acotada

Solo para registros antiguos sin conciliacion posible:

- crear migracion con `npx supabase migration new reconcile_old_redirected_orders`;
- actualizar un conjunto acotado por fecha/estado;
- escribir marca en `flow_raw_status` con `source = 'historical_backfill'`;
- no tocar ordenes `paid`;
- no tocar ordenes con evidencia de pago;
- no tocar ordenes recientes.

Ejemplo conceptual, no ejecutar sin adaptar IDs/fechas:

```sql
update public.orders
set
  status = 'reservation_expired',
  confirmed_at = coalesce(confirmed_at, now()),
  flow_raw_status = coalesce(flow_raw_status, '{}'::jsonb)
    || jsonb_build_object(
      'source', 'historical_backfill',
      'reason', 'redirected older than reservation window without confirmed payment',
      'backfilled_at', now()
    )
where status = 'redirected'
  and paid_at is null
  and created_at < now() - interval '30 minutes';
```

## 8. Archivos permitidos para ejecucion posterior

Frontend:

- `src/components/admin/AdminShell.tsx`
- `src/routes/_authenticated/admin.users.tsx`
- `src/services/admin-users.service.ts`
- posibles componentes bajo `src/components/admin/users/`

Backend/API:

- `api/admin/users.ts`
- posible `api/admin/reconcile-orders.ts` si se aprueba conciliacion via endpoint
- posibles helpers bajo `src/server/admin/`

Docs:

- `docs/technical/03-domain-model.md`
- `docs/technical/07-supabase-security.md`
- `docs/technical/08-api-reference.md`
- `docs/technical/09-frontend-components.md`
- `docs/reports/REPORTE-USUARIOS-ADMIN-Y-CONCILIACION-2026-07-13.md`

Migraciones:

- solo si se aprueba backfill historico o indices.

## 9. Fases de implementacion

### Fase 0: preflight

- Confirmar `main`.
- Revisar working tree.
- Revisar rutas admin existentes.
- Revisar estado de ordenes `redirected` vencidas con consulta de solo lectura.
- No modificar datos.

### Fase 1: endpoint admin de usuarios

- Crear `api/admin/users.ts`.
- Validar token con `supabase.auth.getUser(token)`.
- Validar rol admin con `user_roles`.
- Llamar `auth.admin.listUsers()` server-side con paginacion.
- Agregar metricas por usuario desde `orders`.
- Devolver DTO seguro.

### Fase 2: servicio frontend

- Crear `src/services/admin-users.service.ts`.
- Consumir endpoint con token del usuario autenticado.
- Tipar filtros, paginacion y respuesta.

### Fase 3: vista `/admin/users`

- Crear ruta admin.
- Agregar tabla/tarjetas.
- Agregar filtros y detalle.
- Estados loading/error/vacio.

### Fase 4: navegacion

- Agregar `Usuarios` o `Clientes` a `AdminShell`.
- Orden sugerido:
  1. Productos
  2. Pedidos
  3. Clientes
  4. Analitica
  5. Auditoria
  6. Tienda

### Fase 5: conciliacion de pagos iniciados antiguos

- Primero diagnostico de solo lectura.
- Luego conciliador contra Flow para ordenes con token.
- Backfill SQL solo para casos sin pago confirmado.
- Registrar reporte con conteos antes/despues.

### Fase 6: documentacion y verificacion

- Actualizar docs tecnicas.
- Crear reporte.
- Ejecutar lint dirigido.
- Ejecutar build.
- Validar manualmente admin/no-admin.

## 10. Verificacion obligatoria

Comandos:

```powershell
.\node_modules\.bin\eslint.cmd src/routes/_authenticated/admin.users.tsx src/services/admin-users.service.ts src/components/admin/AdminShell.tsx
npm run build
rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role|auth.admin.listUsers|raw_user_meta_data|raw_app_meta_data" src api docs
```

Pruebas:

- Admin ve `/admin/users`.
- Usuario normal no accede.
- Frontend no contiene `service_role`.
- Endpoint no devuelve metadata sensible.
- Usuarios muestran totales correctos segun pedidos.
- Link desde usuario a pedidos conserva filtro por correo o usuario.
- Conciliacion no cambia ordenes pagadas.
- Ordenes antiguas `redirected` quedan en estado terminal correcto despues de diagnostico/aprobacion.

## 11. Definicion de terminado

- `/admin/users` existe y es solo admin.
- Los usuarios/clientes se listan con datos seguros y utiles.
- Se muestran metricas comerciales por usuario.
- No se expone `auth.users` ni service role al navegador.
- Las ordenes `redirected` antiguas tienen estrategia documentada y, si se ejecuta fase 5, quedan conciliadas con evidencia.
- `npm run build` pasa.
- Lint dirigido pasa o queda bloqueo documentado.
- Docs y reporte quedan actualizados.
