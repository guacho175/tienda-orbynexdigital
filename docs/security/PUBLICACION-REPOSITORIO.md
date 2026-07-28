# Publicación segura del repositorio

Última auditoría: 2026-07-28.

## Dictamen

El repositorio puede hacerse público desde la perspectiva de secretos versionados, pero su
visibilidad debe cambiarse solo mediante una decisión explícita. Actualmente sigue privado.

La auditoría incluyó archivos vigentes, cambios pendientes y el historial Git completo. Gitleaks
`8.30.1`, descargado desde su release oficial y verificado por SHA-256, informó tres hallazgos:

- dos JWT históricos bajo variables `SUPABASE_PUBLISHABLE_KEY` y
  `VITE_SUPABASE_PUBLISHABLE_KEY`;
- un `publicLookupToken` ficticio incluido como respuesta de ejemplo.

Las claves publicables de Supabase identifican el proyecto y están diseñadas para estar en
aplicaciones cliente. No se encontró `service_role`, clave secreta de Supabase, secreto de Flow,
contraseña de base de datos, clave privada, token GitHub ni archivo local vigente versionado.

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

## Pendientes no bloqueantes para la visibilidad

- Activar protección contra contraseñas filtradas si el proyecto usa Supabase Pro o superior.
- Habilitar Secret Scanning y protección de push en GitHub al cambiar la visibilidad.
- Mantener revisión de dependencias y protección de la rama `main`.
- No convertir en públicas las variables privadas de Vercel, Flow o Supabase.

Si en el futuro aparece una clave privilegiada en Git, se debe rotar primero. No basta con eliminar
el archivo del último commit porque el valor permanece en el historial.
