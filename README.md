# Orbynex Mini-Commerce

Aplicación de comercio electrónico ligera para catálogo, carrito, pagos Flow.cl, reservas de
inventario y administración de productos y pedidos. El repositorio contiene una implementación
personalizada para Orbynex Digital y conserva puntos de configuración para reutilizarla en otros
comercios.

## Stack

- React 19 y TanStack Start/Router.
- Vite 8, Nitro y Tailwind CSS 4.
- Supabase PostgreSQL, Auth, Storage y RLS.
- Flow.cl para pagos en CLP.
- Vercel para la aplicación y funciones serverless.

La arquitectura detallada está en
[`docs/technical/02-architecture.md`](docs/technical/02-architecture.md).

## Desarrollo local

Requisitos:

- Node.js `>=22.13.0`.
- npm, usando el `package-lock.json` versionado.

```bash
npm ci
cp .env.example .env
npm run dev
```

El servidor local usa `http://localhost:8080`. Completa `.env` únicamente con credenciales de un
entorno autorizado y nunca lo versiones.

La guía completa de instalación está en
[`docs/technical/10-installation.md`](docs/technical/10-installation.md).

## Validación

```bash
npm run check:docs
npm run test:docs
npm run lint
npm run typecheck
npm run format:check
npm run build
```

No declares una tarea terminada si una comprobación requerida no se ejecutó o falló.

## Documentación

- [Índice y fuentes canónicas](docs/README.md)
- [Estado actual confirmado](docs/PROJECT_STATE.md)
- [Referencia de API](docs/technical/08-api-reference.md)
- [Modelo de datos](docs/technical/03-domain-model.md)
- [Seguridad Supabase](docs/technical/07-supabase-security.md)
- [Despliegue](docs/technical/11-deployment.md)
- [Gestión de secretos](docs/security/GESTION-DE-SECRETOS-Y-ENTORNOS.md)

Los planes y reportes bajo `docs/archive/` son históricos y no describen necesariamente el sistema
vigente.

## Seguridad

- No expongas `SUPABASE_SERVICE_ROLE_KEY`, `FLOW_SECRET_KEY`, conexiones de base de datos ni
  credenciales de usuarios.
- Solo las variables publicables llevan prefijo `VITE_`.
- Los handlers y módulos `*.server.ts` son el límite para operaciones privilegiadas.
- Las migraciones y políticas RLS son la fuente ejecutable del modelo de seguridad.
