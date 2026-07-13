# Reporte: pedidos admin y acceso desde Mi Perfil

Fecha: 2026-07-13
Rama: `main`

## Resumen

Se implemento una vista administrativa solo lectura para revisar pedidos y compras registradas en Supabase, junto con un boton en `Mi Perfil` visible solo para usuarios con rol `admin`.

La implementacion no cambia checkout Flow, WhatsApp checkout, `payment_url`, reservas de stock, confirmacion de pagos, RPCs criticas ni RLS.

## Archivos modificados

- `src/services/admin-orders.service.ts`
- `src/routes/_authenticated/admin.orders.tsx`
- `src/components/admin/AdminShell.tsx`
- `src/routes/_authenticated/cuenta.tsx`
- `src/config/account.config.ts`
- `docs/technical/03-domain-model.md`
- `docs/technical/07-supabase-security.md`
- `docs/technical/09-frontend-components.md`
- `docs/reports/REPORTE-PEDIDOS-ADMIN-Y-ACCESO-PERFIL-2026-07-13.md`

## Funcionalidad agregada

### `/admin/orders`

- Listado paginado de pedidos.
- Filtro por estado.
- Busqueda por orden, correo o cliente.
- Filtro por fecha desde/hasta.
- Resumen de pedidos filtrados, visibles, pagados visibles y revision operativa.
- Tabla desktop.
- Tarjetas mobile.
- Detalle expandible con cliente, fechas, items y totales.
- Estados de carga, error, vacio y refetch.

### Sidebar admin

- Nuevo item `Pedidos`.
- Se conserva el comportamiento activo de `Productos`, `Analitica`, `Auditoria` y `Tienda`.

### `/cuenta` > `Mi perfil`

- Agrega boton `Ir al panel de administrador` solo si `getAdminAccess(user.id)` responde `true`.
- Reutiliza la clave React Query `["admin-access", user.id]`.
- No duplica `supabase.auth.getUser()`.
- El boton no es una barrera de seguridad; `/admin` sigue validando rol.

## Seguridad

- `admin-orders.service.ts` usa el cliente Supabase normal.
- La lectura global de pedidos depende de las politicas RLS admin existentes.
- No se usa `service_role` en frontend.
- No se agregan grants ni politicas nuevas.
- No se agregan escrituras directas a `orders` ni `order_items`.
- No se cargan por defecto campos sensibles como `flow_token`, `flow_url`, `flow_raw_status` ni `public_lookup_token`.
- No se usa `user_metadata` para autorizacion.

## Validacion requerida

Comandos:

```powershell
pnpm exec eslint src/services/admin-orders.service.ts src/routes/_authenticated/admin.orders.tsx src/components/admin/AdminShell.tsx src/routes/_authenticated/cuenta.tsx src/config/account.config.ts
pnpm run build
rg -n "service_role|SUPABASE_SERVICE_ROLE_KEY|flow_token|flow_raw_status|auth.role\\(|user_metadata" src api supabase docs
```

Pruebas manuales:

- Admin abre `/cuenta`, ve boton a `/admin` y puede entrar.
- Usuario normal abre `/cuenta` y no ve boton admin.
- Usuario normal fuerza `/admin/orders` y no ve datos globales.
- Admin abre `/admin/orders`, filtra, pagina y revisa detalle.
- Checkout invitado sigue disponible.

## Riesgos residuales

- La busqueda usa filtros `ilike` sobre campos existentes. Si el volumen de pedidos crece mucho, revisar indices especificos con evidencia de Supabase Advisor.
- La verificacion manual con usuarios reales requiere sesion autenticada en navegador; no debe pedirse ni registrar credenciales por chat.
