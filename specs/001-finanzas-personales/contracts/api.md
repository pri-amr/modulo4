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

**Cross-cutting (todos los endpoints, FR-046/FR-047/FR-048)**: toda respuesta incluye el set
base de cabeceras de seguridad HTTP (FR-047, research.md §13); la cookie de sesión usa
`sameSite=strict` como única protección CSRF (FR-046, research.md §14); todo `body`/`query` se
valida contra un esquema estricto antes de despachar al bus CQRS, respondiendo `400` con el
formato de error estándar (`field` indica la ruta del campo inválido) ante cualquier violación
de esquema (FR-048, research.md §12).

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

No hay seed ni catálogo predefinido (FR-009): `GET` devuelve `[]` para una cuenta recién creada.

### `GET /money-sources`
**200**: `[{ "id", "name", "virtual": boolean, "amountARS": number, "amountUSD": number }]`.

### `POST /money-sources`
**Body**: `{ "name": string (≤60), "virtual": boolean, "amountARS": number (≥0), "amountUSD":
number (≥0) }`
**201**: `{ "id", "name", "virtual", "amountARS", "amountUSD" }`
**409**: nombre exactamente duplicado (FR-011).
**400**: nombre vacío o > 60 caracteres (FR-010); `virtual` ausente (FR-049); `amountARS` o
`amountUSD` ausente o negativo (FR-050/FR-051) — `field` en el error indica cuál.

*(No hay `PUT`/`DELETE`: FR-015 los prohíbe explícitamente. `amountARS`/`amountUSD` cambian
únicamente vía el recálculo automático de `POST/PUT/DELETE /transactions`, nunca por este
endpoint.)*

## Categorías (`/categories`)

No hay seed ni catálogo predefinido (FR-012): `GET` devuelve `[]` para una cuenta recién creada.

### `GET /categories`
**200**: `[{ "id", "name" }]`.

### `POST /categories`
**Body**: `{ "name": string (≤60) }`
**201**: `{ "id", "name" }`
**409**: nombre exactamente duplicado (FR-014).
**400**: nombre vacío o > 60 caracteres (FR-013).

*(No hay `PUT`/`DELETE`: FR-015 los prohíbe explícitamente.)*

---

## Transacciones (`/transactions`)

### `GET /transactions?day=YYYY-MM-DD&month=YYYY-MM&year=YYYY&page=1`
Filtros mutuamente excluyentes por período (FR-023); `page` con tamaño fijo de 50 (FR-024).
Orden por defecto: fecha de transacción descendente, `createdAt` descendente como desempate
(FR-024). **200**: `{ "items": [Transaction], "page": number, "pageSize": 50, "hasNextPage":
boolean }`.

### `POST /transactions`
**Body**: `{ "type": "income"|"expense", "amount": number (>0), "currency":
"ARS"|"USD", "moneySourceId": string, "categoryId": string, "date": "YYYY-MM-DD" (≤ hoy),
"description": string }`. Un `amount` con más de 2 decimales se redondea a 2 decimales
(redondeo estándar, mitad hacia arriba) antes de guardarse; no se rechaza por ese motivo
(FR-043).
**201**: `Transaction` (con `amount` ya redondeado a 2 decimales si correspondía).
**400**: campo faltante (indica cuál, FR-017), monto ≤0 (FR-017), fecha futura (FR-044).
**502**: fallo al persistir; el frontend conserva los datos ingresados para reintentar (FR-020).

### `PUT /transactions/:id`
Mismo body que `POST`; puede cambiar cualquier campo, incluidos `moneySourceId` y `currency`
(FR-018). **200**: `Transaction` actualizada, reflejada en listado y saldos. Si `moneySourceId`
y/o `currency` cambiaron, revierte el efecto sobre la fuente/moneda original y lo aplica sobre
la nueva (FR-052, research.md §16). **404** si no pertenece al usuario.

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
`bySource` se lee directamente de `money_sources.amountARS`/`amountUSD` (FR-021, ya incluye el
monto inicial + recálculo acumulado); `consolidated` se agrega on-demand sumando esos montos por
moneda (FR-022). Ver data-model.md "Saldo".

---

## Gráficos (`/charts`)

### `GET /charts/expenses-by-category?from=YYYY-MM-DD&to=YYYY-MM-DD&category=id`
Sin filtros: gastos del mes en curso, calculado en zona horaria de Argentina
(America/Argentina/Buenos_Aires, UTC-3 fijo, FR-025). Con `from`/`to`: rango elegido (FR-026).
Con `category`: acota a una categoría (FR-027).
**200**: `{ "items": [{ "categoryId", "categoryName", "amount", "percentage" }] }`. `percentage`
redondeado a 1 decimal por categoría, con ajuste en la de mayor monto para que la suma total dé
exactamente 100% (FR-025).

---

## Conversor (`/converter`)

### `GET /converter/rates`
Proxy de dolarapi.com para los 7 tipos requeridos (FR-029). **200**: `[{ "type": "oficial" |
"blue" | "bolsa" | "cripto" | "tarjeta" | "cclq" | "mayorista", "venta": number }]`. `cclq` =
"contado con liqui" (research.md §8).
**502**: `{ "error": { "code": "QUOTE_SOURCE_UNAVAILABLE", "message": "..." } }` — el frontend
NUNCA muestra un valor de conversión ante esta respuesta (FR-032, RF30); mismo código y
tratamiento cuando dolarapi.com responde 200 pero sin el tipo de cambio solicitado (FR-030,
FR-032).

### `POST /converter/convert`
**Body**: `{ "amount": number (>0), "direction": "USD_TO_ARS"|"ARS_TO_USD", "rateType": string }`
**200**: `{ "result": number, "rateUsed": number }`
**400**: `amount` ≤0 o vacío.
**502**: mismo contrato de error que `/converter/rates` cuando la fuente falla, no responde,
supera el timeout de 5000 ms, o responde sin el tipo de cambio pedido (FR-032, SC-004).

---

## Fuera de contrato (explícito)

No existe ningún endpoint de lectura/edición/borrado de `security_events` (FR-040): la
auditoría es exclusivamente interna a la capa de aplicación del backend.
