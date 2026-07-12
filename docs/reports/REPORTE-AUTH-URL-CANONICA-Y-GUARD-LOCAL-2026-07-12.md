# Reporte URL canonica Auth y guard local

Fecha: 2026-07-12

## Archivos modificados

- `src/config/auth-runtime.config.ts`
- `src/config/account.config.ts`
- `src/routes/auth.tsx`
- `.env.example`
- `docs/plans/PLAN-AUTH-URL-CANONICA-Y-GUARD-LOCAL-2026-07-12.md`
- `docs/deployment/DEPLOY-VERCEL.md`
- `docs/technical/10-installation.md`
- `docs/technical/11-deployment.md`

## Cambios realizados

- `emailRedirectTo` ya no usa directamente `window.location.origin`.
- Se usa `VITE_APP_PUBLIC_URL` como dominio canonico para el correo de confirmacion.
- Se bloquea el registro desde localhost cuando el proyecto apunta a un Supabase remoto.
- El bloqueo puede desactivarse solo con `VITE_ALLOW_REMOTE_AUTH_SIGNUP_FROM_LOCAL=true`.
- La documentacion de despliegue ahora incluye `/cuenta` en Redirect URLs.

## Verificacion

- `npm run lint`: sin errores; quedan 7 warnings preexistentes de Fast Refresh.
- `npm run build`: correcto.
- Servidor local reiniciado para cargar variables nuevas.
- Supabase Auth URL Configuration actualizada por CLI:
  - `site_url = https://tienda-orbynexdigital.vercel.app`
  - redirects para `/auth`, `/cuenta`, `/admin` y wildcard del dominio Vercel.
- Migracion puntual aplicada por `supabase db query --linked --file`:
  - `public.link_guest_orders_to_user(uuid,text)`
  - `idx_orders_unclaimed_customer_email_normalized`

## Pendiente operativo

- La plantilla personalizada de confirmacion no pudo empujarse por CLI porque Supabase bloquea modificacion de templates en proyectos free con proveedor de email default.
- Para personalizar ese correo en produccion, configurar SMTP propio o subir de plan.
