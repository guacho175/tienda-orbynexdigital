# Deploy en Vercel

Esta guia deja el minimo necesario para publicar el frontend en Vercel manteniendo Supabase como backend.

## 1. Preparar local

```bash
bun install
bun run dev
bun run build
```

Scripts detectados en `package.json`:

- `dev`: `vite dev`
- `build`: `vite build`
- `build:dev`: `vite build --mode development`
- `preview`: `vite preview`
- `lint`: `eslint .`

No hay script `typecheck` definido.

## 2. Importar en Vercel

1. En Vercel, importar el repositorio.
2. Framework preset: Vite o configuracion detectada automaticamente por Vercel.
3. Build command: `bun run build`.
4. Install command: `bun install`.
5. Output/runtime: usar la configuracion actual del proyecto, sin cambiar TanStack Start ni rutas.

## 3. Variables de entorno

Configurar en Vercel las variables publicas que usa el cliente Supabase actual:

```bash
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Para Flow API dinamico, configurar ademas estas variables server-side en Vercel:

```bash
FLOW_API_KEY=
FLOW_SECRET_KEY=
FLOW_BASE_URL=https://sandbox.flow.cl/api
FLOW_RETURN_URL=https://tienda-orbynexdigital.vercel.app/checkout/resultado
FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.vercel.app/api/flow/confirm
APP_PUBLIC_URL=https://tienda-orbynexdigital.vercel.app
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PUBLISHABLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` solo debe existir como variable server-side para Vercel Functions. No usar prefijos publicos como `VITE_`, `NEXT_PUBLIC_` o equivalentes para Flow secrets ni service role.

Si alguna variable Flow apunta a `*.lovable.app`, actualizarla en Vercel y hacer redeploy.

Retorno sandbox esperado:

```text
https://tienda-orbynexdigital.vercel.app/checkout/resultado
```

Confirmacion sandbox esperada:

```text
https://tienda-orbynexdigital.vercel.app/api/flow/confirm
```

## 4. Dominio propio

1. Agregar el dominio en Vercel desde Project Settings > Domains.
2. Apuntar los DNS segun indique Vercel.
3. Esperar emision del certificado SSL.
4. Probar `https://tu-dominio.com/catalogo`.

## 5. Supabase Auth

En Supabase, configurar:

- Site URL: `https://tu-dominio.com`
- Redirect URLs:
  - `https://tu-dominio.com/auth`
  - `https://tu-dominio.com/admin`
  - `https://tu-dominio.com/*`
  - URL local de desarrollo si se usa para pruebas, por ejemplo `http://localhost:5173/*`

## 6. Checklist post deploy

1. Abrir `/auth` y validar login.
2. Abrir `/admin` con usuario admin.
3. Abrir `/catalogo` como publico.
4. Crear o editar producto desde admin.
5. Subir imagen desde el formulario de producto.
6. Confirmar que `products.image_url` queda con una URL publica.
7. Confirmar que la imagen carga en `/catalogo`, `/producto/:slug` y `/carrito`.
8. Probar usuario autenticado sin rol admin: no debe acceder al CRUD ni subir imagenes.
9. Probar Flow sandbox: crear pago desde `/checkout`, volver a `/checkout/resultado`, revisar `GET /api/flow/order-status` y confirmar que el carrito solo se limpia con `paid`.
10. Revisar home publico: debe mostrar productos destacados, categorias, flujo de compra y CTAs de tienda.
11. Revisar retornos: `/catalogo`, `/producto/:slug`, `/carrito`, `/checkout` y `/checkout/resultado`.
12. Si faltan productos demo, aplicar manualmente el SQL de `docs/SEED-PRODUCTOS-DEMO.md` en Supabase.
13. Aplicar la migracion de inventario antes del deploy que use esos campos.
14. Crear o editar un producto con `track_inventory = true`, `stock_quantity = 0` y probar `show_sold_out` vs `hide_product`.
15. Probar Flow sandbox con stock insuficiente y confirmar que `create-payment` rechaza el carrito.
16. Probar una confirmacion pagada y revisar que `public.confirm_order_and_decrement_stock` descuenta stock sin dejar valores negativos.

## 7. Fuera de alcance

- No se implementa Cloudflare.
- No se migra Supabase.
- Flow API Fase 2 incluye endpoints server-side. El frontend de checkout Flow sigue fuera de alcance hasta la Fase 3.
- No se implementa Mercado Pago API.
- Los pagos siguen usando `products.payment_url`.
