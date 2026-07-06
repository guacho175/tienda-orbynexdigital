# Migracion a Supabase propia

Fecha: 2026-07-06
Rama de trabajo: `feature/flow-api-dynamic-checkout`
Supabase nueva: `frpzanceiaijlbgkabib`

## Estado Inicial Verificado

Git:

```text
Rama actual: feature/flow-api-dynamic-checkout
Estado: working tree clean
Rama local: 2 commits por delante de origin/feature/flow-api-dynamic-checkout
```

Backend anterior:

```text
Lovable Cloud / Supabase gestionado
project_id anterior: duwzfbufrpmldlexkbls
```

Backend nuevo:

```text
SUPABASE_PROJECT_ID=frpzanceiaijlbgkabib
SUPABASE_URL=https://frpzanceiaijlbgkabib.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key nueva>
SUPABASE_SERVICE_ROLE_KEY=<usar la secret key nueva solo server-side>
SUPABASE_JWKS_URL=https://frpzanceiaijlbgkabib.supabase.co/auth/v1/.well-known/jwks.json
```

Nota: el codigo actual espera `SUPABASE_SERVICE_ROLE_KEY`. Si Supabase entrega una clave `sb_secret_...`, cargar ese valor en Vercel como `SUPABASE_SERVICE_ROLE_KEY`. No usar prefijo `VITE_` para esta clave.

## Decision Operativa

No usar `supabase db push` en este estado.

Motivo: la migracion `20260705225916_orders_flow_api_phase_1.sql` tiene timestamp anterior a la migracion base `20260706001459_...sql`. Si se aplica por orden de nombre en una Supabase vacia, `orders/order_items` intenta referenciar `public.products` antes de que exista.

Metodo recomendado para esta migracion:

1. Aplicar SQL manualmente en Supabase SQL Editor en orden controlado.
2. Verificar tabla por tabla.
3. Configurar Auth/Storage.
4. Cargar variables en Vercel.
5. Recién despues validar la app desplegada.

## Orden Correcto De Migraciones

Aplicar en Supabase SQL Editor, una por una:

### 1. Base roles/productos

```text
supabase/migrations/20260706001459_ccfe6ebc-d21a-4806-b570-a4ebeb2582f7.sql
```

Crea:

- `public.app_role`
- `public.user_roles`
- `public.has_role`
- `public.products`
- `public.set_updated_at`
- policies iniciales de productos

### 2. Revoke inicial has_role

```text
supabase/migrations/20260706001525_737dba78-aaf2-42b9-bb1a-9ef15f1cd2e7.sql
```

Revoca ejecucion publica/anon parcial de `public.has_role`.

### 3. Revoke completo has_role

```text
supabase/migrations/20260706004202_e82686c7-413e-4182-8a38-4cee1e8e43fe.sql
```

Revoca `EXECUTE` de `public.has_role` a `PUBLIC`, `anon` y `authenticated`; deja `service_role`.

### 4. Storage product-images

```text
supabase/migrations/20260706013000_product_images_storage.sql
```

Crea bucket `product-images` y policies de lectura publica/escritura admin.

### 5. Policies products sin has_role

```text
supabase/migrations/20260706014500_products_policies_direct_user_roles.sql
```

Reemplaza policies admin de `products` para validar con `EXISTS` directo sobre `public.user_roles`.

### 6. Flow Fase 1 DB

```text
supabase/migrations/20260705225916_orders_flow_api_phase_1.sql
```

Aplicar al final aunque el timestamp sea anterior. Crea:

- `public.orders`
- `public.order_items`
- RLS y grants para ordenes
- indices de ordenes/items

## Verificaciones SQL

### Tablas principales

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('products', 'user_roles', 'orders', 'order_items')
order by table_name;
```

### Buckets

```sql
select id, name, public
from storage.buckets
where id = 'product-images';
```

### RLS activa

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('products', 'user_roles', 'orders', 'order_items')
order by tablename;
```

### Policies

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in ('products', 'user_roles', 'orders', 'order_items', 'objects')
order by schemaname, tablename, policyname;
```

### has_role no expuesta

```sql
select
  n.nspname as schema,
  p.proname as function,
  r.rolname as grantee,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and p.proname = 'has_role'
  and r.rolname in ('anon', 'authenticated', 'service_role')
order by r.rolname;
```

Esperado:

- `anon`: `false`
- `authenticated`: `false`
- `service_role`: `true`

## Auth En Supabase Nueva

Configurar en Supabase Dashboard > Authentication > URL Configuration:

Site URL:

```text
https://tienda-orbynexdigital.lovable.app
```

Redirect URLs:

```text
https://tienda-orbynexdigital.lovable.app/auth
https://tienda-orbynexdigital.lovable.app/admin
https://tienda-orbynexdigital.lovable.app/*
http://localhost:5173/*
```

Cuando exista subdominio final, agregarlo sin eliminar todavia la URL actual hasta validar:

```text
https://<subdominio-final>/*
```

## Variables En Vercel

Variables publicas:

```text
SUPABASE_PROJECT_ID=frpzanceiaijlbgkabib
SUPABASE_URL=https://frpzanceiaijlbgkabib.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key nueva>

VITE_SUPABASE_PROJECT_ID=frpzanceiaijlbgkabib
VITE_SUPABASE_URL=https://frpzanceiaijlbgkabib.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key nueva>
```

Variables server-side:

```text
SUPABASE_SERVICE_ROLE_KEY=<secret key nueva>
FLOW_API_KEY=<sandbox Flow>
FLOW_SECRET_KEY=<sandbox Flow>
FLOW_BASE_URL=https://sandbox.flow.cl/api
APP_PUBLIC_URL=https://tienda-orbynexdigital.lovable.app
FLOW_RETURN_URL=https://tienda-orbynexdigital.lovable.app/checkout/resultado
FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.lovable.app/api/flow/confirm
```

No crear:

```text
VITE_SUPABASE_SERVICE_ROLE_KEY
VITE_FLOW_API_KEY
VITE_FLOW_SECRET_KEY
NEXT_PUBLIC_FLOW_*
```

## Primer Admin

Despues de desplegar variables nuevas y abrir `/auth`, crear una cuenta admin desde la UI.

Luego en Supabase SQL Editor:

```sql
select id, email
from auth.users
where email = '<EMAIL_ADMIN>';
```

Asignar rol:

```sql
insert into public.user_roles (user_id, role)
values ('<UUID_DEL_USUARIO>', 'admin')
on conflict (user_id, role) do nothing;
```

Cerrar sesion e iniciar de nuevo en la app antes de probar `/admin`.

## Validacion Funcional

1. Abrir `/catalogo`.
   - Si no hay productos, debe mostrar estado vacio.
2. Abrir `/auth`.
   - Crear o iniciar sesion.
3. Asignar rol admin.
4. Abrir `/admin`.
   - Debe mostrar panel admin.
5. Crear un producto.
6. Activarlo.
7. Abrir `/catalogo`.
   - Debe aparecer el producto.
8. Subir imagen desde ProductForm.
   - Debe guardarse en bucket `product-images`.
9. Probar usuario autenticado sin rol admin.
   - No debe poder crear/editar/subir imagenes.

## Validacion Flow Despues De Base

No probar Flow hasta que:

- `products` funcione.
- `user_roles` funcione.
- `product-images` funcione.
- Vercel tenga `SUPABASE_SERVICE_ROLE_KEY`.

Despues probar:

```bash
curl -X POST "https://tienda-orbynexdigital.lovable.app/api/flow/create-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productId": "<UUID_PRODUCTO_ACTIVO>", "quantity": 1 }
    ],
    "customer": {
      "name": "Cliente Demo",
      "email": "cliente@example.com",
      "phone": "+56912345678",
      "comment": "Prueba sandbox"
    }
  }'
```

## Archivos Que No Se Deben Tocar Ahora

- `src/routes/checkout.tsx`
- `src/routes/_authenticated/route.tsx`
- `src/store/cart.store.tsx`
- `src/utils/whatsapp.ts`
- `src/components/admin/ProductForm.tsx`
- `src/router.tsx`
- `src/routeTree.gen.ts`

## Pendientes Despues De Validar

- Actualizar `supabase/config.toml` con `project_id = "frpzanceiaijlbgkabib"` si se decide usar CLI contra la Supabase nueva.
- Regenerar tipos Supabase si se incorpora `orders/order_items` al cliente TypeScript.
- Corregir documentacion que aun diga Lovable Cloud como backend final.
- Cambiar `APP_PUBLIC_URL`, `FLOW_RETURN_URL` y `FLOW_CONFIRMATION_URL` cuando exista el subdominio final.
