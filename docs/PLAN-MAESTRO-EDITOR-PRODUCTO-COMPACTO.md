# Plan maestro para adaptar editor de producto compacto

**Estado:** en proceso; Fases 1 y 2 implementadas y revisadas, Fase 3 no iniciada  
**Fecha del análisis:** 2026-07-09  
**Alcance:** editor de creación y edición de productos, su contrato de datos y las referencias de `docs/stitch_compact_product_editor/`  
**Restricción:** este documento no autoriza cambios de código, base de datos, contratos, despliegues ni commits.

## Estado de ejecución al 2026-07-09

| Fase | Estado | Evidencia |
|---|---|---|
| Fase 1 | Implementada y validada técnicamente | Editor por secciones, estado único, errores por sección, dirty state, barra sticky y responsive |
| Fase 2 | Implementada y validada técnicamente | Estado de inventario, variantes, precio localizado, moneda controlada, `updated_at` y contrato de escritura explícito |
| Fase 3 | No iniciada | Requiere revisión del reporte y nueva autorización del usuario |
| Fases 4–5 | No iniciadas | Fuera del alcance aprobado |

Validaciones completadas: Prettier dirigido, ESLint dirigido, `tsc --noEmit`, build de producción y smoke test público en navegador. La inspección visual autenticada de `/admin/new` y `/admin/edit/$id` queda pendiente porque la sesión local disponible no tiene autenticación admin.

Reporte de ejecución, incidencias y decisiones: [`REPORTE-EJECUCION-EDITOR-COMPACTO-FASES-1-2.md`](./REPORTE-EJECUCION-EDITOR-COMPACTO-FASES-1-2.md).

## Resumen ejecutivo

La mejora debe comenzar como un refactor de presentación y organización, no como una expansión del modelo de producto. El proyecto ya soporta las funciones de mayor valor inmediato: datos generales, inventario finito u opcional, backorder, umbral de stock bajo, conducta al agotarse, disponibilidad comercial, precio, moneda, categoría, orden, visibilidad, pago externo, carga de una imagen con tres variantes WebP y URL manual.

La propuesta recomendada es un editor de una sola ruta y un solo formulario, con navegación interna por secciones y una barra persistente de acciones. En escritorio tendrá un rail local y sticky; en móvil, un selector compacto de sección. Solo se muestra una sección a la vez, pero el estado completo vive en un único controlador para no perder datos al navegar.

Secciones iniciales:

1. General
2. Inventario
3. Precios y pago
4. Multimedia
5. Organización y visibilidad
6. SEO básico

`Envío` no debe aparecer como sección operativa en la primera implementación: hoy no existen campos de producto, reglas logísticas ni cálculo de envío conectado al checkout. `SEO básico` contendrá inicialmente el `slug` existente y, como máximo, una vista previa derivada no persistente. Galería, descuentos, impuestos por producto, metadatos SEO, etiquetas, colecciones y envío requieren decisiones de producto y, en varios casos, cambios de modelo.

## 1. Diagnóstico del proyecto actual

### 1.1 Stack detectado

- React 19 y TypeScript.
- TanStack Start/Router para rutas y ejecución de la aplicación.
- TanStack Query para consultas, mutaciones e invalidación de caché.
- Vite 8 y Tailwind CSS 4.
- Componentes Radix/shadcn ya disponibles, incluidos `Tabs`, `Accordion`, `ScrollArea`, `Sheet`, `Sidebar`, `Select`, `Switch`, `Card` y formularios.
- Zod para validación.
- `react-hook-form` y `@hookform/resolvers` están instalados, aunque el editor actual no los usa.
- Supabase:
  - Postgres y Data API para productos.
  - Auth y RLS para administración.
  - Storage público para imágenes de producto.
- Sonner para notificaciones.
- Flow, enlace de pago externo y WhatsApp como caminos de checkout protegidos.

No se detectó una infraestructura de pruebas automatizadas ni scripts de test en `package.json`.

### 1.2 Estructura relevante

| Área | Archivo o carpeta | Responsabilidad actual |
|---|---|---|
| Formulario | `src/components/admin/ProductForm.tsx` | Estado, esquema Zod, upload, transformación, UI y submit en un componente de 526 líneas |
| Alta | `src/routes/_authenticated/admin.new.tsx` | Mutación `createProduct`, toast, invalidación y navegación |
| Edición | `src/routes/_authenticated/admin.edit.$id.tsx` | Carga por ID, mutación `updateProduct`, toast, invalidación y navegación |
| Listado admin | `src/routes/_authenticated/admin.index.tsx` | Lista, estado, stock, miniaturas, activar/desactivar y eliminar |
| Servicio de productos | `src/services/products.service.ts` | CRUD, consultas públicas/admin y enriquecimiento de disponibilidad |
| Servicio de imágenes | `src/services/storage.service.ts` | Validación, optimización nativa y upload de variantes |
| Tipo de dominio | `src/types/product.ts` | `Product` y `ProductCardData` |
| Tipos Supabase | `src/integrations/supabase/types.ts` | Tipos generados/manuales de tablas |
| Cliente público | `src/integrations/supabase/client.ts` | Cliente usado por frontend y CRUD sujeto a RLS |
| Cliente servidor | `src/integrations/supabase/client.server.ts` | Operaciones confiables del backend |
| Configuración comercial | `src/config/commerce.config.ts` | Moneda, checkout y funciones comerciales |
| Configuración de marca | `src/config/brand.config.ts` | Marca, país, locale y moneda base |
| Reglas de inventario UI | `src/utils/inventory.ts` | Agotado, stock bajo, compra disponible y ocultamiento |
| API disponibilidad | `api/products/availability.ts` | Stock disponible descontando reservas activas |
| Backend Flow | `api/flow/*`, `src/server/flow/*` | Creación/confirmación de pagos con valores autoritativos de servidor |
| Modelo base | `supabase/migrations/20260706001459_ccfe6ebc-d21a-4806-b570-a4ebeb2582f7.sql` | Tabla `products`, RLS e índices |
| Variantes de imagen | `supabase/migrations/20260706160000_product_image_variants.sql` | URLs `thumb`, `card` y `detail` |
| Inventario | `supabase/migrations/20260707010000_product_inventory.sql` | Campos y constraints de inventario |
| Reservas | `supabase/migrations/20260707023000_stock_reservations_flow_inventory.sql` | Reserva/captura/liberación de stock |
| RLS admin | `supabase/migrations/20260706014500_products_policies_direct_user_roles.sql` | CRUD admin mediante `user_roles` |

### 1.3 Rutas y flujo de guardado

El alta y la edición reutilizan `ProductForm`. El formulario:

1. Inicializa un objeto `ProductInput` con datos existentes o valores por defecto.
2. Mantiene todo el estado mediante `useState`.
3. Valida el objeto completo con un esquema Zod local.
4. Convierte strings opcionales vacíos a `null`.
5. Llama al `onSubmit` de la ruta.
6. La ruta ejecuta `createProduct` o `updateProduct`.
7. Supabase aplica RLS y devuelve el registro.
8. TanStack Query invalida las consultas correspondientes.
9. Se muestra un toast y se vuelve a `/admin`.

No existe autosave, guardado parcial, borrador, bloqueo optimista por versión ni confirmación de cambios sin guardar.

### 1.4 Validaciones actuales

| Campo | Validación frontend | Restricción de base de datos relevante |
|---|---|---|
| `name` | requerido, trim, 2–120 | `NOT NULL` |
| `slug` | requerido, 2–120, minúsculas/números/guiones | `NOT NULL`, `UNIQUE` |
| `short_description` | opcional, máximo 200 | nullable |
| `description` | opcional, máximo 4000 | nullable |
| `price` | número, mínimo 0 | `NUMERIC(12,2) NOT NULL`; sin `CHECK >= 0` en `products` |
| `currency` | 3–6 caracteres | `NOT NULL`; Flow acepta solo `CLP` |
| `category` | opcional, máximo 60 | nullable; índice, sin catálogo normalizado |
| URLs | URL válida, máximo 500 | nullable; sin constraint de formato |
| `stock_quantity` | entero, mínimo 0 | `CHECK >= 0` |
| `low_stock_threshold` | entero, mínimo 0 | `CHECK >= 0` |
| `out_of_stock_behavior` | enum de dos valores | `CHECK` equivalente |
| `availability` | enum de tres valores en UI | texto libre en base de datos |
| `payment_button_label` | opcional, máximo 60 | nullable |
| `display_order` | entero, mínimo 0 | entero sin `CHECK >= 0` |

Hay una asimetría que debe corregirse en una fase controlada: `ProductInput` se deriva de `Product` y puede incluir propiedades runtime (`available_quantity`, `temporarily_reserved`) que no son campos editables. El payload actual no las envía porque Zod reconstruye el objeto, pero el tipo no expresa correctamente el contrato de escritura.

También existe una desalineación visible en `src/integrations/supabase/types.ts`: `description` aparece en `Row`, pero no en los bloques `Insert` y `Update`. Antes de cambios de modelo se deben regenerar/verificar esos tipos.

### 1.5 Dependencias y contratos que no deben romperse

- `payment_url` debe continuar como fallback de pago.
- El checkout de WhatsApp debe permanecer sin cambios.
- Flow toma precio, moneda y stock desde servidor/SQL; el frontend no es autoridad.
- Flow y las tablas de órdenes están restringidos a `CLP`. Mostrar un selector multimoneda sin cambiar el checkout produciría productos no pagables por Flow.
- `track_inventory=false` representa servicios o productos sin stock finito.
- `allow_backorder=true` evita el bloqueo por falta de stock.
- `out_of_stock_behavior=hide_product` participa en los filtros públicos.
- La imagen manual debe coexistir con la carga a Storage.
- La carga actual genera tres variantes WebP (`thumb`, `card`, `detail`) y no conserva una galería.
- Las políticas RLS de productos dependen del rol admin en `public.user_roles`.
- Las rutas públicas y privadas existentes no deben cambiar en la fase UX.

### 1.6 Observación Supabase vigente

Si una fase futura crea nuevas tablas, no se debe asumir que estarán expuestas automáticamente a Data API. Supabase inició en 2026 el cambio hacia exposición explícita mediante grants para nuevos proyectos/configuraciones. Toda tabla nueva debe revisar en conjunto grants, exposición y RLS; son capas distintas.

Referencia: [Supabase — Tables not exposed to Data and GraphQL API automatically](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## 2. Diagnóstico del formulario actual

### 2.1 Por qué genera demasiado scroll

- Los 24 campos persistidos editables y los controles de upload están en una sola columna narrativa.
- Inventario aparece entre identidad y descripciones, rompiendo el flujo conceptual.
- Precio, orden y moneda comparten una fila aunque pertenecen a dominios distintos.
- Categoría y disponibilidad comparten una fila, pero una organiza y la otra afecta compra/stock.
- Multimedia combina URL, upload, métricas de optimización, advertencias y preview.
- Pago externo aparece después de multimedia sin una agrupación de checkout.
- Visibilidad está al final; el administrador no ve rápidamente si publicará o no.
- Los botones solo aparecen al final.
- El componente mezcla presentación, reglas, upload, normalización y envío.

### 2.2 Agrupación propuesta

| Sección | Campos iniciales |
|---|---|
| General | `name`, `short_description`, `description` |
| Inventario | `availability`, `track_inventory`, `stock_quantity`, `low_stock_threshold`, `allow_backorder`, `out_of_stock_behavior` |
| Precios y pago | `price`, `currency`, `payment_url`, `payment_button_label` |
| Multimedia | `image_url`, upload, preview y estado de variantes |
| Organización y visibilidad | `category`, `display_order`, `is_active` |
| SEO básico | `slug` y preview derivada no persistente |

Las URLs de variantes son datos técnicos producidos por el upload. Deben conservarse en el estado y payload, pero no exponerse como campos de edición manual.

### 2.3 Campos obligatorios y dependencias

- Obligatorios en la UI: `name`, `slug`, `price`, `currency`.
- Siempre presentes por defaults/modelo: booleanos de estado/inventario, `availability`, `stock_quantity`, `low_stock_threshold`, `out_of_stock_behavior`, `display_order`.
- `stock_quantity`, umbral, backorder y conducta de agotado solo son operativamente relevantes si `track_inventory=true`.
- `out_of_stock_behavior` solo cambia el catálogo cuando se controla inventario, no se permite backorder y el stock llega a cero.
- `availability=out_of_stock` bloquea compra incluso si el stock numérico es positivo.
- `is_active=false` excluye el producto de superficies públicas.
- `payment_button_label` solo tiene efecto si existe `payment_url`.
- Al introducir una URL manual se limpian las tres variantes optimizadas. Esta conducta debe mantenerse.
- No se puede guardar durante un upload ni mientras exista un error de upload.
- En creación, el slug se deriva del nombre solo mientras el usuario no haya definido uno.

### 2.4 Riesgos al dividirlo

- Perder estado al desmontar una sección.
- Ocultar un error en una sección no activa.
- Habilitar guardado durante un upload que quedó fuera de vista.
- Cambiar involuntariamente la transformación de vacío a `null`.
- Dejar fuera del payload una variante de imagen.
- Duplicar estado entre el layout y cada sección.
- Revalidar solo la sección visible y permitir un payload inválido.
- Reutilizar `Tabs` como simple decoración sin semántica ni teclado.
- Confundir disponibilidad manual, stock físico y stock disponible tras reservas.

La mitigación es un único estado/controlador de formulario, validación global al guardar, mapa campo→sección y estado de upload centralizado.

## 3. Análisis de la carpeta Stitch

| Archivo / vista | Elementos útiles | Elementos dudosos | Elementos descartables | Posible adaptación |
|---|---|---|---|---|
| `editar_producto_optimizado` | Rail lateral, cards por dominio, resumen de visibilidad/precio, barra fija de acciones, alta densidad | Tags, descuento, modos Public/Draft/Private, editor enriquecido, autosave | Marca Nexus, versión, buscador global, logs, datos ficticios, SKU inventado | Usar la estructura compacta y una navegación local; mantener controles reales del proyecto |
| `editar_producto_inventario` | Agrupación de stock, umbral, backorder y conducta al agotarse | Métricas de rotación/optimización | Historial y analítica ficticios, usuarios y movimientos de ejemplo | Reutilizar solo la card de configuración; añadir ayuda basada en reglas reales |
| `editar_producto_precios` | Agrupación de moneda/precio, formato numérico, resumen de valor | Descuento, tax toggle, precio final calculado | Benchmarking, Amazon/eBay/Walmart, historial ficticio y exportación | Mostrar precio y moneda reales; fijar/explicar CLP mientras Flow sea el checkout activo |
| `editar_producto_media` | Zona de carga, URL externa, preview, feedback de límites | Alt text y selección masiva sin modelo actual | Galería falsa, límite 8/20, nombres y acciones no conectadas | Conservar upload y URL manual; mostrar una sola imagen lógica y sus variantes técnicas |
| `editar_producto_env_o` | Agrupación clara de atributos y reglas logísticas | Peso/dimensiones/clase/envío gratis sin requerimiento actual | Tarifas DHL/FedEx/UPS, API activa, destino e impuestos ficticios | Mantener la sección fuera del editor hasta tener modelo y checkout logístico |
| `editar_producto_seo` | Slug, contadores, preview de buscador | Score SEO e indexación sin fuente real | IA, competencia, volumen, OpenGraph “configurado” y métricas falsas | Mover el slug aquí y preparar preview derivada; persistencia SEO solo con backend |
| `cyber_efficient_admin/DESIGN.md` | Azul profundo, cyan restringido, Inter/Space Grotesk, capas tonales, foco visible, densidad 8/16/24 | Sidebar global fijo de 240 px y radio técnico de 4 px | Copiar tokens completos o sustituir la identidad existente | Integrar la densidad y jerarquía en los tokens Orbynex ya existentes |

### 3.1 Criterio visual

El diseño Stitch es compatible conceptualmente con la identidad actual: el proyecto ya usa Inter, Space Grotesk, fondo azul profundo y acento cyan. No conviene importar su paleta ni su shell completo. La adaptación debe:

- usar los tokens CSS actuales;
- mantener magenta como acento secundario restringido;
- utilizar cards de 12–16 px de radio, coherentes con Orbynex, en lugar de copiar todos los radios de 4 px;
- evitar glassmorphism intensivo, gráficos falsos y efectos decorativos;
- concentrar el rasgo visual distintivo en el rail de secciones con estado, errores y progreso;
- mantener formularios alineados a la izquierda en móvil: centrar inputs o labels perjudicaría lectura y edición.

## 4. Mapeo completo de campos

### 4.1 Campos persistidos y runtime actuales

| Campo actual | Origen actual | Sección propuesta | Backend soporta | Frontend soporta | Acción recomendada | Riesgo |
|---|---|---|---|---|---|---|
| `id` | DB UUID | No editable | Sí | Lectura | Mantener fuera del formulario | Bajo |
| `name` | `products` | General | Sí | Sí | Mantener y mejorar contador/errores | Bajo |
| `slug` | `products` | SEO básico | Sí, único | Sí | Mover sin cambiar slugify | Medio |
| `short_description` | `products` | General | Sí | Sí | Mantener | Bajo |
| `description` | `products` | General | Sí | Sí | Mantener textarea simple | Bajo |
| `price` | `products` | Precios y pago | Sí | Sí | Mantener; formato visual según locale | Alto por checkout |
| `currency` | `products` | Precios y pago | Parcial: producto acepta texto; Flow solo CLP | Sí | Configurar como opción controlada/solo lectura con Flow | Alto |
| `category` | `products` | Organización y visibilidad | Sí | Sí, texto libre | Mantener; no hardcodear categorías | Bajo |
| `image_url` | `products` | Multimedia | Sí | Sí | Mantener como fallback y URL manual | Alto |
| `image_url_thumb` | `products` | Multimedia, técnico | Sí | Sí | Preservar oculto; mostrar estado, no input manual | Alto |
| `image_url_card` | `products` | Multimedia, técnico | Sí | Sí | Preservar oculto; mostrar estado, no input manual | Alto |
| `image_url_detail` | `products` | Multimedia, técnico | Sí | Sí | Preservar oculto; mostrar estado, no input manual | Alto |
| `is_active` | `products` | Organización y visibilidad | Sí, RLS/public queries | Sí | Mantener con resumen visible | Alto |
| `availability` | `products` | Inventario | Sí como texto; lógica server/UI | Sí, enum UI | Mantener; documentar interacción con stock | Alto |
| `stock_quantity` | `products` | Inventario | Sí, constraint/RPC | Sí | Mantener | Crítico |
| `track_inventory` | `products` | Inventario | Sí, RPC/checkout | Sí | Mantener | Crítico |
| `allow_backorder` | `products` | Inventario | Sí, RPC/checkout | Sí | Mantener | Crítico |
| `low_stock_threshold` | `products` | Inventario | Sí | Sí | Mantener | Medio |
| `out_of_stock_behavior` | `products` | Inventario | Sí, constraint/filtros | Sí | Mantener | Alto |
| `payment_url` | `products` | Precios y pago | Sí | Sí | Mantener como camino de pago protegido | Alto |
| `payment_button_label` | `products` | Precios y pago | Sí | Sí | Mostrar condicionalmente con `payment_url` | Medio |
| `display_order` | `products` | Organización y visibilidad | Sí | Sí | Mantener | Bajo |
| `created_at` | DB/trigger default | Resumen, solo lectura | Sí | Lectura | No editar; opcional en metadata | Bajo |
| `updated_at` | trigger | Resumen, solo lectura | Sí | Lectura | Usar como “última actualización” real | Bajo |
| `available_quantity` | API, derivado de reservas | Inventario, solo lectura futuro | Sí, derivado | Sí en superficies públicas | No enviarlo en `ProductInput` | Alto |
| `temporarily_reserved` | API, derivado | Inventario, solo lectura futuro | Sí, derivado | Sí en superficies públicas | No enviarlo en `ProductInput` | Alto |

### 4.2 Contrato de escritura recomendado

Crear un tipo explícito `ProductEditorValues` o equivalente, derivado del esquema de edición y no de `Omit<Product, ...>`. Debe incluir los 18 campos editables por el usuario y las tres URLs técnicas preservadas. `id`, timestamps y propiedades runtime deben quedar fuera.

No se debe cambiar el contrato Supabase durante la fase UX. La mejora consiste en expresar el contrato existente con precisión y en conservar exactamente el payload actual.

## 5. Clasificación de funcionalidades

| Funcionalidad | Existe en proyecto | Existe en Stitch | Estado frontend/backend | Recomendación | Fase |
|---|---:|---:|---|---|---|
| Stock disponible | Sí | Sí | Ya soportada | Reorganizar | 1 |
| Stock bajo | Sí | Sí | Ya soportada; helper y badge admin | Mostrar contexto dentro de Inventario | 2 |
| Umbral de stock bajo | Sí | Sí | Ya soportada | Reorganizar | 1 |
| Producto agotado | Sí | Sí | Ya soportada | Mantener semántica | 1 |
| Ocultar sin stock | Sí | Sí | Ya soportada end-to-end | Mantener | 1 |
| Visible sin permitir compra | Sí | Sí | Ya soportada mediante `show_sold_out` | Etiquetar con lenguaje claro | 1 |
| Venta sin stock | Sí | Sí | Ya soportada mediante backorder | Mantener | 1 |
| Disponibilidad manual | Sí | Parcial | Ya soportada | Explicar precedencia | 1 |
| Visibilidad activo/inactivo | Sí | Sí | Ya soportada | Reorganizar | 1 |
| Draft/private/link-only | No | Sí | Falta modelo, rutas y autorización | No preparar controles visibles | 4/futura |
| Precio base | Sí | Sí | Ya soportada | Reorganizar | 1 |
| Moneda | Sí | Sí | Parcial: campo libre, Flow solo CLP | Restringir por configuración real | 2 |
| Precio oferta/descuento | No | Sí | Falta modelo y reglas checkout | No preparar UI visible | 4 |
| Impuestos por producto | No | Sí | Totales de orden existen, hoy quedan en 0 | Requiere reglas fiscales/backend | 4 |
| Precio final calculado | No | Sí | Falta semántica de descuento/impuesto | Solo cuando existan reglas | 4 |
| Formato visual de precio | Sí en storefront | Sí | Falta aplicarlo al editor | Reutilizar locale/config | 2 |
| Imagen principal | Sí | Sí | Ya soportada | Reorganizar | 1 |
| Preview | Sí | Sí | Ya soportada | Mantener | 1 |
| Upload | Sí | Sí | Ya soportada con Storage/RLS | Mantener | 1 |
| Variantes optimizadas | Sí | No de forma equivalente | Ya soportada | Mostrar estado técnico compacto | 2 |
| URL manual | Sí | Sí | Ya soportada | Mantener como primera clase | 1 |
| Cambiar imagen | Sí | Sí | Ya soportada | Mantener | 1 |
| Eliminar referencia | Parcial | Sí | Puede vaciarse; no limpia objetos Storage | Falta servicio/estrategia de limpieza | 4 |
| Galería | No | Sí | Falta modelo y servicios | Futura, no simular | 4 |
| Ordenar galería | No | Sí | Falta modelo | Futura | 4 |
| Alt text por imagen | No | Sí | Falta modelo | Añadir con galería/asset model | 4 |
| Validación tipo/peso | Sí | Sí | Ya soportada | Mantener mensajes reales | 1 |
| Slug | Sí | Sí | Ya soportada | Mover a SEO básico | 1 |
| Meta título | No | Sí | Falta modelo y consumo en ruta | Requiere backend/modelo | 4 |
| Meta descripción | No | Sí | Falta modelo y consumo en ruta | Requiere backend/modelo | 4 |
| Preview SEO | No | Sí | Viable solo frontend derivando datos actuales | Preparar sin prometer persistencia | 3 |
| Keywords/score/IA SEO | No | Sí | No existe | Futura/no recomendable ahora | 5 |
| Indexación/OpenGraph por producto | No | Sí | Falta head dinámico y campos | Requiere implementación completa | 4 |
| Peso/dimensiones | No | Sí | Falta modelo | Solo si la plantilla venderá físicos | 4 |
| Costo/clase/envío gratis | No | Sí | `shipping_total` existe en orden, sin cálculo | Requiere backend y checkout | 4 |
| Retiro/envío | No | No claro | Falta modelo y flujo | Futura según negocio | 4/5 |
| Tarifas DHL/FedEx/UPS | No | Sí | Falta integración completa | Riesgo alto; no recomendable ahora | 5 |
| Categoría | Sí | Sí | Ya soportada como texto | Mantener configurable | 1 |
| Etiquetas | No | Sí | Falta modelo | Futura | 4 |
| Colección | No | No claro | Falta modelo | Futura si hay caso real | 4 |
| Destacado | No como campo; home usa orden/límite | No claro | Falta modelo | No inferir; evaluar separado | 4 |
| Orden | Sí | No claro | Ya soportada | Reorganizar | 1 |
| SKU | No | Sí en decoración | Falta modelo | No mostrar valor falso | 4 |
| Autosave | No | Sí | Falta estrategia de concurrencia/versiones | Riesgo alto, fase futura | 5 |
| Cambios pendientes | No | Sí | Viable solo frontend | Implementar indicador local | 1 |
| Historial/auditoría | Solo timestamps | Sí | Falta modelo de eventos | Futura | 5 |
| Analytics de inventario/precio | No | Sí | Falta modelo/eventos | No recomendable ahora | 5 |
| Benchmark competencia | No | Sí | Falta datos/APIs y valor general | No recomendable para plantilla base | 5 |
| Buscador global/notificaciones | No en editor | Sí | Fuera de alcance | No implementar | — |

## 6. Propuesta de arquitectura UI

### 6.1 Layout general

No se debe reemplazar el layout administrativo global. El editor ocupará el `Container` existente y añadirá un layout interno:

```text
Desktop
┌──────────────────────────────────────────────────────────────┐
│ Título, estado real y última actualización                  │
├───────────────┬──────────────────────────────────────────────┤
│ Rail sticky   │ Panel de la sección activa                  │
│ General       │                                              │
│ Inventario    │ Uno o dos cards compactos                   │
│ Precios       │                                              │
│ Multimedia    │                                              │
│ Organización  │                                              │
│ SEO           │                                              │
├───────────────┴──────────────────────────────────────────────┤
│ Cambios sin guardar             Cancelar  Guardar cambios   │
└──────────────────────────────────────────────────────────────┘
```

```text
Mobile
┌──────────────────────────────┐
│ Título + estado              │
│ [Sección: Inventario     ▾]  │
├──────────────────────────────┤
│ Panel activo                 │
│ Inputs a una columna         │
├──────────────────────────────┤
│ Cancelar      Guardar        │
└──────────────────────────────┘
```

### 6.2 Navegación

- Desktop: rail local sticky, no sidebar global nueva.
- Tablet: rail más estrecho con icono y texto.
- Móvil: `Select` de sección o tabs horizontales con scroll; se recomienda `Select` por legibilidad y espacio.
- Estado activo visible por fondo, borde izquierdo cyan y texto.
- Secciones con errores muestran icono, texto accesible y contador; no depender solo del color.
- Navegación por teclado completa.
- No cambiar la URL por sección en la primera fase. Un query param puede evaluarse después si existe necesidad real de enlaces profundos.

### 6.3 Cards compactas

- Máximo dos cards funcionales por sección.
- Separación interna 8/16/24 px.
- Labels sobre inputs.
- Descripciones solo donde aclaren una regla real.
- Campos dependientes se ocultan o deshabilitan sin borrar sus valores.
- No incluir métricas, gráficos o estados sin una fuente real.

### 6.4 Barra fija de acciones

- Sticky al fondo del viewport dentro del editor.
- `Cancelar` conserva el comportamiento de volver al listado, pero pide confirmación si hay cambios.
- `Guardar` valida todo el formulario.
- Durante upload o submit, guardar queda deshabilitado con estado textual.
- Indicador “Cambios sin guardar” derivado por comparación normalizada contra el snapshot inicial.
- No implementar autosave.

### 6.5 Errores

- Mantener errores junto al campo.
- Mantener un mapa `campo -> sección`.
- Al fallar el submit:
  1. contar errores por sección;
  2. marcar el rail;
  3. abrir la primera sección inválida;
  4. enfocar el primer campo inválido;
  5. anunciar el resumen mediante región `aria-live`.

### 6.6 Responsive y accesibilidad

- Inputs, textareas y selects a una columna en móvil.
- Tap targets mínimos de 44 px.
- Barra sticky debe respetar safe areas y no tapar el último campo.
- Labels alineados a la izquierda; no aplicar centrado ornamental a formularios.
- Focus visible con tokens existentes.
- `aria-describedby` para error y ayuda.
- Switches con label clickeable y estado comprensible.
- Respetar `prefers-reduced-motion`.
- Evitar sidebars fixed que creen scroll horizontal.

## 7. Propuesta de componentes

Ubicación sugerida: `src/components/admin/product-editor/`.

| Componente/módulo | Responsabilidad | Props/entradas | No debe contener |
|---|---|---|---|
| `ProductEditor` | Orquestar estado, validación, sección activa, dirty state, upload y submit | `initial`, `submitLabel`, `onSubmit`, `onCancel` | CRUD Supabase directo |
| `ProductEditorLayout` | Grid responsive del editor | `navigation`, `content`, `actions`, metadata | Reglas de negocio |
| `ProductEditorNav` | Navegar y mostrar errores por sección | `sections`, `activeSection`, `errorCountBySection`, `onChange` | Estado duplicado de campos |
| `ProductEditorSection` | Card/heading/description común | `id`, `title`, `description`, `children` | Validación o persistencia |
| `ProductEditorActionsBar` | Guardar/cancelar/dirty/uploading/submitting | flags y callbacks | Mutaciones Supabase |
| `ProductGeneralSection` | Nombre y descripciones | estado/controlador + errores | Upload o inventario |
| `ProductInventorySection` | Campos y ayudas de inventario | estado/controlador + errores | Cálculos autoritativos de reservas |
| `ProductPricingSection` | Precio, moneda y pago externo | estado/controlador + config + errores | Precios/totales inventados |
| `ProductMediaSection` | URL, upload, resultado y preview | estado/controlador + upload state | CRUD de producto |
| `ProductOrganizationSection` | Categoría, orden y activo | estado/controlador + errores | Categorías hardcodeadas |
| `ProductSeoSection` | Slug y preview derivada | estado/controlador + marca/config | Promesas de SEO no persistido |
| `product-editor.schema.ts` | Esquema Zod y tipo explícito de escritura | configuración/constantes necesarias | JSX |
| `product-editor.mappers.ts` | Defaults, normalización y payload | `Product`, `ProductEditorValues` | Estado React |
| `product-editor.config.ts` | Secciones, labels, opciones y flags | configuración tipada | Acceso a DB |
| `useProductImageUpload.ts` | Pipeline ya existente, estado y mensajes | callback de actualización | Renderizado de sección |

### 7.1 Estrategia de estado

Para minimizar riesgo en fase 1, conservar un único estado controlado y extraerlo a un hook propio. No es obligatorio migrar simultáneamente a `react-hook-form`. Aunque la dependencia ya existe, cambiar motor de formulario y layout en el mismo corte aumenta la superficie de regresión.

Si después del refactor aparecen problemas reales de rendimiento, registro de campos o validación, se podrá evaluar `react-hook-form` en una tarea separada con pruebas de paridad.

### 7.2 Límite de abstracción

No construir un “form renderer” genérico basado completamente en metadata. Las secciones tienen reglas distintas y deben ser componentes explícitos. La metadata central debe resolver navegación, labels/opciones estables, feature flags y mapeo de errores; no reemplazar todo el JSX.

## 8. Configuración centralizada

### 8.1 Nueva configuración propuesta

`src/config/product-editor.config.ts`:

- identificadores y orden de secciones;
- labels y descripciones;
- iconos ya disponibles;
- opciones de `availability`;
- opciones de `out_of_stock_behavior`;
- estrategia de moneda soportada;
- feature flags:
  - `seoPreview`;
  - `shipping`;
  - `gallery`;
  - `discounts`;
  - `advancedVisibility`;
- límites de caracteres mostrados por la UI;
- mapa campo→sección.

### 8.2 Fuentes de verdad

- Moneda y locale: `brandConfig`/`commerceConfig`.
- Capacidades de checkout: `commerceConfig`.
- Límites reales de imagen: exports de `storage.service.ts`, no copias numéricas.
- Validación: esquema Zod central del editor.
- Valores de inventario: tipos/constantes compartidos; los constraints SQL siguen siendo la autoridad.
- Categorías: mantener entrada libre en fase 1. No hardcodear categorías de Stitch. Si se necesita selector, alimentar opciones desde datos reales/config del proyecto y permitir valor existente.

### 8.3 Textos

No introducir una librería i18n solo para este cambio. Centralizar textos reutilizados por el editor en configuración tipada cuando se usen en más de una superficie. Los mensajes específicos de un campo pueden permanecer junto al esquema o componente.

### 8.4 Moneda

Mientras Flow siga activo:

- `CLP` debe ser la única opción habilitada por defecto;
- la UI puede mostrar la moneda como valor configurado, no como texto fijo;
- habilitar otras monedas requiere una capacidad explícita por checkout/provider;
- no copiar el selector USD/EUR/GBP de Stitch.

## 9. Plan por fases

### Prerrequisitos de ejecución

Antes de cualquier implementación:

1. Confirmar un working tree controlado y preservar cambios ajenos.
2. Capturar payloads reales de crear/editar para paridad.
3. Verificar los 24 campos persistidos y los dos campos runtime.
4. Regenerar o auditar tipos Supabase sin cambiar schema.
5. Definir criterios de aceptación por fase.
6. No tocar Flow, WhatsApp, `payment_url`, RLS ni reservas en la fase UX.

### Fase 1: Refactor UX sin romper backend

**Estado de ejecución:** implementada y revisada el 2026-07-09.

Objetivo: reducir scroll y deuda del componente sin cambiar modelo ni contratos.

- Extraer esquema, tipo de escritura, defaults y normalización.
- Crear layout, navegación, sección base y barra de acciones.
- Dividir los campos actuales en las seis secciones propuestas.
- Mantener un único estado y un único submit.
- Implementar mapa de errores por sección y foco al primer error.
- Implementar indicador local de cambios pendientes.
- Mantener upload, URL manual, variantes y preview sin alterar su pipeline.
- Mantener crear y editar en las rutas actuales.
- Mantener todos los valores por defecto.
- Adaptar desktop/tablet/mobile con componentes existentes.
- No añadir dependencias.

Salida esperada: misma capacidad funcional, menor scroll, estructura mantenible y payload equivalente.

### Fase 2: Integración con funcionalidades ya soportadas

**Estado de ejecución:** implementada y revisada el 2026-07-09.

Objetivo: aprovechar mejor capacidades reales sin ampliar el modelo.

- Mostrar stock bajo con las reglas existentes.
- Aclarar la precedencia entre disponibilidad manual, stock, backorder y ocultamiento.
- Mostrar un resumen compacto de variantes generadas y fallback legacy.
- Reutilizar locale para el preview/formato de precio.
- Controlar moneda según capacidades reales de checkout.
- Mostrar `updated_at` como última actualización real.
- Eliminar del tipo de escritura los campos runtime.
- Verificar/regenerar tipos Supabase.

No mostrar stock “disponible” descontando reservas en admin sin una fuente admin explícita y segura. Si se solicita, debe diseñarse un endpoint/consulta de solo lectura separado.

### Fase 3: Frontend preparado para futuras funciones

**Estado de ejecución:** no iniciada. No avanzar sin nueva autorización.

Objetivo: dejar puntos de extensión sin controles falsos en producción.

- Mantener registro de secciones con feature flags.
- Añadir preview SEO derivada de `name`, `slug` y `short_description`, rotulada como vista previa.
- Preparar interfaces de sección para `shipping`, `gallery` y `advancedPricing`, deshabilitadas por configuración y no visibles.
- Preparar metadata de capacidades por proyecto derivado.
- Añadir contadores de longitud para campos actuales.

No guardar datos futuros en `localStorage`, objetos JSON opacos ni campos existentes reutilizados.

### Fase 4: Cambios backend/modelo, solo con requisito aprobado

Cada bloque debe ser una migración y entrega separada:

1. **SEO real**
   - `meta_title`, `meta_description`, controles de indexación y OpenGraph definidos.
   - Head dinámico de `/producto/$slug`.
   - Defaults de fallback y límites.

2. **Galería**
   - Tabla `product_images` con `product_id`, URL/path, alt, orden, rol principal y timestamps.
   - RLS/grants/Storage coherentes.
   - Estrategia de eliminación y archivos huérfanos.

3. **Precios avanzados**
   - Definir si se almacena precio oferta o descuento.
   - Fechas, impuestos, redondeo y autoridad de cálculo.
   - Integrar RPC de orden y Flow antes de habilitar UI.

4. **Envío**
   - Definir productos físicos, peso/dimensiones/unidades.
   - Métodos, retiro, zonas, tarifas e impuestos.
   - Calcular `shipping_total` server-side.

5. **Organización avanzada**
   - Categorías normalizadas, tags, colecciones o destacado solo si hay caso real.

6. **Semántica de estados**
   - Constraint/enum para `availability`.
   - SKU o modos Draft/Private solo con reglas públicas y admin definidas.

Toda tabla nueva debe revisar exposición Data API, `GRANT`, RLS, índices y tipos generados. Toda lógica de precio/stock/envío que afecte cobro debe permanecer server-side.

### Fase 5: Mejoras futuras

- Autosave con control de versión y conflictos.
- Historial de cambios/auditoría por usuario.
- Historial y movimientos de stock.
- Analítica de inventario y precios basada en eventos reales.
- Integraciones logísticas.
- Benchmarking externo.
- Ayuda de IA.
- Buscador global y notificaciones administrativas.

Prioridad baja para la plantilla base. No usar datos simulados en producción.

### Orden seguro

1. Fase 1 completa y validada.
2. Fase 2 en cortes pequeños.
3. Fase 3 solo después de estabilizar el editor.
4. Elegir bloques independientes de Fase 4 según necesidad comercial.
5. Fase 5 únicamente con métricas y requisitos.

Cada fase debe pasar build, lint dirigido, pruebas manuales y revisión de regresiones antes de iniciar la siguiente.

## 10. Riesgos técnicos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Pérdida de campos al dividir | Crítica | Matriz de 24 campos, payload snapshot y validación de paridad |
| Alterar stock/checkout | Crítica | No tocar RPC, API ni lógica Flow en fase 1 |
| Moneda incompatible con Flow | Alta | Capacidad configurable; CLP habilitado por defecto |
| Error oculto en otra sección | Alta | Mapa campo→sección, badges, navegación y foco |
| Perder upload al cambiar sección | Alta | Estado de upload en controlador común |
| Sobrescribir variantes con URL manual | Alta | Mantener exactamente la limpieza actual y advertir |
| Objetos Storage huérfanos | Media/Alta | No prometer eliminación hasta tener path/servicio |
| Estados contradictorios | Alta | Ayudas y resumen; constraint futuro para `availability` |
| Duplicación de estado | Alta | Único controlador; secciones controladas |
| Componentes gigantes | Media | Separación por dominio y módulos puros |
| Abstracción excesiva | Media | Componentes explícitos; metadata limitada |
| Regresión crear vs. editar | Alta | Ejecutar matriz en ambas rutas |
| Cancelación accidental | Media | Confirmar solo si dirty |
| Barra sticky tapa contenido | Media | Espaciado inferior y pruebas móvil/safe area |
| UI falsa de funciones futuras | Alta | Feature flags off; no renderizar controles sin soporte |
| RLS/grants incorrectos en tablas futuras | Crítica | Auditoría Supabase por bloque, advisors/lint y pruebas por rol |
| Tipos Supabase desactualizados | Alta | Regeneración/verificación antes de ampliar modelo |
| Hardcodeo de categorías/monedas/estados | Alta | Config tipada y fuentes de verdad existentes |
| Meta SEO sin consumo público | Media | No persistir hasta integrar la ruta de producto |
| Autosave sobrescribe cambios | Alta | Posponer hasta tener versionado/conflictos |

## 11. Checklist de pruebas

### 11.1 Paridad de datos

- [ ] Cargar un producto existente con todos los campos.
- [ ] Cargar un producto legacy sin variantes de imagen.
- [ ] Cargar un producto sin descripciones, categoría, imagen ni pago externo.
- [ ] Confirmar que los 24 campos persistidos se conservan sin edición.
- [ ] Confirmar que `available_quantity` y `temporarily_reserved` no se envían.
- [ ] Comparar payload anterior y nuevo para valores equivalentes.
- [ ] Confirmar `null` frente a string vacío en campos opcionales.

### 11.2 General y SEO básico

- [ ] Editar nombre.
- [ ] Verificar autogeneración de slug solo en producto nuevo y slug vacío.
- [ ] Verificar normalización de acentos y caracteres.
- [ ] Validar slug duplicado y mostrar error comprensible.
- [ ] Editar descripción corta y completa.
- [ ] Validar máximos.
- [ ] Verificar preview SEO derivada si Fase 3 está activa.

### 11.3 Inventario

- [ ] Producto sin control de inventario.
- [ ] Producto con stock positivo.
- [ ] Stock cero y mostrar agotado.
- [ ] Stock cero y ocultar.
- [ ] Venta sin stock.
- [ ] Umbral igual, menor y mayor que stock.
- [ ] `availability=out_of_stock` con stock positivo.
- [ ] Confirmar reglas en home, catálogo, detalle, carrito y checkout.
- [ ] Confirmar que las reservas siguen descontando disponibilidad.

### 11.4 Precio y pago

- [ ] Precio cero y precio positivo.
- [ ] Rechazar precio negativo.
- [ ] Mostrar formato según locale.
- [ ] Confirmar que Flow no permite una moneda incompatible.
- [ ] Guardar y eliminar `payment_url`.
- [ ] Verificar fallback `payment_url`.
- [ ] Verificar label con y sin URL.
- [ ] Confirmar WhatsApp sin regresiones.

### 11.5 Multimedia

- [ ] Mantener imagen existente sin editar.
- [ ] Introducir URL manual válida.
- [ ] Rechazar URL inválida.
- [ ] Subir JPG, PNG y WebP.
- [ ] Rechazar tipo no permitido.
- [ ] Rechazar original sobre el límite.
- [ ] Ver fases optimizando/subiendo.
- [ ] Bloquear guardado durante upload.
- [ ] Verificar `thumb`, `card` y `detail`.
- [ ] Verificar fallback legacy.
- [ ] Cambiar de sección durante upload sin perder estado.
- [ ] Verificar miniatura admin, card, detalle, carrito y checkout.

### 11.6 Organización y visibilidad

- [ ] Editar categoría sin opciones hardcodeadas.
- [ ] Editar orden.
- [ ] Activar e inactivar.
- [ ] Confirmar que inactivo no aparece públicamente.
- [ ] Confirmar que el listado admin mantiene acceso.

### 11.7 Navegación, errores y acciones

- [ ] Navegar por todas las secciones sin pérdida de datos.
- [ ] Guardar desde cualquier sección.
- [ ] Error en sección no activa abre y enfoca el campo.
- [ ] Badges de error son legibles sin depender del color.
- [ ] Cancelar sin cambios.
- [ ] Cancelar con cambios y confirmar/descartar.
- [ ] Doble submit bloqueado.
- [ ] Toast de éxito/error consistente.
- [ ] Dirty state vuelve a limpio tras guardar.

### 11.8 Responsive y accesibilidad

- [ ] 375 px móvil.
- [ ] 768 px tablet.
- [ ] 1280 px desktop.
- [ ] Sin scroll horizontal.
- [ ] Barra sticky no tapa campos.
- [ ] Navegación con teclado.
- [ ] Focus visible.
- [ ] Labels asociados.
- [ ] Errores anunciados.
- [ ] Tap targets adecuados.
- [ ] Contraste AA práctico.
- [ ] Reduced motion.

### 11.9 Reutilización y calidad

- [ ] No hay marcas, SKU, categorías ni proveedores Stitch visibles.
- [ ] No hay datos falsos.
- [ ] Moneda/locale vienen de config.
- [ ] Opciones vienen de config tipada.
- [ ] No se añadieron dependencias.
- [ ] No se modificó Flow, WhatsApp, RLS ni reservas en Fase 1.
- [ ] `npm run build`.
- [ ] ESLint dirigido sobre archivos tocados.
- [ ] `supabase db lint --local` cuando haya cambios SQL.
- [ ] Revisión visual autenticada de `/admin/new` y `/admin/edit/$id`.

## 12. Recomendación final

### Adaptar ahora

- Navegación interna y un solo panel visible.
- Rail local desktop y selector móvil.
- Cards compactas.
- Barra persistente de acciones.
- Errores por sección.
- Cambios pendientes sin autosave.
- División del componente manteniendo estado, validación y payload.
- Las seis secciones propuestas, con `SEO básico` limitado al slug.

### Dejar preparado

- Registro configurable de secciones.
- Preview SEO derivada y claramente no persistente.
- Feature flags apagados para galería, envío, descuentos y visibilidad avanzada.
- Tipo de escritura explícito separado del modelo de lectura.

### Dejar para backend/modelo

- Galería y alt text.
- SEO persistente y head dinámico.
- Descuentos, impuestos y precio final.
- Envío y tarifas.
- Tags, colecciones, destacado, SKU y estados avanzados.
- Historial, auditoría y autosave versionado.

### No conviene tocar ahora

- RPC de reservas/captura.
- Contratos Flow.
- Checkout WhatsApp.
- Fallback `payment_url`.
- RLS y roles.
- Arquitectura TanStack Start.
- Shell administrativo global.
- Integraciones DHL/FedEx/UPS, IA, benchmarking o analytics.

El orden más seguro es entregar primero paridad funcional con mejor UX, validar todas las superficies dependientes y solo después activar capacidades ya soportadas que necesiten presentación adicional. Cualquier función que cambie precio, stock, visibilidad pública o logística debe tratarse como una entrega backend completa, no como un control aislado de frontend.
