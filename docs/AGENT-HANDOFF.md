# Manual de Traspaso para Futuros Agentes

Este documento resume el estado vigente del proyecto para agentes o desarrolladores que continúen el trabajo.

## Estado Actual

El e-commerce Orbynex Digital esta operativo con:

- React + Vite + TanStack Start/Router.
- Supabase PostgreSQL con RLS activo.
- Flow.cl sandbox integrado mediante Vercel Functions.
- Reservas de stock por 10 minutos y expiracion por cron.
- Panel admin de productos con editor compacto.
- SEO real de productos.
- Analitica admin, auditoria de productos y ajustes manuales de stock.

Ultimo bloque ejecutado:

- Fase 5 admin: `/admin/analytics`, `/admin/audit`, buscador en `/admin`, aviso anti-sobrescritura y panel de inventario manual.
- Migraciones aplicadas:
  - `20260709231029_product_audit_events.sql`
  - `20260709231029_stock_movements_manual_adjustments.sql`
  - `20260709232902_optimize_rls_policies_advisors.sql`
- Supabase advisors a nivel `warn`: sin issues despues de optimizar RLS heredadas.

Reporte vigente:

- [Reporte Fase 5](REPORTE-EJECUCION-FASE-5-ADMIN-ANALITICA-INVENTARIO-AUDITORIA.md)

## Documentacion Vigente

- [Indice general](INDEX.md)
- [Documentacion tecnica modular](technical/README.md)
- [Deployment Vercel](DEPLOY-VERCEL.md)
- [Flow sandbox testing](FLOW-SANDBOX-TESTING.md)
- [Inventario productos](INVENTARIO-PRODUCTOS.md)
- [Inventario reservas stock](INVENTARIO-RESERVAS-STOCK.md)

Los planes, reportes antiguos, prompts y preguntas cerradas fueron archivados en:

- [Planes pasados](planes-pasados/README.md)

## Archivos Criticos

No modificar sin una solicitud explicita:

- `api/flow/*`
- `src/server/flow/*`
- `src/routes/_authenticated/route.tsx`
- `supabase/migrations/*` relacionadas con Flow, reservas y RLS
- `vercel.json`
- `vite.config.ts`

## Reglas de Seguridad

- No exponer `service_role`, secretos de Flow ni contraseñas en frontend.
- No desactivar RLS.
- No permitir escritura directa de clientes en `orders`, `order_items` ni `stock_reservations`.
- Mantener el checkout hibrido: Flow interno y `payment_url` externo deben seguir coexistiendo.
- Antes de tocar Supabase, usar la skill de Supabase, crear migracion con CLI y validar con `db lint`/`db advisors`.

## Comandos de Validacion

```bash
npx tsc --noEmit --pretty false
npx eslint <archivos-tocados>
npm run build
git diff --check
```

Nota: `npm run lint` global puede fallar por deuda previa de Prettier/CRLF en archivos no relacionados. Para cambios acotados, validar con ESLint dirigido.
