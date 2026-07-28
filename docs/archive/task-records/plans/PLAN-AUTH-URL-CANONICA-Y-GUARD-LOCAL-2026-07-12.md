# Plan URL canonica Auth y bloqueo de registro local

Fecha: 2026-07-12

Estado: ejecutado en codigo local.

## Problema

El registro desde local estaba enviando `emailRedirectTo` a `window.location.origin`, por lo que el correo de confirmacion apuntaba a `http://127.0.0.1:8080/cuenta`. Ademas, local estaba conectado a un Supabase remoto, asi que el registro local creaba usuarios reales en una base de produccion.

Antes de estos cambios, Supabase tambien podia redirigir a una URL heredada del Site URL o Redirect URLs configurados en el dashboard, como dominios de Lovable.

## Cambios aplicados

1. Crear configuracion runtime de Auth en `src/config/auth-runtime.config.ts`.
2. Usar `VITE_APP_PUBLIC_URL` como origen canonico de `emailRedirectTo`.
3. Mantener fallback a origen actual solo cuando no exista URL publica configurada.
4. Bloquear registro desde localhost cuando `VITE_SUPABASE_URL` apunta a un Supabase remoto.
5. Permitir opt-in explicito con `VITE_ALLOW_REMOTE_AUTH_SIGNUP_FROM_LOCAL=true`.
6. Agregar mensajes centralizados en `account.config.ts`.
7. Actualizar `.env.example` con las variables publicas correctas.
8. Actualizar `.env` local con `VITE_APP_PUBLIC_URL` y bloqueo local.

## Configuracion requerida en Supabase

En Supabase Dashboard > Authentication > URL Configuration:

- Site URL: dominio canonico de produccion.
- Redirect URLs: incluir el dominio canonico y la ruta `/cuenta` si se usa exact matching.
- Eliminar URLs antiguas de Lovable si ya no corresponden.
- No dejar localhost como Site URL de un proyecto usado para produccion.

## Criterios de aceptacion

- El correo de confirmacion no apunta a localhost cuando existe `VITE_APP_PUBLIC_URL`.
- El registro desde local contra Supabase remoto queda bloqueado por defecto.
- La plantilla puede habilitar pruebas deliberadas con una variable explicita.
- No se hardcodea dominio dentro del codigo fuente.
