# Índice de Documentación (Orbynex Mini-Commerce)

Bienvenido a la documentación del proyecto **Orbynex Mini-Commerce**. Esta carpeta se encuentra organizada para separar la documentación técnica viva (estado actual de la arquitectura y guías operativas) del historial de desarrollo del proyecto.

---

## 1. Documentación de Seguridad y Configuración

*   [Gestión de Secretos y Entornos](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/security/GESTION-DE-SECRETOS-Y-ENTORNOS.md): Directrices sobre segregación de variables de entorno públicas/privadas, políticas del `service_role` y mitigación de fugas.
*   [Plan Maestro de Endurecimiento](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/plans/PLAN-MAESTRO-ENDURECIMIENTO-PLANTILLA.md): Matriz de hallazgos de seguridad y refactorizaciones de plantilla en ejecución.
*   [Reporte de Implementación de Endurecimiento](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/reports/REPORTE-IMPLEMENTACION-ENDURECIMIENTO-PLANTILLA.md): Resumen y evidencia de los hallazgos y correcciones aplicadas.

---

## 2. Documentación Operativa (Guías Activas)

*   [Carga de Productos de Demostración (Seed)](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/development/SEED-PRODUCTOS-DEMO.md): Instrucciones para poblar el catálogo de la tienda de forma local y en Supabase.
*   [Integración y Pruebas con Flow Sandbox](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/integrations/FLOW-SANDBOX-TESTING.md): Guía de transacciones simuladas de pago con Webpay a través de Flow.
*   [Despliegue en Vercel](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/deployment/DEPLOY-VERCEL.md): Flujo y checklist de despliegue para producción de la aplicación TanStack Start.

---

## 3. Especificación Técnica Completa (Documentación Viva)

Toda la documentación arquitectónica detallada reside en la carpeta [docs/technical/](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/):

1.  [00 - Vista General del Sistema (Overview)](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/00-overview.md)
2.  [01 - Stack Tecnológico y Dependencias](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/01-stack.md)
3.  [02 - Arquitectura de la Aplicación (TanStack + Supabase)](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/02-architecture.md)
4.  [03 - Modelo de Dominio de Base de Datos](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/03-domain-model.md)
5.  [04 - Casos de Uso y Procesos Principales](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/04-use-cases.md)
6.  [05 - Flujo Detallado de Pagos de Flow](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/05-payment-flow.md)
7.  [06 - Reservas de Stock e Inventario](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/06-inventory-reservations.md)
8.  [07 - Seguridad y Políticas RLS en Supabase](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/07-supabase-security.md)
9.  [08 - Referencia y Contratos de la API](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/08-api-reference.md)
10. [09 - Componentes del Frontend e Interfaz](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/09-frontend-components.md)
11. [10 - Instalación y Puesta en Marcha Local](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/10-installation.md)
12. [11 - Estrategia y Pipelines de Despliegue](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/11-deployment.md)
13. [12 - Flujo de Trabajo y Buenas Prácticas del Agente](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/12-agent-workflow.md)
14. [13 - Checklists de Mantenimiento Rutinario](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/13-maintenance-checklists.md)
15. [14 - Riesgos Conocidos y Mitigación](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/14-known-risks.md)
16. [15 - Glosario de Términos del Proyecto](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/15-glossary.md)

---

## 4. Archivo Histórico y Registro de Desarrollo

Para revisar el histórico de fases previas ya implementadas, consulta la carpeta [docs/archive/](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/archive/):

*   **Planes Completados (`docs/archive/completed-plans/`):** Hitos y especificaciones técnicas de planificación ya ejecutadas e integradas al codebase principal.
*   **Reportes Históricos (`docs/archive/historical-reports/`):** Informes de cierre de fases, optimizaciones de carga y auditorías del estado de avance en fechas anteriores.
*   **Borradores y Legado (`docs/archive/legacy/`):** Transferencias de agentes (handoffs), datos puntuales de stock antiguos y documentación obsoleta de fases de desarrollo tempranas.
