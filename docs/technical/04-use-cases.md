# 04 - Casos de Uso Principales

Este documento detalla los flujos de interacción del sistema, especificando actores, precondiciones, flujos alternativos, transiciones de estado y riesgos asociados para cada operación clave.

---

## 1. Casos de Uso del Cliente Final

### 1.1. Ver Catálogo y Disponibilidad

- **Actor**: Usuario Anónimo / Cliente Autenticado.
- **Precondiciones**: La aplicación web está en línea.
- **Flujo Principal**:
  1.  El cliente accede a `/catalogo` o a la página de inicio.
  2.  El frontend consulta `fetchCatalogProducts()` a Supabase.
  3.  El servicio ejecuta en paralelo la verificación en caliente `/api/products/availability`.
  4.  El sistema actualiza el stock físico restando las reservas vigentes.
  5.  Se renderiza el catálogo mostrando el stock real disponible.
- **Flujo Alternativo (Producto Agotado u Oculto)**:
  - Si `out_of_stock_behavior = 'hide_product'` y el stock vendible es 0: el producto es filtrado en caliente y no se muestra en el catálogo.
  - Si `out_of_stock_behavior = 'show_sold_out'` y el stock vendible es 0: el producto se renderiza con el botón deshabilitado y la etiqueta "Agotado".
- **Estados Afectados**: Ninguno (operación de lectura).

### 1.2. Agregar al Carrito e Identificar Mensajes de Reserva

- **Actor**: Usuario Anónimo / Cliente Autenticado.
- **Precondiciones**: El producto está listado en catálogo.
- **Flujo Principal**:
  1.  El cliente presiona "Agregar al carrito".
  2.  `CartProvider` evalúa `canPurchase()` usando el inventario en caliente.
  3.  El ítem es insertado en el store local.
- **Flujo Alternativo (Producto Reservado Temporalmente)**:
  - Si el stock disponible del producto es 0, pero su stock físico es mayor a 0 y existen reservas activas asociadas: la UI deshabilita la compra y renderiza el mensaje: _"Este producto está reservado temporalmente por otra compra. Si no se completa el pago, podría volver a estar disponible en unos minutos."_
- **Estados Afectados**: `shop_cart_v1` en `localStorage`.

### 1.2.1. Ver Productos Similares

- **Actor**: Usuario anonimo / cliente autenticado.
- **Precondiciones**: El cliente esta viendo una ficha publica de producto.
- **Flujo Principal**:
  1. El frontend consulta productos activos y visibles de la misma categoria, excluyendo el producto actual.
  2. Si la categoria no completa el limite configurado, consulta solo los espacios restantes entre otras categorias.
  3. El servicio aplica disponibilidad publica una vez y React Query conserva el resultado durante la ventana configurada.
  4. La interfaz reutiliza `ProductCard`, manteniendo precio, imagen, inventario y carrito alineados con el catalogo.
- **Flujo Alternativo**: Si no existe otro producto elegible o la consulta secundaria falla, la seccion se oculta y la ficha principal continua operativa.
- **Estados Afectados**: Ninguno; es una operacion de lectura.

### 1.3. Validar Carrito y Crear Pago Flow (Inicio de Checkout)

- **Actor**: Usuario Anónimo / Cliente Autenticado.
- **Precondiciones**: El carrito tiene al menos un ítem. El cliente completa el formulario de contacto con éxito.
- **Flujo Principal**:
  1.  El cliente presiona "Pagar online".
  2.  El frontend realiza un POST a `/api/flow/create-payment`.
  3.  La API ejecuta la RPC `create_order_with_stock_reservation()` en Supabase.
  4.  Se bloquean las filas de productos (`FOR UPDATE`) y se crea una orden en estado `stock_reserved` junto con un registro en `stock_reservations` en estado `active` con vencimiento a 10 minutos.
  5.  La API de Vercel inicia la transacción en Flow.cl y recibe un token.
  6.  Se actualiza la orden en Supabase a `status = 'redirected'` y se almacena el `flow_token`.
  7.  El frontend recibe la URL y redirige al usuario al portal de Flow.
- **Flujo Alternativo (Falta de Stock de Último Minuto)**:
  - Si otro usuario bloqueó el stock un milisegundo antes, la RPC lanza una excepción SQL. La API captura el error y retorna `409 Conflict`. El frontend detiene el checkout y notifica al cliente que ajuste su carrito.
- **Estados Afectados**:
  - `orders.status`: `pending` -> `stock_reserved` -> `redirected`.
  - `stock_reservations.status`: `active` (vence en +10 min).
- **Riesgos**: Caída de la API de Flow tras reservar el stock. Mitigación: El backend captura el fallo de red de Flow y ejecuta inmediatamente la RPC `release_order_stock_reservations()` para liberar el inventario físico y cambiar la orden a `failed`.

### 1.4. Confirmar Pago Flow (Webhook / Retorno del Cliente)

- **Actor**: Pasarela Flow (Webhook asíncrono) o Cliente (Redirección al retornar).
- **Precondiciones**: La orden está en estado `redirected`.
- **Flujo Principal**:
  1.  Se recibe el token de Flow en el endpoint POST `/api/flow/confirm`.
  2.  La API de Vercel realiza una consulta directa segura a Flow para verificar el pago (`getStatus`).
  3.  Si el estado es exitoso (código `2`), se invoca la RPC `confirm_order_payment_and_capture_stock()`.
  4.  El backend descuenta definitivamente la cantidad del stock físico (`stock_quantity`) de los productos, marca la reserva como `confirmed` y actualiza la orden a `status = 'paid'`.
  5.  Se retorna una respuesta exitosa a Flow y al frontend, el cual limpia el carrito local.
- **Flujo Alternativo (Pago Rechazado o Cancelado)**:
  - Si Flow reporta pago rechazado (código `3`) o cancelado (código `4`), se llama a `release_order_stock_reservations()`, devolviendo el stock físico al catálogo (`status = 'released'`) y marcando la orden como `failed` o `cancelled`. El carrito local del cliente se mantiene intacto para permitir reintentos.
- **Estados Afectados**:
  - `orders.status`: `redirected` -> `paid` / `failed` / `cancelled`.
  - `stock_reservations.status`: `active` -> `confirmed` / `released`.
  - `products.stock_quantity`: Reducido por la cantidad comprada.

### 1.5. Pago Recibido con Reserva Expirada (Desfase Temporal)

- **Actor**: Pasarela Flow / Supabase Cron.
- **Precondiciones**: El cliente demoró más de 10 minutos en el portal bancario. Supabase Cron ya liberó el stock.
- **Flujo Principal**:
  1.  Supabase Cron ejecuta `public.expire_stock_reservations()` y actualiza la orden a `reservation_expired` y las reservas a `expired`.
  2.  El cliente finaliza el pago en el banco con éxito.
  3.  Flow notifica la confirmación tardía a `/api/flow/confirm`.
  4.  La API de Vercel detecta que la orden local ya está en estado `reservation_expired`.
  5.  Se ejecuta la RPC `confirm_order_payment_and_capture_stock()`.
  6.  El motor SQL detecta que la reserva de la orden ya no está activa, por lo que **no descuenta stock físico** y cambia el estado de la orden a `requires_manual_review` para alertar al comercio, registrando el pago pero protegiendo el stock.
- **Estados Afectados**: `orders.status`: `reservation_expired` -> `requires_manual_review`.
- **Riesgos**: Vender productos sin stock real disponible física o digitalmente. Mitigación: La orden queda registrada para revisión y contacto manual inmediato del soporte de la tienda.

---

## 2. Casos de Uso de Administración (Admin)

### 2.1. Crear / Editar Producto con Optimización de Imagen

- **Actor**: Administrador Autenticado.
- **Precondiciones**: El usuario posee rol `admin` en `public.user_roles`.
- **Flujo Principal**:
  1.  El administrador ingresa al panel en `/admin/new` o `/admin/edit/$id`.
  2.  Completa los campos de descripción y controles de inventario.
  3.  Selecciona una imagen de producto de su dispositivo local.
  4.  El frontend (`storage.service.ts`) procesa la imagen local en canvas, validando su formato (PNG, JPEG, WebP) y la redimensiona y comprime en caliente en tres variantes WebP: miniatura, tarjeta y detalle.
  5.  Sube las tres variantes directamente al bucket `product-images` de Supabase.
  6.  El formulario envía los paths públicos resultantes a la base de datos de productos.
- **Estados Afectados**:
  - Fila en tabla `products`.
  - Archivos en Supabase Storage `product-images`.
- **Riesgos**: Subida de archivos no optimizados que agoten la cuota de storage. Mitigación: El frontend realiza la optimización de forma obligatoria y previene la subida si la imagen optimizada final supera el límite rígido de 250 KB por variante.

### 2.2. Consultar Analitica Admin

- **Actor**: Administrador autenticado.
- **Ruta**: `/admin/analytics`.
- **Flujo Principal**:
  1. El admin abre la vista de analitica.
  2. El frontend consulta productos, ordenes e items usando RLS admin.
  3. El sistema muestra productos activos/inactivos, stock bajo, agotados, productos sin imagen, ordenes totales, ordenes pagadas, ventas por fecha y productos mas vendidos.
- **Estados Afectados**: Ninguno; es solo lectura.

### 2.3. Revisar Auditoria de Productos

- **Actor**: Administrador autenticado.
- **Ruta**: `/admin/audit`.
- **Flujo Principal**:
  1. El admin abre la vista de auditoria.
  2. El frontend lista eventos recientes desde `product_audit_events`.
  3. Cada evento muestra tipo, fecha, producto y campos modificados.
- **Estados Afectados**: Ninguno; es solo lectura.

### 2.4. Registrar Movimientos de Stock

- **Actor**: Administrador autenticado.
- **Ruta**: `/admin/edit/$id`.
- **Flujo Principal**:
  1. El admin ingresa al editor de producto.
  2. Abre la seccion `Movimientos de stock`, separada de la configuracion `Inventario`.
  3. Elige entrada, venta externa, correccion o devolucion e indica unidades y detalle opcional.
  4. El frontend llama `adjust_product_stock_admin`.
  5. La RPC bloquea el producto, valida stock final no negativo, actualiza `products.stock_quantity` e inserta `stock_movements`.
  6. El frontend registra evento `stock_adjustment` en `product_audit_events`.
- **Estados Afectados**: `products.stock_quantity`, `stock_movements`, `product_audit_events`.

Reglas operativas:

- El stock inicial se define al crear el producto.
- En productos existentes, `Inventario` muestra el stock registrado como solo lectura.
- Una venta por checkout Flow se descuenta automaticamente durante la confirmacion del pago.
- Una venta por `payment_url` o canal externo se registra manualmente como `Venta externa`.
- El guardado general del producto conserva el stock mas reciente y no sobrescribe movimientos.

### 2.5. Evitar Sobrescritura de Cambios Recientes

- **Actor**: Administrador autenticado.
- **Ruta**: `/admin/edit/$id`.
- **Flujo Principal**:
  1. Al abrir el editor se conserva el `updated_at` inicial.
  2. Antes de guardar se consulta nuevamente el producto.
  3. Si `updated_at` cambio, se muestra confirmacion.
  4. El admin puede cancelar para no sobrescribir o continuar y guardar.
- **Estados Afectados**: `products`, solo si el admin confirma guardado.
