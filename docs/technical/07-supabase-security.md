# 07 - Seguridad y Políticas de Acceso en Supabase

Este documento detalla el esquema de seguridad del backend en Supabase, la configuración de políticas a nivel de fila (RLS), la asignación de permisos (Grants), y el uso seguro de funciones privilegiadas (RPCs) y tokens de acceso.

---

## 1. Modelo de Seguridad y Niveles de Rol

El backend del e-commerce cuenta con tres niveles de roles lógicos, cada uno con un set de privilegios acotado en base a su nivel de confianza:

| Rol | Tipo de Cliente | Permisos de Acceso | Privilegios |
| :--- | :--- | :--- | :--- |
| **anon** | Cliente final (Navegador) | Llave pública anónima | Solo lectura (`SELECT`) de productos activos. |
| **authenticated** | Cliente logueado o Administrador | Token JWT del usuario | Lectura de sus propios roles y órdenes. Si el rol es `admin`, tiene bypass de RLS en productos y órdenes. |
| **service_role** | API Serverless (Backend) | Llave privada secreta | Acceso total de lectura/escritura (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). |

---

## 2. Row Level Security (RLS) y Políticas por Tabla

La seguridad a nivel de fila está activada globalmente para todas las tablas del e-commerce. Esto previene que clientes maliciosos utilicen el cliente de Supabase en el navegador para editar precios, ver órdenes ajenas o secuestrar stock.

### 2.1. Roles de Usuario (`public.user_roles`)
*   **Permiso Público (`anon`)**: Revocado por completo (no puede ver roles de nadie).
*   **Permiso Autenticado**: Solo lectura de sus propios registros:
    ```sql
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
    ```

### 2.2. Catálogo de Productos (`public.products`)
*   **Permiso Público (`anon` / `authenticated` regular)**: Solo lectura de productos activos para evitar mostrar items deshabilitados en el catálogo:
    ```sql
    CREATE POLICY "Public can view active products"
      ON public.products FOR SELECT TO anon, authenticated
      USING (is_active = true);
    ```
*   **Permiso Administrador**: Control total sobre inserciones, actualizaciones y borrados basado en su rol:
    ```sql
    CREATE POLICY "Admins can update products"
      ON public.products FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    ```

### 2.3. Órdenes y Detalles (`public.orders` & `public.order_items`)
*   **Permiso Público / Cliente regular**: Escritura directa bloqueada por completo (`REVOKE ALL`). Solo pueden leer órdenes creadas bajo su propia cuenta:
    ```sql
    CREATE POLICY "Users can view own orders"
      ON public.orders FOR SELECT TO authenticated
      USING (user_id = auth.uid());
    ```
*   **Permiso Administrador**: Lectura de todo el listado de ventas para gestión en panel.

### 2.4. Reservas de Stock (`public.stock_reservations`)
*   **Permiso Público / Cliente regular**: Acceso de escritura y lectura revocado por completo (`REVOKE ALL`). Las RLS están activadas pero no existen políticas públicas. Sólo el backend ejecutado con `service_role` puede interactuar con esta tabla.

---

## 3. SQL Remote Procedure Calls (RPC) y SECURITY DEFINER

Las operaciones transaccionales más críticas (como pre-reservar stock al crear la orden o descontar stock al confirmar el pago) se implementan mediante funciones PL/pgSQL directamente en base de datos.

### 3.1. Mitigación de Vulnerabilidades con RPCs
*   **Uso estricto de `SECURITY DEFINER`**: Las RPCs se ejecutan con los privilegios del creador de la función (el superusuario), evadiendo las RLS temporalmente de forma interna para realizar cálculos y escrituras controladas.
*   **Restricción de Ejecución**: Los permisos de ejecución en las funciones RPC están explícitamente revocados para usuarios anónimos y autenticados regulares. Sólo la `service_role` del backend Vercel puede gatillar su ejecución:
    ```sql
    REVOKE EXECUTE ON FUNCTION public.confirm_order_payment_and_capture_stock(UUID, JSONB, TEXT)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.confirm_order_payment_and_capture_stock(UUID, JSONB, TEXT)
      TO service_role;
    ```
*   **Prevención de Secuestro de Path (`search_path`)**: Para mitigar ataques de inyección de esquemas (donde un atacante crea una función maliciosa con el mismo nombre en un esquema público para ser ejecutada por la RPC privilegiada), todas las funciones definen explícitamente el `search_path` limitándolo a `public`:
    ```sql
    CREATE OR REPLACE FUNCTION public.expire_stock_reservations()
    ...
    SECURITY DEFINER
    SET search_path = public
    ```

---

## 4. Riesgos de Seguridad a No Romper en el Futuro

Cualquier cambio futuro en el backend o en el frontend debe apegarse rigurosamente a las siguientes directrices de seguridad:

1.  **NO deshabilitar las RLS** bajo ninguna circunstancia.
2.  **NO exponer la `supabaseServiceRoleKey`** en el cliente (código dentro de `/src`). Su uso está restringido exclusivamente a los archivos que se ejecutan en Node.js del servidor (`/api` o `/src/server`).
3.  **NO cambiar las firmas de las RPCs** sin revocar nuevamente los permisos de ejecución a `PUBLIC`, `anon` y `authenticated`. Por defecto, PostgreSQL otorga permisos de ejecución pública a cualquier nueva función creada.
4.  **NO crear políticas de inserción o actualización directa en la tabla de órdenes** para clientes del frontend. Todo flujo de creación de orden debe pasar exclusivamente a través de la API serverless y la RPC correspondiente.
