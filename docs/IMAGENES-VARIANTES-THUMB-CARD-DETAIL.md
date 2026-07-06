# Imagenes por variantes: thumb, card y detail

Fecha: 2026-07-06

## Por que una sola image_url no basta

Una tienda renderiza la misma imagen en contextos con necesidades distintas:

- Carrito y checkout necesitan miniaturas pequenas.
- Home y catalogo necesitan cards livianas.
- Detalle de producto necesita una imagen mas grande.

Usar una sola `image_url` obliga a descargar una imagen de detalle en grillas y miniaturas. Eso escala mal cuando hay muchos productos.

## Columnas

Se mantiene compatibilidad con productos existentes:

- `image_url`: fallback legacy y alias de detalle para productos nuevos.
- `image_url_thumb`: miniaturas.
- `image_url_card`: cards de home/catalogo.
- `image_url_detail`: detalle de producto.

Migracion:

```text
supabase/migrations/20260706160000_product_image_variants.sql
```

La migracion solo agrega columnas nullable. No borra `image_url`, no toca RLS y no elimina imagenes existentes.

## Limites de upload

Entrada aceptada:

- JPG
- PNG
- WebP
- Original maximo: 10 MB

Salida obligatoria:

- WebP
- No se sube original pesado.
- No se guardan originales.
- Cache control de upload: `31536000`.

Variantes:

| Variante | Uso | Maximo px | Calidad inicial | Calidad minima | Objetivo | Maximo |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| thumb | carrito, checkout, miniaturas | 320 | 0.70 | 0.45 | 25-35 KB | 50 KB |
| card | home, catalogo | 480 | 0.70 | 0.45 | 40 KB | 80 KB |
| detail | detalle producto | 1000 | 0.78 | 0.55 | 140 KB | 220 KB |

Maximo absoluto: ninguna variante optimizada debe superar 250 KB.

Si una variante no baja del maximo, la subida se bloquea y el admin debe usar una imagen mas simple o recortada.

## Paths en Storage

Cada upload genera un UUID base y tres archivos:

```text
products/YYYY/MM/<uuid>-thumb.webp
products/YYYY/MM/<uuid>-card.webp
products/YYYY/MM/<uuid>-detail.webp
```

## Uso por vista

| Vista | Variante | Notas |
| --- | --- | --- |
| Home | `card` | Maximo 6 productos destacados. |
| Catalogo | `card` | Lazy loading y `sizes` para grilla responsive. |
| Detalle | `detail` | Imagen principal eager y `fetchPriority="high"`. |
| Carrito | `thumb` | No descarga card/detail cuando hay variante. |
| Checkout | `thumb` | Miniaturas pequenas del resumen. |
| Admin preview | `card` | Usa fallback si faltan variantes. |

## Compatibilidad legacy

Productos antiguos con solo `image_url` siguen funcionando:

- `ProductImage` usa `image_url_thumb`, `image_url_card` o `image_url_detail` segun contexto.
- Si la variante no existe, cae a `image_url`.
- El admin muestra aviso de imagen legacy cuando faltan variantes.
- Para obtener maxima optimizacion, re-subir la imagen desde admin.

## Como probar upload

1. Aplicar la migracion en Supabase/Lovable Cloud.
2. Entrar como admin.
3. Editar o crear producto.
4. Subir JPG/PNG/WebP pesado.
5. Confirmar que se muestran pesos:
   - Original
   - Thumb
   - Card
   - Detail
6. Guardar producto.
7. Confirmar en `products` que quedaron:
   - `image_url`
   - `image_url_thumb`
   - `image_url_card`
   - `image_url_detail`

## Como medir en Network

1. Abrir Chrome DevTools > Network.
2. Dejar `Disable cache` desactivado.
3. Recargar home.
4. Filtrar `Img`.
5. Confirmar maximo 6 imagenes card en home.
6. Navegar a catalogo.
7. Confirmar que cards usan URLs `-card.webp`.
8. Abrir detalle.
9. Confirmar que usa URL `-detail.webp`.
10. Abrir carrito/checkout.
11. Confirmar que miniaturas usan URLs `-thumb.webp`.

## Pendientes posibles

- `srcset` real para densidad de pixeles.
- Transformaciones CDN.
- Paginacion o load more.
- Blur placeholder.
- AVIF opcional.
- Preloading selectivo segun LCP real.
