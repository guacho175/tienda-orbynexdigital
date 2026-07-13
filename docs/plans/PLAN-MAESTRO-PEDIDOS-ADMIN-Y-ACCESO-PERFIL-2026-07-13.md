# Plan maestro autoejecutable: pedidos en admin y acceso admin desde Mi Perfil

Fecha: 2026-07-13
Rama solicitada: `main`
Estado: plan aprobado para ejecucion posterior, sin codigo aplicado en esta pasada.

## 1. Objetivo

Implementar una seccion administrativa para ver pedidos, ordenes y compras registradas en Supabase, sin romper checkout Flow, WhatsApp checkout, reservas de stock, confirmacion de pagos, catalogo publico ni RLS.

Tambien agregar en la vista `Mi Perfil` un boton visible solo para usuarios con rol `admin`, que lleve al panel administrador. Ese boton sera solo una comodidad de navegacion: la autorizacion real debe seguir dependiendo de Supabase, `user_roles`, la ruta protegida y RLS.

## 2. Estado actual confirmado en el repo

- La rama actual esperada es `main`.
- La ruta protegida padre `src/routes/_authenticated/route.tsx` valida identidad con `supabase.auth.getUser()`.
- El layout admin `src/routes/_authenticated/admin.tsx` reutiliza el usuario de la ruta padre y consulta `getAdminAccess(user.id)` con cache React Query.
- `src/services/admin-access.service.ts` consulta `public.user_roles` filtrando `user_id` y `role = 'admin'`.
- `src/components/admin/AdminShell.tsx` ya centraliza la navegacion admin.
- Ya existen rutas admin para:
  - `/admin`
  - `/admin/analytics`
  - `/admin/audit`
  - `/admin/new`
  - `/admin/edit/$id`
- Ya existe `/cuenta` como perfil protegido de cliente.
- `src/routes/_authenticated/cuenta.tsx` ya muestra pedidos propios del usuario mediante `fetchCurrentUserOrders()`.
- `src/services/account-orders.service.ts` lee `orders` y `order_items` desde el cliente, bajo RLS.
- Ya existe `POST /api/account/link-orders` para asociar pedidos invitados a un usuario confirmado, usando servidor y RPC controlada.
- `public.orders` y `public.order_items` ya existen.
- RLS vigente:
  - usuarios autenticados leen sus propias ordenes;
  - administradores leen todas las ordenes;
  - clientes no escriben directamente en `orders` ni `order_items`.
- `public.stock_reservations` no tiene acceso publico directo.
- `AdminAnalytics` ya lee `orders` y `order_items` para metricas, pero no existe una vista operativa de pedidos.

## 3. Restricciones no negociables

- No desactivar RLS.
- No exponer `SUPABASE_SERVICE_ROLE_KEY` ni `service_role` en frontend.
- No agregar escrituras directas desde el cliente a `orders`, `order_items` ni `stock_reservations`.
- No tocar la logica de checkout Flow salvo que una verificacion demuestre una dependencia directa.
- No tocar WhatsApp checkout ni `payment_url`.
- No modificar confirmacion de pagos, reservas o captura de stock.
- No usar `user_metadata` para autorizacion.
- No usar `auth.role()` en nuevas politicas.
- No reabrir permisos publicos sobre funciones criticas.
- No mostrar datos sensibles innecesarios como `flow_token`, `flow_raw_status` completo o tokens internos en la tabla principal.
- No depender del boton de Perfil como barrera de seguridad.
- No corregir refactors ajenos al alcance aunque se detecten.
- No sobrescribir cambios previos no relacionados en el working tree.

## 4. Fuentes tecnicas a respetar

Referencias oficiales revisadas:

- Supabase changelog: https://supabase.com/changelog.md
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase `auth.getUser()`: https://supabase.com/docs/reference/javascript/auth-getuser

Notas relevantes para este plan:

- Supabase recomienda RLS en tablas de esquemas expuestos y grants explicitos.
- Las politicas deben usar `TO authenticated` y predicados concretos, no autorizacion solo por rol Postgres.
- `service_role` puede saltarse RLS y nunca debe estar en navegador.
- Para rendimiento RLS, conviene filtrar las consultas y tener indices en columnas usadas por politicas/filtros.

## 5. Arquitectura objetivo

### 5.1 Nueva experiencia admin

Ruta nueva:

- `/_authenticated/admin/orders` -> URL publica interna `/admin/orders`

La ruta debe quedar bajo el layout admin existente, por lo tanto hereda:

- validacion de sesion con `getUser()` desde `/_authenticated`;
- validacion de rol admin desde `/_authenticated/admin`;
- `AdminShell`;
- bloqueo visual para usuarios no admin.

La lectura de ordenes debe ocurrir desde el cliente Supabase normal, no con service role, aprovechando las politicas RLS admin ya existentes.

### 5.2 Boton admin en Mi Perfil

En `/cuenta`, dentro de la pestana o panel `Mi Perfil`, se agrega un boton:

- texto recomendado: `Ir al panel de administrador`
- destino: `/admin`
- visible solo si `getAdminAccess(user.id)` devuelve `true`
- oculto para usuarios normales, errores de consulta o estado desconocido

El boton no reemplaza la validacion de `/admin`.

## 6. Archivos permitidos para la ejecucion

### Frontend admin

- `src/components/admin/AdminShell.tsx`
- `src/routes/_authenticated/admin.orders.tsx`
- Posibles componentes nuevos:
  - `src/components/admin/orders/AdminOrdersFilters.tsx`
  - `src/components/admin/orders/AdminOrdersTable.tsx`
  - `src/components/admin/orders/AdminOrderDetail.tsx`
  - `src/components/admin/orders/AdminOrdersSkeleton.tsx`

### Servicios y tipos

- `src/services/admin-orders.service.ts`
- `src/services/admin-access.service.ts` solo si hay que reutilizar un helper existente sin cambiar su contrato
- `src/integrations/supabase/types.ts` solo si una migracion real cambia el esquema o si se regeneran tipos por una razon justificada

### Perfil

- `src/routes/_authenticated/cuenta.tsx`
- `src/config/account.config.ts`

### Documentacion posterior a la implementacion

- `docs/technical/03-domain-model.md`
- `docs/technical/07-supabase-security.md`
- `docs/technical/09-frontend-components.md`
- `docs/reports/REPORTE-PEDIDOS-ADMIN-Y-ACCESO-PERFIL-2026-07-13.md`

### Migraciones

Solo si se justifica por rendimiento o esquema faltante:

- `supabase/migrations/*`

Si se requiere una migracion, crearla con:

```powershell
npx supabase migration new <nombre_descriptivo>
```

No inventar manualmente el timestamp del archivo.

## 7. Fase 0: preflight obligatorio

### Acciones

1. Confirmar rama:

```powershell
git branch --show-current
```

Debe devolver `main`.

2. Revisar cambios existentes:

```powershell
git status --short
```

3. Si hay cambios previos no relacionados, no revertirlos. Trabajar alrededor de ellos.

4. Revisar estos archivos antes de editar:

```powershell
Get-Content -LiteralPath "src\routes\_authenticated\admin.tsx"
Get-Content -LiteralPath "src\components\admin\AdminShell.tsx"
Get-Content -LiteralPath "src\routes\_authenticated\cuenta.tsx"
Get-Content -LiteralPath "src\services\account-orders.service.ts"
Get-Content -LiteralPath "src\services\admin-access.service.ts"
Get-Content -LiteralPath "docs\technical\07-supabase-security.md"
```

### Criterio de salida

- Se entiende la proteccion actual de rutas.
- Se confirma que el cambio puede hacerse sin tocar checkout ni pagos.

## 8. Fase 1: servicio de lectura admin de pedidos

### Objetivo

Crear un servicio dedicado para listar pedidos como admin bajo RLS.

### Archivo nuevo

- `src/services/admin-orders.service.ts`

### Contrato sugerido

```ts
export type AdminOrderStatus =
  | "pending"
  | "stock_reserved"
  | "redirected"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "reservation_expired"
  | "stock_conflict"
  | "requires_manual_review";

export interface FetchAdminOrdersParams {
  page: number;
  pageSize: number;
  status?: AdminOrderStatus | "all";
  search?: string;
  from?: string;
  to?: string;
}

export interface AdminOrdersResult {
  orders: AdminOrder[];
  total: number;
}
```

### Campos permitidos en listado

Consultar solo lo necesario:

- `id`
- `commerce_order`
- `status`
- `currency`
- `subtotal`
- `discount_total`
- `shipping_total`
- `tax_total`
- `total`
- `customer_name`
- `customer_email`
- `customer_phone`
- `customer_comment`
- `created_at`
- `updated_at`
- `paid_at`
- `confirmed_at`
- `failed_at`
- `expires_at`
- `user_id`
- `order_items(id, product_id, product_name, product_slug, unit_price, quantity, subtotal, currency)`

### Campos excluidos por defecto

No cargar en listado:

- `flow_token`
- `flow_url`
- `flow_raw_status`
- `public_lookup_token`

Si despues se necesita depuracion de Flow, crear una vista de detalle controlada y justificarlo en otra fase. No mezclarlo en el primer listado operativo.

### Query base

El servicio debe:

- usar `supabase.from("orders")`;
- usar `select(..., { count: "exact" })`;
- ordenar por `created_at` descendente;
- paginar con `.range(from, to)`;
- filtrar por status si no es `all`;
- filtrar por fechas si vienen definidas;
- buscar por `commerce_order`, `customer_email` o `customer_name` con busqueda razonable.

### Importante sobre busqueda

No construir SQL ad hoc concatenando strings inseguros. Si se usa `.or(...)`, sanitizar comas y caracteres que rompan el filtro PostgREST o limitar la busqueda inicial a:

- `commerce_order.ilike.%term%`
- `customer_email.ilike.%term%`
- `customer_name.ilike.%term%`

Si hay duda, implementar primero busqueda por `commerce_order` y `customer_email`, y dejar busqueda avanzada para fase posterior.

### Criterios de aceptacion

- Usuario admin recibe ordenes paginadas.
- Usuario no admin no obtiene ordenes por RLS aunque intente llamar el servicio.
- No hay uso de `service_role` en este servicio.
- No hay escrituras a tablas de pedidos.
- Errores de Supabase se propagan como `Error` con mensaje legible.

## 9. Fase 2: ruta `/admin/orders`

### Objetivo

Crear una vista admin para revisar compras reales.

### Archivo nuevo

- `src/routes/_authenticated/admin.orders.tsx`

### UI minima esperada

La primera version debe incluir:

- encabezado con `AdminPageHeader`;
- etiqueta `Solo lectura`;
- resumen rapido:
  - total de pedidos filtrados;
  - cantidad visible en pagina;
  - total CLP de pedidos pagados visibles;
  - cantidad de pedidos que requieren revision manual;
- filtros:
  - texto de busqueda;
  - estado;
  - rango de fechas opcional;
  - boton limpiar;
- tabla desktop;
- tarjetas mobile;
- paginacion;
- estado loading;
- estado error con reintento;
- estado vacio.

### Columnas sugeridas

- Orden
- Cliente
- Estado
- Fecha
- Total
- Items
- Pago / revision

### Detalle de pedido

Incluir detalle dentro de la misma ruta usando accordion, drawer o panel expandible. Debe mostrar:

- datos del cliente;
- items comprados;
- totales;
- fechas relevantes;
- comentario del cliente si existe;
- estado de revision si `requires_manual_review` o `stock_conflict`.

No agregar acciones de cambio de estado en esta fase.

### Criterios de aceptacion

- `/admin/orders` carga dentro de `AdminShell`.
- La sidebar no se desmonta ni parpadea de forma distinta a las rutas admin existentes.
- En mobile no hay overflow horizontal incoherente.
- El admin puede encontrar una orden por numero o email.
- El admin puede distinguir orden pagada, fallida, expirada y revision manual.
- No se exponen tokens internos de Flow.

## 10. Fase 3: navegacion en `AdminShell`

### Objetivo

Agregar el nuevo item `Pedidos` al menu admin.

### Archivo

- `src/components/admin/AdminShell.tsx`

### Cambio

Agregar item a `ADMIN_NAV_ITEMS`:

```ts
{ label: "Pedidos", to: "/admin/orders", icon: ReceiptText }
```

Si `ReceiptText` no esta disponible en `lucide-react`, usar `ShoppingCart` o `ClipboardList`.

### Orden recomendado del menu

1. Productos
2. Pedidos
3. Analitica
4. Auditoria
5. Tienda

### Logica active

Agregar compatibilidad para:

- `/admin/orders`
- futuras rutas tipo `/admin/orders/$id` si despues se agregan

### Criterios de aceptacion

- Menu muestra `Pedidos`.
- El estado activo funciona en desktop y mobile.
- Los links existentes siguen funcionando.

## 11. Fase 4: boton admin en Mi Perfil

### Objetivo

Mostrar un boton hacia `/admin` solo cuando el usuario autenticado tiene rol admin.

### Archivos

- `src/routes/_authenticated/cuenta.tsx`
- `src/config/account.config.ts`

### Implementacion esperada

En `AccountPage`, reutilizar el usuario ya validado por `Route.useRouteContext()`.

Crear query:

```ts
const adminAccessQuery = useQuery({
  queryKey: ["admin-access", user.id],
  queryFn: () => getAdminAccess(user.id),
  staleTime: 60_000,
  retry: 1,
});
```

Pasar `isAdmin={adminAccessQuery.data === true}` a `ProfilePanel`.

En `ProfilePanel`, renderizar:

```tsx
{
  isAdmin ? (
    <Button asChild>
      <Link to="/admin">Ir al panel de administrador</Link>
    </Button>
  ) : null;
}
```

### Reglas

- No usar `useAdminAccess()` si eso duplica `supabase.auth.getUser()` dentro de `/cuenta`.
- No mostrar el boton mientras `isAdmin` sea `undefined`, `null`, `false` o error.
- No mostrar mensajes como "no eres admin" en perfil de usuario normal.
- No relajar la proteccion de `/admin`.

### Criterios de aceptacion

- Admin ve boton en Mi Perfil.
- Usuario normal no ve boton.
- Si un usuario normal fuerza `/admin`, sigue bloqueado.
- Si falla la consulta de rol, el boton no aparece.
- No se hacen llamadas duplicadas a `getUser()` desde el perfil.

## 12. Fase 5: validacion de seguridad Supabase

### Objetivo

Demostrar que la vista admin no filtra datos por error ni abre permisos nuevos.

### Verificaciones

1. Confirmar que no se agregaron grants de escritura a `orders` ni `order_items`.
2. Confirmar que no se modificaron RPCs de checkout:
   - `create_order_with_stock_reservation`
   - `confirm_order_payment_and_capture_stock`
   - `release_order_stock_reservations`
   - `expire_stock_reservations`
3. Confirmar que no se expuso `service_role` en archivos bajo `src/routes`, `src/components` o `src/services` cliente.
4. Confirmar que la lectura admin depende de RLS ya existente.
5. Confirmar que el boton de perfil depende de `user_roles`, no de metadata editable.

### Comandos sugeridos

```powershell
rg -n "service_role|SUPABASE_SERVICE_ROLE_KEY|flow_token|flow_raw_status|auth.role\\(|user_metadata" src api supabase docs
rg -n "orders|order_items|user_roles|getAdminAccess|getUser" src supabase docs
```

### Criterio de aceptacion

- No aparece ninguna exposicion nueva de secretos o tokens en frontend.
- No aparece ninguna politica insegura nueva.

## 13. Fase 6: actualizacion de documentacion viva

### Archivos

- `docs/technical/03-domain-model.md`
- `docs/technical/07-supabase-security.md`
- `docs/technical/09-frontend-components.md`
- `docs/reports/REPORTE-PEDIDOS-ADMIN-Y-ACCESO-PERFIL-2026-07-13.md`

### Cambios esperados

En `03-domain-model.md`:

- dejar claro que `orders` y `order_items` ahora tienen dos superficies:
  - perfil cliente;
  - vista admin solo lectura.

En `07-supabase-security.md`:

- registrar que `/admin/orders` usa RLS existente y no service role.
- registrar que el boton de perfil no es autorizacion.

En `09-frontend-components.md`:

- agregar la nueva ruta/vista admin.
- registrar el acceso desde `Mi Perfil`.

En reporte:

- listar archivos modificados;
- describir validaciones;
- anotar riesgos y pendientes.

## 14. Fase 7: verificacion tecnica

### Comandos obligatorios

Usar `pnpm`, porque el proyecto declara `packageManager`.

```powershell
pnpm exec eslint src/services/admin-orders.service.ts src/routes/_authenticated/admin.orders.tsx src/components/admin/AdminShell.tsx src/routes/_authenticated/cuenta.tsx src/config/account.config.ts
pnpm run build
```

Si se agregan componentes nuevos:

```powershell
pnpm exec eslint src/components/admin/orders
```

Si se agrega migracion:

```powershell
npx supabase --version
npx supabase db lint --schema public --fail-on none
npx supabase db advisors --type all --level warn --fail-on none
```

Si el CLI no soporta `db advisors`, registrar el bloqueo y usar el metodo disponible en el entorno.

### Verificacion manual minima

Con usuario admin:

1. Abrir `/cuenta`.
2. Entrar a `Mi Perfil`.
3. Confirmar que aparece `Ir al panel de administrador`.
4. Click en el boton.
5. Confirmar navegacion a `/admin`.
6. Abrir `Pedidos` desde sidebar.
7. Confirmar tabla/listado de pedidos.
8. Filtrar por estado.
9. Buscar por numero de orden o email.
10. Expandir detalle y revisar items.

Con usuario autenticado sin admin:

1. Abrir `/cuenta`.
2. Confirmar que no aparece boton admin.
3. Forzar `/admin/orders`.
4. Confirmar acceso restringido o redireccion actual.
5. Confirmar que no aparecen datos de pedidos globales.

Con usuario sin sesion:

1. Forzar `/admin/orders`.
2. Confirmar redireccion a `/auth`.

Regresion checkout:

1. Abrir `/catalogo`.
2. Agregar producto al carrito.
3. Ir a `/checkout`.
4. Confirmar que el flujo invitado sigue disponible.
5. No ejecutar pagos reales salvo sandbox autorizado.

## 15. Migracion opcional de rendimiento

No es obligatoria para la primera implementacion porque ya existen:

- `orders_status_idx`
- `orders_created_at_idx`
- `orders_commerce_order_idx`
- `orders_user_id_idx`
- `order_items_order_id_idx`

Solo crear migracion si durante pruebas hay lentitud o Supabase Advisor lo recomienda.

Indices candidatos:

```sql
CREATE INDEX IF NOT EXISTS orders_admin_status_created_at_idx
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_admin_customer_email_created_at_idx
  ON public.orders (lower(btrim(customer_email)), created_at DESC);
```

No aplicar estos indices automaticamente sin evidencia de necesidad.

## 16. Riesgos y mitigaciones

| Riesgo                                  | Mitigacion                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Exponer tokens de Flow en admin         | Excluir `flow_token`, `flow_raw_status` y `public_lookup_token` del listado inicial |
| Boton admin usado como seguridad        | Mantener `/admin` protegido por ruta padre, `getAdminAccess` y RLS                  |
| Lectura global accidental para no admin | Usar cliente normal bajo RLS, no service role                                       |
| Consulta lenta con muchas ordenes       | Paginacion obligatoria, filtros e indices opcionales con evidencia                  |
| Romper checkout                         | No tocar `api/flow/*`, `src/server/flow/*`, reservas ni RPCs de pago                |
| Duplicar logica de auth                 | Reutilizar `Route.useRouteContext()` y query `["admin-access", user.id]`            |
| UI inmanejable en mobile                | Usar tabla solo desktop y tarjetas mobile                                           |

## 17. Rollback

Si algo falla durante la ejecucion:

1. No usar `git reset --hard`.
2. Revertir solo archivos tocados por esta tarea.
3. Si ya se creo un commit, usar `git revert <sha>` en vez de reescribir historial.
4. Si se creo una migracion ya aplicada remotamente, crear una migracion inversa; no borrar la migracion publicada.
5. Dejar reporte de bloqueo en `docs/reports/` si no se puede completar.

## 18. Definicion de terminado

La tarea se considera terminada cuando:

- existe `/admin/orders`;
- el admin puede listar, filtrar, paginar y revisar detalle de pedidos;
- la sidebar admin incluye `Pedidos`;
- `Mi Perfil` muestra boton a `/admin` solo para admin;
- usuario normal no ve el boton y no puede acceder a datos admin;
- no se expone `service_role` ni tokens Flow en frontend;
- checkout Flow, WhatsApp, `payment_url`, reservas y confirmacion de pagos no se modifican;
- ESLint dirigido pasa;
- `pnpm run build` pasa;
- documentacion viva y reporte quedan actualizados.

## 19. Prompt autoejecutable para la siguiente pedida

Usa este prompt si se quiere ejecutar todo en una sola pasada:

```text
Ejecuta completo el plan `docs/plans/PLAN-MAESTRO-PEDIDOS-ADMIN-Y-ACCESO-PERFIL-2026-07-13.md` trabajando directamente en `main`.

Respeta todas las restricciones del plan. No rompas checkout Flow, WhatsApp checkout, `payment_url`, reservas, confirmacion de pagos, RLS ni rutas publicas.

Implementa en fases:
1. Preflight y revision de cambios existentes.
2. Servicio `admin-orders.service.ts`.
3. Ruta `/admin/orders` con filtros, paginacion, estados y detalle solo lectura.
4. Item `Pedidos` en `AdminShell`.
5. Boton `Ir al panel de administrador` en `/cuenta` solo para rol admin, reutilizando `getAdminAccess` y sin duplicar `getUser()`.
6. Validacion de seguridad Supabase.
7. Actualizacion de docs tecnicas y reporte.
8. Verificacion con ESLint dirigido y `pnpm run build`.

No uses `service_role` en frontend. No agregues escrituras a `orders` ni `order_items`. Si necesitas una migracion, justificala primero y creala con `npx supabase migration new`.

Entrega al final archivos cambiados, comandos ejecutados, resultado de verificacion y cualquier riesgo residual.
```
