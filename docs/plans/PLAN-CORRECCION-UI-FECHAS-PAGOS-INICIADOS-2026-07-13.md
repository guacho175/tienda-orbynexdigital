# Plan de correccion: UI compacta, fechas Chile y pagos iniciados antiguos

Fecha: 2026-07-13
Estado: pendiente de aprobacion. No hay cambios de codigo aplicados por este plan.

## Objetivo

Corregir cuatro problemas reportados sin romper checkout Flow, WhatsApp, `payment_url`, reservas de stock, Auth, RLS ni endpoints publicos:

- Reducir el alto de las cabeceras publicas en catalogo, carrito, checkout y cuenta.
- Reparar el formulario de filtros de usuarios admin que se monta en desktop.
- Mostrar fechas como `dd/mm/aaaa` en analitica y vistas admin/cuenta, usando zona horaria de Chile.
- Diagnosticar y resolver ordenes antiguas en `Pago iniciado` sin marcar pagos como fallidos a ciegas.

## Evidencia encontrada

1. Cabeceras publicas demasiado altas:
   - `src/components/layout/PageHeader.tsx` usa `py-14 sm:py-20`, `text-4xl sm:text-5xl` y subtitulo `text-lg`.
   - Ese componente es compartido por las rutas publicas donde se ve el exceso de alto en las capturas.

2. Filtros de usuarios montados:
   - `src/routes/_authenticated/admin.users.tsx` define una grilla fija:
     `xl:grid-cols-[minmax(0,1.4fr)_180px_170px_170px_170px_190px_auto]`.
   - La primera columna queda demasiado comprimida en anchos web intermedios y el label `Buscar` se monta con el campo `Rol`, tal como muestra la captura.

3. Fechas invertidas o con dia siguiente:
   - `src/services/admin-analytics.service.ts` agrupa ventas con `toDateKey(value)` y actualmente `return value.slice(0, 10)`.
   - Eso toma la fecha UTC del ISO, no la fecha local de Chile. Una orden creada el `2026-07-13T00:xx:xxZ` puede seguir siendo `12/07/2026` en America/Santiago.
   - Las rutas admin usan varios `Intl.DateTimeFormat(..., { dateStyle: "medium", timeStyle: "short" })`, lo que no garantiza el formato literal `dd/mm/aaaa`.
   - `src/services/admin-orders.service.ts` filtra fechas con `${from}T00:00:00.000Z` y `${to}T23:59:59.999Z`; eso tambien interpreta dias como UTC, no como dia calendario chileno.

4. Ordenes en `Pago iniciado`:
   - En `src/routes/_authenticated/admin.users.tsx` y `src/routes/_authenticated/admin.orders.tsx`, `redirected` se muestra como `Pago iniciado`.
   - En `api/admin/users.ts`, un pago iniciado antiguo es `status = 'redirected'` sin `paid_at` ni `failed_at`, usando `expires_at` o `created_at` y ventana de 30 minutos.
   - `src/server/flow/checkout.ts` cambia la orden a `redirected` despues de crear el pago Flow.
   - `src/server/flow/flow.ts` solo mapea Flow `2 -> paid`, `3 -> failed`, `4 -> cancelled`; otros estados quedan como `redirected`.
   - `supabase/migrations/20260707181912_reservation_window_10_min_message.sql` fuerza reservas Flow a 10 minutos.
   - `docs/reports/REPORTE-USUARIOS-ADMIN-Y-CONCILIACION-2026-07-13.md` confirma que no se implemento una migracion destructiva ni cancelacion masiva; quedo pendiente conciliar con Flow antes de cerrar historicos.
   - La migracion `supabase/migrations/20260712120000_link_guest_orders_to_confirmed_user.sql` vincula ordenes invitadas por email, pero no corrige ordenes `redirected` antiguas.

## Causa probable del "12 vs 13"

La causa mas probable no es que el cliente haya comprado "en el futuro", sino una mezcla entre timestamps UTC de Supabase y formateo local incompleto:

- Supabase guarda `created_at`, `paid_at` y `expires_at` como timestamps UTC.
- La analitica corta el ISO con `slice(0, 10)`, por lo que muestra el dia UTC.
- En Chile, durante la noche del 12, ya puede ser 13 en UTC.
- Por eso se debe agrupar y mostrar por `America/Santiago`, no por el prefijo UTC del ISO.

## Plan de ejecucion propuesto

### Fase 1 - Fechas y zona horaria

Archivos previstos:

- `src/utils/date.ts` o `src/utils/date-format.ts`
- `src/services/admin-analytics.service.ts`
- `src/services/admin-orders.service.ts`
- `src/routes/_authenticated/admin.analytics.tsx`
- `src/routes/_authenticated/admin.orders.tsx`
- `src/routes/_authenticated/admin.users.tsx`
- `src/routes/_authenticated/admin.audit.tsx`
- `src/routes/_authenticated/cuenta.tsx`
- `src/components/admin/ProductForm.tsx`

Cambios:

- Crear utilidades centralizadas:
  - `formatDateCL(value)` -> `dd/mm/aaaa`
  - `formatDateTimeCL(value)` -> `dd/mm/aaaa HH:mm`
  - `toChileDateKey(value)` -> clave local `yyyy-mm-dd` para agrupar sin desfase UTC.
- Usar `timeZone: "America/Santiago"` y `locale: "es-CL"`.
- Reemplazar `toDateKey(value.slice(0, 10))` en analitica.
- Mantener inputs `type="date"` como control nativo, pero convertir los limites de filtro a inicio/fin del dia en Chile antes de consultar Supabase.
- Evitar cambiar datos guardados; esto es presentacion y filtros, no migracion.

Criterio de aceptacion:

- En analitica, una venta ocurrida el 12 en Chile aparece como `12/07/2026`, aunque su ISO UTC empiece con `2026-07-13`.
- Las vistas admin/cuenta no muestran fechas en formato mes/dia/anio ni ISO crudo.

### Fase 2 - Cabeceras publicas compactas

Archivos previstos:

- `src/components/layout/PageHeader.tsx`
- Solo si es necesario: rutas que consumen `PageHeader`.

Cambios:

- Reducir padding vertical a un rango aproximado `py-8 sm:py-10 lg:py-12`.
- Bajar H1 a un tamano mas operativo, por ejemplo `text-3xl sm:text-4xl`.
- Bajar subtitulo a `text-base`, con `leading-7` controlado.
- Mantener identidad visual Orbynex y fondos existentes, sin agregar dependencias ni assets.
- Verificar catalogo, carrito, checkout y cuenta en desktop/mobile.

Criterio de aceptacion:

- La cabecera ya no ocupa media pantalla en desktop.
- El contenido siguiente queda visible antes sin perder jerarquia visual.
- No se altera navbar, carrito, checkout Flow, WhatsApp ni `payment_url`.

### Fase 3 - Filtros de usuarios admin sin solapamiento

Archivos previstos:

- `src/routes/_authenticated/admin.users.tsx`

Cambios:

- Sustituir la grilla fija actual por una grilla adaptable con columnas de minimo estable, por ejemplo `grid-cols-[repeat(auto-fit,minmax(...))]` o dos filas controladas en `xl`.
- Dar al buscador una fila/columna amplia cuando el ancho no alcanza.
- Agrupar botones `Aplicar` y `Limpiar` con ancho estable y sin empujar campos.
- Mantener filtros actuales: rol, correo confirmado, compras, revision y pago iniciado antiguo.

Criterio de aceptacion:

- En desktop web, `Buscar` no se monta sobre `Rol`.
- En tablet/mobile, los filtros apilan sin overflow horizontal.
- La busqueda y paginacion conservan el comportamiento actual.

### Fase 4 - Diagnostico seguro de pagos iniciados antiguos

Archivos previstos para diagnostico:

- Sin cambios de codigo inicialmente.
- Consulta SQL de solo lectura via Supabase o script local server-side.

Consulta base:

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
  failed_at,
  total,
  customer_email
from public.orders
where status = 'redirected'
  and paid_at is null
  and failed_at is null
order by created_at asc;
```

Cambios permitidos solo si el diagnostico lo justifica:

- Si hay `flow_token`, consultar Flow desde servidor antes de cambiar estado.
- Si Flow responde pagado, reutilizar la ruta/RPC de confirmacion existente para llegar a `paid`, `stock_conflict` o `requires_manual_review`.
- Si Flow responde rechazado/cancelado, reutilizar liberacion de reserva y marcar `failed` o `cancelled`.
- Si no hay token o no hay evidencia de pago y la orden esta fuera de ventana, evaluar migracion historica acotada a `reservation_expired`.

Restricciones:

- No hacer `update` masivo sin lista revisada.
- No tocar `paid`.
- No tocar reservas activas recientes.
- No abrir RLS.
- No exponer `flow_token` al navegador.
- Si se requiere migracion, crearla con `supabase migration new ...`; no inventar nombre manual.

Criterio de aceptacion:

- El total de ordenes `redirected` antiguas queda explicado por categoria: pagadas, canceladas/fallidas, expiradas sin pago o pendientes reales.
- Cualquier actualizacion queda trazada en `flow_raw_status` o reporte equivalente.

## Verificacion obligatoria tras aprobacion

- `npm run build`
- ESLint focalizado sobre archivos tocados.
- Revision visual desktop/mobile de:
  - `/catalogo`
  - `/carrito`
  - `/checkout`
  - `/cuenta`
  - `/admin/users`
  - `/admin/orders`
  - `/admin/analytics`
- Consulta read-only de ordenes `redirected` antes y despues de cualquier conciliacion.
- Si hay migracion:
  - revisar SQL manualmente;
  - ejecutar advisors si esta disponible;
  - confirmar que no cambia RLS ni permisos publicos;
  - documentar resultado en `docs/reports/`.

## Rollback

- UI/fechas: revertir cambios de archivos TS/TSX tocados.
- Conciliacion: si hubo migracion historica, preparar migracion inversa solo para IDs afectados y usando el respaldo del reporte previo.
- Nunca revertir con `git reset --hard` ni reescribir historial compartido.

## Entregables si apruebas

- Parche de UI compacta y filtros.
- Utilidad centralizada de fechas Chile.
- Analitica mostrando fechas `dd/mm/aaaa`.
- Diagnostico real de ordenes `Pago iniciado`.
- Solo si procede: conciliacion controlada de historicos.
- Reporte final en `docs/reports/`.
