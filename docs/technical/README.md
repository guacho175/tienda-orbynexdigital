# Indice de Documentacion Tecnica Modular

Documentacion tecnica vigente del e-commerce Orbynex Digital.

## Guias

- [00 - Resumen ejecutivo del sistema](00-overview.md)
- [01 - Stack tecnologico y estructura](01-stack.md)
- [02 - Arquitectura del sistema](02-architecture.md)
- [03 - Modelo de dominio y base de datos](03-domain-model.md)
- [04 - Casos de uso principales](04-use-cases.md)
- [05 - Integracion y flujo de pagos Flow.cl](05-payment-flow.md)
- [06 - Gestion de inventario y reservas](06-inventory-reservations.md)
- [07 - Seguridad y politicas Supabase](07-supabase-security.md)
- [08 - Referencia API serverless](08-api-reference.md)
- [09 - Componentes frontend y admin](09-frontend-components.md)
- [10 - Instalacion y desarrollo local](10-installation.md)
- [11 - Despliegue en produccion](11-deployment.md)
- [12 - Flujo de trabajo para agentes](12-agent-workflow.md)
- [13 - Checklists de mantenimiento](13-maintenance-checklists.md)
- [14 - Riesgos conocidos y deuda tecnica](14-known-risks.md)
- [15 - Glosario](15-glossary.md)

## Cambios Recientes Relevantes

- Fase 5 admin implementada:
  - `/admin/analytics`
  - `/admin/audit`
  - buscador simple en `/admin`
  - aviso anti-sobrescritura en edicion
  - ajuste manual de inventario
- Nuevas tablas:
  - `product_audit_events`
  - `stock_movements`
- Nueva RPC:
  - `adjust_product_stock_admin`
- RLS heredadas optimizadas:
  - sin `auth_rls_initplan` a nivel `warn`
  - sin `multiple_permissive_policies` a nivel `warn`
