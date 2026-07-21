# Implementation Plan: Finanzas Personales (Multi-banco, ARS/USD)

**Branch**: `001-finanzas-personales` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-finanzas-personales/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Centralizar el registro de ingresos y egresos de un usuario argentino en múltiples bancos y
efectivo (ARS/USD), con acceso exclusivo por passkey o contraseña (nunca ambos), saldos por
fuente y consolidados, filtros/paginación de historial, gráficos de gastos y un conversor
USD/ARS contra dolarapi.com. Enfoque técnico: frontend Next.js organizado por funcionalidad con
un único wrapper HTTP (`services/handleRequest.ts`); backend Express con arquitectura DDD (un
módulo por contexto: auth, transacciones, saldos, etc.) y CQRS interno (comandos vs queries por
módulo, sin framework ni broker adicional); MongoDB como única base de datos; WebAuthn
(`@simplewebauthn`) para passkeys y Argon2id para contraseñas.

## Technical Context

**Language/Version**: TypeScript sobre Node.js v24 LTS (frontend y backend, AGENTS.md)

**Primary Dependencies**:
- Frontend: Next.js (App Router) + React + Tailwind, `axios` (encapsulado en
  `services/handleRequest.ts`), `next-auth` (sesión), `@simplewebauthn/browser`, `recharts`
  (research.md §7), `@heroicons/react` (íconos, ver "Estándares de Interfaz" abajo). Sin
  librería de componentes UI: los componentes se construyen a medida sobre clases Tailwind.
- Backend: Express, `@simplewebauthn/server` (research.md §1), `argon2` (research.md §2),
  `jsonwebtoken` (sesión propia, research.md §3), driver oficial de MongoDB (o `mongoose`),
  `axios` (dolarapi.com, research.md §8).

**Storage**: MongoDB (colecciones descriptas en `data-model.md`; cifrado en reposo a nivel de
almacenamiento, research.md §4)

**Testing**: Jest en ambos proyectos (AGENTS.md); `supertest` + `nock` en backend,
`@testing-library/react` en frontend (research.md §11); mocks obligatorios de backend/terceros
en tests de frontend (Principio V) y de dolarapi.com en tests de backend.

**Target Platform**: Aplicación web — frontend Next.js (SSR/browser) y backend Express como
servicio Node independiente, ambos sobre Linux/Node runtime; sin requisito de plataforma
específica en el spec.

**Project Type**: web (frontend `frontend/` + backend `backend/` separados, AGENTS.md) → Option
2 de la estructura estándar, adaptada a la arquitectura por funcionalidad (frontend) y DDD+CQRS
(backend) que definimos.

**Performance Goals**: páginas < 2s en conexión de 10 Mbps (SC-003); resultado de cotización o
error explícito en ≤ 5s (SC-004, timeout research.md §9); alta de transacción completable en
< 30s de interacción de usuario (SC-002, meta de UX, no solo de red).

**Constraints**: hasheo de contraseña equivalente/superior a OWASP (FR-033); cifrado en reposo
de datos financieros (FR-034); sin valor de conversión ante fallo/timeout de dolarapi.com
(FR-032, RF30); sesión de 1 día con logout inmediato (FR-037, FR-041); bloqueo de 15 min tras 5
intentos fallidos, por cuenta (FR-036); UI sin scroll horizontal desde 320px (SC-006); 46
requisitos funcionales (FR-001 a FR-046) sin detalles de implementación adicionales fuera de los
ya fijados por AGENTS.md/constitución.

**Scale/Scope**: una cuenta = un usuario, sin cuentas compartidas (Assumptions); historial de
transacciones paginado de a 50 (FR-024); 6 historias de usuario (P1 a P3); disponibilidad
objetivo 99% mensual (SC-005), sin requisito de escala multi-instancia.

## Estándares de Interfaz (Frontend)

Decidido junto al usuario, aplica a toda pantalla de esta feature (no solo a un componente
puntual):

### Componentes base

- **Componentes**: Tailwind puro, sin librería de componentes headless/UI (ni shadcn/ui, ni
  Radix, ni similares). Cada componente se construye a medida en `components/<funcionalidad>/`
  con clases Tailwind directas; los componentes verdaderamente compartidos entre funcionalidades
  (botón, input, modal base, loader) viven en `components/shared/`.
- **Paleta de color**: escala neutra de Tailwind (`slate`) para texto/fondos/bordes, más **un**
  color de acento único para acciones primarias (botones de confirmar, links activos, foco de
  navegación). Los estados semánticos (éxito, error, advertencia) usan los verdes/rojos/ámbares
  estándar de Tailwind (`green-*`, `red-*`, `amber-*`) solo en su contexto puntual (mensajes de
  error de FR-004/FR-020/FR-032, badges de éxito) — no como color protagonista permanente de
  ingresos/egresos en toda la UI.
- **Modo oscuro**: habilitado por defecto (clase `dark` de Tailwind aplicada al montar la app;
  paleta neutra + acento con sus variantes `dark:` correspondientes). No se especificó si existe
  un toggle a modo claro — se documenta como pendiente si se llega a pedir.
- **Íconos**: `@heroicons/react` (set `outline` por defecto, `solid` para estados activos/
  seleccionados), para mantener consistencia visual con Tailwind Labs y evitar mezclar sets.
- **Tipografía**: fuente por defecto del sistema vía Tailwind (`font-sans`), sin fuente custom
  cargada — evita una dependencia de carga adicional que compita con la meta de SC-003 (< 2s).
- **Inputs y labels**: todo label va fuera y arriba de su input (nunca flotante ni dentro del
  campo); todo input/select/textarea tiene esquinas redondeadas de 10px (`rounded-[10px]`).
- **Botones**: en `:hover`, el fondo cambia a una variante más clara del color base del botón
  (para el color de acento y para los semánticos), sin otro cambio de estilo asociado.

### Layout de pantallas

- **Dashboard** (destino tras login exitoso, FR-003): accesos principales como tarjetas
  horizontales — "Alta de categoría", "Alta de fuente de dinero", "Transacciones",
  "Conversor" — cada una con un título y una breve descripción debajo explicando qué se hace
  ahí. Responsive: se apilan en columna cuando el ancho de viewport es < 500px (dentro del
  rango general de SC-006, que exige sin scroll horizontal desde 320px). Arriba a la derecha,
  un ícono de menú hamburguesa despliega: "Cerrar Sesión" (FR-041) y "Agregar/Borrar passkey"
  (FR-005/FR-006/FR-007).
- **Login y Registro**: tarjeta centrada vertical y horizontalmente, con sombra, que ocupa el
  40% del ancho de la pantalla. Dividida en dos mitades por una línea vertical: la izquierda
  muestra un logo/isotipo de la app (temática financiera); la derecha contiene el formulario en
  columna con los inputs requeridos y, según la pantalla, los botones "Ingreso" + "Ingreso con
  passkey" (login) o "Registrar" + "Registro con passkey" (registro).
- **Alta de categoría / fuente de dinero**: formulario centrado vertical y horizontalmente en
  la pantalla, campos distribuidos en dos columnas.
- **Transacciones** (reemplaza "Alta de transacción" en el menú del dashboard; concentra las
  Historias 2, 3 y 4): una única pantalla dividida en cuadrantes.
  - Mitad superior, dividida en dos: **izquierda** = formulario de alta de transacción (en
    columna, FR-016/FR-017); **derecha** = tabla de saldo por fuente de dinero (FR-021, una
    fila por fuente).
  - Mitad inferior, dividida en dos: **izquierda** = historial/listado de transacciones con
    filtros por día/mes/año y paginación de 50 (FR-023/FR-024); **derecha** = gráfico de gastos
    (FR-025 a FR-027), visible desde el primer ingreso o egreso cargado, mostrando por defecto
    el porcentaje gastado por categoría sobre el total del mes en curso.
  - Responsive: igual criterio que el dashboard — los cuatro cuadrantes se apilan en una sola
    columna (alta → historial → saldos → gráfico) cuando el viewport es < 500px.

### Estado de carga global

- **Loader**: overlay circular centrado, a pantalla completa, con fondo semitransparente que
  bloquea clicks sobre el contenido subyacente (`pointer-events: none` en el contenido de atrás
  mientras el overlay está activo). Se activa automáticamente al iniciar cualquier llamada que
  pase por `services/handleRequest.ts` y se desactiva al resolverse (éxito o error) — se
  implementa como estado global expuesto por un `LoadingProvider` en `providers/`, sin que cada
  pantalla tenga que gestionarlo manualmente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Resultado |
|---|---|---|
| I. Test-First (NON-NEGOTIABLE) | El plan fija Jest + supertest/nock (backend) y Testing Library (frontend) como suites obligatorias; el ciclo rojo-verde-refactor se aplica en `/speckit-tasks`/implementación, no en este plan. Sin violación. | **PASS** |
| II. Aislamiento de la lógica de IA | La feature no invoca ningún modelo de IA; no aplica ningún módulo de IA. | **N/A** |
| III. Fidelidad a la fuente de verdad | El conversor solo usa el `venta` de dolarapi.com en el momento de cada conversión (research.md §8), sin caché ni valores inventados; ante fallo se informa error explícito (FR-032) en vez de estimar. | **PASS** |
| IV. Cero secretos hardcodeados | `MONGODB_URI`, `SESSION_JWT_SECRET`, `WEBAUTHN_RP_ID/ORIGIN`, `DOLARAPI_BASE_URL` van por variables de entorno (quickstart.md); `.env.example` sin valores reales. | **PASS** |
| V. Tests de frontend sin backend real | `services/handleRequest.ts` centraliza toda llamada HTTP, lo que permite mockearlo por completo en tests de frontend sin tocar red (research.md §11). | **PASS** |
| Restricciones de dominio (RF01-02, RF33, RF30) | Cubiertas explícitamente en `contracts/api.md` (rechazo de método distinto, bloqueo de última passkey, sin valor de conversión ante fallo) y `data-model.md` (`authMethod` inmutable). | **PASS** |

No hay violaciones que requieran `Complexity Tracking`.

**Re-check post Phase 1** (tras `data-model.md`, `contracts/api.md`, `quickstart.md`): el modelo
de datos y los contratos no introducen ninguna llamada a IA, ningún secreto embebido, ninguna
caché de cotizaciones, y mantienen `security_events` fuera de cualquier contrato expuesto al
usuario final. Los seis chequeos de la tabla se mantienen en **PASS/N/A** sin cambios.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/                     # rutas Next.js (App Router)
│   ├── components/              # UI a medida (sin librería de componentes), por funcionalidad
│   │   ├── shared/               # componentes verdaderamente compartidos (botón, input, modal)
│   │   ├── auth/
│   │   ├── transactions/
│   │   ├── balances/
│   │   ├── charts/
│   │   └── converter/
│   ├── hooks/
│   ├── providers/
│   ├── services/
│   │   └── handleRequest.ts     # handleRequest(method, endpoint, body?, headers?) — único
│   │                             # punto de entrada HTTP; todo GET/POST pasa por acá
│   └── utils/
└── __tests__/
    ├── __mocks__/                # mocks compartidos (incl. handleRequest, dolarapi.com)
    ├── auth/
    ├── transactions/
    ├── balances/
    ├── charts/
    └── converter/

backend/
├── src/
│   ├── modules/                  # un bounded context DDD por dominio
│   │   ├── auth/
│   │   │   ├── domain/           # entidades, value objects, interfaces de repositorio
│   │   │   ├── application/
│   │   │   │   ├── commands/     # CQRS write side (Register, Login, AddPasskey, ...)
│   │   │   │   └── queries/      # CQRS read side (ListPasskeys, ...)
│   │   │   ├── infrastructure/   # repos Mongo, adaptador @simplewebauthn, Argon2
│   │   │   └── interface/        # rutas/controladores Express
│   │   ├── money-sources/        # (mismas 4 capas)
│   │   ├── categories/
│   │   ├── transactions/
│   │   ├── balances/             # solo application/queries (read-model derivado)
│   │   ├── charts/                # solo application/queries
│   │   ├── converter/
│   │   └── security-log/         # solo escritura interna, sin interface/ pública (FR-040)
│   └── shared/                    # kernel: config/env, middlewares, manejo de errores, bus CQRS
└── tests/
    ├── unit/                      # domain + application, por módulo
    ├── integration/                # supertest contra Express + Mongo en memoria
    └── contract/                   # valida contracts/api.md (request/response shape)
```

**Structure Decision**: Option 2 (web application: `frontend/` + `backend/` separados, ya fijado
en AGENTS.md), adaptada con dos convenciones explícitas del equipo: (1) en `frontend/`, todo
acceso HTTP pasa por `services/handleRequest.ts`, y los tests viven en `__tests__/` a la misma
altura que `src/`, con una carpeta por funcionalidad; (2) en `backend/`, cada `modules/<contexto>`
sigue DDD (domain → application → infrastructure → interface) con CQRS explícito dentro de
`application/` (`commands/` vs `queries/`), sin depender de un framework CQRS externo
(research.md §10).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No aplica: el Constitution Check no registró violaciones (ver tabla arriba, todas en PASS/N/A).
