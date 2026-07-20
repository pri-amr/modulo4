<!--
Sync Impact Report
- Version change: (none) → 1.0.0 (ratificación inicial)
- Principios agregados:
  - I. Test-First (NON-NEGOTIABLE)
  - II. Aislamiento de la lógica de IA
  - III. Fidelidad a la fuente de verdad
  - IV. Cero secretos hardcodeados
  - V. Tests de frontend sin backend real
- Secciones agregadas: Restricciones de Dominio, Stack y Flujo de Desarrollo, Governance
- Secciones removidas: ninguna (primera versión, se reemplazan los placeholders del template)
- Templates revisados:
  - ✅ .specify/templates/plan-template.md (Constitution Check ya es genérico, sin cambios necesarios)
  - ✅ .specify/templates/spec-template.md (sin referencias a principios específicos, sin cambios necesarios)
  - ✅ .specify/templates/tasks-template.md (ya exige tests-first cuando se solicitan tests, consistente con Principio I)
  - ✅ .specify/extensions/agent-context/commands/speckit.agent-context.update.md (agnóstico de agente, sin cambios necesarios)
  - ✅ CLAUDE.md / AGENTS.md (ya contienen las reglas de dominio reflejadas en "Restricciones de Dominio"; sin cambios necesarios)
- TODOs diferidos: ninguno
-->

# Finanzas Personales Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)
Ningún código de producción se escribe sin un test previo que lo justifique. El ciclo de
desarrollo es estrictamente rojo-verde-refactor: (1) se escribe un test que falla porque la
funcionalidad todavía no existe, (2) se implementa el código mínimo necesario para que el test
pase, (3) se refactoriza manteniendo los tests en verde. Los pull requests que agregan o
modifican comportamiento sin tests que lo cubran se rechazan. Esto garantiza que cada
funcionalidad tenga una especificación ejecutable desde el primer commit y evita regresiones
silenciosas.

### II. Aislamiento de la lógica de IA
Toda llamada a modelos de IA (construcción de prompts, clientes de API, parsing de respuestas,
manejo de reintentos y timeouts) vive exclusivamente en un módulo dedicado, separado de la
lógica de negocio, controladores y rutas. La lógica de negocio invoca al módulo de IA a través
de una interfaz clara y nunca depende de detalles de un proveedor específico. Esto permite
testear el negocio mockeando el módulo de IA, y reemplazar o actualizar el proveedor de IA sin
tocar reglas de negocio.

### III. Fidelidad a la fuente de verdad
El sistema nunca inventa ni infiere datos que no estén respaldados por su fuente de verdad
(base de datos, APIs oficiales como dolarapi.com, o input explícito del usuario). Ante
ambigüedad, datos faltantes o baja confianza, el sistema deriva a revisión humana en lugar de
completar huecos con suposiciones o valores generados. Esta regla es especialmente crítica en
datos financieros: un monto, tasa de conversión o movimiento bancario incorrecto no es un error
cosmético, es un daño directo al usuario.

### IV. Cero secretos hardcodeados
Ninguna clave de API, token, contraseña, cadena de conexión o secreto se escribe literalmente
en el código fuente, en archivos versionados o en commits. Todo secreto se obtiene de variables
de entorno o de un gestor de secretos, y los archivos de ejemplo (`.env.example`) solo
contienen nombres de variables, nunca valores reales. Un secreto expuesto en el historial de
git se considera un incidente de seguridad, no un detalle a corregir en el próximo commit.

### V. Tests de frontend sin backend real
Los tests unitarios del frontend nunca realizan llamadas reales al backend ni a APIs externas
(incluida dolarapi.com). Toda respuesta del backend o de terceros se mockea explícitamente
dentro del test. Esto mantiene los tests rápidos, determinísticos y ejecutables sin
infraestructura levantada, y evita que un backend caído o una API externa inestable rompan la
suite de frontend.

## Restricciones de Dominio

Estas reglas provienen de los requisitos funcionales del producto (ver `AGENTS.md`) y son
non-negotiable porque protegen la seguridad de la cuenta y la integridad de los datos
financieros mostrados al usuario:

- **Exclusividad del método de autenticación (RF01-RF02)**: un usuario nunca puede autenticarse
  con un método distinto al que eligió en su registro (passkey o contraseña, no ambos).
- **Retención mínima de passkeys (RF33)**: nunca se permite eliminar la última passkey activa
  de una cuenta; siempre debe quedar al menos una.
- **Sin conversión inventada (RF30)**: si la API de dolarapi.com falla o no responde, no se
  muestra ningún valor de conversión; se muestra un error explícito en su lugar. Esta regla es
  una aplicación directa del Principio III (Fidelidad a la fuente de verdad).

## Stack y Flujo de Desarrollo

- **Frontend**: Next.js (React) + TypeScript, Tailwind, axios y next-auth, en `frontend/`.
- **Backend**: Node.js + Express, en `backend/` (separado del frontend).
- **Base de datos**: MongoDB.
- **Gestor de paquetes**: pnpm. **Testing**: Jest.
- Todo cambio de comportamiento sigue el ciclo del Principio I: test rojo → implementación →
  test verde → refactor. Los pull requests deben mostrar evidencia de que los tests existían
  antes de la implementación (o, como mínimo, que cubren el cambio).
- Los tests de frontend corren aislados del backend real (Principio V); los tests de backend
  que dependan de servicios externos (por ejemplo dolarapi.com) también deben mockear esas
  respuestas para permanecer determinísticos.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, guía o convención informal del
equipo. En caso de conflicto entre esta constitución y cualquier otro documento (incluyendo
`AGENTS.md`, PRs anteriores, o preferencias individuales), la constitución tiene prioridad.

- **Enmiendas**: cualquier cambio a esta constitución se propone explicando el motivo, se
  documenta en el Sync Impact Report de la cabecera del archivo, y se propaga a los templates y
  documentos dependientes (`plan-template.md`, `spec-template.md`, `tasks-template.md`,
  `AGENTS.md`/`CLAUDE.md`) en el mismo cambio.
- **Versionado semántico**: MAJOR para remociones o redefiniciones incompatibles de principios;
  MINOR para agregar un principio o una sección, o expandir materialmente una guía existente;
  PATCH para aclaraciones o correcciones de redacción sin cambio de significado.
- **Cumplimiento**: todo pull request y toda revisión de código deben verificar cumplimiento de
  los principios de esta constitución. Cualquier excepción (por ejemplo, código sin test previo
  por una razón justificada) debe documentarse explícitamente en el PR con la justificación y,
  cuando aplique, un plan para eliminar la excepción.
- La guía operativa día a día para agentes de desarrollo vive en `AGENTS.md`
  (referenciado desde `CLAUDE.md`); esa guía no puede contradecir esta constitución.

**Version**: 1.0.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-20
