# Seed de productos demo

Este archivo deja un seed seguro para poblar el catalogo con 15 productos demo. No elimina productos existentes y no sobrescribe `payment_url` ni `payment_button_label` si ya existen productos con el mismo `slug`.

Los precios estan pensados para probar sumas, cantidades, carrito, checkout y Flow antes de pasar a compras reales:

- 15 productos.
- 4 categorias: `Sitios web`, `E-commerce`, `Automatizacion`, `Soporte`.
- Precios bajos de prueba: `500`, `600`, `700`, `800`, `990` CLP.
- El total de una unidad de cada producto es `10.770` CLP.

Ejecutar manualmente en Supabase SQL Editor o desde un entorno con permisos suficientes.

```sql
INSERT INTO public.products (
  name,
  slug,
  short_description,
  description,
  price,
  currency,
  category,
  is_active,
  availability,
  display_order,
  image_url,
  payment_url,
  payment_button_label
)
VALUES
  (
    'Demo Web Starter',
    'demo-web-starter',
    'Producto demo para probar una compra simple.',
    'Producto de prueba para validar catalogo, carrito, suma de totales y checkout.',
    500,
    'CLP',
    'Sitios web',
    true,
    'in_stock',
    10,
    null,
    null,
    null
  ),
  (
    'Demo Web Pro',
    'demo-web-pro',
    'Producto demo con precio de 600 CLP.',
    'Producto de prueba para validar cantidades y subtotal en carrito.',
    600,
    'CLP',
    'Sitios web',
    true,
    'in_stock',
    20,
    null,
    null,
    null
  ),
  (
    'Demo Landing Express',
    'demo-landing-express',
    'Producto demo con precio de 700 CLP.',
    'Producto de prueba para revisar detalle de producto y agregar al carrito.',
    700,
    'CLP',
    'Sitios web',
    true,
    'in_stock',
    30,
    null,
    null,
    null
  ),
  (
    'Demo Web Premium',
    'demo-web-premium',
    'Producto demo con precio de 800 CLP.',
    'Producto de prueba para validar combinaciones de compra en categoria Sitios web.',
    800,
    'CLP',
    'Sitios web',
    true,
    'in_stock',
    40,
    null,
    null,
    null
  ),
  (
    'Demo Catalogo Simple',
    'demo-catalogo-simple',
    'Producto demo con precio de 990 CLP.',
    'Producto de prueba para validar catalogo e-commerce y totales con precio terminado en 990.',
    990,
    'CLP',
    'E-commerce',
    true,
    'in_stock',
    50,
    null,
    null,
    null
  ),
  (
    'Demo Carrito Basico',
    'demo-carrito-basico',
    'Producto demo con precio de 500 CLP.',
    'Producto de prueba para validar flujo de carrito y checkout.',
    500,
    'CLP',
    'E-commerce',
    true,
    'in_stock',
    60,
    null,
    null,
    null
  ),
  (
    'Demo Checkout Flow',
    'demo-checkout-flow',
    'Producto demo con precio de 600 CLP.',
    'Producto de prueba para crear pagos desde el checkout Flow.',
    600,
    'CLP',
    'E-commerce',
    true,
    'in_stock',
    70,
    null,
    null,
    null
  ),
  (
    'Demo Tienda Mini',
    'demo-tienda-mini',
    'Producto demo con precio de 700 CLP.',
    'Producto de prueba para validar una tienda pequena con carrito persistente.',
    700,
    'CLP',
    'E-commerce',
    true,
    'in_stock',
    80,
    null,
    null,
    null
  ),
  (
    'Demo Formulario Email',
    'demo-formulario-email',
    'Producto demo con precio de 800 CLP.',
    'Producto de prueba para categoria Automatizacion.',
    800,
    'CLP',
    'Automatizacion',
    true,
    'in_stock',
    90,
    null,
    null,
    null
  ),
  (
    'Demo WhatsApp Basico',
    'demo-whatsapp-basico',
    'Producto demo con precio de 990 CLP.',
    'Producto de prueba para revisar WhatsApp checkout y suma con precio 990.',
    990,
    'CLP',
    'Automatizacion',
    true,
    'in_stock',
    100,
    null,
    null,
    null
  ),
  (
    'Demo Email Automatico',
    'demo-email-automatico',
    'Producto demo con precio de 500 CLP.',
    'Producto de prueba para validar multiples productos de automatizacion.',
    500,
    'CLP',
    'Automatizacion',
    true,
    'in_stock',
    110,
    null,
    null,
    null
  ),
  (
    'Demo Flujo Simple',
    'demo-flujo-simple',
    'Producto demo con precio de 600 CLP.',
    'Producto de prueba para validar filtros por categoria y checkout.',
    600,
    'CLP',
    'Automatizacion',
    true,
    'in_stock',
    120,
    null,
    null,
    null
  ),
  (
    'Demo Soporte Web',
    'demo-soporte-web',
    'Producto demo con precio de 700 CLP.',
    'Producto de prueba para validar compras de soporte.',
    700,
    'CLP',
    'Soporte',
    true,
    'in_stock',
    130,
    null,
    null,
    null
  ),
  (
    'Demo Revision Tecnica',
    'demo-revision-tecnica',
    'Producto demo con precio de 800 CLP.',
    'Producto de prueba para revisar detalle, carrito y total.',
    800,
    'CLP',
    'Soporte',
    true,
    'in_stock',
    140,
    null,
    null,
    null
  ),
  (
    'Demo Configuracion Vercel',
    'demo-configuracion-vercel',
    'Producto demo con precio de 990 CLP.',
    'Producto de prueba para validar Flow con total bajo antes de pagos reales.',
    990,
    'CLP',
    'Soporte',
    true,
    'in_stock',
    150,
    null,
    null,
    null
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  availability = EXCLUDED.availability,
  display_order = EXCLUDED.display_order,
  image_url = COALESCE(public.products.image_url, EXCLUDED.image_url),
  payment_url = public.products.payment_url,
  payment_button_label = public.products.payment_button_label,
  updated_at = now();
```

## Verificacion

1. Ejecutar el SQL.
2. Abrir `/catalogo`.
3. Confirmar que hay 15 productos demo activos.
4. Confirmar que aparecen 4 categorias:
   - `Sitios web`: 4 productos.
   - `E-commerce`: 4 productos.
   - `Automatizacion`: 4 productos.
   - `Soporte`: 3 productos.
5. Confirmar que el home muestra hasta 6 productos destacados.
6. Probar sumas:
   - 1 producto de `500` + 1 producto de `600` = `1.100`.
   - 2 productos de `990` = `1.980`.
   - 1 unidad de los 15 productos = `10.770`.
7. Si ya existian productos con el mismo `slug`, revisar que sus links de pago se mantengan.

## Nota para compras reales

Estos precios son bajos para pruebas reales controladas. Antes de vender a clientes finales, reemplaza precios, nombres y descripciones por productos reales, y confirma que Flow este usando el ambiente correcto (`sandbox` o produccion) segun corresponda.
