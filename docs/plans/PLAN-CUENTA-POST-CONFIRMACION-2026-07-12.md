# Plan cuenta post-confirmacion y pedidos vacios

Fecha: 2026-07-12

Estado: ejecutado en codigo local.

## Entendimiento

El flujo correcto es que el usuario no pueda ingresar antes de confirmar el correo. Despues de confirmar, `/cuenta` no debe mostrar una alerta roja de "confirma tu correo" si Supabase ya permitio la sesion confirmada. Si no existen pedidos asociados, la pantalla debe mostrar un estado vacio claro.

Tambien falta una navegacion simple de cuenta para usuario normal:

- Mi perfil
- Pedidos
- Cerrar sesion

## Cambios a ejecutar

1. Hacer mas robusta la verificacion server-side de correo confirmado en `POST /api/account/link-orders`.
2. Usar el usuario canonico de Supabase Auth Admin despues de validar el JWT, para evitar leer datos antiguos del token.
3. Tratar la vinculacion de compras invitadas como operacion secundaria: si falla, no debe bloquear la carga de pedidos ya asociados.
4. Agregar menu de cuenta con pestañas `Mi perfil` y `Pedidos`.
5. Agregar accion `Cerrar sesion`.
6. Mostrar "sin pedidos" cuando la lista este vacia.
7. Mantener textos centralizados en `account.config.ts`.
8. Verificar con lint y build.

## Criterios de aceptacion

- Usuario sin confirmar sigue sin poder entrar.
- Usuario confirmado no ve alerta roja de confirmacion.
- Si no tiene pedidos, ve un estado vacio de pedidos.
- La cuenta muestra menu simple: Mi perfil, Pedidos, Cerrar sesion.
- Cerrar sesion limpia la sesion y redirige fuera del area protegida.
- No se expone ningun control admin en la cuenta normal.

## Resultado aplicado

- `POST /api/account/link-orders` valida el JWT y luego consulta el usuario canonico con Auth Admin.
- La confirmacion acepta `email_confirmed_at` y `confirmed_at` para cubrir diferencias de payload.
- `/cuenta` ya no bloquea el listado si falla la sincronizacion secundaria de compras invitadas.
- `/cuenta` agrega pestañas `Mi perfil` y `Pedidos`, mas accion `Cerrar sesion`.
- Si no hay pedidos, se muestra el estado vacio existente.
- Verificacion: `npm run lint` y `npm run build`.
