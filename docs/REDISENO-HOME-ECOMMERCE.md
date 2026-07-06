# Rediseno home e-commerce

Fecha: 2026-07-06

## Objetivo

Convertir la experiencia publica desde una landing corporativa hacia una tienda demo funcional. El primer mensaje ahora comunica catalogo, carrito, checkout y pagos online.

## Cambios aplicados

- Home orientado a tienda demo con hero comercial y CTA a productos/carrito.
- Productos destacados cargados desde `fetchActiveProducts()` y limitados a 6 elementos.
- Categorias visibles en portada, derivadas desde productos activos y con fallback centralizado en `home.config.ts`.
- Seccion "Como funciona la compra" enfocada en catalogo, carrito, Flow/WhatsApp y confirmacion.
- Seccion "Demo e-commerce" con capacidades comerciales del proyecto: admin, Supabase, Flow, WhatsApp, `payment_url` y Vercel.
- Navbar con carrito mas visible y navegacion a productos/carrito.
- Footer reposicionado como demo comercial de mini e-commerce.
- Cards de producto con imagen consistente, precio destacado, hover, "Ver producto" y "Agregar".

## Navegacion de retorno

Se agrego `src/components/ui/BackLink.tsx` y se usa en:

- `/catalogo`: regreso a inicio.
- `/producto/:slug`: regreso al catalogo.
- `/carrito`: seguir comprando.
- `/checkout`: volver al carrito.
- `/checkout/resultado`: volver al catalogo y, si no esta pagado o hay error, volver al checkout.

## Vistas internas

- `/catalogo`: titulo de tienda, subtitulo directo, filtros por categoria en cliente, grid responsive y estados vacios claros.
- `/producto/:slug`: ficha mas comercial, precio destacado, CTA de carrito, link externo si existe `payment_url` y CTA para seguir comprando.
- `/carrito`: resumen con subtotal/total, productos con imagen, controles de cantidad accesibles y empty state con CTA a catalogo.
- `/checkout`: resumen visual del pedido, datos de contacto, Flow como accion principal, WhatsApp como alternativa y `payment_url` como fallback para producto unico.
- `/checkout/resultado`: estados pagado, pendiente, fallido, cancelado y expirado con acciones claras.

## No se toco

- Supabase config.
- RLS, tablas, policies y migraciones.
- Auth y rutas admin.
- `ProductForm`.
- Endpoints `api/flow/*`.
- Confirmacion Flow server-side.
- `payment_url`.
- WhatsApp checkout.
- Store del carrito.
- `src/routes/_authenticated/route.tsx`.

## Criterios responsive aplicados

- Textos centrados en mobile cuando favorecen lectura.
- CTAs con area tactil clara.
- Grids `sm`/`lg` para productos, categorias y pasos.
- Imagenes de producto con proporcion estable.
- Resumen de carrito/checkout apilado en mobile y lateral en desktop.

## Como probar

Local:

```bash
npm run build
npm run dev
```

Rutas:

- `/`: debe mostrar productos destacados, categorias y foco de tienda demo.
- `/catalogo`: debe filtrar por categoria y mantener cards con botones.
- `/producto/:slug`: debe permitir agregar al carrito y volver al catalogo.
- `/carrito`: debe modificar cantidades, vaciar, seguir comprando y continuar al checkout.
- `/checkout`: debe mantener Flow, WhatsApp y `payment_url` sin cambiar logica critica.
- `/checkout/resultado`: debe consultar estado y mostrar acciones segun resultado.

Vercel:

- Abrir `https://tienda-orbynexdigital.vercel.app/`.
- Repetir el flujo publico completo.
- Probar Flow sandbox con variables actuales de Vercel.

## Riesgos y pendientes

- Si Supabase tiene menos de 6 productos activos, el home mostrara solo los disponibles.
- El SQL demo queda documentado en `docs/SEED-PRODUCTOS-DEMO.md`; no se ejecuto automaticamente para no alterar datos existentes.
- Queda pendiente una revision visual en navegador real despues del build para ajustar microespaciados si aparecen diferencias por datos reales.
