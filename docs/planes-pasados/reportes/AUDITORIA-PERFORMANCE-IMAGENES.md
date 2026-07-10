# Auditoria performance de imagenes

Fecha: 2026-07-06

## Diagnostico inicial

Se auditaron los archivos solicitados:

- `src/components/product/ProductImage.tsx`
- `src/components/product/ProductCard.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/services/storage.service.ts`
- `src/services/products.service.ts`
- `src/routes/index.tsx`
- `src/routes/catalogo.tsx`
- `src/routes/producto.$slug.tsx`
- `src/routes/carrito.tsx`
- `src/config/home.config.ts`
- `src/styles.css`
- `docs/PLAN-OPTIMIZACION-IMAGENES-PANEL.md`
- `docs/FASE-3A-IMAGENES-STORAGE.md`
- `docs/ESTADO-ACTUAL-TEMPLATE.md`

Tambien se revisaron `src/routes/checkout.tsx`, `src/store/cart.store.tsx`, `src/types/cart.ts`, `src/types/product.ts`, migraciones locales y tipos Supabase, porque el checkout y carrito muestran miniaturas.

## Hallazgos

1. Home renderizaba maximo 6 productos destacados, pero consultaba todos los productos activos con `fetchActiveProducts()`.
2. Catalogo renderizaba todas las cards filtradas y usaba la misma consulta completa.
3. Home y catalogo usaban la misma `products.image_url`.
4. `ProductImage` descargaba siempre una sola URL (`src`) sin variantes.
5. `loading="lazy"` existia como default en `ProductImage`.
6. No habia `decoding="async"`.
7. No se usaba `fetchpriority`; detalle tampoco marcaba prioridad explicita.
8. Habia aspect ratio estable en contenedores principales, pero no como contrato del componente.
9. No se detectaron query params dinamicos agregados por el codigo.
10. No habia variantes, por lo que no habia URLs distintas por contexto; el problema era usar la misma URL grande.
11. Las URLs publicas de Supabase eran estables, pero la medicion HEAD actual mostro `cache-control: no-cache` en imagenes existentes; hay que verificar en DevTools despues de re-subir variantes y despues del deploy.
12. `Disable cache` es una configuracion de DevTools del navegador; no se puede inferir desde codigo. Para medir usuario real debe estar desactivado.
13. El build muestra CSS ~85.5 KB sin gzip (~14.4 KB gzip) e index JS ~590 KB minificado (~171.8 KB gzip). Hay warning de chunk mayor a 500 KB; conviene una fase posterior de code splitting.
14. Home estaba cargando datos del catalogo completo aunque solo mostraba 6 productos.
15. `home.config.ts` ya limita destacados a 6 y se mantiene ese limite.

## Medicion de productos activos

Consulta publica Supabase al 2026-07-06:

- Productos activos: 15.
- URLs de imagen unicas: 15.
- Peso total por HEAD de imagenes actuales: 914.5 KB.
- Rango actual por imagen: 35.7 KB a 93.9 KB.
- Tipo: `image/webp`.
- Cache observado por HEAD: `no-cache`.

Interpretacion:

- Con lazy loading, home no deberia transferir las 15 imagenes si solo renderiza 6.
- Catalogo completo tiene un peso bruto razonable para 15 imagenes actuales, pero seguia usando una sola variante por producto.
- El objetivo profesional requiere separar `thumb`, `card` y `detail`, porque una imagen aceptable para detalle no debe ser la misma que se descarga en carrito o grillas.

## Cambios aplicados

- Home ahora usa `fetchFeaturedProducts(limit)` y no trae catalogo completo.
- Catalogo usa `fetchCatalogProducts()` con campos necesarios para cards.
- Cards usan `variant="card"`.
- Detalle usa `variant="detail"`, `loading="eager"` y `fetchPriority="high"` solo en la imagen principal.
- Carrito y checkout usan `variant="thumb"`.
- `ProductImage` agrega `decoding="async"`, `sizes`, fallback legacy y aspect ratio estable.
- `ProductForm` genera y guarda tres variantes WebP.
- Se creo migracion para columnas `image_url_thumb`, `image_url_card`, `image_url_detail`.

## Resultado esperado despues de re-subir imagenes

- Home: maximo 6 imagenes card, idealmente hasta 480 KB en imagenes.
- Catalogo: cards con `image_url_card`, sin descargar `detail`.
- Detalle: una imagen `detail` de 1000 px maximo.
- Carrito/checkout: miniaturas `thumb`, sin descargar card/detail.
- Productos antiguos siguen funcionando por fallback a `image_url`.

## Verificacion de cache

Medir en Chrome DevTools:

1. Abrir Network.
2. Desactivar `Disable cache`.
3. Hard reload en home solo para medir carga inicial.
4. Filtrar por `Img`.
5. Revisar `Transfer Size`, no solo `Resource Size`.
6. Navegar a catalogo en la misma sesion.
7. Confirmar que imagenes repetidas aparecen como memory cache o disk cache.
8. Si `Disable cache` esta activado, la medicion fuerza redescarga y no representa usuario real.

## Pendientes avanzados

- `srcset`/`source` avanzado.
- Transformaciones CDN si se decide usar un servicio que respete variantes dinamicas.
- Paginacion o load more en catalogo si supera 12-24 productos.
- Placeholder blur.
- AVIF opcional.
- Preload selectivo solo si LCP lo justifica.
- Revisar headers de cache reales en Supabase/Vercel despues de aplicar migracion y re-subir imagenes.
- Code splitting para reducir el warning del chunk principal.
