# ADR 0001: Supabase Cron para expirar reservas

Estado: ACEPTADO

Fecha: 2026-07-28

## Contexto

Las reservas duran 10 minutos. El scheduler HTTP de GitHub Actions dependía de un secreto
compartido, de la disponibilidad de Vercel y de una llamada externa. Vercel Cron no ofrecía la
frecuencia necesaria en el plan utilizado.

La limpieza ya existe como función PostgreSQL idempotente:
`public.expire_stock_reservations()`.

## Decisión

Programar dentro de PostgreSQL un job llamado `expire-stock-reservations`, ejecutado cada 10
minutos mediante Supabase Cron/`pg_cron`:

```sql
select cron.schedule(
  'expire-stock-reservations',
  '*/10 * * * *',
  $job$select public.expire_stock_reservations();$job$
);
```

El endpoint `/api/stock/expire-reservations` se conserva como respaldo manual y sigue protegido por
`CRON_SECRET`. No forma parte de la programación normal.

## Consecuencias

- La limpieza no depende de solicitudes HTTP, GitHub Actions o secretos entre servicios.
- Reaplicar el mismo nombre actualiza el job existente.
- La migración debe confirmar primero que la función objetivo existe.
- El estado productivo no puede inferirse del archivo: debe verificarse en `cron.job` y
  `cron.job_run_details`.
- Deshabilitar `pg_cron` eliminaría los jobs y requiere un procedimiento operativo explícito.

## Evidencia

- Migración: `supabase/migrations/20260722175738_schedule_stock_reservation_expiration.sql`.
- Operación: [`../technical/11-deployment.md`](../technical/11-deployment.md).
- Documentación oficial:
  [Supabase Cron](https://supabase.com/docs/guides/cron) y
  [Cron Quickstart](https://supabase.com/docs/guides/cron/quickstart).
