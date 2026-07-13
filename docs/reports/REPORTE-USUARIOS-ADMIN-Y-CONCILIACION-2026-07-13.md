# Reporte - Usuarios admin y conciliacion de Pago iniciado

Fecha: 2026-07-13

## Alcance implementado

- Nueva vista `/admin/users` para administradores.
- Nuevo endpoint server-only `api/admin/users.ts`.
- Nuevo servicio frontend `src/services/admin-users.service.ts`.
- Navegacion lateral admin con item `Clientes`.
- Documentacion tecnica actualizada.

## Seguridad

- El frontend no usa `service_role` ni llama `auth.admin.listUsers()`.
- `api/admin/users.ts` valida `Authorization: Bearer <access_token>` con `auth.getUser(jwt)`.
- El rol admin se valida contra `public.user_roles`.
- La respuesta excluye `raw_user_meta_data`, `raw_app_meta_data`, `flow_token`, `flow_raw_status` y llaves internas.
- La vista es solo lectura.

## Datos visibles en clientes

- Correo.
- Rol interno (`admin` o `user`).
- Fecha de registro.
- Ultimo inicio de sesion.
- Confirmacion de correo.
- Nombre inferido desde la ultima orden asociada.
- Total de compras asociadas.
- Compras pagadas.
- Monto pagado visible.
- Compras invitadas asociadas por correo exacto.
- Ultimas ordenes.
- Alertas por revision operativa.
- Alertas por `Pago iniciado` antiguo.

## Criterio para Pago iniciado antiguo

`status = "redirected"` representa pago iniciado y debe ser transitorio. En la vista de clientes se
marca como antiguo cuando supera 30 minutos usando `expires_at` si existe, o `created_at` como
respaldo, y no tiene `paid_at` ni `failed_at`.

No se implemento migracion destructiva ni cancelacion masiva automatica. La razon es operativa:
antes de cerrar estados antiguos hay que consultar Flow por token para evitar marcar como fallida
una orden que si fue pagada pero no sincronizada historicamente.

## Validacion ejecutada

```powershell
.\node_modules\.bin\prettier.cmd --write api/admin/users.ts src/services/admin-users.service.ts src/routes/_authenticated/admin.users.tsx src/components/admin/AdminShell.tsx
.\node_modules\.bin\eslint.cmd api/admin/users.ts src/services/admin-users.service.ts src/routes/_authenticated/admin.users.tsx src/components/admin/AdminShell.tsx
npm run build
rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role|auth\.admin\.listUsers|raw_user_meta_data|raw_app_meta_data" api src docs/plans/PLAN-MAESTRO-USUARIOS-ADMIN-Y-CONCILIACION-PAGO-INICIADO-2026-07-13.md
```

Resultado:

- Prettier completo.
- ESLint focalizado sin errores.
- Build de produccion exitoso.
- TanStack Router genero `/admin/users`.
- `auth.admin.listUsers()` aparece solo en `api/admin/users.ts` y documentacion.

## Pendiente recomendado

- Implementar una fase posterior de conciliacion real de ordenes `redirected` antiguas:
  consultar Flow server-side por token, registrar evidencia y actualizar solo estados confirmados.
- Si la cantidad de usuarios crece, crear tabla `profiles`/`customers` indexada para busqueda global
  y evitar escanear Auth Admin paginado.
