# Índice de documentación

Este índice dirige a la fuente vigente de cada área. Código, manifiestos, migraciones y
configuración prevalecen cuando una descripción Markdown los contradice.

## Estado y entrada

- [Estado actual confirmado](PROJECT_STATE.md): capacidades implementadas y verificación operativa.
- [README del proyecto](../README.md): propósito, inicio rápido y validaciones.
- [Instrucciones del repositorio](../AGENTS.md): reglas persistentes para trabajar en el proyecto.

## Fuentes canónicas por área

| Área | Fuente humana | Evidencia ejecutable |
|---|---|---|
| Stack y estructura | [01-stack.md](technical/01-stack.md) | `package.json`, `vite.config.ts` |
| Arquitectura | [02-architecture.md](technical/02-architecture.md) | `src/`, `api/` |
| Datos | [03-domain-model.md](technical/03-domain-model.md) | `supabase/migrations/` |
| Casos de uso | [04-use-cases.md](technical/04-use-cases.md) | rutas, servicios y handlers |
| Pagos Flow | [05-payment-flow.md](technical/05-payment-flow.md) | `api/flow/`, `src/server/flow/` |
| Inventario | [06-inventory-reservations.md](technical/06-inventory-reservations.md) | migraciones y servicio de inventario |
| RLS y seguridad Supabase | [07-supabase-security.md](technical/07-supabase-security.md) | migraciones y políticas |
| API HTTP | [08-api-reference.md](technical/08-api-reference.md) | `api/` |
| Frontend | [09-frontend-components.md](technical/09-frontend-components.md) | `src/components/`, `src/routes/` |
| Desarrollo local | [10-installation.md](technical/10-installation.md) | `package.json`, `.env.example` |
| Despliegue | [11-deployment.md](technical/11-deployment.md) | Vercel, migraciones y configuración |
| Riesgos | [14-known-risks.md](technical/14-known-risks.md) | incidencias y comportamiento observado |
| Glosario | [15-glossary.md](technical/15-glossary.md) | contratos del dominio |

## Guías operativas

- [Gestión de secretos y entornos](security/GESTION-DE-SECRETOS-Y-ENTORNOS.md)
- [Publicación segura del repositorio](security/PUBLICACION-REPOSITORIO.md)
- [Pruebas con Flow Sandbox](integrations/FLOW-SANDBOX-TESTING.md)
- [Carga de productos demo](development/SEED-PRODUCTOS-DEMO.md)
- [Personalización para clientes](development/PERSONALIZACION-CLIENTE.md)

## Decisiones y tareas

- `adr/`: decisiones arquitectónicas vigentes y sus consecuencias.
- [tasks/](tasks/README.md): solamente planes largos aún activos.
- [archive/](archive/README.md): planes, reportes y material reemplazado; nunca es fuente vigente.

## Lectura dirigida

No abras toda la documentación por defecto. Parte de esta tabla y lee únicamente la fuente del área
afectada. Las búsquedas iniciales deben excluir `docs/archive/` y artefactos generados.
