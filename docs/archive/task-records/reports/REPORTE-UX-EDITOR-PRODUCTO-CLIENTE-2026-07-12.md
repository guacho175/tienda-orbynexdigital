# Reporte UX editor de producto para cliente

Fecha: 2026-07-12

## Archivos modificados

- `src/config/product-editor.config.ts`
- `src/components/admin/product-editor/ProductPricingSection.tsx`
- `src/components/admin/product-editor/ProductInventorySection.tsx`
- `src/components/admin/product-editor/ProductSeoSection.tsx`
- `src/components/admin/product-editor/product-editor.schema.ts`
- `src/components/admin/product-editor/product-editor.mappers.ts`
- `src/routes/_authenticated/admin.new.tsx`
- `src/routes/_authenticated/admin.edit.$id.tsx`
- `src/services/product-error-messages.ts`
- `docs/plans/PLAN-UX-EDITOR-PRODUCTO-CLIENTE-2026-07-12.md`

## Cambios realizados

- Se centralizaron textos visibles, ayudas y advertencias del editor en `product-editor.config.ts` para mantener el proyecto escalable como plantilla.
- Se agrego el estado interno `payment_external_enabled` al editor sin cambiar la tabla `products`.
- El campo de URL externa ahora solo aparece cuando se activa `Usar enlace de pago externo`.
- Al desactivar pago externo, el mapper envia `payment_url` y `payment_button_label` como `null`.
- Si se activa pago externo, la URL pasa a ser requerida por validacion del editor.
- Se agrego una advertencia clara: el pago externo es para compra individual; carritos con varios articulos deben usar el checkout normal.
- Inventario ahora explica el resultado en la tienda con textos orientados a cliente final.
- SEO mantiene los mismos campos internos, pero muestra etiquetas mas entendibles: direccion del producto, titulo para Google/redes, imagen para compartir, descripcion para Google/redes y ocultar de buscadores.
- Se agrego `getProductSaveErrorMessage` para traducir errores tecnicos de Supabase/Postgres como `23505` o `products_slug_key` a una alerta clara.

## Criterios responsivos aplicados

- Se mantuvieron tarjetas, labels, inputs, selects y switches con la estructura responsive existente.
- Los nuevos bloques usan `space-y`, `grid`, `flex-col` y `sm:` ya presentes en el editor.
- La advertencia de pago externo usa una tarjeta simple y de ancho completo para evitar cortes en mobile.
- No se agregaron dependencias ni assets nuevos.

## Verificacion

- `npm run lint`: aprobado con 0 errores. Quedan 7 advertencias preexistentes de Fast Refresh en componentes UI compartidos.
- `npm run build`: aprobado.
- Servidor local iniciado en `http://127.0.0.1:5173/` para revision.
- Revision visual completa de `/admin/new`: limitada porque el navegador interno no tenia sesion autenticada y Chrome no estuvo disponible para el conector de esta sesion.
- Se cerro el tab de prueba y se detuvo el servidor local al terminar.

## Riesgos encontrados

- No se pudo confirmar visualmente la pantalla autenticada completa desde navegador por falta de sesion accesible.
- El cambio de pago externo ahora exige URL si se activa; esto evita guardar una opcion activada sin efecto, pero puede requerir explicar el error si el usuario activa el switch por accidente.
- El helper de errores cubre `23505`, `products_slug_key` y texto de duplicado con slug. Otros errores desconocidos siguen mostrando el mensaje original.

## Trabajo pendiente recomendado

- Hacer una pasada visual manual en una sesion autenticada real de Chrome o habilitar el conector de Chrome.
- Probar manualmente crear un producto duplicado contra Supabase para confirmar el toast final en entorno con credenciales activas.
- Considerar una confirmacion adicional al apagar pago externo en productos existentes si se quiere prevenir borrado accidental de URLs guardadas.
