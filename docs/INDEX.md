# Índice General de Documentación - Orbynex E-commerce

Bienvenido al repositorio de documentación del e-commerce de **Orbynex Digital**. Esta documentación está organizada y clasificada semánticamente para facilitar el entendimiento, mantenimiento y desarrollo del sistema de forma independiente de plataformas externas como Lovable.

---

## 📂 Clasificación de Documentos

Haz click en cada enlace para navegar a las distintas secciones de la documentación:

### 1. Guías de Desarrollo y Operaciones (GUIA)
*Instrucciones operativas vigentes para desarrollo, despliegue y mantenimiento.*
*   `[GUIA]` [**README Principal**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/README.md): Resumen rápido del proyecto, comandos rápidos, configuración de variables de entorno y desarrollo local.
*   `[GUIA]` [**Instrucciones para Agentes y Desarrolladores (AGENTS.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/AGENTS.md): Buenas prácticas vigentes en Git y desarrollo en el repositorio.
*   `[GUIA]` [**Manual de Traspaso para Agentes (AGENT-HANDOFF.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/AGENT-HANDOFF.md): Resumen de alto nivel para futuros agentes de IA y desarrolladores. Detalla el estado actual, archivos críticos y reglas de seguridad.
*   `[GUIA]` [**Guía de Despliegue en Vercel (DEPLOY-VERCEL.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/DEPLOY-VERCEL.md): Instrucciones para publicar el frontend en Vercel manteniendo Supabase como backend.
*   `[GUIA]` [**Manual de Pruebas Sandbox Flow (FLOW-SANDBOX-TESTING.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-SANDBOX-TESTING.md): Runbook para pruebas locales y remotas del flujo de pagos de Flow.cl en modo Sandbox.
*   `[GUIA]` [**Gestión de Inventario (INVENTARIO-PRODUCTOS.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/INVENTARIO-PRODUCTOS.md): Detalle del flujo de actualización y sincronización de stock de productos.
*   `[GUIA]` [**Control de Reservas de Stock (INVENTARIO-RESERVAS-STOCK.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/INVENTARIO-RESERVAS-STOCK.md): Lógica de concurrencia y reserva temporal de stock (10 minutos) antes de checkout.
*   `[GUIA]` [**Datos de Demo y Semillas (SEED-PRODUCTOS-DEMO.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/SEED-PRODUCTOS-DEMO.md): Instrucciones y comandos para cargar la base de datos de pruebas.

### 2. Documentación Técnica Modular (GUIA)
*Manual técnico de arquitectura y diseño del sistema.*
*   `[GUIA]` [**00 - Resumen Ejecutivo del Sistema**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/00-overview.md)
*   `[GUIA]` [**01 - Stack Tecnológico y Estructura de Carpetas**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/01-stack.md)
*   `[GUIA]` [**02 - Arquitectura del Sistema**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/02-architecture.md)
*   `[GUIA]` [**03 - Modelo de Dominio y Base de Datos**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/03-domain-model.md)
*   `[GUIA]` [**04 - Casos de Uso Principales**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/04-use-cases.md)
*   `[GUIA]` [**05 - Integración y Flujo de Pagos Flow.cl**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/05-payment-flow.md)
*   `[GUIA]` [**06 - Gestión de Inventario y Reservas de Stock**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/06-inventory-reservations.md)
*   `[GUIA]` [**07 - Seguridad y Políticas de Acceso en Supabase**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/07-supabase-security.md)
*   `[GUIA]` [**08 - Referencia de la API Serverless**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/08-api-reference.md)
*   `[GUIA]` [**09 - Componentes del Frontend y Flujo de Interfaz**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/09-frontend-components.md)
*   `[GUIA]` [**10 - Guía de Instalación y Desarrollo Local**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/10-installation.md)
*   `[GUIA]` [**11 - Guía de Despliegue en Producción**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/11-deployment.md)
*   `[GUIA]` [**12 - Flujo de Trabajo para Futuros Agentes de IA**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/12-agent-workflow.md)
*   `[GUIA]` [**13 - Listas de Verificación y Mantenimiento**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/13-maintenance-checklists.md)
*   `[GUIA]` [**14 - Riesgos Conocidos y Deuda Técnica**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/14-known-risks.md)
*   `[GUIA]` [**15 - Glosario de Términos**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/15-glossary.md)
*   `[GUIA]` [**README Técnico General**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/README.md)

### 3. Reportes de Auditoría e Implementación (REPORTE)
*Reportes de cambios ya ejecutados y verificaciones.*
*   `[REPORTE]` [**Reporte de Auditoría e Independencia de Lovable**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-AUDITORIA-DOCUMENTACION-LOVABLE.md): Detalle de la eliminación de dependencias, auditoría de documentación y borrado del entorno de Lovable.
*   `[REPORTE]` [**Auditoría de Base de Datos y Seguridad (AUDITORIA-FASE-2.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/AUDITORIA-FASE-2.md): Evaluación de políticas RLS y auditoría de la base de datos Supabase.
*   `[REPORTE]` [**Auditoría de Performance de Imágenes (AUDITORIA-PERFORMANCE-IMAGENES.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/AUDITORIA-PERFORMANCE-IMAGENES.md): Evaluación del peso y rendimiento de imágenes en la aplicación.
*   `[REPORTE]` [**Reporte de Categorías Responsive (REPORTE-CATEGORIAS-HOME-RESPONSIVE.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-CATEGORIAS-HOME-RESPONSIVE.md): Cambios ejecutados en el home responsive de catálogo.
*   `[REPORTE]` [**Reporte de GitHub Actions Cron (REPORTE-GITHUB-ACTIONS-CRON-HERO.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-GITHUB-ACTIONS-CRON-HERO.md): Implementación de la automatización del expirador de reservas en GitHub.
*   `[REPORTE]` [**Reporte de Mini Cart Drawer (REPORTE-MINI-CART-DRAWER.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-MINI-CART-DRAWER.md): Implementación del drawer deslizable para el carrito de compras.
*   `[REPORTE]` [**Reporte de Pulido de Interfaz UI/UX (REPORTE-PULIDO-UI-UX-ORBYNEX.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REPORTE-PULIDO-UI-UX-ORBYNEX.md): Bitácora de pulido y refinamiento visual de la interfaz.
*   `[REPORTE]` [**Productos Similares en Detalle (PLAN-PRODUCTOS-SIMILARES-DETALLE.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-PRODUCTOS-SIMILARES-DETALLE.md): Arquitectura, reglas de seleccion, cache y validacion de recomendaciones.

### 4. Planes de Desarrollo Ejecutados (PLAN ejecutado)
*Planes de desarrollo que fueron propuestos e implementados en su totalidad.*
*   `[PLAN ejecutado]` [**Integración de Flow Fase 1: Órdenes y RLS**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-FASE-1-ORDERS-RLS.md)
*   `[PLAN ejecutado]` [**Integración de Flow Fase 2: Endpoints Vercel**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-FASE-2-ENDPOINTS.md)
*   `[PLAN ejecutado]` [**Integración de Flow Fase 3: Checkout y Retorno**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FLOW-FASE-3-RESULTADO-CHECKOUT.md)
*   `[PLAN ejecutado]` [**Fase 3A: Almacenamiento de Imágenes en Supabase**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/FASE-3A-IMAGENES-STORAGE.md)
*   `[PLAN ejecutado]` [**Variantes de Imágenes en Detalle y Cards**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/IMAGENES-VARIANTES-THUMB-CARD-DETAIL.md)
*   `[PLAN ejecutado]` [**Plan de Correcciones del Carrito de Flow**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-CORRECCIONES-CARRITO-FLOW-UI.md)
*   `[PLAN ejecutado]` [**Plan del Cron de Expiración de Reservas**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-HERO-CRON-HOBBY.md)
*   `[PLAN ejecutado]` [**Plan Inicial de Integración con Flow API**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-INTEGRACION-FLOW-API.md)
*   `[PLAN ejecutado]` [**Plan de Inventario Avanzado**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-INVENTARIO-AVANZADO.md)
*   `[PLAN ejecutado]` [**Plan de Optimización de Imágenes de Panel**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-OPTIMIZACION-IMAGENES-PANEL.md)
*   `[PLAN ejecutado]` [**Plan de Reservas de Stock con Cron cada 10 min**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-RESERVAS-STOCK-CRON-10-MIN.md)
*   `[PLAN ejecutado]` [**Rediseño de Home de E-commerce**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/REDISENO-HOME-ECOMMERCE.md)
*   `[PLAN ejecutado]` [**Productos Similares en el Detalle**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PLAN-PRODUCTOS-SIMILARES-DETALLE.md)

### 5. Documentación Histórica (HISTORICO)
*Documentos antiguos archivados para referencia sobre el estado original.*
*   `[HISTORICO]` [**Estado Inicial del Template Base (ESTADO-ACTUAL-TEMPLATE.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/ESTADO-ACTUAL-TEMPLATE.md)
*   `[HISTORICO]` [**Plan de Migración a Supabase Propia (MIGRACION-SUPABASE-PROPIA.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/MIGRACION-SUPABASE-PROPIA.md)
*   `[HISTORICO]` [**Prompts e Instrucciones Operativas Históricas (PROMPT-EJECUTAR-INVENTARIO-FASES-1-5.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/PROMPT-EJECUTAR-INVENTARIO-FASES-1-5.md)

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
