# Gestión de Secretos y Entornos (Orbynex Mini-Commerce)

Esta guía define las directrices y estándares de seguridad para la administración de secretos, variables de entorno y credenciales a lo largo del ciclo de vida de desarrollo, pruebas y producción de la plantilla.

---

## 1. Definición y Segregación de Variables

Para evitar la fuga de secretos en el navegador, el proyecto implementa una estricta separación de responsabilidades:

### A. Variables Públicas (Client-Side)
*   **Prefijo obligatorio:** `VITE_` (ej. `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
*   **Comportamiento:** Estas variables se compilan e inyectan estáticamente en el bundle de Javascript que el navegador descarga.
*   **Regla de seguridad:** **NUNCA** coloques secretos, claves privadas o tokens en variables con prefijo `VITE_`.

### B. Variables Privadas (Server-Side)
*   **Sin prefijo `VITE_`:** (ej. `SUPABASE_SERVICE_ROLE_KEY`, `FLOW_SECRET_KEY`, `SUPABASE_DB_URL`).
*   **Comportamiento:** Solo son accesibles en el entorno de ejecución del servidor (Serverless Functions y Server Components de TanStack Start/Vite).
*   **Regla de seguridad:** Bajo ningún concepto deben importarse ni usarse en archivos de la interfaz de usuario (`.tsx` cliente).

---

## 2. Configuración y Gestión por Entorno

El proyecto se comporta según las variables provistas en cada uno de los siguientes ambientes:

### A. Desarrollo Local (`.env`)
*   Se crea copiando `.env.example` a `.env` (este archivo está excluido en Git mediante `.gitignore`).
*   Usa el endpoint de sandbox de Flow (`https://sandbox.flow.cl/api`) para transacciones simuladas.
*   Se apunta a una base de datos local o un proyecto de Supabase dedicado a desarrollo.

### B. Ambiente de Pruebas / QA
*   Las credenciales administrativas de Supabase o las del panel de pruebas se almacenan de manera local y nunca en la documentación Markdown del proyecto.
*   Permite validar flujos transaccionales reales usando tarjetas simuladas de sandbox.

### C. Staging
*   Entorno espejo de producción que apunta a una base de datos aislada y pasarela Flow en modo sandbox.
*   Configurado mediante el panel de variables de entorno del hosting de despliegue (ej. Vercel) sin archivos `.env` locales en el servidor.

### D. Producción
*   Se conecta a la pasarela real de Flow (`https://www.flow.cl/api`) y requiere credenciales reales del cliente final.
*   Utiliza variables configuradas directamente en la plataforma de hosting (Vercel) con encriptación en reposo.

---

## 3. Políticas del Service Role de Supabase (`SUPABASE_SERVICE_ROLE_KEY`)

La clave `SUPABASE_SERVICE_ROLE_KEY` actúa como un bypass de todas las reglas de Row Level Security (RLS) en la base de datos PostgreSQL. Su uso está sujeto a las siguientes reglas estrictas:

1.  **Aislamiento:** Solo se instancia en `src/integrations/supabase/client.server.ts` y en el backend de Flow `src/server/flow/supabase.ts`.
2.  **No importación cliente:** No se debe importar ningún módulo `*.server.ts` desde componentes del cliente.
3.  **Seguridad en el compilador:** El compilador de Vite tiene activa la directiva `importProtection` que interrumpe el build si detecta un import ilegal del lado cliente.

---

## 4. Archivos que NUNCA deben versionarse

Los siguientes archivos deben estar excluidos en el archivo `.gitignore` y nunca subirse al repositorio de Git:
*   `.env` (Variables locales de desarrollo)
*   `.env.local` / `.env.*.local` (Configuraciones de entorno locales)
*   `.vercel/` (Archivos de caché y metadata del hosting Vercel; debe estar en
    `.gitignore`, no solo en exclusiones locales de Git)
*   `*.log` / `*.err.log` (Archivos de logs temporales generados por la ejecución)
*   `node_modules/` (Dependencias del proyecto)
*   `dist/` / `.output/` (Archivos compilados de build)

---

## 5. Proceso de Incorporación de un Nuevo Cliente

Para clonar y configurar la plantilla para un nuevo comercio:
1.  Crear un nuevo proyecto en Supabase y aplicar las migraciones de base de datos (`supabase db push`).
2.  Crear una cuenta comercial en Flow y obtener la API Key y el Secret Key del ambiente correspondiente.
3.  Configurar las variables de entorno en el hosting (ej. Vercel) asociando los valores reales.
4.  Crear los roles administrativos iniciales insertando manualmente un registro en la tabla `user_roles` de Supabase para el ID del usuario del cliente.

---

## 6. Procedimiento en caso de Exposición de Secretos

Si se detecta que un secreto (ej. `SUPABASE_SERVICE_ROLE_KEY` o `FLOW_SECRET_KEY`) ha sido comprometido o subido al repositorio Git:
1.  **Acción Inmediata (Rotación):** Generar una nueva clave desde el panel administrativo del proveedor (Supabase o Flow) e invalidar la anterior de inmediato.
2.  **Actualizar Entorno:** Actualizar el panel de control de Vercel/Staging/Producción y los archivos locales de desarrollo con el nuevo valor.
3.  **Auditoría de Acciones:** Revisar los registros de auditoría de Supabase (`product_audit_events` y logs de Auth) para descartar accesos maliciosos durante la ventana de exposición.
4.  **No reescribir historial de Git automáticamente:** Si el secreto fue subido a un commit anterior, rotar la clave lo hace inútil inmediatamente, lo cual es la solución más segura y recomendada frente a una reescritura destructiva de Git.
