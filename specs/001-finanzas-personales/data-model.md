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

No existe seed ni catálogo predefinido: la colección arranca vacía para todo usuario nuevo
(FR-009); cada documento lo crea el propio usuario.

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users._id` |
| `name` | string, ≤60 caracteres | único (case-sensitive exacto) por `userId` (FR-011); **inmutable** (FR-015) |
| `virtual` | boolean | obligatorio al alta (FR-049); true = billetera virtual, false = banco físico; **inmutable** (FR-015) |
| `amountARS` | Decimal128, ≥ 0 en el alta | monto inicial obligatorio al alta (FR-050); luego recalculado automáticamente en cada transacción en ARS asociada a esta fuente (FR-052) — nunca editado manualmente |
| `amountUSD` | Decimal128, ≥ 0 en el alta | monto inicial obligatorio al alta (FR-051); luego recalculado automáticamente en cada transacción en USD asociada a esta fuente (FR-052) — nunca editado manualmente |
| `createdAt` | datetime | — |

**Reglas de negocio**:
- FR-052: `amountARS`/`amountUSD` se recalculan (no se sobrescriben libremente) mediante un
  ajuste atómico de un solo documento (`$inc`) inmediatamente después de escribir la
  `transaction` asociada, con rollback de compensación si ese ajuste falla — ver research.md
  §16.
- El monto puede quedar negativo tras un egreso; el sistema no valida fondos disponibles
  (clarificación 2026-07-24, Edge Cases de spec.md).

## Categoría (`categories`)

No existe seed ni catálogo predefinido: la colección arranca vacía para todo usuario nuevo
(FR-012); cada documento lo crea el propio usuario.

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users._id` |
| `name` | string, ≤60 caracteres | único (case-sensitive exacto) por `userId` (FR-014); **inmutable** (FR-015) |
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
- FR-018/FR-052: `moneySourceId` y `currency` son editables. Crear, editar o eliminar una
  transacción recalcula `amountARS`/`amountUSD` de `money_sources` (research.md §16) mediante
  escrituras secuenciales con rollback de compensación ante un fallo intermedio, no una
  transacción de Mongo (no se requiere replica set); si una edición cambia `moneySourceId` y/o
  `currency`, se revierte el efecto sobre la fuente/moneda original y se aplica el nuevo efecto
  sobre la fuente/moneda nueva, compensando ante cualquier fallo a mitad de camino.
- Edge Case (última escritura gana): no se implementa control de concurrencia optimista; el
  último `updatedAt` persistido es el estado válido.
- Índice recomendado: `{ userId: 1, date: -1 }` para filtros por período (FR-023) y paginación
  estable de 50 (FR-024); `{ userId: 1, moneySourceId: 1, currency: 1 }` como apoyo de
  integridad, aunque el saldo por fuente ya no se agrega desde acá (ver "Saldo").

## Saldo

No es una colección propia, pero ya no es puramente derivado por agregación: el saldo por
fuente **es** el monto persistido en `money_sources` (FR-021, FR-052).

- **Por fuente y moneda** (FR-021): se lee directamente `money_sources.amountARS` /
  `money_sources.amountUSD` de la fuente pedida — ya incluye el monto inicial (FR-050/FR-051)
  más el efecto acumulado de sus transacciones (FR-052); no requiere agregación sobre
  `transactions` en el camino de lectura.
- **Consolidado por moneda** (FR-022): agregación on-demand (CQRS query side) sumando
  `amountARS` de todas las fuentes del usuario (y por separado `amountUSD`), no sobre
  `transactions`.

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
User (1) ──< MoneySource (0..N, sin catálogo predefinido)
User (1) ──< Category (0..N, sin catálogo predefinido)
User (1) ──< Transaction (0..N)
Transaction (N) ──> MoneySource (1)
Transaction (N) ──> Category (1)
User (1) ──< SecurityEvent (0..N)
```
