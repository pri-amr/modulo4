---

description: "Task list template for feature implementation"
---

# Tasks: Finanzas Personales (Multi-banco, ARS/USD)

**Input**: Design documents from `/specs/001-finanzas-personales/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: incluidas y obligatorias — el Principio I de la constitución (Test-First,
NON-NEGOTIABLE) exige un test que falle antes de todo código de producción. Por historia, TODOS
los tests (contrato, integración y frontend) se agrupan en una única sección "Tests" que va
antes de la sección "Implementation" completa de esa historia — igual que un endpoint puede
tener varios tests de contrato antes de construirse capa por capa, un componente de frontend
tiene su test antes de implementarse, nunca después.

**Organization**: Tareas agrupadas por historia de usuario (US1-US7, prioridad de spec.md) para
permitir implementación y prueba independientes de cada una. **US1 se divide en dos fases no
consecutivas**: Phase 3a (usuario/contraseña, MVP) y Phase 3b (passkeys, ubicada después de US7)
— ver la nota de alcance al inicio de Phase 3a y la nota de posición al inicio de Phase 3b, por
la decisión de orden de entrega de plan.md/spec.md (`/speckit-analyze` 2026-07-25, INC1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: historia de usuario a la que pertenece (US1..US7); Setup/Foundational/Polish no
  llevan story label
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Web app (`backend/` + `frontend/`, DDD+CQRS backend / arquitectura por funcionalidad frontend),
según `plan.md` → Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicialización de ambos proyectos según `plan.md`

- [X] T001 Crear el esqueleto de carpetas `backend/` y `frontend/` según el árbol de
  `plan.md` → Project Structure (módulos DDD vacíos en `backend/src/modules/`, carpetas de
  frontend en `frontend/src/`, incluyendo `components/categories/` y `components/money-sources/`)
- [X] T002 [P] Inicializar `backend/package.json` (Express, TypeScript, `mongoose`, `argon2`,
  `jsonwebtoken`, `@simplewebauthn/server`, `axios`, `zod` — validación de esquema FR-048,
  `helmet` — cabeceras de seguridad FR-047) y `backend/tsconfig.json`
- [X] T003 [P] Inicializar `frontend/package.json` (Next.js, React, TypeScript, Tailwind, `axios`,
  `next-auth`, `@simplewebauthn/browser`, `recharts`, `@heroicons/react`) y `frontend/tsconfig.json`
- [X] T004 [P] Configurar `frontend/tailwind.config.ts`: modo oscuro por defecto (`darkMode:
  'class'`, aplicada en el root layout), paleta neutra (`slate`) + token de color de acento,
  utilidad de esquinas 10px para inputs
- [X] T005 [P] Configurar ESLint/Prettier en `backend/.eslintrc.cjs` y `frontend/.eslintrc.cjs`
- [X] T006 [P] Configurar Jest + `supertest` + `nock` en `backend/jest.config.ts`
- [X] T007 [P] Configurar Jest + `@testing-library/react` (entorno jsdom) en
  `frontend/jest.config.ts`
- [X] T008 [P] Crear `backend/.env.example` y `frontend/.env.example` con `MONGODB_URI`,
  `SESSION_JWT_SECRET`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `DOLARAPI_BASE_URL`,
  `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BACKEND_API_URL` — solo nombres, sin valores
  reales. **Corrección 2026-07-24**: `BACKEND_API_URL` renombrada a
  `NEXT_PUBLIC_BACKEND_API_URL` — `handleRequest.ts` corre en el navegador (llamado desde
  componentes cliente), y Next.js solo inyecta al bundle del cliente las env vars con
  prefijo `NEXT_PUBLIC_`; sin el prefijo, `axios` terminaba pegándole al propio servidor de
  Next.js (404) en vez del backend.
  (Principio IV)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestructura compartida que TODAS las historias necesitan

**⚠️ CRITICAL**: ninguna historia de usuario puede comenzar hasta que esta fase esté completa

### Backend

- [X] T009 Implementar la conexión a MongoDB en `backend/src/shared/infrastructure/db.ts`,
  usando un motor/instancia con cifrado en reposo habilitado (encrypted storage engine
  self-hosted o cifrado gestionado del proveedor, research.md §4, FR-034; verificación final en
  T135)
- [X] T010 [P] Implementar el loader de configuración de entorno con validación en
  `backend/src/shared/config/env.ts`
- [X] T011 [P] Implementar el formato de error estándar y el middleware de manejo de errores
  Express en `backend/src/shared/http/errorHandler.ts` (contracts/api.md, formato de error)
- [X] T012 [P] Test unitario del middleware `validateSchema` (esquema `zod` válido pasa; esquema
  inválido responde 400 con el formato de error estándar y `field` indicando la ruta del campo)
  en `backend/tests/unit/shared/validateSchema.test.ts` — escribir primero, debe fallar (FR-048)
- [X] T013 [P] Implementar el middleware `validateSchema(schema)` en
  `backend/src/shared/http/validateSchema.ts` (FR-048, research.md §12; hace pasar T012) — se
  monta en cada ruta de escritura (`interface/*Routes.ts`) antes de despachar el Command/Query
  correspondiente
- [X] T014 [P] Test unitario del bus de comandos/queries (resuelve el handler correcto, lanza
  error ante un tipo no registrado) en `backend/tests/unit/shared/cqrs-bus.test.ts` — escribir
  primero, debe fallar
- [X] T015 [P] Implementar el bus de comandos y el bus de queries in-process en
  `backend/src/shared/cqrs/bus.ts` (research.md §10; hace pasar T014)
- [X] T016 [P] Test unitario de emisión/verificación/expiración del token de sesión en
  `backend/tests/unit/shared/sessionToken.test.ts` — escribir primero, debe fallar
- [X] T017 Implementar la emisión/verificación del JWT de sesión en
  `backend/src/shared/auth/sessionToken.ts` (research.md §3; hace pasar T016)
- [X] T018 [P] Test unitario de `setSessionCookie`/`clearSessionCookie` (verifica los atributos
  `httpOnly`, `secure` y `sameSite=strict` — única protección CSRF exigida, sin token
  adicional) en `backend/tests/unit/shared/sessionCookie.test.ts` — escribir primero, debe
  fallar (FR-046)
- [X] T019 Implementar `setSessionCookie`/`clearSessionCookie` en
  `backend/src/shared/http/sessionCookie.ts` (FR-046, research.md §14; depende de T017; hace
  pasar T018) — usado por cualquier ruta que emita o invalide la cookie de sesión (login,
  webauthn-verify, logout)
- [X] T020 Implementar el middleware `requireSession` (adjunta `req.userId` desde la cookie de
  sesión, 401 si falta/es inválida) en `backend/src/shared/http/requireSession.ts` (depende de
  T017)
- [X] T021 Implementar el repositorio Mongo de `security_events` con índice TTL a 30 días en
  `backend/src/modules/security-log/infrastructure/securityEventRepository.ts` (FR-039,
  data-model.md; depende de T009)
- [X] T022 [P] Test unitario del handler `RecordSecurityEvent` en
  `backend/tests/unit/security-log/recordSecurityEvent.test.ts` — escribir primero, debe fallar
- [X] T023 Implementar el comando `RecordSecurityEvent` en
  `backend/src/modules/security-log/application/commands/recordSecurityEvent.ts` (FR-038;
  depende de T021; hace pasar T022). Nota: este módulo NUNCA recibe una carpeta `interface/`
  (sin rutas Express) — es la forma en que se cumple FR-040; la ausencia se verifica en T131.
- [X] T024 [P] Test unitario de `requireOwnership` (404 ante mismatch de `userId`, dispara el
  log de auditoría, FR-008/SC-008) en `backend/tests/unit/shared/requireOwnership.test.ts` —
  escribir primero, debe fallar
- [X] T025 Implementar el helper `requireOwnership` en
  `backend/src/shared/http/requireOwnership.ts` (FR-008; depende de T020, T023; hace pasar T024)
- [X] T026 [P] Test unitario de las cabeceras de seguridad HTTP montadas vía `helmet()` (verifica
  la presencia de al menos `Content-Security-Policy`, `X-Content-Type-Options` y
  `X-Frame-Options` en la respuesta) en `backend/tests/unit/shared/securityHeaders.test.ts` —
  escribir primero, debe fallar (FR-047)
- [X] T027 Bootstrap de la app Express (`helmet()` montado globalmente para cabeceras de
  seguridad HTTP FR-047, hace pasar T026; parseo JSON, montaje de error handler, placeholder de
  rutas bajo el prefijo `/api/v1` fijado en contracts/api.md — todos los módulos montan sus
  rutas ahí) en `backend/src/app.ts` (depende de T026)
- [X] T028 [P] Bootstrap del entrypoint del servidor (lee `PORT`, conecta Mongo antes de
  escuchar) en `backend/src/server.ts` (depende de T009, T027)

### Frontend

- [X] T029 [P] Test unitario de `handleRequest` (casos de éxito y error, `axios` mockeado) en
  `frontend/__tests__/__mocks__/handleRequest.test.ts` — escribir primero, debe fallar
- [X] T030 [P] Implementar `handleRequest(method, endpoint, body?, headers?)` en
  `frontend/src/services/handleRequest.ts` (hace pasar T029)
- [X] T149 [P] Test unitario de `LoadingProvider` (arranca idle, `start()`/`stop()` con conteo
  superpuesto, muestra/oculta `Loader`, `useLoading()` fuera del provider lanza error) en
  `frontend/__tests__/providers/loading-provider.test.tsx` — escribir primero, debe fallar.
  **Corrección `/speckit-analyze` 2026-07-25 (CON1)**: T031 estaba marcada `[X]` sin este test;
  se revirtió temporalmente la implementación a un stub, se confirmó que este test fallaba
  (rojo), y se restauró la implementación original para hacerlo pasar (verde)
- [X] T031 [P] Implementar `LoadingProvider` (estado global de carga) en
  `frontend/src/providers/LoadingProvider.tsx` (depende de T030; hace pasar T149). **Nota**: cada
  pantalla llama `start()`/`stop()` alrededor de su propio uso de `handleRequest` (vía
  `useLoading()`), en vez de que `handleRequest` lo dispare automáticamente — más simple de
  testear mockeando `handleRequest` por componente; revisar si conviene automatizarlo cuando
  haya más de una pantalla usándolo.
- [X] T144 [P] Test unitario de `Loader` (overlay circular a pantalla completa con `role=status`;
  spinner indeterminado tipo Material Design — arco que crece y se achica mientras gira — en el
  color `#376BCB`) en `frontend/__tests__/shared/loader.test.tsx` — escribir primero, debe fallar
  (FR-055). **Corrección `/speckit-analyze` 2026-07-25 (CON1/COV2)**: T032 estaba marcada `[X]`
  sin este test y sin el color/animación de FR-055; se agregó este test contra la implementación
  anterior (confirmado rojo), y se reimplementó `Loader.tsx` para hacerlo pasar (verde)
- [X] T032 [P] Implementar el overlay `Loader` circular a pantalla completa, fondo
  semitransparente, bloqueo de clicks, con spinner SVG indeterminado (arco `stroke-dasharray`
  animado, keyframe `loader-dash` en `frontend/tailwind.config.ts`) en el color `#376BCB`, en
  `frontend/src/components/shared/Loader.tsx` (hace pasar T144, FR-055)
- [ ] T033 [P] Implementar el componente `Button` compartido (fondo más claro en `:hover`) en
  `frontend/src/components/shared/Button.tsx`
- [ ] T034 [P] Implementar el componente `Input` compartido (label fuera y arriba, esquinas
  10px) en `frontend/src/components/shared/Input.tsx`
- [ ] T035 [P] Implementar los componentes `Card`/`Modal` compartidos en
  `frontend/src/components/shared/Card.tsx` y `frontend/src/components/shared/Modal.tsx`
- [X] T145 [P] Test unitario de `useThemeStore` (default oscuro, `toggleTheme()` alterna
  claro/oscuro, persiste la preferencia en `localStorage`) en
  `frontend/__tests__/stores/theme-store.test.ts` — escribir primero, debe fallar (FR-054)
- [X] T146 [P] Implementar `useThemeStore` (`zustand` + middleware `persist`, backing en
  `localStorage`, clave `theme-preference`) en `frontend/src/stores/themeStore.ts` (hace pasar
  T145, FR-054)
- [X] T147 [P] Test unitario de `ThemeToggle` (ícono fijo con clase `fixed`; al hacer click
  alterna el tema en `useThemeStore` y la clase `dark` en `document.documentElement`) en
  `frontend/__tests__/shared/theme-toggle.test.tsx` — escribir primero, debe fallar (FR-054)
- [X] T148 [P] Implementar `ThemeToggle` (ícono fijo visible en toda pantalla — incluidas
  Login/Registro —, `@heroicons/react` Sun/Moon según el tema activo) en
  `frontend/src/components/shared/ThemeToggle.tsx` (depende de T146; hace pasar T147, FR-054)
- [X] T150 [P] Extender el test de `RootLayout` (T036) para exigir que también monte
  `ThemeToggle` (además de la clase `dark` y `LoadingProvider`) en
  `frontend/__tests__/app/layout.test.tsx` — escribir primero, debe fallar (FR-054). Requirió
  agregar un mock de `./globals.css` (`jest.mock(..., { virtual: true })`) porque el proyecto no
  tenía un `moduleNameMapper` de CSS para tests que importan `app/layout.tsx` directamente
- [X] T036 Configurar el layout raíz con modo oscuro por defecto, `LoadingProvider` y
  `ThemeToggle` montados en `frontend/src/app/layout.tsx` (depende de T031, T032, T148; hace
  pasar T150) — shell mínimo (html/body + clase `dark` + provider + toggle), sin el contenido
  del Dashboard (T064, Historia 1). **Corrección `/speckit-analyze` 2026-07-25 (CON1)**: no tenía
  test; se revirtió temporalmente a un stub sin clase `dark` ni `LoadingProvider`, se confirmó
  rojo contra un primer test, y luego se agregó `ThemeToggle` con su propio ciclo rojo-verde
  (T150)
- [ ] T037 [P] Configurar el esqueleto de next-auth (estrategia `jwt`, sin providers todavía) en
  `frontend/src/app/api/auth/[...nextauth]/route.ts` (research.md §3)

**Checkpoint**: Fundación lista — las historias de usuario pueden implementarse.

---

## Phase 3a: User Story 1 - Registro y acceso con usuario/contraseña (Priority: P1) 🎯 MVP

**Nota de alcance (orden de entrega, `/speckit-analyze` 2026-07-25 → INC1)**: por la decisión de
entrega fijada en plan.md (Summary) y spec.md (Assumptions), esta fase implementa la Historia de
Usuario 1 **solo** con usuario/contraseña. El soporte de passkeys (registro, login, gestión) es
la **misma** historia, pero se construye en **Phase 3b**, deliberadamente ubicada al final de
este archivo (después de Phase 9/US7, antes de Polish) — no es una historia nueva, es una
continuación pospuesta.

**Goal**: registro/login exclusivo por usuario/contraseña, bloqueo tras intentos fallidos, sesión
de 1 día, logout inmediato.

**Independent Test**: registrar una cuenta con usuario/contraseña, cerrar sesión, y verificar que
solo ese método permite volver a entrar.

### Tests for User Story 1a ⚠️ (escribir primero, deben fallar)

- [ ] T038 [P] [US1] Contract test `POST /auth/register` (usuario/contraseña) en
  `backend/tests/contract/auth-register.test.ts` — la variante de alta con passkey se agrega en
  T138 (Phase 3b)
- [ ] T039 [P] [US1] Contract test `POST /auth/login` (éxito, password incorrecto, cuenta
  bloqueada) en `backend/tests/contract/auth-login.test.ts` — el caso "método distinto al
  elegido" (FR-002) recién es verificable cuando exista un segundo método real; se agrega en
  T041 (Phase 3b)
- [ ] T040 [P] [US1] Contract test `POST /auth/logout` en `backend/tests/contract/auth-logout.test.ts`
- [ ] T043 [P] [US1] Integration test: 5 logins fallidos por contraseña → 423 bloqueado → el
  contador se resetea con éxito o al expirar los 15 min en
  `backend/tests/integration/auth-lockout.test.ts` (FR-036)
- [ ] T044 [P] [US1] Integration test: la sesión expira al día en
  `backend/tests/integration/auth-session-expiry.test.ts` (FR-037)
- [ ] T045 [P] [US1] Test de frontend: Login/Registro con usuario/contraseña — validación,
  mensajes de error/reintento (FR-004), y delegación correcta al backend vía el provider de
  next-auth (`handleRequest` mockeado) en `frontend/__tests__/auth/login-register.test.tsx` — los
  botones "... con passkey" se prueban en Phase 3b (T141/T142)
- [ ] T046 [P] [US1] Test de frontend: Dashboard shell — renderiza las 4 tarjetas correctas y el
  menú hamburguesa con "Cerrar Sesión" (`handleRequest` mockeado) en
  `frontend/__tests__/auth/dashboard-shell.test.tsx` — el ítem "Agregar-Borrar passkey" se agrega
  en T143 (Phase 3b)

### Implementation for User Story 1a

- [ ] T048 [P] [US1] Implementar la entidad de dominio `User` (inmutabilidad de `authMethod`,
  password ≥4 caracteres, FR-042) en `backend/src/modules/auth/domain/user.ts`
- [ ] T050 [US1] Implementar `UserRepository` (Mongo) en
  `backend/src/modules/auth/infrastructure/userRepository.ts` (depende de T009, T048)
- [ ] T052 [US1] Implementar el comando `RegisterUser` (FR-001, FR-042; hashea la contraseña con
  Argon2id vía `argon2`, algoritmo/parámetros OWASP-equivalentes exigidos por FR-033,
  research.md §2) en `backend/src/modules/auth/application/commands/registerUser.ts` (depende
  de T050; hace pasar T038) — la variante de alta con passkey se agrega en T054 (Phase 3b)
- [ ] T053 [US1] Implementar el comando `LoginWithPassword` (bloqueo FR-036) en
  `backend/src/modules/auth/application/commands/loginWithPassword.ts` (depende de T050, T023;
  hace pasar T039, T043) — el rechazo de método distinto (FR-002) se activa en Phase 3b, cuando
  exista un segundo método real
- [ ] T057 [US1] Implementar el comando `Logout` (invalida la sesión de inmediato, FR-041) en
  `backend/src/modules/auth/application/commands/logout.ts` (depende de T017; hace pasar T040)
- [ ] T059 [US1] Implementar `backend/src/modules/auth/interface/authRoutes.ts` cableando
  T052/T053/T057 (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`) según
  contracts/api.md §Auth (depende de T020, T025, T052, T053, T057; usa T013 `validateSchema` en
  cada endpoint de escritura FR-048, T019 `setSessionCookie`/`clearSessionCookie` para emitir/
  invalidar la cookie de sesión en login y logout FR-046) — las rutas de WebAuthn y de gestión de
  passkeys se agregan en T140 (Phase 3b), extendiendo este mismo archivo
- [ ] T060 [US1] Montar las rutas de auth en `backend/src/app.ts` (depende de T027, T059)
- [ ] T061 [P] [US1] Implementar el provider de next-auth que delega en el backend vía
  `handleRequest` (flujo de credenciales usuario/contraseña) en
  `frontend/src/app/api/auth/[...nextauth]/route.ts` (depende de T030, T037; hace pasar parte de
  T045) — la extensión para passkey se agrega en Phase 3b
- [ ] T062 [P] [US1] Construir la pantalla de Login (tarjeta centrada 40% de ancho, logo a la
  izquierda, línea divisoria, formulario en columna a la derecha, botón "Ingreso"; redirige al
  dashboard tras autenticación exitosa, FR-003) en `frontend/src/app/login/page.tsx` y
  `frontend/src/components/auth/LoginForm.tsx` (hace pasar el resto de T045) — el botón "Ingreso
  con passkey" se agrega en T141 (Phase 3b)
- [ ] T063 [P] [US1] Construir la pantalla de Registro (mismo layout, botón "Registrar"; redirige
  al dashboard tras registro exitoso, FR-003) en `frontend/src/app/registro/page.tsx` y
  `frontend/src/components/auth/RegisterForm.tsx` — el botón "Registro con passkey" se agrega en
  T142 (Phase 3b)
- [ ] T064 [P] [US1] Construir el shell del Dashboard (4 tarjetas horizontales responsive
  <500px, menú hamburguesa con "Cerrar Sesión") en `frontend/src/app/dashboard/page.tsx` y
  `frontend/src/components/auth/DashboardMenu.tsx` (hace pasar T046) — el ítem "Agregar-Borrar
  passkey" del menú se agrega en T143 (Phase 3b)

**Checkpoint**: US1a funcional y probable de forma independiente (MVP: acceso exclusivo por
usuario/contraseña).

---

## Phase 4: User Story 2 - Alta de fuentes de dinero y categorías propias (Priority: P1)

**Goal**: alta de fuentes de dinero propias (nombre, campo "virtual", monto inicial en ARS y en
USD) y de categorías propias (nombre), partiendo de un catálogo vacío (sin seed) para toda
cuenta recién creada.

**Independent Test**: desde una cuenta recién creada (sin fuentes de dinero ni categorías), dar
de alta una fuente con todos sus campos y una categoría, y verificar que ambas quedan
disponibles para selección — entrega valor por sí sola, sin depender de que existan
transacciones.

### Tests for User Story 2 ⚠️ (escribir primero, deben fallar)

- [ ] T066 [P] [US2] Contract test `GET/POST /money-sources` (catálogo vacío en `GET` para una
  cuenta nueva FR-009; `POST` 201 con `virtual`/`amountARS`/`amountUSD`; 409 nombre duplicado
  FR-011; 400 nombre vacío/>60 FR-010, `virtual` ausente FR-049, monto ausente o negativo
  FR-050/FR-051; 404/405 ante `PUT`/`DELETE` FR-015) en
  `backend/tests/contract/money-sources.test.ts`
- [ ] T067 [P] [US2] Contract test `GET/POST /categories` (catálogo vacío en `GET` para una
  cuenta nueva FR-012; 409 nombre duplicado FR-014; 400 nombre vacío/>60 FR-013; 404/405 ante
  `PUT`/`DELETE` FR-015) en `backend/tests/contract/categories.test.ts`
- [ ] T068 [P] [US2] Test de frontend: `MoneySourceForm` — campos nombre, desplegable "virtual"
  (Sí/No), monto inicial ARS y monto inicial USD; bloquea el alta si falta `virtual` o un monto,
  o si un monto es negativo; muestra error de nombre duplicado en
  `frontend/__tests__/money-sources/money-source-form.test.tsx`
- [ ] T069 [P] [US2] Test de frontend: `CategoryForm` — campo nombre; muestra error de nombre
  duplicado en `frontend/__tests__/categories/category-form.test.tsx`

### Implementation for User Story 2

- [ ] T070 [P] [US2] Implementar la entidad de dominio `MoneySource` (nombre ≤60 inmutable
  FR-015; `virtual` booleano obligatorio e inmutable FR-049; `amountARS`/`amountUSD` obligatorios
  y ≥0 al alta FR-050/FR-051, inmutables salvo el recálculo automático) en
  `backend/src/modules/money-sources/domain/moneySource.ts`
- [ ] T071 [P] [US2] Implementar `MoneySourceRepository` (Mongo) en
  `backend/src/modules/money-sources/infrastructure/moneySourceRepository.ts` (depende de T009,
  T070)
- [ ] T072 [P] [US2] Implementar la entidad de dominio `Category` (nombre ≤60 inmutable FR-015)
  en `backend/src/modules/categories/domain/category.ts`
- [ ] T073 [P] [US2] Implementar `CategoryRepository` (Mongo) en
  `backend/src/modules/categories/infrastructure/categoryRepository.ts` (depende de T009, T072)
- [ ] T074 [US2] Implementar el comando `CreateMoneySource` (nombre propio ≤60 FR-010; chequeo
  de duplicado exacto FR-011; `virtual` obligatorio FR-049; `amountARS`/`amountUSD` obligatorios
  y ≥0 FR-050/FR-051) en `backend/src/modules/money-sources/application/commands/createMoneySource.ts`
  (depende de T071; hace pasar parte de T066)
- [ ] T075 [P] [US2] Implementar la query `ListMoneySources` (devuelve `[]` si la cuenta todavía
  no dio de alta ninguna, FR-009) en
  `backend/src/modules/money-sources/application/queries/listMoneySources.ts` (depende de T071)
- [ ] T076 [US2] Implementar el comando `CreateCategory` (nombre propio ≤60 FR-013; chequeo de
  duplicado exacto FR-014) en `backend/src/modules/categories/application/commands/createCategory.ts`
  (depende de T073; hace pasar parte de T067)
- [ ] T077 [P] [US2] Implementar la query `ListCategories` (devuelve `[]` si la cuenta todavía no
  dio de alta ninguna, FR-012) en
  `backend/src/modules/categories/application/queries/listCategories.ts` (depende de T073)
- [ ] T078 [US2] Implementar `backend/src/modules/money-sources/interface/moneySourceRoutes.ts`
  (solo `GET`/`POST`; `PUT`/`DELETE` responden 404, FR-015; usa T013 `validateSchema`, FR-048)
  (depende de T020, T025, T074, T075; hace pasar el resto de T066)
- [ ] T079 [US2] Implementar `backend/src/modules/categories/interface/categoryRoutes.ts` (mismo
  criterio 404 en `PUT`/`DELETE`, FR-015; usa T013 `validateSchema`, FR-048) (depende de T020,
  T025, T076, T077; hace pasar el resto de T067)
- [ ] T080 [US2] Montar rutas de money-sources/categories en `backend/src/app.ts` (depende de
  T078, T079)
- [ ] T081 [P] [US2] Construir la pantalla "Alta de categoría" (centrada, campo único de nombre)
  en `frontend/src/app/categorias/nueva/page.tsx` y
  `frontend/src/components/categories/CategoryForm.tsx` (hace pasar T069)
- [ ] T082 [P] [US2] Construir la pantalla "Alta de fuente de dinero" (centrada, dos columnas:
  nombre, desplegable "virtual" Sí/No, monto inicial ARS, monto inicial USD) en
  `frontend/src/app/fuentes/nueva/page.tsx` y
  `frontend/src/components/money-sources/MoneySourceForm.tsx` (hace pasar T068)

**Checkpoint**: US1 + US2 funcionan de forma independiente y en conjunto.

---

## Phase 5: User Story 3 - Registro de ingresos y egresos (Priority: P1)

**Goal**: alta/edición/borrado de transacciones — incluida la interacción completa en la UI —
con recálculo automático del monto de la fuente afectada en cada escritura, incluido el cruce de
fuente/moneda cuando una edición las cambia.

**Independent Test**: con al menos una fuente de dinero y una categoría ya dadas de alta (US2),
crear, editar y eliminar transacciones desde una cuenta autenticada, verificando que el listado
y el monto de la fuente reflejan exactamente los datos.

### Tests for User Story 3 ⚠️ (escribir primero, deben fallar)

- [ ] T083 [P] [US3] Contract test `POST/PUT/DELETE /transactions` (validación de campos, monto
  con 3+ decimales se redondea a 2 —mitad hacia arriba— sin rechazar el guardado FR-043, fecha
  futura FR-044, ownership, `PUT` puede cambiar `moneySourceId`/`currency` FR-018) en
  `backend/tests/contract/transactions.test.ts`
- [X] T084 [P] [US3] Integration test: crear un ingreso/egreso recalcula `amountARS` o
  `amountUSD` de la fuente exactamente en el monto ingresado en
  `backend/tests/integration/transactions-balance-recalc.test.ts` (FR-052)
- [ ] T085 [P] [US3] Integration test: editar una transacción cambiando su fuente de dinero y/o
  su moneda revierte el efecto sobre la fuente/moneda original y lo aplica sobre la nueva en
  `backend/tests/integration/transactions-edit-cross-source.test.ts` (FR-018, FR-052,
  research.md §16)
- [ ] T086 [P] [US3] Integration test: eliminar una transacción revierte su efecto sobre el
  monto de la fuente en `backend/tests/integration/transactions-delete-recalc.test.ts` (FR-052)
- [ ] T087 [P] [US3] Integration test: un egreso que deja el monto de una fuente en negativo se
  guarda igual, sin bloqueo, en
  `backend/tests/integration/transactions-negative-balance.test.ts` (Edge Case, clarificación
  2026-07-24)
- [X] T088 [P] [US3] Test unitario: si el ajuste del monto de la fuente falla tras crear la
  transacción, `CreateTransaction` revierte (borra) la transacción recién creada antes de
  propagar el error — rollback de compensación, research.md §16 — en
  `backend/tests/unit/transactions/createTransaction.test.ts` (FR-020, FR-052)
- [X] T089 [P] [US3] Test de frontend: validación, prevención de doble envío (FR-045),
  conservación de datos ante fallo (FR-020), y selectores de fuente/categoría vacíos si la
  cuenta todavía no dio de alta ninguna (FR-009, FR-012) de `TransactionForm` en
  `frontend/__tests__/transactions/transaction-form.test.tsx`
- [ ] T090 [P] [US3] Test de frontend: `TransactionHistory` renderiza el listado, permite editar
  una transacción (reutilizando `TransactionForm`, incluido cambiar de fuente/moneda) y
  eliminarla con diálogo de confirmación (FR-018, FR-019) en
  `frontend/__tests__/transactions/transaction-history.test.tsx`

### Implementation for User Story 3

- [X] T091 [P] [US3] Implementar entidad de dominio + repositorio `Transaction` (precisión de 2
  decimales FR-043, fecha ≤ hoy FR-044) en
  `backend/src/modules/transactions/domain/transaction.ts` y
  `backend/src/modules/transactions/infrastructure/transactionRepository.ts`
- [X] T093 [US3] Implementar el comando `CreateTransaction` (FR-016/017/044; redondea `amount` a
  2 decimales con redondeo estándar mitad-hacia-arriba si llega con mayor precisión, FR-043;
  crea la transacción y ajusta `amountARS`/`amountUSD` de la fuente correspondiente en una
  segunda escritura, con rollback de compensación —borra la transacción recién creada— si ese
  ajuste falla, FR-052, research.md §16) en
  `backend/src/modules/transactions/application/commands/createTransaction.ts` (depende de
  T071, T091; hace pasar parte de T083, T084)
- [ ] T094 [US3] Implementar el comando `UpdateTransaction` (FR-018; si `moneySourceId` y/o
  `currency` cambiaron, revierte el efecto sobre la fuente/moneda original y aplica el nuevo
  sobre la fuente/moneda nueva mediante escrituras secuenciales, con rollback de compensación
  ante un fallo intermedio, FR-052, research.md §16) en
  `backend/src/modules/transactions/application/commands/updateTransaction.ts` (depende de
  T071, T091; hace pasar parte de T083, T085)
- [ ] T095 [US3] Implementar el comando `DeleteTransaction` (FR-019; revierte el efecto sobre el
  monto de la fuente, con rollback de compensación si ese ajuste falla, FR-052) en
  `backend/src/modules/transactions/application/commands/deleteTransaction.ts` (depende de
  T071, T091; hace pasar el resto de T083, T086)
- [ ] T096 [US3] Implementar `backend/src/modules/transactions/interface/transactionRoutes.ts`
  (solo POST/PUT/DELETE en esta historia; GET con filtros llega en US5; usa T013
  `validateSchema`, FR-048, y T025 `requireOwnership` en `PUT/DELETE /transactions/:id` para
  garantizar 404 ante una transacción de otra cuenta, FR-008/SC-008; depende de T020, T025,
  T093-T095). **Estado parcial**: `POST /` ya implementado (depende de T093); `PUT`/`DELETE`
  quedan pendientes de T094/T095.
- [X] T097 [US3] Montar rutas de transactions en `backend/src/app.ts` (depende de T080, T096) —
  cableado real en `backend/src/server.ts` con las implementaciones Mongo; alcanza hoy solo
  `POST` (lo único que expone T096 por ahora)
- [X] T098 [US3] Construir el shell de la pantalla "Transacciones" (grilla de 4 cuadrantes,
  apilado en columna <500px) en `frontend/src/app/transacciones/page.tsx` (depende de T036) —
  solo el cuadrante de alta tiene contenido real; saldos/historial/gráfico quedan como
  secciones vacías hasta US4/US5/US6
- [X] T099 [US3] Construir el formulario de alta de transacción (cuadrante superior izquierdo,
  botón deshabilitado durante el envío y `Loader` de pantalla completa vía `LoadingProvider`
  mientras la petición está en curso, FR-045) en
  `frontend/src/components/transactions/TransactionForm.tsx` (depende de T098, T031, T032;
  hace pasar T089). **Nota**: `moneySources`/`categories` se reciben como props (`[]` por
  ahora); la pantalla los poblará desde `GET /money-sources`/`GET /categories` cuando exista
  US2. El truncado con "…" + tooltip (Edge Case de spec.md) aplica a T100/T106, que muestran
  listados, no a este formulario con `<select>` nativos.
- [ ] T100 [US3] Construir el historial/listado base (cuadrante inferior izquierdo de
  "Transacciones"): renderiza las transacciones (nombre de fuente/categoría y descripción
  truncados con "…" si no entran en el ancho disponible, con tooltip al hover mostrando el
  contenido completo), permite editar reutilizando `TransactionForm` en modo edición (incluido
  cambiar fuente/moneda) y eliminar con diálogo de confirmación (FR-018, FR-019) en
  `frontend/src/components/transactions/TransactionHistory.tsx` (depende de T094, T095, T099;
  hace pasar T090). Los filtros por período y la paginación se agregan en US5
  (T112) sobre este mismo componente.

**Checkpoint**: US1-US3 funcionan de forma independiente y en conjunto — incluye la interacción
completa (alta, edición, borrado) desde la UI, con el monto de cada fuente siempre al día.

---

## Phase 6: User Story 4 - Visibilidad de saldos por fuente y consolidados (Priority: P2)

**Goal**: saldo por fuente/moneda (leído directamente del monto persistido en la fuente) y saldo
consolidado por moneda (agregado on-demand sobre las fuentes del usuario).

**Independent Test**: con transacciones ya cargadas (US3), el saldo por fuente y el consolidado
coinciden con monto inicial + ingresos − egresos.

### Tests for User Story 4 ⚠️ (escribir primero, deben fallar)

- [ ] T101 [P] [US4] Contract test `GET /balances` (por fuente y consolidado) en
  `backend/tests/contract/balances.test.ts`
- [ ] T102 [P] [US4] Integration test: el saldo por fuente/moneda leído de
  `money_sources.amountARS`/`amountUSD` coincide con su monto inicial más ingresos menos
  egresos tras varias transacciones en `backend/tests/integration/balances-calculation.test.ts`
  (FR-021/FR-022, SC-007)
- [ ] T103 [P] [US4] Test de frontend: `BalanceTable` renderiza filas por fuente + totales
  consolidados (`handleRequest` mockeado) en `frontend/__tests__/balances/balance-table.test.tsx`

### Implementation for User Story 4

- [ ] T104 [US4] Implementar la query `GetBalances` (lee `amountARS`/`amountUSD` de
  `money_sources` directamente para el saldo por fuente; agregación on-demand solo para el
  consolidado por moneda, FR-021/FR-022, data-model.md "Saldo") en
  `backend/src/modules/balances/application/queries/getBalances.ts` (depende de T071; hace
  pasar T101, T102)
- [ ] T105 [US4] Implementar `backend/src/modules/balances/interface/balanceRoutes.ts` (usa T013
  `validateSchema`, FR-048) y montarla en `backend/src/app.ts` (depende de T020, T025, T104)
- [ ] T106 [US4] Construir la tabla de saldos por fuente (cuadrante superior derecho de
  "Transacciones"; nombre de fuente truncado con "…" y tooltip al hover si no entra en el ancho
  disponible) en `frontend/src/components/balances/BalanceTable.tsx` (depende de T098; hace
  pasar T103)

**Checkpoint**: US1-US4 funcionan de forma independiente y en conjunto.

---

## Phase 7: User Story 5 - Filtrado y navegación del historial de transacciones (Priority: P2)

**Goal**: filtro por día/mes/año y paginación de 50, agregados sobre el historial ya construido
en US3 (T100).

**Independent Test**: con >50 transacciones en varios períodos, cada filtro acota el listado y
la paginación no repite ni omite registros.

### Tests for User Story 5 ⚠️ (escribir primero, deben fallar)

- [ ] T107 [P] [US5] Contract test `GET /transactions` con filtros día/mes/año y paginación en
  `backend/tests/contract/transactions-list.test.ts`
- [ ] T108 [P] [US5] Integration test: límite de paginación (50 vs. 51) sin repetir ni omitir en
  `backend/tests/integration/transactions-pagination.test.ts` (FR-024)
- [ ] T109 [P] [US5] Test de frontend: cambio de filtros día/mes/año y paginación sin repetidos
  sobre `TransactionHistory` (`handleRequest` mockeado) en
  `frontend/__tests__/transactions/transaction-history-filters.test.tsx`

### Implementation for User Story 5

- [ ] T110 [US5] Implementar la query `ListTransactions` (filtro día/mes/año, tamaño de página
  50, orden por defecto: fecha de transacción descendente con `createdAt` descendente como
  desempate, FR-024) en `backend/src/modules/transactions/application/queries/listTransactions.ts`
  (FR-023/FR-024; depende de T091; hace pasar T107, T108)
- [ ] T111 [US5] Agregar `GET /transactions` a
  `backend/src/modules/transactions/interface/transactionRoutes.ts` (depende de T096, T110)
- [ ] T112 [US5] Extender `TransactionHistory` (construida en US3, T100) con filtros por
  día/mes/año y controles de paginación, sin tocar la lógica de edición/borrado ya existente, en
  `frontend/src/components/transactions/TransactionHistory.tsx` (depende de T100, T110; hace
  pasar T109)

**Checkpoint**: US1-US5 funcionan de forma independiente y en conjunto.

---

## Phase 8: User Story 6 - Análisis visual de gastos (Priority: P3)

**Goal**: gráfico de torta de gastos por categoría, filtrable por rango de fechas y categoría.

**Independent Test**: con gastos en varias categorías/fechas, el gráfico por defecto y los
filtros muestran exactamente los subconjuntos esperados.

### Tests for User Story 6 ⚠️ (escribir primero, deben fallar)

- [ ] T113 [P] [US6] Contract test `GET /charts/expenses-by-category` (mes por defecto, rango de
  fechas, filtro de categoría, `currency` explícito, y `currency` omitido resuelve a la moneda
  con más gastos —o la única con gastos— e informa `availableCurrencies`, FR-053) en
  `backend/tests/contract/charts.test.ts`
- [ ] T114 [P] [US6] Integration test: la distribución porcentual respeta la regla de redondeo
  (1 decimal por categoría, ajuste en la de mayor monto para sumar exactamente 100%) definida en
  `backend/tests/integration/charts-percentage.test.ts` (FR-025)
- [ ] T115 [P] [US6] Test de frontend: vista por defecto del mes en curso, selector ARS/USD
  (oculto si solo hay una moneda con gastos, visible y funcional si hay ambas) e interacción con
  filtros de fecha/categoría de `ExpensesPieChart` (`handleRequest` mockeado) en
  `frontend/__tests__/charts/expenses-pie-chart.test.tsx`

### Implementation for User Story 6

- [ ] T116 [US6] Implementar la query `GetExpensesByCategory` (mes en curso calculado en zona
  horaria de Argentina, America/Argentina/Buenos_Aires UTC-3 fijo; el cálculo es siempre de una
  única moneda, nunca combina ARS y USD; si no se pide `currency` explícita, resuelve a la moneda
  con más gastos en el período —o la única con gastos— e informa `availableCurrencies`, FR-053;
  redondeo de porcentaje a 1 decimal con ajuste en la categoría de mayor monto para sumar
  exactamente 100%) en `backend/src/modules/charts/application/queries/getExpensesByCategory.ts`
  (FR-025/FR-026/FR-027/FR-053; depende de T091; hace pasar T113, T114)
- [ ] T117 [US6] Implementar `backend/src/modules/charts/interface/chartRoutes.ts` (usa T013
  `validateSchema`, FR-048) y montarla en `backend/src/app.ts` (depende de T020, T025, T116)
- [ ] T118 [US6] Construir el gráfico de torta con `recharts` (cuadrante inferior derecho de
  "Transacciones", filtros de fecha/categoría, selector ARS/USD que solo se muestra cuando
  `availableCurrencies` trae ambas monedas, FR-053) en
  `frontend/src/components/charts/ExpensesPieChart.tsx` (depende de T098; hace pasar T115)

**Checkpoint**: US1-US6 funcionan de forma independiente y en conjunto.

---

## Phase 9: User Story 7 - Conversión entre USD y ARS (Priority: P3)

**Goal**: conversor USD/ARS en ambas direcciones con los 7 tipos de cambio de dolarapi.com.

**Independent Test**: ingresar montos y elegir tipos de cambio/direcciones, verificar el
resultado, y verificar que un fallo de la fuente se comunica sin mostrar un valor.

### Tests for User Story 7 ⚠️ (escribir primero, deben fallar)

- [ ] T119 [P] [US7] Contract test `GET /converter/rates` + `POST /converter/convert` (incluye
  502 ante fallo/timeout de la fuente, y ante respuesta 200 sin el tipo de cambio pedido) en
  `backend/tests/contract/converter.test.ts`
- [ ] T120 [P] [US7] Integration test: timeout de 5000ms a dolarapi.com (mockeado con `nock`)
  produce error explícito sin valor de conversión en
  `backend/tests/integration/converter-timeout.test.ts` (FR-032, SC-004)
- [ ] T121 [P] [US7] Test de frontend: error explícito y sin valor de conversión ante fallo de
  la fuente (`handleRequest` mockeado con 502) en
  `frontend/__tests__/converter/converter-form.test.tsx` (FR-032, RF30)

### Implementation for User Story 7

- [ ] T122 [US7] Implementar el cliente de dolarapi.com con timeout de 5000ms en
  `backend/src/modules/converter/infrastructure/dolarApiClient.ts` (research.md §8/§9; trata una
  respuesta 200 sin el tipo de cambio solicitado igual que un fallo de la fuente, FR-030/FR-032;
  hace pasar T120)
- [ ] T123 [US7] Implementar la query `GetRates` (mapea los 7 tipos a la `casa` de dolarapi.com,
  FR-029) en `backend/src/modules/converter/application/queries/getRates.ts` (depende de T122)
- [ ] T124 [US7] Implementar el comando `ConvertAmount` (usa `venta`, FR-030/FR-031) en
  `backend/src/modules/converter/application/commands/convertAmount.ts` (depende de T122)
- [ ] T125 [US7] Implementar `backend/src/modules/converter/interface/converterRoutes.ts`
  (contrato de error 502, FR-032; usa T013 `validateSchema`, FR-048) y montarla en
  `backend/src/app.ts` (depende de T020, T025, T123, T124; hace pasar T119)
- [ ] T126 [US7] Construir la pantalla Conversor, sección dedicada del dashboard (monto,
  selector de dirección, 7 tipos de cambio, resultado, FR-028) en
  `frontend/src/app/conversor/page.tsx` y `frontend/src/components/converter/ConverterForm.tsx`
  (hace pasar T121)

**Checkpoint**: las 7 historias de usuario funcionan de forma independiente y en conjunto.

---

## Phase 3b: User Story 1 (continuación) - Passkeys como método alternativo (Priority: P1)

**Nota de posición**: esta fase pertenece a la misma Historia de Usuario 1 (Phase 3a, más
arriba), pero se ubica acá — después de las 7 historias de usuario — porque plan.md (Summary) y
spec.md (Assumptions) fijan que las passkeys se agregan recién "una vez cerrada" la base
completa de la app con usuario/contraseña. Ninguna tarea de esta fase depende técnicamente de
US2-US7; el orden es una decisión de entrega, no una dependencia de datos o de código.

**Goal**: agregar passkeys (WebAuthn/FIDO2) como método de autenticación alternativo — registro
de una cuenta directamente con passkey, login por passkey, gestión (alta/baja) de passkeys desde
una cuenta ya existente, y rechazo de login con un método distinto al elegido (FR-002) ahora que
existen dos métodos reales.

**Independent Test**: registrar una cuenta nueva eligiendo passkey, cerrar sesión, volver a
entrar solo con passkey; desde una cuenta con contraseña, agregar una passkey adicional y
verificar que el botón "... con passkey" aparece en Login/Registro y que el ítem "Agregar-Borrar
passkey" aparece en el menú del Dashboard.

### Tests for User Story 1 (passkeys) ⚠️ (escribir primero, deben fallar)

- [ ] T041 [P] [US1] Contract test de la ceremonia WebAuthn (registration-options/verify,
  authentication-options/verify), incluyendo el rechazo de login por passkey en una cuenta con
  método contraseña (FR-002) en `backend/tests/contract/auth-webauthn.test.ts`
- [ ] T042 [P] [US1] Contract test `GET/POST/DELETE /auth/passkeys` (incluye 409 al borrar la
  última) en `backend/tests/contract/auth-passkeys.test.ts`
- [ ] T047 [P] [US1] Test de frontend: `PasskeyManager` bloquea borrar la última passkey
  (`handleRequest` mockeado) en `frontend/__tests__/auth/passkey-manager.test.tsx`
- [ ] T138 [P] [US1] Extender el contract test `POST /auth/register` (T038, Phase 3a) con la
  variante de alta eligiendo passkey como método en `backend/tests/contract/auth-register.test.ts`
- [ ] T139 [P] [US1] Extender el test de frontend Login/Registro (T045, Phase 3a) con los botones
  y el flujo "Ingreso con passkey"/"Registro con passkey" en
  `frontend/__tests__/auth/login-register.test.tsx`

### Implementation for User Story 1 (passkeys)

- [ ] T049 [P] [US1] Implementar la entidad de dominio `PasskeyCredential` en
  `backend/src/modules/auth/domain/passkeyCredential.ts`
- [ ] T051 [US1] Implementar `PasskeyCredentialRepository` (Mongo) en
  `backend/src/modules/auth/infrastructure/passkeyRepository.ts` (depende de T009, T049)
- [ ] T054 [US1] Implementar la ceremonia de alta de passkey (`@simplewebauthn/server`,
  FR-005/FR-006), incluida la variante de alta de cuenta eligiendo passkey como método (FR-001)
  en `backend/src/modules/auth/application/commands/registerPasskey.ts` (depende de T051; hace
  pasar parte de T041 y T138)
- [ ] T055 [US1] Implementar la ceremonia de login por passkey, incluido el rechazo si la cuenta
  eligió contraseña como método (FR-002) en
  `backend/src/modules/auth/application/commands/loginWithPasskey.ts` (depende de T051; hace
  pasar el resto de T041)
- [ ] T056 [US1] Implementar el comando `DeletePasskey` (bloquea la última, FR-007) en
  `backend/src/modules/auth/application/commands/deletePasskey.ts` (depende de T051; hace pasar
  T042)
- [ ] T058 [P] [US1] Implementar la query `ListPasskeys` en
  `backend/src/modules/auth/application/queries/listPasskeys.ts` (depende de T051)
- [ ] T140 [US1] Extender `backend/src/modules/auth/interface/authRoutes.ts` (T059, Phase 3a) con
  las rutas de WebAuthn y de gestión de passkeys (T054-T056, T058) según contracts/api.md §Auth
  (depende de T059, T054, T055, T056, T058; usa T013 `validateSchema` FR-048, T019
  `setSessionCookie`/`clearSessionCookie` en webauthn-verify FR-046, y T025 `requireOwnership` en
  `DELETE /auth/passkeys/:id` para garantizar 404 ante una passkey de otra cuenta, FR-008/SC-008)
  — no requiere una tarea nueva de montaje: T060 (Phase 3a) ya monta este mismo router
- [ ] T141 [P] [US1] Agregar el botón "Ingreso con passkey" a la pantalla de Login (T062, Phase
  3a) en `frontend/src/components/auth/LoginForm.tsx` (depende de T062, T140; hace pasar la parte
  de T139 sobre login)
- [ ] T142 [P] [US1] Agregar el botón "Registro con passkey" a la pantalla de Registro (T063,
  Phase 3a) en `frontend/src/components/auth/RegisterForm.tsx` (depende de T063, T140; hace
  pasar la parte de T139 sobre registro)
- [ ] T143 [P] [US1] Agregar el ítem "Agregar-Borrar passkey" al menú hamburguesa del Dashboard
  (T064, Phase 3a) y cablear la navegación a `PasskeyManager` en
  `frontend/src/components/auth/DashboardMenu.tsx` (depende de T064; hace pasar T046 extendido)
- [ ] T065 [P] [US1] Construir la gestión de passkeys (listado con nombre, alta, baja con
  bloqueo de la última) en `frontend/src/components/auth/PasskeyManager.tsx` (depende de T140,
  T143; hace pasar T047)

**Checkpoint**: US1 completa (usuario/contraseña + passkeys) funcional y probable de forma
independiente.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: mejoras que afectan a varias historias

- [ ] T127 [P] Ejecutar y validar los 7 escenarios de `quickstart.md` de punta a punta (SC-001),
  incluyendo la validación no funcional (SC-002 a SC-004, SC-006) y que la app permanece
  navegable/funcional con dolarapi.com caído salvo la sección de conversión (FR-035)
- [ ] T128 [P] Tests unitarios de casos límite del reseteo de bloqueo (éxito vs. expiración de
  los 15 min) en `backend/tests/unit/auth/lockout-reset.test.ts`
- [ ] T129 [P] Verificar el comportamiento responsive de SC-006 (320px y el breakpoint de 500px)
  en Dashboard, Transacciones, Alta de fuente de dinero/categoría y Login/Registro
- [ ] T130 [P] Verificar el presupuesto de carga de SC-003 (<2s a 10 Mbps) en las rutas
  principales
- [ ] T131 [P] Contract test de regresión: confirmar que no existe ninguna ruta pública para
  `security_events` (`GET/POST/PUT/DELETE` responden 404 en cualquier variante razonable de
  path) en `backend/tests/contract/security-log-no-public-access.test.ts` (FR-040). Se corre
  acá, con todos los módulos ya montados, para que el 404 sea significativo y no un falso
  positivo de una app sin rutas.
- [ ] T132 [P] Contract test de regresión: toda respuesta HTTP incluye el set base de cabeceras
  de seguridad (`helmet`, FR-047) y la cookie de sesión emitida en login/webauthn-verify tiene
  los atributos `httpOnly`, `secure` y `sameSite=strict` (FR-046) en
  `backend/tests/contract/security-headers-and-cookie.test.ts`. Se corre acá, con todos los
  módulos ya montados, para cubrir cabeceras en endpoints de todas las historias.
- [ ] T133 [P] Contract test de regresión: un `body`/`query` con forma inválida (tipo incorrecto,
  campo inesperado) en cualquier endpoint de escritura responde 400 con el formato de error
  estándar, sin llegar a tocar la base de datos (FR-048) en
  `backend/tests/contract/input-validation-regression.test.ts`
- [ ] T134 Revisión de seguridad: confirmar que no hay secretos commiteados y que los
  `.env.example` reflejan las variables de research.md (Principio IV)
- [ ] T135 [P] Documentar y verificar la configuración de cifrado en reposo de MongoDB (motor de
  almacenamiento cifrado o cifrado gestionado del proveedor elegido en T009) en
  `backend/README.md` (FR-034)
- [ ] T136 [P] Actualizar instrucciones de ejecución en `AGENTS.md`/README si se agregaron
  scripts nuevos
- [ ] T137 [P] Bug fix (detectado en checklist review, FR-038 fail-open): en
  `backend/src/shared/http/requireOwnership.ts`, el `await onCrossAccountAccessDenied(...)` no
  está protegido — si el registro de auditoría falla, la excepción se propaga en vez del 404
  esperado (fail-closed accidental). Envolver esa llamada en try/catch para que un fallo de
  auditoría nunca impida lanzar el `AppError(404, ...)`. Extender
  `backend/tests/unit/shared/requireOwnership.test.ts` con un caso donde
  `onCrossAccountAccessDenied` rechaza y el 404 igual se lanza (ya redactado, pendiente de
  aplicar) (FR-038)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede arrancar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias de usuario
- **User Stories (Phase 3a-9)**: todas dependen de Foundational; entre sí, siguen el orden de
  prioridad P1 → P2 → P3, pero cada una es independientemente implementable y testeable salvo
  las dos dependencias cruzadas reales documentadas abajo (US3 → US2, US5 → US3)
- **Phase 3b (passkeys, continuación de US1)**: depende técnicamente solo de Foundational y de
  Phase 3a (reutiliza `User`, `authRoutes.ts`, `LoginForm`/`RegisterForm`/`DashboardMenu`); se
  ubica después de Phase 9 por una decisión de orden de entrega (plan.md, spec.md Assumptions),
  no por una dependencia real — técnicamente podría moverse antes si esa decisión cambiara
- **Polish (Phase 10)**: depende de las historias que se quieran incluir en el release;
  T131-T133 específicamente requieren que todos los módulos con rutas (US1a/US1b-US7) ya estén
  montados

### User Story Dependencies

- **US1 (P1)**: sin dependencias de otra historia — Phase 3a (usuario/contraseña) es el MVP;
  Phase 3b (passkeys) solo depende de Phase 3a, no de US2-US7 — su ubicación al final del archivo
  es una decisión de orden de entrega, no una dependencia técnica
- **US2 (P1)**: sin dependencia de otra historia además de Foundational; es independientemente
  testeable dando de alta fuentes/categorías propias (no hay seed automático, FR-009/FR-012)
- **US3 (P1)**: **depende de US2** para tener al menos una fuente de dinero y una categoría con
  las que registrar una transacción real — reutiliza `MoneySourceRepository`/`CategoryRepository`
  creados en US2. El recálculo de FR-052 no requiere replica set de Mongo (research.md §16:
  escritura secuencial con rollback de compensación). Construye `TransactionHistory` (T100) con
  edición y borrado incluidos — esto es deliberado: FR-018/FR-019 son parte de esta historia, no
  de US5.
- **US4 (P2)**: requiere transacciones existentes (US3) para tener montos que reflejar, pero su
  propio código (`GetBalances`) solo depende de `MoneySourceRepository` (ya actualizado por US3)
- **US5 (P2)**: **depende directamente del componente `TransactionHistory` construido en US3**
  (T100) — T112 lo extiende en vez de crear un componente nuevo, para no duplicar la lógica de
  edición/borrado. Esta es una dependencia real entre historias, no solo de datos.
- **US6 (P3)**: requiere transacciones existentes (US3); reutiliza el `TransactionRepository`
- **US7 (P3)**: totalmente independiente — solo depende de Foundational

### Within Each User Story

- Tests (todos: contrato, integración y frontend) se escriben y deben fallar antes de la
  implementación (Principio I) — la sección "Tests" completa precede a la sección
  "Implementation" completa
- Dominio/entidades → repositorios → comandos/queries (CQRS) → rutas (validadas con T013
  `validateSchema`) → frontend
- La historia se da por completa antes de pasar a la siguiente prioridad

### Parallel Opportunities

- Todas las tareas [P] de Setup pueden correr en paralelo
- Todas las tareas [P] de Foundational pueden correr en paralelo (dentro de la Phase 2)
- Una vez completada Foundational, US1a, US2 y US7 pueden desarrollarse en paralelo de inmediato
  (ninguna depende de otra historia); US3 no puede cerrarse funcionalmente hasta que US2 tenga
  al menos una fuente/categoría de prueba, aunque su código puede prepararse en paralelo; US4 y
  US6 pueden empezar su backend en paralelo con US3 pero su frontend depende del shell de
  "Transacciones" (T098, US3); US5 no puede empezar su tarea de frontend (T112) hasta que T100
  (US3) exista; Phase 3b (passkeys) podría empezar en paralelo apenas cierra Phase 3a, pero por
  la decisión de orden de entrega se hace al final, después de US7
- Dentro de cada historia, todos los tests marcados [P] pueden correr en paralelo entre sí

---

## Parallel Example: User Story 1

```bash
# Phase 3a — lanzar todos los tests de US1 (usuario/contraseña) en paralelo:
Task: "Contract test POST /auth/register en backend/tests/contract/auth-register.test.ts"
Task: "Contract test POST /auth/login en backend/tests/contract/auth-login.test.ts"
Task: "Contract test POST /auth/logout en backend/tests/contract/auth-logout.test.ts"
Task: "Integration test de bloqueo por intentos fallidos en backend/tests/integration/auth-lockout.test.ts"
Task: "Integration test de expiración de sesión en backend/tests/integration/auth-session-expiry.test.ts"
Task: "Test de frontend Login/Registro en frontend/__tests__/auth/login-register.test.tsx"
Task: "Test de frontend Dashboard shell en frontend/__tests__/auth/dashboard-shell.test.tsx"

# Lanzar la entidad de dominio de US1a en paralelo (una vez que los tests de arriba fallan):
Task: "Entidad User en backend/src/modules/auth/domain/user.ts"
```

```bash
# Phase 3b (al final, después de US7) — tests de passkeys en paralelo:
Task: "Contract test WebAuthn en backend/tests/contract/auth-webauthn.test.ts"
Task: "Contract test /auth/passkeys en backend/tests/contract/auth-passkeys.test.ts"
Task: "Test de frontend PasskeyManager en frontend/__tests__/auth/passkey-manager.test.tsx"
Task: "Extender contract test de registro con la variante passkey en backend/tests/contract/auth-register.test.ts"
Task: "Extender test de frontend Login/Registro con los botones '...con passkey' en frontend/__tests__/auth/login-register.test.tsx"

# Lanzar la entidad de dominio de passkeys en paralelo (una vez que los tests de arriba fallan):
Task: "Entidad PasskeyCredential en backend/src/modules/auth/domain/passkeyCredential.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1a únicamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (crítico — bloquea todas las historias)
3. Completar Phase 3a: US1 (usuario/contraseña)
4. **DETENER Y VALIDAR**: probar US1a de forma independiente (registro/login/logout con
   usuario/contraseña; passkeys todavía no existen en esta etapa)
5. Desplegar/demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1a → probar de forma independiente → demo (MVP: acceso seguro con usuario/contraseña)
3. US2 → probar de forma independiente → demo (alta de fuentes de dinero y categorías propias)
4. US3 → probar de forma independiente → demo (alta, edición y borrado de movimientos, con el
   monto de cada fuente siempre recalculado)
5. US4 → probar de forma independiente → demo (saldos)
6. US5 → probar de forma independiente → demo (filtros/paginación sobre el historial de US3)
7. US6 → probar de forma independiente → demo (gráficos)
8. US7 → probar de forma independiente → demo (conversor)
9. US1b (Phase 3b) → probar de forma independiente → demo (passkeys como método alternativo,
   última pieza antes de Polish, por la decisión de orden de entrega)
10. Polish

### Parallel Team Strategy

Con varios desarrolladores: Setup + Foundational en conjunto; luego un dev en US1 mientras otro
arranca US2 (fuentes/categorías, sin dependencias); US3 no puede darse por completa
funcionalmente hasta que US2 tenga datos reales para operar, y US5 no puede tocar su tarea de
frontend hasta que `TransactionHistory` de US3 exista.

---

## Notes

- **T092 no existe**: la numeración salta de T091 a T093 en la Phase 5. Se verificó el
  historial de git de este archivo (`git log --all -p -- specs/001-finanzas-personales/tasks.md`)
  y no hay rastro de que T092 haya existido nunca — es un salto de numeración manual entre
  sesiones de edición, no una tarea eliminada. Se deja documentado acá en vez de renumerar,
  para no invalidar referencias a IDs existentes en otras partes de este archivo
  (`/speckit-analyze` 2026-07-25, INC3).
- [P] = archivos distintos, sin dependencias pendientes
- [Story] mapea cada tarea a su historia de usuario para trazabilidad
- Cada historia debe quedar completable y testeable de forma independiente
- Verificar que los tests fallan antes de implementar (Principio I, NON-NEGOTIABLE en este
  proyecto — no es opcional como en el template base); esto aplica igual a tests de frontend
  que a tests de backend, por eso la sección "Tests" de cada historia incluye ambos y precede
  siempre a "Implementation"
- Commitear después de cada tarea o grupo lógico
- Detenerse en cada checkpoint para validar la historia de forma independiente
- Evitar: tareas vagas, conflictos de mismo archivo entre tareas [P], dependencias cruzadas
  entre historias que rompan la independencia (las únicas dependencias cruzadas reales y
  deliberadas son US3 → US2 para tener datos reales y US5 → T100 de US3, documentadas arriba)
