# Reporte de optimizacion visual y fluidez del admin

**Fecha:** 2026-07-10  
**Estado:** implementado y compilado; pendiente medir despues del despliegue

## Problemas confirmados

- El listado admin reutilizaba `card-surface`, una superficie creada para el escaparate oscuro. Eso
  producia el fondo gris azulado de la tabla y bajo contraste.
- La vista previa SEO usaba `bg-background` y textos del tema oscuro dentro del panel admin claro,
  dejando varios textos casi invisibles.
- Cada enlace de edicion usaba `preload="render"`. Con 15 productos, el router intentaba precargar
  todas las rutas parametrizadas de edicion al dibujar el listado.
- Al pasar de un producto a otro, `ProductForm` podia conservar el estado del producto anterior
  porque la instancia no se reiniciaba al cambiar `product.id`.
- El editor solicitaba movimientos de stock al abrirse, aunque el admin no visitara esa seccion.

## Cambios realizados

- Fondo general, buscador, tabla, tarjetas moviles, analitica, auditoria y paneles del editor en
  blanco, con bordes `slate-200`, sombras suaves y texto oscuro.
- Vista previa SEO con colores explicitos: blanco, `slate-950`, `slate-700` y cian oscuro.
- Precarga de edicion cambiada de `render` a `intent`.
- Al enfocar, tocar o acercar el puntero a `Editar`, el producto existente se copia a la clave
  `admin-product` sin hacer otra consulta de red.
- `admin-products` usa `staleTime` de 60 segundos.
- El historial de stock se consulta solo al abrir `Movimientos de stock` y permanece fresco durante
  60 segundos.
- Analitica y auditoria tambien mantienen datos frescos durante 60 segundos.
- `ProductForm` usa `key={product.id}` para reiniciar correctamente valores, errores y seccion al
  cambiar de producto.

## Verificaciones

- Medicion del despliegue anterior: aproximadamente 3715 ms desde clic en `Editar` hasta completar
  la navegacion a `Demo Landing Express`.
- La inspeccion del despliegue anterior confirmo un caso con encabezado `Demo Web Starter` y campos
  de `Demo Web Pro`; el remount por `product.id` corrige esa inconsistencia.
- ESLint dirigido: OK.
- `npx tsc --noEmit --pretty false`: OK.
- `npm run build`: OK.
- El build conserva separacion de chunks; `ProductForm` queda en aproximadamente 32.34 kB gzip.
- Sin cambios en checkout Flow, reservas, confirmacion de pagos, endpoints publicos, RLS, Auth ni
  migraciones.

## Verificacion visual pendiente

Localhost no tenia una sesion admin autenticada y los cambios no fueron desplegados en este trabajo.
Despues del proximo despliegue se debe comprobar a 375 px, 768 px y 1280 px:

1. Fondo blanco continuo en listado, editor, analitica y auditoria.
2. Contraste legible de la vista previa SEO.
3. Correspondencia entre encabezado y campos al editar varios productos consecutivos.
4. Nueva medicion del tiempo de apertura desde el listado.

## Riesgos y pendientes separados

- La proteccion de rutas administrativas conserva sus comprobaciones actuales. No se cambio Auth
  para reducir tiempos porque pertenece a una revision de seguridad separada.
- El build sigue indicando runtime `nodejs20.x` y el aviso heredado de `vite-tsconfig-paths`; no se
  modificaron por estar fuera de este ajuste visual.
