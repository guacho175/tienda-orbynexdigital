# 13 - Listas de Verificación y Mantenimiento

Este documento proporciona listas de verificación estandarizadas para las tareas comunes de mantenimiento técnico y operaciones de la plataforma e-commerce Orbynex.

---

## 1. Cambios en la Interfaz (Frontend)

*   [ ] **TypeScript Estricto**: Asegurar que todas las nuevas props, estados o tipos definidos no utilicen el tipo `any` y posean tipos correctos heredados de `@/types/`.
*   [ ] **Compatibilidad CSS**: Validar que los estilos de Tailwind CSS v4 compilen correctamente en el entorno local (`bun dev`).
*   [ ] **Acceso a la Tienda**: Comprobar que los cambios de diseño no rompan la hidratación del carrito local ni impidan el acceso a `/carrito` o al drawer lateral.
*   [ ] **Diseño Responsivo**: Probar los cambios visuales en emuladores de pantallas móviles, tablets y monitores de escritorio.
*   [ ] **Formato de Código**: Ejecutar `bun format` para normalizar las sangrías y saltos de línea a formato Unix LF.

---

## 2. Ajustes en la Pasarela de Pago (Flow)

*   [ ] **Prueba en Sandbox**: Validar que los ajustes en las credenciales o parámetros de Flow hayan sido probados exitosamente utilizando tarjetas ficticias en el entorno de desarrollo.
*   [ ] **Validación de Firma**: Comprobar que los nuevos parámetros agregados en el payload del pago hayan sido incluidos en el método de normalización y firma criptográfica (`signFlowParams` en `flow.ts`).
*   [ ] **Endpoints Inalterados**: Asegurar que la URL del webhook de confirmación (`/api/flow/confirm`) siga activa y sea accesible por la pasarela de pagos.

---

## 3. Modificaciones en la Base de Datos (Supabase)

*   [ ] **Script de Migración**: Crear un archivo de migración `.sql` numerado bajo `/supabase/migrations/` en lugar de ejecutar consultas manuales en el editor web de Supabase.
*   [ ] **Exclusividad de Ejecución**: Comprobar que toda nueva función crítica sea declarada como `SECURITY DEFINER`, defina su `SET search_path = public`, y tenga los permisos públicos revocados otorgando privilegios únicamente al rol `service_role`.
*   [ ] **Políticas RLS Activas**: Confirmar que al crear una tabla nueva, se le habilite explícitamente la Row Level Security (`ALTER TABLE public.tabla ENABLE ROW LEVEL SECURITY`) y se declaren políticas de consulta restrictivas.

---

## 4. Auditoría de Seguridad Periódica

*   [ ] **Revisión de Secretos**: Verificar que no existan credenciales productivas reales subidas en el historial de Git o en archivos de configuración local.
*   [ ] **Verificación de RLS**: Correr consultas SQL de prueba para verificar que el rol `anon` y usuarios autenticados sin rol `admin` no puedan modificar registros en las tablas `orders`, `order_items`, `user_roles` o `products`.
*   [ ] **Logs de Vercel**: Auditar las solicitudes a `/api/flow/confirm` para capturar e investigar posibles intentos fallidos de inyección de parámetros.
