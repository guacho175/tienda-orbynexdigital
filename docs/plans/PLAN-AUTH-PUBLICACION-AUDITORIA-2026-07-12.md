# Plan auth, publicacion segura y auditoria util

Fecha: 2026-07-12

Estado: planificado, sin cambios de codigo aplicados.

## Entendimiento

Se requieren cuatro bloques de mejora antes de implementar:

1. Agregar un acceso visible para autenticarse como admin.
2. Permitir registro simple de usuarios normales con correo y contrasena, sin asignar rol admin desde la UI.
3. Evitar que un producto creado con informacion minima quede publicado por accidente.
4. Mejorar la auditoria para que sea escalable, paginada y legible para un cliente no tecnico.

## Decision sobre registro de usuarios

El registro con correo y contrasena es viable para este e-commerce si se usa como cuenta normal de cliente o usuario registrado. No es recomendable que el registro publico cree admins ni que escriba roles privilegiados desde el frontend.

La regla correcta para esta plantilla es:

- Registro publico: crea usuario normal.
- Rol admin: se delega fuera de la UI publica, mediante migracion o proceso administrativo controlado.
- La UI nunca debe insertar `role = 'admin'`.
- La autorizacion real debe seguir dependiendo de RLS y de `public.user_roles`, no de textos visibles ni de metadata editable por el usuario.

Referencias oficiales consultadas:

- Supabase Auth email/password: https://supabase.com/docs/guides/auth/passwords
- Supabase user metadata: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase RLS/auth security guidance del skill local.

## Estado actual detectado

- Existe `/auth` con login y signup mezclados.
- Existe proteccion de rutas admin mediante `/_authenticated` y revision de admin en `/admin`.
- Existe tabla `user_roles` con enum `admin | user`.
- Existen RLS y migraciones que restringen productos y auditoria a admins.
- El navbar publico no muestra un boton claro de acceso admin.
- El formulario de producto crea productos con `is_active: true` por defecto.
- La auditoria carga `fetchProductAuditEvents(75)` sin paginacion real.
- La vista de auditoria muestra `changed_fields` como nombres internos de columnas, por ejemplo `payment_url`, `seo_noindex`, `low_stock_threshold`.

## Reglas de escalabilidad para plantilla

- Centralizar textos visibles de auth, publicacion y auditoria en config o helpers reutilizables.
- No hardcodear correos, IDs de usuario, nombres de cliente ni roles privilegiados.
- No usar `user_metadata` para decidir si alguien es admin.
- No crear admins desde el registro publico.
- Mantener RLS como autoridad final.
- No cambiar migraciones de rol admin si ya existe el flujo manual aprobado.
- Paginar auditoria desde consulta, no solo ocultar elementos en frontend.
- Traducir campos tecnicos mediante un diccionario reusable, no con condicionales dispersos en componentes.

## Fase 1: Acceso admin visible

### Cambios propuestos

- Agregar un boton discreto en navbar o menu mobile: `Admin` o `Acceso admin`.
- El boton debe apuntar a `/auth` o directamente a `/admin` si hay sesion.
- En desktop debe verse como accion secundaria, sin competir con carrito.
- En mobile debe aparecer dentro del menu.
- Si el usuario ya esta autenticado y es admin, el boton puede decir `Panel`.

### Archivos probables

- `src/components/layout/Navbar.tsx`
- `src/config/navigation.config.ts`
- `src/hooks/useAdminAccess.ts`

### Criterios de aceptacion

- Un administrador encuentra el acceso sin conocer la URL.
- El boton no expone datos privados ni cambia permisos.
- Mobile y desktop mantienen jerarquia visual.

## Fase 2: Registro normal separado de admin

### Cambios propuestos

- Separar mentalmente la pantalla `/auth` en dos modos claros:
  - `Ingresar al panel` para usuarios ya registrados.
  - `Crear cuenta` para usuarios normales.
- Ajustar textos para que el registro no prometa acceso admin.
- Al registrarse, mostrar mensaje:
  - "Cuenta creada. Esta cuenta queda como usuario normal. El acceso admin se asigna por configuracion interna."
- Evaluar si conviene crear una ruta publica futura `/registro` para clientes normales, dejando `/auth` como acceso admin. Para esta fase puede bastar con mejorar `/auth` si no se quiere ampliar superficie.
- No insertar roles desde la UI.
- No usar metadata editable para admin.
- Si en el futuro se necesita rol `user` explicito, hacerlo mediante trigger/migracion controlada, no desde el cliente.

### Archivos probables

- `src/routes/auth.tsx`
- `src/integrations/supabase/client.ts`
- `src/services/admin-access.service.ts`
- Migraciones solo si se decide automatizar rol `user`; no recomendado como primer cambio si ya funciona con auth + RLS actual.

### Criterios de aceptacion

- El usuario puede crear cuenta con email/password.
- La cuenta creada no obtiene permisos admin.
- Si intenta entrar a `/admin`, ve "Acceso restringido".
- Admin sigue dependiendo de `user_roles`.

## Fase 3: Crear productos sin publicar por defecto

### Decision recomendada

Para una plantilla e-commerce, lo mas seguro es que todo producto nuevo nazca como **inactivo**. El usuario debe encender publicacion de forma consciente.

Esto es mejor que permitir crear publicado y luego pedir confirmacion en muchos casos, porque reduce accidentes y mantiene el catalogo publico limpio.

### Cambios propuestos

- Cambiar valor inicial de `is_active` solo en producto nuevo:
  - antes: `initial?.is_active ?? true`
  - recomendado: `initial?.is_active ?? false`
- Cambiar textos del editor:
  - `Crear producto` puede crear borrador/inactivo.
  - Estado superior debe decir `Inactivo` para nuevos productos.
- En la seccion Organizacion/Visibilidad, explicar:
  - "Activa este producto solo cuando tenga precio, imagen e informacion lista para publicar."
- Si el usuario activa `is_active` y faltan campos importantes, mostrar confirmacion antes de guardar.

### Campos importantes para advertencia

No deben ser todos obligatorios, pero si deben advertirse al publicar:

- Imagen principal ausente.
- Precio en cero.
- Descripcion corta vacia.
- Categoria vacia.
- Stock sin configurar cuando `track_inventory` esta activo.

### Criterios de aceptacion

- Producto nuevo se guarda inactivo por defecto.
- Producto editado conserva su estado actual.
- Si se intenta publicar con campos incompletos, aparece advertencia clara.
- El usuario puede confirmar si aun quiere publicar.
- No se bloquea crear borradores incompletos.

## Fase 4: Auditoria paginada

### Cambios propuestos

- Reemplazar `fetchProductAuditEvents(limit)` por consulta paginada:
  - `page`
  - `pageSize`
  - `from`
  - `to`
  - opcionalmente `count: "exact"` si el costo es aceptable.
- Agregar controles:
  - Anterior
  - Siguiente
  - contador de pagina o rango visible
  - selector de tamano opcional: 25, 50, 100
- Mantener orden por `created_at DESC`.
- Preparar filtros futuros sin implementarlos aun:
  - producto
  - tipo de evento
  - usuario
  - fecha

### Archivos probables

- `src/services/product-audit.service.ts`
- `src/routes/_authenticated/admin.audit.tsx`
- `src/components/ui/pagination.tsx`

### Criterios de aceptacion

- La auditoria no carga una lista fija gigante.
- El usuario puede avanzar y retroceder paginas.
- La consulta usa rangos de Supabase, no paginacion solo visual.

## Fase 5: Auditoria entendible para cliente

### Cambios propuestos

- Crear un helper de presentacion:
  - `src/utils/product-audit-format.ts` o `src/services/product-audit-presenter.ts`
- Crear diccionario de campos:
  - `name` -> `Nombre`
  - `price` -> `Precio`
  - `is_active` -> `Estado de publicacion`
  - `payment_url` -> `URL de pago externo`
  - `seo_noindex` -> `Ocultar de buscadores`
  - `low_stock_threshold` -> `Aviso de pocas unidades`
  - etc.
- Mostrar cada cambio como:
  - `Precio: antes $0 -> ahora $19.990`
  - `Estado de publicacion: Inactivo -> Activo`
  - `Imagen principal: sin imagen -> imagen agregada`
- Formatear valores por tipo:
  - booleanos como `Si/No`, `Activo/Inactivo`.
  - moneda con `formatCurrency`.
  - URLs como `Agregada`, `Cambiada`, `Eliminada` o link corto.
  - textos largos truncados con opcion `Ver detalle`.
  - null/vacio como `Sin valor`.
- Mantener snapshots crudos disponibles solo como debug futuro, no como primera lectura para cliente.

### Criterios de aceptacion

- Un cliente entiende que cambio sin conocer nombres de columnas.
- La auditoria muestra antes y despues cuando existan snapshots.
- Creacion de producto muestra resumen util, no solo `product`.
- Cambios de stock siguen identificandose como eventos de stock.

## Fase 6: Seguridad y pruebas

### Verificacion obligatoria

- `npm run lint`
- `npm run build`
- Probar registro nuevo.
- Probar login admin.
- Probar usuario normal entrando a `/admin`: debe quedar bloqueado.
- Probar producto nuevo: debe nacer inactivo.
- Probar publicar con campos faltantes: debe advertir antes de guardar.
- Probar auditoria con varias paginas.
- Probar que RLS sigue evitando que usuario normal lea/escriba panel admin.

### Riesgos

- Si se separa `/auth` y `/registro`, hay que cuidar redirects de Supabase email confirmation.
- Si se automatiza rol `user`, debe hacerse con migracion segura y sin permitir escalada a admin.
- Si se usa `count: "exact"` en auditoria con muchos registros, puede tener costo; para plantilla se puede empezar con `hasNextPage` basado en traer `pageSize + 1`.
- La confirmacion al publicar no debe bloquear guardado de borradores.

## Orden recomendado de implementacion

1. Mejorar textos y boton visible de admin.
2. Ajustar registro para usuarios normales sin tocar roles admin.
3. Cambiar producto nuevo a inactivo por defecto.
4. Agregar confirmacion solo al publicar incompleto.
5. Paginar auditoria.
6. Traducir y formatear cambios de auditoria.
7. Ejecutar build/lint y generar reporte.
