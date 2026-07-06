param(
  [string]$EnvPath = ".env",
  [string]$ProductId = "",
  [int]$Quantity = 1,
  [string]$CustomerName = "Cliente Demo",
  [string]$CustomerEmail = "cliente@example.com",
  [string]$CustomerPhone = "+56912345678",
  [string]$CustomerComment = "Prueba sandbox",
  [string]$AppUrl = ""
)

$ErrorActionPreference = "Stop"

function Read-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "No existe el archivo .env en $Path"
  }

  $vars = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*#' -or $line.Trim() -eq "") { continue }
    if ($line -match '^([^=]+)=(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      $vars[$name] = $value
    }
  }
  return $vars
}

$vars = Read-DotEnv -Path $EnvPath
$supabaseUrl = $vars["SUPABASE_URL"]
$publishableKey = $vars["SUPABASE_PUBLISHABLE_KEY"]
if (-not $supabaseUrl -or -not $publishableKey) {
  throw "Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en .env"
}

if (-not $AppUrl) {
  $AppUrl = $vars["APP_PUBLIC_URL"]
}
if (-not $AppUrl) {
  throw "Falta APP_PUBLIC_URL en .env o parametro -AppUrl"
}
$AppUrl = $AppUrl.TrimEnd("/")

$select = "id,name,slug,price,currency,is_active,availability,payment_url,payment_button_label,created_at"
if ($ProductId) {
  $endpoint = "$supabaseUrl/rest/v1/products?select=$select&id=eq.$ProductId&limit=1"
} else {
  $endpoint = "$supabaseUrl/rest/v1/products?select=$select&is_active=eq.true&order=created_at.desc&limit=1"
}

$headers = @{
  apikey = $publishableKey
  Authorization = "Bearer $publishableKey"
}

$products = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
if (-not $products -or $products.Count -eq 0) {
  throw "No se encontro producto activo consultable por RLS publica"
}

$product = @($products)[0]
$bodyObject = @{
  items = @(
    @{
      productId = $product.id
      quantity = $Quantity
    }
  )
  customer = @{
    name = $CustomerName
    email = $CustomerEmail
    phone = $CustomerPhone
    comment = $CustomerComment
  }
}
$body = $bodyObject | ConvertTo-Json -Depth 8
$bodySingleLine = $body -replace "`r?`n", "" -replace "'", "'\''"
$curl = "curl -X POST `"$AppUrl/api/flow/create-payment`" -H `"Content-Type: application/json`" -d '$bodySingleLine'"

[pscustomobject]@{
  product = [pscustomobject]@{
    id = $product.id
    name = $product.name
    slug = $product.slug
    price = $product.price
    currency = $product.currency
    is_active = $product.is_active
    availability = $product.availability
    created_at = $product.created_at
  }
  curl = $curl
} | ConvertTo-Json -Depth 8
