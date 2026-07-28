# 14 - Riesgos Conocidos y Deuda Técnica

Este documento enumera las limitaciones lógicas actuales, riesgos operativos inherentes al stack, y oportunidades de mejora identificadas para futuras iteraciones de la plataforma e-commerce Orbynex.

---

## 1. Riesgos Operativos y Mitigaciones

### 1.1. Dependencia de Proveedores Serverless (Vercel & Supabase)
*   **Riesgo**: Caídas de infraestructura o latencias elevadas en las Vercel Functions o en la base de datos de Supabase que dejen inactiva la tienda.
*   **Mitigación**: El frontend implementa fallbacks visuales automáticos y captura de errores local. Si la base de datos de Supabase o la API de disponibilidad fallan, el catálogo de productos continúa visualizándose mediante caché en local y desactiva el carrito dinámico, permitiendo al cliente finalizar sus pedidos contactando directamente al enlace de pago directo o al WhatsApp de la tienda.

### 1.2. Desfase de Confirmación de Pagos (Timeout del Webhook)
*   **Riesgo**: Si un cliente inicia el pago, reserva stock por 10 minutos y se demora más de ese plazo en el portal del banco, Supabase Cron puede liberar el stock en su siguiente ejecución programada cada 10 minutos. Si el cliente finaliza el pago exitosamente después de este tiempo, Flow confirmará una orden expirada.
*   **Mitigación**: La RPC `confirm_order_payment_and_capture_stock` detecta que la reserva ya no está activa, por lo que previene que el stock baje a números negativos de forma descontrolada y marca la orden bajo el estado de seguridad `requires_manual_review`, registrando la transacción bancaria y alertando al administrador para gestionar el inventario de forma manual con el cliente.

---

## 2. Deuda Técnica Identificada

### 2.1. Conexión de Cliente en Lazo Frío (Cold Start)
*   **Detalle**: Al utilizar Vercel Functions gratuitas y bases de datos Supabase en capas de desarrollo/gratuitas, las primeras peticiones (como consultar disponibilidad del catálogo tras horas de inactividad) pueden demorar varios segundos debido al tiempo de encendido del contenedor de la función serverless (Cold Start).
*   **Solución Futura**: Evaluar la migración de endpoints críticos a Vercel Edge Runtime o utilizar estrategias de pre-renderizado estático periódico (ISR).

### 2.2. Costo Fijo de Envío
*   **Detalle**: El sistema carece de un motor de cotización geográfica en tiempo real para despachos. Actualmente el costo de despacho está fijado en `0` en la creación de la orden.
*   **Solución Futura**: Integrar servicios de API locales (como Starken o Chilexpress) para calcular tarifas de despacho variables en el checkout.

---

## 3. Componentes Críticos: Qué NO Tocar sin un Plan de Migración

*   **RPC de Bloqueo de Stock (`create_order_with_stock_reservation`)**: Contiene la lógica criptográfica de locks SQL (`FOR UPDATE`) y el cálculo de stock neto vendible. Modificarla de forma incorrecta puede introducir vulnerabilidades de carrera o interbloqueos graves (deadlocks).
*   **Esquema de Firmas HMAC (`flow.ts` en servidor)**: Es el corazón de la integración financiera. Cualquier cambio menor en la normalización o cifrado invalidará la comunicación con el portal de Flow, bloqueando por completo las ventas de la tienda.
*   **Roles y Permisos de RLS**: Las restricciones a nivel de fila aseguran que los clientes no puedan bypassear la base de datos. No otorgues permisos de inserción directa a la tabla de órdenes en el frontend bajo ninguna circunstancia.
