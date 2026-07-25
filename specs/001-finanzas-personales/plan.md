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

**Orden de entrega**: la primera fase implementa la aplicación completa usando exclusivamente
usuario/contraseña como método de autenticación; el soporte de passkeys (registro, login,
gestión) se agrega en una fase final, una vez cerrada esa base (spec.md, Assumptions).

## Technical Context

**Language/Version**: TypeScript sobre Node.js v24 LTS (frontend y backend, AGENTS.md)

**Primary Dependencies**:
- Frontend: Next.js (App Router) + React + Tailwind, `axios` (encapsulado en
  `services/handleRequest.ts`), `next-auth` (sesión), `@simplewebauthn/browser`, `recharts`
  (research.md §7), `@heroicons/react` (íconos, ver "Estándares de Interfaz" abajo), `zustand`
  (store del tema claro/oscuro con middleware `persist`, FR-054). Sin librería de componentes
  UI: los componentes se construyen a medida sobre clases Tailwind.
- Backend: Express, `@simplewebauthn/server` (research.md §1), `argon2` (research.md §2),
  `jsonwebtoken` (sesión propia, research.md §3), `mongoose` (acceso a MongoDB, research.md
  §15), `axios` (dolarapi.com, research.md §8), `zod` (validación de esquema de todo input
  externo, FR-048, research.md §12), `helmet` (cabeceras de seguridad HTTP, FR-047, research.md
  §13).

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
de datos financieros (FR-034); sin valor de conversión ante fallo/timeout de dolarapi.com o
respuesta sin el tipo de cambio pedido (FR-032, RF30); sesión de 1 día con logout inmediato
(FR-037, FR-041); bloqueo de 15 min tras 5 intentos fallidos, por cuenta (FR-036); protección
CSRF vía cookie `sameSite=strict`, sin token adicional (FR-046); cabeceras de seguridad HTTP
estándar en toda respuesta (FR-047); validación de esquema estricto de todo input externo antes
de la capa de persistencia (FR-048); sin catálogo predefinido de fuentes de dinero ni categorías
— arrancan vacíos por cuenta (FR-009, FR-012); toda fuente de dinero requiere campo `virtual`
booleano y montos iniciales en ARS/USD ≥0 al darse de alta (FR-049–FR-051), recalculados
automáticamente en cada transacción, incluido el cruce de fuente/moneda al editar (FR-018,
FR-052, research.md §16); TLS terminado en la capa de despliegue, fuera del alcance funcional
del código (Assumptions); UI sin scroll horizontal desde 320px (SC-006); 55 requisitos
funcionales (FR-001 a FR-055) sin detalles de implementación adicionales fuera de los ya fijados
por AGENTS.md/constitución.

**Scale/Scope**: una cuenta = un usuario, sin cuentas compartidas (Assumptions); historial de
transacciones paginado de a 50 (FR-024); 7 historias de usuario (P1 a P3, con US1 dividida en
Phase 3a/Phase 10 de tasks.md por el orden de entrega); disponibilidad objetivo 99% mensual
(SC-005), sin requisito de escala multi-instancia.

## Estándares de Interfaz (Frontend)

Decidido junto al usuario, aplica a toda pantalla de esta feature (no solo a un componente
puntual):

### Componentes base

- **Componentes**: Tailwind puro, sin librería de componentes headless/UI (ni shadcn/ui, ni
  Radix, ni similares). Cada componente se construye a medida en `components/<funcionalidad>/`
  con clases Tailwind directas; los componentes verdaderamente compartidos entre funcionalidades
  (botón, input, modal base, loader) viven en `components/shared/`.
- **Paleta de color — tokens semánticos (fuente de verdad única)**: los colores NO se aplican
  como pares sueltos `bg-x dark:bg-y` en cada componente (ese patrón es frágil — así se llegó a
  un bug donde solo los inputs de `TransactionForm` reaccionaban al tema, `/speckit-analyze`+
  feedback de usuario 2026-07-25). En su lugar, `frontend/src/app/globals.css` define variables
  CSS en `:root` (modo claro) y `.dark` (modo oscuro), y `frontend/tailwind.config.ts` las
  expone como colores Tailwind vía el patrón `rgb(var(--color-x) / <alpha-value>)`. Un
  componente escribe una sola clase (`bg-surface`, `text-fg`) y su valor cambia solo con la
  clase `dark` del ancestro — nunca hace falta un `dark:` explícito para estos tokens. Paleta
  elegida (negro/blanco para texto y fondo, violeta/lila como acento principal, azul/celeste
  para hover y elementos de énfasis secundario como tooltips, grises para texto secundario,
  rojo/verde para error/éxito):

  | Token | Uso | Claro | Oscuro |
  | --- | --- | --- | --- |
  | `bg` | fondo de página (`<body>`) | `#FFFFFF` | `#0B0B12` |
  | `surface` | fondo de tarjetas, inputs, paneles | `#FFFFFF` | `#17161F` |
  | `surface-muted` | paneles/filas alternativas, hover sutil | `#F3F2FA` | `#201E2B` |
  | `fg` | texto principal | `#111114` | `#F5F5F7` |
  | `fg-muted` | texto secundario (subtítulos, ayudas) | `#6B7280` | `#A0A3B1` |
  | `line` | bordes y separadores | `#E2E4EA` | `#2A2836` |
  | `accent` | acento principal — violeta/lila (botones primarios, links activos, foco) | `#7C3AED` | `#9B7BFA` |
  | `accent-blue` | azul/celeste — `:hover` de `accent`, tooltips, énfasis secundario | `#376BCB` (mismo tono que el `Loader`, FR-055) | `#6EA8FF` |
  | `success` | éxito | `#1E8E3E` | `#7DD181` |
  | `error` | error (bordes/mensajes inválidos, FR-004/FR-020/FR-032) | `#DC2626` | `#FF5252` |

  Advertencia usa el `amber-*` estándar de Tailwind puntualmente (no se definió un token
  dedicado, no hay uso todavía). Este es el único lugar donde se documentan los valores; para
  cambiar un color se edita `globals.css`, nunca un componente individual.
- **Modo claro/oscuro**: ambos modos disponibles (FR-054), con modo oscuro por defecto al montar
  la app (clase `dark` de Tailwind aplicada por defecto en `<html>`, que dispara el bloque
  `.dark` de `globals.css` descripto arriba). El control de alternancia es un **ícono fijo
  visible en toda pantalla** (incluidas Login y Registro, antes de autenticarse) — no depende
  del menú hamburguesa del Dashboard, que solo existe una vez logueado. La preferencia se guarda
  en un store de `zustand` con middleware `persist` (backing en `localStorage`); si en la
  práctica aparece un parpadeo del tema por defecto antes de que React hidrate y aplique la
  preferencia guardada (FOUC en el render SSR de Next.js), se migra a leer la preferencia desde
  una cookie en el servidor para aplicar la clase `dark`/sin clase correcta antes del primer
  paint, con el store de `zustand` hidratándose desde esa cookie al montar.
- **Íconos**: `@heroicons/react` (set `outline` por defecto, `solid` para estados activos/
  seleccionados), para mantener consistencia visual con Tailwind Labs y evitar mezclar sets.
- **Tipografía**: fuente por defecto del sistema vía Tailwind (`font-sans`), sin fuente custom
  cargada — evita una dependencia de carga adicional que compita con la meta de SC-003 (< 2s).
- **Inputs y labels**: todo label va fuera y arriba de su input (nunca flotante ni dentro del
  campo); todo input/select/textarea tiene esquinas redondeadas de 10px (`rounded-[10px]`).
- **Botones**: en `:hover`, un botón con fondo `accent` (violeta/lila) cambia a `accent-blue`
  (azul/celeste) — no una variante más clara del mismo tono, sino el segundo color de acento de
  la paleta (ver "Paleta de color" arriba); los botones con color semántico (éxito/error) sí
  usan una variante más clara del mismo tono en `:hover`, sin cambio de estilo adicional.
  `accent-blue` también se usa como hover genérico en botones/íconos secundarios que no parten
  de `accent` (ej. `ThemeToggle`, con fondo `surface-muted`), no solo como hover de `accent`.

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
  passkey" (login) o "Registrar" + "Registro con passkey" (registro). Por el orden de entrega
  fijado arriba, la primera fase solo incluye "Ingreso" / "Registrar"; los botones "... con
  passkey" se agregan recién en la fase final de passkeys.
- **Alta de categoría**: formulario centrado vertical y horizontalmente en la pantalla, un único
  campo de nombre (FR-013).
- **Alta de fuente de dinero**: mismo layout centrado, campos distribuidos en dos columnas:
  nombre, campo "virtual" como desplegable con las opciones "Sí" (billetera virtual) / "No"
  (banco físico) (FR-049), monto inicial en ARS y monto inicial en USD (FR-050/FR-051, ambos
  numéricos, aceptan 0 pero no vacío ni negativo). Sin campo de edición de monto en ningún lado
  de la UI: el monto solo cambia por el recálculo automático al registrar transacciones
  (FR-052).
- **Transacciones** (reemplaza "Alta de transacción" en el menú del dashboard; concentra las
  Historias 2, 3 y 4): una única pantalla dividida en cuadrantes.
  - Mitad superior, dividida en dos: **izquierda** = formulario de alta de transacción (en
    columna, FR-016/FR-017); **derecha** = tabla de saldo por fuente de dinero (FR-021, una
    fila por fuente).
  - Mitad inferior, dividida en dos: **izquierda** = historial/listado de transacciones con
    filtros por día/mes/año y paginación de 50 (FR-023/FR-024); **derecha** = gráfico de gastos
    (FR-025 a FR-027, FR-053), visible desde el primer ingreso o egreso cargado, mostrando por
    defecto el porcentaje gastado por categoría sobre el total del mes en curso, en la moneda con
    más gastos ese mes; si hay gastos en ambas monedas, un selector ARS/USD (visible solo en ese
    caso) permite alternar entre ambos gráficos, que nunca se combinan en uno solo.
  - Responsive: igual criterio que el dashboard — los cuatro cuadrantes se apilan en una sola
    columna (alta → historial → saldos → gráfico) cuando el viewport es < 500px.

### Estado de carga global

- **Loader**: overlay circular centrado, a pantalla completa, con fondo semitransparente que
  bloquea clicks sobre el contenido subyacente (`pointer-events: none` en el contenido de atrás
  mientras el overlay está activo). El círculo se llena progresivamente con el color `#376BCB`
  mientras gira, en animación de carga circular continua (FR-055). Se activa automáticamente al
  iniciar cualquier llamada que pase por `services/handleRequest.ts` y se desactiva al resolverse
  (éxito o error) — se implementa como estado global expuesto por un `LoadingProvider` en
  `providers/`, sin que cada pantalla tenga que gestionarlo manualmente.

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
| Seguridad de datos/API (FR-046 CSRF, FR-047 cabeceras, FR-048 validación de esquema) | `sameSite=strict` como única mitigación CSRF (sin token adicional, research.md §14); `helmet` para cabeceras estándar (research.md §13); `zod` valida todo input externo antes de llegar a comandos/queries (research.md §12). No introduce secretos, IA ni caché de cotizaciones. | **PASS** |

No hay violaciones que requieran `Complexity Tracking`.

**Re-check post Phase 1** (tras `data-model.md`, `contracts/api.md`, `quickstart.md`): el modelo
de datos y los contratos no introducen ninguna llamada a IA, ningún secreto embebido, ninguna
caché de cotizaciones, y mantienen `security_events` fuera de cualquier contrato expuesto al
usuario final. Los siete chequeos de la tabla se mantienen en **PASS/N/A** sin cambios.

**Re-check tras el rediseño de fuentes de dinero/categorías** (FR-008 a FR-015, FR-049 a
FR-052): el monto de una fuente (`amountARS`/`amountUSD`) se recalcula exclusivamente mediante
el flujo de escritura secuencial con rollback de compensación descripto en research.md §16
(sin transacciones de Mongo ni replica set) — nunca se edita a mano ni se deriva de una
estimación, reforzando el Principio III (fidelidad a la fuente de verdad) en vez de
tensionarlo. Ningún chequeo cambia de resultado.

## Project Structure

### Documentation (this feature)

```text
specs/001-finanzas-personales/
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
│   │   ├── categories/
│   │   ├── money-sources/
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
│   └── shared/                    # kernel: config/env, middlewares (errores, seguridad HTTP
│                                    # vía `helmet` FR-047, validación de esquema vía `zod`
│                                    # FR-048), bus CQRS
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
