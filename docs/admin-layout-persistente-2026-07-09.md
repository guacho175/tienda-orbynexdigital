# Admin layout persistente

Fecha: 2026-07-09

## Causa raiz

Las vistas del panel (`/admin`, `/admin/analytics`, `/admin/audit`, `/admin/new` y `/admin/edit/$id`) montaban `AdminShell` de forma independiente. Al navegar entre secciones, TanStack Router desmontaba la ruta completa anterior y montaba otra, incluyendo la barra lateral. Ese comportamiento generaba el parpadeo visual del menu.

Ademas, las vistas admin reutilizaban `PageHeader`, que esta disenado como encabezado hero para paginas publicas. Por eso la cabecera ocupaba demasiado alto dentro de una herramienta operativa.

## Cambio aplicado

- Se agrego la ruta padre `src/routes/_authenticated/admin.tsx`.
- `AdminShell` ahora vive en esa ruta padre y renderiza las vistas hijas mediante `Outlet`.
- Las vistas admin renderizan solo el contenido central.
- Se agrego `AdminPageHeader` como cabecera compacta para vistas internas.
- La validacion de rol admin quedo centralizada en el layout padre de `/admin`.
- En movil, la navegacion admin se presenta como una barra horizontal dentro del shell, evitando que la sidebar rompa el ancho.

## Alcance protegido

No se modificaron checkout, Flow, WhatsApp, `payment_url`, RLS, storage, RPCs ni logica de inventario/pagos. El cambio es de presentacion, layout y navegacion admin.

## Verificacion esperada

- Al cambiar entre Productos, Analitica y Auditoria, la barra lateral permanece montada.
- Solo cambia el contenido central.
- Las cabeceras internas son compactas.
- En movil no debe aparecer overflow horizontal ni solapamiento del menu.
