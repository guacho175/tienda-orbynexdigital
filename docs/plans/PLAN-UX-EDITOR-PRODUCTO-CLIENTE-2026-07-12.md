# Plan UX editor de producto para cliente no tecnico

Fecha: 2026-07-12

Estado: planificado, sin cambios de codigo aplicados.

## Objetivo

Mejorar la comprension del editor de productos para un usuario comun, sin cambiar la logica comercial ni romper inventario, checkout, SEO, Supabase, Flow o auditoria.

## Entendimiento del pedido

1. **Pago alternativo**
   - El campo `URL de pago externo` no debe aparecer siempre.
   - Debe existir una opcion explicita para activar el pago alternativo.
   - Al activar esa opcion, se debe explicar claramente que el link externo sirve para compras individuales del producto y no para un carrito con varios articulos.
   - Si la opcion esta desactivada, el producto debe quedar sin `payment_url` y sin texto de boton externo.

2. **Inventario**
   - La seccion actual funciona, pero mezcla terminos tecnicos y reglas en un orden dificil para cliente final.
   - Hay que mejorar textos, ayudas y estados para que el usuario entienda que pasara en la tienda antes de guardar.
   - No se deben eliminar controles existentes: disponibilidad, control de inventario, stock, umbral, venta sin stock y comportamiento al agotarse deben seguir disponibles.

3. **SEO**
   - La seccion no debe eliminarse.
   - Hay que traducir conceptos tecnicos como `slug`, `Titulo SEO`, `OpenGraph`, `Descripcion SEO` y `No indexar` a lenguaje mas cercano.
   - Debe quedar claro que muchos campos son opcionales y que el sistema usa valores automaticos si se dejan vacios.

4. **Error por producto repetido**
   - Cuando el nombre genera o usa una direccion publica ya existente, Supabase devuelve un error tecnico: `duplicate key value violates unique constraint "products_slug_key"`.
   - Ese mensaje debe traducirse a una alerta entendible, por ejemplo: "Ya existe un producto con esa direccion publica. Cambia el nombre o edita la direccion en SEO."

## Archivos probables

- `src/components/admin/product-editor/ProductPricingSection.tsx`
- `src/components/admin/product-editor/ProductInventorySection.tsx`
- `src/components/admin/product-editor/ProductSeoSection.tsx`
- `src/components/admin/product-editor/product-editor.schema.ts`
- `src/components/admin/product-editor/product-editor.mappers.ts`
- `src/components/admin/product-editor/useProductEditor.ts`
- `src/routes/_authenticated/admin.new.tsx`
- `src/routes/_authenticated/admin.edit.$id.tsx`
- `src/services/products.service.ts`
- `src/config/product-editor.config.ts`

## Reglas de escalabilidad y plantilla

Este proyecto se usara como plantilla futura, por lo que la implementacion debe evitar soluciones rigidas o atadas solo al caso actual de Orbynex.

### Principios obligatorios

- No hardcodear textos de negocio repetidos dentro de varios componentes si pueden vivir en una configuracion del editor.
- Centralizar labels, ayudas, advertencias y mensajes reutilizables en `src/config/product-editor.config.ts` o en un helper especifico del editor cuando corresponda.
- Mantener separados los nombres internos de campos (`payment_url`, `slug`, `seo_noindex`, etc.) de los textos visibles para usuario final.
- No cambiar el contrato de datos de `products`, Supabase, Flow ni carrito salvo que exista una razon tecnica documentada.
- No introducir migraciones de base de datos para un cambio que es principalmente de UX y copy.
- No acoplar el comportamiento a un solo producto, categoria, moneda, URL, cliente o nombre de marca.
- Usar helpers reutilizables para traducir errores tecnicos a mensajes humanos, en vez de repetir condiciones en `admin.new.tsx` y `admin.edit.$id.tsx`.
- Mantener compatibilidad con productos existentes: un producto con datos ya guardados debe abrirse sin perder configuracion.
- Respetar RLS de Supabase, flujo de checkout Flow, checkout externo y WhatsApp existentes.
- Ejecutar `npm run build` antes de considerar terminada la implementacion.

### Criterios para evitar hardcoding

- Los textos del editor deben poder ajustarse desde una configuracion o constante central sin buscar en muchos componentes.
- Los mensajes por error tecnico deben mapearse por codigo/constraint (`23505`, `products_slug_key`) en una funcion reusable.
- El switch de pago alternativo debe derivar su estado de `payment_url` o de un estado controlado del formulario, no de una suposicion fija.
- La advertencia de pago externo debe describir la regla general: link externo para compra individual; checkout normal para carrito con varios articulos.
- Las etiquetas de SEO deben ser presentacionales; no deben cambiar nombres de columnas, rutas ni metadata interna.

## Fase 1: Pago alternativo

### Cambios propuestos

- Agregar un switch o checkbox visible: `Usar enlace de pago externo`.
- Mantener ocultos `URL de pago externo` y `Texto del boton de pago` mientras la opcion este apagada.
- Mostrar una advertencia clara cuando se active:
  - "Este enlace se abre fuera del checkout normal. Solo se ofrece cuando el cliente compra este producto de forma individual. Si el carrito tiene varios articulos, el cliente debera usar el pago online normal."
- Al desactivar la opcion, limpiar `payment_url` y `payment_button_label` para evitar guardar datos invisibles por accidente.
- Si ya existe un producto con `payment_url`, abrir la seccion con la opcion activada para no perder configuracion existente.

### Riesgos

- Si se usa solo estado local y no se sincroniza bien con `payment_url`, se podria ocultar una URL existente.
- Si se limpia el campo sin confirmacion en productos existentes, el usuario podria borrar un link por accidente.

### Criterio de aceptacion

- Producto nuevo: la URL externa no aparece hasta activar la opcion.
- Producto existente con URL: la opcion aparece activa y los campos se ven.
- Al desactivar y guardar: no queda link externo en el producto.
- El texto explica la limitacion de un solo articulo sin mencionar detalles tecnicos internos.

## Fase 2: Inventario

### Cambios propuestos

- Cambiar el encabezado a una explicacion orientada a resultado: "Define si el producto se puede comprar y como se descuentan sus unidades."
- Reordenar o agrupar ayudas por preguntas del usuario:
  - "¿Se puede vender ahora?" para disponibilidad comercial.
  - "¿Quieres contar unidades?" para control de inventario.
  - "¿Que pasa cuando llega a cero?" para agotado, ocultar o mostrar.
- Reescribir `Estado resultante` como `Resultado en la tienda` con una frase concreta segun configuracion.
- Reemplazar `backorder` por `venta sin stock` en todos los textos visibles.
- Para productos existentes, explicar mejor que el stock registrado no se edita directo porque debe pasar por `Movimientos de stock`.
- Mantener los controles actuales para no cambiar la logica.

### Textos guia sugeridos

- `Controlar inventario`: "Activalo si vendes unidades limitadas. Desactivalo para servicios, asesorias o productos sin limite."
- `Umbral de pocas unidades`: "Cuando el stock llegue a este numero, el panel lo marcara como pocas unidades."
- `Permitir venta sin stock`: "Permite que el cliente compre aunque el stock este en cero. Usalo solo si puedes reponer o entregar bajo pedido."
- `Cuando no haya stock`: "Elige si el producto seguira visible como agotado o si desaparecera del catalogo."

### Riesgos

- Reordenar campos podria afectar usuarios que ya conocen el flujo actual.
- Hay que verificar mobile porque esta seccion tiene tarjetas, selectores y switches.

### Criterio de aceptacion

- Un usuario no tecnico entiende si el producto se podra comprar, si descuenta unidades y que ocurre cuando se agota.
- Los estados resultantes coinciden con la logica actual de `utils/inventory.ts`.
- Crear producto y editar producto mantienen el comportamiento actual de stock.

## Fase 3: SEO entendible

### Cambios propuestos

- Cambiar el titulo visible `SEO` por `Direccion publica y vista en buscadores` o mantener `SEO` con una descripcion simple.
- Renombrar ayudas visibles:
  - `Slug` -> `Direccion del producto`
  - `Titulo SEO` -> `Titulo para Google y redes`
  - `Descripcion SEO` -> `Descripcion para Google y redes`
  - `Imagen OpenGraph opcional` -> `Imagen para compartir en redes`
  - `No indexar este producto` -> `Ocultar de buscadores`
- Mantener nombres internos del formulario iguales para no tocar el contrato de datos.
- Mejorar la vista previa para explicar que es una simulacion de como podria verse el producto al compartirse o aparecer en buscadores.
- Corregir textos con caracteres rotos o inconsistentes si aparecen en pantalla.

### Riesgos

- Cambiar labels no debe cambiar `id`, `name`, mappers ni estructura de datos.
- El termino `noindex,nofollow` puede mantenerse solo como detalle tecnico secundario, no como texto principal.

### Criterio de aceptacion

- El usuario entiende que la direccion publica afecta el enlace `/producto/...`.
- El usuario entiende que los campos vacios usan datos automaticos del producto.
- La seccion conserva todos los campos actuales.

## Fase 4: Error por nombre o direccion duplicada

### Cambios propuestos

- Crear una funcion pequena y reusable para traducir errores de Supabase/Postgres de producto a mensajes de usuario.
- Detectar especificamente:
  - `products_slug_key`
  - `duplicate key value`
  - codigo Postgres `23505`, si esta disponible en el objeto de error.
- Usar el mensaje traducido en crear y editar producto.
- Sugerir accion concreta:
  - "Ya existe un producto con esa direccion publica. Cambia el nombre o abre la seccion SEO y modifica la direccion del producto."

### Riesgos

- No todos los errores de Supabase llegan con la misma forma; conviene cubrir `message`, `code` y `details`.
- No se debe ocultar informacion util para errores desconocidos.

### Criterio de aceptacion

- Crear dos productos con el mismo nombre muestra una alerta clara.
- Editar un producto para usar una direccion existente muestra la misma alerta clara.
- Otros errores siguen mostrando un mensaje razonable.

## Fase 5: Verificacion antes de entregar cambios

1. Ejecutar `npm run build`.
2. Revisar manualmente `/admin/new`.
3. Probar producto nuevo sin pago externo.
4. Probar producto nuevo con pago externo.
5. Probar producto existente con pago externo guardado.
6. Probar inventario con:
   - sin control de stock,
   - stock inicial,
   - stock cero,
   - venta sin stock,
   - ocultar producto agotado.
7. Probar SEO dejando campos vacios y editando la direccion publica.
8. Forzar producto duplicado y confirmar que el toast no muestra el error tecnico.
9. Revisar responsive en mobile y desktop.

## Decisiones antes de implementar

- Conviene implementar primero los textos y comportamiento visual del editor; despues traducir errores.
- No conviene cambiar base de datos ni migraciones para este pedido.
- No conviene eliminar campos de SEO ni inventario: el trabajo es de claridad, no de reduccion funcional.
- Si se quiere maxima seguridad al desactivar pago externo en productos existentes, se puede mostrar confirmacion antes de limpiar la URL.
- Conviene tratar este cambio como parte de una plantilla: configuracion centralizada, componentes simples y helpers reutilizables.
