---
name: supabase-product-query
description: Use when this repo needs to query Supabase products from local .env, especially to get the latest active product and generate a Flow create-payment curl. Prefer SUPABASE_PUBLISHABLE_KEY for public active products; do not use sb_secret keys against Supabase REST for browser-style requests.
---

# Supabase Product Query

## Purpose

Use this skill in `tienda-orbynexdigital` when the user asks for product data from the current Supabase backend, asks for the latest product, or wants a complete `curl` for `/api/flow/create-payment`.

## Rules

- Read variables from the repo root `.env`.
- Use `SUPABASE_URL` plus `SUPABASE_PUBLISHABLE_KEY` for public reads of active products through `/rest/v1/products`.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` or `sb_secret_...` with browser-style REST requests; Supabase may reject it with `Forbidden use of secret API key in browser`.
- Do not print API keys, service keys, Flow secrets, or Authorization headers.
- If product must include inactive/private rows, ask for a SQL Editor query or a safe DB connection method instead of bypassing RLS through REST.
- For Flow test curls, use `APP_PUBLIC_URL` from `.env` unless the user provides another deployment URL.

## Preferred Workflow

1. Run the helper script:

```powershell
.\.agents\skills\supabase-product-query\scripts\get-latest-product-flow-curl.ps1
```

2. Use the returned product id/name/price for context.
3. Give the user the generated `curl` command.
4. If the user asks you to execute it, run the curl/Invoke-RestMethod against the Vercel URL, not the Lovable URL unless explicitly requested.

## Manual Query

For Supabase SQL Editor:

```sql
select
  id,
  name,
  slug,
  price,
  currency,
  is_active,
  availability,
  payment_url,
  payment_button_label,
  created_at
from public.products
order by created_at desc
limit 1;
```

For REST from PowerShell, use the publishable key:

```powershell
$endpoint = "$env:SUPABASE_URL/rest/v1/products?select=id,name,slug,price,currency,is_active,availability,created_at&is_active=eq.true&order=created_at.desc&limit=1"
$headers = @{ apikey = $env:SUPABASE_PUBLISHABLE_KEY; Authorization = "Bearer $env:SUPABASE_PUBLISHABLE_KEY" }
Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
```

## Known Repo Details

- Current Flow endpoint path: `/api/flow/create-payment`.
- Current product table: `public.products`.
- Public RLS permits active products only.
- Flow endpoints exist on Vercel deployments that include the `api/flow/*` files; Lovable-hosted URLs may return 404 for those functions.
