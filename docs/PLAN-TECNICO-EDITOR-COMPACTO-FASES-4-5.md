# Plan tecnico cerrado - Editor compacto Fases 4 y 5

**Fecha:** 2026-07-09  
**Estado:** auditoria cerrada; no autorizado para implementacion  
**Alcance:** decision tecnica para continuar el editor compacto despues de Fases 1, 2 y 3  
**Regla operativa:** este documento no autoriza codigo, migraciones, cambios de contratos, backend, checkout, RLS ni despliegues. Cualquier bloque requiere aprobacion explicita del usuario antes de ejecutar.

## 1. Documentos y fuentes revisadas

Documentos del proyecto leidos:

- `docs/PLAN-MAESTRO-EDITOR-PRODUCTO-COMPACTO.md`
- `docs/AGENT-HANDOFF.md`
- `docs/REPORTE-EJECUCION-EDITOR-COMPACTO-FASES-1-2.md`
- `docs/REPORTE-EJECUCION-EDITOR-COMPACTO-FASE-3.md`
- `docs/ESTADO-ACTUAL-TEMPLATE.md`

Fuentes tecnicas verificadas:

- Supabase changelog oficial: `https://supabase.com/changelog.md`
- Entrada relevante: `https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically`
- Skills locales de Supabase y buenas practicas Postgres/RLS:
  - RLS basico.
  - Privilegios minimos.
  - Constraints seguros.
  - Indices para foreign keys.

## 2. Auditoria del estado actual

### 2.1 Estado local

- `git status --short` no reporta cambios locales pendientes al momento de esta auditoria.
- Fases 1, 2 y 3 del editor compacto estan documentadas como implementadas.
- No existe commit asociado a las fases en los reportes, pero la copia local auditada esta limpia.
- `node_modules` existe localmente, lo que permite verificar tipos de TanStack Router antes de una implementacion futura.

### 2.2 Modelo `products`

La tabla `public.products` ya contiene:

- Identidad: `id`, `name`, `slug`.
- Descripciones: `short_description`, `description`.
- Precio/pago: `price`, `currency`, `payment_url`, `payment_button_label`.
- Imagen legacy y variantes: `image_url`, `image_url_thumb`, `image_url_card`, `image_url_detail`.
- Publicacion/orden: `is_active`, `category`, `display_order`.
- Inventario: `availability`, `stock_quantity`, `track_inventory`, `allow_backorder`, `low_stock_threshold`, `out_of_stock_behavior`.
- Timestamps: `created_at`, `updated_at`.

No existen columnas persistidas para:

- `meta_title`
- `meta_description`
- control de indexacion por producto
- override OpenGraph por producto
- galeria normalizada
- precios avanzados
- envio
- categorias normalizadas/tags/colecciones
- SKU, draft/private o enum/constraint para `availability`

### 2.3 RLS, grants y exposicion

`public.products` ya esta expuesta a `anon` y `authenticated` con `SELECT`, y la lectura publica queda limitada por RLS a productos activos. Las escrituras directas desde el cliente estan limitadas a usuarios autenticados con rol admin mediante policies que consultan `public.user_roles` directamente.

El cambio de Supabase de abril de 2026 sobre exposicion explicita de nuevas tablas es relevante para cualquier bloque que cree tablas nuevas. No afecta al bloque SEO recomendado si se implementa solo agregando columnas a `public.products`.

### 2.4 Tipos y contrato frontend

Archivos auditados:

- `src/types/product.ts`
- `src/services/products.service.ts`
- `src/integrations/supabase/types.ts`
- `src/components/admin/product-editor/product-editor.schema.ts`
- `src/components/admin/product-editor/ProductSeoSection.tsx`
- `src/config/product-editor.config.ts`
- `src/routes/producto.$slug.tsx`

Estado observado:

- `ProductInput` es un `Pick` explicito de campos escribibles.
- Los campos runtime `available_quantity` y `temporarily_reserved` no forman parte del payload de escritura.
- `ProductSeoSection` solo edita `slug` y muestra preview derivada. No guarda metadatos SEO.
- `src/routes/producto.$slug.tsx` no define `head()` propio.
- `src/routes/__root.tsx` define metadatos globales y OpenGraph generico.
- Rutas como `/catalogo`, `/carrito`, `/checkout` ya usan `head()` estatico.
- TanStack Router local acepta `head(ctx)` con `loaderData`, por lo que un bloque SEO real puede usar `loader` + `head` para metadatos dinamicos, validandolo en TypeScript antes de implementar.

### 2.5 Checkout, Flow, WhatsApp y `payment_url`

El bloque SEO real no requiere tocar:

- `api/flow/*`
- `src/server/flow/*`
- `orders`
- `order_items`
- reservas de stock
- RPCs de inventario
- WhatsApp checkout
- `payment_url`

La ruta `/producto/$slug` muestra `payment_url` solo cuando el producto tiene URL externa y la compra esta disponible. Esta conducta debe quedar intacta.

## 3. Decision de alcance

### 3.1 Implementar ahora solo con aprobacion: Fase 4A - SEO real

Conviene implementar primero el bloque **SEO real** porque:

- Es el bloque mas aislado.
- Puede resolverse con columnas nuevas en `products`, sin tabla nueva.
- No modifica precio, stock, reservas, checkout ni Flow.
- Tiene consumo publico claro: `head()` dinamico en `/producto/$slug`.
- La UI admin ya tiene una seccion SEO donde conectar campos reales.
- Permite mejorar valor publico sin introducir UI falsa.

### 3.2 Mantener en backlog

Deben permanecer en backlog hasta requisitos concretos y aprobacion separada:

- Galeria.
- Precios avanzados.
- Envio.
- Organizacion avanzada.
- Semantica de estados.
- Toda Fase 5.

## 4. Bloque recomendado: Fase 4A - SEO real

### 4.1 Objetivo

Persistir metadatos SEO por producto y consumirlos en la ruta publica `/producto/$slug`, manteniendo fallback seguro a los campos actuales.

### 4.2 Modelo propuesto

Agregar a `public.products`:

- `meta_title text null`
- `meta_description text null`
- `seo_noindex boolean not null default false`
- `og_image_url text null`

No agregar en este primer corte:

- `og_title`
- `og_description`
- `canonical_url`
- `schema_json`
- JSON opaco de SEO
- score SEO
- IA, benchmarking o keywords

Razon:

- `og:title` debe derivar de `meta_title || name`.
- `og:description` debe derivar de `meta_description || short_description || description`.
- `og:image` debe derivar de `og_image_url || image_url_detail || image_url_card || image_url`.
- Canonical puede derivarse de `/producto/$slug` mientras no exista `siteUrl` canonico aprobado.

### 4.3 Constraints recomendados

Migracion chica y compatible:

- `length(meta_title) <= 70`
- `length(meta_description) <= 170`
- `length(og_image_url) <= 500`
- `og_image_url is null OR og_image_url ~* '^https?://'`

Notas:

- Mantener columnas nullable para no bloquear productos existentes.
- No backfillear datos derivados. Los fallbacks se calculan en frontend/ruta.
- No agregar constraint al `slug` ni `availability` en este bloque.
- Si se agregan constraints, usar `ALTER TABLE ... ADD CONSTRAINT` con nombres estables. Si se busca idempotencia, usar bloque `DO $$` porque Postgres no soporta `ADD CONSTRAINT IF NOT EXISTS`.

### 4.4 Migracion requerida

Crear la migracion futura con Supabase CLI, no inventar filename manualmente:

```bash
supabase migration new product_seo_metadata
```

SQL esperado, sujeto a revision final:

```sql
alter table public.products
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists seo_noindex boolean not null default false,
  add column if not exists og_image_url text;

alter table public.products
  add constraint products_meta_title_length_check
  check (meta_title is null or char_length(meta_title) <= 70);

alter table public.products
  add constraint products_meta_description_length_check
  check (meta_description is null or char_length(meta_description) <= 170);

alter table public.products
  add constraint products_og_image_url_length_check
  check (og_image_url is null or char_length(og_image_url) <= 500);

alter table public.products
  add constraint products_og_image_url_http_check
  check (og_image_url is null or og_image_url ~* '^https?://');
```

Si la migracion debe ser re-ejecutable en entornos con drift, envolver constraints en bloques `DO $$` con consulta a `pg_constraint`.

### 4.5 Impacto en RLS, grants y tipos Supabase

RLS:

- No crear policies nuevas.
- Mantener policies actuales sobre `products`.
- Publico solo lee productos activos por policy existente.
- Admin sigue insertando/actualizando por policy existente.

Grants:

- No se requieren grants nuevos si solo se agregan columnas a `products`.
- Verificar que los grants existentes sigan en `public.products`: `SELECT` para `anon/authenticated`, escrituras para `authenticated`, `ALL` para `service_role`.

Tipos:

- Actualizar o regenerar `src/integrations/supabase/types.ts`.
- Actualizar `src/types/product.ts`.
- Actualizar `ProductInput`.
- Actualizar `ProductEditorValues`, mappers y schema.
- Verificar que `Row`, `Insert` y `Update` incluyan los cuatro campos.

### 4.6 Impacto en admin

Archivos candidatos:

- `src/config/product-editor.config.ts`
- `src/components/admin/product-editor/product-editor.schema.ts`
- `src/components/admin/product-editor/product-editor.mappers.ts`
- `src/components/admin/product-editor/ProductSeoSection.tsx`
- `src/components/admin/product-editor/useProductEditor.ts` si el mapeo/foco requiere ajustes.
- `src/services/products.service.ts`
- `src/types/product.ts`
- `src/integrations/supabase/types.ts`

UI:

- Mantener `slug`.
- Agregar `meta_title` y `meta_description` como campos reales.
- Agregar `seo_noindex` con switch/toggle claro.
- Agregar `og_image_url` solo como override opcional.
- Mostrar preview usando exactamente la misma cascada que la ruta publica.
- Mantener contadores y limites.
- No mostrar score SEO, keywords, IA, volumen de busqueda ni estados no respaldados.

### 4.7 Impacto en rutas publicas

Ruta principal:

- `src/routes/producto.$slug.tsx`

Plan:

- Agregar un loader ligero para obtener producto por slug o reusar una funcion dedicada de metadatos.
- Usar `head: ({ loaderData, params }) => ({ meta: [...] })`.
- Fallbacks:
  - title: `meta_title || name`
  - description: `meta_description || short_description || description || brandConfig.description`
  - robots: `noindex,nofollow` solo si `seo_noindex = true`; si no, no emitir robots de bloqueo.
  - `og:title`: mismo title.
  - `og:description`: misma description.
  - `og:type`: `product`.
  - `og:image`: `og_image_url || image_url_detail || image_url_card || image_url || logo global`.
  - Twitter card: `summary_large_image`.
- Si el producto no existe o no es publico, usar title "Producto no encontrado" sin exponer datos admin.

Rutas no tocadas en este bloque:

- `/catalogo`
- `/carrito`
- `/checkout`
- `/checkout/resultado`
- `/admin`
- `/admin/new`
- `/admin/edit/$id`

### 4.8 Impacto en checkout Flow/WhatsApp/`payment_url`

Ninguno previsto.

Prohibido dentro de este bloque:

- Cambiar `api/flow/create-payment.ts`.
- Cambiar `api/flow/confirm.ts`.
- Cambiar `api/flow/order-status.ts`.
- Cambiar RPCs de stock.
- Cambiar ordenes o items.
- Cambiar condiciones de compra.
- Cambiar aparicion o fallback de `payment_url`.
- Cambiar WhatsApp checkout.

Verificacion obligatoria:

- Buscar diff y confirmar que no aparecen cambios en `api/flow`, `src/server/flow`, `checkout`, `orders`, `order_items`, `stock_reservations` ni `src/routes/_authenticated/route.tsx`.

## 5. Bloques que deben quedar en backlog

### 5.1 Galeria

No implementar ahora.

Requiere:

- Tabla `product_images`.
- FK `product_id -> products(id)` e indice en `product_id`.
- Campos: URL/path, alt, orden, rol principal, timestamps.
- Decidir si se guardan URLs publicas, paths Storage o ambos.
- RLS y grants especificos.
- Storage policies coherentes.
- Estrategia de borrado y archivos huerfanos.
- UI admin real para ordenar, reemplazar y eliminar.

Riesgo:

- Alto. Puede romper variantes actuales, admin, Storage y superficies publicas si se mezcla con SEO.

### 5.2 Precios avanzados

No implementar ahora.

Requiere:

- Definir precio oferta vs descuento.
- Fechas de vigencia.
- Impuestos.
- Redondeo.
- Autoridad server-side del calculo.
- Actualizar creacion de orden, Flow y validaciones antes de mostrar UI.

Riesgo:

- P0 si el frontend calcula valores cobrables.
- P0 si Flow recibe totales distintos al servidor.

### 5.3 Envio

No implementar ahora.

Requiere:

- Definir producto fisico vs digital.
- Peso, dimensiones, unidades.
- Zonas, retiro, tarifas, impuestos y reglas.
- `shipping_total` calculado server-side.
- Integracion con checkout y ordenes.

Riesgo:

- P0 si se cobra envio mal o si el total de Flow no coincide con orden local.

### 5.4 Organizacion avanzada

No implementar ahora.

Requiere:

- Caso real para categorias normalizadas, tags, colecciones o destacados.
- Tablas y relaciones si hay normalizacion.
- Reglas de visibilidad publica.
- Estrategia de migracion desde `category` libre.

Riesgo:

- Medio/alto por migracion de datos y filtros publicos.

### 5.5 Semantica de estados

No implementar ahora.

Requiere:

- Constraint o enum para `availability`.
- Auditoria de datos existentes antes de activar constraint.
- Definir reglas para Draft/Private/SKU si se piden.
- Revisar queries publicas y admin.

Riesgo:

- Alto si se bloquean productos existentes con valores legacy.

### 5.6 Fase 5 completa

No implementar ahora.

Mantener en backlog:

- Autosave con versionado y conflictos.
- Auditoria por usuario.
- Historial de stock.
- Analitica basada en eventos reales.
- Integraciones logisticas.
- Benchmarking externo.
- Ayuda de IA.
- Buscador global.
- Notificaciones administrativas.

Riesgo:

- Alto si se implementa sin modelo de eventos, versionado, permisos y retencion.

## 6. Riesgos P0/P1

### P0

- Tocar Flow, ordenes, reservas o precios al implementar SEO.
- Generar `head()` publico con datos de productos inactivos o no autorizados.
- Crear tablas nuevas sin RLS/grants/exposicion Data API revisados.
- Mostrar UI de descuentos/envio/galeria sin persistencia real.
- Cambiar `payment_url` o ocultarlo como fallback.
- Usar `service_role` o secretos en frontend.

### P1

- Tipos Supabase desactualizados tras migracion.
- Constraints que fallen sobre datos existentes.
- Metadatos demasiado largos o sin fallback.
- `seo_noindex` aplicado por error a productos activos.
- Duplicar fetch de producto de forma ineficiente entre loader y React Query.
- No validar la ruta publica en build/SSR.
- Barra sticky movil sigue cubriendo contenido si se agregan campos SEO sin ajustar padding.

## 7. Orden recomendado de implementacion

No ejecutar sin aprobacion explicita.

1. Confirmar alcance Fase 4A con el usuario.
2. Crear rama si el usuario lo solicita o si se va a preparar PR.
3. Ejecutar `git status --short`.
4. Crear migracion con `supabase migration new product_seo_metadata`.
5. Agregar columnas y constraints.
6. Actualizar/verificar tipos Supabase.
7. Actualizar tipos de dominio y `ProductInput`.
8. Actualizar schema, mappers, defaults y config del editor.
9. Conectar UI real en `ProductSeoSection`.
10. Conectar preview con la misma cascada que la ruta publica.
11. Agregar loader/head dinamico en `/producto/$slug`.
12. Validar que no hubo cambios en Flow, WhatsApp, `payment_url`, Auth, RLS no relacionada ni reservas.
13. Ejecutar validaciones.
14. QA visual admin y publica.
15. Crear reporte de ejecucion en `docs/`.
16. Actualizar `docs/AGENT-HANDOFF.md` y `docs/ESTADO-ACTUAL-TEMPLATE.md`.

## 8. Pruebas obligatorias para Fase 4A

### Validaciones tecnicas

- Prettier dirigido sobre archivos tocados.
- ESLint dirigido sobre archivos tocados.
- `npx tsc --noEmit --pretty false`.
- `npm run build`.
- `git diff --check`.
- Supabase lint/advisors cuando el entorno lo permita.

### Validaciones SQL

- Aplicar migracion en entorno local o equivalente.
- Verificar que productos existentes no fallan constraints.
- Verificar que `Row`, `Insert` y `Update` reflejan columnas nuevas.
- Verificar lectura anon de producto activo.
- Verificar que anon no lee producto inactivo.
- Verificar update admin de campos SEO.
- Verificar que usuario autenticado sin rol admin no puede escribir.

### QA admin

- `/admin/new` en movil y desktop.
- `/admin/edit/$id` en movil y desktop.
- Guardar con campos SEO vacios y confirmar fallback.
- Guardar `meta_title` y `meta_description`.
- Activar/desactivar `seo_noindex`.
- Probar `og_image_url` valida e invalida.
- Confirmar que los errores de SEO se muestran en su seccion.
- Confirmar que la barra sticky movil no tapa los nuevos campos.

### QA publica

- `/producto/$slug` activo con metadatos vacios.
- `/producto/$slug` activo con metadatos completos.
- Producto con `seo_noindex = true`.
- Producto sin imagen.
- Producto con variantes `detail/card/thumb`.
- Producto inactivo: no debe exponer metadatos admin.
- Catalogo, carrito y checkout sin regresiones.
- `payment_url` sigue visible cuando corresponde.
- WhatsApp sigue visible cuando corresponde.

## 9. Criterio de aprobacion solicitado

Para continuar, el usuario debe aprobar explicitamente una de estas opciones:

- "Aprobar Fase 4A SEO real"
- "Aprobar solo migracion SEO"
- "Aprobar solo UI/admin SEO"
- "Pausar Fase 4A y revisar backlog"

Sin esa aprobacion no se debe tocar codigo backend, migraciones, contratos, RLS, Flow, WhatsApp ni rutas publicas.

## 10. Conclusion

La unica entrega de Fase 4 que conviene abordar ahora es **SEO real** como Fase 4A, limitado a columnas nuevas en `products`, UI admin conectada y `head()` dinamico en `/producto/$slug`. El resto de Fase 4 y toda Fase 5 deben seguir en backlog porque requieren decisiones de producto, nuevas tablas, cambios de checkout o reglas server-side con riesgo material.
