# Prompt para continuar editor compacto - Fases 4 y 5

Copia y pega este prompt en un chat nuevo de Codex para continuar sin depender del contexto colapsado de este hilo.

```text
Actua como Arquitecto Fullstack senior especializado en frontend administrativo, React/TanStack Start, Supabase, RLS, checkout Flow/WhatsApp y e-commerce.

Repositorio objetivo:
C:\Users\galin\OneDrive\Documentos\tienda-orbynexdigital

Antes de tocar codigo, lee obligatoriamente:

1. Plan maestro:
   C:\Users\galin\OneDrive\Documentos\tienda-orbynexdigital\docs\PLAN-MAESTRO-EDITOR-PRODUCTO-COMPACTO.md

2. Handoff vigente para agentes:
   C:\Users\galin\OneDrive\Documentos\tienda-orbynexdigital\docs\AGENT-HANDOFF.md

3. Reportes de ejecucion ya cerrados:
   C:\Users\galin\OneDrive\Documentos\tienda-orbynexdigital\docs\REPORTE-EJECUCION-EDITOR-COMPACTO-FASES-1-2.md
   C:\Users\galin\OneDrive\Documentos\tienda-orbynexdigital\docs\REPORTE-EJECUCION-EDITOR-COMPACTO-FASE-3.md

4. Estado actual del template:
   C:\Users\galin\OneDrive\Documentos\tienda-orbynexdigital\docs\ESTADO-ACTUAL-TEMPLATE.md

Contexto confirmado:

- Fases 1, 2 y 3 del editor compacto ya estan implementadas.
- Fase 3 agrego preview SEO derivada, contadores de longitud y feature flags futuras apagadas/no visibles.
- QA visual autenticado ya fue ejecutado en `/admin`, `/admin/new` y `/admin/edit/$id`.
- No se hizo commit.
- Queda un hallazgo visual no bloqueante: en movil, la barra sticky de acciones ocupa bastante viewport y puede tapar parte baja de la seccion hasta hacer scroll.
- No se han iniciado Fases 4 ni 5.

Restricciones duras:

- No tocar `api/flow/*` salvo que un bloque de Fase 4 lo requiera explicitamente y despues de plan tecnico cerrado.
- No tocar checkout Flow ni WhatsApp sin plan aprobado.
- No romper `payment_url`; debe seguir como fallback protegido.
- No tocar Auth, RLS, service role, variables de entorno ni `src/routes/_authenticated/route.tsx` sin plan aprobado.
- No tocar `orders`, `order_items`, reservas de stock, RPCs de inventario o eliminacion de productos sin plan aprobado.
- Mantener variantes de imagen:
  - cards usan `image_url_card`;
  - detalle usa `image_url_detail`;
  - carrito, checkout y admin usan `image_url_thumb`;
  - fallback legacy a `image_url`.
- No implementar UI falsa: si una funcion no tiene modelo/backend real, no debe mostrarse como funcional.
- No guardar datos futuros en `localStorage`, JSON opacos ni campos existentes reutilizados.

Objetivo:

Continuar con Fases 4 y 5 del plan maestro del editor compacto, pero de forma segura y por bloques.

Instruccion importante:

NO empieces implementando todo Fase 4 y Fase 5 de una vez.

Primero ejecuta una auditoria tecnica cerrada y escribe un plan de ejecucion en `docs/`, indicando:

- que bloques de Fase 4 realmente conviene implementar ahora;
- que bloques deben permanecer como backlog;
- migraciones requeridas por bloque;
- impacto en RLS/grants/tipos Supabase;
- impacto en rutas publicas;
- impacto en checkout Flow/WhatsApp/payment_url;
- pruebas obligatorias por bloque;
- riesgos P0/P1;
- orden recomendado de implementacion.

Despues de crear ese plan, detente y pide aprobacion antes de tocar codigo backend, migraciones o contratos.

Fase 4 segun el plan maestro incluye posibles bloques separados:

1. SEO real:
   - `meta_title`;
   - `meta_description`;
   - controles de indexacion y OpenGraph definidos;
   - head dinamico de `/producto/$slug`;
   - defaults de fallback y limites.

2. Galeria:
   - tabla `product_images`;
   - `product_id`, URL/path, alt, orden, rol principal y timestamps;
   - RLS/grants/Storage coherentes;
   - estrategia de eliminacion y archivos huerfanos.

3. Precios avanzados:
   - definir si se almacena precio oferta o descuento;
   - fechas, impuestos, redondeo y autoridad de calculo;
   - integrar RPC de orden y Flow antes de habilitar UI.

4. Envio:
   - productos fisicos, peso/dimensiones/unidades;
   - metodos, retiro, zonas, tarifas e impuestos;
   - calculo server-side de `shipping_total`.

5. Organizacion avanzada:
   - categorias normalizadas, tags, colecciones o destacado solo si hay caso real.

6. Semantica de estados:
   - constraint/enum para `availability`;
   - SKU o modos Draft/Private solo con reglas publicas y admin definidas.

Fase 5 segun el plan maestro incluye backlog futuro:

- autosave con versionado y conflictos;
- historial de cambios/auditoria por usuario;
- historial y movimientos de stock;
- analitica de inventario/precios basada en eventos reales;
- integraciones logisticas;
- benchmarking externo;
- ayuda de IA;
- buscador global y notificaciones administrativas.

Recomendacion inicial:

Prioriza como candidato de Fase 4 solo el bloque "SEO real", porque es el mas aislado y tiene menor riesgo de romper checkout/inventario. Audita si conviene implementarlo primero con:

- migracion pequeña en `products`;
- tipos Supabase actualizados o verificados;
- UI admin conectada al editor compacto;
- `head()` publico de `/producto/$slug`;
- sin tocar Flow, WhatsApp ni `payment_url`.

Trata Galeria, Precios avanzados y Envio como entregas separadas de alto riesgo hasta que el usuario apruebe requisitos concretos.

Validacion minima antes de reportar cualquier implementacion futura:

- Prettier dirigido.
- ESLint dirigido sobre archivos tocados.
- `npx tsc --noEmit --pretty false`.
- `npm run build`.
- `git diff --check`.
- Verificar que no se tocaron rutas protegidas si el bloque no lo requiere.
- QA visual admin autenticado si cambia el editor.
- QA publica si cambia `/producto/$slug`, catalogo, carrito o checkout.
- Supabase lint/advisors cuando haya cambios SQL, si el entorno lo permite.

Documentacion obligatoria:

- Crear o actualizar el plan tecnico cerrado en `docs/`.
- Actualizar `docs/AGENT-HANDOFF.md`.
- Actualizar `docs/ESTADO-ACTUAL-TEMPLATE.md`.
- Crear reporte de ejecucion en `docs/` cuando se implemente un bloque.
- Registrar problemas, decisiones fuera del plan, validaciones y pendientes.

Primera salida esperada de este nuevo chat:

1. Leer los documentos indicados.
2. Auditar el estado actual del repo.
3. Crear un plan tecnico cerrado para Fase 4/5 en `docs/`.
4. Responder solo con la ruta del archivo creado/actualizado y un resumen breve.
5. No implementar codigo hasta recibir aprobacion explicita.
```
