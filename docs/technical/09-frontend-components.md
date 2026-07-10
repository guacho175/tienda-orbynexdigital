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
- superficies administrativas blancas con texto oscuro y contraste explicito;
- el formulario se reinicia por `product.id` para impedir que conserve valores del producto anterior;
- la navegacion desde el listado reutiliza el producto ya cargado en React Query;
- la ruta de edicion se precarga por intencion, evitando precargar simultaneamente todas las filas;
- movimientos, analitica y auditoria conservan datos frescos durante 60 segundos para evitar
  recargas repetidas al navegar.

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

### Acceso admin por ruta

La proteccion principal de `/admin` vive en la ruta `/_authenticated/admin`:

- reutiliza el usuario validado por `/_authenticated`;
- consulta `admin-access.service.ts` mediante React Query;
- mantiene el resultado de `["admin-access", user.id]` fresco durante 60 segundos;
- falla cerrado si `user_roles` devuelve error o no existe el rol admin.

`useAdminAccess` queda como hook heredado no usado por las rutas actuales.

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

## Precarga y estados de carga admin

- El router mantiene `defaultPreload: "intent"` y reutiliza la precarga durante 30 segundos con
  `defaultPreloadStaleTime: 30_000`.
- Los enlaces de edicion del listado admin conservan `preload="intent"` y siembran
  `["admin-product", id]` con el producto del listado al enfocar, tocar o acercar el puntero.
- El detalle de producto admin conserva `staleTime: 60_000` para evitar recargas al navegar desde
  el listado.
- La comprobacion de acceso admin usa la cache `["admin-access", user.id]` durante 60 segundos.
- El listado admin distingue carga inicial, error, lista vacia real y datos cargados.
- Durante la primera carga se muestra `AdminProductsSkeleton`, con tres tarjetas moviles y cinco
  filas de escritorio. No se muestra `0 productos` mientras la consulta esta pendiente.
- Durante refetch no destructivo, React Query conserva los datos existentes y la UI evita parpadeos
  de estado vacio.
