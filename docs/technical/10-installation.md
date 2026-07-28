# 10 - Instalación y desarrollo local

## Requisitos

- Node.js `>=22.13.0`; `.nvmrc` fija la versión mínima reproducible.
- npm, usando `package-lock.json`.
- Git.
- Acceso autorizado a entornos de Supabase y Flow cuando se prueben integraciones.

No uses Bun o pnpm sin una migración deliberada del gestor y del lockfile.

## Instalación

```bash
git clone <url-del-repositorio>
cd tienda-orbynexdigital
nvm use
npm ci
cp .env.example .env
npm run dev
```

Vite y Nitro sirven la aplicación en `http://localhost:8080`.

## Variables

`.env.example` es el contrato canónico de nombres y contiene únicamente placeholders. Copia sus
variables a `.env` y completa valores de un entorno autorizado.

Grupos principales:

- Públicas de Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Servidor Supabase: `SUPABASE_URL`, `SUPABASE_PROJECT_ID`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Aplicación: `APP_PUBLIC_URL`, `VITE_APP_PUBLIC_URL`,
  `VITE_ALLOW_REMOTE_AUTH_SIGNUP_FROM_LOCAL`.
- Flow: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`, `FLOW_RETURN_URL`,
  `FLOW_CONFIRMATION_URL`.
- Operación manual: `CRON_SECRET`, opcional para el endpoint HTTP de respaldo.

Nunca pongas secretos en variables `VITE_` ni importes módulos server-only en el bundle cliente.
Consulta [Gestión de secretos](../security/GESTION-DE-SECRETOS-Y-ENTORNOS.md).

## Comandos

| Comando | Propósito | Escribe archivos |
|---|---|---|
| `npm run dev` | servidor local | cachés ignoradas |
| `npm run lint` | ESLint sobre código y handlers | no |
| `npm run typecheck` | TypeScript sin emisión | no |
| `npm run format:check` | comprobar formato | no |
| `npm run format` | corregir formato | sí |
| `npm run check:docs` | gobernanza y sincronización documental | no |
| `npm run test:docs` | pruebas del validador | no |
| `npm run build` | bundle de producción | `.output/` ignorado |
| `npm run preview` | previsualizar el build | cachés ignoradas |

## Flow Sandbox

El webhook de Flow necesita una URL HTTPS pública. Para pruebas completas usa un túnel autorizado o
un despliegue sandbox y configura `FLOW_CONFIRMATION_URL` hacia `/api/flow/confirm`.

Los datos de prueba y el procedimiento viven exclusivamente en
[FLOW-SANDBOX-TESTING.md](../integrations/FLOW-SANDBOX-TESTING.md). No enlaces notas privadas ni
credenciales externas desde el repositorio.
