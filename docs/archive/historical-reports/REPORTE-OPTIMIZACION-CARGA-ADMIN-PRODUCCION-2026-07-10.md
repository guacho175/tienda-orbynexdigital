# Reporte de optimizacion de carga admin en produccion

**Fecha:** 2026-07-10  
**Rama:** `codex/optimize-admin-auth-loading`  
**Estado:** completado

## Alcance ejecutado

- Se conservo `supabase.auth.getUser()` como validacion autoritativa en
  `src/routes/_authenticated/route.tsx`.
- Se elimino la segunda llamada a `getUser()` desde `src/routes/_authenticated/admin.tsx`.
- Se agrego `src/services/admin-access.service.ts` para consultar solo la existencia del rol admin.
- Se cacheo `["admin-access", user.id]` con `staleTime: 60_000`, `gcTime: 300_000` y `retry: 1`.
- Se limpio la cache al cerrar sesion y se invalido `["admin-access"]` al iniciar sesion o actualizar
  usuario.
- Se cambio `defaultPreloadStaleTime` a `30_000` y se mantuvo precarga por intencion.
- Se agrego `AdminProductsSkeleton` para la carga inicial del listado admin.
- Se ajusto la redireccion de la ruta protegida padre con `reloadDocument: true` para que una carga
  directa de `/admin` sin sesion no hidrate una ruta distinta antes de llegar a `/auth`.
- Se marco `/auth` como ruta cliente para mantener coherente la pantalla de acceso en redirecciones.
- Se actualizaron los documentos tecnicos de Supabase y frontend.

## Archivos modificados

- `src/services/admin-access.service.ts`
- `src/routes/_authenticated/route.tsx`
- `src/routes/_authenticated/admin.tsx`
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/auth.tsx`
- `src/routes/_authenticated/admin.index.tsx`
- `src/components/admin/AdminProductsSkeleton.tsx`
- `docs/technical/07-supabase-security.md`
- `docs/technical/09-frontend-components.md`
- `docs/REPORTE-OPTIMIZACION-CARGA-ADMIN-PRODUCCION-2026-07-10.md`

## Decisiones de seguridad

- La identidad no se valida con `getSession()`, `localStorage`, cookies sin validar ni claims
  decodificados manualmente.
- El cache de rol admin es solo una optimizacion de UI. No reemplaza RLS ni se usa en endpoints
  publicos.
- Ante error de `user_roles`, el acceso queda denegado por defecto.
- No se modificaron Flow, reservas, confirmacion de pagos, endpoints publicos, RLS ni migraciones.
- No se agregaron secretos, tokens ni credenciales.

## Linea base antes de cambios

Referencia documentada por el plan maestro:

| Metrica                            |                           Produccion antes |
| ---------------------------------- | -----------------------------------------: |
| Solicitudes totales observadas     |                                         67 |
| Recursos transferidos              |                                     1.2 MB |
| Finish observado                   |                                    15.58 s |
| `/admin` hasta estructura          |                                     ~3.1 s |
| Clic `Editar` hasta cambio de ruta |                                     ~1.2 s |
| Secuencia observada                | `user`, `user_roles`, `user`, `user_roles` |

Medicion propia con sesion admin existente en Chrome, antes de modificar codigo:

| Caso                                                        |                  Resultado |
| ----------------------------------------------------------- | -------------------------: |
| Carga tibia `/admin` hasta productos visibles               |                    2684 ms |
| Mediana de 5 clics lista -> editar hasta formulario visible |                    3135 ms |
| Consola                                                     | 0 errores / 0 advertencias |

Detalle de 5 clics lista -> editar antes:

| Iteracion | Producto             |  Tiempo |
| --------- | -------------------- | ------: |
| 1         | Demo Web Starter     | 3562 ms |
| 2         | Demo Web Pro         | 3404 ms |
| 3         | Demo Landing Express | 2567 ms |
| 4         | Demo Web Premium     | 3135 ms |
| 5         | Demo Catalogo Simple | 3061 ms |

Limitacion de herramienta: el navegador controlable expuso DOM y consola, pero no permitio leer HAR
ni `performance.getEntriesByType("resource")`. Por eso el conteo de `user` y `user_roles` antes se
conserva desde la captura Network registrada en el plan maestro.

## Resultados despues

Preview validada con sesion admin existente en Chrome:

| Caso                                                      | Resultado |
| --------------------------------------------------------- | --------: |
| Carga directa `/admin` hasta productos visibles           |   1836 ms |
| Mediana de 5 clics lista -> editar, desde clic            |    887 ms |
| Mediana de 5 clics lista -> editar, desde intencion/hover |   1584 ms |
| Consola                                                   |         0 |

Detalle de 5 clics lista -> editar en Preview:

| Iteracion | Producto             | Clic -> formulario | Intencion -> formulario |
| --------- | -------------------- | -----------------: | ----------------------: |
| 1         | Demo Web Starter     |            3177 ms |                 3567 ms |
| 2         | Demo Web Pro         |             849 ms |                 1564 ms |
| 3         | Demo Landing Express |             887 ms |                 1584 ms |
| 4         | Demo Web Premium     |             755 ms |                 1456 ms |
| 5         | Demo Catalogo Simple |             902 ms |                 1710 ms |

Comparacion principal:

| Metrica                                 | Antes produccion | Despues Preview | Cambio |
| --------------------------------------- | ---------------: | --------------: | -----: |
| `/admin` hasta productos visibles       |          2684 ms |         1836 ms | -31.6% |
| Mediana lista -> editar desde clic      |          3135 ms |          887 ms | -71.7% |
| Errores / advertencias en consola admin |                0 |               0 |      0 |

Produccion validada tras promocion:

| Caso                                                      | Resultado |
| --------------------------------------------------------- | --------: |
| Carga directa `/admin` hasta productos visibles           |   1958 ms |
| Mediana de 5 clics lista -> editar, desde clic            |    731 ms |
| Mediana de 5 clics lista -> editar, desde intencion/hover |   1542 ms |
| Consola                                                   |         0 |

Detalle de 5 clics lista -> editar en produccion:

| Iteracion | Producto             | Clic -> formulario | Intencion -> formulario |
| --------- | -------------------- | -----------------: | ----------------------: |
| 1         | Demo Web Starter     |             690 ms |                 1814 ms |
| 2         | Demo Web Pro         |             838 ms |                 1542 ms |
| 3         | Demo Landing Express |             660 ms |                 1369 ms |
| 4         | Demo Web Premium     |             930 ms |                 1636 ms |
| 5         | Demo Catalogo Simple |             731 ms |                 1442 ms |

Comparacion contra la medicion propia inicial:

| Metrica                            | Antes produccion | Despues produccion | Cambio |
| ---------------------------------- | ---------------: | -----------------: | -----: |
| `/admin` hasta productos visibles  |          2684 ms |            1958 ms | -27.0% |
| Mediana lista -> editar desde clic |          3135 ms |             731 ms | -76.7% |

## Verificaciones locales

Linea base antes de cambios:

- `npx tsc --noEmit --pretty false`: OK.
- `npm run build`: OK.

Verificacion final ejecutada durante la implementacion:

- `npx prettier --check ...`: OK.
- `npx eslint ...`: OK.
- `npx tsc --noEmit --pretty false`: OK.
- `npm run build`: OK.
- `git diff --check`: OK.

Preview local compilado (`http://127.0.0.1:4173`):

| Caso                         | Resultado                  |
| ---------------------------- | -------------------------- |
| `/`                          | OK, contenido visible      |
| `/catalogo`                  | OK                         |
| `/producto/demo-web-starter` | OK                         |
| `/carrito`                   | OK                         |
| `/checkout`                  | OK                         |
| `/admin` sin sesion          | Redirige a `/auth`         |
| Consola                      | 0 errores / 0 advertencias |

## Matriz funcional y seguridad

| Area                          | Local | Preview     | Produccion  |
| ----------------------------- | ----- | ----------- | ----------- |
| Catalogo                      | OK    | OK          | OK          |
| Detalle de producto           | OK    | OK          | OK          |
| Carrito                       | OK    | OK          | OK          |
| Checkout                      | OK    | OK          | OK          |
| Flow `create-payment` 405     | N/A   | OK          | OK          |
| Flow payload invalido 400     | N/A   | OK          | OK          |
| Flow `order-status` 400       | N/A   | OK          | OK          |
| Flow create payment valido    | N/A   | OK          | OK          |
| Flow order status tras create | N/A   | OK          | OK          |
| `/admin` sin sesion           | OK    | OK          | OK          |
| `/admin` con sesion admin     | OK    | OK          | OK          |
| Logout + boton atras          | N/A   | OK          | OK          |
| Consola navegador             | OK    | OK          | OK          |
| Logs Vercel                   | N/A   | OK con nota | OK con nota |

## Preview

Preview descartada:

- `dpl_6SezQxLzjS6LgRDbhXRgS77AKAQu`
- URL: `https://tienda-orbynexdigital-25nzh8lts-galindez.vercel.app`
- Motivo: despliegue `--prebuilt` sirvio la app, pero no incluyo `api/flow/*`; Flow respondio 404.
- Accion: no se promovio.

Preview valida para pruebas:

- `dpl_F4UfEuV246mDZzH9ARTYN7k525pA`
- URL: `https://tienda-orbynexdigital-7im1m2la0-galindez.vercel.app`
- Estado: `READY`.

Resultados disponibles:

| Caso                               | Resultado                                                         |
| ---------------------------------- | ----------------------------------------------------------------- |
| `/`                                | OK                                                                |
| `/catalogo`                        | OK                                                                |
| `/producto/demo-web-starter`       | OK                                                                |
| `/carrito`                         | OK                                                                |
| `/checkout`                        | OK                                                                |
| `/admin` sin sesion                | Redirige a `/auth`                                                |
| Consola navegador                  | 0 errores / 0 advertencias                                        |
| Flow GET `create-payment`          | 405 esperado                                                      |
| Flow payload invalido              | 400 esperado                                                      |
| Flow `order-status` sin parametros | 400 esperado                                                      |
| Flow create payment valido         | 200, devuelve `redirectUrl`, `commerceOrder`, `publicLookupToken` |
| Flow order status tras create      | 200, `redirected` / `created`                                     |

Resultados admin con sesion existente en Chrome:

| Caso                                                     | Resultado                  |
| -------------------------------------------------------- | -------------------------- |
| `/admin` con sesion admin                                | OK, 15 productos           |
| Usuario observado                                        | `galindez175@gmail.com`    |
| Carga directa `/admin` hasta productos visibles          | 1836 ms                    |
| Mediana de 5 clics lista -> editar desde clic            | 887 ms                     |
| Mediana de 5 clics lista -> editar desde intencion/hover | 1584 ms                    |
| Logout + boton atras                                     | OK, no expone admin        |
| Consola                                                  | 0 errores / 0 advertencias |

Nota de logs:

- En Preview hubo un log `GET /api/flow/order-status 400` con advertencia Node `DEP0169`
  provocado por el smoke negativo esperado. No corresponde a un error de aplicacion introducido por
  este cambio.

Estado:

- Preview aprobada.
- Se promovio exactamente esta Preview a produccion.

## Produccion

Despliegue promovido:

- ID: `dpl_CMTBvmbpu9i9wshbwkG6tVKu62ZJ`
- URL del despliegue: `https://tienda-orbynexdigital-mk4kehucd-galindez.vercel.app`
- Alias de produccion: `https://tienda-orbynexdigital.vercel.app`
- Origen promovido: `dpl_F4UfEuV246mDZzH9ARTYN7k525pA`
- Estado Vercel: `READY`
- `api/flow/*`: presente en el despliegue de produccion.

Resultados disponibles:

| Caso                               | Resultado                                             |
| ---------------------------------- | ----------------------------------------------------- |
| `/`                                | OK                                                    |
| `/catalogo`                        | OK                                                    |
| `/producto/demo-web-starter`       | OK                                                    |
| `/carrito`                         | OK                                                    |
| `/checkout`                        | OK                                                    |
| `/admin` sin sesion                | Redirige a `/auth`                                    |
| Consola                            | 0 errores / 0 advertencias                            |
| Flow GET `create-payment`          | 405 esperado                                          |
| Flow payload invalido              | 400 esperado                                          |
| Flow `order-status` sin parametros | 400 esperado                                          |
| Flow create payment valido         | 200, devuelve datos esperados sin exponer URL de pago |
| Flow order status tras create      | 200, `redirected` / `created`                         |

Resultados admin con sesion existente en Chrome:

| Caso                                                     | Resultado                  |
| -------------------------------------------------------- | -------------------------- |
| `/admin` con sesion admin                                | OK, 15 productos           |
| Usuario observado                                        | `galindez175@gmail.com`    |
| Carga directa `/admin` hasta productos visibles          | 1958 ms                    |
| Mediana de 5 clics lista -> editar desde clic            | 731 ms                     |
| Mediana de 5 clics lista -> editar desde intencion/hover | 1542 ms                    |
| Logout + boton atras                                     | OK, no expone admin        |
| Consola                                                  | 0 errores / 0 advertencias |

Nota de logs:

- En produccion hubo un log `GET /api/flow/order-status 400` con advertencia Node `DEP0169`
  provocado por el smoke negativo esperado y por un primer intento manual con nombre de parametro
  incorrecto. El reintento valido con `publicLookupToken` respondio 200. No corresponde a un error
  de aplicacion introducido por este cambio.

Pendiente:

- Ninguno.

## Conteo de solicitudes `user` y `user_roles`

Limitacion: el navegador controlable no permitio extraer HAR ni `performance.getEntriesByType`
durante esta ejecucion. El conteo se verifica por codigo y por el comportamiento funcional:

| Navegacion admin | Antes documentado en plan | Despues aplicado                                    |
| ---------------- | ------------------------- | --------------------------------------------------- |
| `user`           | 2                         | 1                                                   |
| `user_roles`     | 2                         | 1 primera carga; 0 adicionales dentro de cache 60 s |

Evidencia de codigo:

- `src/routes/_authenticated/route.tsx` conserva la unica validacion autoritativa
  `supabase.auth.getUser()`.
- `src/routes/_authenticated/admin.tsx` ya no llama `getUser()` y reutiliza `context.user`.
- `src/routes/_authenticated/admin.tsx` cachea `["admin-access", user.id]` durante 60 segundos.

## Desviaciones justificadas

- `useAdminAccess` conserva su implementacion heredada porque no esta usado por las rutas actuales y
  el plan cerro los archivos previstos. Tocar ese hook sin uso no reduce las solicitudes observadas
  en `/admin`.
- `src/routes/auth.tsx` se modifico fuera de la lista normal de archivos previstos para eliminar un
  error de hidratacion al cargar `/admin` sin sesion y redirigir a `/auth`. No cambia credenciales,
  validacion ni permisos.
- `src/routes/_authenticated/route.tsx` se modifico solo para agregar `reloadDocument: true` al
  redirect de usuario no autenticado. Se conserva `supabase.auth.getUser()` como validacion
  autoritativa.
