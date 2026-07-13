# Reporte - Correccion UI, fechas y pagos iniciados

Fecha: 2026-07-13

## Alcance ejecutado

- Cabeceras publicas compactadas en el componente compartido `PageHeader`.
- Fechas centralizadas para Chile con formato `dd/mm/aaaa` y `dd/mm/aaaa HH:mm`.
- Analitica de ventas agrupada por dia local `America/Santiago`, no por fecha UTC cruda.
- Filtros de `/admin/users` ajustados para evitar solapamiento en desktop.
- Pedidos historicos en `Pago iniciado` conciliados de forma acotada.

## Cambios principales

- Nuevo utilitario: `src/utils/date.ts`.
- `src/components/layout/PageHeader.tsx`: menos alto, tipografia mas compacta y subtitulo mas contenido.
- `src/services/admin-analytics.service.ts`: agrupacion por fecha local Chile.
- `src/services/admin-orders.service.ts`: filtros `Desde/Hasta` convertidos a limites UTC del dia chileno.
- Vistas admin/cuenta/auditoria/editor: reemplazo de formateos locales duplicados por utilidades compartidas.
- `src/routes/_authenticated/admin.users.tsx`: grilla adaptable para filtros, con buscador amplio y botones en fila estable.
- Nueva migracion documentada: `supabase/migrations/20260713040318_reconcile_stale_redirected_orders.sql`.

## Conciliacion de pedidos iniciados antiguos

Diagnostico read-only previo:

- Muestra de estados: `failed: 8`, `paid: 6`, `redirected: 8`, `reservation_expired: 4`.
- Ordenes abiertas en `redirected`: 8.
- Ordenes `redirected` antiguas: 8.
- Las 8 tenian `flow_token`, `paid_at = null`, `failed_at = null`, `expires_at = null`.
- Las 8 no tenian filas asociadas en `stock_reservations`.
- Consulta Flow `payment/getStatus` con credenciales sandbox locales devolvio HTTP `401` para los 8 tokens, sin evidencia confirmable de pago.

Correccion aplicada:

- Se uso `public.release_order_stock_reservations(...)` con `p_order_status = 'expired'`.
- Resultado: 8 reconciliadas, todas con `released_count = 0`.
- Verificacion posterior: `redirected_open_count_after = 0`.
- Los 8 registros quedaron con:
  - `status = 'expired'`;
  - `flow_status = 'historical_expired'`;
  - `paid_at = null`;
  - `failed_at = null`;
  - `confirmed_at` presente.

Nota operativa:

- Se intento aplicar el SQL por `supabase db query --db-url`, pero la conexion directa Postgres fallo por DNS del host `db.frpzanceiaijlbgkabib.supabase.co`.
- Como la API de Supabase si respondia, se ejecuto la misma correccion mediante `supabase-js` y la RPC existente.
- La migracion queda versionada para trazabilidad y futuros entornos.

## Validacion

```powershell
.\node_modules\.bin\prettier.cmd --write src/utils/date.ts src/components/layout/PageHeader.tsx src/services/admin-analytics.service.ts src/services/admin-orders.service.ts src/routes/_authenticated/admin.analytics.tsx src/routes/_authenticated/admin.orders.tsx src/routes/_authenticated/admin.users.tsx src/routes/_authenticated/admin.audit.tsx src/routes/_authenticated/cuenta.tsx src/components/admin/ProductForm.tsx docs/plans/PLAN-CORRECCION-UI-FECHAS-PAGOS-INICIADOS-2026-07-13.md
.\node_modules\.bin\eslint.cmd src/utils/date.ts src/components/layout/PageHeader.tsx src/services/admin-analytics.service.ts src/services/admin-orders.service.ts src/routes/_authenticated/admin.analytics.tsx src/routes/_authenticated/admin.orders.tsx src/routes/_authenticated/admin.users.tsx src/routes/_authenticated/admin.audit.tsx src/routes/_authenticated/cuenta.tsx src/components/admin/ProductForm.tsx
npm run build
```

Resultado:

- Prettier aplicado a TS/TSX/MD. El SQL no fue procesado por Prettier porque no hay parser SQL configurado.
- ESLint focalizado sin errores.
- Build de produccion exitoso.
- Smoke visual publico en `http://127.0.0.1:5174`:
  - `/catalogo`: cabecera aprox. 233px en desktop 1440x900.
  - `/carrito`: cabecera aprox. 185px.
  - `/checkout`: cabecera aprox. 185px.
  - `/cuenta` y `/admin/users` redirigieron a `/auth` en navegador headless sin sesion; se validaron por build/lint y revision de layout.

## Riesgo residual

- Flow devolvio `401` al consultar tokens historicos con las credenciales locales actuales. Si se requiere auditoria financiera absoluta, revisar esos `commerce_order` directamente en el panel Flow sandbox antes de borrar historicos o emitir reportes contables.
- El servidor local quedo levantado en `http://127.0.0.1:5174` para revision manual.
