# Estado actual del proyecto

Última reconciliación documental: 2026-07-28.

Este archivo describe el estado confirmado en el repositorio. No contiene planes futuros, historial
de cambios ni instrucciones de trabajo.

## Capacidades implementadas

- Catálogo público, detalle de producto, carrito local y checkout.
- Autenticación Supabase y área de cuenta con asociación de pedidos invitados.
- Panel administrativo para productos, pedidos, usuarios, analítica y auditoría.
- Optimización cliente de imágenes WebP y almacenamiento en Supabase Storage.
- Integración server-side con Flow.cl: creación, confirmación y consulta pública de órdenes.
- Reservas atómicas de inventario, captura al confirmar pagos y liberación por vencimiento.
- Ajustes manuales de stock con movimientos y eventos de auditoría.
- Rutas protegidas mediante identidad validada, roles y RLS.

## Arquitectura operativa

- Vercel aloja la aplicación TanStack Start/Nitro y los handlers de `api/`.
- Supabase aloja PostgreSQL, Auth, Storage, RLS y RPC transaccionales.
- Flow.cl procesa pagos externos.
- La migración `20260722175738_schedule_stock_reservation_expiration.sql` declara un job de
  Supabase Cron cada 10 minutos.
- La migración `20260728224128_harden_public_exposure.sql` restringe helpers privilegiados y el
  listado de metadatos del bucket público de imágenes.
- `/api/stock/expire-reservations` permanece como respaldo manual protegido por `CRON_SECRET`.

## Estado de verificación

| Elemento | Estado |
|---|---|
| Código, handlers y migraciones presentes | Confirmado en repositorio |
| Node canónico | `>=22.13.0` |
| Gestor canónico | npm + `package-lock.json` |
| Historial local/remoto de migraciones | Alineado el 2026-07-28; `db push --dry-run` sin pendientes |
| Aplicación del job Supabase Cron en producción | Confirmada el 2026-07-28: un job activo |
| Ejecución del job | Cinco ejecuciones consecutivas `succeeded` verificadas el 2026-07-28 |
| RLS en tablas `public` | Activa en las siete tablas expuestas verificadas |
| Advisors de seguridad | Sin exposiciones de base; queda protección de contraseñas filtradas desactivada |
| Visibilidad del repositorio GitHub | Pública desde el 2026-07-28 |
| Seguridad del repositorio GitHub | Secret Scanning, Push Protection, Dependabot Alerts, Security Updates y Dependency Graph activos |
| Protección de `main` | Ruleset activo: sin borrado ni force push, pull request y CI obligatorios, conversaciones resueltas y bypass exclusivo del propietario |
| Code Scanning | Setup predeterminado de CodeQL activo; primera ejecución correcta para Actions y JavaScript/TypeScript |
| CI de `main` | Workflow `Validación` correcto después de la publicación |
| Configuración productiva de secretos | No verificable y no debe almacenarse aquí |
| Despliegue productivo actual | Requiere comprobación en Vercel |

## Limitaciones conocidas

- No existe una suite funcional automatizada para checkout, RLS o UI.
- Las pruebas de Flow requieren sandbox y coordinación con un webhook público.
- La protección de contraseñas filtradas de Supabase Auth permanece desactivada; la función está
  disponible en planes Pro o superiores.
- El endpoint de usuarios admin escanea como máximo 500 usuarios al aplicar filtros complejos.

Los riesgos detallados están en [14-known-risks.md](technical/14-known-risks.md).
La evaluación de visibilidad está en
[PUBLICACION-REPOSITORIO.md](security/PUBLICACION-REPOSITORIO.md).
