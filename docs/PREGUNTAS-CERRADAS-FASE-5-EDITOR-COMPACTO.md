# Preguntas cerradas para Fase 5 del editor compacto

**Fecha:** 2026-07-09  
**Objetivo:** decidir una Fase 5 simple, sin sobrecomplicar el template.  
**Como responder:** marca una opcion por pregunta. Si no sabes, elige la opcion recomendada.

## Recomendacion general

Para terminar una base estable hoy, recomiendo:

1. No implementar autosave.
2. No implementar historial complejo.
3. Implementar solo una auditoria simple de cambios importantes.
4. Dejar analitica, IA, logistica y notificaciones para despues.

## 1. Alcance de Fase 5

### Pregunta 1

Quieres implementar algo de Fase 5 ahora?

- [ ] No. Cerrar por ahora con Fase 4A SEO real. **Recomendado**
- [ ] Si. Implementar solo una mejora simple.
- [x] Si. Implementar varias mejoras.

### Pregunta 2

Si implementamos solo una mejora, cual eliges?

- [ x] Auditoria simple de cambios importantes. **Recomendado**
- [ x] Historial de stock.
- [x ] Autosave.
- [x ] Analitica.
- [x ] Notificaciones.
- [ ] Ayuda con IA.

## 2. Autosave

### Pregunta 3

Quieres autosave en el editor?

- [ x] No. Mantener boton "Guardar". **Recomendado**
- [ ] Si. Guardar automaticamente mientras se edita.

### Pregunta 4

Si hay autosave, cuando debe guardar?

- [ x] No aplica, no quiero autosave. **Recomendado**
- [ ] Cada vez que el usuario cambia un campo.
- [ ] Cada cierto tiempo, por ejemplo cada 10 segundos.
- [ ] Solo al cambiar de seccion.

### Pregunta 5

Si falla el autosave, que debe pasar?

- [x ] No aplica, no quiero autosave. **Recomendado**
- [ ] Mostrar error y mantener cambios en pantalla.
- [ ] Bloquear el formulario hasta resolver el error.

## 3. Edicion simultanea

### Pregunta 6

Puede haber dos admins editando el mismo producto al mismo tiempo?

- [x] No, casi nunca. **Recomendado**
- [ ] Si, es probable.

### Pregunta 7

Si dos admins editan el mismo producto al mismo tiempo, que prefieres?

- [ x] Mostrar aviso antes de sobrescribir cambios. **Recomendado**
- [ ] Bloquear el producto mientras un admin lo edita.
- [ ] Permitir que el ultimo que guarda sobrescriba todo.

### Pregunta 8

Quieres bloquear la edicion por usuario?

- [ x] No. Solo avisar si hubo cambios recientes. **Recomendado**
- [ ] Si. Si un admin entra a editar, otros no pueden editar ese producto.

## 4. Auditoria de cambios

### Pregunta 9

Quieres guardar un registro de cambios del producto?

- [ x] Si, pero simple. **Recomendado**
- [ ] No.
- [ ] Si, completo y detallado.

### Pregunta 10

Que cambios se deben registrar?

- [x ] Solo cambios importantes: precio, stock, activo/inactivo, SEO, imagen. **Recomendado**
- [ ] Todos los campos.
- [ ] Solo precio y stock.

### Pregunta 11

Que detalle debe guardar la auditoria?

- [ ] Campo cambiado, valor anterior, valor nuevo, usuario y fecha. **Recomendado**
- [ ] Solo usuario, fecha y accion.
- [x ] Snapshot completo del producto antes y despues.

### Pregunta 12

Quien puede ver la auditoria?

- [ x] Solo admins. **Recomendado**
- [ ] Cualquier usuario autenticado.
- [ ] Nadie en UI; solo queda en base de datos.

### Pregunta 13

Donde mostrar la auditoria?

- [ ] En la pantalla de edicion del producto, en una seccion colapsable. **Recomendado**
- [x] En una pagina admin separada.
- [ ] No mostrarla por ahora.

## 5. Historial de stock

### Pregunta 14

Quieres historial de movimientos de stock ahora?

- [ ] No. Dejar para despues. **Recomendado**
- [x ] Si.

### Pregunta 15

Si hay historial de stock, que movimientos registrar?

- [ ] No aplica, no quiero historial de stock. **Recomendado**
- [ ] Ventas pagadas por Flow.
- [ ] Ventas Flow y ajustes manuales de admin.
- [x ] Todo: reservas, liberaciones, ventas, ajustes y devoluciones.

### Pregunta 16

Quieres que el admin pueda hacer ajustes manuales de stock?

- [ ] No por ahora. **Recomendado**
- [ x] Si, sin motivo obligatorio.
- [ ] Si, con motivo obligatorio.

## 6. Analitica

### Pregunta 17

Quieres analitica en admin ahora?

- [ ] No. Dejar para despues. **Recomendado**
- [ x] Si, basica.
- [ ] Si, completa.

### Pregunta 18

Si hay analitica basica, que metricas importan?

- [ ] No aplica, no quiero analitica ahora. **Recomendado**
- [ ] Productos con stock bajo.
- [ ] Productos mas vendidos.
- [ ] Ventas por fecha.
- [ x] Todas las anteriores.

### Pregunta 19

Debe contar ventas hechas por `payment_url` externo?

- [ ] No, porque el sistema no confirma esos pagos automaticamente. **Recomendado**
- [ x] Si, pero ingresadas manualmente.
- [ ] Si, automaticamente.

## 7. Notificaciones

### Pregunta 20

Quieres notificaciones administrativas ahora?

- [ x] No. Dejar para despues. **Recomendado**
- [ ] Si.

### Pregunta 21

Si hay notificaciones, cuales?

- [x ] No aplica, no quiero notificaciones. **Recomendado**
- [ ] Stock bajo.
- [ ] Pago Flow fallido.
- [ ] Producto sin imagen.
- [ ] Todas las anteriores.

### Pregunta 22

Donde deben aparecer?

- [ x] No aplica, no quiero notificaciones. **Recomendado**
- [ ] Dentro del panel admin.
- [ ] Por email.
- [ ] Por WhatsApp.

## 8. Logistica y envio

### Pregunta 23

Quieres implementar envio ahora?

- [ x] No. Dejar para despues. **Recomendado**
- [ ] Si.

### Pregunta 24

Los productos son fisicos, digitales o ambos?

- [ ] Digitales/servicios principalmente. **Recomendado**
- [ ] Fisicos principalmente.
- [ x] Ambos.

### Pregunta 25

Si hay envio, como se calcula?

- [x ] No aplica, no quiero envio ahora. **Recomendado**
- [ ] Tarifa fija.
- [ ] Por comuna/zona.
- [ ] Por peso/dimensiones.
- [ ] Con integracion de courier.

## 9. Ayuda de IA

### Pregunta 26

Quieres ayuda de IA dentro del admin ahora?

- [ x] No. Dejar para despues. **Recomendado**
- [ ] Si.

### Pregunta 27

Si hay IA, para que se usaria?

- [ x] No aplica, no quiero IA ahora. **Recomendado**
- [ ] Sugerir titulo SEO.
- [ ] Sugerir descripcion SEO.
- [ ] Sugerir descripcion de producto.
- [ ] Todas las anteriores.

### Pregunta 28

La IA puede aplicar cambios automaticamente?

- [x ] No. Solo sugiere y el admin decide. **Recomendado**
- [ ] Si. Puede aplicar cambios sola.

## 10. Buscador global

### Pregunta 29

Quieres buscador global en admin ahora?

- [ ] No. Dejar para despues. **Recomendado**
- [ x] Si.

### Pregunta 30

Que debe buscar?

- [ ] No aplica, no quiero buscador global ahora. **Recomendado**
- [x ] Productos.
- [ ] Productos y ordenes.
- [ ] Productos, ordenes, clientes y auditoria.

## 11. Decision final recomendada

### Pregunta 31

Que camino tomamos para cerrar hoy?

- [ ] Cerrar Fase 4A y no tocar Fase 5 hoy. **Recomendado**
- [ ] Implementar auditoria simple de cambios importantes.
- [ ] Implementar historial de stock.
- [ ] Implementar autosave.
- [ ] Implementar notificaciones.
aplicar plan segun lo que te marque

### Pregunta 32

Si elegimos auditoria simple, aceptas crear una tabla nueva `product_audit_events`?

- [ ] Si. **Recomendado si se implementa auditoria**
- [ ] No.
- [ x] No aplica, no implementaremos auditoria.

### Pregunta 33

Si elegimos auditoria simple, aceptas que no se auditen cambios antiguos?

- [ ] Si, registrar solo cambios desde ahora. **Recomendado**
- [ ] No, necesito reconstruir historial antiguo.
- [ x] No aplica, no implementaremos auditoria.

### Pregunta 34

Si elegimos auditoria simple, aceptas que sea solo lectura en admin?

- [ ] Si. **Recomendado**
- [ ] No, quiero filtros/exportacion desde el primer dia.
- [ x] No aplica, no implementaremos auditoria.

## 12. Plan simple segun respuestas recomendadas

Si marcas las opciones recomendadas, el plan queda asi:

1. Cerrar Fase 4A SEO real.
2. No implementar Fase 5 hoy.
3. Dejar Fase 5 como backlog.
4. Si se necesita una mejora adicional, hacer solo auditoria simple en una fase nueva y separada.

## 13. Plan simple si eliges auditoria

Si eliges auditoria simple:

1. Crear tabla `product_audit_events`.
2. Registrar cambios importantes al guardar producto.
3. Mostrar historial simple en editar producto.
4. No agregar autosave.
5. No agregar analitica.
6. No tocar Flow, WhatsApp, checkout ni stock avanzado.
