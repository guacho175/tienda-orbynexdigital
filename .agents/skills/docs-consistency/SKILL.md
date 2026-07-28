---
name: docs-consistency
description: Mantiene código y documentación sincronizados en tienda-orbynexdigital. Usar al implementar cambios que puedan afectar comportamiento, API, configuración, arquitectura, datos, migraciones, dependencias, instalación, despliegue, seguridad u operación, y al auditar contradicciones documentales.
---

# Consistencia documental

## Propósito

Actualizar la superficie documental mínima y dejar evidencia verificable. Esta Skill no reemplaza
`AGENTS.md`, `docs/README.md` ni las fuentes técnicas canónicas.

## Flujo

1. Ejecuta `git status --short --branch` y revisa el diff relevante.
2. Identifica los archivos de código/configuración afectados y el comportamiento o contrato que
   podrían cambiar.
3. Usa `docs/README.md` para localizar únicamente la fuente canónica relacionada.
4. Contrasta Markdown con código, manifiestos, migraciones y configuración. Si hay contradicción,
   corrige la fuente activa y conserva historia solo bajo `docs/archive/`.
5. Actualiza la documentación en el mismo cambio o escribe una razón concreta de “sin impacto”.
6. Ejecuta:

   ```bash
   npm run check:docs
   npm run test:docs
   ```

7. Ejecuta las validaciones técnicas indicadas por `AGENTS.md` y por el módulo afectado.
8. Revisa el diff final y confirma que no contiene secretos, rutas privadas ni artefactos.

## Límites

- No abras toda `docs/` ni `docs/archive/` por defecto.
- No crees planes persistentes para cambios pequeños.
- No uses `PROJECT_STATE.md` como bitácora.
- No prometas sincronización semántica perfecta: el script detecta señales verificables y la
  revisión humana confirma significado.
- No modifiques documentación sin impacto comprobable para satisfacer mecánicamente un check.

## Reporte

Declara:

- archivos de implementación;
- documentos actualizados, o razón de “sin impacto documental”;
- comandos ejecutados y resultados;
- validaciones no realizadas y motivo;
- contradicciones o riesgos que continúan pendientes.
