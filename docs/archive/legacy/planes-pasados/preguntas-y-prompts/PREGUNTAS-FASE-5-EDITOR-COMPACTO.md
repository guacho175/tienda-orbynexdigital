# Preguntas para definir Fase 5 del editor compacto

**Fecha:** 2026-07-09  
**Estado:** backlog por definir  
**Regla:** no implementar Fase 5 hasta responder estas preguntas y aprobar un bloque concreto.

## 1. Autosave, versionado y conflictos

- Se requiere autosave real o basta con advertencia de cambios pendientes?
- Cada cuanto debe guardar: por campo, por seccion o por intervalo?
- Que debe pasar si dos admins editan el mismo producto?
- Se acepta bloquear edicion por usuario o se prefiere resolver conflictos?
- Cual es la version fuente: `updated_at`, un `version integer` o una tabla de revisiones?
- Cuantas versiones historicas se deben conservar?

## 2. Auditoria por usuario

- Que acciones deben auditarse: crear, editar, activar/desactivar, eliminar, cambio de precio, cambio de stock?
- La auditoria debe guardar diff campo a campo o snapshot completo?
- Quien puede ver auditoria: solo admin, owner, superadmin?
- Cuanto tiempo se retienen eventos?
- Se necesita exportar auditoria?
- Debe registrar IP/user-agent o solo `user_id` y timestamp?

## 3. Historial y movimientos de stock

- El stock se editara manualmente desde admin o solo por compras/devoluciones?
- Que tipos de movimiento existen: ajuste, venta, reserva, liberacion, devolucion, perdida?
- Se requiere motivo obligatorio para ajustes manuales?
- Debe permitir stock negativo o backorder separado?
- Como se reconcilia con reservas Flow ya existentes?
- Se necesita reporte de movimientos por producto?

## 4. Analitica operativa

- Que metricas importan hoy: ventas, conversion, stock bajo, productos sin venta, margen, precio promedio?
- Existe fuente real de eventos o hay que crear tabla de eventos?
- Se requiere dashboard en admin o solo export/reportes?
- Cada cuanto se actualizan metricas?
- Debe incluir datos de Flow, WhatsApp y `payment_url` externo?
- Como se registran compras hechas por `payment_url` si no vuelven al sistema?

## 5. Integraciones logisticas

- Los productos seran fisicos, digitales o mixtos?
- Se requiere retiro en tienda?
- Que zonas/paises se soportan?
- Tarifas fijas, por peso, por comuna/zona o integracion con carrier?
- Quien calcula `shipping_total`: checkout server-side, proveedor externo o tabla local?
- Se necesita tracking post-compra?

## 6. Ayuda de IA

- La IA sugerira textos SEO, descripciones, categorias o respuestas administrativas?
- Se pueden enviar datos de producto a un proveedor externo?
- Debe guardar prompts/respuestas para auditoria?
- Se requiere aprobacion manual antes de aplicar sugerencias?
- Que tono/idioma debe usar?
- Hay restricciones legales o de marca?

## 7. Buscador global y notificaciones

- El buscador debe cubrir productos, ordenes, clientes, docs y auditoria?
- Debe buscar en cliente con datos cargados o server-side?
- Se necesita full-text search Postgres?
- Que notificaciones son necesarias: stock bajo, pago fallido, reserva expirada, producto sin imagen?
- Seran notificaciones in-app, email, WhatsApp, Slack u otra via?
- Quien puede configurar umbrales y destinatarios?

## 8. Orden recomendado para cerrar hoy

Si la meta es terminar una base estable hoy, el orden recomendable es:

1. Aplicar y validar Fase 4A SEO real en Supabase.
2. Hacer QA admin/publico de SEO.
3. No iniciar Fase 5 completa.
4. Elegir solo un bloque de Fase 5 si hay una necesidad operativa inmediata.

El candidato menos riesgoso de Fase 5 es auditoria simple de cambios, pero requiere una tabla de eventos y reglas de retencion. Autosave, stock history, analitica e integraciones logisticas son mas riesgosos porque cambian contratos operativos.
