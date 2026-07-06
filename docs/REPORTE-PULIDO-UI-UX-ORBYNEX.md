# Reporte Pulido UI/UX Orbynex Mini-Commerce

Fecha: 2026-07-06

## Archivos modificados

- `src/routes/index.tsx`
- `src/config/home.config.ts`
- `src/config/commerce.config.ts`
- `src/components/product/ProductCard.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/layout/Footer.tsx`
- `src/routes/catalogo.tsx`
- `src/routes/carrito.tsx`
- `src/routes/checkout.tsx`
- `src/routes/producto.$slug.tsx`
- `src/routes/_authenticated/admin.index.tsx`
- `src/routes/_authenticated/admin.new.tsx`
- `src/routes/_authenticated/admin.edit.$id.tsx`
- `src/styles.css`

## Cambios realizados

- Home redisenada con presencia fuerte de `orbynex.digital`, H1 comercial, CTA principal a servicios y CTA secundario a WhatsApp.
- Panel tecnico del hero reemplazado por un mockup liviano de tienda: producto destacado, resumen comercial y pasos de compra.
- Copy publico ajustado para clientes: se eliminaron referencias comerciales a `payment_url`, `Flow API`, `Supabase`, backend, demo y "Probar carrito".
- Categorias reescritas como soluciones de servicio, con tarjetas mas clickeables y foco visible.
- Product cards mejoradas con imagen estable, categoria, estado online, descripcion, precio rotulado y CTA primario.
- Admin ahora muestra miniaturas con `ProductImage variant="thumb"` y fallback `image_url_thumb -> image_url_card -> image_url_detail -> image_url`.
- Admin incluye vista compacta mobile para evitar tabla aplastada.
- Toaster/Sonner queda flotante, top-right, con borde, sombra, close button y mensajes mas accionables.
- Carrito, checkout y footer recibieron copy mas comercial.
- CTA primario global usa gradiente blue-to-fuchsia y las superficies usan radio mas consistente con la identidad Orbynex.

## Criterios responsive aplicados

- Mobile first en home: textos y CTAs centrados, ancho contenido limitado y sin overflow horizontal.
- Hero desktop conserva lectura izquierda y mockup comercial a la derecha.
- Categorias mantienen tarjetas tactiles con foco visible.
- Admin en mobile cambia de tabla a cards compactas con miniatura, estado, precio, switch y acciones.

## Validacion

- `npm run build`: OK.
- `npm run lint`: falla por CRLF preexistente en archivos no tocados.
- ESLint focalizado sobre archivos tocados: OK.
- Browser local `http://127.0.0.1:5174/`:
  - Home desktop/mobile: OK, sin overflow.
  - Catalogo mobile: OK, sin overflow.
  - Carrito mobile: OK, sin overflow.
  - Checkout mobile: OK, sin overflow.
  - Busqueda de copy publico: sin `payment_url`, `Flow API`, `Supabase`, `Probar carrito`, `Flujo demo` ni textos de prueba.

## Riesgos y pendientes

- El entorno local no tenia productos publicos cargados, por lo que las cards con imagen real, detalle de producto y toast de agregar al carrito no pudieron validarse visualmente con datos reales.
- `/admin` redirigio a `/auth` en la sesion Browser, por lo que la tabla autenticada no pudo verificarse visualmente. La implementacion queda confirmada por codigo.
- El build mantiene warnings preexistentes de Vite: chunk principal mayor a 500 kB, `vite-tsconfig-paths` reemplazable por config nativa y `inlineDynamicImports` ignorado por code splitting.
- Conviene validar en una sesion admin real que cada fila muestre miniatura y que las imagenes activas existan en Storage.
