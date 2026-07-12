# Plan Maestro - Endurecimiento y Preparación de Plantilla (Orbynex Mini-Commerce)

Este documento define el Plan Maestro para el endurecimiento de seguridad, saneamiento de documentación, desacoplamiento y preparación del proyecto como plantilla reutilizable, estructurado en fases consecutivas verificables.

---

## 1. Línea Base del Proyecto

*   **Estado Git:**
    *   Rama activa: `codex/optimize-admin-auth-loading`
    *   Working Tree: Limpio (`nothing to commit, working tree clean`)
    *   Archivos sensibles (`.env`, `.env.local`, `.vercel`) correctamente excluidos y **no rastreados** en el repositorio.
*   **Typecheck (TypeScript):**
    *   Resultado: Limpio (cero errores tras ejecutar `npx tsc --noEmit`).
*   **Linter (ESLint):**
    *   Resultado: 4,804 errores de formato `prettier/prettier` debidos a retornos de carro en Windows (CRLF vs LF). No hay errores linter de lógica de negocio o sintaxis JS/TS.
*   **Tests:**
    *   No existen frameworks de pruebas unitarias configurados en `package.json` (como Vitest o Jest). La verificación se realiza mediante typecheck, build exitoso y verificación de imports en runtime.
*   **Build de Producción:**
    *   Vite + TanStack Start + Nitro compilando correctamente en segundo plano.
*   **Estructura de la API:**
    *   Endpoints de backend en `/api/flow/` (pagos), `/api/products/` (disponibilidad), `/api/stock/` (expiración de reservas). Estructurados como funciones serverless compatibles con Vercel.
*   **Rutas y Autenticación:**
    *   Rutas administradas con TanStack Router.
    *   Protección de vistas bajo el layout `_authenticated` en `src/routes/_authenticated/route.tsx` validado en cliente con `supabase.auth.getUser()`.
*   **Integración con Flow:**
    *   Integración funcional mediante firma de parámetros y callbacks HTTP para Chile (CLP/RUT).
*   **Documentación:**
    *   Documentación técnica viva en `docs/technical/` (00 al 15) bien redactada pero contaminada con reportes de desarrollo antiguos e implementados sueltos en `docs/`.

---

## 2. Matriz de Hallazgos y Endurecimiento

| ID | Hallazgo | Severidad Anterior | Severidad Validada | Evidencia | Archivos Involucrados | Solución | Riesgo de Regresión | Dependencias | Pruebas Requeridas | Estrategia de Reversión | Fase | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **H1** | Credenciales admin expuestas en texto plano | Crítica | Media (Cuenta de Prueba) | Cuenta y pass de test escritas en markdown | `datos Pruebas.md` (Obsidian) | Reemplazar credenciales reales por placeholders (`<solicitar_al_responsable>`). | Nulo | Ninguna | Inspección visual de la documentación. | Restaurar archivo desde git commit previo. | Fase 1 | Pendiente |
| **H2** | Secretos locales expuestos en OneDrive | Crítica | Baja (OneDrive No Sincronizado) | Carpeta local no sincronizada por configuración | `.env`, `.env.example` | Registrar aclaratoria en documentación. Securizar manejo local de variables. | Nulo | Ninguna | Verificación de sincronización y gitignore. | N/A | Fase 1 | Pendiente |
| **H3** | Brecha de importación de clave service_role | Crítica | Alta | `client.server.ts` expuesto a imports desde componentes cliente | `src/integrations/supabase/client.server.ts`, `vite.config.ts` | Extender la directiva `importProtection` en `vite.config.ts` para cubrir `src/integrations/**/*.server.ts`. | Bajo | Configuración de Vite/Vinxi | Crear importación de prueba y verificar fallo de build controlado. | Deshacer cambios en `vite.config.ts`. | Fase 2 | Pendiente |
| **H4** | Acumulación de logs y archivos temporales | Media | Baja | Logs `.log` y `.err.log` en el raíz del proyecto | Raíz del proyecto | Mover logs a una ubicación ignorada, añadir script `clean:logs` en `package.json`. | Nulo | Scripts npm | Ejecutar script de limpieza y verificar remoción de logs. | N/A | Fase 3 | Pendiente |
| **H5** | Desorganización de la documentación | Baja | Baja | Archivos de planes y reportes pasados en la raíz de `docs/` | `docs/` | Crear `docs/archive/` y reubicar archivos históricos con `git mv`. Crear índice en `docs/README.md`. | Bajo (enlaces rotos) | Enlaces markdown | Verificar que no haya enlaces markdown rotos. | Ejecutar `git mv` inverso. | Fase 4 | Pendiente |
| **H6** | Identidad genérica en el package.json | Baja | Baja | `"name": "tanstack_start_ts"` | `package.json` | Cambiar nombre a `orbynex-mini-commerce` y documentar variables personalizables. | Nulo | Ninguna | Verificar que la app compile con el nuevo nombre. | Revertir nombre en `package.json`. | Fase 5 | Pendiente |
| **H7** | Acoplamiento de API a Vercel | Media | Media | Handlers HTTP que importan tipos nativos de Node/Vercel directamente | `/api/**/*` | Refactorizar los handlers para delegar la lógica a controladores delgados e independientes. | Medio (Regresión en API) | Lógica de pagos | Simular llamadas a la API y verificar consistencia de respuestas. | Revertir lógica en handlers de API. | Fase 6 | Pendiente |
| **H8** | Acoplamiento geográfico y de pasarela de pago | Media | Media | Componentes y servicios con lógica directa de Flow/Chile | `src/routes/checkout.tsx` | Extraer adaptador de pagos e internacionalizar la moneda, RUT y locale. | Medio | Lógica de Checkout | Probar flujo de checkout con el adaptador de Flow activo. | Revertir abstracción de checkout. | Fase 7 | Pendiente |

---

## 3. Plan de Trabajo por Fases

*   **Fase 1: Secretos, Variables de Entorno y Documentación Sensible**
    *   Sanitizar credenciales de prueba.
    *   Crear/actualizar `.env.example` y redactar `docs/security/GESTION-DE-SECRETOS-Y-ENTORNOS.md`.
    *   Implementar validador de variables de entorno seguro para cliente/servidor.
*   **Fase 2: Protección de Código Exclusivo de Servidor**
    *   Configurar `importProtection` para `src/integrations/**/*.server.ts` y subdirectorios de servidor.
    *   Realizar test negativo para asegurar que el compilador rechace imports del lado del cliente.
*   **Fase 3: Limpieza de Logs y Artefactos Temporales**
    *   Identificar y remover logs de Codex, Vite y Wrangler.
    *   Añadir script `clean:logs` al `package.json`.
*   **Fase 4: Organización de Documentación**
    *   Crear carpetas de archivo y mover reportes y planes históricos.
    *   Crear índice principal en `docs/README.md`.
*   **Fase 5: Identidad del Proyecto y Configuración de Plantilla**
    *   Actualizar metadatos en `package.json`.
    *   Documentar lista de variables a cambiar por futuros clientes.
*   **Fase 6: Portabilidad de la Capa API**
    *   Desacoplar lógica en controladores y usar los endpoints de Vercel como adaptadores delgados.
*   **Fase 7: Abstracción de Pagos y Configuración Regional**
    *   Diseñar interfaz `PaymentProvider` y centralizar config regional de Chile (CLP/RUT/Flow).
*   **Fase 8: README y Documentación Operativa**
    *   Reemplazar y actualizar el `README.md` del raíz.
*   **Fase 9: Pruebas, Regresión y Verificación Final**
    *   Validar flujos críticos de la tienda (Auth, Catálogo, Checkout y Flow Sandbox).
*   **Fase 10: Reporte Final y Cierre**
    *   Crear reporte de endurecimiento final.
