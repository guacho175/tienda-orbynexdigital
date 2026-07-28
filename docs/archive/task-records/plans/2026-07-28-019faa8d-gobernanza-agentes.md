# Gobernanza de agentes y documentación

Estado: COMPLETADA

Fecha: 2026-07-28

Identificador: `019faa8d`

## Objetivo

Establecer fuentes canónicas, instrucciones breves, trazabilidad por tarea y validaciones
automáticas que mantengan código y documentación sincronizados sin explorar innecesariamente el
repositorio.

## Alcance aprobado

1. Reconciliar documentación vigente con manifiestos, código, migraciones y configuración.
2. Definir `docs/PROJECT_STATE.md` y un índice documental portable.
3. Corregir `AGENTS.md` y añadir instrucciones específicas para Supabase.
4. Archivar planes y reportes históricos que permanecen en rutas activas.
5. Añadir validación documental, pruebas, plantilla de pull request y CI.
6. Crear una Skill específica que orqueste el flujo sin duplicar arquitectura.
7. Corregir únicamente el baseline técnico mínimo necesario para obtener validaciones verdes.

## Restricciones

- Preservar el cambio preexistente que migra la expiración de reservas a Supabase Cron.
- No consultar ni modificar secretos.
- No aplicar migraciones ni desplegar sin autorización adicional.
- No crear un registro histórico paralelo a Git.

## Validaciones previstas

- `npm ci`
- `npm run check:docs`
- `npm run test:docs`
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run build`
- revisión de `git diff --check`, estado y diff final

## Criterio de cierre

Las fuentes activas no se contradicen, CI puede reproducir las comprobaciones y el reporte final
declara documentación, validaciones y limitaciones.

## Resultado

- Se definieron fuentes canónicas, instrucciones por alcance, estado verificable del proyecto y un
  índice documental portable.
- Los planes, reportes y guías sustituidas se movieron fuera del árbol documental activo.
- Se añadieron validación documental, pruebas unitarias, plantilla de pull request y CI.
- Se creó la Skill local `docs-consistency` como orquestador del flujo de gobernanza.
- Se preservó la migración preexistente a Supabase Cron y se eliminó el programador duplicado de
  GitHub Actions.

## Evidencia de cierre

- `npm ci`: correcto con Node `22.13.0`.
- `npm run check:docs`: correcto.
- `npm run test:docs`: 4 pruebas correctas.
- `npm run lint`: correcto, con 7 advertencias preexistentes de Fast Refresh y 0 errores.
- `npm run typecheck`: correcto.
- `npm run format:check`: correcto.
- `npm run build`: correcto.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- Supabase CLI `2.109.1`: historial remoto reconciliado y migraciones aplicadas.
- Supabase Cron: un job activo y cinco ejecuciones consecutivas `succeeded`.
- Seguridad remota: RLS activa en todas las tablas `public`; helpers privilegiados y listado de
  imágenes endurecidos mediante `20260728224128_harden_public_exposure.sql`.
- Publicación: historial completo auditado con Gitleaks `8.30.1`; los tres hallazgos fueron claves
  Supabase publicables o datos ficticios de documentación.

## Limitaciones registradas

- La auditoría completa conserva 5 vulnerabilidades altas en la cadena de desarrollo de ESLint;
  resolverlas automáticamente exige un salto mayor y potencialmente incompatible a ESLint 10.
- La protección de contraseñas filtradas de Supabase Auth permanece desactivada y requiere un plan
  Pro o superior.
- El repositorio GitHub permanece privado; cambiar su visibilidad requiere una decisión explícita
  independiente.
