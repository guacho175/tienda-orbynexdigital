# Plan de correcciones: carrito y Flow API UI

Fecha: 2026-07-06  
Estado: pendiente de implementar  
Alcance: conectar la UI del carrito/checkout con Flow API dinamico sin romper WhatsApp checkout ni `payment_url`.

## Problema

Los endpoints server-side de Flow ya crean ordenes y recalculan el total desde Supabase, pero la UI todavia no ofrece un flujo de pago Flow para el carrito completo.

Actualmente:

- `src/routes/carrito.tsx` muestra subtotal y total del carrito.
- El boton principal lleva a `/checkout`.
- `src/routes/checkout.tsx` mantiene WhatsApp como flujo principal.
- `src/routes/checkout.tsx` solo muestra boton de pago externo si hay un unico item con `payment_url`.
- Para multiples productos, no hay boton Flow dinamico que cree una orden por la suma del carrito.
- El backend ya acepta varios `items` y calcula el monto real desde `public.products`.

## Objetivo

Agregar una experiencia de pago Flow para carritos de uno o mas productos:

- Mostrar claramente el total del carrito.
- Enviar todos los productos del carrito a `/api/flow/create-payment`.
- No enviar precios como fuente de verdad.
- Redirigir a Flow con la URL devuelta por el backend.
- Mantener WhatsApp checkout y `payment_url` como compatibilidad/fallback.
- No marcar pagado desde frontend.

## Archivos a revisar/tocar

- `src/routes/carrito.tsx`
- `src/routes/checkout.tsx`
- `src/store/cart.store.tsx`
- `src/config/commerce.config.ts`
- `src/components/ui/button.tsx` si hace falta estado loading/disabled consistente.
- `src/routeTree.gen.ts` si TanStack genera nuevas rutas.
- Futuro, no en esta correccion si se mantiene fuera de alcance: `src/routes/checkout.resultado.tsx` o equivalente para `/checkout/resultado`.

## Propuesta de UX

### Carrito

En `src/routes/carrito.tsx`:

- Mantener resumen actual con `Subtotal` y `Total`.
- Cambiar el CTA principal para que sea explicito:
  - `Continuar al checkout`
  - texto secundario: total visible.
- No llamar Flow directamente desde carrito si todavia se requieren datos de cliente en checkout.

### Checkout

En `src/routes/checkout.tsx`:

- Mantener formulario de cliente.
- Mantener boton WhatsApp existente como alternativa.
- Agregar boton principal o secundario:
  - `Pagar con Flow`
  - Debe mostrar estado `Creando pago...` mientras llama API.
- Enviar payload:

```ts
{
  items: items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  })),
  customer: {
    name,
    email,
    phone,
    comment,
  },
}
```

- No enviar `price`, `subtotal`, `total`, `payment_url`, ni nombres como fuente de verdad.
- Al recibir `redirectUrl`, redirigir con:

```ts
window.location.href = redirectUrl;
```

- No limpiar carrito al crear el pago.
- Limpiar carrito solo cuando una ruta de resultado confirme `paid`, o dejar pendiente hasta Fase de resultado.

## Reglas de compatibilidad

- No eliminar WhatsApp checkout.
- No eliminar `payment_url`.
- Si hay un unico producto con `payment_url`, puede seguir mostrandose como opcion externa.
- Para uno o mas productos, Flow API dinamico debe estar disponible si `commerceConfig` lo habilita.
- Si Flow API falla, mostrar error claro y mantener al usuario en checkout.

## Configuracion sugerida

Agregar flags a `src/config/commerce.config.ts`:

```ts
enableFlowCheckout: true,
flowCheckoutLabel: "Pagar con Flow",
```

Opcional:

```ts
flowCheckoutDescription: "Pago seguro con tarjetas y medios disponibles en Flow.",
```

## Casos de prueba manuales

### Carrito de un producto

1. Agregar producto activo al carrito.
2. Ir a `/carrito`.
3. Verificar que subtotal y total coincidan visualmente.
4. Ir a `/checkout`.
5. Completar datos de cliente con email aceptado por Flow sandbox.
6. Click en `Pagar con Flow`.
7. Esperar redireccion a `sandbox.flow.cl`.
8. Completar pago sandbox.
9. Confirmar estado con `GET /api/flow/order-status`.

### Carrito de multiples productos

1. Agregar dos productos activos o el mismo producto con cantidad mayor a 1.
2. Verificar que el total UI sume cantidades correctamente.
3. Click en `Pagar con Flow`.
4. Verificar que el backend cree una orden por el total recalculado.
5. Verificar en Supabase:
   - una fila en `orders`.
   - una fila por producto en `order_items`.
   - subtotales correctos.

### Manipulacion de precio cliente

1. Alterar localStorage manualmente cambiando `price`.
2. Ejecutar pago Flow.
3. Verificar que el monto Flow use precio real de `public.products`, no el valor manipulado.

### Producto inactivo o sin stock

1. Agregar producto al carrito.
2. Desactivar producto en Supabase o marcar `availability='out_of_stock'`.
3. Intentar `Pagar con Flow`.
4. Debe fallar con mensaje claro y sin redireccion.

## Casos de prueba automatizados/API

Usar:

```powershell
.\.agents\skills\flow-sandbox-testing\scripts\test-flow-sandbox-api.ps1 `
  -BaseUrl "https://tienda-orbynexdigital.vercel.app" `
  -ProductId "<product-id-activo>" `
  -Email "galindez175@gmail.com"
```

Luego completar Webpay sandbox segun:

```text
.agents/skills/flow-sandbox-testing/references/flow-sandbox-test-runbook.md
```

## Riesgos

- Duplicar CTAs puede confundir si WhatsApp, `payment_url` y Flow aparecen con igual jerarquia.
- Limpiar carrito antes de confirmar pago puede perder contexto si el usuario abandona Flow.
- Confiar en el total cliente seria inseguro; backend ya recalcula, mantener esa regla.
- `FLOW_RETURN_URL` apunta actualmente a `/checkout/resultado`, ruta que aun no existe.
- Webhook automatico debe revisarse: en pruebas, confirm manual funciono, pero una orden pagada no cambio automaticamente a `paid` sin llamar `/api/flow/confirm`.

## Orden recomendado

1. Agregar flags de Flow UI en `commerce.config.ts`.
2. Crear helper cliente `createFlowPayment` o funcion local en `checkout.tsx`.
3. Agregar boton `Pagar con Flow` en checkout con loading/error.
4. Enviar solo `productId` y `quantity`.
5. Redirigir a `redirectUrl`.
6. Mantener WhatsApp y `payment_url`.
7. Probar carrito unitario y multiple.
8. Probar sandbox Webpay completo.
9. Solo despues crear `/checkout/resultado` para mostrar estado y limpiar carrito con seguridad.
