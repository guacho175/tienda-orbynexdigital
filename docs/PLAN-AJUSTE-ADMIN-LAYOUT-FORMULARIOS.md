# Plan ajuste admin layout y formularios

**Estado:** activo, listo para ejecutar  
**Objetivo:** aplicar la propuesta visual aprobada sin romper el flujo admin existente.

## 1. Problemas a corregir

- Los botones `Analitica` y `Auditoria` aparecen como acciones superiores en catalogo.
- Falta un menu lateral admin persistente con fondo azul/oscuro.
- En la vista admin, el usuario debe ver el catalogo en el area principal y el menu al lado.
- El formulario/editor sigue demasiado azul.
- El menu interno de secciones debe ser blanco, con solo la seccion activa en azul.
- `Inventario manual` aparece como bloque debajo del editor y se repite visualmente.
- `Inventario manual` debe mostrarse solo dentro de la seccion `Inventario`.

## 2. Resultado esperado

### Layout admin general

- Sidebar izquierdo admin persistente:
  - Catalogo
  - Analitica
  - Auditoria
  - Productos
  - Salir
- Fondo del sidebar azul/oscuro.
- Opcion activa con acento cyan/azul.
- Area principal independiente para cada vista.
- En `/admin`, el area principal muestra catalogo, buscador y tabla/listado.
- En `/admin/analytics`, el area principal muestra analitica.
- En `/admin/audit`, el area principal muestra auditoria.

### Editor de producto

- Fondo principal claro.
- Header del editor claro/blanco.
- Paneles/formularios blancos o gris muy claro.
- Menu interno de secciones:
  - fondo blanco;
  - texto neutral;
  - solo la seccion activa en azul;
  - separadores suaves.
- `Inventario manual` integrado dentro de la seccion `Inventario`.
- No renderizar `Inventario manual` debajo de todas las secciones.
- No duplicar `Inventario manual` cuando se esta en seccion Inventario.

## 3. Archivos probables

- `src/routes/_authenticated/admin.index.tsx`
- `src/routes/_authenticated/admin.analytics.tsx`
- `src/routes/_authenticated/admin.audit.tsx`
- `src/routes/_authenticated/admin.edit.$id.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/components/admin/ProductStockAdjustmentPanel.tsx`
- `src/components/admin/product-editor/ProductEditorLayout.tsx`
- `src/components/admin/product-editor/ProductEditorNav.tsx`
- `src/components/admin/product-editor/ProductInventorySection.tsx`
- nuevo componente probable:
  - `src/components/admin/AdminShell.tsx`

## 4. Orden de ejecucion

1. Crear `AdminShell` con sidebar admin persistente.
2. Usar `AdminShell` en catalogo, analitica, auditoria y editor.
3. Quitar botones superiores `Analitica` y `Auditoria` de `/admin`.
4. Mantener `Nuevo producto`, `Ver sitio` y `Salir` donde corresponda, sin duplicar navegacion.
5. Cambiar el fondo del area admin/editor a claro.
6. Ajustar tarjetas y formularios del editor a fondo blanco.
7. Mover `ProductStockAdjustmentPanel` para que se renderice solo dentro de `ProductInventorySection` o solo cuando `activeSection === "inventory"`.
8. Confirmar que no existe segundo bloque de inventario manual debajo del editor.
9. Ajustar menu de secciones del editor para que el activo sea azul y el resto neutral.
10. Validar en desktop y mobile.

## 5. Restricciones

- No tocar Flow.
- No tocar checkout.
- No tocar RPCs ni migraciones.
- No tocar RLS.
- No cambiar comportamiento de guardado.
- No implementar autosave.
- No cambiar logica de inventario, solo ubicacion y presentacion del panel.

## 6. Validacion

- `npx prettier --write` dirigido.
- `npx tsc --noEmit --pretty false`.
- `npx eslint` dirigido a archivos tocados.
- `npm run build`.
- Verificacion visual en:
  - `/admin`
  - `/admin/analytics`
  - `/admin/audit`
  - `/admin/edit/$id`
- Confirmar:
  - sidebar visible en vistas admin;
  - catalogo visible junto a sidebar;
  - analitica/auditoria no aparecen como botones superiores del catalogo;
  - formularios claros;
  - menu de secciones blanco con activo azul;
  - inventario manual aparece una sola vez y solo en Inventario.
