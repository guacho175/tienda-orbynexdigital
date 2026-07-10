# Reporte de ejecución del editor compacto — Fases 1 y 2

**Fecha:** 2026-07-09  
**Plan de origen:** [`PLAN-MAESTRO-EDITOR-PRODUCTO-COMPACTO.md`](./PLAN-MAESTRO-EDITOR-PRODUCTO-COMPACTO.md)  
**Estado:** Fases 1 y 2 implementadas; Fase 3 detenida a la espera de revisión y autorización  
**Commit:** no realizado

## 1. Resultado

El formulario monolítico fue reemplazado internamente por un editor compacto de una sola ruta y un solo estado, organizado en:

1. General.
2. Inventario.
3. Precios y pago.
4. Multimedia.
5. Organización.
6. SEO básico.

En desktop usa un rail local sticky; en móvil usa un selector de sección. Solo se renderiza el panel activo, pero todos los valores, errores, upload y submit viven en `useProductEditor`, por lo que navegar no pierde datos.

No se modificaron:

- `api/flow/*`;
- `src/server/flow/*`;
- checkout Flow;
- checkout WhatsApp;
- `payment_url`;
- RLS, Auth, roles o migraciones;
- reservas/captura/liberación de stock;
- eliminación de productos;
- `src/routes/_authenticated/route.tsx`.

## 2. Fase 1 ejecutada

### Arquitectura

- `ProductForm` conserva su API pública para no modificar las rutas de alta y edición.
- Estado, validación, upload, dirty state y submit se concentran en `useProductEditor`.
- Esquema, mappers y tipos quedaron fuera del JSX.
- El formulario se dividió en componentes por dominio.
- La configuración de secciones, opciones y mapeo de errores quedó centralizada.

### UX

- Navegación interna por seis secciones.
- Rail sticky en desktop.
- Selector Radix en móvil.
- Barra de acciones sticky.
- Indicador de cambios pendientes.
- Confirmación antes de cancelar con cambios.
- Errores junto al campo, resumen global, contador por sección y foco al primer error.
- Estado de upload compartido entre secciones.
- Edición bloqueada solo durante submit; mientras se procesa una imagen se puede seguir editando otras secciones, pero no guardar ni reemplazar la imagen.

### Paridad preservada

- Mismos defaults.
- Mismo slugify.
- Misma conversión de strings opcionales vacíos a `null`.
- Mismo upload nativo de variantes.
- URL manual sigue limpiando las variantes técnicas.
- `payment_url` y su label siguen en el payload.
- Crear y editar siguen usando `createProduct`/`updateProduct`.

## 3. Fase 2 ejecutada

- Estado resultante de inventario:
  - sin control de stock;
  - disponible;
  - pocas unidades;
  - venta sin stock;
  - agotado visible;
  - agotado oculto;
  - agotado manualmente.
- Explicación de precedencia entre `availability`, inventario, backorder y conducta al agotarse.
- Resumen de variantes `thumb`, `card` y `detail`.
- Advertencia de imagen legacy.
- Precio formateado con `commerceConfig.locale`.
- Moneda limitada a las capacidades configuradas del checkout.
- Productos heredados con moneda no compatible pueden verla y cambiarla a una soportada; no pueden guardar sin corregirla.
- `updated_at` se muestra como última actualización real.
- `ProductInput` ahora es un `Pick` explícito de campos escribibles. Ya no puede incluir `id`, timestamps, `available_quantity` ni `temporarily_reserved`.
- Tipos Supabase inspeccionados: `description` y los campos actuales ya estaban presentes en `Row`, `Insert` y `Update`; no fue necesario regenerarlos ni modificarlos.

## 4. Archivos de código

### Modificados

- `src/components/admin/ProductForm.tsx`
- `src/services/products.service.ts`
- `eslint.config.js`

### Creados

- `src/components/admin/product-editor/ProductEditorActionsBar.tsx`
- `src/components/admin/product-editor/ProductEditorLayout.tsx`
- `src/components/admin/product-editor/ProductEditorNav.tsx`
- `src/components/admin/product-editor/ProductEditorSection.tsx`
- `src/components/admin/product-editor/ProductGeneralSection.tsx`
- `src/components/admin/product-editor/ProductInventorySection.tsx`
- `src/components/admin/product-editor/ProductMediaSection.tsx`
- `src/components/admin/product-editor/ProductOrganizationSection.tsx`
- `src/components/admin/product-editor/ProductPricingSection.tsx`
- `src/components/admin/product-editor/ProductSeoSection.tsx`
- `src/components/admin/product-editor/product-editor.mappers.ts`
- `src/components/admin/product-editor/product-editor.schema.ts`
- `src/components/admin/product-editor/product-editor.types.ts`
- `src/components/admin/product-editor/useProductEditor.ts`
- `src/config/product-editor.config.ts`

## 5. Problemas encontrados y correcciones

### 5.1 Errores obsoletos al actualizar valores derivados

**Problema:** si el submit marcaba un slug vacío y luego el nombre autogeneraba el slug, el error de la sección SEO podía quedar visible. El mismo caso existía al reemplazar una URL inválida mediante upload exitoso.

**Corrección:** al generar el slug se limpia su error; al completar upload se limpian los errores de URL/upload.

**Estado:** corregido.

### 5.2 Moneda heredada incompatible sin vía de corrección

**Problema:** la primera implementación mostraba la moneda como `readOnly`. Un producto heredado en moneda no soportada habría quedado visible, pero sin forma de cambiarlo.

**Corrección:** se usa un selector con la moneda heredada marcada como no compatible y las opciones reales configuradas. El esquema bloquea guardar hasta elegir una soportada.

**Estado:** corregido.

### 5.3 Errores en campos condicionales o técnicos sin control visible

**Problema:** el error de moneda no estaba asociado visualmente al selector; un label de pago inválido podía quedar oculto al borrar su URL; y una URL técnica de variante inválida no tenía mensaje visible.

**Corrección:** asociar el error de moneda al selector, volver a mostrar el label si conserva un error y añadir una instrucción reparable para variantes inválidas.

**Estado:** corregido.

### 5.4 Lint global bloqueado por output generado

**Problema:** `npm run lint` excedió dos minutos porque ESLint recorría `.vercel/output` generado por el build.

**Decisión/corrección fuera del plan:** agregar `.vercel` a los ignores de `eslint.config.js`.

**Resultado:** el lint global volvió a terminar normalmente.

### 5.5 Deuda global CRLF/Prettier

**Problema:** después de excluir `.vercel`, el lint global reportó 4.943 problemas: 4.936 errores y 7 warnings. La salida está dominada por `Delete ␍` en archivos preexistentes y no tocados.

**Decisión:** no ejecutar `eslint --fix` ni reformatear todo el repositorio porque produciría un diff masivo fuera del plan.

**Mitigación:** ESLint dirigido sobre todos los archivos tocados pasa sin errores.

**Estado:** deuda previa pendiente; no bloquea estas fases.

### 5.6 Verificación administrativa bloqueada por autenticación

**Problema:** `/admin/new` redirige correctamente a `/auth`, pero la sesión local disponible no tiene un usuario admin autenticado.

**Decisión:** no crear usuarios, cambiar roles ni modificar el guard para sortear la autenticación.

**Mitigación:** build SSR/client exitoso, TypeScript, ESLint dirigido y comprobación del redirect. Queda pendiente una pasada visual autenticada de alta y edición.

**Estado:** pendiente de verificación manual autenticada antes de Fase 3.

### 5.7 Fallo de snapshot del navegador

**Problema:** el snapshot accesible del navegador falló por una incompatibilidad interna (`incrementalAriaSnapshot` no disponible).

**Decisión:** usar screenshots y evaluaciones DOM de solo lectura, manteniendo el mismo navegador.

**Estado:** mitigado; no es un fallo de la aplicación.

### 5.8 Hydration mismatch observado en Auth

**Problema:** el navegador registró un hydration mismatch al pasar por la ruta `/auth`; el trace apunta a `AuthPage`/`Container`, no al editor.

**Decisión:** no corregirlo dentro de estas fases porque requiere diagnóstico separado y los archivos implicados no forman parte del cambio aprobado.

**Estado:** deuda previa a diagnosticar.

### 5.9 Avisos de entorno

- `VERCEL_OIDC_TOKEN` local expirado durante `vite dev`: no bloqueó la aplicación local.
- Vite avisa que `vite-tsconfig-paths` puede reemplazarse por soporte nativo: no se modificó `vite.config.ts` por estar fuera del alcance.
- La primera comprobación compuesta terminó con código 1 porque el `rg` final no encontró rutas protegidas modificadas; `tsc` se repitió de forma aislada y pasó.
- `.gitignore` ya contenía un cambio del usuario para Stitch antes de esta ejecución; se preservó sin modificarlo ni atribuirlo a estas fases.

## 6. Decisiones tomadas fuera o al borde del plan

| Decisión | Motivo | Impacto |
|---|---|---|
| Mantener el nombre/API `ProductForm` | Evitar cambios en rutas existentes | Reduce riesgo de regresión |
| No migrar a `react-hook-form` | Cambiar motor y layout a la vez aumentaba superficie | Se conserva estado controlado, ahora encapsulado |
| Permitir editar otras secciones durante upload | El upload puede tardar; solo guardar/reemplazar imagen debe bloquearse | Mejor UX sin cambiar payload |
| Corregir ignore `.vercel` de ESLint | El build hacía inviable el lint global | Cambio de tooling, sin runtime |
| Forzar moneda compatible en schema | Flow valida CLP server-side | Evita guardar configuración no pagable |
| No regenerar tipos Supabase | La inspección confirmó que estaban alineados y no hubo schema changes | Evita diff generado innecesario |
| No sortear Auth para QA | Proteger seguridad y RLS | QA visual admin pendiente |
| No mostrar stock descontando reservas | No existe fuente admin dedicada aprobada | Se respeta el plan y trust boundary |

## 7. Revisión React

- Componentes con export nombrado.
- Una responsabilidad principal por archivo.
- Props locales; tipos compartidos solo donde se reutilizan.
- Hooks sin llamadas condicionales.
- No se agregó estado sincronizado mediante efectos.
- `beforeunload` tiene cleanup.
- Estado servidor permanece en TanStack Query, fuera del editor.
- Navegación semántica, labels asociados, focus visible y errores anunciados.
- No se añadieron dependencias.
- No se encontraron findings P0/P1 en los archivos tocados.

## 8. Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| Prettier dirigido | Pasa |
| ESLint dirigido | Pasa |
| `npx tsc --noEmit --pretty false` | Pasa |
| `npm run build` | Pasa |
| Lint global | Falla por deuda CRLF previa: 4.943 problemas |
| Home desktop | Carga, sin overflow horizontal |
| Catálogo 375 px | Carga productos, sin overflow |
| Detalle 375 px | Carga producto, sin overflow |
| Carrito 768 px | Carga, sin overflow |
| Checkout 768 px | Carga, sin overflow |
| Guard `/admin/new` | Redirige a `/auth` sin sesión |
| Editor autenticado | Pendiente |
| Supabase DB lint | No aplica: no hubo cambios SQL |

El build mantuvo separadas las rutas públicas y administrativas. El chunk del editor quedó en aproximadamente 90,30 kB sin comprimir / 28,73 kB gzip; usa dependencias Radix ya instaladas. Conviene vigilarlo si futuras fases agregan galería o SEO avanzado.

## 9. Revisión necesaria antes de Fase 3

1. Iniciar sesión con un usuario admin existente.
2. Probar `/admin/new` y `/admin/edit/$id` en 375, 768 y 1280 px.
3. Crear un producto de prueba con los 18 campos visibles y guardar.
4. Editar producto con imagen legacy.
5. Subir imagen y confirmar tres variantes.
6. Probar errores en secciones no activas.
7. Probar cancelación con dirty state.
8. Confirmar que Flow, WhatsApp y `payment_url` siguen operativos con el producto guardado.
9. Revisar este reporte y autorizar explícitamente Fase 3.

## 10. Conclusión

Fases 1 y 2 están implementadas y pasan las comprobaciones técnicas disponibles. No hay cambios de backend, base de datos ni checkout. La Fase 3 no se inició. El único bloqueo pendiente para cerrar completamente la revisión funcional es disponer de una sesión admin para validar visualmente creación, edición, upload y guardado real.
