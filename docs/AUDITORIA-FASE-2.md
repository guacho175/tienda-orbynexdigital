# Auditoría post Fase 2 — Template mini-commerce

Fecha: 2026-07-06
Alcance: seguridad, RLS, rutas, permisos, build, TypeScript y estabilidad del template. **No se agregaron nuevas funcionalidades.**

---

## 1. Issue de seguridad detectado y corregido

### Hallazgo

- **Nombre**: *Signed-In Users Can Execute SECURITY DEFINER Function*
- **Severidad**: `WARN`
- **Fuente**: linter de la base de datos + escáner de seguridad de Lovable.
- **Descripción**: la función `public.has_role(uuid, app_role)` está definida como `SECURITY DEFINER` (se ejecuta con los permisos del owner, no del llamador). Estaba expuesta a través de la Data API para cualquier usuario con sesión (`authenticated`). Un usuario autenticado podía llamarla desde el cliente y **sondear roles arbitrarios** (por ejemplo, verificar si otro `user_id` es admin), lo cual no debería ser posible desde el navegador.

### Corrección aplicada

Migración SQL:

```sql
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT   EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
```

Las **policies RLS de `products` siguen funcionando** porque Postgres las evalúa internamente bajo los privilegios del owner de la tabla; los clientes ya no pueden invocar la función directamente por la API.

### Verificación

Se re-ejecutó el linter tras la migración → **0 issues** (`No linter issues found`).

---

## 2. Otros hallazgos menores y correcciones

| # | Hallazgo | Fix |
|---|----------|-----|
| 2.1 | Títulos `<title>` con "Orbynex Digital" hardcodeados en `catalogo`, `carrito`, `checkout` | Reemplazados por `` `... ${brandConfig.name}` `` |
| 2.2 | `STORAGE_KEY = "orbynex_cart_v1"` hardcodeado en el store del carrito | Movido a `commerceConfig.cartStorageKey` |
| 2.3 | Nombre "Orbynex Digital" dentro del ejemplo de `/docs` | Es un ejemplo dentro de un `<Code>`, se dejó como sample (documentación) |
| 2.4 | Comentario "Orbynex Digital palette" en `styles.css` | Es un comentario, no afecta funcionalidad; queda como referencia |

---

## 3. Auditoría de seguridad y RLS (checklist)

### Tabla `products`

- ✅ RLS habilitada.
- ✅ `Public can view active products` — `SELECT` para `anon,authenticated` con `is_active = true`.
- ✅ `Admins can view all products` — `SELECT` para admins.
- ✅ `Admins can insert products` — `INSERT` con `has_role(auth.uid(), 'admin')`.
- ✅ `Admins can update products` — `UPDATE` con `has_role(...)`.
- ✅ `Admins can delete products` — `DELETE` con `has_role(...)`.
- ✅ Un usuario público **no puede** ver productos inactivos.
- ✅ Un usuario autenticado sin rol admin **no puede** crear, editar, activar/desactivar ni eliminar productos: aunque el frontend intentara enviar la mutación, PostgREST responde 403 por policy.

### Tabla `user_roles`

- ✅ RLS habilitada.
- ✅ `SELECT` solo permite ver los propios roles (`auth.uid() = user_id`).
- ✅ `INSERT`, `UPDATE`, `DELETE` **denegados** desde el cliente. Solo se puede asignar/quitar el rol admin desde el backend / base de datos.

### Función `has_role`

- ✅ `SECURITY DEFINER` con `SET search_path = public` (previene search-path attacks).
- ✅ `EXECUTE` revocado a `PUBLIC`, `anon` y `authenticated` (fix Fase 2).
- ✅ `EXECUTE` solo para `service_role`.
- ✅ Sigue funcionando dentro de las policies RLS de `products`.

### Ruta `/admin`

- ✅ Vive en `src/routes/_authenticated/`, bajo el layout `route.tsx` administrado por la integración de Lovable/Supabase, que redirige a `/auth` si no hay sesión.
- ✅ El componente vuelve a validar el rol admin llamando a `user_roles` (que solo devuelve los roles propios por RLS) y bloquea la UI si no lo tiene.
- ✅ **La UI no es la única línea de defensa**: aunque un atacante pintara la UI del admin, las mutaciones a `products` serían rechazadas por RLS.

### Secretos y service role

- ✅ `SUPABASE_SERVICE_ROLE_KEY` solo se lee en `src/integrations/supabase/client.server.ts` (archivo `*.server.ts`, bloqueado por import protection en el bundle cliente).
- ✅ Ningún componente, servicio de frontend ni `.functions.ts` importa `client.server` a nivel de módulo.
- ✅ El cliente del navegador (`@/integrations/supabase/client`) usa solo la `SUPABASE_PUBLISHABLE_KEY` (clave pública, segura en el bundle).
- ✅ `/docs` no muestra secretos, IDs de proyecto, URLs internas ni datos sensibles. Marcada con `robots: noindex`.

### Delete físico vs desactivar

- Se **mantiene** el delete físico en el admin (protegido por RLS + confirm dialog). Se **complementa** con el toggle `is_active` para el flujo habitual: ocultar un producto sin borrar historial.
- **Recomendación operativa**: usar el switch para bajar productos y reservar el borrado real para catálogo demo o errores de carga.
- Se documenta en `/docs` sección 6-7.

---

## 4. Auditoría funcional

| Ruta | Estado |
|------|--------|
| `/` (home) | ✅ Renderiza hero, beneficios y CTA desde `home.config.ts` |
| `/catalogo` | ✅ Lista solo productos activos, ordenados por `display_order` |
| `/producto/:slug` | ✅ Ficha con imagen, descripción y CTA |
| `/carrito` | ✅ Suma, resta, elimina; persiste en `localStorage` |
| `/checkout` | ✅ Maneja carrito vacío con `EmptyState` + CTA al catálogo |
| `/auth` | ✅ Sign in / sign up con Supabase; redirige a `/admin` con sesión |
| `/admin` | ✅ Solo con rol `admin`; muestra fallback si no lo tiene |
| `/admin/new` | ✅ Formulario Zod, crea producto (bloqueado por RLS si no admin) |
| `/admin/edit/:id` | ✅ Precarga producto y actualiza |
| `/docs` | ✅ Documentación estática, `noindex` |

**Carrito**: persiste en `localStorage` con la clave definida en `commerceConfig.cartStorageKey`. Se rehidrata al montar `CartProvider`.

**Productos inactivos**: verificado — `fetchActiveProducts()` filtra por `is_active=true` y la RLS lo refuerza en el servidor.

---

## 5. Auditoría de reutilización del template

| Categoría | Ubicación | Estado |
|-----------|-----------|--------|
| Marca (nombre, contacto, WhatsApp, redes) | `src/config/brand.config.ts` | ✅ Centralizado |
| Colores / tokens de tema | `src/styles.css` (`:root`) + `src/config/theme.config.ts` | ✅ Semánticos |
| Textos del home | `src/config/home.config.ts` | ✅ Centralizado |
| Navegación (navbar/footer) | `src/config/navigation.config.ts` | ✅ Centralizado |
| Reglas de comercio (moneda, WhatsApp, cart key) | `src/config/commerce.config.ts` | ✅ Centralizado |
| Productos | Tabla `products` (base de datos) | ✅ CRUD desde `/admin` |

**Adaptación a nuevo cliente**: solo requiere editar los 5 archivos de `src/config/`, `src/styles.css` (paleta HSL) y cargar los productos desde `/admin`. No se necesita tocar componentes, servicios ni rutas.

---

## 6. Calidad técnica

- ✅ TypeScript strict: sin errores tras las correcciones.
- ✅ Imports rotos: ninguno detectado.
- ✅ Rutas rotas: `routeTree.gen.ts` incluye correctamente `/docs`, `/admin/`, `/admin/new`, `/admin/edit/$id`.
- ✅ Arquitectura intacta: TanStack Start, Supabase, RLS, roles y configuración centralizada sin cambios estructurales.
- ⚠️ Advertencia de hidratación con `data-tsd-source` en `__root.tsx` — es inyectada por la herramienta interna de Lovable (los números de línea cambian entre server y client). **No afecta funcionalidad**; no es una regresión introducida por nosotros y no requiere fix en código de la app.

---

## 7. Cómo probar los permisos

### 7.1 Probar que un usuario normal NO puede gestionar productos

1. Registra una cuenta en `/auth` con un email cualquiera (usuario B).
2. Después de iniciar sesión, el redirect te lleva a `/admin`.
3. **Debes ver el bloque "Acceso restringido"** con tu email y el botón "Cerrar sesión". Confirma que **no aparece** la tabla de productos ni el botón "Nuevo producto".
4. Prueba escribir manualmente la URL `/admin/new` o `/admin/edit/<id>`: el layout `_authenticated` te deja pasar (tienes sesión), pero cualquier intento de **guardar** producirá un error `403` desde Supabase (RLS bloquea `INSERT`/`UPDATE`/`DELETE`).
5. Opcional (dev): abre DevTools → Network y verifica que las llamadas a la API de `products` devuelven `"code": "42501"` (permission denied) para este usuario.

### 7.2 Probar que un admin SÍ puede gestionar productos

1. Registra la cuenta del admin en `/auth` (usuario A).
2. Desde la base de datos, asigna el rol admin:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<UUID del usuario A>', 'admin');
   ```
3. Inicia sesión con la cuenta admin y ve a `/admin`.
4. Verifica:
   - Lista de productos visible (activos e inactivos).
   - Botón "Nuevo producto" → crea correctamente.
   - Botón editar (lápiz) → guarda cambios.
   - Switch de estado → activa/desactiva el producto y desaparece/aparece en `/catalogo`.
   - Botón eliminar (papelera) → pide confirmación y borra.
5. Cierra sesión y vuelve a `/catalogo` sin sesión: solo se ven los productos con `is_active = true`.

---

## 8. Pendientes priorizados para Fase 3

### Prioridad ALTA (bloquean uso real por clientes)

1. **Upload de imágenes de producto** (bucket Storage + input de archivo en `ProductForm`). Hoy solo se pega URL, poco práctico para el cliente.
2. **Página `/reset-password`** para completar el flujo de recuperación de contraseña admin (hoy `resetPasswordForEmail` no tiene destino).
3. **UI para asignar rol admin** desde el panel (con confirmación y logging). Hoy se hace por SQL manual.
4. **SEO por ruta pública**: `head()` con `title` + `description` + `og:image` dinámico en `producto.$slug.tsx`, `catalogo.tsx`, `carrito.tsx`.

### Prioridad MEDIA (calidad del template)

5. Página `/gracias` post-checkout WhatsApp (feedback visual).
6. Validar en runtime que `brandConfig.whatsapp` esté seteado antes de mostrar el botón; si no, deshabilitar checkout WhatsApp.
7. Duplicar / reordenar productos (drag & drop) en el admin.
8. Vista previa del producto desde el admin (link `/producto/:slug`).
9. `README-PROYECTO.md` y `GUIA-PARA-REUTILIZAR-TEMPLATE.md` en la raíz del repo (además de `/docs` in-app).
10. Imágenes placeholder neutrales en `src/assets/`.

### Prioridad BAJA (nice to have)

11. `sitemap.xml` y `robots.txt`.
12. JSON-LD `Product` en la ficha (rich snippets).
13. Opción de deshabilitar signup público en `/auth` desde config.
14. Auditoría periódica con `supabase--linter` en CI.

---

## 9. Archivos tocados en esta auditoría

### Migración

- Migración auto-generada: revoca `EXECUTE` sobre `has_role` a roles públicos.

### Código

- `src/routes/catalogo.tsx` — título por `brandConfig.name`.
- `src/routes/carrito.tsx` — título por `brandConfig.name`.
- `src/routes/checkout.tsx` — título por `brandConfig.name`.
- `src/config/commerce.config.ts` — nuevo campo `cartStorageKey`.
- `src/store/cart.store.tsx` — lee la clave desde `commerceConfig`.

### Documentación

- `docs/AUDITORIA-FASE-2.md` (este archivo).

---

## 10. Resumen ejecutivo

- ✅ 1 issue de seguridad detectado y corregido (`has_role` expuesta).
- ✅ Linter Supabase: 0 issues.
- ✅ RLS revisada extremo a extremo en `products` y `user_roles`.
- ✅ Sin service role key en el frontend.
- ✅ `/admin` protegido en 2 capas: layout de sesión + RLS en la base.
- ✅ Títulos y storage key centralizados en `src/config/`.
- ✅ Arquitectura Fase 1/2 intacta (TanStack Start, Supabase, carrito, RLS).
- 🚧 Pendientes para Fase 3 documentados y priorizados.
