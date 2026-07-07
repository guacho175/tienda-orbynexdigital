# 10 - Guía de Instalación y Desarrollo Local

Este documento detalla los requisitos previos, el proceso de instalación de dependencias, la configuración del entorno de desarrollo y los pasos para conectar la aplicación con Supabase y el entorno sandbox de Flow.cl.

---

## 1. Requisitos Previos

Asegúrate de contar con las siguientes herramientas instaladas en tu máquina de desarrollo:

*   **Node.js**: Versión 18.0.0 o superior (se recomienda v20.x LTS).
*   **Gestor de Paquetes**: `bun` (instalación recomendada por velocidad y compatibilidad con el archivo `bun.lock` del proyecto) o en su defecto `npm` / `pnpm`.
*   **Git**: Para control de versiones y sincronización con GitHub.

---

## 2. Instalación Paso a Paso

1.  **Clonar el Repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd tienda-orbynexdigital
    ```

2.  **Instalar Dependencias**:
    Utilizando Bun (gestor predeterminado):
    ```bash
    bun install
    ```
    O usando NPM convencional:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Copia el archivo de plantilla `.env.example` en la raíz del proyecto para crear tu archivo local `.env`:
    ```bash
    cp .env.example .env
    ```
    Abre el archivo `.env` resultante y completa los valores requeridos (detallados en la siguiente sección) sin subirlo al control de versiones.

---

## 3. Configuración de Variables de Entorno (.env)

El archivo `.env` debe incluir las siguientes variables básicas para el funcionamiento local:

```env
# Conexión Pública Cliente Supabase
VITE_SUPABASE_PROJECT_ID=tu_project_id
VITE_SUPABASE_URL=https://tu_project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu_public_anon_key

# Conexión Privada Servidor Supabase
SUPABASE_PROJECT_ID=tu_project_id
SUPABASE_URL=https://tu_project_id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Token de seguridad para ejecutar el cron de expiración local
CRON_SECRET=clave_secreta_para_ejecutar_cron

# Configuración de Pasarela Flow Chile (Sandbox)
FLOW_API_KEY=tu_flow_api_key_sandbox
FLOW_SECRET_KEY=tu_flow_secret_key_sandbox
FLOW_BASE_URL=https://sandbox.flow.cl/api

# URLs de Retorno de la Aplicación
APP_PUBLIC_URL=http://localhost:5173
FLOW_RETURN_URL=http://localhost:5173/checkout/resultado
FLOW_CONFIRMATION_URL=https://tu-tunel-ngrok.ngrok-free.app/api/flow/confirm
```

---

## 4. Comandos de Desarrollo y Verificación

El proyecto cuenta con scripts NPM pre-configurados para controlar el ciclo de vida local:

*   **Correr Servidor de Desarrollo**:
    ```bash
    bun dev
    ```
    Inicia Vite y Nitro localmente en `http://localhost:5173`.
*   **Compilar para Producción**:
    ```bash
    bun build
    ```
    Genera el empaquetado optimizado del cliente y los endpoints del servidor en la carpeta `.output`.
*   **Previsualizar Build Local**:
    ```bash
    bun preview
    ```
    Monta el servidor web local sirviendo los archivos compilados de producción para probar velocidad e integraciones antes del deploy.
*   **Ejecutar Linter**:
    ```bash
    bun lint
    ```
    Analiza el código en búsqueda de errores de sintaxis o malas prácticas.
*   **Dar Formato con Prettier**:
    ```bash
    bun format
    ```

> [!WARNING]
> **Advertencia de Saltos de Línea CRLF / LF**:
> En entornos de desarrollo sobre Windows, es común que Git modifique los saltos de línea a `CRLF`, provocando que el linter o Prettier fallen en la validación antes de producción. Se recomienda configurar Git en Windows para mantener los saltos de línea en formato `LF`:
> ```bash
> git config --global core.autocrlf false
> ```

---

## 5. Cómo Probar el Sandbox de Flow Localmente

La pasarela de pagos Flow requiere comunicarse asíncronamente con tu servidor web para enviarle la confirmación del pago mediante el webhook de confirmación. En un entorno de desarrollo local (`localhost`), los servidores de Flow no pueden acceder directamente a tu PC.

Para probar el flujo de checkout completo en local:

1.  **Instalar ngrok o Localtunnel**:
    Crea un túnel seguro desde internet a tu servidor local de desarrollo:
    ```bash
    ngrok http 5173
    ```
2.  **Configurar URL de Confirmación**:
    Copia la URL HTTPS pública provista por ngrok (ej. `https://a1b2-34-56-78.ngrok-free.app`) y actualiza la variable `FLOW_CONFIRMATION_URL` en tu archivo `.env`:
    ```env
    FLOW_CONFIRMATION_URL=https://a1b2-34-56-78.ngrok-free.app/api/flow/confirm
    ```
3.  **Realizar Compras de Prueba**:
    Accede a tu tienda local, agrega productos al carrito, ve al checkout e inicia el pago online. Al ser redirigido a Flow Sandbox, utiliza los siguientes datos de tarjeta de prueba provistos en [datos Pruebas.md](file:///c:/Users/galin/OneDrive/Documentos/Galindez_Boveda/Tienda.orbinexdigital/datos%20Pruebas.md) para simular transacciones aprobadas o fallidas.
