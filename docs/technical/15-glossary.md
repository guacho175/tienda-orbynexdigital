# 15 - Glosario de Términos

Este documento define la terminología técnica y de negocio clave utilizada a lo largo del codebase y la documentación del e-commerce Orbynex.

---

*   **Stock Físico**: Cantidad física real de unidades de un producto almacenadas en bodega, registrada bajo la columna `stock_quantity` en la tabla de productos de Supabase.
*   **Stock Vendible**: Cantidad neta de un producto disponible para ser adquirida en el catálogo. Se calcula en tiempo real restando las reservas temporales vigentes del stock físico disponible:
    $$\text{Stock Vendible} = \text{Stock Físico} - \text{Reservas Activas}$$
*   **Reserva Activa**: Bloqueo temporal de unidades de un producto físico, registrado con estado `active` en la tabla `stock_reservations` y asociado a un intento de checkout de Flow vigente (duración máxima de 10 minutos).
*   **Flow Token**: Identificador alfanumérico único generado por la API de Flow.cl al inicializar una transacción. Sirve para validar transacciones e identificar webhooks en el backend.
*   **commerceOrder**: Código único e irrepetible autogenerado por el backend para cada orden de compra (ej. `ORD-1783455718265`), enviado a la pasarela Flow para identificar la transacción comercial.
*   **service_role**: Rol de acceso administrativo privilegiado de Supabase. Posee bypass implícito de todas las políticas de Row Level Security (RLS) de la base de datos.
*   **RLS (Row Level Security)**: Mecanismo de seguridad nativo de PostgreSQL en Supabase que evalúa políticas lógicas de consulta fila por fila, previniendo lecturas o escrituras de usuarios no autorizados directamente en las tablas.
*   **Backorder**: Mecanismo que permite vender productos virtuales o físicos sin stock disponible en bodega (venta diferida / bajo demanda) mediante la activación del flag `allow_backorder = true`.
*   **requires_manual_review**: Estado de orden de compra terminal especial. Se asigna cuando se recibe un pago confirmado de Flow pero la reserva del stock ya había expirado y fue liberada por el cron. Indica que el comercio recibió el dinero pero no debe descontar stock de forma digital automatizada para evitar inconsistencias en bodega, requiriendo revisión manual de soporte.
*   **stock_conflict**: Estado terminal de orden asignado cuando se confirma el pago de Flow pero el stock físico real del producto es menor a las unidades adquiridas (debido a decrementos o manipulaciones directas en base de datos). Requiere soporte comercial.
