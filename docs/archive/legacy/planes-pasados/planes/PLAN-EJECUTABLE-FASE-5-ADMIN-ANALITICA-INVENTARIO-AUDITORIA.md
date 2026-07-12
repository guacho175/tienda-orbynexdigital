# Plan ejecutable Fase 5 - Admin, analitica, inventario y auditoria

**Fecha:** 2026-07-09  
**Estado:** plan listo para aprobacion de ejecucion  
**Objetivo:** dividir Fase 5 en bloques ejecutables sin mezclar todo en un solo cambio riesgoso.

## 0. Decision del usuario interpretada

Se implementaran varias mejoras, pero por fases:

1. Analitica.
2. Inventario.
3. Auditoria.
4. Buscador simple de productos.
5. Aviso contra sobrescritura de cambios recientes.

No implementar ahora:

- Envio/logistica.
- IA.
- Notificaciones.
- Autosave automatico agresivo.

Nota sobre autosave:

- Se mantiene boton "Guardar".
- No se guardara automaticamente cada campo.
- Si despues se quiere autosave real, debe ser otra fase porque requiere versionado y manejo de conflictos.

## 1. Fase 5A - Analitica admin

### Objetivo

Agregar una vista simple de analitica administrativa usando datos reales existentes.

### Alcance

Crear una pagina o seccion admin de analitica con:

- Productos activos.
- Productos inactivos.
- Productos con stock bajo.
- Productos agotados.
- Productos sin imagen.
- Total de ordenes.
- Ordenes pagadas.
- Ventas por fecha desde `orders`.
- Productos mas vendidos desde `order_items`.

### Payment URL externo

Como `payment_url` no confirma pagos automaticamente, no se contara como venta automatica.

Para incluir ventas externas se agrega una subfase separada:

**Fase 5A.2 - Ventas manuales externas**

- Registrar ventas realizadas fuera del sistema.
- Asociar venta manual a producto.
- Registrar cantidad, monto, fecha y nota.
- Usar esos registros para analitica.

### Archivos probables

- `src/routes/_authenticated/admin.analytics.tsx`
- `src/services/products.service.ts`
- nuevo servicio de analitica admin si hace falta
- docs de reporte

### Migraciones

Fase 5A basica:

- No requiere migracion si solo lee `products`, `orders`, `order_items`.

Fase 5A.2 ventas manuales:

- Requiere tabla nueva `manual_sales`.

### Riesgo

Medio/bajo si es solo lectura.

### No tocar

- Flow.
- WhatsApp.
- Checkout.
- RPCs de stock.
- Reservas.

## 2. Fase 5B - Inventario admin avanzado

### Objetivo

Agregar control mas claro de inventario y movimientos.

### Alcance

Crear historial de movimientos de stock:

- Venta pagada por Flow.
- Reserva creada.
- Reserva liberada.
- Ajuste manual admin.
- Devolucion manual.
- Correccion manual.

Agregar ajustes manuales de stock desde admin:

- Permitir aumentar o disminuir stock.
- Mostrar cantidad anterior y nueva.
- Registrar usuario y fecha.
- Motivo opcional, porque el usuario eligio ajuste sin motivo obligatorio.

### Migraciones

Crear tabla:

- `stock_movements`

Campos propuestos:

- `id`
- `product_id`
- `movement_type`
- `quantity_delta`
- `stock_before`
- `stock_after`
- `reason`
- `source`
- `order_id`
- `reservation_id`
- `created_by`
- `created_at`

### Integracion con Flow/reservas

Esta fase toca zona sensible.

Regla:

- Primero registrar ajustes manuales desde admin.
- Despues conectar eventos Flow/reservas si no rompe RPCs.
- No modificar cobros ni totales Flow.

### Riesgo

Alto si se conecta todo de una vez.

Division interna recomendada:

1. Fase 5B.1: tabla `stock_movements` + ajustes manuales admin.
2. Fase 5B.2: registrar ventas pagadas Flow.
3. Fase 5B.3: registrar reservas/liberaciones.

## 3. Fase 5C - Auditoria de productos

### Objetivo

Guardar historial de cambios importantes del producto.

### Alcance

Crear auditoria para:

- Precio.
- Stock.
- Activo/inactivo.
- SEO.
- Imagen.
- Categoria.
- Disponibilidad.

El usuario quiere auditoria, pero no como unica mejora.

### Modelo

Crear tabla:

- `product_audit_events`

Guardar:

- `id`
- `product_id`
- `event_type`
- `before_snapshot`
- `after_snapshot`
- `changed_fields`
- `created_by`
- `created_at`

Decision:

- Se guardara snapshot completo antes y despues, porque el usuario marco esa opcion.
- Se mostrara en una pagina admin separada, porque el usuario marco esa opcion.
- Solo admins pueden ver auditoria.

### Migraciones

Requiere tabla nueva con RLS.

### Riesgo

Medio.

### No tocar

- Flow.
- WhatsApp.
- Checkout.

## 4. Fase 5D - Buscador simple de productos

### Objetivo

Agregar buscador simple en admin para productos.

### Alcance

Buscar por:

- Nombre.
- Slug.
- Categoria.
- Descripcion corta.

No buscar ahora:

- Ordenes.
- Clientes.
- Auditoria.

### Migracion

No requiere migracion si se filtra en frontend sobre la lista admin actual.

### Riesgo

Bajo.

## 5. Fase 5E - Aviso contra sobrescritura de cambios recientes

### Objetivo

Evitar que un admin pise cambios recientes sin darse cuenta.

### Alcance

- Mantener boton "Guardar".
- No bloquear edicion por usuario.
- No autosave.
- Al abrir producto, guardar `updated_at` inicial.
- Antes de guardar, verificar si `updated_at` cambio en base de datos.
- Si cambio, mostrar aviso.
- Opciones:
  - recargar producto;
  - continuar y sobrescribir.

### Migracion

No requiere migracion.

### Riesgo

Medio/bajo.

## 6. Orden de ejecucion recomendado

Orden para ejecutar sin romper checkout:

1. Fase 5D - Buscador simple de productos.
2. Fase 5A - Analitica admin solo lectura.
3. Fase 5C - Auditoria de productos.
4. Fase 5E - Aviso contra sobrescritura.
5. Fase 5B.1 - Inventario: ajustes manuales + movimientos.
6. Fase 5B.2 - Registrar ventas Flow en movimientos.
7. Fase 5B.3 - Registrar reservas/liberaciones.
8. Fase 5A.2 - Ventas manuales externas para `payment_url`.

Motivo:

- El buscador es rapido y de bajo riesgo.
- La analitica inicial es lectura.
- La auditoria agrega trazabilidad.
- El aviso de sobrescritura mejora seguridad de edicion.
- Inventario se deja dividido porque toca stock, reservas y Flow.

## 7. Orden si el usuario exige analitica primero

Si se debe respetar "analitica primero", ejecutar asi:

1. Fase 5A - Analitica admin solo lectura.
2. Fase 5D - Buscador simple de productos.
3. Fase 5C - Auditoria de productos.
4. Fase 5E - Aviso contra sobrescritura.
5. Fase 5B.1 - Inventario manual.
6. Fase 5B.2 - Flow en movimientos.
7. Fase 5B.3 - Reservas en movimientos.
8. Fase 5A.2 - Ventas manuales externas.

Este sera el orden si el usuario dice: "ejecuta el plan".

## 8. Validaciones obligatorias por fase

En cada fase:

- Prettier dirigido.
- ESLint dirigido.
- `npx tsc --noEmit --pretty false`.
- `npm run build`.
- `git diff --check`.
- QA visual local.
- Verificar que no se tocaron archivos protegidos si no corresponde.

Cuando haya SQL:

- Verificar migracion.
- Verificar RLS.
- Verificar grants.
- `supabase db lint --db-url <pooler-url> --schema public`.
- `supabase db advisors --db-url <pooler-url> --type all --level info --fail-on none`.

## 9. Archivos protegidos

No tocar sin necesidad explicita de fase:

- `api/flow/*`
- `src/server/flow/*`
- `src/routes/_authenticated/route.tsx`
- `orders`
- `order_items`
- reservas de stock
- RPCs de inventario
- checkout WhatsApp
- fallback `payment_url`

## 10. Criterio de listo

El plan se considera listo para ejecutar cuando el usuario diga:

```text
ejecuta el plan fase 5
```

Al recibir eso, ejecutar en el orden:

1. Analitica admin solo lectura.
2. Buscador simple de productos.
3. Auditoria de productos.
4. Aviso contra sobrescritura.
5. Inventario manual.

Las partes de Flow/reservas/manual sales quedan para continuar si el tiempo alcanza y las validaciones siguen pasando.
