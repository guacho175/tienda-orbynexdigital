# Flow Sandbox Testing

Este documento deja el procedimiento reusable para probar Flow sandbox en este template mini-commerce y en clones futuros.

## Skill Reusable

Usar la skill local:

```text
.agents/skills/flow-sandbox-testing
```

La skill contiene:

- `SKILL.md`: reglas operativas para agentes.
- `references/flow-sandbox-test-runbook.md`: flujo completo y troubleshooting.
- `scripts/test-flow-sandbox-api.ps1`: bateria API automatizada.

## Datos Que Funcionaron

- Email pagador: `galindez175@gmail.com`
- Tarjeta: `4051885600446623`
- Fecha: cualquier fecha futura, por ejemplo `12/30`
- CVV: `123`
- RUT banco: `11.111.111-1`
- Clave banco: `123`
- Decision banco: `Aceptar`

Datos que fallaron durante pruebas:

- `cliente@example.com`: Flow lo rechazo como email no valido.
- `flowtest.orbynex@gmail.com`: Flow lo rechazo como email no valido.
- `11111111-1`: Webpay lo rechazo como `rut incorrecto`.
- `11111111`: Webpay lo rechazo como `rut incorrecto`.

## Ejecutar Pruebas API

Desde la raiz del repo:

```powershell
.\.agents\skills\flow-sandbox-testing\scripts\test-flow-sandbox-api.ps1 `
  -BaseUrl "https://tienda-orbynexdigital.vercel.app" `
  -ProductId "fb9ae1c8-42fd-44d4-a4d3-d3b6dde28112" `
  -Email "galindez175@gmail.com" `
  -RevealPaymentUrl
```

La bandera `-RevealPaymentUrl` imprime la URL completa de Flow para abrirla en navegador. Sin esa bandera, el token se oculta.

Resultados esperados:

- `GET /api/flow/create-payment` -> `405`
- payload invalido -> `400`
- producto inexistente -> `400`
- `GET /api/flow/order-status` sin params -> `400`
- `POST /api/flow/confirm` sin token -> `400`
- `GET /api/flow/confirm` -> `405`
- create-payment valido -> `200`
- order-status despues de crear -> `200`, estado `redirected` o equivalente.

## Ejecutar Pago Sandbox En Navegador

1. Abrir la URL completa entregada por `create-payment`.
2. Verificar que Flow muestre entorno de pruebas, monto y `commerceOrder`.
3. Seleccionar tarjetas si no esta seleccionado.
4. Click en `Pagar ahora`.
5. En Webpay, click en `Tarjetas`.
6. Ingresar tarjeta `4051885600446623`.
7. Click en `Continuar`.
8. Ingresar fecha futura, por ejemplo `12/30`.
9. Ingresar CVV `123`.
10. Click en `Pagar`.
11. En autenticacion bancaria ingresar RUT `11.111.111-1`.
12. Ingresar clave `123`.
13. Click en `Aceptar`.
14. En la pantalla de decision dejar `Aceptar`.
15. Click en `Continuar`.

Puede retornar a `/checkout/resultado`. Si esa ruta aun no existe, el 404 es esperado y no significa que el pago falle.

## Confirmar Estado

Consultar:

```powershell
curl.exe -i -s "https://tienda-orbynexdigital.vercel.app/api/flow/order-status?commerceOrder=<commerceOrder>&publicLookupToken=<publicLookupToken>"
```

Si webhook automatico funciona, despues de pagar debe verse:

```json
{
  "status": "paid",
  "flowStatus": "2"
}
```

Si sigue `redirected`, confirmar manualmente:

```powershell
curl.exe -i -s -X POST "https://tienda-orbynexdigital.vercel.app/api/flow/confirm" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data "token=<flow-token>"
```

Respuesta esperada:

```json
{
  "ok": true,
  "status": "paid",
  "commerceOrder": "<commerceOrder>"
}
```

Repetir la misma llamada para probar idempotencia:

```json
{
  "ok": true,
  "status": "paid",
  "commerceOrder": "<commerceOrder>",
  "idempotent": true
}
```

## Observacion Actual Del Proyecto

Durante la prueba completa del 6 de julio de 2026:

- Flow sandbox creo pagos correctamente.
- Webpay sandbox acepto el pago.
- `POST /api/flow/confirm` manual marco la orden como `paid`.
- La repeticion de `confirm` devolvio `idempotent:true`.
- Una orden pagada sin confirm manual no paso automaticamente a `paid` dentro del tiempo observado.

Pendiente a revisar si se quiere webhook automatico:

```text
FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.vercel.app/api/flow/confirm
```

Debe estar configurada exactamente asi en Vercel para Production y Preview, y el deployment debe haberse regenerado despues del cambio.
