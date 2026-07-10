# 03 - Modelo de Dominio y Base de Datos

Este documento describe las entidades vigentes del e-commerce Orbynex Digital en Supabase/PostgreSQL.

## Entidades Principales

### `public.products`

Catalogo de productos y servicios.

Campos relevantes:

- `id`: UUID primario.
- `name`, `slug`, `short_description`, `description`.
- `meta_title`, `meta_description`, `seo_noindex`, `og_image_url`.
- `price`, `currency`.
- `category`.
- `image_url`, `image_url_thumb`, `image_url_card`, `image_url_detail`.
- `is_active`.
- `availability`.
- `stock_quantity`.
- `track_inventory`.
- `allow_backorder`.
- `low_stock_threshold`.
- `out_of_stock_behavior`.
- `payment_url`, `payment_button_label`.
- `display_order`.
- `created_at`, `updated_at`.

Reglas:

- El catalogo publico solo debe leer productos activos y vendibles.
- El admin puede leer, crear, editar y eliminar productos si tiene rol `admin`.
- `updated_at` se usa como guardia anti-sobrescritura en el editor admin.

### `public.user_roles`

Define roles de usuarios autenticados.

Campos:

- `id`
- `user_id`
- `role`: `admin` o `user`
- `created_at`

Reglas:

- Un usuario autenticado solo puede leer sus propios roles.
- Las politicas admin revisan `user_roles` directamente.

### `public.orders`

Orden maestra de compra Flow.

Estados relevantes:

- `pending`
- `stock_reserved`
- `redirected`
- `paid`
- `failed`
- `cancelled`
- `expired`
- `reservation_expired`
- `stock_conflict`
- `requires_manual_review`

Reglas:

- Clientes no escriben directamente en `orders`.
- La API/RPC crea ordenes y confirma pagos.
- Usuarios autenticados pueden leer sus propias ordenes.
- Admin puede leer todas las ordenes.

### `public.order_items`

Items historicos de cada orden.

Reglas:

- Guarda precio y cantidad al momento de crear la orden.
- Clientes no escriben directamente.
- Usuarios autenticados pueden leer items de sus propias ordenes.
- Admin puede leer todos los items.

### `public.stock_reservations`

Reservas temporales de stock durante checkout.

Estados:

- `active`
- `confirmed`
- `released`
- `expired`

Reglas:

- No tiene acceso publico directo.
- La API/RPC gestiona reservas y liberaciones.

### `public.product_audit_events`

Historial de cambios importantes de productos.

Campos:

- `id`
- `product_id`
- `event_type`
- `before_snapshot`
- `after_snapshot`
- `changed_fields`
- `created_by`
- `created_at`

Eventos usados:

- `product_create`
- `product_update`
- `stock_adjustment`

Reglas:

- Solo admins pueden leer e insertar eventos.
- Se usa en `/admin/audit`.

### `public.stock_movements`

Historial de movimientos de stock.

Campos:

- `id`
- `product_id`
- `movement_type`
- `quantity_delta`
- `stock_before`
- `stock_after`
- `reason`
- `source`
- `order_id`
- `reservation_id`
- `created_by`
- `created_at`

Tipos previstos:

- `manual_adjustment`
- `manual_return`
- `manual_correction`
- `flow_sale`
- `reservation_created`
- `reservation_released`

Estado actual:

- Implementado para ajustes manuales admin.
- Flow y reservas todavia no escriben automaticamente movimientos.

## Relaciones

```mermaid
erDiagram
  products ||--o{ order_items : referenced_by
  orders ||--o{ order_items : contains
  orders ||--o{ stock_reservations : reserves
  products ||--o{ stock_reservations : reserved_product
  products ||--o{ product_audit_events : audited
  products ||--o{ stock_movements : stock_history
  orders ||--o{ stock_movements : optional_order_source
  stock_reservations ||--o{ stock_movements : optional_reservation_source
```

## Storage

Bucket:

- `product-images`

Convencion:

- `products/YYYY/MM/UUID-thumb.webp`
- `products/YYYY/MM/UUID-card.webp`
- `products/YYYY/MM/UUID-detail.webp`

Solo admins pueden escribir imagenes.
