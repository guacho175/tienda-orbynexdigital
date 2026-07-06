# Plan: optimizacion de imagenes antes de subir desde el panel admin

Fecha: 2026-07-06

Estado: cerrado a nivel de codigo y documentacion.

## Problema

El panel admin permite subir imagenes de producto a Supabase Storage, pero actualmente sube el archivo original. Solo valida formato y limite maximo de 5 MB.

Esto no cubre el caso real de uso: un usuario puede subir fotos pesadas desde telefono o camara, lo que afecta:

- peso del sitio;
- velocidad de carga del catalogo;
- consumo de ancho de banda;
- experiencia movil;
- Core Web Vitals;
- costos/uso de Storage.

## Objetivo

Antes de guardar una imagen de producto, el panel debe optimizarla por codigo:

- redimensionar;
- comprimir;
- convertir a formato eficiente;
- validar peso final;
- guardar solo la version optimizada en Supabase Storage;
- mostrar feedback claro al admin.

## Alcance

Archivos candidatos:

- `src/services/storage.service.ts`
- `src/components/admin/ProductForm.tsx`
- `src/components/product/ProductImage.tsx` si se requiere mejorar consumo/render
- `docs/FASE-3A-IMAGENES-STORAGE.md`
- `docs/ESTADO-ACTUAL-TEMPLATE.md`

No tocar:

- RLS;
- Auth;
- rutas admin protegidas;
- endpoints Flow;
- carrito;
- checkout;
- tablas;
- migraciones, salvo que se decida agregar variantes nuevas en DB, cosa que no es necesaria para la primera fase.

## Estrategia tecnica recomendada

### Fase 1: optimizacion client-side sin dependencia externa

Implementar optimizacion en navegador usando APIs nativas:

- `createImageBitmap`
- `canvas`
- `canvas.toBlob`
- `File`

Ventaja:

- no agrega librerias;
- mantiene el bundle controlado;
- funciona antes de subir;
- evita guardar originales pesados.

Salida recomendada:

- formato: `image/webp`;
- ancho maximo: `1200px`;
- alto maximo: `1200px`;
- calidad inicial: `0.82`;
- calidad minima: `0.68`;
- peso objetivo: `250 KB`;
- peso maximo final permitido: `450 KB`;
- mantener aspect ratio;
- no agrandar imagenes pequenas.

### Fase 2: validaciones antes y despues

Validacion antes de optimizar:

- aceptar `image/jpeg`, `image/png`, `image/webp`;
- remover `image/gif` para productos, o tratarlo como no optimizable;
- maximo archivo original: `8 MB` o `10 MB`;
- error claro si el archivo no es imagen soportada.

Validacion despues de optimizar:

- si el WebP final supera `450 KB`, reintentar bajando calidad;
- si no baja del limite, bloquear subida con mensaje accionable;
- mostrar peso original y peso optimizado.

### Fase 3: servicio reutilizable

Crear funciones separadas:

```ts
type OptimizedImageResult = {
  file: File;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  mimeType: "image/webp";
};
```

Funciones sugeridas:

- `validateOriginalProductImage(file)`
- `optimizeProductImage(file)`
- `validateOptimizedProductImage(file)`
- `uploadProductImage(file)`

`uploadProductImage` debe recibir el archivo ya optimizado o ejecutar internamente la optimizacion para evitar mal uso.

### Fase 4: UX del panel

En `ProductForm`:

- al seleccionar archivo, mostrar estado `Optimizando imagen...`;
- luego `Subiendo imagen optimizada...`;
- mostrar preview con la URL final;
- mostrar texto:
  - `Original: 3.4 MB`
  - `Optimizada: 184 KB`
  - `Formato: WebP`
- bloquear submit mientras optimiza/sube;
- si falla, no guardar producto hasta corregir imagen.

### Fase 5: nombres y cache

Actualizar path de Storage:

- extension siempre `.webp`;
- `contentType: "image/webp"`;
- mantener `cacheControl: "31536000"`;
- path recomendado:

```text
products/YYYY/MM/<uuid>.webp
```

## Criterios de aceptacion

- Subir JPG pesado genera WebP optimizado.
- Subir PNG pesado genera WebP optimizado.
- Subir WebP pesado lo redimensiona/recomprime si corresponde.
- No se sube el archivo original.
- El producto guarda `image_url` publica del archivo optimizado.
- El catalogo carga imagenes optimizadas.
- El detalle carga imagen optimizada.
- Carrito usa la misma imagen optimizada.
- El admin ve peso original y peso final.
- Build pasa.
- Lint especifico pasa.

## Pruebas manuales

1. Subir JPG de 3 MB.
2. Confirmar que se guarda WebP menor a 450 KB.
3. Subir PNG de 5 MB.
4. Confirmar que se guarda WebP menor a 450 KB.
5. Subir imagen muy pequena.
6. Confirmar que no se agranda.
7. Subir archivo no permitido.
8. Confirmar error claro.
9. Guardar producto.
10. Abrir `/catalogo`, `/producto/:slug`, `/carrito`.
11. Revisar Network: imagen cargada como WebP y peso bajo.

## Riesgos

- Canvas puede fallar con imagenes corruptas.
- Algunos navegadores pueden tener diferencias de compresion.
- Imagenes con transparencia PNG pueden cambiar visualmente al convertir a WebP, aunque WebP soporta transparencia.
- GIF animado no debe pasar por este flujo si se quiere conservar animacion.

## Decision recomendada

Implementar optimizacion client-side ahora, sin dependencia externa.

Solo considerar una libreria dedicada si aparecen casos complejos como:

- EXIF orientation rota mal;
- compresion inconsistente;
- necesidad de recorte;
- generacion de multiples variantes.

## Pendiente posterior opcional

Crear variantes:

- `thumbnail`: 480px, catalogo/carrito;
- `full`: 1200px, detalle;
- `original`: no recomendado para fase actual.

Esto requeriria guardar mas campos o una convencion de URLs, por lo que queda fuera del primer cierre.

## Implementacion cerrada

Archivos modificados:

- `src/services/storage.service.ts`
- `src/components/admin/ProductForm.tsx`
- `docs/FASE-3A-IMAGENES-STORAGE.md`
- `docs/ESTADO-ACTUAL-TEMPLATE.md`
- `docs/PLAN-OPTIMIZACION-IMAGENES-PANEL.md`

Cambios aplicados:

- La validacion del panel acepta solo `image/jpeg`, `image/png` y `image/webp`.
- Se bloquean originales mayores a `10 MB`.
- La imagen se optimiza en navegador con `createImageBitmap`, `canvas` y `canvas.toBlob`.
- La salida siempre es `image/webp`.
- El resize mantiene aspect ratio, no agranda imagenes pequenas y limita a `1200 x 1200 px`.
- La calidad inicial es `0.82` y baja progresivamente si el archivo queda pesado.
- El objetivo de peso es `250 KB`.
- El maximo final permitido es `450 KB`; si no se logra, se bloquea la subida.
- `uploadProductImage` optimiza internamente antes de subir para evitar guardar originales pesados por error.
- Storage recibe solo el archivo optimizado, con extension `.webp`, `contentType: image/webp` y `cacheControl: 31536000`.
- `ProductForm` muestra estados de optimizacion/subida, preview final, peso original, peso optimizado y formato WebP.
- El submit queda bloqueado mientras optimiza/sube o si quedo un error de imagen.
- El campo manual `image_url` sigue funcionando.

Responsive y UX:

- No se redisenaron rutas ni cards.
- La informacion de peso usa una grilla simple que cae correctamente en mobile.
- Se conservaron los tokens visuales existentes del proyecto.

Riesgos y criterios operativos:

- Navegadores sin `createImageBitmap` muestran error claro y no suben el archivo original.
- Imagenes corruptas fallan antes de subir.
- Si una foto con mucho detalle no baja de `450 KB`, el admin debe usar otra imagen o reducirla antes.
- No se tocaron Supabase config, RLS, Auth, Flow, carrito, checkout, tablas ni migraciones.

---

## Actualizacion - variantes thumb/card/detail

Fecha: 2026-07-06

Estado: implementado a nivel de codigo y documentacion.

La fase anterior de una sola `image_url` optimizada queda reemplazada por un flujo de variantes por contexto:

- `image_url_thumb`: miniaturas de carrito y checkout.
- `image_url_card`: cards de home y catalogo.
- `image_url_detail`: detalle de producto.
- `image_url`: fallback legacy y alias de detalle para productos nuevos.

Nuevos limites:

- Thumb: 320 px maximo, objetivo 25-35 KB, maximo 50 KB.
- Card: 480 px maximo, objetivo 40 KB, maximo 80 KB.
- Detail: 1000 px maximo, objetivo 140 KB, maximo 220 KB.
- Maximo absoluto por variante: 250 KB.

Archivos principales:

- `src/services/storage.service.ts`
- `src/components/admin/ProductForm.tsx`
- `src/components/product/ProductImage.tsx`
- `src/components/product/ProductCard.tsx`
- `src/services/products.service.ts`
- `supabase/migrations/20260706160000_product_image_variants.sql`
- `docs/AUDITORIA-PERFORMANCE-IMAGENES.md`
- `docs/IMAGENES-VARIANTES-THUMB-CARD-DETAIL.md`

Validacion:

- `npm run build`: pasa.
- `npm run lint`: falla por CRLF preexistente en el repo.
- Lint acotado a archivos tocados: 0 errores, 2 warnings preexistentes en `src/store/cart.store.tsx`.

Pendiente operativo:

- Aplicar la migracion en Supabase/Lovable Cloud.
- Re-subir imagenes legacy desde admin para poblar variantes.
- Verificar headers de cache reales en DevTools con `Disable cache` desactivado.
