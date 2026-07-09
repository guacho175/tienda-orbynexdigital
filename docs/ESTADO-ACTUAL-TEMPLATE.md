# Estado actual del template mini-commerce

**Checkpoint técnico** — Fecha: 2026-07-06
**Objetivo del proyecto**: template reutilizable de mini e-commerce (5-20 productos), demo inicial para Orbynex Digital, adaptable a otros clientes cambiando configuración, productos, imágenes, links de pago y colores.

---

## 1. Estado actual del proyecto

### Fase 1 — completada ✅

- Lovable Cloud (Supabase) activado.
- Tablas `products` y `user_roles` con RLS y policies.
- Enum `app_role` (`admin`, `moderator`, `user`).
- Función `has_role(_user_id, _role)` `SECURITY DEFINER`.
- 3 productos demo sembrados.
- Configuración centralizada en `src/config/` (brand, theme, commerce, home, navigation, app).
- Paleta Orbynex (Deep Space + Blue + Cyan + Magenta) en `src/styles.css`.
- Componentes base: `Navbar`, `Footer`, `Container`, `Section`, `PageHeader`, `ProductCard`, `Price`, `EmptyState`.
- `CartProvider` (React Context + `localStorage`).
- Utilidades: `currency` (`Intl.NumberFormat`), `whatsapp` (URL de checkout).
- Rutas públicas: `/`, `/catalogo`, `/producto/:slug`, `/carrito`, `/checkout`.
- Rutas admin: `/auth` (login/signup), `/_authenticated/admin` (lista protegida).

### Fase 2 — completada ✅

- CRUD completo de productos en `/admin`:
  - Lista con switch de activo/inactivo (mutación en vivo).
  - `/admin/new` — crear producto con formulario Zod.
  - `/admin/edit/:id` — editar producto existente.
  - Eliminar con `AlertDialog` de confirmación.
- Componente `ProductForm` (validación Zod, slugify automático, todos los campos de la tabla).
- Extensiones en `products.service.ts`: `createProduct`, `updateProduct`, `deleteProduct`, `toggleProductActive`, `fetchProductByIdAdmin`.
- Documentación in-app en `/docs` (10 secciones + tabla de contenido, `robots: noindex`).

### Auditoría post Fase 2 — completada ✅

Detalle completo en [`AUDITORIA-FASE-2.md`](./AUDITORIA-FASE-2.md).

Correcciones aplicadas:

- **Seguridad crítica**: `REVOKE EXECUTE ON has_role(...) FROM PUBLIC, anon, authenticated;` + `GRANT ... TO service_role`. Corrige el warn _Signed-In Users Can Execute SECURITY DEFINER Function_.
- Títulos `<title>` de `catalogo`, `carrito`, `checkout` migrados a `brandConfig.name`.
- `STORAGE_KEY` del carrito movido a `commerceConfig.cartStorageKey`.

### Estado del linter Supabase

- **0 issues** (`No linter issues found`) al 2026-07-06.
- Escáner de seguridad de Lovable: 0 findings.

---

## 2. Arquitectura actual

### Stack

- **TanStack Start v1** + TanStack Router (file-based routing).
- **React 19** + **Vite 7**.
- **Tailwind CSS v4** con tokens semánticos en `src/styles.css` (`:root`).
- **shadcn/ui** en `src/components/ui/`.
- **TanStack Query** para data fetching.
- **Lovable Cloud** (Supabase) para base de datos y auth.
- **Zod** para validación de formularios.

### Rutas públicas

| Ruta              | Archivo                         | Descripción                      |
| ----------------- | ------------------------------- | -------------------------------- |
| `/`               | `src/routes/index.tsx`          | Home con hero, beneficios y CTA  |
| `/catalogo`       | `src/routes/catalogo.tsx`       | Grilla de productos activos      |
| `/producto/:slug` | `src/routes/producto.$slug.tsx` | Ficha de producto                |
| `/carrito`        | `src/routes/carrito.tsx`        | Carrito editable                 |
| `/checkout`       | `src/routes/checkout.tsx`       | Datos + WhatsApp / link de pago  |
| `/auth`           | `src/routes/auth.tsx`           | Login / signup admin             |
| `/docs`           | `src/routes/docs.tsx`           | Documentación in-app (`noindex`) |

### Rutas admin (bajo `_authenticated/`)

| Ruta              | Archivo                             | Descripción             |
| ----------------- | ----------------------------------- | ----------------------- |
| `/admin`          | `_authenticated/admin.index.tsx`    | Lista + toggle + delete |
| `/admin/new`      | `_authenticated/admin.new.tsx`      | Crear producto          |
| `/admin/edit/:id` | `_authenticated/admin.edit.$id.tsx` | Editar producto         |

El layout `_authenticated/route.tsx` (managed por integración) usa `ssr:false`, valida sesión con `supabase.auth.getUser()` y redirige a `/auth` si no hay sesión. **No editar ese archivo.**

### Configuración centralizada — `src/config/`

| Archivo                | Contenido                                                                       |
| ---------------------- | ------------------------------------------------------------------------------- |
| `app.config.ts`        | Punto de entrada (re-exporta todo)                                              |
| `brand.config.ts`      | Nombre, tagline, email, teléfono, WhatsApp, redes, moneda, locale               |
| `theme.config.ts`      | Referencia a tokens semánticos                                                  |
| `commerce.config.ts`   | Moneda, WhatsApp checkout, links externos, `cartStorageKey`, `legal.termsShort` |
| `home.config.ts`       | Textos del hero, beneficios, CTA                                                |
| `navigation.config.ts` | Links del navbar y footer                                                       |

### Carrito y localStorage

- Proveedor: `src/store/cart.store.tsx` (React Context).
- Storage key: `commerceConfig.cartStorageKey` (`"shop_cart_v1"` por defecto).
- Rehidrata al montar; persiste en cada cambio.
- API expuesta: `items`, `count`, `subtotal`, `total`, `addItem`, `removeItem`, `updateQuantity`, `clear`.

### Supabase — tablas, funciones, RLS

**Tabla `products`**

Campos: `id`, `name`, `slug`, `short_description`, `description`, `price`, `currency`, `category`, `image_url`, `is_active`, `availability`, `payment_url`, `payment_button_label`, `display_order`, `created_at`, `updated_at`.

Policies:

- `Public can view active products` — SELECT anon/authenticated con `is_active = true`.
- `Admins can view all products` — SELECT autenticados con `has_role(auth.uid(), 'admin')`.
- `Admins can insert / update / delete products` — mismas guardas.

Grants: `SELECT` a `anon` y `authenticated`; `INSERT/UPDATE/DELETE` a `authenticated`; `ALL` a `service_role`.

**Tabla `user_roles`**

Campos: `id`, `user_id` (FK → `auth.users`), `role` (`app_role`), `created_at`. `UNIQUE (user_id, role)`.

Policies:

- `Users can view their own roles` — SELECT `auth.uid() = user_id`.
- `INSERT / UPDATE / DELETE` denegados desde el cliente (solo backend / SQL).

Grants: `SELECT` a `authenticated`; `ALL` a `service_role`.

**Funciones**

- `has_role(_user_id uuid, _role app_role) → boolean` — `SECURITY DEFINER`, `SET search_path = public`. `EXECUTE` **solo `service_role`** (post-auditoría).
- `set_updated_at()` — trigger genérico `updated_at = now()`.

**Enum**: `app_role` = `admin | moderator | user`.

**Buckets de Storage**: `product-images` público para imágenes de producto. El panel admin sube solo WebP optimizado desde navegador; no guarda originales pesados.

---

## 3. Cómo probar el proyecto

### 3.1 Catálogo

1. Ir a `/catalogo`.
2. Verificar que se listan solo productos con `is_active = true`.
3. Orden respetando `display_order`.
4. Click en una card → navega a `/producto/:slug`.

### 3.2 Detalle de producto

1. Desde `/catalogo`, entrar a un producto.
2. Ficha muestra imagen (si hay `image_url`), nombre, precio, descripción larga.
3. Botón "Agregar al carrito" incrementa el badge del navbar.
4. Si el producto tiene `payment_url`, aparece el botón externo.

### 3.3 Carrito

1. Agregar 2 productos distintos.
2. Ir a `/carrito`.
3. Aumentar / disminuir cantidad, eliminar item.
4. Refrescar la página → el carrito persiste (localStorage).
5. Total y subtotal se recalculan.

### 3.4 Checkout

1. Con carrito no vacío, ir a `/checkout`.
2. Sin datos: los botones muestran errores Zod al enviar.
3. Con datos válidos: click "Enviar pedido por WhatsApp" abre WhatsApp con mensaje pre-armado y limpia el carrito.
4. Con **carrito vacío**, entrar directo a `/checkout` → se muestra `EmptyState` con CTA a `/catalogo`.
5. Si el carrito tiene 1 solo producto con `payment_url`, aparece también el botón de link externo.

### 3.5 Login

1. Ir a `/auth`.
2. Registrar cuenta (sign up) o iniciar sesión.
3. Al obtener sesión, redirect automático a `/admin`.

### 3.6 Admin como usuario normal (sin rol)

1. Sign up con cualquier email nuevo.
2. Al llegar a `/admin` debe verse el bloque **"Acceso restringido"** con el email y el botón "Cerrar sesión".
3. Escribir manualmente `/admin/new` en la URL: el layout deja pasar (hay sesión), pero cualquier intento de guardar da error de PostgREST código `42501` (permission denied) por RLS.
4. Confirma en DevTools → Network.

### 3.7 Admin como admin (con rol)

1. Asignar rol admin (ver sección 4).
2. Ir a `/admin` con sesión iniciada.
3. Verificar:
   - Lista de productos (activos + inactivos).
   - Botón "Nuevo producto" → crea correctamente.
   - Editar (lápiz) → guarda cambios.
   - Switch → activa/desactiva y se refleja en `/catalogo` de inmediato.
   - Eliminar (papelera) → pide confirmación y borra.
4. Cerrar sesión → volver a `/catalogo` sin sesión: solo productos activos.

---

## 4. Cómo crear / asignar el primer admin

### Pasos actuales

1. La persona registra su cuenta en `/auth` (sign up con email y contraseña).
2. Se obtiene el `user_id` de esa cuenta desde el backend.
3. Se inserta manualmente una fila en `public.user_roles` con `role = 'admin'`.
4. La persona vuelve a iniciar sesión (o refresca) → tiene acceso al panel.

### SQL exacto

```sql
-- 1. Obtener el UUID del usuario (por email)
SELECT id, email FROM auth.users WHERE email = 'admin@tucliente.com';

-- 2. Asignar el rol admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('<UUID_DEL_USUARIO>', 'admin');
```

Este INSERT hay que ejecutarlo desde una vía con `service_role` (backend / SQL directo), porque la tabla `user_roles` deniega inserciones desde el cliente por RLS. Es intencional.

### Advertencias de seguridad

- **Nunca** dar `INSERT` en `user_roles` desde el cliente. Un usuario podría auto-promoverse a admin.
- **Nunca** guardar el rol en la tabla de perfiles ni en `localStorage`: crearía privilege escalation trivial.
- **Nunca** volver a dar `EXECUTE` público sobre `has_role`. Ver sección 6.
- Considerar habilitar 2FA en la cuenta admin desde el panel de Auth de Lovable Cloud.

---

## 5. Pendientes priorizados

### Fase 3A — crítica (necesaria para uso real por clientes)

1. **Upload de imágenes con Supabase Storage** — completado. Bucket público `product-images`, policies (`SELECT` público; `INSERT/UPDATE/DELETE` solo admin), input de archivo en `ProductForm`, optimización client-side a WebP y guardado de `image_url`.
2. **Reset password** — página `/reset-password` para completar el flujo de `supabase.auth.resetPasswordForEmail`. Sin esto, el flujo queda a medias.
3. **Mejor manejo de carrito vacío en checkout** — ya existe `EmptyState`, revisar que también deshabilite intents desde deep-links y sincronice con navbar.
4. **Vista previa del producto desde admin** — botón que abre `/producto/:slug` en nueva pestaña desde la lista y el formulario (útil aún cuando `is_active = false` mostrando un fallback).
5. **SEO básico por ruta pública** — `head()` con `title` + `description` únicos en `/catalogo`, `/producto/:slug`, `/carrito` (hoy solo tienen `title`). Descripciones desde `home.config.ts` o del propio producto.

### Fase 3B — mejora (calidad y descubrimiento)

6. `sitemap.xml` — server route en `/api/public/sitemap.xml` que liste productos activos.
7. `robots.txt` — public route con `Allow` general y `Disallow: /admin`, `/auth`, `/docs`.
8. JSON-LD `Product` en la ficha (rich snippets Google).
9. `og:image` dinámico en `/producto/:slug` derivado de `image_url`.
10. Imágenes placeholder neutras en `src/assets/` para clientes sin fotos aún.

### Fase 3C — avanzada (features operativos)

11. Asignar rol admin desde UI (con confirmación y auditoría). Requiere server function con `requireSupabaseAuth` + doble check `has_role` en backend.
12. Duplicar producto (botón "Duplicar" en admin que precarga el form).
13. Drag & drop para ordenar productos (`display_order`).
14. Página `/gracias` post-checkout WhatsApp con resumen visual.

---

## 6. Advertencias importantes

- **No exponer secretos en frontend.** `SUPABASE_SERVICE_ROLE_KEY` solo vive en `src/integrations/supabase/client.server.ts` y no debe importarse desde componentes ni desde `.functions.ts` a nivel de módulo. Los archivos auto-generados de la integración (`client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`, `.env`) **no se editan**.
- **No volver a dar `EXECUTE` público a `has_role`.** El fix de la auditoría es lo que cierra el finding _Signed-In Users Can Execute SECURITY DEFINER Function_. Si algún día se necesita llamarla desde el cliente, crear una función wrapper `SECURITY INVOKER` que valide `auth.uid()` en su body.
- **No implementar Flow / Mercado Pago / Stripe con API directa desde React.** Requeriría exponer credenciales de merchant en el bundle. El modelo del template es: **link de pago externo por producto** (`payment_url` + `payment_button_label`) generado en la consola de la pasarela y guardado en la tabla `products`.
- Los links de pago externos **deben seguir usando `payment_url`**. No agregar iframes ni SDKs de pasarelas de tarjetas al frontend.
- No editar `src/routes/_authenticated/route.tsx` (managed por integración).
- No añadir dependencias Node-only (child_process, sharp, canvas, etc.) para lógica de backend: el runtime es Cloudflare Workers.
- Antes de publicar para un cliente real: revisar `brandConfig.whatsapp`, `email`, y que exista al menos 1 admin en `user_roles`.

---

## 7. Próximo prompt recomendado

Copiar y pegar cuando se retome el proyecto para iniciar la Fase 3A:

```
Retomamos el template mini-commerce. Lee primero:
- docs/ESTADO-ACTUAL-TEMPLATE.md
- docs/AUDITORIA-FASE-2.md

Contexto rápido: Fase 1 y Fase 2 están cerradas y auditadas. Linter Supabase en 0.
La arquitectura es TanStack Start + Supabase con RLS, configuración
centralizada en src/config y CRUD de productos operativo en /admin.

Ejecuta Fase 3A completa, manteniendo intacta la arquitectura actual (TanStack
Start, Supabase, roles, RLS, carrito, config centralizada). NO refactorices lo
que ya funciona.

Alcance Fase 3A:

1. Upload de imágenes con Supabase Storage
   - Crea bucket público 'product-images'.
   - Policies: SELECT público; INSERT/UPDATE/DELETE solo con rol admin
     (usar has_role via policy sobre storage.objects, respetando que ahora
     has_role solo tiene EXECUTE para service_role — plantea alternativa
     si es necesario, por ejemplo policy directa sobre user_roles).
   - Añade input de archivo en ProductForm que suba y setee image_url.

2. Página /reset-password
   - Ruta pública que reciba el token type=recovery, permita nueva
     contraseña y llame supabase.auth.updateUser({ password }).
   - Añade en /auth un link "Olvidé mi contraseña" que dispare
     resetPasswordForEmail apuntando a /reset-password.

3. Vista previa del producto desde admin
   - Botón que abre /producto/:slug en nueva pestaña desde la lista y el
     form de edición (funciona aún si is_active = false: mostrar aviso
     "vista previa - producto no visible al público").

4. SEO básico por ruta pública
   - head() con title y description únicos en catalogo, producto.$slug,
     carrito y checkout. Descripciones vienen del producto o de home.config
     según corresponda.

5. Endurecer manejo de carrito vacío en checkout
   - Revisar deep-links y estados de red intermedios.

Al terminar:
- Corre supabase--linter y confirma 0 issues.
- Actualiza docs/ESTADO-ACTUAL-TEMPLATE.md marcando Fase 3A como completada.
- Reporta qué se hizo, qué archivos se tocaron y qué queda para Fase 3B/3C.
```

---

---

## Actualizacion - Fase 3A Imagenes con Supabase Storage

Estado: completada a nivel de codigo y migracion. El flujo admin ahora optimiza imagenes antes de subirlas y evita guardar originales pesados. Pendiente operativo: validar el flujo con usuarios reales en el entorno conectado.

Implementado:

- Bucket publico `product-images` mediante migracion SQL.
- Policies de Storage:
  - lectura publica para `anon` y `authenticated`;
  - `INSERT`, `UPDATE` y `DELETE` solo para usuarios autenticados con rol `admin` en `public.user_roles`.
- Servicio frontend `src/services/storage.service.ts` para validar, optimizar y subir imagenes sin `service_role`.
- Optimizacion client-side con `createImageBitmap`, `canvas` y `canvas.toBlob`.
- Upload de imagen en `ProductForm`, manteniendo el campo manual `image_url`.
- Preview de imagen en el formulario.
- Estados `Optimizando imagen...` y `Subiendo imagen optimizada...`.
- Metadata visible para admin: peso original, peso optimizado y formato final WebP.
- Placeholder reutilizable `ProductImage` para catalogo, detalle y carrito.
- Boton de vista publica desde el listado admin para productos activos.
- `.env.example` con variables publicas reales del proyecto.
- Documentacion:
  - `docs/FASE-3A-IMAGENES-STORAGE.md`
  - `docs/DEPLOY-VERCEL.md`

Seguridad mantenida:

- No se expone `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- No se vuelve a dar `EXECUTE` publico a `public.has_role`.
- Las policies admin de `products` validan el rol con `EXISTS` directo sobre `public.user_roles`, sin llamar `public.has_role` desde RLS.
- No se toca `src/routes/_authenticated/route.tsx`.
- No se implementan Flow API, Mercado Pago API, tabla `orders` ni carrito backend.
- No se tocaron Supabase config, RLS, Auth, endpoints Flow, checkout, tablas ni migraciones para la optimizacion de imagenes.

Limites de imagen configurados:

- Entrada permitida: JPG, PNG y WebP.
- Original maximo: `10 MB`.
- Salida obligatoria: WebP (`image/webp`).
- Dimension maxima: `1200 x 1200 px`, manteniendo aspect ratio y sin agrandar imagenes pequenas.
- Calidad inicial: `0.82`.
- Peso objetivo: menor a `250 KB`.
- Peso maximo final permitido: `450 KB`.
- Cache Storage: `31536000`.

Pendientes posteriores:

- Aplicar migracion en Supabase/Lovable Cloud.
- Probar upload como admin real.
- Probar bloqueo de upload como usuario autenticado sin rol admin.
- Mantener reset password, SEO avanzado, sitemap/robots y JSON-LD para fases futuras.

**Fin del checkpoint.**

---

## Optimizacion agresiva de imagenes - variantes

Estado: implementado a nivel de codigo al 2026-07-06.

Diagnostico:

- Productos activos medidos via Supabase publico: 15.
- URLs de imagen unicas: 15.
- Peso bruto actual por HEAD: 914.5 KB.
- Rango de imagenes actuales: 35.7 KB a 93.9 KB.
- Las imagenes actuales son WebP, pero antes todas las vistas usaban una sola `image_url`.
- Home mostraba 6 productos, pero consultaba todo el catalogo para derivar productos/categorias.
- El build mantiene warning de chunk cliente grande: `index` ~590 KB minificado (~171.8 KB gzip).

Implementado:

- Migracion `supabase/migrations/20260706160000_product_image_variants.sql`.
- Nuevas columnas nullable:
  - `image_url_thumb`
  - `image_url_card`
  - `image_url_detail`
- `image_url` queda como fallback legacy y alias de detail para productos nuevos.
- Admin genera tres variantes WebP al subir imagen:
  - thumb: 320 px, maximo 50 KB.
  - card: 480 px, maximo 80 KB.
  - detail: 1000 px, maximo 220 KB.
- `ProductImage` elige variante por contexto, usa fallback legacy, `loading="lazy"` por defecto, `decoding="async"`, `sizes` y `fetchPriority` solo cuando `priority=true`.
- Home usa `fetchFeaturedProducts(limit)` y maximo 6 productos.
- Catalogo usa campos necesarios para cards.
- Detalle usa variante `detail`.
- Carrito y checkout usan variante `thumb`.
- Carrito conserva compatibilidad con items antiguos de `localStorage`.
- Admin muestra pesos finales y aviso de imagen legacy cuando faltan variantes.

Documentacion nueva:

- `docs/AUDITORIA-PERFORMANCE-IMAGENES.md`
- `docs/IMAGENES-VARIANTES-THUMB-CARD-DETAIL.md`

Validacion:

- `npm run build`: pasa.
- `npm run lint`: falla por CRLF preexistente en el repo.
- Lint acotado a archivos tocados: 0 errores, 2 warnings preexistentes en `src/store/cart.store.tsx`.

Pendientes:

- Aplicar migracion en Supabase/Lovable Cloud antes del deploy que use columnas nuevas.
- Re-subir imagenes legacy desde admin para poblar variantes.
- Verificar en DevTools que `-card.webp`, `-thumb.webp` y `-detail.webp` se usan en las vistas correctas.
- Revisar headers de cache reales; la medicion HEAD de imagenes actuales mostro `cache-control: no-cache`.
- Fase avanzada: `srcset`, CDN transformations, paginacion/load more, blur placeholder, AVIF opcional y code splitting.

---

## Flow API - Fase 1 DB preparada

Estado: implementada localmente en la rama `feature/flow-api-dynamic-checkout`.

Se agrego la migracion `supabase/migrations/20260705225916_orders_flow_api_phase_1.sql` para preparar `public.orders` y `public.order_items` con constraints, indices, trigger `updated_at`, grants y RLS. La lectura desde cliente queda limitada a ordenes propias o admins; las escrituras directas desde `anon` y `authenticated` quedan cerradas para que futuras Vercel Functions usen `service_role` solo server-side.

`main` sigue usando el flujo estable actual: carrito en `localStorage`, checkout por WhatsApp y `payment_url` externo por producto. No existen endpoints Flow, webhook, ruta de resultado ni cambios de frontend en esta fase.

---

## Flow API - cierre sandbox Vercel

Estado: implementado al 2026-07-06.

El checkout Flow dinamico queda conectado de extremo a extremo para sandbox:

- `/checkout` crea pagos desde `POST /api/flow/create-payment`.
- `create-payment` recalcula el carrito desde Supabase y no confia en precios del frontend.
- `create-payment` envia a Flow una return URL por orden:

```text
https://tienda-orbynexdigital.vercel.app/checkout/resultado?commerceOrder=<ORDEN>&publicLookupToken=<TOKEN_PUBLICO>&lookup=<TOKEN_PUBLICO>
```

- `/checkout/resultado` consulta `GET /api/flow/order-status`.
- La pantalla muestra `paid`, `pending`, `failed`, `cancelled` o `expired`.
- El carrito solo se limpia cuando la orden local vuelve como `paid`.
- `POST /api/flow/confirm` sigue siendo el unico punto que confirma con Flow server-side y actualiza estado real tras llamar `payment/getStatus`.
- WhatsApp checkout y `payment_url` externo por producto siguen funcionando.

Variables correctas en Vercel sandbox:

```text
APP_PUBLIC_URL=https://tienda-orbynexdigital.vercel.app
FLOW_RETURN_URL=https://tienda-orbynexdigital.vercel.app/checkout/resultado
FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.vercel.app/api/flow/confirm
```

Documentacion operativa: `docs/FLOW-FASE-3-RESULTADO-CHECKOUT.md`.

---

## Rediseno publico e-commerce

Estado: implementado a nivel de codigo al 2026-07-06.

El frontend publico deja de presentarse como landing corporativa y pasa a comunicar una tienda demo funcional:

- Home con productos destacados desde Supabase (`fetchActiveProducts`) y limite de 6 productos.
- Categorias visibles en portada, derivadas desde productos activos con fallback en `home.config.ts`.
- Seccion de flujo de compra: catalogo, carrito, checkout Flow/WhatsApp y resultado.
- Seccion comercial "Demo e-commerce" con capacidades del template.
- Catalogo con filtros por categoria en cliente.
- Cards de producto con precio destacado, imagen estable y botones "Ver producto" / "Agregar".
- Componente reutilizable `BackLink` para retornos claros.
- Retornos agregados en catalogo, detalle, carrito, checkout y resultado de pago.
- Checkout y resultado de pago mejorados visualmente sin tocar endpoints ni logica de confirmacion.

Documentacion:

- `docs/REDISENO-HOME-ECOMMERCE.md`
- `docs/SEED-PRODUCTOS-DEMO.md`

No se toco:

- Supabase config, RLS, auth, admin, `ProductForm`, endpoints `api/flow/*`, migraciones, variables de entorno, `payment_url`, WhatsApp checkout, store del carrito ni `src/routes/_authenticated/route.tsx`.

---

## Inventario de productos

Estado: implementado a nivel de codigo y migracion al 2026-07-07.

Se agrego control de stock configurable por producto:

- Nuevas columnas en `products`: `stock_quantity`, `track_inventory`, `allow_backorder`, `low_stock_threshold`, `out_of_stock_behavior`.
- Productos existentes quedan con `track_inventory = false` para no romper catalogo ni servicios digitales.
- Home/catalogo ocultan automaticamente productos agotados configurados como `hide_product`.
- Productos agotados con `show_sold_out` siguen visibles con badge `Agotado` y compra bloqueada.
- Detalle muestra stock, pocas unidades o agotado.
- Carrito y checkout consultan productos frescos para bloquear stock insuficiente antes de Flow o `payment_url`.
- `api/flow/create-payment` valida stock server-side antes de crear pago.
- `api/flow/confirm` descuenta stock solo cuando Flow confirma pago exitoso.
- RPC `public.confirm_order_and_decrement_stock(...)` procesa orden y descuento dentro de una transaccion e impide stock negativo.
- Admin permite configurar inventario y muestra badges de estado de stock.

Documentacion operativa: [`INVENTARIO-PRODUCTOS.md`](./INVENTARIO-PRODUCTOS.md).

---

## Productos similares en ficha de detalle

Estado: implementado y validado localmente al 2026-07-09.

- Cada ruta `/producto/$slug` puede mostrar hasta tres recomendaciones.
- Se prioriza la misma categoria y se completa con productos de otras categorias.
- El producto actual queda excluido y no existen datos hardcodeados.
- Con un unico producto publico elegible la seccion se oculta automaticamente.
- La consulta solicita solo campos de tarjeta, limita resultados y aplica disponibilidad una vez.
- React Query comparte cache durante 5 minutos y libera consultas inactivas despues de 30 minutos.
- Limites, textos, tiempos y comportamiento se centralizan en `commerceConfig.relatedProducts`.
- La UI reutiliza `ProductCard`, usa grilla desktop y carrusel nativo con `scroll-snap` en movil.
- No se modificaron migraciones, RLS, Flow, WhatsApp, checkout ni `payment_url`.

Documentacion: [`PLAN-PRODUCTOS-SIMILARES-DETALLE.md`](./PLAN-PRODUCTOS-SIMILARES-DETALLE.md).
