# Plan maestro cerrado: optimización de carga, autenticación y fluidez del admin

**Estado:** listo para ejecución por otro agente  
**Fecha de elaboración:** 2026-07-10  
**Proyecto:** `tienda-orbynexdigital`  
**Objetivo principal:** reducir la latencia percibida y las solicitudes repetidas en el admin sin debilitar autenticación, autorización, RLS ni los flujos comerciales existentes.

## 1. Resultado esperado

Al finalizar este plan:

- La ruta protegida validará la sesión de Supabase una sola vez por navegación protegida mediante `getUser()`.
- La ruta admin reutilizará el usuario validado por su ruta padre y no volverá a consultar `getUser()`.
- La comprobación de rol admin se reutilizará durante una ventana corta y explícita mediante React Query.
- La precarga por intención de TanStack Router seguirá activa y no expirará inmediatamente.
- La lista de productos mostrará un esqueleto real durante la carga, nunca un estado engañoso de `0 productos`.
- La navegación lista → editar será perceptiblemente más rápida y tendrá métricas reproducibles.
- RLS seguirá siendo la autoridad final para todas las operaciones de datos.
- No se modificarán Flow, reservas, confirmaciones de pago, endpoints públicos, migraciones ni políticas RLS.
- La documentación técnica y el reporte de ejecución quedarán actualizados.

## 2. Diagnóstico de referencia

La revisión del despliegue de producción estableció la siguiente línea base:

- Despliegue de Vercel actualizado y en estado `Ready`.
- Consola JavaScript sin errores ni advertencias.
- La captura examinada corresponde a Network, no a Console.
- Carga observada: 67 solicitudes, 1.2 MB de recursos y `Finish: 15.58 s`.
- `/admin` tardó aproximadamente 3.1 s en presentar la estructura; los productos aparecieron después.
- El clic en `Editar` tardó cerca de 1.2 s en cambiar de ruta; el formulario apareció posteriormente.
- Se observó la secuencia repetida `user`, `user_roles`, `user`, `user_roles`.
- La causa principal identificada en el código es:
  - `src/routes/_authenticated/route.tsx` ejecuta `supabase.auth.getUser()`.
  - `src/routes/_authenticated/admin.tsx` vuelve a ejecutar `getUser()` y luego consulta `user_roles`.
  - `src/router.tsx` tiene `defaultPreloadStaleTime: 0`, por lo que el resultado precargado vence inmediatamente.
- Las miniaturas visibles se obtuvieron mayoritariamente desde caché de disco en alrededor de 1 ms; no son el bloqueo principal.
- Los logs del despliegue no mostraron fallos de Vercel.

Esta línea base debe conservarse en el reporte final junto con las nuevas mediciones.

## 3. Restricciones obligatorias

El agente ejecutor debe cumplir todas estas restricciones:

- No cambiar el checkout Flow ni sus endpoints.
- No cambiar reservas de stock.
- No cambiar confirmación de pagos.
- No cambiar endpoints públicos.
- No cambiar políticas RLS, esquema ni migraciones.
- No usar `service_role` en el navegador ni agregar credenciales al repositorio.
- No confiar en `getSession()`, `localStorage`, cookies sin validar ni claims decodificados manualmente para autorizar acceso.
- No convertir el caché de rol del cliente en una barrera de seguridad. Es únicamente una optimización de interfaz; RLS mantiene la autorización real.
- No debilitar las redirecciones de usuario no autenticado o no administrador.
- No cambiar catálogo público, carrito, detalle de producto ni flujo admin fuera de lo descrito.
- No instalar una librería de estado o de datos adicional.
- No reescribir historial Git ni revertir cambios ajenos.
- Si el árbol de trabajo ya tiene cambios, identificarlos y preservar cualquier modificación que no pertenezca a esta tarea.
- Compilar y ejecutar todas las verificaciones indicadas antes de declarar el plan terminado.

## 4. Decisiones técnicas cerradas

### 4.1 Validación de identidad

Se mantendrá `supabase.auth.getUser()` en `src/routes/_authenticated/route.tsx` como validación autoritativa de la identidad para las rutas protegidas.

No se reemplazará por `getSession()` ni por lectura local del token.

No se implementará `getClaims()` en esta entrega. Aunque Supabase indica que puede ser significativamente más rápido al verificar JWT mediante JWKS cacheado, esa ventaja depende del tipo de clave de firma. Primero habría que comprobar y documentar que el proyecto usa claves asimétricas ECC/RSA. Cambiar el mecanismo de validación queda fuera de este plan para evitar una optimización de seguridad no verificada.

Referencias oficiales:

- [`auth.getUser()` y validación del usuario](https://supabase.com/docs/reference/javascript/auth-getuser)
- [`auth.getClaims()` y verificación mediante JWKS](https://supabase.com/docs/reference/javascript/auth-getclaims)
- [`auth.getSession()` y consideraciones de confianza](https://supabase.com/docs/reference/javascript/auth-getsession)

### 4.2 Reutilización del usuario en rutas hijas

`src/routes/_authenticated/admin.tsx` tomará el usuario desde el contexto de la ruta padre. Se eliminará su segunda llamada a `getUser()`.

La forma esperada es equivalente a:

```ts
beforeLoad: async ({ context }) => {
  const user = context.user
  // comprobar acceso admin para user.id
}
```

El tipo del contexto debe seguir siendo explícito y no se resolverán errores mediante `any` o aserciones inseguras.

### 4.3 Consulta y caché del acceso admin

Se creará un servicio pequeño y enfocado para consultar el rol:

- Archivo nuevo: `src/services/admin-access.service.ts`.
- Entrada: `userId: string`.
- Salida: `Promise<boolean>` o un objeto tipado equivalente con `isAdmin`.
- La consulta seleccionará únicamente el campo necesario de `user_roles`.
- Debe filtrar por `user_id` y por `role = 'admin'`.
- Debe usar una respuesta de cero o una fila; no debe descargar toda la tabla ni todos los roles.
- Los errores de red o base de datos no concederán acceso: el comportamiento será cerrado por defecto.

La ruta admin reutilizará el `QueryClient` raíz y ejecutará `ensureQueryData` con esta configuración exacta:

```ts
queryKey: ['admin-access', user.id]
staleTime: 60_000
gcTime: 300_000
retry: 1
```

Reglas de la caché:

- Primera entrada al admin: como máximo una consulta `user_roles`.
- Navegaciones admin posteriores durante 60 segundos: reutilizan el resultado.
- La interfaz podría conservar visibilidad admin hasta 60 segundos después de una revocación remota; esto es aceptable porque RLS bloquea inmediatamente cualquier operación no autorizada.
- La caché nunca debe usarse dentro de una función pública ni para saltarse RLS.
- Un error o ausencia del rol debe redirigir al destino actual para no administradores.

### 4.4 Invalidación por cambios de autenticación

En `src/routes/__root.tsx`, el manejador de cambios de autenticación tendrá una política explícita:

- `SIGNED_OUT`: limpiar el caché de React Query antes o al completar la salida.
- `SIGNED_IN` y `USER_UPDATED`: invalidar consultas con clave base `['admin-access']` y las consultas dependientes de usuario que ya invalida el flujo actual.
- No almacenar tokens ni datos de sesión en una caché nueva.
- Mantener la limpieza existente en `AdminShell` al cerrar sesión; eliminarla solamente si se demuestra duplicación inocua y la alternativa central queda cubierta por prueba automatizada. La opción predeterminada es conservarla.

### 4.5 Precarga de rutas

En `src/router.tsx`:

- Cambiar `defaultPreloadStaleTime` de `0` a `30_000` milisegundos.
- Conservar `defaultPreload: 'intent'` o la configuración equivalente existente.
- No aplicar `preload="render"` a cada enlace de edición de la tabla.
- No precargar simultáneamente todos los formularios de productos.

El objetivo es reutilizar durante 30 segundos el trabajo realizado al posar el puntero o enfocar el enlace, sin provocar una ráfaga de consultas.

### 4.6 Estado de carga de productos

En `src/routes/_authenticated/admin.index.tsx`:

- Distinguir explícitamente entre carga inicial, error, lista vacía y lista con datos.
- Durante la primera carga, mostrar un esqueleto con la geometría aproximada de la tabla/tarjetas.
- No mostrar `0 productos`, una tabla vacía ni el estado vacío mientras `isLoading`/`isPending` sea verdadero.
- Conservar los datos anteriores durante refetch cuando sea correcto para evitar parpadeos.
- Mantener el sembrado actual de la caché de detalle de producto y su `staleTime` de 60 segundos.
- Mantener las miniaturas con `loading="lazy"`, `decoding="async"` y el thumbnail disponible con fallback actual.

Se puede crear `src/components/admin/AdminProductsSkeleton.tsx` si evita duplicación y mantiene legible la ruta. El esqueleto deberá presentar cinco filas en escritorio y tres tarjetas/filas en móvil, respetar `prefers-reduced-motion` y usar fondos blancos/neutros con contraste legible conforme al diseño ya corregido.

No se agregará paginación ni virtualización en esta entrega. Con aproximadamente 15 productos no resolvería el cuello de botella observado. Se reevalúa si el catálogo supera 50 elementos visibles o las mediciones muestran costo dominante de renderizado.

## 5. Archivos previstos

El alcance normal de cambios queda limitado a:

- `src/services/admin-access.service.ts` — nuevo servicio de comprobación de acceso.
- `src/routes/_authenticated/admin.tsx` — reutilización del usuario padre y caché del rol.
- `src/router.tsx` — vigencia de precarga.
- `src/routes/__root.tsx` — invalidación de caché ligada al ciclo de autenticación.
- `src/routes/_authenticated/admin.index.tsx` — estados de carga correctos.
- `src/components/admin/AdminProductsSkeleton.tsx` — solo si se extrae el esqueleto.
- `docs/technical/07-supabase-security.md` — documentar la frontera entre validación, caché de UI y RLS.
- `docs/technical/09-frontend-components.md` — documentar precarga y estados de carga.
- `docs/REPORTE-OPTIMIZACION-CARGA-ADMIN-PRODUCCION-2026-07-10.md` — nuevo reporte de ejecución y resultados.

Si aparece la necesidad de modificar otro archivo, el agente debe justificarlo en el reporte antes de hacerlo. Cualquier necesidad de tocar Flow, RLS, migraciones, reservas, pagos o endpoints públicos detiene la ejecución: no se asume autorización para ampliar ese alcance.

## 6. Secuencia obligatoria de ejecución

### Fase 0 — Preparación y protección del trabajo existente

1. Leer por completo:
   - `AGENTS.md`.
   - Este plan.
   - `docs/technical/07-supabase-security.md`.
   - `docs/technical/09-frontend-components.md`.
   - `docs/REPORTE-OPTIMIZACION-UI-FLUIDEZ-ADMIN-2026-07-10.md`.
2. Revisar el estado Git y registrar en notas qué archivos ya estaban modificados.
3. No descartar, sobrescribir ni reformatear archivos ajenos a la tarea.
4. Crear una rama con prefijo `codex/` si la ejecución no se hace ya en una rama de trabajo. Nombre recomendado: `codex/optimize-admin-auth-loading`.
5. Ejecutar una compilación y TypeScript de línea base. Si fallan antes de los cambios, guardar la salida y separar esos fallos preexistentes del trabajo nuevo.

### Fase 1 — Captura de línea base reproducible

Usar el despliegue de producción con una sesión admin existente. No pedir credenciales por chat ni registrar datos sensibles.

1. Abrir `/admin` en una pestaña limpia.
2. DevTools → Network:
   - `Preserve log`: desactivado.
   - Primera serie fría: `Disable cache` activado mientras DevTools está abierto.
   - Segunda serie tibia: `Disable cache` desactivado.
3. Limpiar la red y medir:
   - Carga directa de `/admin`.
   - Clic en `Editar` para un producto.
   - Volver al listado.
   - Editar un segundo producto.
4. Filtrar y contar por separado:
   - `user`.
   - `user_roles`.
   - `products`.
5. Guardar:
   - tiempo hasta estructura admin;
   - tiempo hasta productos visibles;
   - tiempo desde clic hasta formulario visible;
   - número total de solicitudes;
   - solicitudes `user` y `user_roles`;
   - errores/advertencias de Console.
6. Hacer cinco navegaciones tibias lista → editar y registrar la mediana, no solamente la mejor medición.

No usar `Finish` como único indicador de experiencia: recursos diferidos y miniaturas pueden terminar después de que la pantalla sea utilizable.

### Fase 2 — Servicio de acceso admin

1. Crear `src/services/admin-access.service.ts`.
2. Reutilizar el cliente Supabase oficial del proyecto.
3. Consultar solo la existencia del rol admin para el `userId` entregado.
4. Tipar retorno y errores.
5. Ante error, devolver/rechazar de forma que la ruta niegue acceso; nunca asumir `true`.
6. No incorporar lógica de navegación dentro del servicio.

### Fase 3 — Eliminar la validación duplicada

1. En `src/routes/_authenticated/admin.tsx`, eliminar `supabase.auth.getUser()`.
2. Obtener `user` exclusivamente desde el contexto ya validado de `_authenticated`.
3. Ejecutar `queryClient.ensureQueryData` con la configuración cerrada de la sección 4.3.
4. Mantener exactamente el comportamiento actual de redirección del usuario no admin.
5. Manejar el error de consulta como acceso denegado y no como acceso concedido.

### Fase 4 — Invalidación segura

1. Ajustar el listener de autenticación en `src/routes/__root.tsx`.
2. Limpiar datos al salir.
3. Invalidar `['admin-access']` al iniciar sesión o actualizar el usuario.
4. Verificar que no se creen bucles de navegación ni refetch continuo.
5. Confirmar que cerrar sesión impide volver al admin usando el botón Atrás.

### Fase 5 — Reutilizar la precarga

1. Cambiar `defaultPreloadStaleTime` a `30_000` en `src/router.tsx`.
2. Mantener precarga por intención.
3. Comprobar en Network que posar el puntero y luego hacer clic no duplica inmediatamente los loaders.
4. Comprobar navegación por teclado además de puntero.

### Fase 6 — Mejorar la percepción de carga

1. Implementar el estado skeleton en la lista admin.
2. Verificar que la cantidad total no muestre cero durante la carga.
3. Mantener visibles los datos previos durante refetch no destructivo cuando la API de consulta actual lo permita.
4. Mantener estado vacío real solo cuando la consulta terminó correctamente y devolvió cero productos.
5. Mantener un estado de error accionable y accesible si falla la consulta.
6. Verificar escritorio, tablet y móvil.

### Fase 7 — Revisión de optimizaciones relacionadas

Realizar una inspección limitada y basada en evidencia:

- Confirmar que la tabla no monta componentes de edición pesados por cada fila.
- Confirmar que las imágenes conservan carga diferida y thumbnail.
- Confirmar que no hay efectos React que disparen consultas duplicadas.
- Confirmar que las claves de React Query incluyen el identificador correcto y no cambian en cada render.
- Confirmar que no existen listeners de autenticación duplicados sin limpieza.
- Revisar el tamaño de los chunks generados y registrar cambios relevantes.

Solo corregir hallazgos dentro de los archivos previstos y relacionados directamente con la carga admin. Cualquier refactor amplio se registra como recomendación posterior, no se incorpora silenciosamente.

### Fase 8 — Documentación

1. Actualizar `docs/technical/07-supabase-security.md` con:
   - `getUser()` como validación autoritativa del usuario;
   - reutilización del contexto en rutas hijas;
   - caché de rol como optimización de UI;
   - RLS como autorización definitiva;
   - invalidación al cambiar la sesión.
2. Actualizar `docs/technical/09-frontend-components.md` con:
   - precarga por intención y vigencia de 30 segundos;
   - caché del detalle y acceso admin;
   - estados skeleton, vacío y error.
3. Crear `docs/REPORTE-OPTIMIZACION-CARGA-ADMIN-PRODUCCION-2026-07-10.md` con:
   - diagnóstico inicial;
   - archivos modificados;
   - decisiones de seguridad;
   - mediciones antes/después;
   - verificaciones locales, preview y producción;
   - desviaciones justificadas;
   - pendientes reales, si existen.

## 7. Verificación local obligatoria

Ejecutar en este orden y corregir cualquier regresión propia:

```powershell
npx prettier --check src/services/admin-access.service.ts src/routes/_authenticated/admin.tsx src/router.tsx src/routes/__root.tsx src/routes/_authenticated/admin.index.tsx docs/technical/07-supabase-security.md docs/technical/09-frontend-components.md docs/REPORTE-OPTIMIZACION-CARGA-ADMIN-PRODUCCION-2026-07-10.md
npx eslint src/services/admin-access.service.ts src/routes/_authenticated/admin.tsx src/router.tsx src/routes/__root.tsx src/routes/_authenticated/admin.index.tsx
npx tsc --noEmit --pretty false
npm run build
git diff --check
```

Si se crea `AdminProductsSkeleton.tsx`, agregarlo a las comprobaciones dirigidas.

También revisar manualmente el diff completo y confirmar:

- ausencia de secretos y tokens;
- ausencia de cambios en archivos `.env`;
- ausencia de cambios en migraciones, RLS, Flow, reservas y pagos;
- ausencia de logs de depuración;
- ausencia de `any` nuevo evitable;
- ausencia de cambios masivos de formato no relacionados.

## 8. Matriz funcional y de seguridad

Todas las filas deben aprobarse antes del despliegue final:

| Caso | Resultado obligatorio |
|---|---|
| Usuario sin sesión abre `/admin` | Redirección al acceso; no se muestran datos admin |
| Usuario autenticado sin rol admin abre `/admin` | Acceso denegado/redirección actual; no se muestran datos admin |
| Usuario admin abre `/admin` | Acceso permitido y productos cargados |
| Consulta `user_roles` falla | Acceso cerrado; nunca se concede por fallback |
| Admin navega lista → editar | Formulario visible sin segunda consulta innecesaria de rol dentro de 60 s |
| Admin vuelve y edita otro producto | Se reutilizan precarga y cachés vigentes |
| Admin cierra sesión | Caché limpia y ruta protegida inaccesible incluso con Atrás |
| Sesión vence | La siguiente validación protegida redirige; no se confía en caché de rol |
| Rol se revoca durante caché de UI | RLS bloquea operaciones inmediatamente; UI se corrige al invalidar/vencer en ≤60 s |
| Catálogo público | Carga y navegación sin regresiones |
| Detalle público | Carga producto correctamente |
| Carrito | Agrega, quita y calcula totales correctamente |
| Checkout Flow | Se inicia sin cambios ni regresiones |
| Reservas y confirmación | Sin archivos modificados ni cambios de comportamiento |
| Edición admin | Carga, guarda y vuelve al listado correctamente |

## 9. Pruebas en preview

Antes de promover a producción:

1. Desplegar una Preview de Vercel desde la rama de trabajo.
2. Verificar que el despliegue esté `Ready`.
3. Probar con sesión admin legítima, sin compartir credenciales.
4. Repetir la captura Network fría y tibia indicada en la Fase 1.
5. Ejecutar toda la matriz funcional y de seguridad aplicable.
6. Revisar consola: cero errores y cero advertencias nuevas.
7. Revisar logs del despliegue después de las pruebas y confirmar ausencia de errores/advertencias relacionados.
8. Comparar la mediana de cinco navegaciones lista → editar con producción actual.

No promover si falla autenticación, autorización, TypeScript, build, checkout o cualquiera de las rutas públicas críticas.

## 10. Criterios medibles de aceptación

### Red y consultas

- Una navegación protegida no ejecuta dos `getUser()` por la combinación de rutas padre/admin.
- La primera entrada admin ejecuta como máximo una consulta de rol `user_roles`.
- Dentro de los 60 segundos siguientes, la secuencia `/admin` → editar → volver → editar otro producto no ejecuta consultas `user_roles` adicionales.
- La precarga consumida dentro de 30 segundos no repite inmediatamente el loader por estar obsoleta.
- No aparece una ráfaga de precarga de todos los productos al renderizar la tabla.

### Rendimiento percibido

- Mediana tibia de cinco clics lista → editar: objetivo máximo de 900 ms hasta formulario visible y, como mínimo obligatorio, una mejora de 30 % frente a la línea base tomada en iguales condiciones.
- En carga fría, estructura admin visible en máximo 2.0 s y contenido/skeleton útil visible sin pantalla engañosa.
- Los productos reales deben aparecer en máximo 2.5 s en la medición de referencia, salvo latencia externa documentada con evidencia.
- La interfaz no muestra `0 productos` durante la carga.
- La interacción permanece fluida y no presenta bloqueos largos de hilo principal atribuibles a los cambios.

Los umbrales deben evaluarse en el mismo equipo, navegador, región y condiciones de caché. Si la red impide cumplir un valor absoluto, la mejora relativa y la reducción verificable de solicitudes siguen siendo obligatorias, y la desviación debe quedar documentada.

### Calidad y seguridad

- `npx tsc --noEmit --pretty false` finaliza correctamente.
- `npm run build` finaliza correctamente.
- ESLint dirigido y Prettier dirigido finalizan correctamente.
- `git diff --check` no informa errores.
- Consola del navegador sin errores ni advertencias nuevas.
- Ningún cambio en RLS, migraciones, Flow, reservas, confirmación de pagos o endpoints públicos.
- Usuario no admin y usuario sin sesión continúan bloqueados.

## 11. Validación posterior en producción

Después de promover el despliegue aprobado:

1. Confirmar que el despliegue de producción está `Ready` y sirve los nuevos assets.
2. Abrir `/admin` con sesión admin existente.
3. Repetir la serie fría una vez y la tibia cinco veces.
4. Registrar solicitudes `user`, `user_roles` y productos.
5. Confirmar los criterios medibles.
6. Probar lista, editar producto, volver, editar otro producto y cerrar sesión.
7. Ejecutar smoke test de catálogo, detalle, carrito y creación del checkout Flow sin completar operaciones reales innecesarias.
8. Revisar logs de producción de los últimos 30 minutos para errores y advertencias.
9. Completar el reporte con la URL/identificador del despliegue, fecha, navegador y resultados.

## 12. Condiciones de detención y rollback

Detener la promoción si ocurre cualquiera de estos eventos:

- acceso admin concedido a un usuario no admin;
- sesión inválida aceptada;
- bucle de redirección o autenticación;
- consultas continuas o una cantidad de solicitudes mayor que la línea base por causa del cambio;
- regresión en catálogo, carrito, detalle o Flow;
- fallos de TypeScript o build;
- necesidad no prevista de modificar RLS, migraciones, pagos, reservas o endpoints públicos.

Rollback seguro:

- Revertir únicamente los cambios propios de esta rama mediante un commit nuevo o reversión selectiva.
- No usar `git reset --hard`, `push --force`, `commit --amend` sobre historial publicado ni rebase destructivo.
- Conservar `getUser()` en la ruta protegida padre en todo momento.
- Si el caché de rol produce una regresión, retirar `ensureQueryData` y volver temporalmente a una consulta de rol única desde la ruta admin reutilizando `context.user`; no reinstalar la segunda llamada a `getUser()` salvo diagnóstico documentado que demuestre que es imprescindible.
- Si el skeleton falla, retirarlo sin revertir la optimización de autenticación.

## 13. Fuera de alcance y trabajo posterior

No implementar en esta entrega:

- migración de `getUser()` a `getClaims()`;
- cambios en claves de firma de Supabase;
- nuevas políticas o funciones RLS;
- caché persistente de roles en navegador;
- paginación o virtualización con solo el volumen actual;
- rediseño visual amplio del admin;
- optimización del pipeline de imágenes fuera de la lista admin;
- cambios en Flow, stock, reservas o pagos;
- actualización mayor de React, TanStack, Supabase o Vite.

Una evaluación futura de `getClaims()` requerirá confirmar claves asimétricas, revisar expiración/rotación, hacer prueba de seguridad separada y comparar mediciones contra `getUser()`.

## 14. Entrega obligatoria del agente ejecutor

La tarea solo se considera terminada cuando el agente entrega:

- lista exacta de archivos modificados;
- explicación de la eliminación de llamadas duplicadas;
- explicación de por qué el caché de rol no reemplaza RLS;
- tabla de mediciones antes/después, incluyendo mediana de cinco pruebas tibias;
- conteo comparativo de `user` y `user_roles`;
- resultados de TypeScript, build, lint, formato y `git diff --check`;
- resultados de la matriz funcional y de seguridad;
- identificación del despliegue Preview probado;
- identificación del despliegue de producción validado, si fue promovido;
- actualización de los documentos técnicos y reporte final;
- declaración expresa de que no se modificaron Flow, reservas, pagos, endpoints públicos, RLS ni migraciones.

No cerrar la tarea con recomendaciones genéricas, pruebas pendientes o frases como “debería funcionar”. Cualquier prueba que requiera sesión admin debe hacerse usando la sesión existente del navegador o coordinarse de forma segura, sin solicitar contraseñas por texto.

## 15. Definición final de terminado

El plan está ejecutado por completo únicamente cuando:

1. La identidad se valida una vez en la ruta protegida padre.
2. La ruta admin reutiliza ese usuario.
3. El rol admin se consulta una vez y se reutiliza durante 60 segundos.
4. La caché se invalida correctamente al cambiar o cerrar sesión.
5. La precarga por intención se reutiliza durante 30 segundos.
6. La lista presenta skeleton, error y vacío de forma correcta.
7. Los criterios de red, rendimiento, funcionalidad y seguridad aprueban en Preview.
8. TypeScript y build aprueban.
9. Catálogo, detalle, carrito, checkout Flow y admin no presentan regresiones.
10. La documentación y el reporte incluyen evidencia antes/después.

Si falta cualquiera de esos diez puntos, la ejecución permanece abierta y no debe marcarse como completada.
