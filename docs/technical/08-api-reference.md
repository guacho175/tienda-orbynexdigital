# 08 - Referencia de la API Serverless

Este documento detalla la especificación de los endpoints HTTP serverless implementados bajo el directorio `api/`, describiendo sus métodos, entradas, salidas, códigos de error y requerimientos de autenticación.

---

## 1. Crear Pago Flow (`api/flow/create-payment.ts`)

- **Método**: `POST`
- **Seguridad**: Pública (cualquier usuario anónimo puede iniciar el pago de su carrito).
- **Variables Requeridas**: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`, `FLOW_CONFIRMATION_URL`, `FLOW_RETURN_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### Cuerpo de la Petición (Input JSON)

```json
{
  "items": [
    {
      "productId": "97e68c94-1a3b-4890-a2b1-12c345d678e9",
      "quantity": 2
    }
  ],
  "customer": {
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "phone": "+56912345678",
    "comment": "Instalar configuración básica"
  }
}
```

### Respuesta Exitosa (Output HTTP 200)

```json
{
  "redirectUrl": "https://sandbox.flow.cl/app/pay/run?token=4A2D3C4E5F6F7...",
  "commerceOrder": "ORD-1783455718265",
  "publicLookupToken": "PUBLIC_LOOKUP_TOKEN_EXAMPLE"
}
```

### Respuestas de Error Comunes

- **400 Bad Request**: Parámetros de cliente inválidos o estructura del carrito corrupta.
- **409 Conflict**: Error de inventario. El backend responde con el mensaje descriptivo del stock faltante o de productos reservados:
  ```json
  {
    "error": "Este producto esta reservado temporalmente por otra compra. Si no se completa el pago, podria volver a estar disponible en unos minutos."
  }
  ```
- **502 Bad Gateway**: La API externa de Flow.cl no respondió o devolvió un error de firma.

---

## 2. Confirmación de Pago Webhook (`api/flow/confirm.ts`)

- **Método**: `POST`.
- **Seguridad**: Validaciones criptográficas internas de firma HMAC. No requiere autorización HTTP, pero valida el token recibido contra la API de Flow de forma segura en servidor.

### Parámetros de Entrada (Form-urlencoded o Query String)

- `token` (string): Token de transacción único provisto por Flow.

### Respuesta Exitosa (Output HTTP 200)

- **Pago confirmado con éxito**:
  ```json
  {
    "ok": true,
    "status": "paid",
    "commerceOrder": "ORD-1783455718265"
  }
  ```
- **Respuesta Idempotente (Orden ya procesada anteriormente)**:
  ```json
  {
    "ok": true,
    "status": "paid",
    "commerceOrder": "ORD-1783455718265",
    "idempotent": true
  }
  ```

### Respuesta por Conflicto de Stock (Reserva Expirada o Desfase)

Si la transacción fue pagada en Flow pero la reserva de stock ya había expirado y fue tomada por otro usuario, se previene el decremento negativo de stock y se responde:

```json
{
  "ok": false,
  "status": "requires_manual_review",
  "commerceOrder": "ORD-1783455718265",
  "inventoryConflict": true,
  "message": "Payment confirmed but stock reservation requires manual review"
}
```

---

## 3. Estado de la Orden (`api/flow/order-status.ts`)

- **Método**: `GET`
- **Seguridad**: Pública (seguridad basada en Token de visualización único).

### Parámetros de Consulta (Query Params)

- `commerceOrder` (string, requerido): Identificador único de orden (ej. `ORD-1783455718265`).
- `publicLookupToken` (string UUID, requerido): Token de búsqueda seguro.

### Respuesta Exitosa (Output HTTP 200)

```json
{
  "commerceOrder": "ORD-1783455718265",
  "status": "paid",
  "flowStatus": "2",
  "currency": "CLP",
  "total": 45000,
  "paidAt": "2026-07-07T19:30:15.000Z",
  "confirmedAt": "2026-07-07T19:30:16.000Z",
  "failedAt": null,
  "expiresAt": "2026-07-07T19:40:15.000Z",
  "createdAt": "2026-07-07T19:30:15.000Z"
}
```

---

## 4. Disponibilidad de Inventario en Caliente (`api/products/availability.ts`)

- **Método**: `POST`
- **Seguridad**: Pública.
- **Función**: Retorna el stock neto vendible (descontando reservas) y gatilla la expiración de registros viejos.

### Cuerpo de la Petición (Input JSON)

```json
{
  "productIds": ["97e68c94-1a3b-4890-a2b1-12c345d678e9", "f2f3f4f5-e6e7-4890-a2b1-12c345d678f0"]
}
```

### Respuesta Exitosa (Output HTTP 200)

```json
{
  "availability": [
    {
      "productId": "97e68c94-1a3b-4890-a2b1-12c345d678e9",
      "availableQuantity": 0,
      "canPurchase": false,
      "temporarilyReserved": true
    },
    {
      "productId": "f2f3f4f5-e6e7-4890-a2b1-12c345d678f0",
      "availableQuantity": 15,
      "canPurchase": true,
      "temporarilyReserved": false
    }
  ]
}
```

---

## 5. Expirar Reservas Manualmente (`api/stock/expire-reservations.ts`)

- **Método**: `GET`
- **Seguridad**: Protegido por firma de Token de Autorización (`Authorization: Bearer <CRON_SECRET>`).
- **Función**: Respaldo operativo para ejecutar manualmente la liberación de reservas expiradas.
- **Programación declarada**: la migración de Supabase Cron invoca directamente
  `public.expire_stock_reservations()` cada 10 minutos. No usa este endpoint, `CRON_SECRET`,
  GitHub Actions ni Vercel Cron. La activación remota se verifica durante el despliegue.

### Respuesta Exitosa (Output HTTP 200)

```json
{
  "ok": true,
  "expiredReservations": 3,
  "expiredOrders": 2
}
```

---

## 6. Usuarios Admin (`api/admin/users.ts`)

- **Metodo**: `GET`
- **Seguridad**: Requiere `Authorization: Bearer <access_token>` de un usuario autenticado con rol `admin` en `public.user_roles`.
- **Variables Requeridas**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Funcion**: Lista usuarios Auth de Supabase desde servidor y agrega metricas de compras vinculadas por `user_id` o por `customer_email` exacto.

### Parametros de Consulta

- `page` (number, opcional): pagina base 0.
- `pageSize` (number, opcional): maximo 50.
- `search` (string, opcional): correo, nombre inferido, UUID u orden reciente.
- `role` (`all` | `admin` | `user`, opcional).
- `emailConfirmed` (`all` | `yes` | `no`, opcional).
- `hasPurchases` (`all` | `yes` | `no`, opcional).
- `needsReview` (`all` | `yes` | `no`, opcional).
- `staleRedirected` (`all` | `yes` | `no`, opcional).

### Respuesta Exitosa (Output HTTP 200)

```json
{
  "users": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "email": "cliente@example.com",
      "role": "user",
      "createdAt": "2026-07-10T12:00:00.000Z",
      "lastSignInAt": "2026-07-12T18:00:00.000Z",
      "emailConfirmedAt": "2026-07-10T12:05:00.000Z",
      "emailConfirmed": true,
      "displayName": "Cliente Ejemplo",
      "orders": {
        "total": 3,
        "paid": 2,
        "failed": 0,
        "review": 0,
        "redirected": 1,
        "staleRedirected": 1,
        "guestMatched": 1,
        "totalPaid": 90000,
        "currency": "CLP",
        "lastOrderAt": "2026-07-12T18:10:00.000Z",
        "latest": []
      }
    }
  ],
  "total": 1,
  "page": 0,
  "pageSize": 20,
  "scannedUsers": 20,
  "scanLimit": null,
  "staleRedirectedMinutes": 30
}
```

### Respuestas de Error Comunes

- **401 Unauthorized**: token ausente o sesion invalida.
- **403 Forbidden**: el usuario autenticado no tiene rol `admin`.
- **500 Internal Server Error**: error al validar rol, listar usuarios o cargar compras.

### Restricciones de Seguridad

- `auth.admin.listUsers()` se ejecuta solo en servidor.
- No se devuelve `raw_user_meta_data`, `raw_app_meta_data`, `flow_token`, `flow_raw_status` ni llaves internas.
- `status = "redirected"` antiguo se reporta como diagnostico. El endpoint no cancela ni migra ordenes.

---

## 7. Asociar Pedidos Invitados (`api/account/link-orders.ts`)

- **Método**: `POST`.
- **Seguridad**: requiere `Authorization: Bearer <access_token>`.
- **Función**: valida la sesión y el correo confirmado, luego asocia al usuario autenticado las
  órdenes invitadas con el mismo correo mediante `link_guest_orders_to_user`.

### Respuesta Exitosa

```json
{
  "linkedOrders": 2
}
```

### Errores

- **401 Unauthorized**: sesión ausente o inválida.
- **403 Forbidden**: correo aún no confirmado.
- **500 Internal Server Error**: no fue posible asociar los pedidos.
