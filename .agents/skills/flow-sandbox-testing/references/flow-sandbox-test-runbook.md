# Flow Sandbox Test Runbook

This runbook captures the working sandbox path for this template and reusable Flow mini-commerce clones.

## Environment Checklist

Vercel must have server-side variables in Production and Preview:

- `FLOW_API_KEY`
- `FLOW_SECRET_KEY`
- `FLOW_BASE_URL=https://sandbox.flow.cl/api`
- `FLOW_RETURN_URL`
- `FLOW_CONFIRMATION_URL=https://tienda-orbynexdigital.vercel.app/api/flow/confirm`
- `APP_PUBLIC_URL=https://tienda-orbynexdigital.vercel.app`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Vercel `Sensitive` is safe. It hides values but does not prevent runtime access.

If Flow returns `apiKey not found`, the API key is not valid for the configured `FLOW_BASE_URL`.

## Working Test Data

Flow/Webpay sandbox accepted:

- Payer email: `galindez175@gmail.com`
- Card: `4051885600446623`
- Expiration: any future date, for example `12/30`
- CVV: `123`
- Bank RUT: `11.111.111-1`
- Bank password: `123`
- Bank decision: `Aceptar`

Observed rejected data:

- `cliente@example.com`: rejected by Flow as invalid payer email.
- `flowtest.orbynex@gmail.com`: rejected by Flow as invalid payer email.
- `11111111-1`: rejected by Webpay bank auth as `rut incorrecto`.
- `11111111`: rejected by Webpay bank auth as `rut incorrecto`.

## Automated API Battery

From repo root:

```powershell
.\.agents\skills\flow-sandbox-testing\scripts\test-flow-sandbox-api.ps1 `
  -BaseUrl "https://tienda-orbynexdigital.vercel.app" `
  -ProductId "fb9ae1c8-42fd-44d4-a4d3-d3b6dde28112" `
  -Email "galindez175@gmail.com" `
  -RevealPaymentUrl
```

Expected results before browser payment:

- `GET /api/flow/create-payment`: `405`
- invalid create payload: `400`
- missing product: `400`
- `GET /api/flow/order-status` without params: `400`
- `POST /api/flow/confirm` without token: `400`
- `GET /api/flow/confirm`: `405`
- valid create payment: `200` with `commerceOrder`, `publicLookupToken`, and Flow redirect URL.

## Browser Payment Steps

1. Open the full Flow redirect URL from the create-payment response.
2. Confirm the page says sandbox/test site and shows the expected order and amount.
3. Select `Tarjetas de credito y debito`.
4. Click `Pagar ahora`.
5. In Webpay, choose `Tarjetas`.
6. Enter card `4051885600446623`.
7. Click `Continuar`.
8. Enter expiration `12/30` and CVV `123`.
9. Click `Pagar`.
10. On bank auth, enter RUT `11.111.111-1` and password `123`.
11. Click `Aceptar`.
12. Leave the decision dropdown on `Aceptar`.
13. Click `Continuar`.

The browser may return to `/checkout/resultado`. If that route is not implemented yet, a 404 is expected and does not block backend payment validation.

## Order Status Checks

Before payment, after create:

```http
GET /api/flow/order-status?commerceOrder=<commerceOrder>&publicLookupToken=<publicLookupToken>
```

Expected:

```json
{
  "status": "redirected",
  "flowStatus": "created or 1",
  "paidAt": null
}
```

After browser payment, first check without manual confirm. If webhook works, expected:

```json
{
  "status": "paid",
  "flowStatus": "2"
}
```

Observed in this project during testing: automatic webhook did not update the second order. It stayed:

```json
{
  "status": "redirected",
  "flowStatus": "created",
  "paidAt": null
}
```

Manual confirm then worked:

```powershell
curl.exe -i -s -X POST "https://tienda-orbynexdigital.vercel.app/api/flow/confirm" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data "token=<flow-token>"
```

Expected manual confirm after Webpay accepted:

```json
{
  "ok": true,
  "status": "paid",
  "commerceOrder": "<commerceOrder>"
}
```

Expected repeat confirm:

```json
{
  "ok": true,
  "status": "paid",
  "commerceOrder": "<commerceOrder>",
  "idempotent": true
}
```

Final status should be:

```json
{
  "status": "paid",
  "flowStatus": "2",
  "paidAt": "<timestamp>",
  "confirmedAt": "<timestamp>"
}
```

## Troubleshooting

`apiKey not found`:

- `FLOW_BASE_URL` and Flow credentials do not belong to the same environment.
- Sandbox keys must come from sandbox Flow.
- Production keys must use `https://www.flow.cl/api`.

`The userEmail ... is not valid`:

- Use a real/accepted sandbox payer email.
- For this project, `galindez175@gmail.com` worked.

`rut incorrecto`:

- Use exactly `11.111.111-1`.
- Do not use `11111111-1` or `11111111`.

Create payment succeeds but return URL is 404:

- This is expected until `/checkout/resultado` exists.
- Do not mark payment failed just because return route is missing.

Webpay accepted but local order remains `redirected`:

- Check Vercel runtime logs for `/api/flow/confirm`.
- Verify `FLOW_CONFIRMATION_URL` is the deployed Vercel API URL, not Lovable.
- Run manual confirm to prove `payment/getStatus` and local idempotency.
