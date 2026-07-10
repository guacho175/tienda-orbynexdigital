# Plan separacion inventario y movimientos de stock

**Estado:** cerrado, listo para ejecutar  
**Objetivo:** separar la configuracion de inventario del producto de los movimientos operativos de stock, manteniendo intactos checkout, Flow, reservas, auditoria y funcionalidades publicas existentes.

## 1. Problema actual

La seccion `Inventario` del editor mezcla dos acciones distintas:

- Configurar reglas del producto: disponibilidad, control de inventario, backorder, umbral bajo y comportamiento al agotarse.
- Ejecutar movimientos de stock: ajustes manuales que modifican stock inmediatamente y registran historial.

Esto genera confusion porque el admin ve `Stock disponible` arriba y `Inventario manual` abajo, pero ambos pueden afectar el mismo campo `stock_quantity` por caminos distintos.

## 2. Decision de producto

La plantilla debe tener un flujo claro para negocios reutilizables:

- Al crear un producto, se puede definir su stock inicial y reglas de inventario.
- Al editar un producto, la seccion `Inventario` debe enfocarse en reglas y estado.
- Los cambios operativos de stock deben vivir en una seccion separada llamada `Movimientos de stock`.
- Las ventas por checkout interno Flow no se rebajan manualmente, porque el sistema ya las descuenta cuando corresponde.
- Las ventas hechas por `payment_url` externo deben poder registrarse manualmente como salida de stock, porque ocurren fuera del sistema.

## 3. Alcance permitido

- Reorganizar el editor admin de producto.
- Agregar una seccion nueva al menu interno del editor.
- Renombrar y ajustar el panel `ProductStockAdjustmentPanel`.
- Hacer mas claros los textos y acciones del panel.
- Mantener el registro en `stock_movements`.
- Mantener la funcion existente `adjust_product_stock_admin` si alcanza para el nuevo flujo.
- Ajustar documentacion relacionada si cambia el flujo admin.

## 4. Fuera de alcance

- No modificar checkout Flow.
- No modificar reservas de stock.
- No modificar confirmacion de pagos.
- No modificar endpoints publicos.
- No modificar RLS ni migraciones salvo que sea estrictamente necesario.
- No cambiar el comportamiento publico de catalogo, carrito o detalle de producto.
- No implementar automatizacion para `payment_url` externo.
- No eliminar historial de movimientos existente.

## 5. Fase 1 - Separar navegacion del editor

### Objetivo

Crear una seccion explicita `Movimientos de stock` en el editor de producto.

### Cambios

- Agregar nueva seccion en `PRODUCT_EDITOR_SECTIONS`.
- Definir icono, titulo y descripcion breve.
- Mantener `Inventario` como seccion de reglas.
- Mostrar `Movimientos de stock` solo al editar productos existentes.
- No mostrar `Movimientos de stock` en `Nuevo producto`, porque todavia no existe `product.id`.

### Resultado esperado

El menu del editor muestra:

- General
- Inventario
- Movimientos de stock
- Precios y pago
- Multimedia
- Organizacion
- SEO basico

## 6. Fase 2 - Limpiar la seccion Inventario

### Objetivo

Dejar `Inventario` como configuracion del producto, no como panel de operaciones.

### Cambios

- Quitar `ProductStockAdjustmentPanel` de `ProductInventorySection`.
- Mantener:
  - Disponibilidad comercial.
  - Controlar inventario.
  - Stock inicial o stock registrado.
  - Umbral de pocas unidades.
  - Permitir venta sin stock.
  - Cuando no haya stock.
  - Estado resultante.
- Ajustar textos para aclarar que los cambios se aplican al guardar el producto.

### Resultado esperado

La seccion `Inventario` ya no muestra dos formas de ajustar stock en la misma pantalla.

## 7. Fase 3 - Crear seccion Movimientos de stock

### Objetivo

Convertir el panel actual de inventario manual en una pantalla operativa clara.

### Cambios

- Crear componente `ProductStockMovementsSection`.
- Mover ahi el panel de ajustes.
- Renombrar visualmente `Inventario manual` a `Movimientos de stock`.
- Mostrar tarjetas:
  - Stock actual.
  - Movimiento.
  - Stock resultante.
- Mantener historial de ultimos movimientos.

### Tipos de movimiento visibles

- `Entrada de stock`: suma unidades.
- `Venta externa`: resta unidades para compras hechas por `payment_url` u otro canal fuera del checkout interno.
- `Correccion`: suma o resta unidades por ajuste administrativo.
- `Devolucion`: suma unidades si corresponde reponer stock.

### Resultado esperado

El admin entiende que esta seccion sirve para registrar entradas, salidas y correcciones con historial.

## 8. Fase 4 - Aclarar flujo de boton de pago externo

### Objetivo

Hacer explicito que `payment_url` externo no descuenta stock automaticamente.

### Cambios

- En `Movimientos de stock`, agregar texto breve:
  - Las ventas del checkout interno se descuentan automaticamente al confirmarse el pago.
  - Las ventas por link externo deben registrarse como `Venta externa`.
- Si el producto tiene `payment_url`, destacar la opcion `Venta externa`.
- Si el producto no tiene `payment_url`, mantener la opcion disponible de todos modos para ventas por otros canales.

### Resultado esperado

La plantilla queda preparada para negocios que usan checkout interno y tambien links de pago externos.

## 9. Fase 5 - Ajustar reglas de edicion de stock

### Objetivo

Evitar confusion entre stock inicial y movimientos posteriores.

### Cambios

- En productos nuevos:
  - Permitir ingresar stock inicial dentro de `Inventario`.
- En productos existentes:
  - Mantener visible el stock registrado.
  - Evaluar si el campo debe quedar editable o transformarse en lectura con enlace a `Movimientos de stock`.
- Recomendacion de implementacion:
  - Producto nuevo: `Stock inicial` editable.
  - Producto existente: `Stock registrado` de solo lectura y mensaje `Para sumar, rebajar o corregir unidades usa Movimientos de stock`.

### Resultado esperado

El stock operativo se modifica desde una sola seccion despues de creado el producto.

## 10. Fase 6 - Validacion funcional

### Objetivo

Confirmar que la reorganizacion no rompe flujos existentes.

### Verificaciones

- Crear producto nuevo con control de inventario y stock inicial.
- Editar producto existente sin tocar stock.
- Registrar entrada de stock.
- Registrar venta externa y verificar rebaja.
- Intentar rebaja mayor al stock disponible y confirmar que se bloquea.
- Confirmar que `stock_movements` registra historial.
- Confirmar que el listado admin refleja el stock actualizado.
- Confirmar que detalle publico, carrito y checkout siguen respetando disponibilidad.
- Confirmar que Flow interno sigue descontando por su flujo actual.

## 11. Archivos probables

- `src/config/product-editor.config.ts`
- `src/components/admin/ProductForm.tsx`
- `src/components/admin/ProductStockAdjustmentPanel.tsx`
- `src/components/admin/product-editor/ProductInventorySection.tsx`
- `src/components/admin/product-editor/ProductStockMovementsSection.tsx`
- `src/components/admin/product-editor/product-editor.types.ts`
- `src/routes/_authenticated/admin.edit.$id.tsx`
- `docs/INVENTARIO-PRODUCTOS.md`

## 12. Criterios de aceptacion

- `Inventario` no contiene el bloque de movimientos manuales.
- Existe seccion separada `Movimientos de stock`.
- En nuevo producto se puede definir stock inicial.
- En producto existente, las salidas y entradas se hacen desde `Movimientos de stock`.
- La opcion `Venta externa` queda clara para compras hechas fuera del checkout interno.
- Los movimientos siguen quedando registrados en `stock_movements`.
- No se modifica la logica de checkout Flow.
- No se modifica la logica de reservas.
- No se rompe catalogo, carrito ni detalle publico.

## 13. Comandos de verificacion

```bash
npx prettier --write src/components/admin/ProductForm.tsx src/components/admin/ProductStockAdjustmentPanel.tsx src/components/admin/product-editor/ProductInventorySection.tsx src/config/product-editor.config.ts
npx tsc --noEmit --pretty false
npm run build
```

Si se crea un archivo nuevo, incluirlo tambien en el comando de formato.

