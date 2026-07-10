# Indice General de Documentacion - Orbynex E-commerce

Este indice deja en la raiz de `docs/` solo documentacion vigente o representativa del estado actual. Los planes y documentos historicos se archivaron en `docs/planes-pasados/`.

## Guias Vigentes

- [Manual de traspaso para agentes](AGENT-HANDOFF.md)
- [Deploy en Vercel](DEPLOY-VERCEL.md)
- [Flow sandbox testing](FLOW-SANDBOX-TESTING.md)
- [Inventario de productos](INVENTARIO-PRODUCTOS.md)
- [Reservas de stock](INVENTARIO-RESERVAS-STOCK.md)
- [Seed de productos demo](SEED-PRODUCTOS-DEMO.md)

## Documentacion Tecnica Modular

- [README tecnico](technical/README.md)
- [00 - Resumen ejecutivo](technical/00-overview.md)
- [01 - Stack tecnologico](technical/01-stack.md)
- [02 - Arquitectura](technical/02-architecture.md)
- [03 - Modelo de dominio y base de datos](technical/03-domain-model.md)
- [04 - Casos de uso](technical/04-use-cases.md)
- [05 - Flow.cl](technical/05-payment-flow.md)
- [06 - Inventario y reservas](technical/06-inventory-reservations.md)
- [07 - Seguridad Supabase](technical/07-supabase-security.md)
- [08 - API serverless](technical/08-api-reference.md)
- [09 - Frontend y admin](technical/09-frontend-components.md)
- [10 - Instalacion local](technical/10-installation.md)
- [11 - Despliegue produccion](technical/11-deployment.md)
- [12 - Workflow agentes](technical/12-agent-workflow.md)
- [13 - Checklists](technical/13-maintenance-checklists.md)
- [14 - Riesgos conocidos](technical/14-known-risks.md)
- [15 - Glosario](technical/15-glossary.md)

## Estado Actual Implementado

- Catalogo publico con productos activos, imagenes WebP por variantes y productos relacionados.
- Carrito, checkout Flow, resultado de pago y limpieza de carrito al confirmar `paid`.
- Ordenes, items, reservas temporales y expiracion de reservas.
- Admin de productos con editor compacto.
- SEO real por producto.
- Analitica admin en `/admin/analytics`.
- Auditoria admin en `/admin/audit`.
- Ajuste manual de inventario desde `/admin/edit/$id`.
- RLS optimizadas sin warnings de Supabase advisors a nivel `warn`.

## Reporte Vigente

- [Reporte de ejecucion Fase 5](REPORTE-EJECUCION-FASE-5-ADMIN-ANALITICA-INVENTARIO-AUDITORIA.md)

## Archivo Historico

- [Planes pasados, reportes antiguos, preguntas y prompts](planes-pasados/README.md)

## Activos

- `assets/`: diagramas e imagenes de soporte.
- `stitch_compact_product_editor/`: artefactos de referencia del editor compacto.
