# Reporte: GitHub Actions para expiracion y hero sin logo duplicado

Fecha: 2026-07-07

## Cambios realizados

- Se elimino del hero el bloque de logo redundante en `src/routes/index.tsx`.
- Se mantuvieron intactos el logo del `Navbar` y el `Footer`.
- Se configuro `.github/workflows/expire-stock-reservations.yml` para llamar cada 30 minutos al endpoint:
  - `https://tienda-orbynexdigital.vercel.app/api/stock/expire-reservations`
- Se dejo `CRON_SECRET` como secret de GitHub Actions, sin hardcodearlo en el repositorio.
- Se vacio `vercel.json` para no usar Vercel Cron y evitar el bloqueo del plan Hobby.

## Validacion

- `npm run build`: correcto.

## Pendiente externo

Configurar el mismo `CRON_SECRET` en:

- Vercel Project Environment Variables.
- GitHub repository secrets.

