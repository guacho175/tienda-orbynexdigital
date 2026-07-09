# Plan técnico: productos similares en el detalle

> Estado: implementado y validado localmente el 2026-07-09.

## 1. Objetivo

Incorporar una sección reutilizable de **Productos similares** en todas las rutas
`/producto/$slug`, tomando como referencia visual `DESIGN (1).md`,
`code (1).html` y `screen (1).png`, sin alterar checkout, Flow, WhatsApp,
inventario, RLS ni la navegación actual.

La sección debe:

- excluir siempre el producto que se está viendo;
- priorizar productos públicos de la misma categoría;
- completar los espacios con productos de otras categorías cuando no haya
  suficientes coincidencias;
- no renderizarse cuando no exista otro producto público elegible;
- comenzar a funcionar automáticamente cuando la tienda tenga al menos dos
  productos públicos elegibles;
- respetar disponibilidad, orden editorial e imágenes optimizadas;
- evitar consultas repetidas y cargas completas del catálogo;
- quedar configurable y reutilizable como parte de la plantilla.

## 2. Evidencia del estado actual

- El detalle se implementa en `src/routes/producto.$slug.tsx` y hoy solo consulta
  el producto actual.
- La lectura pública está centralizada en
  `src/services/products.service.ts`.
- Las consultas públicas ya comparten:
  - filtro `is_active = true`;
  - reglas de visibilidad de inventario;
  - selección reducida `PRODUCT_CARD_SELECT` para tarjetas;
  - enriquecimiento de disponibilidad mediante
    `/api/products/availability`;
  - `PRODUCTS_STALE_TIME_MS = 5 minutos`.
- `ProductCard` ya resuelve imágenes `card`, fallback legado, precio,
  disponibilidad, navegación, carrito y mensajes.
- React Query ya está instalado y el `QueryClient` vive durante la navegación
  de la aplicación.
- La base de datos ya posee un índice sobre `products.category` y otro sobre
  `display_order`; no se justifica una migración para esta funcionalidad.
- Hay una modificación local ajena en
  `.github/workflows/expire-stock-reservations.yml`; debe preservarse y quedar
  fuera de este cambio.

## 3. Reglas funcionales cerradas

### 3.1 Selección

1. Consultar como máximo la cantidad configurada de productos de la misma
   categoría, excluyendo el `id` actual.
2. Si faltan elementos, consultar únicamente los espacios restantes entre los
   demás productos públicos, excluyendo:
   - el producto actual;
   - los productos ya seleccionados.
3. Ordenar ambos grupos por `display_order` ascendente y usar `id` como segundo
   criterio estable si fuera necesario.
4. Concatenar primero coincidencias de categoría y después fallback.
5. No duplicar productos.
6. No renderizar título, controles ni espacio vertical si el resultado queda
   vacío.

Esta regla cubre los casos mínimos:

| Productos públicos elegibles | Resultado |
| --- | --- |
| 1, incluido el actual | sección oculta |
| 2, misma categoría | muestra el otro producto |
| 2, categorías distintas | muestra el otro producto como fallback |
| 3 o más | prioriza categoría y completa con fallback |

`category = null` o vacía no se tratará como una categoría común: se irá
directamente al fallback global.

### 3.2 Elegibilidad pública

La consulta reutilizará exactamente las reglas públicas vigentes:

- producto activo;
- producto visible según inventario;
- productos `show_sold_out` pueden aparecer con el estado Agotado, igual que en
  el catálogo;
- nunca se modificará la lógica de compra de `ProductCard`.

## 4. Arquitectura propuesta

### 4.1 Configuración central

Agregar en `src/config/commerce.config.ts` una sección tipada
`relatedProducts`, con valores editables para:

- `enabled`;
- `limit`;
- `sameCategoryFirst`;
- `fallbackAcrossCategories`;
- `staleTimeMs`;
- `gcTimeMs`;
- textos visibles: eyebrow, título y etiquetas accesibles de navegación.

Ningún límite, texto, tiempo de caché o comportamiento de fallback debe quedar
disperso en la ruta o en el componente.

### 4.2 Capa de datos

Extender `src/services/products.service.ts` con una función pública dedicada,
por ejemplo:

```ts
fetchRelatedProducts({
  currentProductId,
  category,
  limit,
}): Promise<ProductCardData[]>
```

La función debe:

- reutilizar `PRODUCT_CARD_SELECT` y `PUBLIC_INVENTORY_FILTER`;
- pedir solo columnas de tarjeta, nunca `select("*")`;
- usar consultas con `limit`, no descargar todo el catálogo;
- excluir el producto actual desde Supabase;
- ejecutar la consulta fallback solo cuando sea necesaria;
- mantener toda la priorización y deduplicación fuera de la vista;
- aplicar disponibilidad una sola vez al conjunto final, evitando llamadas de
  disponibilidad por cada tarjeta.

No se creará RPC, Edge Function ni endpoint adicional en esta primera
implementación: el volumen consultado es pequeño y el servicio actual ya
resuelve de forma segura la lectura pública. Si una medición futura demuestra
un catálogo muy grande o una latencia relevante, se evaluará un RPC estable con
orden condicional.

### 4.3 Caché y ciclo de vida

Crear una fábrica central de opciones de consulta, por ejemplo en el servicio
o en un módulo `src/queries/products.queries.ts`, con una clave estable:

```ts
["products", "related", currentProductId, normalizedCategory, limit]
```

La configuración debe:

- usar `staleTime` y `gcTime` desde `commerceConfig.relatedProducts`;
- desactivar la consulta cuando la función esté deshabilitada o falte el
  producto actual;
- evitar `refetchOnMount: "always"` para recomendaciones todavía frescas;
- conservar datos previos durante cambios de clave si mejora la navegación sin
  mostrar recomendaciones del producto equivocado;
- compartir la respuesta al volver a un detalle ya visitado;
- permitir invalidación futura con el prefijo `["products"]` después de cambios
  administrativos.

No se añadirá caché manual en `localStorage`, `sessionStorage` ni variables
globales. React Query ya proporciona deduplicación, memoria limitada,
recolección por `gcTime` e invalidación coherente.

### 4.4 Componente visual reutilizable

Crear `src/components/product/RelatedProducts.tsx` para aislar presentación,
scroll y estados.

Características:

- reutilizar `ProductCard`; no duplicar carrito, precio, imágenes ni reglas de
  inventario;
- encabezado con eyebrow y título inspirado en la referencia;
- grilla normal cuando todos los elementos caben;
- carrusel horizontal ligero con CSS `scroll-snap` en pantallas estrechas;
- flechas con `lucide-react`, sin dependencias nuevas;
- flechas ocultas o deshabilitadas cuando no haya desplazamiento posible;
- imágenes `variant="card"`, `loading="lazy"` y `sizes` heredados de
  `ProductCard`;
- controles de al menos 44 px, foco visible, etiquetas `aria-label` y soporte
  de teclado;
- respetar `prefers-reduced-motion`;
- no crear un carrusel automático.

La sección conservará el sistema visual actual de la tienda: fondo técnico,
superficies existentes, cyan como acento principal, magenta restringido y
jerarquía responsive. La referencia guía composición y ritmo, pero no se
copiarán fuentes remotas, Material Symbols, imágenes externas ni Tailwind CDN.

### 4.5 Integración en la ruta

En `src/routes/producto.$slug.tsx`:

- reutilizar la constante central de caché también para el producto principal;
- ejecutar recomendaciones solo después de disponer de `product.id` y
  `product.category`;
- montar `RelatedProducts` después del bloque de detalle;
- añadir skeletons estables únicamente durante la primera carga;
- ocultar completamente la sección en error o resultado vacío, sin afectar el
  detalle principal;
- mantener intactos agregar al carrito, WhatsApp, `payment_url`, disponibilidad
  y enlaces actuales.

Un fallo de recomendaciones será no bloqueante: el producto principal seguirá
visible y comprable.

## 5. Archivos previstos

### Modificar

- `src/config/commerce.config.ts`
- `src/services/products.service.ts`
- `src/routes/producto.$slug.tsx`

### Crear

- `src/components/product/RelatedProducts.tsx`
- opcionalmente `src/queries/products.queries.ts` si las opciones de React Query
  no quedan cohesionadas dentro del servicio

### No modificar

- `api/flow/*`
- `src/server/flow/*`
- checkout y carrito salvo reutilización indirecta de `ProductCard`
- WhatsApp y `payment_url`
- migraciones, RLS y tablas Supabase
- `src/routes/_authenticated/route.tsx`
- `.github/workflows/expire-stock-reservations.yml`

## 6. Secuencia de implementación

1. Añadir configuración tipada de recomendaciones.
2. Implementar y tipar `fetchRelatedProducts`.
3. Centralizar opciones y clave de React Query.
4. Construir `RelatedProducts` con estado vacío, skeleton y scroll accesible.
5. Integrar la consulta no bloqueante en el detalle.
6. Revisar responsive y alineación con la referencia.
7. Ejecutar validación técnica y visual.
8. Actualizar `docs/technical/09-frontend-components.md`,
   `docs/technical/04-use-cases.md`, `docs/ESTADO-ACTUAL-TEMPLATE.md` y
   `docs/INDEX.md` cuando la implementación quede aprobada y terminada.

## 7. Validación obligatoria

### Automatizada

- `npm run build`
- ESLint dirigido a los archivos tocados; ejecutar lint global y separar ruido
  preexistente si lo hubiera.
- TypeScript queda validado por el build.

### Datos y red

- confirmar que no se solicita `select("*")` para recomendaciones;
- confirmar máximo de dos consultas acotadas: categoría y fallback;
- confirmar que el fallback no se ejecuta cuando la categoría llena el límite;
- confirmar una sola llamada de disponibilidad para el resultado final;
- navegar detalle A → detalle B → detalle A y comprobar reutilización de caché;
- comprobar que una segunda renderización con la misma clave no dispara
  solicitudes duplicadas dentro de `staleTime`.

### Casos funcionales

- tienda con un solo producto;
- dos productos en la misma categoría;
- dos productos en categorías distintas;
- categoría con un único producto y catálogo con más productos;
- producto sin categoría;
- productos agotados visibles;
- producto oculto por regla de inventario;
- producto actual nunca repetido;
- error de recomendaciones sin romper el detalle;
- agregar al carrito desde una tarjeta relacionada.

### Visual y accesibilidad

- 375 px, 768 px y 1280 px;
- sin desbordamiento horizontal de página;
- tarjetas completas y scroll con `snap` en móvil;
- flechas correctas en escritorio y móvil;
- navegación por teclado y foco visible;
- lectura correcta de etiquetas por tecnologías de asistencia;
- imágenes inferiores al primer viewport cargadas de forma diferida;
- verificación final en la URL local y luego en el despliegue de Vercel.

## 8. Criterios de aceptación

- Todos los detalles de producto pueden mostrar recomendaciones sin datos
  hardcodeados.
- Con un solo producto elegible la sección no existe visualmente.
- Desde dos productos elegibles siempre puede mostrarse al menos uno,
  independientemente de la categoría.
- La misma categoría tiene prioridad y el fallback completa sin duplicados.
- Límites, textos, caché y comportamiento son configurables desde un punto
  central.
- No se descarga el catálogo completo ni se añaden dependencias.
- El detalle sigue funcionando si la consulta secundaria falla.
- Build y revisión responsive pasan.
- Flow, WhatsApp, inventario, RLS, `payment_url` y cambios locales ajenos
  permanecen intactos.

## 9. Riesgos y mitigaciones

- **Categorías con diferencias de mayúsculas o espacios:** normalizar para la
  clave de caché y documentar que el dato administrativo debe mantener una
  taxonomía consistente; no alterar categorías almacenadas en esta tarea.
- **Dos viajes de red en fallback:** el segundo solo ocurre si faltan
  coincidencias y consulta únicamente los espacios restantes.
- **Disponibilidad dinámica frente a caché:** conservar la ventana actual corta
  y la validación de stock al agregar/avanzar; las recomendaciones no serán la
  fuente de verdad del checkout.
- **Caché fragmentada por variantes de categoría:** usar categoría normalizada
  en la clave.
- **Carrusel innecesariamente complejo:** usar desplazamiento nativo y CSS,
  sin autoplay ni librería adicional.
