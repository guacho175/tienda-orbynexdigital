# Plan: hero sin logo redundante y expiracion de reservas en Vercel Hobby

**Estado**: PLAN ejecutado

Fecha: 2026-07-07

## Contexto encontrado

- El logo redundante del hero esta en `src/routes/index.tsx`, dentro del primer bloque visual del hero, usando `brandConfig.logoUrl`.
- El logo sigue existiendo en `Navbar` y `Footer`, por lo que sacarlo del hero no deberia afectar identidad ni navegacion.
- El deploy falla porque `vercel.json` configura `/api/stock/expire-reservations` con `schedule: "* * * * *"`, o sea cada minuto.
- En Vercel Hobby, los Cron Jobs solo pueden ejecutarse una vez al dia; expresiones mas frecuentes fallan durante el deploy.
- El endpoint `api/stock/expire-reservations.ts` ya esta protegido con `Authorization: Bearer ${CRON_SECRET}` y llama a la RPC `expire_stock_reservations`.
- La expiracion no depende solo del cron: `expire_stock_reservations()` tambien se ejecuta antes de crear una orden con reserva, y `/api/products/availability` la llama antes de calcular disponibilidad publica.

Fuentes verificadas:

- Vercel Cron usage/pricing: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel Cron management: https://vercel.com/docs/cron-jobs/manage-cron-jobs

## Objetivos

1. Quitar el logo del hero sin tocar el logo global del sitio.
2. Desbloquear deploy en Vercel Hobby.
3. Mantener una estrategia razonable para liberar reservas vencidas sin pagar Vercel Pro, o dejar claras las alternativas.
4. No tocar checkout Flow, WhatsApp, ordenes, items, RLS, service role ni logica de borrado de productos.

## Plan recomendado

### Fase 1: cambio visual pequeno

- Editar `src/routes/index.tsx`.
- Eliminar solo el contenedor del logo del hero:
  - el `div` con `img src={brandConfig.logoUrl}` que aparece antes del eyebrow.
- Mantener:
  - `brandConfig.logoUrl`;
  - logo en `Navbar`;
  - logo en `Footer`;
  - texto, CTAs y panel comercial del hero.
- Revisar si queda un margen vertical excesivo entre el inicio del hero y el eyebrow; ajustar solo spacing si visualmente queda raro.

Validacion:

- `npm run build`
- Revisar home desktop y mobile.

### Fase 2: desbloqueo inmediato de deploy

Opcion recomendada para salir del bloqueo rapido:

- Cambiar `vercel.json` de:

```json
{
  "path": "/api/stock/expire-reservations",
  "schedule": "* * * * *"
}
```

a una ejecucion diaria valida en Hobby, por ejemplo:

```json
{
  "path": "/api/stock/expire-reservations",
  "schedule": "0 5 * * *"
}
```

Notas:

- La hora es UTC.
- En Hobby, Vercel puede ejecutar el cron en cualquier momento dentro de esa hora.
- Esto desbloquea deploy, pero no garantiza limpieza inmediata cada 10 o 15 minutos.

Validacion:

- `npm run build`
- Deploy en Vercel.
- Confirmar que ya no aparece el error de cron mas frecuente que diario.

## Opciones para ejecutar la expiracion sin Vercel Pro

### Opcion A: mantener Vercel Cron diario + limpieza oportunista existente

Esta es la opcion mas simple y con menos cambios.

Como funciona:

- Vercel ejecuta una limpieza diaria.
- Cada intento de compra tambien llama `expire_stock_reservations()` antes de crear nuevas reservas.
- La consulta publica de disponibilidad tambien llama la RPC antes de calcular stock disponible.

Ventajas:

- Costo cero.
- Deploy compatible con Vercel Hobby.
- Aprovecha logica ya existente.
- Menor riesgo de tocar infraestructura.

Desventajas:

- Las filas vencidas pueden quedarse marcadas como `active` hasta que haya trafico, consulta de disponibilidad o cron diario.
- Para una tienda con poca actividad, el estado administrativo podria tardar mas en reflejar expiraciones.

Recomendacion:

- Usar esta opcion si el sitio esta en fase demo, baja demanda o prioridad es no pagar.

### Opcion B: scheduler externo gratuito pegando al endpoint de Vercel

Usar un servicio externo tipo cron-job.org, GitHub Actions schedule, UptimeRobot u otro scheduler HTTP para llamar:

```text
GET https://TU-DOMINIO/api/stock/expire-reservations
Authorization: Bearer CRON_SECRET
```

Ventajas:

- Mantiene Vercel en Hobby.
- Permite frecuencia mas alta, por ejemplo cada 5, 10 o 15 minutos, sin usar Vercel Cron.
- Reutiliza el endpoint actual.

Desventajas:

- Agrega dependencia externa.
- Hay que guardar `CRON_SECRET` en el servicio externo.
- Conviene monitorear errores para no fallar silenciosamente.

Recomendacion:

- Mejor equilibrio si se necesita expiracion frecuente sin pagar Vercel Pro.

Implementacion sugerida:

- Dejar `vercel.json` con cron diario o quitar `crons` por completo.
- Crear el job externo cada 10 o 15 minutos.
- Configurar header `Authorization`.
- Probar manualmente con una reserva vencida.
- Revisar logs de Vercel tras la primera ejecucion.

### Opcion C: mover el job a Supabase/Postgres

Ejecutar `select public.expire_stock_reservations();` desde una programacion cercana a la base de datos, por ejemplo con herramientas de Supabase si el plan/proyecto lo permite.

Ventajas:

- La limpieza vive cerca de los datos.
- No depende de una Function de Vercel.
- Evita exponer un endpoint HTTP para esta tarea.

Desventajas:

- Requiere confirmar disponibilidad actual en el proyecto Supabase y su plan.
- Puede requerir cambios de extension, permisos o migracion.
- Hay que auditar bien `SECURITY DEFINER`, grants y ejecucion programada.

Recomendacion:

- Buena opcion si se quiere una solucion mas de base de datos, pero no la haria como primer paso sin revisar plan y permisos de Supabase.

### Opcion D: subir a Vercel Pro

Ventajas:

- Permite cron mas frecuente nativamente en Vercel.
- Menos piezas externas.

Desventajas:

- Costo mensual.
- Para este caso, pagar solo por expirar reservas cada pocos minutos parece excesivo si existe scheduler externo.

Recomendacion:

- Solo si el proyecto ya justifica Vercel Pro por uso comercial, equipo, limites o funciones adicionales.

## Decision recomendada

Para este proyecto, haria esto en orden:

1. Sacar el logo redundante del hero.
2. Cambiar el cron de Vercel a diario para desbloquear deploy.
3. Mantener la limpieza oportunista existente.
4. Si despues se confirma que las reservas vencidas necesitan liberacion visual mas rapida, configurar un scheduler externo cada 10 o 15 minutos contra el endpoint protegido.

## Riesgos y cuidados

- No eliminar `CRON_SECRET`; el endpoint lo necesita para rechazar llamadas no autorizadas.
- No relajar permisos de la RPC; actualmente esta pensada para `service_role`.
- No tocar Flow ni `api/flow/*` para este ajuste.
- No tocar `orders`, `order_items` ni comportamiento de eliminacion de productos.
- Si se usa scheduler externo, rotar `CRON_SECRET` si se filtra o queda expuesto.

## Criterios de aceptacion

- Home renderiza sin logo duplicado en el hero.
- Navbar y footer siguen mostrando identidad Orbynex.
- `npm run build` termina correctamente.
- Deploy de Vercel ya no falla por `Hobby accounts are limited to daily cron jobs`.
- Endpoint `/api/stock/expire-reservations` sigue respondiendo `401` sin token y `200` con `CRON_SECRET` correcto.
- Una reserva vencida pasa a `expired` y su orden relacionada a `reservation_expired` al ejecutar la RPC.
