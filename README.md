# Orbynex Digital — Tienda Digital E-Commerce

Tienda en línea premium diseñada para la comercialización de servicios y productos digitales, desarrollada utilizando un stack moderno, responsivo y de alto rendimiento.

---

## 🚀 Características Principales

*   **Catálogo Dinámico & Detalle**: Presentación fluida de productos y servicios con selección inteligente de imágenes optimizadas.
*   **Carrito e Inventario Avanzado**: Control de inventario en tiempo real con sistema de reservas de stock de 10 minutos para evitar ventas duplicadas (Double-selling prevention).
*   **Checkout & Pagos Integrados**: Soporte nativo para pagos en línea con Flow (Webpay Sandbox/Producción), enlaces de pago externos y checkout rápido por WhatsApp.
*   **Panel de Administración**: Gestión completa de productos (CRUD), control de activación y subida/optimización automática de imágenes.
*   **Aero-Estética Premium**: Animaciones sutiles, micro-interacciones interactivas, soporte para tema oscuro y diseño responsivo adaptado a dispositivos móviles.

---

## 🛠️ Tecnologías y Stack

*   **Frontend**: [React 19](https://react.dev/), [TanStack Start](https://tanstack.com/router/v1/docs/start/overview), [Vite 8](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
*   **Backend Serverless**: [Vercel Serverless Functions](https://vercel.com/docs/functions) (Endpoints de API en `/api/*`)
*   **Base de Datos y Auth**: [Supabase](https://supabase.com/) (PostgreSQL con Row Level Security (RLS) y RPCs de base de datos)
*   **Pasarela de Pago**: [Flow.cl](https://www.flow.cl/) (API REST para cobros locales)
*   **Tareas Programadas**: [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) (Limpieza de reservas de stock)

---

## 🟢 Estado Actual del Sistema

### Backend (Estabilizado - Solo Lectura / Mantenimiento)
*   **Base de Datos**: PostgreSQL estructurado y protegido mediante RLS. Las tablas principales (`products`, `orders`, `order_items`, `stock_reservations`, `user_roles`) y relaciones de llaves foráneas están completamente funcionales.
*   **RPCsSQL de Confianza**: La lógica crítica de concurrencia e inventario se ejecuta mediante funciones PostgreSQL RPC (`create_order_with_stock_reservation`, `confirm_order_payment_and_capture_stock`, `release_order_stock_reservations`) con privilegios `SECURITY DEFINER` restringidos al rol `service_role`.
*   **Expirador Automático**: Sincronización del cron-job en Vercel cada 1 minuto para liberar reservas obsoletas.

### Frontend (Desarrollo Activo / Prioritario)
*   **Enrutamiento**: TanStack Router con carga bajo demanda y controles SSR deshabilitados para garantizar compatibilidad SPA estricta.
*   **Sincronización en Caliente**: Catálogo y checkout integrados dinámicamente con la API de disponibilidad para descontar reservas temporales de stock en tiempo real.
*   **Carga de Imágenes**: Optimización, compresión y redimensionamiento pre-subida integrado en el cliente (`storage.service.ts`), convirtiendo toda imagen del panel administrativo a WebP antes del envío a Supabase.

---

## 🔒 Advertencias de Seguridad Importantes

> [!WARNING]
> *   **Uso Seguro de Credenciales**: La variable `SUPABASE_SERVICE_ROLE_KEY` otorga bypass total sobre las políticas RLS. **Nunca** debe ser incluida ni cargada en código cliente del frontend (carpeta `/src/routes/` o `/src/components/`). Su instanciación está estrictamente restringida a endpoints del servidor (`/api/` o utilitarios `.server.ts`).
> *   **Integridad de Transacciones**: La validación de montos y estados en Flow en el webhook de confirmación (`/api/flow/confirm.ts`) se ejecuta del lado del servidor consultando la API oficial de Flow. No se debe confiar en los parámetros del payload HTTP del cliente para actualizar el estado de órdenes.

---

## ⚙️ Variables de Entorno Requeridas

Crea un archivo `.env` (o `.env.local` para desarrollo local) en la raíz del proyecto basándote en [.env.example](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/.env.example):

```bash
# Supabase Local/Remoto
SUPABASE_PROJECT_ID=tu_project_id
SUPABASE_URL=https://tu_proyecto.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu_public_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Replicación para Vite (Client-side)
VITE_SUPABASE_PROJECT_ID=tu_project_id
VITE_SUPABASE_URL=https://tu_proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu_public_key

# Configuración del Cron
CRON_SECRET=clave_segura_de_cron

# API de Flow
FLOW_API_KEY=tu_api_key_flow
FLOW_SECRET_KEY=tu_secret_key_flow
FLOW_BASE_URL=https://sandbox.flow.cl/api # O https://www.flow.cl/api en producción
APP_PUBLIC_URL=https://tu-tienda.vercel.app
FLOW_RETURN_URL=https://tu-tienda.vercel.app/checkout/resultado
FLOW_CONFIRMATION_URL=https://tu-tienda.vercel.app/api/flow/confirm
```

---

## 💻 Desarrollo Local

Para correr el proyecto localmente, asegúrate de tener instalado [Bun](https://bun.sh/) o Node.js.

1.  **Instalar dependencias**:
    ```bash
    bun install
    ```
2.  **Correr servidor de desarrollo**:
    ```bash
    bun run dev
    ```
    El sitio estará disponible por defecto en `http://localhost:5173` (o la dirección que asigne Vite).
3.  **Compilar para producción**:
    ```bash
    bun run build
    ```
4.  **Ejecutar formateador y linter**:
    ```bash
    bun run format
    bun run lint
    ```

---

## 📚 Documentación Técnica Detallada

El proyecto cuenta con una amplia documentación estructurada:

*   **[Índice General de Documentos (docs/INDEX.md)](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/INDEX.md)**: Acceso directo a los reportes de desarrollo y análisis históricos.
*   **[Índice de Módulos Técnicos (docs/technical/README.md)](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/README.md)**: Directorio para la arquitectura, modelo de dominio, flujos de pago, seguridad y guías de mantenimiento.
*   **[Manual para Agentes (Handoff) (docs/AGENT-HANDOFF.md)](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/AGENT-HANDOFF.md)**: Resumen operativo rápido para futuros asistentes de IA.
