# Reporte categorias home responsive

## Archivos modificados

- `src/routes/index.tsx`

## Cambios realizados

- Se reemplazo la grilla fija de categorias por un carrusel horizontal con tarjetas de ancho estable.
- Se agregaron iconos y descripciones cortas por categoria para que cada tarjeta comunique mejor su funcion comercial.
- Se mantuvo la navegacion hacia `/catalogo` y no se tocaron flujos de pago, carrito, WhatsApp, Supabase ni administracion.

## Criterios responsive aplicados

- Mobile: carrusel tactil con tarjetas de ancho controlado y lectura centrada en el bloque introductorio.
- Tablet y desktop: carrusel con controles anterior/siguiente, sin depender de que el numero de categorias sea par.
- Tarjetas con `min-height`, iconos fijos y texto con ancho flexible para evitar saltos o desbordes.

## Riesgos y pendientes

- Las categorias vienen desde productos activos; si aparecen nuevas categorias sin mapeo especifico usaran un icono y descripcion generica.
- Si el catalogo crece mucho, conviene agregar filtros directos por categoria en `/catalogo`.
- Pendiente verificar visualmente contra el deploy productivo despues de publicar cambios.
