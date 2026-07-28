# Instrucciones del repositorio

## Entrada rápida

1. Revisa `git status --short --branch` y `git diff` antes de editar.
2. Lee `docs/README.md` y solamente los documentos relacionados con la tarea.
3. Trata código, manifiestos, migraciones y configuración como evidencia ejecutable.
4. No uses `docs/archive/`, planes o reportes como fuente del estado vigente.

## Mapa mínimo

- `src/`: aplicación React/TanStack Start, rutas, componentes y servicios.
- `api/`: handlers HTTP serverless.
- `supabase/migrations/`: contrato versionado de base de datos; aplica además `supabase/AGENTS.md`.
- `docs/PROJECT_STATE.md`: estado actual confirmado y pendientes de verificación.
- `docs/technical/`: arquitectura, API, datos, seguridad y operación.
- `.agents/skills/`: procedimientos especializados que se cargan solo cuando corresponda.

## Fuentes canónicas

- Dependencias, Node y comandos: `package.json` y `package-lock.json`.
- Variables admitidas: `.env.example`; nunca leas `.env` ni archivos de credenciales.
- Arquitectura: `docs/technical/02-architecture.md`.
- Datos y RLS: migraciones, `docs/technical/03-domain-model.md` y `07-supabase-security.md`.
- API HTTP: handlers de `api/` y `docs/technical/08-api-reference.md`.
- Desarrollo y despliegue: `10-installation.md` y `11-deployment.md`.
- Historia: Git, pull requests y ADR; no `PROJECT_STATE.md`.

## Comandos

```bash
npm ci
npm run dev
npm run check:docs
npm run test:docs
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Usa Node `>=22.13.0`. No instales con Bun o pnpm mientras el lockfile canónico sea
`package-lock.json`.

## Alcance y concurrencia

- Preserva cambios ajenos y no reviertas archivos fuera del alcance.
- Si otra tarea modifica las mismas rutas, usa una rama/worktree independiente o coordina antes.
- Para trabajo largo crea `docs/tasks/AAAA-MM-DD-<id>-<descripcion>.md`.
- No uses un `PLAN.md` compartido ni `docs/PROJECT_STATE.md` como borrador.
- Excluye de búsquedas iniciales `.git`, `node_modules`, `dist`, `.output`, `.tanstack`,
  `.vercel`, `.wrangler`, logs, binarios y `docs/archive`.

## Impacto documental obligatorio

Para cada cambio:

1. Identifica los archivos de código o configuración afectados.
2. Determina si cambia comportamiento visible, API, comandos, configuración, arquitectura,
   datos, migraciones, dependencias, instalación, despliegue, seguridad u operación.
3. Localiza solo la documentación relacionada mediante `docs/README.md`.
4. Actualízala en el mismo cambio o documenta una razón concreta de “sin impacto”.
5. Ejecuta `npm run check:docs`, las validaciones técnicas aplicables y revisa el diff final.

No modifiques documentación por un refactor interno sin impacto comprobable.

## Definición de terminado

- El diff contiene únicamente el alcance aprobado y no incluye secretos ni artefactos generados.
- Pasan `check:docs`, `test:docs`, lint, typecheck y format check.
- Pasa el build cuando cambia código, dependencias, configuración o despliegue.
- Los cambios Supabase cumplen `supabase/AGENTS.md` y tienen evidencia de validación.
- El reporte final enumera archivos, documentación actualizada o razón de no impacto,
  validaciones ejecutadas y limitaciones reales.
