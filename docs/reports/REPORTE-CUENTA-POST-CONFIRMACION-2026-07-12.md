# Reporte cuenta post-confirmacion

Fecha: 2026-07-12

## Archivos modificados

- `api/account/link-orders.ts`
- `src/routes/_authenticated/cuenta.tsx`
- `src/config/account.config.ts`
- `docs/plans/PLAN-CUENTA-POST-CONFIRMACION-2026-07-12.md`

## Cambios realizados

- La validacion server-side del correo confirmado ahora usa el usuario canonico obtenido por Supabase Auth Admin despues de validar el JWT.
- Se acepta `email_confirmed_at` o `confirmed_at` como marca de confirmacion, evitando rechazos incorrectos despues de confirmar correo.
- La vinculacion de compras invitadas queda como operacion secundaria; si falla, no bloquea la vista de pedidos.
- La cuenta ahora tiene menu simple con `Mi perfil`, `Pedidos` y `Cerrar sesion`.
- La pestana de pedidos muestra estado vacio cuando no existen pedidos asociados.

## Criterios responsive aplicados

- Las pestañas y el boton de cerrar sesion se apilan en mobile.
- En desktop, el menu se mantiene horizontal para lectura rapida.
- Los paneles usan bordes y fondos suaves consistentes con la interfaz existente.

## Riesgos

- La vinculacion real de pedidos historicos sigue dependiendo de que la migracion `link_guest_orders_to_user` este aplicada en Supabase.
- Si Supabase devuelve error de servicio en la vinculacion, el usuario podra ver pedidos ya asociados, pero compras invitadas pendientes no se sincronizaran hasta un nuevo intento.

## Verificacion

- `npm run lint`: sin errores; quedan 7 warnings preexistentes de Fast Refresh.
- `npm run build`: correcto.
