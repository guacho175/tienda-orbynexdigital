# Publicación segura del repositorio

Última verificación: 2026-07-28.

## Estado

El repositorio es público en
<https://github.com/guacho175/tienda-orbynexdigital>. La conversión se realizó el 2026-07-28
después de completar el preflight de GitHub y corregir el token ficticio de la referencia API.

No se encontró una clave privilegiada real y no fue necesario activar el procedimiento de
incidente, rotación o revocación.

## Preflight de superficies almacenadas en GitHub

La revisión anterior al cambio de visibilidad produjo estos resultados:

- GitHub Actions contenía 130 registros: una ejecución real y correcta con log descargable, y 129
  fallos de arranque programados sin jobs ni logs. Se analizaron el log disponible y los resultados
  de los 130 check suites sin coincidencias privilegiadas.
- No existían artefactos descargables, releases, adjuntos de releases ni packages publicados.
- Existía una cache de npm creada por `setup-node`; sus metadatos no contenían coincidencias y el
  workflow que la genera instala dependencias públicas mediante `npm ci`.
- Existían 46 registros de deployment. Sus metadatos y estados no contenían credenciales,
  encabezados de autorización, cookies ni sesiones reutilizables.
- No se encontraron claves `service_role` o `sb_secret_*`, secretos de Flow, tokens privados de
  Vercel, contraseñas, cadenas de conexión, tokens de GitHub, claves privadas, encabezados
  `Authorization` ni cookies o sesiones reutilizables.

## Gitleaks

Gitleaks `8.30.1`, descargado desde su release oficial y verificado por SHA-256, informó:

- cero hallazgos en el snapshot de archivos versionados vigente;
- tres hallazgos históricos: dos JWT Supabase publicables y el `publicLookupToken` ficticio que
  fue reemplazado en la versión vigente por `PUBLIC_LOOKUP_TOKEN_EXAMPLE`.

Las claves publicables de Supabase identifican el proyecto y están diseñadas para estar en
aplicaciones cliente. No se encontró `service_role`, clave secreta de Supabase, secreto de Flow,
contraseña de base de datos, clave privada, token GitHub ni archivo local vigente versionado.

No se reescribió el historial por estos tres hallazgos permitidos.

## Información que sí quedaría pública

- todo el código, migraciones, decisiones técnicas y el historial de commits;
- URLs, identificadores de proyecto y claves Supabase publicables presentes históricamente;
- direcciones de contacto y metadatos de autores de commits;
- identificadores UUID de órdenes sandbox incluidos en una migración histórica;
- nombres de endpoints, tablas, políticas, proveedores y procedimientos operativos;
- imágenes del bucket público `product-images` cuando se conoce su URL.

Nada de lo anterior concede por sí solo privilegios administrativos. Aumenta, sin embargo, la
información disponible para reconocimiento externo y exige mantener RLS, autorización server-side
y rotación de secretos privadas.

## Controles verificados

- `.env`, `.env.local`, `.vercel/` y `supabase/.temp/` están ignorados.
- Las siete tablas del esquema `public` tienen RLS activa.
- Las RPC `SECURITY DEFINER` de negocio no son ejecutables por `anon` ni `authenticated`.
- El listado de metadatos del bucket `product-images` está limitado a administradores.
- Los archivos se sirven mediante el acceso público propio del bucket.
- Supabase Security Advisor no informa exposiciones de base de datos después de la migración
  `20260728224128_harden_public_exposure.sql`.
- GitHub Secret Scanning y Push Protection están activos.
- Dependabot Alerts, Dependabot Security Updates y Dependency Graph están activos.
- Code Scanning usa el setup predeterminado de CodeQL; la primera ejecución para Actions y
  JavaScript/TypeScript terminó correctamente.
- El ruleset `Proteccion de main` está activo y bloquea borrado y force push. Exige pull request,
  conversaciones resueltas y el check `Documentación, código y build`; el único bypass permanente
  corresponde al propietario del repositorio.

## Operación continua

- Activar protección contra contraseñas filtradas si el proyecto Supabase usa un plan que la
  incluya.
- Revisar alertas de Secret Scanning, Dependabot y Code Scanning cuando GitHub las genere.
- Conservar activo el ruleset de `main` y comprobarlo después de cambios de plan o visibilidad.
- No convertir en públicas las variables privadas de Vercel, Flow o Supabase.

Si en el futuro aparece una clave privilegiada en Git, se debe rotar primero. No basta con eliminar
el archivo del último commit porque el valor permanece en el historial.
