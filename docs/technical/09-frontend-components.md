# 09 - Componentes del Frontend y Flujo de Interfaz

Frontend construido con React, TanStack Start/Router, React Query y Tailwind CSS.

## Rutas Publicas

- `/`: home.
- `/catalogo`: catalogo con productos activos.
- `/producto/$slug`: detalle de producto con SEO real.
- `/carrito`: carrito.
- `/checkout`: formulario de compra Flow.
- `/checkout/resultado`: resultado de pago.
- `/auth`: login.

## Rutas Admin

- `/admin`: listado de productos, buscador simple, activar/desactivar, editar y eliminar.
- `/admin/new`: crear producto.
- `/admin/edit/$id`: editar producto y registrar movimientos de stock.
- `/admin/analytics`: analitica administrativa solo lectura.
- `/admin/audit`: auditoria de cambios de productos.

## Componentes Publicos Clave

### `ProductCard`

Renderiza producto, precio, imagen, disponibilidad y acciones de compra.

Soporta:

- carrito interno;
- `payment_url` externo;
- estado agotado;
- disponibilidad ajustada por reservas.

### `ProductImage`

Usa variantes:

- `image_url_thumb`;
- `image_url_card`;
- `image_url_detail`.

### `CartDrawer`

Panel lateral del carrito sincronizado con `cart.store.tsx`.

## Componentes Admin

### `ProductForm`

Wrapper del editor compacto.

### `src/components/admin/product-editor/*`

Editor por secciones:

- general;
- inventario;
- movimientos de stock, solo al editar productos existentes;
- precios;
- media;
- organizacion;
- SEO.

Caracteristicas:

- validacion con schema;
- contador de caracteres;
- subida de imagenes optimizadas;
- aviso de cambios sin guardar;
- guardado manual con boton.

### `ProductStockAdjustmentPanel`

Panel dentro de `Movimientos de stock` en `/admin/edit/$id` para:

- registrar entradas de stock;
- registrar ventas externas por link de pago u otros canales;
- sumar o rebajar correcciones;
- registrar devoluciones;
- bloquear resultados negativos;
- registrar un detalle opcional;
- ver movimientos recientes.

Llama `adjustProductStock`, que usa la RPC `adjust_product_stock_admin`.

### `useAdminAccess`

Hook compartido para validar si el usuario autenticado tiene rol `admin`.

## Servicios Frontend

- `products.service.ts`: catalogo publico y CRUD admin.
- `admin-analytics.service.ts`: metricas de productos, ordenes pagadas y top productos.
- `product-audit.service.ts`: eventos de auditoria.
- `inventory.service.ts`: ajustes manuales e historial de movimientos.
- `storage.service.ts`: optimizacion y subida de imagenes.

## Estado Global

`cart.store.tsx` mantiene el carrito en React Context y `localStorage`.

Operaciones:

- `addItem`;
- `updateQuantity`;
- `removeItem`;
- `clear`.

## Reglas Frontend

- No calcular montos finales de orden en cliente.
- No actualizar stock desde cliente publico.
- No eliminar soporte de `payment_url`.
- No hacer autosave agresivo en editor admin.
- Para cambios admin sensibles, mantener guardado manual y auditoria.
