# Reporte ajuste admin layout y formularios

**Estado:** ejecutado  
**Fecha:** 2026-07-09

## Archivos modificados

- `src/components/admin/AdminShell.tsx`
- `src/routes/_authenticated/admin.index.tsx`
- `src/routes/_authenticated/admin.analytics.tsx`
- `src/routes/_authenticated/admin.audit.tsx`
- `src/routes/_authenticated/admin.edit.$id.tsx`
- `src/routes/_authenticated/admin.new.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/components/admin/ProductStockAdjustmentPanel.tsx`
- `src/components/admin/product-editor/ProductInventorySection.tsx`
- `src/components/admin/product-editor/ProductEditorSection.tsx`
- `src/components/admin/product-editor/ProductEditorActionsBar.tsx`
- `src/components/admin/product-editor/ProductEditorNav.tsx`

## Cambios realizados

- Se agrego `AdminShell` con sidebar admin lateral oscuro.
- Se movieron `Analitica` y `Auditoria` al menu lateral admin.
- Se quitaron los botones superiores de `Analitica`, `Auditoria` y `Salir` del catalogo.
- Se aplico el shell admin a catalogo, analitica, auditoria, nuevo producto y editar producto.
- El editor usa tono claro con paneles blancos y bordes suaves.
- El menu interno del editor queda blanco, con solo la seccion activa en azul.
- `Inventario manual` se renderiza solo dentro de la seccion `Inventario`.
- Se elimino el render duplicado de `Inventario manual` debajo del formulario de edicion.

## Criterios responsive aplicados

- Sidebar en columna principal en desktop.
- Sidebar apilado arriba en pantallas menores por la grilla responsive del shell.
- Contenido admin mantiene padding adaptable.
- Menu interno del editor conserva selector movil y nav lateral en desktop.
- Acciones inferiores del editor siguen apiladas en mobile y horizontales en desktop.

## Validacion

- `npx prettier --write` en archivos modificados.
- `npx tsc --noEmit --pretty false`.
- `npm run build`.
- Servidor local verificado en `http://127.0.0.1:5175/admin`.
- Busqueda de render confirma que `ProductStockAdjustmentPanel` solo se usa desde `ProductInventorySection`.

## Riesgos y pendientes

- La verificacion visual autenticada debe hacerse en el navegador donde ya exista sesion admin.
- El root global sigue mostrando `Navbar` y `Footer` publicos; no se reestructuro en esta fase para evitar tocar la arquitectura global de rutas.
- Queda pendiente un pase visual manual en mobile real si se quiere cerrar pixel-perfect.
