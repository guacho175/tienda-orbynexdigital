# 08 - Referencia de la API Serverless

Este documento detalla la especificación de los endpoints HTTP serverless implementados bajo el directorio `api/`, describiendo sus métodos, entradas, salidas, códigos de error y requerimientos de autenticación.

---

## 1. Crear Pago Flow (`api/flow/create-payment.ts`)

*   **Método**: `POST`
*   **Seguridad**: Pública (cualquier usuario anónimo puede iniciar el pago de su carrito).
*   **Variables Requeridas**: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`, `FLOW_CONFIRMATION_URL`, `FLOW_RETURN_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

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
  "publicLookupToken": "b1b2b3b4-c5c6-4d7d-8e9e-f0f1f2f3f4f5"
}
```

### Respuestas de Error Comunes
*   **400 Bad Request**: Parámetros de cliente inválidos o estructura del carrito corrupta.
*   **409 Conflict**: Error de inventario. El backend responde con el mensaje descriptivo del stock faltante o de productos reservados:
    ```json
    {
      "error": "Este producto esta reservado temporalmente por otra compra. Si no se completa el pago, podria volver a estar disponible en unos minutos."
    }
    ```
*   **502 Bad Gateway**: La API externa de Flow.cl no respondió o devolvió un error de firma.

---

## 2. Confirmación de Pago Webhook (`api/flow/confirm.ts`)

*   **Método**: `POST` (ejecutado por Flow al procesar el pago) o `GET` (invocado por el cliente para forzar sincronización).
*   **Seguridad**: Validaciones criptográficas internas de firma HMAC. No requiere autorización HTTP, pero valida el token recibido contra la API de Flow de forma segura en servidor.

### Parámetros de Entrada (Form-urlencoded o Query String)
*   `token` (string): Token de transacción único provisto por Flow.

### Respuesta Exitosa (Output HTTP 200)
*   **Pago confirmado con éxito**:
    ```json
    {
      "ok": true,
      "status": "paid",
      "commerceOrder": "ORD-1783455718265"
    }
    ```
*   **Respuesta Idempotente (Orden ya procesada anteriormente)**:
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

*   **Método**: `GET`
*   **Seguridad**: Pública (seguridad basada en Token de visualización único).

### Parámetros de Consulta (Query Params)
*   `commerceOrder` (string, requerido): Identificador único de orden (ej. `ORD-1783455718265`).
*   `publicLookupToken` (string UUID, requerido): Token de búsqueda seguro.

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

*   **Método**: `POST`
*   **Seguridad**: Pública.
*   **Función**: Retorna el stock neto vendible (descontando reservas) y gatilla la expiración de registros viejos.

### Cuerpo de la Petición (Input JSON)
```json
{
  "productIds": [
    "97e68c94-1a3b-4890-a2b1-12c345d678e9",
    "f2f3f4f5-e6e7-4890-a2b1-12c345d678f0"
  ]
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

## 5. Expirar Reservas Cron (`api/stock/expire-reservations.ts`)

*   **Método**: `GET`
*   **Seguridad**: Protegido por firma de Token de Autorización (`Authorization: Bearer <CRON_SECRET>`).
*   **Función**: Ejecuta periódicamente la liberación de reservas expiradas.

### Respuesta Exitosa (Output HTTP 200)
```json
{
  "ok": true,
  "expiredReservations": 3,
  "expiredOrders": 2
}
```
