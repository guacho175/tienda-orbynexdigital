# Índice General de Documentación - Orbynex E-commerce

Bienvenido al repositorio de documentación del e-commerce de **Orbynex Digital**. Esta documentación está organizada y clasificada semánticamente para facilitar el entendimiento, mantenimiento y desarrollo del sistema de forma independiente de plataformas externas como Lovable.

---

## 📂 Clasificación de Documentos

Haz click en cada enlace para navegar a las distintas secciones de la documentación:

### 1. Guías de Desarrollo y Operaciones (GUIA)
*Instrucciones operativas vigentes para desarrollo, despliegue y mantenimiento.*
*   [**README Principal**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/README.md): Resumen rápido del proyecto, comandos rápidos, configuración de variables de entorno y desarrollo local.
*   [**Manual de Traspaso para Agentes (AGENT-HANDOFF.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/AGENT-HANDOFF.md): Resumen de alto nivel para futuros agentes de IA y desarrolladores. Detalla el estado actual, archivos críticos y reglas de seguridad.
*   [**Guía de Despliegue en Vercel (DEPLOY-VERCEL.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/DEPLOY-VERCEL.md): Instrucciones para publicar el frontend en Vercel manteniendo Supabase como backend.
*   [**Manual de Pruebas Sandbox Flow (FLOW-SANDBOX-TESTING.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-SANDBOX-TESTING.md): Runbook para pruebas locales y remotas del flujo de pagos de Flow.cl en modo Sandbox.
*   [**Gestión de Inventario (INVENTARIO-PRODUCTOS.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/INVENTARIO-PRODUCTOS.md): Detalle del flujo de actualización y sincronización de stock de productos.
*   [**Control de Reservas de Stock (INVENTARIO-RESERVAS-STOCK.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/INVENTARIO-RESERVAS-STOCK.md): Lógica de concurrencia y reserva temporal de stock (10 minutos) antes de checkout.
*   [**Datos de Demo y Semillas (SEED-PRODUCTOS-DEMO.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/SEED-PRODUCTOS-DEMO.md): Instrucciones y comandos para cargar la base de datos de pruebas.

### 2. Documentación Técnica Modular (GUIA)
*Manual técnico de arquitectura y diseño del sistema.*
*   [**00 - Resumen Ejecutivo del Sistema**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/00-overview.md)
*   [**01 - Stack Tecnológico y Estructura de Carpetas**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/01-stack.md)
*   [**02 - Arquitectura del Sistema**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/02-architecture.md)
*   [**03 - Modelo de Dominio y Base de Datos**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/03-domain-model.md)
*   [**04 - Casos de Uso Principales**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/04-use-cases.md)
*   [**05 - Integración y Flujo de Pagos Flow.cl**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/05-payment-flow.md)
*   [**06 - Gestión de Inventario y Reservas de Stock**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/06-inventory-reservations.md)
*   [**07 - Seguridad y Políticas de Acceso en Supabase**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/07-supabase-security.md)
*   [**08 - Referencia de la API Serverless**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/08-api-reference.md)
*   [**09 - Componentes del Frontend y Flujo de Interfaz**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/09-frontend-components.md)
*   [**10 - Guía de Instalación y Desarrollo Local**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/10-installation.md)
*   [**11 - Guía de Despliegue en Producción**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/11-deployment.md)
*   [**12 - Flujo de Trabajo para Futuros Agentes de IA**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/12-agent-workflow.md)
*   [**13 - Listas de Verificación y Mantenimiento**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/13-maintenance-checklists.md)
*   [**14 - Riesgos Conocidos y Deuda Técnica**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/14-known-risks.md)
*   [**15 - Glosario de Términos**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/15-glossary.md)

### 3. Reportes de Auditoría e Implementación (REPORTE)
*Reportes de cambios ya ejecutados y verificaciones.*
*   [**Reporte de Auditoría e Independencia de Lovable**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-AUDITORIA-DOCUMENTACION-LOVABLE.md): Detalle de la eliminación de dependencias y de la auditoría actual de documentación.
*   [**Auditoría de Base de Datos y Seguridad (AUDITORIA-FASE-2.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/AUDITORIA-FASE-2.md)
*   [**Auditoría de Performance de Imágenes (AUDITORIA-PERFORMANCE-IMAGENES.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/AUDITORIA-PERFORMANCE-IMAGENES.md)
*   [**Reporte de Categorías Responsive (REPORTE-CATEGORIAS-HOME-RESPONSIVE.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-CATEGORIAS-HOME-RESPONSIVE.md)
*   [**Reporte de GitHub Actions Cron (REPORTE-GITHUB-ACTIONS-CRON-HERO.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-GITHUB-ACTIONS-CRON-HERO.md)
*   [**Reporte de Mini Cart Drawer (REPORTE-MINI-CART-DRAWER.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-MINI-CART-DRAWER.md)
*   [**Reporte de Pulido de Interfaz UI/UX (REPORTE-PULIDO-UI-UX-ORBYNEX.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-PULIDO-UI-UX-ORBYNEX.md)

### 4. Planes de Desarrollo ya Ejecutados (PLAN ejecutado)
*Planes de desarrollo que fueron propuestos e implementados en su totalidad.*
*   [**Integración de Flow Fase 1: Órdenes y RLS**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-FASE-1-ORDERS-RLS.md)
*   [**Integración de Flow Fase 2: Endpoints Vercel**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-FASE-2-ENDPOINTS.md)
*   [**Integración de Flow Fase 3: Checkout y Retorno**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-FASE-3-RESULTADO-CHECKOUT.md)
*   [**Fase 3A: Almacenamiento de Imágenes en Supabase**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FASE-3A-IMAGENES-STORAGE.md)
*   [**Variantes de Imágenes en Detalle y Cards**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/IMAGENES-VARIANTES-THUMB-CARD-DETAIL.md)
*   [**Plan de Correcciones del Carrito de Flow**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-CORRECCIONES-CARRITO-FLOW-UI.md)
*   [**Plan del Cron de Expiración de Reservas**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-HERO-CRON-HOBBY.md)
*   [**Plan Inicial de Integración con Flow API**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-INTEGRACION-FLOW-API.md)
*   [**Plan de Inventario Avanzado**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-INVENTARIO-AVANZADO.md)
*   [**Plan de Optimización de Imágenes de Panel**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-OPTIMIZACION-IMAGENES-PANEL.md)
*   [**Plan de Reservas de Stock con Cron cada 10 min**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-RESERVAS-STOCK-CRON-10-MIN.md)
*   [**Rediseño de Home de E-commerce**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REDISENO-HOME-ECOMMERCE.md)

### 5. Documentación Histórica (HISTORICO)
*Documentos antiguos archivados para referencia sobre el estado original.*
*   [**Estado Inicial del Template Base (ESTADO-ACTUAL-TEMPLATE.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/ESTADO-ACTUAL-TEMPLATE.md)
*   [**Plan de Migración a Supabase Propia (MIGRACION-SUPABASE-PROPIA.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/MIGRACION-SUPABASE-PROPIA.md)
*   [**Prompts e Instrucciones Operativas Históricas (PROMPT-EJECUTAR-INVENTARIO-FASES-1-5.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PROMPT-EJECUTAR-INVENTARIO-FASES-1-5.md)

---

## 🖼️ Activos Multimedia e Imágenes de Soporte
Los diagramas clave de la arquitectura están disponibles físicamente en la carpeta `/docs/assets/`:
*   **Arquitectura del Sistema**:
    *   [Versión Premium Conceptual](../assets/diagram_architecture.png)
    *   [Versión UML Formal de Componentes](../assets/diagram_architecture_uml.png)
*   **Modelo de Datos ERD**:
    *   [Versión Premium Conceptual](../assets/diagram_erd.png)
    *   [Versión UML ERD Formal](../assets/diagram_erd_uml.png)
*   **Flujo de Pago Flow**:
    *   [Versión Premium Conceptual](../assets/diagram_payment_flow.png)
    *   [Versión UML Secuencia Formal](../assets/diagram_payment_flow_uml.png)
*   **Control de Concurrencia y Stock**:
    *   [Versión Premium Conceptual](../assets/diagram_stock_reservations.png)
    *   [Versión UML Estados de Reserva Formal](../assets/diagram_stock_reservations_uml.png)
