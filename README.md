# Orbynex Mini-Commerce

Este proyecto es una plantilla de desarrollo (boilerplate) moderna, modular y de altísimo rendimiento para la creación rápida de comercios electrónicos ligeros (mini-commerce). Está diseñada para soportar cargas ultra-rápidas, administración del catálogo, control de stock en tiempo real y confirmación transaccional de pagos.

---

## 1. Stack Tecnológico

La aplicación está construida sobre una arquitectura moderna que distribuye el trabajo de manera eficiente entre el cliente y el servidor:

### Frontend & Core: React 19 + TanStack Start (Vinxi)
*   **React 19:** La biblioteca líder para interfaces de usuario, optimizada para Server Components y mayor velocidad.
*   **TanStack Start:** Framework que gestiona todo el ciclo de vida del frontend y backend de la aplicación. Utiliza el motor de empaquetado **Vinxi** y **Vite** para ofrecer renderizado híbrido. Esto significa que combina la velocidad de carga de un sitio pre-renderizado en el servidor (**SSR** - ideal para SEO) con la fluidez interactiva de una aplicación de página única (**SPA** - ideal para el carrito y el panel de administración).
*   **Tailwind CSS v4:** Motor de estilos altamente optimizado y rápido para estructurar el diseño visual mediante variables CSS HSL nativas.
*   **Shadcn UI + Radix:** Colección de componentes de interfaz accesibles y pre-diseñados (botones, menús, diálogos).

### Backend & Base de Datos: Supabase
**Supabase** actúa como la infraestructura de backend en la nube (Backend-as-a-Service o BaaS) del proyecto. Provee:
*   **Base de datos relacional PostgreSQL:** Almacenamiento estructurado de productos, clientes, pedidos e inventarios.
*   **Autenticación integrada (Supabase Auth):** Registro e inicio de sesión de usuarios y administradores con cifrado industrial y tokens JWT.
*   **Seguridad RLS (Row Level Security):** Reglas integradas directamente en las tablas de PostgreSQL que aseguran que solo usuarios autorizados (ej. administradores) puedan leer o escribir registros específicos, previniendo bypasses maliciosos desde el navegador del cliente.
*   **Storage (Almacenamiento de archivos):** Para guardar y servir de manera rápida las imágenes del catálogo de productos.

### Pasarela de Pagos: Flow API
*   Integración transaccional de pagos a través de la pasarela Flow (soporta Webpay de Transbank). El entorno por defecto está preconfigurado para el ambiente de pruebas (sandbox).

---

## 2. Configuración de Variables de Entorno

Para iniciar el proyecto, crea un archivo `.env` en la raíz del proyecto basándote en el archivo [.env.example](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/.env.example). Las siguientes variables son necesarias:

```ini
# Configuración pública de Supabase (Frontend y Backend)
SUPABASE_PROJECT_ID=           # Identificador del proyecto de Supabase
SUPABASE_URL=                  # Endpoint HTTP de conexión de Supabase
SUPABASE_PUBLISHABLE_KEY=      # Clave API pública (segura para usar en el cliente)

# Configuración del servidor de desarrollo Vite (Duplicada para empaquetado)
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Claves de Servidor y Base de Datos (EXCLUSIVAS DE BACKEND)
# ATENCIÓN: La clave Service Role bypassa RLS. NUNCA la importes en componentes cliente (.tsx).
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=               # Cadena de conexión directa a PostgreSQL (ej. postgresql://...)
CRON_SECRET=                   # Token para validar y asegurar ejecuciones automáticas de tareas de cron

# Credenciales de Flow (Pagos)
FLOW_API_KEY=                  # Identificador del comercio en Flow
FLOW_SECRET_KEY=               # Clave secreta transaccional de Flow
FLOW_BASE_URL=https://sandbox.flow.cl/api # Usar www.flow.cl/api en producción

# URLs de retorno y webhooks
APP_PUBLIC_URL=                # Dirección URL pública de tu frontend (ej. http://localhost:8080)
FLOW_RETURN_URL=               # URL a la que vuelve el cliente tras pagar
FLOW_CONFIRMATION_URL=         # Endpoint API donde Flow confirma la transacción (Webhook)
```

---

## 3. Guía de Ejecución Local

### Prerrequisitos
*   Tener instalado **Node.js** (versión 18 o superior).
*   Se recomienda el uso de **pnpm** como gestor de paquetes.

### Paso 1: Instalar dependencias
Instala las librerías necesarias con el siguiente comando en la terminal:
```bash
pnpm install
```

### Paso 2: Configurar las variables
Copia el archivo de ejemplo a tu entorno local:
```bash
cp .env.example .env
```
*Nota: Rellena los valores en el archivo `.env` con tus credenciales de prueba de Supabase y Flow.*

### Paso 3: Iniciar el servidor de desarrollo
Corre la aplicación de forma local:
```bash
pnpm dev
```
La consola indicará la dirección local (por defecto `http://localhost:8080`) donde podrás ver la tienda interactiva.

---

## 4. Validación de Código y Construcción

Para garantizar que el código se encuentra limpio, cumple los estándares de tipos y compila correctamente antes de desplegarlo, ejecuta los siguientes comandos de validación:

*   **Limpiar Logs Temporales:**
    ```bash
    pnpm run clean:logs
    ```
*   **Verificar formato de código (Prettier):**
    ```bash
    pnpm format
    ```
*   **Analizar el código en busca de malas prácticas y bugs comunes (ESLint):**
    ```bash
    pnpm lint
    ```
*   **Validar los tipos estáticos de TypeScript:**
    ```bash
    pnpm exec tsc --noEmit
    ```
*   **Construir el bundle de producción (Build):**
    ```bash
    pnpm build
    ```
    _Este comando compila toda la aplicación y genera la estructura optimizada para producción dentro del directorio `.output`._

---

## 5. Índice de Documentación Relacionada

Para detalles más profundos, la documentación técnica se encuentra ordenada de la siguiente manera:

*   **[Índice General de Documentación](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/README.md):** Mapa central de acceso a especificaciones y guías operativas.
*   **[Gestión de Secretos y Entornos](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/security/GESTION-DE-SECRETOS-Y-ENTORNOS.md):** Directrices de seguridad aplicativa e inyección de variables.
*   **[Guía de Personalización para Nuevos Clientes](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/development/PERSONALIZACION-CLIENTE.md):** Manual detallado para reutilizar y reciclar la plantilla para otros comercios.
*   **[Despliegue en Vercel](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/deployment/DEPLOY-VERCEL.md):** Flujo de despliegue y checklists pre-producción.

---

## 6. Advertencias Importantes de Seguridad

1.  **Exposición de secretos:** Nunca subas el archivo `.env` o archivos de configuración local a repositorios de GitHub. Asegúrate de verificar que el `.gitignore` esté activo y cubra `.env` y `.env.local`.
2.  **Clave Service Role:** El token `SUPABASE_SERVICE_ROLE_KEY` otorga acceso total de borrado, escritura y lectura sin restricciones RLS a toda tu base de datos. Bajo ninguna circunstancia importes `src/integrations/supabase/client.server.ts` dentro de componentes visuales o archivos del frontend (`.tsx`). Debe restringirse exclusivamente a archivos de backend y server components (`.server.ts`), protegidos estáticamente por la directiva `importProtection` en `vite.config.ts`.
3.  **Ambiente de producción:** Asegúrate de cambiar `FLOW_BASE_URL` a la URL de producción de Flow e invalidar todas las credenciales de prueba del sandbox en el hosting (ej. Vercel) al lanzar la tienda para un cliente final.
