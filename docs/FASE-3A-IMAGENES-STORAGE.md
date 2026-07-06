# Fase 3A - Imagenes con Supabase Storage

Estado: completada a nivel de codigo y migracion. El panel admin ahora optimiza las imagenes en navegador antes de subirlas, por lo que no guarda originales pesados en Storage.

## Bucket

- Nombre: `product-images`
- Publico: si
- Tamano maximo: 5 MB
- Tipos permitidos:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`

Nota: la configuracion historica del bucket puede permitir GIF, pero el flujo del panel admin bloquea GIF y sube siempre WebP optimizado.

Las rutas internas se generan como:

```text
products/YYYY/MM/uuid.webp
```

En `products.image_url` se guarda la URL publica devuelta por Supabase Storage.

## Policies creadas

Migracion:

```text
supabase/migrations/20260706013000_product_images_storage.sql
```

Policies sobre `storage.objects`:

- `Public can read product images`: `anon` y `authenticated` pueden hacer `SELECT` solo en el bucket `product-images`.
- `Admins can upload product images`: `authenticated` puede hacer `INSERT` solo si existe una fila en `public.user_roles` con `user_id = auth.uid()` y `role = 'admin'`.
- `Admins can update product images`: mismo criterio para `UPDATE`.
- `Admins can delete product images`: mismo criterio para `DELETE`.

No se usa `service_role` en frontend. No se vuelve a dar `EXECUTE` publico a `public.has_role`.

## Servicio frontend

Archivo:

```text
src/services/storage.service.ts
```

Funciones:

- `validateProductImage(file)`: valida MIME y tamano del original.
- `optimizeProductImage(file)`: convierte a WebP con APIs nativas del navegador.
- `uploadProductImage(file)`: optimiza internamente, sube solo el WebP final y devuelve URL publica junto con metadata de peso/dimensiones.
- `getProductImagePublicUrl(path)`: obtiene URL publica desde un path de Storage.

Limites configurados:

- Formatos de entrada aceptados desde el panel: JPG, PNG y WebP.
- Original maximo: `10 MB`.
- Salida: `image/webp`.
- Dimension maxima: `1200 x 1200 px`.
- No se agrandan imagenes pequenas.
- Calidad inicial: `0.82`.
- Peso objetivo: menor a `250 KB`.
- Peso maximo final permitido: `450 KB`.
- `cacheControl`: `31536000`.
- `contentType` de subida: `image/webp`.

## Uso desde admin

En el formulario de producto:

1. El campo `URL de imagen` sigue editable.
2. El admin puede pegar una URL externa manualmente.
3. El admin puede usar `Subir imagen`.
4. Al seleccionar archivo, el formulario muestra `Optimizando imagen...`.
5. Luego muestra `Subiendo imagen optimizada...`.
6. Si la subida funciona, `image_url` se actualiza automaticamente con la URL publica del WebP final.
7. El formulario muestra peso original, peso optimizado y formato final WebP.
8. Si la optimizacion o subida falla, el formulario muestra error y no permite guardar hasta corregir.

## Placeholder publico

Componente reutilizable:

```text
src/components/product/ProductImage.tsx
```

Maneja:

- `image_url` valido.
- `image_url` vacio.
- Error de carga de imagen.
- `alt` descriptivo.

Se usa en:

- `ProductCard`
- `/producto/:slug`
- `/carrito`
- preview del `ProductForm`

## Error 403 al subir

Revisar:

1. Que la migracion del bucket este aplicada.
2. Que el usuario tenga una fila `public.user_roles` con `role = 'admin'`.
3. Que el usuario haya iniciado sesion nuevamente despues de asignar el rol.
4. Que el bucket sea `product-images`.
5. Que no se haya cambiado la policy de `storage.objects`.

Un usuario autenticado sin rol admin debe recibir error al intentar subir. Eso es el comportamiento correcto.

## Imagen no visible en catalogo

Revisar:

1. Que `products.image_url` tenga una URL publica.
2. Que el bucket sea publico.
3. Que la policy `Public can read product images` exista.
4. Que el archivo exista en Supabase Storage.
5. Que el producto este activo si se prueba desde `/catalogo`.

## Seguridad

- No usar `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- No publicar claves secretas en Vercel como variables `VITE_*`.
- No volver a dar `EXECUTE` publico a `public.has_role`.
- No permitir escritura publica en Storage.
- La UI admin ayuda, pero la defensa real es la policy de Storage.
- El frontend nunca sube la imagen original seleccionada; sube solo el archivo WebP optimizado.

## Reporte de cambios

Archivos modificados o agregados:

- `.env.example`
- `supabase/migrations/20260706013000_product_images_storage.sql`
- `src/services/storage.service.ts`
- `src/components/product/ProductImage.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/components/product/ProductCard.tsx`
- `src/routes/producto.$slug.tsx`
- `src/routes/carrito.tsx`
- `src/routes/_authenticated/admin.index.tsx`
- `docs/DEPLOY-VERCEL.md`
- `docs/FASE-3A-IMAGENES-STORAGE.md`
- `docs/ESTADO-ACTUAL-TEMPLATE.md`

Criterios responsive y visuales:

- Se mantiene la estetica Orbynex existente.
- No se redisenaron cards ni rutas.
- Las imagenes conservan contenedores con aspect ratio para evitar saltos grandes de layout.
- Los placeholders usan iconografia neutral y colores del sistema.

Riesgos:

- La migracion debe estar aplicada en Supabase/Lovable Cloud antes de probar upload real.
- Si Supabase Storage cambia nombres internos de columnas de `storage.buckets`, revisar `file_size_limit` y `allowed_mime_types`.
- Si `user_roles` no permite leer el propio rol, las policies de Storage bloquearan uploads admin. En el estado actual si permite `SELECT` propio.
- Si una imagen con mucho detalle no baja de `450 KB`, el panel la rechaza para proteger performance.
