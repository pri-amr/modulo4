# Phase 0 Research: Finanzas Personales (Multi-banco, ARS/USD)

**Input**: Technical Context (unknowns) de `plan.md`, spec.md, AGENTS.md, constitution.md

## 1. Librería WebAuthn/Passkeys (backend)

- **Decision**: `@simplewebauthn/server` (backend) + `@simplewebauthn/browser` (frontend).
- **Rationale**: es la implementación de referencia del W3C WebAuthn más usada en el ecosistema
  Node/Express, mantiene compatibilidad activa con navegadores, no impone un framework
  específico (encaja con Express puro) y separa limpiamente ceremonia de registro/login de la
  persistencia de credenciales, lo que facilita mapearla al módulo `auth` en DDD.
- **Alternatives considered**: `passport-fido2` (menos mantenida, atada a Passport, que no está
  en el stack); implementación manual del protocolo WebAuthn (alto riesgo de errores de
  seguridad en una app financiera, rechazada).

## 2. Hasheo de contraseña (FR-033, RF033)

- **Decision**: Argon2id vía el paquete `argon2`, con parámetros mínimos alineados a la
  recomendación OWASP vigente (m≈19-64 MiB, t≥2, p=1, ajustables por variable de entorno).
- **Rationale**: OWASP Password Storage Cheat Sheet recomienda Argon2id como primera opción
  quo un algoritmo "equivalente o superior" (FR-033); resistente a ataques GPU/ASIC.
- **Alternatives considered**: bcrypt (aceptable pero con límite de 72 bytes de entrada y sin
  resistencia configurable a memoria, inferior a Argon2id); scrypt (viable pero con soporte de
  librerías Node menos maduro que `argon2`).

## 3. Sesión compartida entre Next.js (next-auth) y backend Express separado

- **Decision**: el backend Express emite y valida su propio token de sesión firmado (JWT,
  vencimiento a 1 día por FR-037) en una cookie `httpOnly`/`secure`/`sameSite=strict`; next-auth
  en el frontend se configura con un Credentials Provider / provider custom que delega la
  verificación (contraseña o ceremonia WebAuthn) al backend vía `services/handleRequest.ts`, y
  guarda el JWT emitido por el backend dentro de la sesión de next-auth (estrategia `jwt`) para
  reenviarlo en cada llamada posterior.
- **Rationale**: mantiene al backend como única fuente de verdad de autenticación/autorización
  (Principio III), evita duplicar lógica de expiración/bloqueo en dos sistemas, y respeta que
  frontend y backend son proyectos separados (AGENTS.md) sin state compartido en memoria.
- **Alternatives considered**: `express-session` con store en MongoDB compartido por both apps
  (rechazado: acopla el deploy de frontend y backend a la misma base de sesiones y complica el
  logout inmediato de FR-041); delegar toda la sesión a next-auth sin validación en el backend
  (rechazado: el backend no podría aplicar el bloqueo de FR-036 de forma confiable).

## 4. Cifrado en reposo de datos financieros (FR-034)

- **Decision**: cifrado en reposo a nivel de almacenamiento/volumen de MongoDB (encrypted
  storage engine si es self-hosted, o cifrado gestionado por el proveedor si es managed),
  documentado como cumplimiento de FR-034 sin agregar cifrado a nivel de campo en la aplicación.
- **Rationale**: el spec exige "cifrados en reposo" sin pedir garantías adicionales de cifrado
  por campo o de que ni el propio operador de la base pueda leer los datos; el cifrado a nivel
  de almacenamiento cumple el requisito con la menor complejidad operativa.
- **Alternatives considered**: MongoDB Client-Side Field Level Encryption (CSFLE) por campo
  (rechazado por ahora: agrega gestión de claves y complejidad no exigida explícitamente por
  ningún FR; queda como mejora futura si compliance lo requiere).

## 5. Registro y retención de eventos de seguridad (FR-038, FR-039)

- **Decision**: colección `security_events` en MongoDB con índice TTL (`expireAfterSeconds`)
  sobre el campo `createdAt`, configurado a 30 días.
- **Rationale**: MongoDB borra automáticamente los documentos vencidos sin necesidad de un job
  de limpieza adicional, cumpliendo FR-039 ("MUST permitir su eliminación o rotación") de forma
  nativa y sin nueva infraestructura (no hay cron en el stack declarado).
- **Alternatives considered**: rotación manual vía cron job (rechazada: complejidad operativa
  extra sin beneficio, dado que TTL index resuelve el caso exacto).

## 6. Bloqueo temporal por intentos fallidos (FR-036)

- **Decision**: campos `failedLoginAttempts` (int) y `lockedUntil` (fecha, nullable) en el
  documento de credencial del usuario; el comando de login (CQRS write side) incrementa el
  contador en cada fallo, fija `lockedUntil = now + 15min` al llegar a 5, y ambos se resetean a
  su estado inicial en un login exitoso o cuando `lockedUntil` ya venció.
- **Rationale**: mapea 1:1 con FR-036 (reinicio por éxito o expiración del período) sin
  necesitar un almacén externo (Redis); el volumen de un único usuario por cuenta hace
  innecesario un mecanismo distribuido de rate limiting.
- **Alternatives considered**: Redis con TTL para el contador (rechazado: infraestructura
  adicional no justificada para el volumen de la app; MongoDB ya es la única base declarada).

## 7. Librería de gráficos (FR-025 a FR-027)

- **Decision**: `recharts` en el frontend.
- **Rationale**: componentes React declarativos (encaja con Next.js/React), soporte nativo de
  gráfico de torta con porcentajes, tree-shakeable, y estilable con Tailwind sin CSS adicional
  pesado; comunidad y mantenimiento activos.
- **Alternatives considered**: `chart.js` + `react-chartjs-2` (requiere más configuración manual
  para responsive a 320px); `victory` (bundle más pesado sin beneficio adicional para un único
  gráfico de torta).

## 8. Integración con dolarapi.com (FR-028 a FR-032)

- **Decision**: consumir `GET https://dolarapi.com/v1/dolares` (lista de tipos de cambio, cada
  uno con `casa`, `compra`, `venta`) desde el backend (módulo `converter`), con `axios` y un
  timeout explícito, mapeando los 7 tipos requeridos (oficial, blue, bolsa, cripto, tarjeta,
  contado con liqui, mayorista) a las `casa` correspondientes de la API. El código usado en
  `contracts/api.md` y en el mapeo de tipos para "contado con liqui" es `cclq`.
- **Rationale**: FR-030 exige el valor de `venta`; consumir la API desde el backend (no desde el
  navegador) evita exponer la URL de terceros directamente al cliente y centraliza el manejo de
  timeout/error exigido por FR-032 en un único punto, reutilizable también si se agrega caching
  a futuro.
- **Alternatives considered**: llamar a dolarapi.com directamente desde el frontend (rechazado:
  duplicaría el manejo de error/timeout en cliente y servidor, y complicaría respetar el
  Principio V — tests de frontend sin backend real — al requerir mockear un dominio externo
  también en el cliente).

## 9. Timeout de la consulta de cotización (FR-032, SC-004)

- **Decision**: timeout de 5000 ms en la llamada a dolarapi.com, igual al límite de SC-004.
- **Rationale**: si dolarapi.com no responde antes de ese límite, no tiene sentido seguir
  esperando: SC-004 ya exige informar error a los 5s como máximo.
- **Alternatives considered**: ninguna — el valor surge directamente de un criterio de éxito ya
  medible del spec.

## 10. Patrón CQRS sobre Express (sin framework adicional)

- **Decision**: bus de comandos/queries in-process minimalista (mapa `tipo → handler`) dentro de
  cada módulo DDD; los controladores Express (`interface/`) construyen un Command o Query y lo
  despachan al handler correspondiente en `application/commands` o `application/queries`.
- **Rationale**: AGENTS.md fija Express (no NestJS ni otro framework con CQRS incorporado);
  un bus in-process cubre la separación write/read exigida sin la complejidad operativa de un
  message broker, apropiada para una app de un único proceso/instancia.
- **Alternatives considered**: NestJS con su módulo `@nestjs/cqrs` (rechazado: cambia el stack
  declarado en AGENTS.md); mensajería asíncrona vía RabbitMQ/Kafka (rechazado: sobre-ingeniería,
  no hay ningún requisito de procesamiento asíncrono o multi-instancia en el spec).

## 11. Testing HTTP (mocks de backend y de dolarapi.com)

- **Decision**: `supertest` para tests de integración de endpoints Express; `nock` para mockear
  llamadas salientes a dolarapi.com en tests de backend; `@testing-library/react` + mocks de
  `services/handleRequest.ts` (Principio V) para tests de frontend.
- **Rationale**: son las herramientas estándar de facto sobre Jest para cada capa, evitando
  llamadas reales a red en cualquier test (Principio V, y buena práctica equivalente en backend
  para no depender de que dolarapi.com esté arriba durante CI).
- **Alternatives considered**: MSW (Mock Service Worker) como alternativa a `nock` — válida,
  pero `nock` es más directo para tests puramente backend sin necesidad de interceptar en el
  navegador.

## 12. Validación de esquema de entrada (FR-048)

- **Decision**: `zod` como validador de esquema para todo `body`/`query` de cada endpoint
  Express, aplicado antes de construir el Command/Query que despacha el bus CQRS
  (`shared/http/`).
- **Rationale**: FR-048 exige que ningún input externo alcance la capa de persistencia sin
  pasar por un esquema estricto de tipo/forma; `zod` se integra sin fricción con TypeScript
  (inferencia de tipos desde el esquema), evita duplicar la validación entre el shape-check
  genérico y las reglas de negocio específicas de cada campo (FR-017, FR-043, FR-044), y no
  depende de un framework adicional (coherente con Express puro, research.md §10).
- **Alternatives considered**: `joi` (API menos ergonómica con TypeScript, sin inferencia de
  tipos nativa); validación manual por comando (rechazada: dispersa la lógica de shape-check,
  alto riesgo de un campo sin validar, exactamente el caso que FR-048 busca prevenir).

## 13. Cabeceras de seguridad HTTP (FR-047)

- **Decision**: `helmet` montado como middleware global en `backend/src/app.ts`, con su
  configuración por defecto (incluye política de contenido, prevención de MIME sniffing y de
  embebido en iframes de terceros).
- **Rationale**: es la implementación de referencia en el ecosistema Express para el set base de
  cabeceras de seguridad que exige FR-047, sin requerir configuración manual cabecera por
  cabecera ni mantenimiento propio de una lista de valores recomendados.
- **Alternatives considered**: configurar cada cabecera manualmente en `errorHandler`/middleware
  propio (rechazada: reimplementa lo que `helmet` ya resuelve, con mayor riesgo de omitir una
  cabecera relevante).

## 14. Protección CSRF (FR-046)

- **Decision**: la cookie de sesión (research.md §3) se configura con `sameSite=strict` además
  de `httpOnly`/`secure`; esa configuración es la única protección CSRF exigida, sin un token
  anti-CSRF adicional por operación.
- **Rationale**: `sameSite=strict` impide que el navegador adjunte la cookie de sesión en
  solicitudes originadas en otro sitio, que es exactamente el vector que un token CSRF
  mitigaría; la app no sirve contenido embebido en iframes de terceros ni tiene subdominios que
  requieran `sameSite=lax`, por lo que `strict` no introduce fricción funcional (FR-046,
  clarificación 2026-07-21).
- **Alternatives considered**: token anti-CSRF de doble envío (rechazado: redundante dado
  `sameSite=strict` para el modelo de despliegue de esta app, agrega complejidad no exigida por
  ningún FR).

## 15. Driver de MongoDB (backend)

- **Decision**: `mongoose` como capa de acceso a MongoDB en todos los repositorios
  (`infrastructure/`) del backend.
- **Rationale**: da esquemas y tipado consistente por colección (`users`, `passkey_credentials`,
  `money_sources`, `categories`, `transactions`, `security_events`), coherente con el uso de
  TypeScript en todo el stack; evita que cada repositorio implemente su propio mapeo
  documento↔entidad de dominio a mano sobre el driver nativo.
- **Alternatives considered**: driver oficial de MongoDB (`mongodb`) sin ODM (rechazado: más
  código repetido de mapeo por repositorio, sin beneficio adicional dado que `zod` ya cubre la
  validación de esquema en el borde HTTP, FR-048, research.md §12).

## 16. Consistencia entre transacciones y el monto persistido de la fuente (FR-011, FR-052)

- **Decision**: `CreateTransaction`, `UpdateTransaction` y `DeleteTransaction` escriben el
  documento de `transactions` y luego actualizan `amountARS`/`amountUSD` del `money_sources`
  afectado como dos escrituras secuenciales (no una transacción de Mongo), con **rollback de
  compensación a nivel de aplicación**: si la segunda escritura (el ajuste del monto) falla, se
  revierte la primera (se borra la transacción recién creada, o se reaplica el efecto anterior
  en `UpdateTransaction`) antes de propagar el error. `UpdateTransaction`, cuando cambia
  `moneySourceId` y/o `currency`, sigue el mismo patrón: revierte el efecto sobre la
  fuente/moneda original y aplica el nuevo efecto sobre la fuente/moneda nueva, compensando ante
  cualquier fallo intermedio.
- **Rationale**: FR-052 exige que el monto de la fuente quede recalculado en cada escritura de
  transacción, y una falla a mitad de camino no debe dejarlo desincronizado (Principio III,
  fidelidad a la fuente de verdad). MongoDB solo soporta transacciones multi-documento ACID
  sobre un replica set (no sobre una instancia standalone), y el despliegue objetivo de esta app
  corre contra un servidor MongoDB existente del equipo, sin replica set configurado. Dado que la
  aplicación es de un único usuario por cuenta (Assumptions) — sin escrituras concurrentes reales
  sobre el mismo documento — el riesgo que una transacción de Mongo mitigaría (una isla de
  inconsistencia por una escritura concurrente en curso) no aplica aquí; el único riesgo real es
  que el proceso falle a mitad de las dos escrituras secuenciales, y el rollback de compensación
  cubre ese caso en la práctica totalidad de los escenarios (una excepción controlada durante el
  segundo `await`). Queda sin cubrir únicamente la ventana de milisegundos en la que el propio
  proceso Node muere entre ambas escrituras — un caso excepcional, aceptable para el volumen y
  criticidad de esta app, y muy por debajo del riesgo que ya aceptaba la alternativa de
  reconciliación periódica descartada abajo.
- **Alternatives considered**: transacción de Mongo real vía sesión de Mongoose
  (`session.withTransaction`) (rechazada: exige reconfigurar el servidor MongoDB del equipo como
  replica set, un cambio operativo no deseado sobre infraestructura ya desplegada, para ganar
  robustez marginal frente al rollback de compensación dado el perfil de uso — un solo usuario
  por cuenta, sin concurrencia real); recalcular el monto de la fuente on-demand por agregación
  en cada lectura (rechazado: FR-011/FR-052 piden explícitamente un campo persistido y
  recalculado, no uno derivado en la query; además duplicaría el costo de agregación en cada
  `GET /balances` y en cada selector de fuente del formulario de transacción); actualizar el
  monto de forma no transaccional con reconciliación periódica (rechazado: introduce una ventana
  de datos financieros incorrectos mucho más amplia que la del rollback de compensación,
  inaceptable dado el Principio III).

## Unknowns resueltos

Todos los ítems marcados como `NEEDS CLARIFICATION` en el Technical Context de `plan.md` quedan
resueltos por las decisiones 1 a 16 de este documento. No quedan unknowns pendientes para
Phase 1.
