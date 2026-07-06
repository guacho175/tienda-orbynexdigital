param(
  [string]$BaseUrl = "https://tienda-orbynexdigital.vercel.app",
  [string]$ProductId = "",
  [string]$Email = "",
  [string]$Name = "Cliente Sandbox",
  [string]$Phone = "+56912345678",
  [string]$Comment = "Prueba sandbox Codex",
  [switch]$SkipValidCreate,
  [switch]$RevealPaymentUrl,
  [string]$ConfirmToken = "",
  [string]$CommerceOrder = "",
  [string]$PublicLookupToken = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

function New-HttpClient {
  $client = [System.Net.Http.HttpClient]::new()
  $client.Timeout = [TimeSpan]::FromSeconds(60)
  return $client
}

function Invoke-FlowHttp {
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$Client,
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [string]$Body = "",
    [string]$ContentType = "application/json"
  )

  $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($Method), $Uri)
  if ($Body -ne "") {
    $request.Content = [System.Net.Http.StringContent]::new($Body, [System.Text.Encoding]::UTF8, $ContentType)
  }

  $response = $Client.SendAsync($request).GetAwaiter().GetResult()
  $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

  return [pscustomobject]@{
    label = $Label
    status = [int]$response.StatusCode
    ok = $response.IsSuccessStatusCode
    raw = $text
    body = Hide-FlowSensitiveText -Text $text
  }
}

function Hide-FlowSensitiveText {
  param([string]$Text)
  if (-not $Text) { return $Text }
  return $Text `
    -replace '([?&]token=)[^"&]+', '$1[REDACTED]' `
    -replace '("token"\s*:\s*")[^"]+', '$1[REDACTED]' `
    -replace '("redirectUrl"\s*:\s*")([^"]*token=)[^"]+', '$1$2[REDACTED]'
}

function Get-QueryValue {
  param(
    [Parameter(Mandatory = $true)][Uri]$Uri,
    [Parameter(Mandatory = $true)][string]$Name
  )

  $query = $Uri.Query.TrimStart("?")
  foreach ($part in $query -split "&") {
    if (-not $part) { continue }
    $pair = $part -split "=", 2
    $key = [uri]::UnescapeDataString($pair[0])
    if ($key -eq $Name) {
      if ($pair.Count -lt 2) { return "" }
      return [uri]::UnescapeDataString($pair[1])
    }
  }
  return $null
}

function Add-Result {
  param(
    [System.Collections.Generic.List[object]]$Results,
    [object]$Result,
    [int[]]$Expected
  )

  $null = $Results.Add([pscustomobject]@{
    label = $Result.label
    status = $Result.status
    expected = ($Expected -join ",")
    pass = $Expected -contains $Result.status
    body = $Result.body
  })
}

$BaseUrl = $BaseUrl.TrimEnd("/")
$client = New-HttpClient
$results = [System.Collections.Generic.List[object]]::new()

Add-Result $results (Invoke-FlowHttp $client "GET create-payment rejects wrong method" "GET" "$BaseUrl/api/flow/create-payment") @(405)
Add-Result $results (Invoke-FlowHttp $client "POST create-payment rejects invalid payload" "POST" "$BaseUrl/api/flow/create-payment" "{}") @(400)

$missingProductBody = @{
  items = @(@{ productId = "00000000-0000-4000-8000-000000000000"; quantity = 1 })
  customer = @{ name = $Name; email = $(if ($Email) { $Email } else { "galindez175@gmail.com" }); phone = $Phone; comment = "Prueba producto inexistente" }
} | ConvertTo-Json -Depth 8 -Compress
Add-Result $results (Invoke-FlowHttp $client "POST create-payment rejects missing product" "POST" "$BaseUrl/api/flow/create-payment" $missingProductBody) @(400)

Add-Result $results (Invoke-FlowHttp $client "GET order-status rejects missing params" "GET" "$BaseUrl/api/flow/order-status") @(400)
Add-Result $results (Invoke-FlowHttp $client "POST confirm rejects missing token" "POST" "$BaseUrl/api/flow/confirm" "" "application/x-www-form-urlencoded") @(400)
Add-Result $results (Invoke-FlowHttp $client "GET confirm rejects wrong method" "GET" "$BaseUrl/api/flow/confirm") @(405)

$created = $null
if (-not $SkipValidCreate) {
  if (-not $ProductId) {
    throw "ProductId is required unless -SkipValidCreate is set."
  }
  if (-not $Email) {
    throw "Email is required for valid create-payment. Use a real Flow sandbox accepted email."
  }

  $createBody = @{
    items = @(@{ productId = $ProductId; quantity = 1 })
    customer = @{ name = $Name; email = $Email; phone = $Phone; comment = $Comment }
  } | ConvertTo-Json -Depth 8 -Compress

  $createResult = Invoke-FlowHttp $client "POST create-payment valid sandbox order" "POST" "$BaseUrl/api/flow/create-payment" $createBody
  Add-Result $results $createResult @(200)

  if ($createResult.status -eq 200) {
    $created = $createResult.raw | ConvertFrom-Json
    $redirect = [Uri]$created.redirectUrl
    $token = Get-QueryValue -Uri $redirect -Name "token"

    $createdSummary = [pscustomobject]@{
      commerceOrder = $created.commerceOrder
      publicLookupToken = "[REDACTED]"
      flowToken = "[REDACTED]"
      redirectUrl = $(if ($RevealPaymentUrl) { $created.redirectUrl } else { Hide-FlowSensitiveText $created.redirectUrl })
      nextStep = "Open redirectUrl in browser, pay with card 4051885600446623, exp 12/30, CVV 123, RUT 11.111.111-1, password 123."
    }

    $statusUrl = "$BaseUrl/api/flow/order-status?commerceOrder=$([uri]::EscapeDataString($created.commerceOrder))&publicLookupToken=$([uri]::EscapeDataString($created.publicLookupToken))"
    Add-Result $results (Invoke-FlowHttp $client "GET order-status after create" "GET" $statusUrl) @(200)

    if ($ConfirmToken) {
      Write-Warning "Both valid create and -ConfirmToken were provided. Confirmation will use -ConfirmToken, not the newly created token."
    }
  }
}

if ($ConfirmToken) {
  $confirmBody = "token=$([uri]::EscapeDataString($ConfirmToken))"
  Add-Result $results (Invoke-FlowHttp $client "POST confirm with token" "POST" "$BaseUrl/api/flow/confirm" $confirmBody "application/x-www-form-urlencoded") @(200)
  Add-Result $results (Invoke-FlowHttp $client "POST confirm repeat idempotency" "POST" "$BaseUrl/api/flow/confirm" $confirmBody "application/x-www-form-urlencoded") @(200)

  if ($CommerceOrder -and $PublicLookupToken) {
    $finalStatusUrl = "$BaseUrl/api/flow/order-status?commerceOrder=$([uri]::EscapeDataString($CommerceOrder))&publicLookupToken=$([uri]::EscapeDataString($PublicLookupToken))"
    Add-Result $results (Invoke-FlowHttp $client "GET order-status final" "GET" $finalStatusUrl) @(200)
  }
}

[pscustomobject]@{
  pass = -not ($results | Where-Object { -not $_.pass })
  baseUrl = $BaseUrl
  results = $results
  created = $createdSummary
} | ConvertTo-Json -Depth 8
