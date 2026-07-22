# Phase 1 Data Model: Finanzas Personales (Multi-banco, ARS/USD)

**Input**: `## Key Entities` de spec.md + reglas de validación de los Functional Requirements.
**Storage**: MongoDB (una colección por entidad persistida; ver `research.md` §4-6 para
cifrado en reposo, TTL de auditoría y campos de bloqueo).

## Convenciones

- Todo documento persistido incluye `_id` (ObjectId) y pertenece exactamente a un `userId`
  (excepto `User` mismo), reforzando FR-008 (aislamiento entre cuentas) a nivel de query
  (`{ userId, ... }` en cada lectura/escritura del módulo correspondiente).
- Los campos marcados **inmutable** no se exponen en ningún endpoint de edición.

## Usuario (`users`)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `authMethod` | enum `'passkey' \| 'password'` | **inmutable** tras el registro (FR-001, FR-002) |
| `username` | string | único; solo requerido/usado si `authMethod = 'password'` |
| `passwordHash` | string \| null | Argon2id (research.md §2); null si `authMethod = 'passkey'` |
| `failedLoginAttempts` | int | default 0; solo aplica a `authMethod = 'password'` (FR-036) |
| `lockedUntil` | datetime \| null | fecha hasta la que el login está bloqueado (FR-036) |
| `createdAt` | datetime | — |

**Reglas de negocio**:
- FR-002: todo intento de login con un método distinto a `authMethod` se rechaza antes de
  evaluar credenciales.
- FR-036/FR-042: `passwordHash` solo se genera si la contraseña de origen tiene ≥4 caracteres.

## Credencial Passkey (`passkey_credentials`)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users._id` |
| `credentialId` | string (base64url) | único; identificador WebAuthn |
| `publicKey` | binary | clave pública WebAuthn |
| `counter` | int | contador anti-replay del autenticador |
| `name` | string | definido por el usuario al registrarla (FR-006) |
| `createdAt` | datetime | — |

**Reglas de negocio**:
- FR-005: 1..N por usuario.
- FR-007: un `DELETE` se rechaza si es la última credencial activa del usuario (`count == 1`).

## Fuente de Dinero (`money_sources`)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users._id` |
| `name` | string, ≤60 caracteres | único (case-sensitive exacto) por `userId` (FR-011); **inmutable** (FR-015) |
| `isPredefined` | boolean | true para las 6 fuentes de fábrica (FR-009) |
| `createdAt` | datetime | — |

## Categoría (`categories`)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users._id` |
| `name` | string, ≤60 caracteres | único (case-sensitive exacto) por `userId` (FR-014); **inmutable** (FR-015) |
| `isPredefined` | boolean | true para las 4 categorías de fábrica (FR-012) |
| `createdAt` | datetime | — |

## Transacción (`transactions`)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users._id` |
| `type` | enum `'income' \| 'expense'` | FR-016 |
| `amount` | Decimal128, > 0 | hasta 2 decimales; si excede precisión se redondea a 2 decimales (mitad hacia arriba), nunca se rechaza por este motivo (FR-043) |
| `currency` | enum `'ARS' \| 'USD'` | FR-017 |
| `moneySourceId` | ObjectId | FK → `money_sources._id`, debe existir y pertenecer al mismo `userId` |
| `categoryId` | ObjectId | FK → `categories._id`, debe existir y pertenecer al mismo `userId` |
| `date` | date | ≤ fecha actual (FR-044); no futura |
| `description` | string | sin límite máximo de longitud (FR-017) |
| `createdAt` / `updatedAt` | datetime | para orden por defecto y trazabilidad de ediciones |

**Reglas de negocio**:
- FR-018/FR-019: edición y borrado solo sobre transacciones del propio `userId`.
- Edge Case (última escritura gana): no se implementa control de concurrencia optimista; el
  último `updatedAt` persistido es el estado válido.
- Índice recomendado: `{ userId: 1, date: -1 }` para filtros por período (FR-023) y paginación
  estable de 50 (FR-024); `{ userId: 1, moneySourceId: 1, currency: 1 }` para el cálculo de
  saldos.

## Saldo (derivado, no persistido)

No es una colección propia. Se calcula on-demand (CQRS query side) por agregación sobre
`transactions`:

- **Por fuente y moneda** (FR-021): `sum(amount where type='income') - sum(amount where
  type='expense')`, agrupado por `moneySourceId` + `currency`.
- **Consolidado por moneda** (FR-022): igual cálculo agrupado solo por `currency`, sumando
  todas las fuentes.

## Cotización (no persistida)

No es una colección propia. Se obtiene en el momento de cada conversión desde dolarapi.com
(research.md §8); el campo relevante es `venta` para el `tipoCambio` elegido entre los 7 de
FR-029. Nunca se cachea entre requests (Principio III: fidelidad a la fuente de verdad).

## Registro de Evento de Seguridad (`security_events`)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users._id` |
| `eventType` | enum `'login_failed' \| 'account_locked' \| 'cross_account_access_denied'` | FR-038 |
| `createdAt` | datetime | índice TTL a 30 días (research.md §5, FR-039) |

**Reglas de negocio**:
- FR-040: ningún endpoint del API de usuario final expone lectura, edición ni borrado de esta
  colección; solo la escribe la capa de aplicación internamente.

## Relaciones (resumen)

```text
User (1) ──< PasskeyCredential (0..N)
User (1) ──< MoneySource (1..N, min. las 6 predefinidas)
User (1) ──< Category (1..N, min. las 4 predefinidas)
User (1) ──< Transaction (0..N)
Transaction (N) ──> MoneySource (1)
Transaction (N) ──> Category (1)
User (1) ──< SecurityEvent (0..N)
```
