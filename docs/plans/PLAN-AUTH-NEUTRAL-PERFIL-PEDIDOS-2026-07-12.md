# Plan auth neutral, perfil de cliente y asociacion de pedidos

Fecha: 2026-07-12

Estado: ejecutado en codigo local.

## Implementacion aplicada

- `/auth` quedo como acceso neutral de cuenta, sin textos publicos de admin o asignacion de rol.
- La redireccion post-login se decide por `user_roles`: admin a `/admin`, usuario normal a `/cuenta`.
- Se agrego `/cuenta` como panel protegido de pedidos del cliente.
- El checkout sigue aceptando invitados; si hay sesion, envia token para asociar el pedido al usuario.
- Se agrego `POST /api/account/link-orders` para vincular pedidos invitados solo con usuario autenticado y correo confirmado.
- Se agrego migracion SQL con RPC server-side e indice para asociar pedidos por email normalizado.
- Se agrego plantilla local versionada para el correo de confirmacion de Supabase.

## Entendimiento actualizado

El flujo actual funciona tecnicamente, pero el mensaje y la experiencia estan mal orientados: `/auth` se presenta como "Acceso administracion" y despues de crear cuenta dice que un admin debe asignar rol. Eso confunde, porque el registro publico no debe ser para pedir acceso admin.

La nueva regla del producto debe ser:

- Hay un solo login/registro neutral.
- Nada visible en autenticacion debe decir `admin`, `administracion` o `asignarte rol`.
- El usuario inicia sesion o crea cuenta con correo/contrasena.
- El registro debe requerir confirmacion de correo antes de cargar compras historicas al perfil.
- Despues de autenticar:
  - si tiene rol `admin`, se redirige al panel admin;
  - si no tiene rol admin, se redirige a un panel simple de cliente.
- El panel de cliente muestra sus pedidos asociados.
- Comprar como invitado sigue permitido.
- Si luego el usuario se registra con el mismo correo usado en compras anteriores, esas compras deben asociarse a su perfil de forma segura.
- El frontend no debe mostrar botones ni textos de admin; la autorizacion real la decide el rol.

## Reglas de seguridad

- No crear ni pedir rol admin desde `/auth`.
- No exponer `admin` en botones, titulos, subtitulos o mensajes del flujo publico.
- No usar `user_metadata` para autorizacion.
- Mantener `public.user_roles` como fuente de verdad para rol admin.
- Mantener RLS como autoridad final.
- No exponer `service_role` en cliente.
- La asociacion de pedidos por correo debe ocurrir server-side o mediante RPC cuidadosamente controlada, nunca con permisos amplios desde el navegador.
- Asociar pedidos solo si el correo del usuario autenticado coincide con `customer_email` normalizado.
- Exigir correo verificado antes de asociar compras historicas por email.

Referencias oficiales consultadas:

- Supabase Auth email/password: https://supabase.com/docs/guides/auth/passwords
- Supabase `signInWithPassword`: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Supabase local email templates: https://supabase.com/docs/guides/local-development/customizing-email-templates

## Estado actual detectado

- `src/routes/auth.tsx` tiene login y registro, pero el texto esta orientado a administracion.
- Al registrarse muestra: "Ahora un admin existente debe asignarte el rol."
- El redirect actual de sesion existente lleva a `/admin`.
- El login exitoso tambien navega a `/admin`.
- `src/routes/_authenticated/admin.tsx` ya revisa `user_roles` y bloquea no-admin.
- `orders.user_id` existe y puede ser `NULL`.
- `orders.customer_email` existe y permite asociar compras invitadas por correo.
- Las RLS actuales permiten ver pedidos por `orders.user_id = auth.uid()` y admins pueden ver todo.
- Supabase puede enviar correo de confirmacion al registrar usuario si `Confirm email` esta activo.
- La plantilla de confirmacion se puede personalizar desde Supabase Dashboard en proyectos hosted o desde `supabase/config.toml` para desarrollo local.

## Fase 1: Convertir `/auth` en acceso neutral

### Cambios propuestos

- Cambiar titulo de pagina:
  - de `Acceso administracion`
  - a `Ingresar a tu cuenta`
- Cambiar subtitulo:
  - de "Solo usuarios con rol admin..."
  - a algo como "Ingresa para ver tus pedidos y continuar tu experiencia."
- Cambiar titulo SEO/head:
  - de `Acceso admin`
  - a `Cuenta`
- Cambiar mensajes:
  - registro exitoso: "Cuenta creada. Revisa tu correo y confirma el registro para activar tu cuenta."
  - login exitoso: "Bienvenido."
- Eliminar toda mencion visible a admin, rol o asignacion de permisos desde `/auth`.
- Mantener formulario simple: email + contrasena.
- Si Supabase devuelve usuario sin sesion porque falta confirmar correo, no redirigir todavia a `/cuenta`; mostrar estado de espera de confirmacion.

### Archivos probables

- `src/routes/auth.tsx`

### Criterios de aceptacion

- `/auth` no contiene texto visible de administracion ni admin.
- Crear cuenta no sugiere pedir rol.
- Crear cuenta pide revisar correo y confirmar registro.
- Login y registro siguen funcionando.

## Fase 2: Confirmacion de correo obligatoria para perfil de pedidos

### Cambios propuestos

- Mantener activo `Confirm email` en Supabase Auth.
- En `signUp`, usar `emailRedirectTo` apuntando a una ruta neutral, por ejemplo:
  - `/auth/callback`
  - o `/cuenta`
- Despues de registro, mostrar toast o panel:
  - "Revisa tu correo y confirma el registro para activar tu cuenta."
- No ejecutar asociacion de pedidos invitados mientras el email no este confirmado.
- Al cargar `/cuenta`, validar que el usuario tenga email confirmado antes de intentar vincular pedidos por email.
- Si el correo no esta confirmado, mostrar aviso:
  - "Confirma tu correo para cargar tus pedidos asociados a este email."

### Personalizacion del correo de Supabase

Si el proyecto es hosted:

- Configurar en Supabase Dashboard: Authentication > Email Templates > Confirm sign up.
- Cambiar asunto a algo de marca, por ejemplo:
  - `Confirma tu cuenta en Orbynex Digital`
- Cambiar cuerpo para explicar:
  - el registro permite ver pedidos asociados al correo;
  - si no fue solicitado, puede ignorar el mensaje;
  - boton claro: `Confirmar cuenta`.

Si se quiere versionar para plantilla local:

- Crear archivo HTML en `supabase/templates/confirm-signup.html`.
- Referenciarlo desde `supabase/config.toml` con `[auth.email.template.confirmation]`.
- Mantener placeholders oficiales de Supabase como `{{ .ConfirmationURL }}` segun corresponda al template.

### Criterios de aceptacion

- Usuario registrado ve mensaje de revisar correo.
- El correo de confirmacion tiene copy de marca y explica por que se confirma.
- Pedidos historicos no se asocian hasta confirmar email.
- Despues de confirmar email, el usuario puede entrar a `/cuenta` y cargar pedidos asociados.

## Fase 3: Redireccion por rol despues de autenticarse

### Cambios propuestos

- Crear helper reusable:
  - `getPostAuthRedirect(userId)`
  - si `getAdminAccess(userId)` es true -> `/admin`
  - si no -> `/cuenta`
- Usarlo en:
  - sesion existente al entrar a `/auth`;
  - login exitoso;
  - registro confirmado si Supabase devuelve sesion activa;
  - confirmacion por email cuando aplique.
- Si Supabase exige confirmacion de correo, mostrar mensaje neutral y no redirigir hasta que exista sesion confirmada.

### Archivos probables

- `src/routes/auth.tsx`
- `src/services/admin-access.service.ts`
- posible nuevo `src/services/auth-redirect.service.ts`

### Criterios de aceptacion

- Admin autenticado termina en `/admin`.
- Usuario normal autenticado termina en `/cuenta`.
- Un usuario normal que visita `/admin` sigue viendo acceso restringido.
- El frontend no muestra admin como opcion publica.

## Fase 4: Boton publico neutral, no admin

### Cambios propuestos

- No agregar boton `Admin`.
- Agregar, si se quiere acceso visible, un boton neutral:
  - `Cuenta`
  - `Mi cuenta`
  - icono de usuario
- Ese boton apunta a `/auth` si no hay sesion o a `/cuenta`/`/admin` segun rol si hay sesion.
- En mobile debe aparecer en el menu sin mencionar admin.

### Archivos probables

- `src/components/layout/Navbar.tsx`
- `src/config/navigation.config.ts`
- `src/hooks/useAdminAccess.ts`

### Criterios de aceptacion

- No existe ningun boton publico que diga admin.
- El usuario encuentra acceso a su cuenta.
- El rol decide la ruta final.

## Fase 5: Crear panel simple de cliente

### Cambios propuestos

- Crear ruta protegida:
  - `/cuenta`
- Mostrar:
  - email del usuario;
  - listado de pedidos asociados;
  - estado del pedido;
  - fecha;
  - total;
  - productos principales;
  - link a resultado/detalle si existe.
- No mostrar herramientas admin.
- No permitir editar pedidos desde este panel en esta fase.

### Archivos probables

- `src/routes/_authenticated/cuenta.tsx` o `src/routes/_authenticated/account.tsx`
- `src/services/orders.service.ts`
- componentes UI simples para tarjetas/lista de pedidos.

### Criterios de aceptacion

- Usuario normal ve solo sus pedidos.
- Si no tiene pedidos, ve estado vacio claro.
- Si no confirmo correo, ve aviso para confirmar antes de cargar pedidos historicos.
- Admin puede seguir entrando a `/admin`; opcionalmente tambien puede ver `/cuenta`, pero no es necesario.

## Fase 6: Asociar pedidos invitados al perfil

### Regla de negocio

La compra como invitado debe seguir funcionando. El registro no debe ser obligatorio.

Si una persona compra como invitado con `correo@ejemplo.com` y despues crea cuenta con ese mismo correo, esos pedidos deben quedar asociados a `auth.users.id`.

### Opcion recomendada

Crear endpoint server-side:

- `POST /api/account/link-orders`
- Requiere usuario autenticado.
- Lee el usuario con Supabase Auth del request.
- Verifica que el email este confirmado antes de asociar.
- Usa service role solo en servidor.
- Normaliza email:
  - trim
  - lowercase
- Actualiza pedidos:
  - `user_id IS NULL`
  - `lower(customer_email) = lower(user.email)`
  - solo si email esta confirmado.
- Devuelve cantidad de pedidos vinculados.

### Alternativa

RPC SQL con `SECURITY DEFINER`, pero solo si se disena con mucho cuidado. Para esta plantilla es mas claro y auditable hacerlo en endpoint server-side porque evita exponer permisos amplios en cliente.

### RLS esperada

- Usuarios normales leen pedidos por `orders.user_id = auth.uid()`.
- Admin lee todos por `user_roles`.
- Pedidos invitados sin `user_id` no deben aparecer en perfiles hasta asociarse.

### Archivos probables

- `api/account/link-orders.ts`
- `src/services/orders.service.ts`
- `src/routes/_authenticated/cuenta.tsx`
- `src/server/flow/supabase.ts` o helper server-side existente de Supabase admin.
- Posible migracion para indice:
  - `lower(customer_email)` si se necesita rendimiento.

### Criterios de aceptacion

- Usuario compra como invitado sin registrarse.
- Luego crea cuenta con el mismo email.
- Confirma el correo.
- Al entrar a `/cuenta`, ve sus compras anteriores.
- Otro usuario con otro email no ve esos pedidos.
- No se filtran pedidos por email desde el frontend; se asocian a `user_id` de forma server-side.

## Fase 7: Ajustar checkout para usuario autenticado

### Cambios propuestos

- Si hay sesion, precargar email del usuario en checkout.
- Al crear pedido, enviar `userId` cuando corresponda si el flujo server-side ya lo soporta.
- Si no hay sesion, mantener checkout invitado.
- No bloquear Flow ni WhatsApp por falta de cuenta.

### Archivos probables

- `src/routes/checkout.tsx`
- `src/server/flow/checkout.ts`
- `api/flow/create-payment.ts`

### Criterios de aceptacion

- Invitado puede comprar.
- Usuario logueado puede comprar y el pedido queda asociado.
- Email sigue siendo requerido para contacto y Flow.

## Fase 8: Limpieza de textos y rutas

### Cambios propuestos

- Eliminar textos rotos o viejos:
  - `Acceso administracion`
  - `Solo usuarios con rol admin...`
  - `Ahora un admin existente debe asignarte el rol.`
- Usar textos neutrales:
  - `Cuenta`
  - `Ingresar`
  - `Crear cuenta`
  - `Mis pedidos`
  - `Revisa tu correo para confirmar tu cuenta`
- Mantener `/admin` como ruta protegida, pero no promocionarla en UI publica.

### Criterios de aceptacion

- La captura actual ya no tendria ningun texto de admin.
- Registro se entiende como cuenta de cliente.
- Registro no promete cargar pedidos hasta confirmar correo.
- El admin sigue entrando por rol, no por una experiencia visible distinta.

## Fase 9: Verificacion

### Pruebas obligatorias

- `npm run lint`
- `npm run build`
- Usuario invitado puede comprar.
- Usuario normal puede registrarse.
- Registro muestra mensaje de confirmacion de correo.
- Usuario sin correo confirmado no vincula pedidos historicos.
- Usuario con correo confirmado vincula pedidos historicos del mismo email.
- Usuario normal termina en `/cuenta`.
- Usuario normal no puede entrar a `/admin`.
- Admin termina en `/admin`.
- Pedido invitado con mismo email se asocia al perfil tras registro/login.
- RLS impide ver pedidos de otro usuario.
- El frontend publico no muestra `admin` en auth/navbar.

## Riesgos

- Asociar pedidos solo por email requiere correo confiable; por eso debe hacerse solo despues de confirmacion de email.
- Si Supabase no confirma email en local, el comportamiento puede diferir de produccion.
- Si el correo de Supabase usa plantilla generica en produccion, la experiencia se vera poco profesional aunque la seguridad funcione.
- Si se agrega indice por `lower(customer_email)`, debe hacerse por migracion y probarse.
- Si hay pedidos antiguos con emails mal escritos, no se asociaran automaticamente.

## Orden recomendado

1. Confirmar configuracion `Confirm email` en Supabase.
2. Personalizar plantilla `Confirm sign up`.
3. Cambiar `/auth` a copy neutral con mensaje de revisar correo.
4. Crear helper de redireccion por rol.
5. Crear `/cuenta`.
6. Crear servicio de pedidos del usuario.
7. Crear endpoint server-side de asociacion de pedidos por email confirmado.
8. Integrar asociacion despues de login/confirmacion.
9. Ajustar checkout para usuario autenticado sin romper invitado.
10. Verificar RLS, lint y build.
