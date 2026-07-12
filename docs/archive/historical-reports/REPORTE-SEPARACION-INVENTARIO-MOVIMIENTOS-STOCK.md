# Reporte de separacion de inventario y movimientos de stock

**Fecha:** 2026-07-10  
**Estado:** implementado; validacion admin remota pendiente de sesion autenticada

## Resultado

- `Inventario` queda dedicado a disponibilidad, control de inventario, stock inicial o registrado,
  umbral bajo, backorder y comportamiento al agotarse.
- En un producto nuevo, `Stock inicial` permanece editable.
- En un producto existente, `Stock registrado` es de solo lectura y enlaza a `Movimientos de stock`.
- `Movimientos de stock` aparece solo al editar productos existentes.
- El panel operativo permite entrada, venta externa, correccion positiva o negativa y devolucion.
- El panel explica que Flow interno descuenta al confirmar el pago y que las ventas por link externo
  deben registrarse como `Venta externa`.
- El guardado general de un producto existente conserva el stock mas reciente obtenido antes de
  actualizar, evitando que un formulario abierto reponga un valor anterior.

## Decision de persistencia

No se agregaron migraciones ni cambios RLS. La RPC existente
`public.adjust_product_stock_admin(...)` ya realiza bloqueo transaccional, impide stock negativo,
actualiza `products.stock_quantity` e inserta `stock_movements`.

`Entrada de stock` y `Venta externa` se guardan como `manual_adjustment` con una etiqueta normalizada
en `reason`. Esto permite distinguirlas en el historial visible sin ampliar tipos, permisos o
contratos. `Correccion` y `Devolucion` conservan sus tipos existentes.

## Verificaciones realizadas

- Formato dirigido: OK.
- ESLint dirigido a los archivos modificados: OK.
- `npx tsc --noEmit --pretty false`: OK.
- `npm run build`: OK.
- `git diff --check`: OK.
- Servidor local: OK.
- Home, catalogo, detalle de producto, carrito con producto y checkout: OK en navegador local.
- El checkout mostro el resumen y el boton `Pagar online`; no se inicio una transaccion Flow.
- Revision estatica del RPC: confirma insercion en `stock_movements` y bloqueo de stock final negativo.
- Revision de alcance: sin cambios en `api/flow/*`, reservas, confirmacion de pagos, endpoints
  publicos, RLS ni migraciones.

## Validacion no ejecutada contra datos remotos

El navegador local no tenia una sesion admin autenticada y Supabase local no estaba disponible. Por
esa razon no se crearon datos de prueba remotos ni se ejecutaron entradas/ventas externas reales. La
prueba manual pendiente con sesion admin debe cubrir:

1. Crear un producto temporal con inventario y stock inicial.
2. Editarlo y comprobar que el stock registrado es de solo lectura.
3. Registrar una entrada y una venta externa.
4. Intentar una rebaja superior al stock y comprobar el bloqueo.
5. Consultar el historial visible y `public.stock_movements`.
6. Eliminar el producto temporal al finalizar.

## Riesgo tecnico observado

El build actual sigue generando funciones con runtime `nodejs20.x`. No se cambio esta configuracion
por estar fuera del alcance de inventario; conviene planificar su actualizacion de forma separada.

## Criterios responsive y visuales

- La navegacion movil sigue usando un selector y filtra la seccion exclusiva de edicion.
- Los controles operativos se apilan en movil y usan objetivos tactiles de 44 px.
- Las tarjetas de stock pasan de una columna a tres desde `sm`.
- La explicacion Flow/venta externa usa un panel informativo sobrio, sin nuevas dependencias ni
  efectos pesados.
