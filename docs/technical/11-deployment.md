# 11 - Guia de Despliegue en Produccion

Checklist vigente para desplegar la plataforma Orbynex en Vercel y Supabase.

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
- `CRON_SECRET`

No publicar secretos con prefijo `VITE_` salvo llaves publicables.

## 4. Cron de Reservas

`vercel.json` debe mantener:

```json
{
  "crons": [
    {
      "path": "/api/stock/expire-reservations",
      "schedule": "* * * * *"
    }
  ]
}
```

Validar logs del cron en Vercel.

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

- [ ] Build productivo OK.
- [ ] Migraciones aplicadas.
- [ ] RLS activa y advisors sin warnings `warn`.
- [ ] Productos reales revisados.
- [ ] Cron activo.
- [ ] Compra real de bajo valor probada.
- [ ] Redireccion Flow OK.
- [ ] Webhook/confirmacion OK.
- [ ] Stock fisico descuenta correctamente al quedar `paid`.
- [ ] `/admin/analytics` carga datos.
- [ ] `/admin/audit` muestra eventos.
- [ ] Ajuste manual de stock registra `stock_movements`.

## 7. Logs

Monitorear:

- Vercel Function logs para `/api/flow/*` y `/api/stock/expire-reservations`.
- Supabase API logs.
- Supabase Database logs.
- Ordenes con `requires_manual_review` o `stock_conflict`.
