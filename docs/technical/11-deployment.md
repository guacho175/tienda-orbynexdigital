# 11 - Guia de Despliegue en Produccion

Checklist vigente para desplegar la plataforma Orbynex en Vercel y Supabase.

## 0. Integración continua

`.github/workflows/ci.yml` se ejecuta en pull requests, pushes a `main` y bajo demanda. Debe
completar instalación reproducible, validación documental, pruebas del checker, lint, typecheck,
format check y build antes de desplegar.

## 1. Base de Datos Supabase

1. Ejecutar migraciones en orden desde `/supabase/migrations/`.
2. Verificar RLS en:
   - `products`
   - `user_roles`
   - `orders`
   - `order_items`
   - `stock_reservations`
   - `product_audit_events`
   - `stock_movements`
3. Confirmar que no hay escritura publica directa en:
   - `orders`
   - `order_items`
   - `stock_reservations`
4. Confirmar que `product_audit_events` y `stock_movements` solo permiten acceso admin.
5. Ejecutar:

```bash
supabase db lint --db-url <pooler-url> --schema public --fail-on none
supabase db advisors --db-url <pooler-url> --type all --level warn --fail-on none
```

El resultado esperado para advisors en nivel `warn` es `No issues found`.

## 2. Storage

Bucket requerido:

- `product-images`

Reglas:

- lectura publica de imagenes;
- escritura solo admin autenticado;
- variantes WebP `thumb`, `card`, `detail`.

## 3. Variables de Entorno Vercel

Configurar equivalentes productivos de:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `FLOW_BASE_URL`
- `FLOW_API_KEY`
- `FLOW_SECRET_KEY`
- `APP_PUBLIC_URL`
- `VITE_APP_PUBLIC_URL`
- `VITE_ALLOW_REMOTE_AUTH_SIGNUP_FROM_LOCAL`
- `FLOW_RETURN_URL`
- `FLOW_CONFIRMATION_URL`
- `CRON_SECRET` (opcional; solo para el endpoint HTTP manual de respaldo)

No publicar secretos con prefijo `VITE_` salvo llaves publicables.

## 4. Cron de Reservas

La programación de producción vive en Supabase PostgreSQL. La migración `supabase/migrations/20260722175738_schedule_stock_reservation_expiration.sql` registra este trabajo:

- Nombre: `expire-stock-reservations`.
- Frecuencia: `*/10 * * * *` (cada 10 minutos).
- Comando: `select public.expire_stock_reservations();`.

La configuración objetivo no usa GitHub Actions ni Vercel Cron para esta funcionalidad.
`vercel.json` no debe declarar un cron de reservas. La eliminación del scheduler anterior y la
aplicación de la migración deben formar parte del mismo cambio desplegable.

El 2026-07-28 se verificó en el proyecto enlazado:

- historial local y remoto de migraciones alineado;
- un único job activo con la configuración anterior;
- cinco ejecuciones consecutivas con estado `succeeded`;
- `anon` y `authenticated` sin permiso para ejecutar la RPC.

Verificar el estado con una consulta acotada:

```sql
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'expire-stock-reservations';
```

Verificar solo la ejecución más reciente:

```sql
select d.status, d.start_time, d.end_time, d.return_message
from cron.job_run_details as d
join cron.job as j on j.jobid = d.jobid
where j.jobname = 'expire-stock-reservations'
order by d.start_time desc
limit 1;
```

## 5. Flow Produccion

Para pasar de sandbox a produccion:

1. Usar `FLOW_BASE_URL=https://www.flow.cl/api`.
2. Reemplazar `FLOW_API_KEY` y `FLOW_SECRET_KEY` por credenciales reales.
3. Confirmar URLs publicas:
   - `APP_PUBLIC_URL`
   - `VITE_APP_PUBLIC_URL`
   - `FLOW_RETURN_URL`
   - `FLOW_CONFIRMATION_URL`

## 6. Checklist Go-Live

- [x] Build productivo OK.
- [x] Migraciones aplicadas.
- [ ] RLS activa y advisors sin warnings `warn`.
- [ ] Productos reales revisados.
- [x] Supabase Cron activo y última ejecución exitosa.
- [ ] Compra real de bajo valor probada.
- [ ] Redireccion Flow OK.
- [ ] Webhook/confirmacion OK.
- [ ] Stock fisico descuenta correctamente al quedar `paid`.
- [ ] `/admin/analytics` carga datos.
- [ ] `/admin/audit` muestra eventos.
- [ ] Ajuste manual de stock registra `stock_movements`.

## 7. Logs

Monitorear:

- Vercel Function logs para `/api/flow/*`; revisar `/api/stock/expire-reservations` solo si se invoca manualmente.
- Supabase API logs.
- Supabase Database logs.
- Historial de Supabase Cron para `expire-stock-reservations`.
- Ordenes con `requires_manual_review` o `stock_conflict`.
