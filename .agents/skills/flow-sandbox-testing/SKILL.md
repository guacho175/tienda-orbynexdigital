---
name: flow-sandbox-testing
description: "Use when testing Flow.cl sandbox checkout in this mini-commerce template or a reused ecommerce clone: Vercel Functions /api/flow/create-payment, /api/flow/confirm, /api/flow/order-status, Webpay sandbox payment, accepted test RUT/email behavior, webhook verification, and idempotency checks."
---

# Flow Sandbox Testing

Use this skill to validate a Flow.cl sandbox integration without rediscovering Flow/Webpay quirks.

## Required Context

- Prefer the production Vercel URL that serves the API functions.
- Do not print `FLOW_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Flow payment tokens, or full payment URLs unless the user explicitly needs to open the payment page.
- Use a real/accepted Flow sandbox payer email. In this project, `cliente@example.com` and `flowtest.orbynex@gmail.com` were rejected by Flow with `userEmail ... is not valid`; `galindez175@gmail.com` worked.
- For Webpay test bank auth, use RUT exactly `11.111.111-1` and password `123`. Formats `11111111-1` and `11111111` were rejected as `rut incorrecto`.

## Fast API Test

Run the bundled script from the repo root:

```powershell
.\.agents\skills\flow-sandbox-testing\scripts\test-flow-sandbox-api.ps1 `
  -BaseUrl "https://tienda-orbynexdigital.vercel.app" `
  -ProductId "<active-product-uuid>" `
  -Email "galindez175@gmail.com"
```

Use `-RevealPaymentUrl` only when you need the full Flow URL to complete Webpay in a browser.

Use `-ConfirmToken`, `-CommerceOrder`, and `-PublicLookupToken` after a browser payment only when you intentionally want to verify manual confirmation and idempotency.

## Full Browser Payment

Read `references/flow-sandbox-test-runbook.md` before guiding browser payment, webhook checks, or debugging sandbox failures.

Core flow:

1. Create a payment with a valid product and accepted email.
2. Open the returned Flow sandbox payment URL.
3. Select card payment.
4. Use card `4051885600446623`, future expiration such as `12/30`, CVV `123`.
5. Use bank RUT `11.111.111-1`, password `123`.
6. Choose `Aceptar`, then continue.
7. Expect return URL to load; if `/checkout/resultado` is not implemented, a 404 there is expected and does not prove payment failure.
8. Check `GET /api/flow/order-status`.
9. If automatic webhook did not update the order, call `POST /api/flow/confirm` manually with the Flow token and verify status becomes `paid`.
10. Repeat `POST /api/flow/confirm` and verify `idempotent:true`.

## Interpreting Results

- `apiKey not found`: credentials and `FLOW_BASE_URL` are from different Flow environments.
- `userEmail ... is not valid`: use a real/accepted sandbox account email.
- `status:"redirected"` with `flowStatus:"1"` or `"created"` after create: payment exists but is not paid yet.
- `status:"paid"` with `flowStatus:"2"`: payment confirmed.
- Confirm repeat returning `idempotent:true`: idempotency works.
- Webpay paid but local order stays `redirected`: automatic `FLOW_CONFIRMATION_URL` did not reach Vercel or Flow did not call it; verify the Vercel env value exactly.
