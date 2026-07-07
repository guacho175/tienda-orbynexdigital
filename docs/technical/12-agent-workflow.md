# 12 - Flujo de Trabajo para Futuros Agentes de IA

Este documento establece las reglas obligatorias de desarrollo, las restricciones del sistema y el flujo de trabajo que deben seguir los agentes de inteligencia artificial y desarrolladores que operen en este repositorio en el futuro.

---

## 1. Reglas de Oro Inquebrantables

Como agente que opera en este codebase, debes obedecer estrictamente las siguientes reglas sin excepción:

1.  **NO borrar documentación existente**: Toda la documentación técnica bajo `docs/` y el archivo `README.md` principal deben conservarse y actualizarse incrementalmente. No reescribas ni elimines explicaciones de decisiones de arquitectura previas.
2.  **NO modificar el Backend sin instrucción explícita**: El backend (migraciones SQL, RLS, Grants, RPCs, autenticación y base de datos) está estabilizado y funciona correctamente. Cualquier desarrollo nuevo debe centrarse puramente en optimizaciones del frontend y la interfaz de usuario.
3.  **NO exponer secretos criptográficos**: Nunca escribas ni dejes rastros de tokens reales, service role keys, contraseñas o firmas en archivos de código, documentación o commits. Utiliza exclusivamente las variables de entorno de Node.js o variables prefijadas con `VITE_` en el cliente.
4.  **NO tocar `src/routes/_authenticated/route.tsx`**: Este layout controla la protección de rutas administrativas y la autenticación del panel. Modificarlo sin supervisión puede abrir brechas de seguridad o romper el acceso al panel administrativo de la tienda.
5.  **Mantener el soporte de Checkout Híbrido**: Asegura siempre la coexistencia de ambos flujos de compra: el pago online automatizado mediante Flow.cl (con reservas de stock) y el fallback de enlaces de pago externos directos (`payment_url`) en fichas de producto.
6.  **No alterar la idempotencia del Webhook**: Conserva el flujo de confirmación transaccional server-side en el servidor serverless (`api/flow/confirm.ts`), manteniendo la consulta GET directa a Flow para validar el estado de los pagos y prevenir ataques de inyección.

---

## 2. Protocolo de Modificación del Frontend

Antes de implementar cambios visuales o funcionales en el cliente:

1.  **Inspeccionar `src/utils/inventory.ts`**: Si vas a modificar cómo se visualizan las tarjetas de producto, botones de compra o mensajes en el catálogo, verifica que tu lógica se base en las funciones utilitarias de inventario (`canPurchase`, `isSoldOut`, `isTemporarilyReserved`).
2.  **Comprobar la integración del hot-reload de disponibilidad**: Al renderizar listados de productos, asegúrate de envolverlos en la función `applyPublicAvailability` para garantizar que la verificación de reservas en caliente se mantenga funcional y el stock mostrado sea preciso.
3.  **Respetar la optimización de imágenes en el cliente**: Cualquier modificación al formulario del panel administrativo para subir imágenes de catálogo debe obligatoriamente procesar los archivos multimedia en las tres variantes WebP optimizadas utilizando el motor canvas local (`optimizeProductImageVariants`) antes de realizar la subida al Storage.

---

## 3. Checklist Obligatoria de Verificación (Definición de Terminado)

Antes de reportar una tarea como completada, debes realizar los siguientes chequeos y documentarlos:

*   [ ] **Construcción Exitosa**: El proyecto compila localmente sin errores de compilación de TypeScript o Vite (`bun build`).
*   [ ] **Verificación de Lint y Formato**: El código cumple con las reglas de estilo del linter y formateador (`bun lint` y `bun format`).
*   [ ] **Validación de Git Status**: Corre `git status` y `git diff --stat` para asegurar que no se hayan modificado archivos de base de datos (`supabase/`), archivos de la API de confirmación, ni archivos de configuración crítica sin autorización expresa.
*   [ ] **Ausencia de Secretos**: Revisar que ningún archivo modificado contenga llaves de API o credenciales reales.
