# Guía de Personalización para Nuevos Clientes

Este documento describe los pasos necesarios para reciclar y parametrizar la plantilla **Orbynex Mini-Commerce** para adaptarla a la identidad y requerimientos de un nuevo comercio electrónico.

---

## 1. Configuración de Entorno e Infraestructura

Para cada nuevo cliente, es obligatorio aprovisionar e integrar instancias independientes de los siguientes servicios:

### A. Base de Datos y Backend (Supabase)
1.  Crear una nueva organización y proyecto en el panel de control de Supabase.
2.  Aplicar el esquema de base de datos ejecutando las migraciones de PostgreSQL locales (`pnpm exec supabase db push` o importando los scripts SQL en el editor de Supabase).
3.  Obtener las credenciales del proyecto y agregarlas en el panel de variables de entorno de producción/local:
    *   `SUPABASE_PROJECT_ID`
    *   `SUPABASE_URL`
    *   `SUPABASE_PUBLISHABLE_KEY` (Anon Key)
    *   `SUPABASE_SERVICE_ROLE_KEY` (Clave administrativa - ¡mantener oculta!)
    *   `SUPABASE_DB_URL` (Cadena de conexión directa para migraciones)

### B. Pasarela de Pagos (Flow API)
1.  Solicitar al cliente su cuenta comercial de Flow (o crear una de pruebas en sandbox.flow.cl).
2.  Obtener las llaves del panel de Flow en *Configuración -> API*:
    *   `FLOW_API_KEY`
    *   `FLOW_SECRET_KEY`
3.  Definir las URLs del dominio del cliente:
    *   `APP_PUBLIC_URL=https://tienda-cliente.vercel.app`
    *   `FLOW_RETURN_URL=https://tienda-cliente.vercel.app/checkout/resultado`
    *   `FLOW_CONFIRMATION_URL=https://tienda-cliente.vercel.app/api/flow/confirm`

---

## 2. Personalización Visual y de Marca

### A. Paleta de Colores y Estilos (Tailwind CSS v4)
Los tokens de diseño visual (colores de fondo, acentos primarios/secundarios, bordes de botones) están definidos en [src/styles.css](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/src/styles.css) utilizando variables CSS nativas.
Para cambiar los colores corporativos del cliente, modifica los valores HSL en la sección de temas:

```css
@theme {
  --color-background: hsl(220 33% 98%);    /* Fondo general */
  --color-foreground: hsl(224 71.4% 4.1%); /* Texto principal */
  --color-primary: hsl(263.4 70% 50.4%);   /* Color de marca primario */
  --color-accent: hsl(263.4 70% 90%);      /* Acentos de botones/banners */
}
```

### B. Logotipo e Iconografía
*   **Archivos de imagen:** Los logotipos e isotipos del e-commerce se encuentran en el directorio `public/` (e.g., `logo.svg`, `favicon.ico`). Reemplázalos por los assets del nuevo comercio manteniendo los nombres de archivo para consistencia.
*   **Metadata del Sitio:** Actualiza el título y descripciones del sitio en [src/routes/__root.tsx](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/src/routes/__root.tsx) para la optimización SEO inicial del cliente.

---

## 3. Configuración Regional y Reglas de Negocio

El proyecto actual está configurado por defecto para el mercado chileno. Para modificar la localización:

### A. Moneda y Formatos
*   Los precios se muestran formateados en pesos chilenos (**CLP**). Para cambiar la divisa o el formato de idioma locale:
    *   Modifica el formateador en `src/utils/currency.ts` o centraliza la configuración en `src/config/commerce.ts` ajustando el locale a la región del cliente (ej. `es-MX` para México con `MXN`).

### B. Identificación Fiscal (RUT)
*   La validación y captura del identificador fiscal en el checkout (RUT) se implementa en `src/routes/checkout.tsx`.
*   Si el cliente opera en otro mercado (ej. RFC en México, RUC en Perú o DNI en Argentina), actualiza la máscara de validación de texto en el formulario de facturación.

---

## 4. Carga de Catálogo y Control administrativo
1.  **Carga Inicial:** Sigue las instrucciones de [SEED-PRODUCTOS-DEMO.md](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/development/SEED-PRODUCTOS-DEMO.md) para cargar los productos iniciales y las imágenes de catálogo.
2.  **Roles Admin:** Crea el primer usuario administrador registrándolo en Supabase Auth y luego insertando su `user_id` en la tabla `user_roles` con `role = 'admin'`.
