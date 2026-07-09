# Manual de Traspaso para Futuros Agentes (Agent Handoff)

> [!NOTE]
> **Editor compacto de productos (2026-07-09):** Fases 1 y 2 implementadas; Fase 3 no iniciada y requiere autorizacion explicita. La implementacion vive en `src/components/admin/product-editor/` y mantiene la API de `ProductForm`. Antes de continuar se necesita QA autenticado en `/admin/new` y `/admin/edit/$id`. El lint dirigido pasa; el lint global conserva deuda CRLF/Prettier previa. Ver `docs/PLAN-MAESTRO-EDITOR-PRODUCTO-COMPACTO.md` y `docs/REPORTE-EJECUCION-EDITOR-COMPACTO-FASES-1-2.md`.

Este documento es una guía de transferencia rápida diseñada específicamente para agentes de Inteligencia Artificial que operen en este repositorio en el futuro. Léelo detenidamente antes de realizar cualquier cambio en el código.

---

## 1. Resumen Ejecutivo del Estado del Proyecto

El e-commerce está completamente operativo y cuenta con una arquitectura desacoplada estructurada en:
1.  **Frontend**: React + Vite + TanStack Start (Router) + Tailwind CSS v4. El estado del carrito se maneja localmente (`localStorage`).
2.  **API / Backend**: Endpoints serverless escritos en TypeScript alojados en Vercel Functions bajo `/api`.
3.  **Base de Datos**: PostgreSQL en Supabase, con políticas RLS activas en todas las tablas y control de stock encapsulado en funciones RPC SQL ejecutadas con privilegios administrativos (`service_role`).
4.  **Pasarelas y Tareas**: Integración transaccional con Flow.cl (Chile) y cron automatizado en Vercel que gatilla la liberación de reservas expiradas cada 1 minuto.

> [!IMPORTANT]
> **Estado del Backend**: El backend se encuentra estabilizado y testeado. **Queda estrictamente prohibido realizar modificaciones en la lógica del backend**, migraciones, RPCs, endpoints de la API, Flow o Supabase. Todas las iteraciones futuras del proyecto deben enfocarse puramente en el diseño, optimización y funcionalidad del **frontend**.

---

## 2. Archivos Críticos a No Modificar sin Autorización

No alteres la lógica de los siguientes archivos a menos que el usuario lo solicite expresamente en un plan aprobado:
*   `api/flow/confirm.ts`: Endpoint webhook de confirmación. Contiene lógica de firmas, validaciones y consulta GET directa a Flow para prevenir suplantaciones.
*   `supabase/migrations/20260707023000_stock_reservations_flow_inventory.sql`: Código SQL transaccional y RPCs (`confirm_order_payment_and_capture_stock`, `create_order_with_stock_reservation`).
*   `src/routes/_authenticated/route.tsx`: Control de rutas protegidas del panel de administración.
*   `vite.config.ts` y `vercel.json`: Configuraciones de compilación y cron-jobs en la nube de Vercel.

---

## 3. Reglas de Oro de Seguridad y Operaciones

1.  **Nunca expongas secretos**: No dejes rastros de llaves de API reales ni contraseñas. Utiliza las variables del entorno en Node.js y variables con prefijo `VITE_` en el cliente.
2.  **Respeta las políticas RLS**: La escritura en tablas de órdenes y stock está bloqueada para accesos anónimos. La creación y el decremento de inventario se gestionan exclusivamente mediante RPCs privilegiadas gatilladas desde la API del servidor.
3.  **Protege la historia de Git**: Evita reescribir la historia publicada (ej. `git push --force`, `git commit --amend`, o `git rebase` de commits ya publicados), ya que esto puede desestabilizar entornos de integración y despliegue continuos.
4.  **Mantenga el Checkout Híbrido**: La visualización y botones de compra de productos deben tolerar tanto el pago online automatizado (Flow) como la compra mediante links de cobro externo (`payment_url`) registrados en la base de datos de productos.

---

## 4. Referencia Rápida de Comandos

Utiliza preferentemente `bun` para ejecutar los scripts del ciclo de vida del desarrollo:
*   `bun dev`: Correr el servidor de desarrollo local.
*   `bun build`: Compilar la aplicación para producción.
*   `bun preview`: Previsualizar la compilación de producción localmente.
*   `bun lint`: Ejecutar análisis del linter.
*   `bun format`: Formatear archivos con Prettier.

---

## 📂 Enlaces de Documentación Completa

Para profundizar en cualquier dominio específico de la plataforma, consulta la guía modular correspondiente:
*   [**Índice de Guías Técnicas (docs/technical/README.md)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/README.md)
*   [**02 - Diagramas de Arquitectura y Flujos**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/02-architecture.md)
*   [**03 - Estructura de Tablas Supabase (ERD)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/03-domain-model.md)
*   [**05 - Funcionamiento Detallado de Pagos Flow**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/05-payment-flow.md)
*   [**06 - Explicación de Reservas de Stock (10 min)**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/06-inventory-reservations.md)
*   [**10 - Guía de Instalación Local y ngrok**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/10-installation.md)
