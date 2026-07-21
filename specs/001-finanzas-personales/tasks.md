---

description: "Task list template for feature implementation"
---

# Tasks: Finanzas Personales (Multi-banco, ARS/USD)

**Input**: Design documents from `/specs/001-finanzas-personales/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: incluidas y obligatorias — el Principio I de la constitución (Test-First,
NON-NEGOTIABLE) exige un test que falle antes de todo código de producción. Cada handler,
endpoint y componente relevante tiene su tarea de test inmediatamente antes de la tarea de
implementación que lo hace pasar.

**Organization**: Tareas agrupadas por historia de usuario (US1-US6, prioridad de spec.md) para
permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: historia de usuario a la que pertenece (US1..US6); Setup/Foundational/Polish no
  llevan story label
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Web app (`backend/` + `frontend/`, DDD+CQRS backend / arquitectura por funcionalidad frontend),
según `plan.md` → Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicialización de ambos proyectos según `plan.md`

- [ ] T001 Crear el esqueleto de carpetas `backend/` y `frontend/` según el árbol de
  `plan.md` → Project Structure (módulos DDD vacíos en `backend/src/modules/`, carpetas de
  frontend en `frontend/src/`)
- [ ] T002 [P] Inicializar `backend/package.json` (Express, TypeScript, driver de MongoDB o
  `mongoose`, `argon2`, `jsonwebtoken`, `@simplewebauthn/server`, `axios`) y `backend/tsconfig.json`
- [ ] T003 [P] Inicializar `frontend/package.json` (Next.js, React, TypeScript, Tailwind, `axios`,
  `next-auth`, `@simplewebauthn/browser`, `recharts`, `@heroicons/react`) y `frontend/tsconfig.json`
- [ ] T004 [P] Configurar `frontend/tailwind.config.ts`: modo oscuro por defecto (`darkMode:
  'class'`, aplicada en el root layout), paleta neutra (`slate`) + token de color de acento,
  utilidad de esquinas 10px para inputs
- [ ] T005 [P] Configurar ESLint/Prettier en `backend/.eslintrc.cjs` y `frontend/.eslintrc.cjs`
- [ ] T006 [P] Configurar Jest + `supertest` + `nock` en `backend/jest.config.ts`
- [ ] T007 [P] Configurar Jest + `@testing-library/react` (entorno jsdom) en
  `frontend/jest.config.ts`
- [ ] T008 [P] Crear `backend/.env.example` y `frontend/.env.example` con `MONGODB_URI`,
  `SESSION_JWT_SECRET`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `DOLARAPI_BASE_URL`,
  `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BACKEND_API_URL` — solo nombres, sin valores reales
  (Principio IV)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestructura compartida que TODAS las historias necesitan

**⚠️ CRITICAL**: ninguna historia de usuario puede comenzar hasta que esta fase esté completa

### Backend

- [ ] T009 Implementar la conexión a MongoDB en `backend/src/shared/infrastructure/db.ts`
- [ ] T010 [P] Implementar el loader de configuración de entorno con validación en
  `backend/src/shared/config/env.ts`
- [ ] T011 [P] Implementar el formato de error estándar y el middleware de manejo de errores
  Express en `backend/src/shared/http/errorHandler.ts` (contracts/api.md, formato de error)
- [ ] T012 [P] Test unitario del bus de comandos/queries (resuelve el handler correcto, lanza
  error ante un tipo no registrado) en `backend/tests/unit/shared/cqrs-bus.test.ts` — escribir
  primero, debe fallar
- [ ] T013 [P] Implementar el bus de comandos y el bus de queries in-process en
  `backend/src/shared/cqrs/bus.ts` (research.md §10; hace pasar T012)
- [ ] T014 [P] Test unitario de emisión/verificación/expiración del token de sesión en
  `backend/tests/unit/shared/sessionToken.test.ts` — escribir primero, debe fallar
- [ ] T015 Implementar la emisión/verificación del JWT de sesión en
  `backend/src/shared/auth/sessionToken.ts` (research.md §3; hace pasar T014)
- [ ] T016 Implementar el middleware `requireSession` (adjunta `req.userId` desde la cookie de
  sesión, 401 si falta/es inválida) en `backend/src/shared/http/requireSession.ts` (depende de
  T015)
- [ ] T017 Implementar el repositorio Mongo de `security_events` con índice TTL a 30 días en
  `backend/src/modules/security-log/infrastructure/securityEventRepository.ts` (FR-039,
  data-model.md; depende de T009)
- [ ] T018 [P] Test unitario del handler `RecordSecurityEvent` en
  `backend/tests/unit/security-log/recordSecurityEvent.test.ts` — escribir primero, debe fallar
- [ ] T019 Implementar el comando `RecordSecurityEvent` en
  `backend/src/modules/security-log/application/commands/recordSecurityEvent.ts` (FR-038;
  depende de T017; hace pasar T018)
- [ ] T020 [P] Test unitario de `requireOwnership` (404 ante mismatch de `userId`, dispara el
  log de auditoría) en `backend/tests/unit/shared/requireOwnership.test.ts` — escribir primero,
  debe fallar
- [ ] T021 Implementar el helper `requireOwnership` en
  `backend/src/shared/http/requireOwnership.ts` (FR-008; depende de T016, T019; hace pasar T020)
- [ ] T022 Bootstrap de la app Express (parseo JSON, montaje de error handler, placeholder de
  rutas) en `backend/src/app.ts`
- [ ] T023 [P] Bootstrap del entrypoint del servidor (lee `PORT`, conecta Mongo antes de
  escuchar) en `backend/src/server.ts` (depende de T009, T022)

### Frontend

- [ ] T024 [P] Test unitario de `handleRequest` (casos de éxito y error, `axios` mockeado) en
  `frontend/__tests__/__mocks__/handleRequest.test.ts` — escribir primero, debe fallar
- [ ] T025 [P] Implementar `handleRequest(method, endpoint, body?, headers?)` en
  `frontend/src/services/handleRequest.ts` (hace pasar T024)
- [ ] T026 [P] Implementar `LoadingProvider` (estado global de carga, se activa/desactiva
  alrededor de cada llamada de `handleRequest`) en `frontend/src/providers/LoadingProvider.tsx`
  (depende de T025)
- [ ] T027 [P] Implementar el overlay `Loader` circular a pantalla completa, fondo
  semitransparente, bloqueo de clicks (`pointer-events: none` en el contenido subyacente) en
  `frontend/src/components/shared/Loader.tsx`
- [ ] T028 [P] Implementar el componente `Button` compartido (fondo más claro en `:hover`) en
  `frontend/src/components/shared/Button.tsx`
- [ ] T029 [P] Implementar el componente `Input` compartido (label fuera y arriba, esquinas
  10px) en `frontend/src/components/shared/Input.tsx`
- [ ] T030 [P] Implementar los componentes `Card`/`Modal` compartidos en
  `frontend/src/components/shared/Card.tsx` y `frontend/src/components/shared/Modal.tsx`
- [ ] T031 Configurar el layout raíz con modo oscuro por defecto y `LoadingProvider` montado en
  `frontend/src/app/layout.tsx` (depende de T026, T027)
- [ ] T032 [P] Configurar el esqueleto de next-auth (estrategia `jwt`, sin providers todavía) en
  `frontend/src/app/api/auth/[...nextauth]/route.ts` (research.md §3)

**Checkpoint**: Fundación lista — las historias de usuario pueden implementarse.

---

## Phase 3: User Story 1 - Registro y acceso seguro a la cuenta (Priority: P1) 🎯 MVP

**Goal**: registro/login exclusivo por passkey o contraseña, gestión de passkeys, bloqueo tras
intentos fallidos, sesión de 1 día, logout inmediato.

**Independent Test**: registrar una cuenta con cada método, cerrar sesión, y verificar que solo
el método elegido permite volver a entrar.

### Tests for User Story 1 ⚠️ (escribir primero, deben fallar)

- [ ] T033 [P] [US1] Contract test `POST /auth/register` (password y alta de passkey) en
  `backend/tests/contract/auth-register.test.ts`
- [ ] T034 [P] [US1] Contract test `POST /auth/login` (éxito, password incorrecto, método
  distinto al elegido, cuenta bloqueada) en `backend/tests/contract/auth-login.test.ts`
- [ ] T035 [P] [US1] Contract test `POST /auth/logout` en `backend/tests/contract/auth-logout.test.ts`
- [ ] T036 [P] [US1] Contract test de la ceremonia WebAuthn (registration-options/verify,
  authentication-options/verify) en `backend/tests/contract/auth-webauthn.test.ts`
- [ ] T037 [P] [US1] Contract test `GET/POST/DELETE /auth/passkeys` (incluye 409 al borrar la
  última) en `backend/tests/contract/auth-passkeys.test.ts`
- [ ] T038 [P] [US1] Integration test: 5 logins fallidos por contraseña → 423 bloqueado → el
  contador se resetea con éxito o al expirar los 15 min en
  `backend/tests/integration/auth-lockout.test.ts` (FR-036)
- [ ] T039 [P] [US1] Integration test: la sesión expira al día en
  `backend/tests/integration/auth-session-expiry.test.ts` (FR-037)

### Implementation for User Story 1

- [ ] T040 [P] [US1] Implementar la entidad de dominio `User` (inmutabilidad de `authMethod`,
  password ≥4 caracteres) en `backend/src/modules/auth/domain/user.ts`
- [ ] T041 [P] [US1] Implementar la entidad de dominio `PasskeyCredential` en
  `backend/src/modules/auth/domain/passkeyCredential.ts`
- [ ] T042 [US1] Implementar `UserRepository` (Mongo) en
  `backend/src/modules/auth/infrastructure/userRepository.ts` (depende de T009, T040)
- [ ] T043 [US1] Implementar `PasskeyCredentialRepository` (Mongo) en
  `backend/src/modules/auth/infrastructure/passkeyRepository.ts` (depende de T009, T041)
- [ ] T044 [US1] Implementar el comando `RegisterUser` (FR-001, FR-042) en
  `backend/src/modules/auth/application/commands/registerUser.ts` (depende de T042; hace pasar
  T033)
- [ ] T045 [US1] Implementar el comando `LoginWithPassword` (bloqueo FR-036, rechazo de método
  distinto FR-002) en `backend/src/modules/auth/application/commands/loginWithPassword.ts`
  (depende de T042, T019; hace pasar T034, T038)
- [ ] T046 [US1] Implementar la ceremonia de alta de passkey (`@simplewebauthn/server`,
  FR-005/FR-006) en `backend/src/modules/auth/application/commands/registerPasskey.ts` (depende
  de T043; hace pasar parte de T036)
- [ ] T047 [US1] Implementar la ceremonia de login por passkey (FR-002) en
  `backend/src/modules/auth/application/commands/loginWithPasskey.ts` (depende de T043; hace
  pasar el resto de T036)
- [ ] T048 [US1] Implementar el comando `DeletePasskey` (bloquea la última, FR-007) en
  `backend/src/modules/auth/application/commands/deletePasskey.ts` (depende de T043; hace pasar
  T037)
- [ ] T049 [US1] Implementar el comando `Logout` (invalida la sesión de inmediato, FR-041) en
  `backend/src/modules/auth/application/commands/logout.ts` (depende de T015; hace pasar T035)
- [ ] T050 [P] [US1] Implementar la query `ListPasskeys` en
  `backend/src/modules/auth/application/queries/listPasskeys.ts` (depende de T043)
- [ ] T051 [US1] Implementar `backend/src/modules/auth/interface/authRoutes.ts` cableando
  T044-T050 según contracts/api.md §Auth (depende de T016, T021, T044-T050)
- [ ] T052 [US1] Montar las rutas de auth en `backend/src/app.ts` (depende de T022, T051)
- [ ] T053 [P] [US1] Implementar el provider de next-auth que delega en el backend vía
  `handleRequest` en `frontend/src/app/api/auth/[...nextauth]/route.ts` (depende de T025, T032)
- [ ] T054 [P] [US1] Construir la pantalla de Login (tarjeta centrada 40% de ancho, logo a la
  izquierda, línea divisoria, formulario en columna a la derecha, botones "Ingreso"/"Ingreso con
  passkey") en `frontend/src/app/login/page.tsx` y `frontend/src/components/auth/LoginForm.tsx`
- [ ] T055 [P] [US1] Construir la pantalla de Registro (mismo layout, botones
  "Registrar"/"Registro con passkey") en `frontend/src/app/registro/page.tsx` y
  `frontend/src/components/auth/RegisterForm.tsx`
- [ ] T056 [P] [US1] Construir el shell del Dashboard (4 tarjetas horizontales responsive
  <500px, menú hamburguesa con "Cerrar Sesión"/"Agregar-Borrar passkey") en
  `frontend/src/app/dashboard/page.tsx` y `frontend/src/components/auth/DashboardMenu.tsx`
- [ ] T057 [P] [US1] Construir la gestión de passkeys (listado con nombre, alta, baja con
  bloqueo de la última) en `frontend/src/components/auth/PasskeyManager.tsx`
- [ ] T058 [P] [US1] Test de frontend: validación y errores de Login/Registro (`handleRequest`
  mockeado) en `frontend/__tests__/auth/login-register.test.tsx`
- [ ] T059 [P] [US1] Test de frontend: `PasskeyManager` bloquea borrar la última passkey
  (`handleRequest` mockeado) en `frontend/__tests__/auth/passkey-manager.test.tsx`

**Checkpoint**: US1 funcional y probable de forma independiente (MVP).

---

## Phase 4: User Story 2 - Registro de ingresos y egresos (Priority: P1)

**Goal**: alta de fuentes/categorías propias, alta/edición/borrado de transacciones.

**Independent Test**: crear, editar y eliminar transacciones desde una cuenta autenticada usando
fuentes/categorías predefinidas, verificando que el listado refleja exactamente los datos.

### Tests for User Story 2 ⚠️ (escribir primero, deben fallar)

- [ ] T060 [P] [US2] Contract test `GET/POST /money-sources` (incluye 409 duplicado, 400 >60
  caracteres) en `backend/tests/contract/money-sources.test.ts`
- [ ] T061 [P] [US2] Contract test `GET/POST /categories` en
  `backend/tests/contract/categories.test.ts`
- [ ] T062 [P] [US2] Contract test `POST/PUT/DELETE /transactions` (validación de campos,
  precisión de 2 decimales, fecha futura, ownership) en
  `backend/tests/contract/transactions.test.ts`
- [ ] T063 [P] [US2] Integration test: ante un fallo de guardado se conserva la posibilidad de
  reintentar sin perder los datos ingresados en
  `backend/tests/integration/transactions-save-failure.test.ts` (FR-020)

### Implementation for User Story 2

- [ ] T064 [P] [US2] Implementar entidad de dominio + repositorio `MoneySource` en
  `backend/src/modules/money-sources/domain/moneySource.ts` y
  `backend/src/modules/money-sources/infrastructure/moneySourceRepository.ts`
- [ ] T065 [P] [US2] Implementar entidad de dominio + repositorio `Category` en
  `backend/src/modules/categories/domain/category.ts` y
  `backend/src/modules/categories/infrastructure/categoryRepository.ts`
- [ ] T066 [P] [US2] Implementar entidad de dominio + repositorio `Transaction` (precisión de 2
  decimales FR-043, fecha ≤ hoy FR-044) en
  `backend/src/modules/transactions/domain/transaction.ts` y
  `backend/src/modules/transactions/infrastructure/transactionRepository.ts`
- [ ] T067 [US2] Sembrar las fuentes (Santander, BNA, Macro, Lemon, Brubank, Efectivo) y
  categorías (comida, transporte, sueldo, freelance) predefinidas al registrar una cuenta en
  `backend/src/modules/auth/application/commands/registerUser.ts` (extiende T044; FR-009,
  FR-012; depende de T064, T065)
- [ ] T068 [P] [US2] Implementar el comando `CreateMoneySource` (chequeo de duplicado exacto,
  FR-011) en `backend/src/modules/money-sources/application/commands/createMoneySource.ts`
  (depende de T064; hace pasar T060)
- [ ] T069 [P] [US2] Implementar la query `ListMoneySources` en
  `backend/src/modules/money-sources/application/queries/listMoneySources.ts` (depende de T064)
- [ ] T070 [P] [US2] Implementar el comando `CreateCategory` (chequeo de duplicado exacto,
  FR-014) en `backend/src/modules/categories/application/commands/createCategory.ts` (depende
  de T065; hace pasar T061)
- [ ] T071 [P] [US2] Implementar la query `ListCategories` en
  `backend/src/modules/categories/application/queries/listCategories.ts` (depende de T065)
- [ ] T072 [US2] Implementar el comando `CreateTransaction` (FR-016/017/043/044) en
  `backend/src/modules/transactions/application/commands/createTransaction.ts` (depende de
  T066; hace pasar parte de T062)
- [ ] T073 [US2] Implementar el comando `UpdateTransaction` (FR-018) en
  `backend/src/modules/transactions/application/commands/updateTransaction.ts` (depende de
  T066; hace pasar parte de T062)
- [ ] T074 [US2] Implementar el comando `DeleteTransaction` (FR-019) en
  `backend/src/modules/transactions/application/commands/deleteTransaction.ts` (depende de
  T066; hace pasar el resto de T062)
- [ ] T075 [US2] Implementar `backend/src/modules/money-sources/interface/moneySourceRoutes.ts`
  (depende de T016, T021, T068, T069)
- [ ] T076 [US2] Implementar `backend/src/modules/categories/interface/categoryRoutes.ts`
  (depende de T016, T021, T070, T071)
- [ ] T077 [US2] Implementar `backend/src/modules/transactions/interface/transactionRoutes.ts`
  (solo POST/PUT/DELETE en esta historia; GET con filtros llega en US4; depende de T016, T021,
  T072-T074)
- [ ] T078 [US2] Montar rutas de money-sources/categories/transactions en `backend/src/app.ts`
  (depende de T075-T077)
- [ ] T079 [P] [US2] Construir la pantalla "Alta de categoría" (centrada, 2 columnas) en
  `frontend/src/app/categorias/nueva/page.tsx` y
  `frontend/src/components/categories/CategoryForm.tsx`
- [ ] T080 [P] [US2] Construir la pantalla "Alta de fuente de dinero" (centrada, 2 columnas) en
  `frontend/src/app/fuentes/nueva/page.tsx` y
  `frontend/src/components/money-sources/MoneySourceForm.tsx`
- [ ] T081 [US2] Construir el shell de la pantalla "Transacciones" (grilla de 4 cuadrantes,
  apilado en columna <500px) en `frontend/src/app/transacciones/page.tsx`
- [ ] T082 [US2] Construir el formulario de alta de transacción (cuadrante superior izquierdo,
  botón deshabilitado durante el envío, FR-045) en
  `frontend/src/components/transactions/TransactionForm.tsx` (depende de T081)
- [ ] T083 [P] [US2] Test de frontend: validación, prevención de doble envío y conservación de
  datos ante fallo de `TransactionForm` en `frontend/__tests__/transactions/transaction-form.test.tsx`
- [ ] T084 [P] [US2] Test de frontend: error de nombre duplicado en `CategoryForm`/
  `MoneySourceForm` en `frontend/__tests__/transactions/money-source-category-form.test.tsx`

**Checkpoint**: US1 + US2 funcionan de forma independiente y en conjunto.

---

## Phase 5: User Story 3 - Visibilidad de saldos por fuente y consolidados (Priority: P2)

**Goal**: saldo por fuente/moneda y consolidado por moneda.

**Independent Test**: con transacciones ya cargadas, el saldo por fuente y el consolidado
coinciden con ingresos menos egresos.

### Tests for User Story 3 ⚠️ (escribir primero, deben fallar)

- [ ] T085 [P] [US3] Contract test `GET /balances` (por fuente y consolidado) en
  `backend/tests/contract/balances.test.ts`
- [ ] T086 [P] [US3] Integration test: saldo = ingresos − egresos por fuente/moneda en
  `backend/tests/integration/balances-calculation.test.ts` (FR-021/FR-022, SC-007)

### Implementation for User Story 3

- [ ] T087 [US3] Implementar la query `GetBalances` (agregación Mongo por fuente+moneda y por
  moneda) en `backend/src/modules/balances/application/queries/getBalances.ts` (depende de T066;
  hace pasar T085, T086)
- [ ] T088 [US3] Implementar `backend/src/modules/balances/interface/balanceRoutes.ts` y
  montarla en `backend/src/app.ts` (depende de T016, T021, T087)
- [ ] T089 [US3] Construir la tabla de saldos por fuente (cuadrante superior derecho de
  "Transacciones") en `frontend/src/components/balances/BalanceTable.tsx` (depende de T081)
- [ ] T090 [P] [US3] Test de frontend: `BalanceTable` renderiza filas por fuente + totales
  consolidados (`handleRequest` mockeado) en `frontend/__tests__/balances/balance-table.test.tsx`

**Checkpoint**: US1-US3 funcionan de forma independiente y en conjunto.

---

## Phase 6: User Story 4 - Filtrado y navegación del historial de transacciones (Priority: P2)

**Goal**: filtro por día/mes/año y paginación de 50.

**Independent Test**: con >50 transacciones en varios períodos, cada filtro acota el listado y
la paginación no repite ni omite registros.

### Tests for User Story 4 ⚠️ (escribir primero, deben fallar)

- [ ] T091 [P] [US4] Contract test `GET /transactions` con filtros día/mes/año y paginación en
  `backend/tests/contract/transactions-list.test.ts`
- [ ] T092 [P] [US4] Integration test: límite de paginación (50 vs. 51) sin repetir ni omitir en
  `backend/tests/integration/transactions-pagination.test.ts` (FR-024)

### Implementation for User Story 4

- [ ] T093 [US4] Implementar la query `ListTransactions` (filtro día/mes/año, tamaño de página
  50) en `backend/src/modules/transactions/application/queries/listTransactions.ts` (FR-023/
  FR-024; depende de T066; hace pasar T091, T092)
- [ ] T094 [US4] Agregar `GET /transactions` a
  `backend/src/modules/transactions/interface/transactionRoutes.ts` (depende de T077, T093)
- [ ] T095 [US4] Construir el historial/listado con filtros y paginación (cuadrante inferior
  izquierdo de "Transacciones") en
  `frontend/src/components/transactions/TransactionHistory.tsx` (depende de T081)
- [ ] T096 [P] [US4] Test de frontend: cambio de filtros y paginación sin repetidos
  (`handleRequest` mockeado) en `frontend/__tests__/transactions/transaction-history.test.tsx`

**Checkpoint**: US1-US4 funcionan de forma independiente y en conjunto.

---

## Phase 7: User Story 5 - Análisis visual de gastos (Priority: P3)

**Goal**: gráfico de torta de gastos por categoría, filtrable por rango de fechas y categoría.

**Independent Test**: con gastos en varias categorías/fechas, el gráfico por defecto y los
filtros muestran exactamente los subconjuntos esperados.

### Tests for User Story 5 ⚠️ (escribir primero, deben fallar)

- [ ] T097 [P] [US5] Contract test `GET /charts/expenses-by-category` (mes por defecto, rango de
  fechas, filtro de categoría) en `backend/tests/contract/charts.test.ts`
- [ ] T098 [P] [US5] Integration test: la distribución porcentual respeta la regla de redondeo
  definida en `backend/tests/integration/charts-percentage.test.ts` (FR-025)

### Implementation for User Story 5

- [ ] T099 [US5] Implementar la query `GetExpensesByCategory` en
  `backend/src/modules/charts/application/queries/getExpensesByCategory.ts` (FR-025/FR-026/
  FR-027; depende de T066; hace pasar T097, T098)
- [ ] T100 [US5] Implementar `backend/src/modules/charts/interface/chartRoutes.ts` y montarla en
  `backend/src/app.ts` (depende de T016, T021, T099)
- [ ] T101 [US5] Construir el gráfico de torta con `recharts` (cuadrante inferior derecho de
  "Transacciones", filtros de fecha/categoría) en
  `frontend/src/components/charts/ExpensesPieChart.tsx` (depende de T081)
- [ ] T102 [P] [US5] Test de frontend: vista por defecto del mes en curso + interacción con
  filtros (`handleRequest` mockeado) en
  `frontend/__tests__/charts/expenses-pie-chart.test.tsx`

**Checkpoint**: US1-US5 funcionan de forma independiente y en conjunto.

---

## Phase 8: User Story 6 - Conversión entre USD y ARS (Priority: P3)

**Goal**: conversor USD/ARS en ambas direcciones con los 7 tipos de cambio de dolarapi.com.

**Independent Test**: ingresar montos y elegir tipos de cambio/direcciones, verificar el
resultado, y verificar que un fallo de la fuente se comunica sin mostrar un valor.

### Tests for User Story 6 ⚠️ (escribir primero, deben fallar)

- [ ] T103 [P] [US6] Contract test `GET /converter/rates` + `POST /converter/convert` (incluye
  502 ante fallo/timeout de la fuente) en `backend/tests/contract/converter.test.ts`
- [ ] T104 [P] [US6] Integration test: timeout de 5000ms a dolarapi.com (mockeado con `nock`)
  produce error explícito sin valor de conversión en
  `backend/tests/integration/converter-timeout.test.ts` (FR-032, SC-004)

### Implementation for User Story 6

- [ ] T105 [US6] Implementar el cliente de dolarapi.com con timeout de 5000ms en
  `backend/src/modules/converter/infrastructure/dolarApiClient.ts` (research.md §8/§9; hace
  pasar T104)
- [ ] T106 [US6] Implementar la query `GetRates` (mapea los 7 tipos a la `casa` de dolarapi.com,
  FR-029) en `backend/src/modules/converter/application/queries/getRates.ts` (depende de T105)
- [ ] T107 [US6] Implementar el comando `ConvertAmount` (usa `venta`, FR-030/FR-031) en
  `backend/src/modules/converter/application/commands/convertAmount.ts` (depende de T105)
- [ ] T108 [US6] Implementar `backend/src/modules/converter/interface/converterRoutes.ts`
  (contrato de error 502, FR-032) y montarla en `backend/src/app.ts` (depende de T016, T021,
  T106, T107; hace pasar T103)
- [ ] T109 [P] [US6] Construir la pantalla Conversor (monto, selector de dirección, 7 tipos de
  cambio, resultado) en `frontend/src/app/conversor/page.tsx` y
  `frontend/src/components/converter/ConverterForm.tsx`
- [ ] T110 [P] [US6] Test de frontend: error explícito y sin valor de conversión ante fallo de
  la fuente (`handleRequest` mockeado con 502) en
  `frontend/__tests__/converter/converter-form.test.tsx` (FR-032, RF30)

**Checkpoint**: las 6 historias de usuario funcionan de forma independiente y en conjunto.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: mejoras que afectan a varias historias

- [ ] T111 [P] Ejecutar y validar los 6 escenarios de `quickstart.md` de punta a punta
- [ ] T112 [P] Tests unitarios de casos límite del reseteo de bloqueo (éxito vs. expiración de
  los 15 min) en `backend/tests/unit/auth/lockout-reset.test.ts`
- [ ] T113 [P] Verificar el comportamiento responsive de SC-006 (320px y el breakpoint de 500px)
  en Dashboard, Transacciones y Login/Registro
- [ ] T114 [P] Verificar el presupuesto de carga de SC-003 (<2s a 10 Mbps) en las rutas
  principales
- [ ] T115 Revisión de seguridad: confirmar que no hay secretos commiteados y que los
  `.env.example` reflejan las variables de research.md (Principio IV)
- [ ] T116 [P] Actualizar instrucciones de ejecución en `AGENTS.md`/README si se agregaron
  scripts nuevos

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede arrancar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias de usuario
- **User Stories (Phase 3-8)**: todas dependen de Foundational; entre sí, siguen el orden de
  prioridad P1 → P2 → P3, pero cada una es independientemente implementable y testeable
- **Polish (Phase 9)**: depende de las historias que se quieran incluir en el release

### User Story Dependencies

- **US1 (P1)**: sin dependencias de otra historia — es el MVP
- **US2 (P1)**: reutiliza `RegisterUser` de US1 para sembrar fuentes/categorías (T067), pero es
  independientemente testeable con las fuentes/categorías predefinidas
- **US3 (P2)**: requiere transacciones existentes (US2) para tener datos que sumar, pero su
  propio código (query de saldos) no depende del código de US2
- **US4 (P2)**: requiere transacciones existentes (US2); reutiliza el `TransactionRepository` de
  US2 sin duplicar código
- **US5 (P3)**: requiere transacciones existentes (US2); reutiliza el `TransactionRepository`
- **US6 (P3)**: totalmente independiente — solo depende de Foundational

### Within Each User Story

- Tests se escriben y deben fallar antes de la implementación (Principio I)
- Dominio/entidades → repositorios → comandos/queries (CQRS) → rutas → frontend
- La historia se da por completa antes de pasar a la siguiente prioridad

### Parallel Opportunities

- Todas las tareas [P] de Setup pueden correr en paralelo
- Todas las tareas [P] de Foundational pueden correr en paralelo (dentro de la Phase 2)
- Una vez completada Foundational, US1-US6 pueden desarrollarse en paralelo si hay capacidad de
  equipo (US3/US4/US5 requieren que exista el módulo de transacciones de US2 para tener datos,
  no para compilar)
- Dentro de cada historia, todos los tests marcados [P] pueden correr en paralelo entre sí

---

## Parallel Example: User Story 1

```bash
# Lanzar todos los tests de US1 en paralelo:
Task: "Contract test POST /auth/register en backend/tests/contract/auth-register.test.ts"
Task: "Contract test POST /auth/login en backend/tests/contract/auth-login.test.ts"
Task: "Contract test POST /auth/logout en backend/tests/contract/auth-logout.test.ts"
Task: "Contract test WebAuthn en backend/tests/contract/auth-webauthn.test.ts"
Task: "Contract test /auth/passkeys en backend/tests/contract/auth-passkeys.test.ts"
Task: "Integration test de bloqueo por intentos fallidos en backend/tests/integration/auth-lockout.test.ts"
Task: "Integration test de expiración de sesión en backend/tests/integration/auth-session-expiry.test.ts"

# Lanzar entidades de dominio de US1 en paralelo:
Task: "Entidad User en backend/src/modules/auth/domain/user.ts"
Task: "Entidad PasskeyCredential en backend/src/modules/auth/domain/passkeyCredential.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 únicamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (crítico — bloquea todas las historias)
3. Completar Phase 3: US1
4. **DETENER Y VALIDAR**: probar US1 de forma independiente (registro/login/logout/passkeys)
5. Desplegar/demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → probar de forma independiente → demo (MVP: acceso seguro)
3. US2 → probar de forma independiente → demo (alta de movimientos)
4. US3 → probar de forma independiente → demo (saldos)
5. US4 → probar de forma independiente → demo (filtros/paginación)
6. US5 → probar de forma independiente → demo (gráficos)
7. US6 → probar de forma independiente → demo (conversor)
8. Polish

### Parallel Team Strategy

Con varios desarrolladores: Setup + Foundational en conjunto; luego un dev en US1 mientras otro
prepara el andamiaje de US2 (puede empezar entidades/repos sin bloquear, aunque el seed de datos
de fábrica —T067— requiere que `RegisterUser` de US1 exista).

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- [Story] mapea cada tarea a su historia de usuario para trazabilidad
- Cada historia debe quedar completable y testeable de forma independiente
- Verificar que los tests fallan antes de implementar (Principio I, NON-NEGOTIABLE en este
  proyecto — no es opcional como en el template base)
- Commitear después de cada tarea o grupo lógico
- Detenerse en cada checkpoint para validar la historia de forma independiente
- Evitar: tareas vagas, conflictos de mismo archivo entre tareas [P], dependencias cruzadas
  entre historias que rompan la independencia
