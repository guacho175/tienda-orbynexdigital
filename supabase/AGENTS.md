# Instrucciones para Supabase

Estas reglas complementan el `AGENTS.md` raíz para cualquier cambio bajo `supabase/`.

## Evidencia y alcance

- Lee únicamente las migraciones y documentos relacionados con el objeto afectado.
- Crea cambios de esquema mediante una migración nueva; no edites migraciones ya aplicadas.
- No ejecutes SQL contra entornos remotos sin autorización explícita.
- No leas `SUPABASE_DB_URL`, service-role keys ni otros secretos.

## Seguridad

- Toda tabla nueva en un esquema expuesto debe tener RLS y grants explícitos.
- No uses metadata editable por usuarios para autorizar.
- No agregues `SECURITY DEFINER` para resolver permisos. Si es imprescindible, restringe
  `EXECUTE`, fija `search_path` y revisa el llamador.
- Las funciones críticas de checkout no deben quedar ejecutables por `PUBLIC`, `anon` o
  `authenticated` salvo que el contrato lo requiera y valide identidad/autorización.
- No abras escritura directa sobre `orders`, `order_items` o `stock_reservations`.

## Documentación relacionada

- Modelo: `docs/technical/03-domain-model.md`.
- Inventario: `docs/technical/06-inventory-reservations.md`.
- RLS y funciones: `docs/technical/07-supabase-security.md`.
- Operación y aplicación de migraciones: `docs/technical/11-deployment.md`.

## Validación

Descubre primero los comandos disponibles con `supabase --help`. Cuando exista un entorno
seguro y autorizado, ejecuta lint/advisors y una consulta acotada que pruebe el cambio. Si no
puedes validar contra una base real, decláralo expresamente; revisar SQL no equivale a aplicarlo.
