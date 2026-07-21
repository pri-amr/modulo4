# API Contract: Finanzas Personales

**Base URL**: `/api/v1` (backend Express, separado del frontend Next.js)
**Auth**: cookie `httpOnly` con JWT de sesión emitido por el backend (research.md §3), salvo
donde se indique `Auth: none`. Todo endpoint autenticado opera exclusivamente sobre datos del
`userId` de la sesión (FR-008); un acceso a datos de otro usuario responde `404` (no `403`, para
no confirmar existencia del recurso ajeno) y genera un `security_events` de tipo
`cross_account_access_denied`.

**Formato de error estándar** (todos los endpoints):
```json
{ "error": { "code": "string", "message": "string", "field": "string | null" } }
```

---

## Auth (`/auth`)

### `POST /auth/register`
**Auth**: none
**Body**: `{ "authMethod": "password", "username": string, "password": string }` (mín. 4
caracteres, FR-042) **o** `{ "authMethod": "passkey" }` (seguido de la ceremonia WebAuthn abajo).
**201**: `{ "userId": string, "authMethod": string }`
**400**: username duplicado / password < 4 caracteres (FR-042).

### `POST /auth/webauthn/registration-options` · `POST /auth/webauthn/registration-verify`
Ceremonia estándar `@simplewebauthn` de alta de una passkey (registro inicial o adicional).
**Body de `registration-verify`**: incluye `name` (nombre visible de la passkey, FR-006).
**201**: passkey persistida y listada.

### `POST /auth/webauthn/authentication-options` · `POST /auth/webauthn/authentication-verify`
Ceremonia estándar de login por passkey. **200** en `authentication-verify`: setea cookie de
sesión y responde `{ "userId": string }`. **401** si falla/cancela (FR-004).

### `POST /auth/login`
**Auth**: none · **Body**: `{ "username": string, "password": string }`
**200**: setea cookie de sesión, `{ "userId": string }`.
**401**: credenciales inválidas (FR-004).
**423 Locked**: cuenta bloqueada por FR-036, `{ "error": { "code": "ACCOUNT_LOCKED", "message":
"...", "lockedUntil": "ISO date" } }`.
**403**: `username` existe pero su `authMethod` no es `password` (FR-002).

### `POST /auth/logout`
Invalida la sesión activa de inmediato (FR-041). **204**.

### `GET /auth/passkeys`
Lista las passkeys del usuario autenticado, con `name` (FR-006). **200**: `[{ "id", "name",
"createdAt" }]`.

### `DELETE /auth/passkeys/:id`
**204** si tras borrar queda ≥1 passkey activa.
**409**: es la última passkey activa, no se borra (FR-007).

---

## Fuentes de dinero (`/money-sources`)

### `GET /money-sources`
**200**: `[{ "id", "name", "isPredefined" }]` (incluye predefinidas + propias).

### `POST /money-sources`
**Body**: `{ "name": string (≤60) }`
**201**: `{ "id", "name" }`
**409**: nombre exactamente duplicado (FR-011).
**400**: nombre vacío o > 60 caracteres.

*(No hay `PUT`/`DELETE`: FR-015 los prohíbe explícitamente.)*

## Categorías (`/categories`)

Mismo contrato que `/money-sources` (`GET`, `POST` únicamente), reglas FR-013/FR-014/FR-015.

---

## Transacciones (`/transactions`)

### `GET /transactions?day=YYYY-MM-DD&month=YYYY-MM&year=YYYY&page=1`
Filtros mutuamente excluyentes por período (FR-023); `page` con tamaño fijo de 50 (FR-024).
**200**: `{ "items": [Transaction], "page": number, "pageSize": 50, "hasNextPage": boolean }`.

### `POST /transactions`
**Body**: `{ "type": "income"|"expense", "amount": number (>0, ≤2 decimales), "currency":
"ARS"|"USD", "moneySourceId": string, "categoryId": string, "date": "YYYY-MM-DD" (≤ hoy),
"description": string }`
**201**: `Transaction`
**400**: campo faltante (indica cuál, FR-017), monto ≤0 (FR-017), fecha futura (FR-044),
más de 2 decimales (FR-043).
**502**: fallo al persistir; el frontend conserva los datos ingresados para reintentar (FR-020).

### `PUT /transactions/:id`
Mismo body que `POST`. **200**: `Transaction` actualizada, reflejada en listado y saldos
(FR-018). **404** si no pertenece al usuario.

### `DELETE /transactions/:id`
Requiere confirmación ya resuelta en el cliente antes de llamar (FR-019). **204**. **404** si no
pertenece al usuario.

---

## Saldos (`/balances`)

### `GET /balances`
**200**:
```json
{
  "bySource": [{ "moneySourceId": "...", "currency": "ARS", "balance": 12345.67 }],
  "consolidated": { "ARS": 12345.67, "USD": 890.12 }
}
```
Calculado on-demand (FR-021, FR-022); ver data-model.md "Saldo (derivado)".

---

## Gráficos (`/charts`)

### `GET /charts/expenses-by-category?from=YYYY-MM-DD&to=YYYY-MM-DD&category=id`
Sin filtros: gastos del mes en curso (FR-025). Con `from`/`to`: rango elegido (FR-026). Con
`category`: acota a una categoría (FR-027).
**200**: `{ "items": [{ "categoryId", "categoryName", "amount", "percentage" }] }`.

---

## Conversor (`/converter`)

### `GET /converter/rates`
Proxy de dolarapi.com para los 7 tipos requeridos (FR-029). **200**: `[{ "type": "oficial" |
"blue" | "bolsa" | "cripto" | "tarjeta" | "cclq" | "mayorista", "venta": number }]`.
**502**: `{ "error": { "code": "QUOTE_SOURCE_UNAVAILABLE", "message": "..." } }` — el frontend
NUNCA muestra un valor de conversión ante esta respuesta (FR-032, RF30).

### `POST /converter/convert`
**Body**: `{ "amount": number (>0), "direction": "USD_TO_ARS"|"ARS_TO_USD", "rateType": string }`
**200**: `{ "result": number, "rateUsed": number }`
**400**: `amount` ≤0 o vacío.
**502**: mismo contrato de error que `/converter/rates` cuando la fuente falla, no responde, o
supera el timeout de 5000 ms (FR-032, SC-004).

---

## Fuera de contrato (explícito)

No existe ningún endpoint de lectura/edición/borrado de `security_events` (FR-040): la
auditoría es exclusivamente interna a la capa de aplicación del backend.
