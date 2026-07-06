# Flow API - Fase 1: Orders y RLS

Fecha: 2026-07-06
Rama: `feature/flow-api-dynamic-checkout`
Migracion: `supabase/migrations/20260705225916_orders_flow_api_phase_1.sql`

## Alcance

Esta fase prepara solo la base de datos para una futura integracion dinamica con Flow API. No crea endpoints, webhook, variables `FLOW_*`, ruta de resultado, boton Flow ni cambios en checkout.

La documentacion oficial Flow revisada confirma el modelo para fases futuras: `payment/create` crea una orden, responde `url` y `token`, Flow notifica `urlConfirmation` con `token`, y el comercio debe verificar server-side con `payment/getStatus`. En esta fase solo se dejan columnas para guardar identificadores y estados necesarios.

## Tablas Creadas

### `public.orders`

Campos principales:

- `id`: UUID interno.
- `commerce_order`: identificador unico local para conciliacion con Flow.
- `user_id`: usuario autenticado opcional; permite lectura de ordenes propias.
- `status`: estado interno de la orden.
- `currency`: limitado a `CLP`.
- `subtotal`, `discount_total`, `shipping_total`, `tax_total`, `total`: montos server-side.
- `customer_name`, `customer_email`, `customer_phone`, `customer_comment`: snapshot de datos del comprador.
- `flow_token`, `flow_url`, `flow_status`, `flow_raw_status`: datos de Flow para fases futuras.
- `paid_at`, `confirmed_at`, `failed_at`, `expires_at`: marcas temporales de pago.
- `public_lookup_token`: UUID unico para una consulta publica futura sin exponer otras ordenes.
- `created_at`, `updated_at`: auditoria basica.

Estados permitidos:

- `pending`: orden creada localmente antes de redirigir a Flow.
- `redirected`: Flow creo pago y el usuario puede ser redirigido.
- `paid`: pago confirmado server-side.
- `failed`: pago fallido.
- `cancelled`: pago cancelado.
- `expired`: pago expirado.

Restricciones:

- Moneda solo `CLP`.
- Montos no negativos.
- Email con validacion basica por regex.
- `commerce_order`, `flow_token` y `public_lookup_token` unicos.
- `updated_at` se actualiza con `public.set_updated_at()`.

### `public.order_items`

Campos principales:

- `id`: UUID interno.
- `order_id`: FK a `public.orders`, con cascade delete.
- `product_id`: FK a `public.products`.
- `product_name`, `product_slug`: snapshot del producto al crear la orden.
- `unit_price`, `quantity`, `subtotal`, `currency`: snapshot de precio y cantidad.
- `created_at`: auditoria basica.

Restricciones:

- `quantity > 0`.
- `unit_price >= 0`.
- `subtotal >= 0`.
- Moneda solo `CLP`.
- `subtotal = unit_price * quantity`.

## Indices

`orders`:

- `commerce_order`
- `user_id`
- `status`
- `flow_token`
- `public_lookup_token`
- `created_at`

`order_items`:

- `order_id`
- `product_id`

## RLS Aplicada

RLS queda activa en:

- `public.orders`
- `public.order_items`

No se usa `public.has_role` en las nuevas policies. Las policies de admin usan `EXISTS` directo sobre `public.user_roles`.

### `anon`

- No tiene `SELECT`, `INSERT`, `UPDATE` ni `DELETE` sobre `orders`.
- No tiene `SELECT`, `INSERT`, `UPDATE` ni `DELETE` sobre `order_items`.
- No puede consultar ni escribir ordenes en esta fase.

### `authenticated`

- Puede leer solo sus propias ordenes cuando `orders.user_id = auth.uid()`.
- Puede leer items solo de sus propias ordenes.
- No puede insertar ordenes directamente.
- No puede actualizar ordenes directamente.
- No puede eliminar ordenes directamente.
- No puede insertar, actualizar ni eliminar items directamente.

### `admin`

- Puede leer todas las ordenes.
- Puede leer todos los items.
- No puede modificar ordenes desde cliente en esta fase.
- La validacion admin usa:

```sql
EXISTS (
  SELECT 1
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND role = 'admin'
)
```

### `service_role`

Queda con `ALL` sobre `orders` y `order_items` para futuras Vercel Functions. Debe usarse solo server-side, nunca en React, Vite, localStorage, rutas publicas ni bundles cliente.

## Aplicar Migracion En Supabase/Lovable Cloud

1. Abrir el SQL editor de Supabase/Lovable Cloud.
2. Revisar que la base ya tenga `public.products`, `public.user_roles` y `public.set_updated_at()`.
3. Copiar y ejecutar el contenido completo de:

```text
supabase/migrations/20260705225916_orders_flow_api_phase_1.sql
```

4. Si el SQL editor reporta error, no continuar con fases de endpoints. Resolver primero la migracion.
5. Ejecutar las consultas de verificacion de este documento.

## SQL De Verificacion

### Ver tablas

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('orders', 'order_items');
```

### Ver policies

```sql
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'order_items')
order by tablename, policyname;
```

### Ver columnas `orders`

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'orders'
order by ordinal_position;
```

### Ver columnas `order_items`

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'order_items'
order by ordinal_position;
```

### Ver grants principales

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('orders', 'order_items')
order by table_name, grantee, privilege_type;
```

### Ver RLS activa

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('orders', 'order_items')
order by tablename;
```

## Advertencias De Seguridad

- No exponer `SUPABASE_SERVICE_ROLE_KEY`.
- No crear variables `VITE_FLOW_*` para secrets.
- No llamar Flow desde React.
- No confiar en precios, totales ni nombres del carrito en `localStorage`.
- No marcar `paid` desde return URL.
- No abrir `INSERT`, `UPDATE` ni `DELETE` de ordenes al cliente.
- No volver a conceder `EXECUTE` publico a `public.has_role`.
- No relajar RLS en `public.user_roles`.
- No registrar tokens completos ni secrets en logs.

## Pendiente Para Fase 2

La siguiente fase deberia implementar endpoints server-side en Vercel:

- `POST /api/flow/create-payment`
- `POST /api/flow/confirm`
- `GET /api/flow/order-status`

Usar sandbox Flow, validar carrito y precios desde Supabase, crear orden local `pending` antes de llamar Flow y confirmar pago solo mediante verificacion server-side con Flow.
