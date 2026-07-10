# Revision de respuestas - Fase 5 editor compacto

**Fecha:** 2026-07-09  
**Origen:** `docs/PREGUNTAS-CERRADAS-FASE-5-EDITOR-COMPACTO.md`  
**Objetivo:** convertir las respuestas marcadas en un camino simple y ejecutable.

## 1. Resumen de respuestas entendidas

### Implementar ahora

Marcaste que quieres implementar varias mejoras.

Mejoras marcadas:

- Auditoria simple.
- Historial de stock.
- Autosave.
- Analitica.
- Notificaciones.

Pero varias respuestas posteriores corrigen o contradicen esa lista inicial.

## 2. Decisiones claras

### Autosave

Decision clara: **no implementar autosave ahora**.

Respuestas que lo confirman:

- Mantener boton "Guardar".
- No aplica autosave.
- Si falla autosave, no aplica.

### Edicion simultanea

Decision clara: **no bloquear edicion por usuario**.

Camino elegido:

- Es poco probable que dos admins editen al mismo tiempo.
- Si pasa, mostrar aviso antes de sobrescribir cambios.
- No bloquear producto mientras un admin edita.

### Notificaciones

Decision clara: **no implementar notificaciones ahora**.

Respuestas que lo confirman:

- No quiero notificaciones.
- No aplica tipo de notificacion.
- No aplica canal de notificacion.

### Envio/logistica

Decision clara: **no implementar envio ahora**.

Respuestas que lo confirman:

- No implementar envio ahora.
- Productos pueden ser ambos, fisicos y digitales, pero queda para despues.
- No aplica calculo de envio ahora.

### IA

Decision clara: **no implementar IA ahora**.

Respuestas que lo confirman:

- No quiero IA ahora.
- No aplica uso de IA.
- Si existiera en el futuro, no debe aplicar cambios automaticamente.

### Buscador global

Decision clara: **implementar buscador simple solo de productos**.

Alcance elegido:

- Si al buscador global.
- Buscar solo productos.

## 3. Decisiones con conflicto

### Auditoria

Hay conflicto.

Marcaste:

- Si, guardar auditoria simple.
- Registrar cambios importantes.
- Guardar snapshot completo antes y despues.
- Solo admins pueden verla.
- Mostrar en pagina admin separada.

Pero despues marcaste:

- No aplica, no implementaremos auditoria.
- No aplica, no se auditan cambios antiguos.
- No aplica, no sera solo lectura en admin.

Interpretacion simple:

- Auditoria **no queda aprobada todavia**.
- Si se implementa, debe decidirse de nuevo con una sola opcion:
  - auditoria simple si/no.

### Historial de stock

Hay decision marcada, pero es de alto riesgo.

Marcaste:

- Si, historial de movimientos de stock.
- Registrar todo: reservas, liberaciones, ventas, ajustes y devoluciones.
- Permitir ajustes manuales sin motivo obligatorio.

Impacto:

- Toca inventario.
- Toca reservas.
- Puede tocar Flow.
- Puede tocar ordenes.
- No conviene mezclarlo con analitica ni buscador en el mismo bloque.

Interpretacion simple:

- Queda como bloque futuro separado, no como implementacion inmediata sin plan tecnico.

### Analitica

Hay decision marcada, pero depende de datos reales.

Marcaste:

- Si, analitica basica.
- Metricas: stock bajo, productos mas vendidos y ventas por fecha.
- `payment_url` externo debe contarse manualmente.

Impacto:

- Stock bajo se puede calcular hoy.
- Productos mas vendidos y ventas por fecha dependen de ordenes pagadas.
- `payment_url` manual requiere una forma nueva de registrar ventas externas.

Interpretacion simple:

- Analitica se puede hacer en version basica, pero no antes de definir ventas externas/manuales.

## 4. Plan simple recomendado segun tus respuestas

### Fase 5A - Buscador simple de productos

**Implementar primero.**

Alcance:

- Buscador en admin para productos.
- Busca por nombre, slug, categoria y descripcion corta.
- No busca ordenes.
- No busca clientes.
- No busca auditoria.
- No toca Flow.
- No toca WhatsApp.
- No toca `payment_url`.
- No toca reservas.
- No requiere migracion si se hace filtro en frontend sobre la lista admin actual.

Riesgo: bajo.

### Fase 5B - Aviso simple de cambios recientes

**Implementar despues del buscador, si sigue haciendo falta.**

Alcance:

- Mantener boton Guardar.
- No autosave.
- No bloqueo por usuario.
- Antes de guardar, si el producto fue modificado despues de que el admin lo cargo, mostrar aviso.
- El admin decide si recargar o continuar.

Riesgo: medio/bajo.

### Fase 5C - Analitica basica visible

**Implementar solo si aceptas alcance limitado.**

Alcance inicial seguro:

- Productos con stock bajo.
- Productos agotados.
- Productos activos/inactivos.

No incluir todavia:

- Productos mas vendidos.
- Ventas por fecha.
- Ventas por `payment_url`.

Motivo:

- Esas metricas requieren definir ventas manuales o leer ordenes reales.

Riesgo: medio.

### Fase 5D - Historial de stock

**No implementar hoy como parte simple.**

Requiere plan tecnico separado.

Motivo:

- Registrar reservas, liberaciones, ventas, ajustes y devoluciones toca partes criticas del inventario.
- Puede impactar Flow y ordenes.
- Hay que definir si los ajustes manuales sin motivo son aceptables.

Riesgo: alto.

### Fase 5E - Auditoria

**No queda aprobada por conflicto en respuestas.**

Para implementarla hay que resolver solo esto:

- Auditoria si/no.
- Si es si, confirmar tabla nueva.
- Confirmar si se mostrara en pagina separada.

Riesgo: medio.

## 5. Orden final recomendado

Para no complicar el proyecto:

1. Implementar Fase 5A: buscador simple de productos en admin.
2. Implementar Fase 5B: aviso simple de cambios recientes.
3. Dejar analitica, historial de stock y auditoria para fases separadas.

## 6. Lo que no implementaria ahora

- Autosave.
- Notificaciones.
- Envio/logistica.
- IA.
- Historial completo de stock.
- Analitica de ventas.
- Ventas manuales por `payment_url`.
- Auditoria hasta resolver el conflicto de respuestas.

## 7. Decision operativa propuesta

La proxima implementacion deberia ser:

**Fase 5A: buscador simple de productos en admin.**

Despues:

**Fase 5B: aviso antes de sobrescribir cambios recientes.**

Esto respeta tus respuestas y evita tocar checkout, Flow, reservas o stock critico.
