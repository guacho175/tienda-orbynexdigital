# 11 - Guía de Despliegue en Producción

Este documento describe los requerimientos para desplegar la plataforma e-commerce Orbynex en ambientes productivos de Vercel y Supabase, configurando la pasarela Flow en modo real, activando tareas automatizadas (crons) y monitoreando la salud del sistema.

---

## 1. Despliegue de la Base de Datos (Supabase)

Antes de conectar tu entorno de producción de Vercel, asegúrate de configurar tu instancia productiva de Supabase:

1.  **Ejecutar las Migraciones**:
    Aplica todos los scripts de migración ordenadamente sobre tu base de datos de producción mediante el CLI de Supabase o copiando el contenido de los archivos SQL de `/supabase/migrations/` en el editor de SQL de tu panel de Supabase.
2.  **Verificar Políticas RLS**:
    Asegúrate de que la Row Level Security (RLS) esté habilitada en todas las tablas (`products`, `user_roles`, `orders`, `order_items`, `stock_reservations`) y de que los permisos de escritura pública estén bloqueados.
3.  **Configurar Bucket de Storage**:
    Crea el bucket de almacenamiento público `product-images` y asegúrate de asignarle las políticas de lectura a `PUBLIC` y las de escritura únicamente a administradores logueados.

---

## 2. Configuración en Vercel

La aplicación está diseñada para compilarse y alojarse de forma nativa en la infraestructura Serverless de Vercel.

1.  **Vincular el Proyecto**:
    Conecta tu repositorio de GitHub a tu panel de control de Vercel.
2.  **Configurar Variables de Entorno**:
    Ingresa al apartado de Settings de tu proyecto en Vercel y registra todas las variables de entorno de producción equivalentes a las de tu archivo `.env` (pero con llaves y credenciales oficiales de producción para Flow y Supabase).
3.  **Cron de Expiración en Vercel**:
    El archivo `vercel.json` en la raíz del repositorio configura de manera automática la ruta del programador en la nube de Vercel:
    ```json
    {
      "crons": [
        {
          "path": "/api/stock/expire-reservations",
          "schedule": "* * * * *"
        }
      ]
    }
    ```
    *   **Importante**: Vercel gatillará este endpoint automáticamente cada 1 minuto en producción. Asegúrate de registrar la variable `CRON_SECRET` idéntica tanto en las variables de entorno de Vercel como en el header de autorización configurado para el trigger en el panel de Vercel Cron.

---

## 3. Integración con Flow Producción

Para transicionar desde el Sandbox al ambiente real de Flow Chile:

1.  **Cambiar URL Base**:
    Actualiza la variable de entorno `FLOW_BASE_URL` apuntándola al endpoint transaccional oficial:
    ```env
    FLOW_BASE_URL=https://www.flow.cl/api
    ```
2.  **Reemplazar Llaves**:
    Solicita tus llaves comerciales definitivas en tu portal de comercio de Flow y actualiza las variables de entorno `FLOW_API_KEY` y `FLOW_SECRET_KEY` en Vercel.
3.  **Configurar URLs de Producción**:
    Asegúrate de que `APP_PUBLIC_URL`, `FLOW_RETURN_URL` y `FLOW_CONFIRMATION_URL` apunten a los subdominios de producción definitivos asignados en Vercel (ej. `https://mi-tienda.com`).

---

## 4. Checklist de Pre-Lanzamiento (Go-Live)

Realiza las siguientes verificaciones obligatorias antes de abrir la tienda a transacciones reales:

*   [ ] **Verificación de RLS**: Las tablas de órdenes y reservas no tienen políticas de inserción o actualización directa habilitadas al público.
*   [ ] **Limpieza de Datos**: La tabla `products` de producción no contiene productos de prueba o demostración que carezcan de stock físico real.
*   [ ] **Integridad del Cron**: El cron de Vercel se encuentra en estado "Active" y se ejecuta de forma exitosa cada 1 minuto (verificar logs del cron en la pestaña *Crons* de Vercel).
*   [ ] **Prueba de Redirección**: Realizar una compra real de bajo valor (ej. $1.000 CLP) y confirmar que la redirección a Flow, la aprobación bancaria y el retorno del cliente a `/checkout/resultado` funcionan correctamente en producción.
*   [ ] **Verificación de Stock**: Confirmar que al completarse la compra real anterior, el stock físico del producto se redujo exactamente en la cantidad adquirida en el panel de Supabase.

---

## 5. Logs y Monitoreo

*   **Logs del Servidor**: Accede a la pestaña *Logs* de Vercel para visualizar las peticiones en caliente a los endpoints de la API. Monitorea especialmente los errores `502 Bad Gateway` (fallas de conexión del API de Flow) y `409 Conflict` (conflictos de stock físico).
*   **Logs de Errores en Supabase**: Revisa el apartado de *API logs* y *Database logs* en tu consola de Supabase para capturar excepciones no controladas lanzadas por las funciones SQL RPC durante los checkouts concurrentes.
