# Security & Authentication Requirements Checklist: Finanzas Personales (Multi-banco, ARS/USD)

**Purpose**: Validar la calidad (completitud, claridad, consistencia y verificabilidad) de los
requisitos de seguridad y autenticación del spec, como autochequeo del autor antes de correr
`/speckit-plan`.
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md)
**Depth**: Estándar
**Audience/Timing**: Autor, pre-`/speckit-plan`

**Note**: Este checklist valida los REQUISITOS tal como están escritos, no la implementación.
Cada ítem pregunta si el spec está completo, claro, consistente y medible — no si el sistema
"funciona correctamente".

## Requirement Completeness

- [x] CHK001 - ¿Están especificados requisitos de complejidad/longitud mínima de contraseña para el método usuario/contraseña, más allá del hasheo al guardarla? [Gap, Spec §FR-033]
- [x] CHK002 - ¿Está definido qué debe requerirse si el ceremonial WebAuthn se interrumpe por pérdida de conectividad del dispositivo durante el registro de una passkey (distinto de la cancelación ya cubierta)? [Gap, Edge Case]
- [x] CHK003 - ¿Está enumerado de forma exhaustiva el conjunto de "eventos de seguridad" a registrar, o queda abierto a interpretación qué otros eventos deberían sumarse? [Completeness, Spec §FR-038]
- [x] CHK004 - ¿Está definido si el usuario recibe algún aviso in-app cuando su propia cuenta entra en bloqueo temporal, más allá del mensaje de error al momento del intento? [Completeness, Spec §FR-036]
- [x] CHK005 - ¿Están definidos requisitos de recuperación de contraseña ("olvidé mi contraseña") para el método usuario/contraseña, dado que solo se aclaró la ausencia de recuperación para passkeys? [Gap]
- [x] CHK006 - ¿Está definido un mecanismo de cierre de sesión explícito antes de que expire el día de duración de sesión (FR-037)? [Gap, Spec §FR-037]
- [x] CHK029 - ¿Están especificados requisitos de cifrado en tránsito (HTTPS/TLS) para los datos financieros, distintos del cifrado en reposo de FR-034? [Gap, Spec §FR-034]
- [x] CHK030 - ¿Están documentados en el spec (no solo en research.md) los atributos de seguridad exigidos a la cookie de sesión (`httpOnly`, `secure`, `sameSite`)? [Gap, Spec §FR-037]
- [x] CHK031 - ¿Están definidos requisitos de protección contra CSRF para las operaciones que modifican estado (alta/edición/borrado de transacciones, passkeys, fuentes de dinero)? [Gap]
- [x] CHK032 - ¿Están definidos requisitos de sanitización/validación de entrada más allá de la validación de campos ya cubierta (FR-017), para prevenir inyección hacia la base de datos? [Gap]
- [x] CHK033 - ¿Existen requisitos de límite de tasa (rate limiting) para operaciones distintas del login (por ejemplo, alta de transacciones o de passkeys)? [Gap]
- [x] CHK034 - ¿Está el comportamiento "404 en vez de 403 ante acceso cruzado" (documentado en contracts/api.md) especificado también como requisito de negocio dentro del spec, y no solo como detalle de contrato de API? [Gap, Spec §FR-008]
- [x] CHK035 - ¿Existe algún requisito sobre qué cabeceras de seguridad HTTP (CSP, X-Content-Type-Options, etc.) debe emitir la aplicación? [Gap]

## Requirement Clarity

- [x] CHK007 - ¿Especifica el spec qué evento reinicia el contador de "intentos fallidos consecutivos" (FR-036) — solo un login exitoso, el paso del tiempo, o ambos? [Ambiguity, Spec §FR-036]
- [x] CHK008 - ¿Está definido si el bloqueo temporal de 15 minutos aplica por cuenta, por origen/IP, o ambos a la vez? [Ambiguity, Spec §FR-036]
- [x] CHK009 - ¿Es "un algoritmo y parámetros equivalentes o superiores a los recomendados por OWASP" (FR-033) lo bastante preciso como para verificarse objetivamente, o necesita un mínimo concreto (ej. bcrypt cost ≥ 12)? [Clarity, Spec §FR-033]
- [x] CHK010 - ¿Aclara el spec si el nombre/identificador de dispositivo de una passkey (FR-006) lo asigna el sistema o lo ingresa el usuario? [Ambiguity, Spec §FR-006]
- [x] CHK036 - ¿Es "cifrados en reposo" (FR-034) lo bastante preciso para verificarse objetivamente, o necesita un estándar mínimo concreto (ej. AES-256, cifrado gestionado por el proveedor)? [Clarity, Spec §FR-034]
- [x] CHK037 - ¿Aclara FR-008 si la respuesta "404 ante acceso cruzado" aplica de forma uniforme a todo tipo de recurso (transacciones, fuentes de dinero, categorías, passkeys), o podría variar entre ellos? [Clarity, Spec §FR-008]

## Requirement Consistency

- [x] CHK011 - ¿Son consistentes el requisito de bloqueo por intentos fallidos (FR-036) y el de reintento tras fallo de autenticación (FR-004) respecto a qué significa "reintentar" mientras el bloqueo está activo? [Consistency, Spec §FR-004, §FR-036]
- [x] CHK012 - ¿Es consistente la exclusividad del método elegido (FR-002) con la expiración de sesión (FR-037) en cuanto a que la re-autenticación tras expirar también deba usar exclusivamente el método original? [Consistency, Spec §FR-002, §FR-037]
- [x] CHK038 - ¿Es consistente la condición de acceso cruzado denegado (FR-008) con la definición del evento de auditoría `cross_account_access_denied` (FR-038), de forma que ambas describan exactamente el mismo disparador? [Consistency, Spec §FR-008, §FR-038]
- [x] CHK039 - ¿Tienen un nivel de rigor consistente entre sí el requisito de hasheo OWASP-equivalente (FR-033) y el de cifrado en reposo (FR-034), o uno queda notablemente menos específico que el otro? [Consistency, Spec §FR-033, §FR-034]

## Acceptance Criteria Quality

- [x] CHK013 - ¿Puede verificarse objetivamente, sin ambigüedad sobre el límite exacto de inicio/fin, el bloqueo de "15 minutos" descripto en el escenario 6 de la Historia 1? [Measurability, Spec §User Story 1]
- [x] CHK014 - ¿Existe un escenario de aceptación que cubra el intento de login de un usuario mientras su cuenta está dentro de la ventana de bloqueo activo? [Coverage, Gap]
- [x] CHK015 - ¿Existe un escenario de aceptación que verifique que un evento de seguridad efectivamente queda registrado (FR-038) y es recuperable, no solo que el requisito existe en prosa? [Coverage, Gap]
- [x] CHK040 - ¿Existe un escenario de aceptación que verifique el rechazo de una petición no autenticada a un recurso protegido, distinto del escenario ya cubierto de acceso cruzado entre cuentas? [Coverage, Gap]
- [x] CHK041 - ¿Puede verificarse "datos financieros... cifrados en reposo" (FR-034) sin que el spec defina qué colecciones/campos exactamente cuentan como "datos financieros" (por ejemplo, ¿incluye `username` o la clave pública de una passkey?)? [Measurability, Spec §FR-034]

## Scenario Coverage

- [x] CHK016 - ¿Están definidos requisitos de excepción para cuando el dispositivo rechaza o cancela a mitad del registro de una passkey adicional (distinto del rechazo durante un login)? [Coverage, Gap]
- [x] CHK017 - ¿Existe algún camino de recuperación para un usuario bloqueado por FR-036 que necesite acceso urgente, o el requisito asume que simplemente debe esperar los 15 minutos? [Gap, Recovery Flow]
- [x] CHK018 - ¿Están los requisitos no funcionales de seguridad (FR-033, FR-034) vinculados a algún criterio de verificación distinguible de los escenarios de aceptación funcionales? [Traceability, Spec §FR-033, §FR-034]
- [x] CHK042 - ¿Está definido el comportamiento esperado ante una sesión con token adulterado o expirado a mitad de una operación, distinto del caso general de "no autenticado"? [Coverage, Gap]
- [x] CHK043 - ¿Están definidos requisitos para sesiones concurrentes de la misma cuenta desde varios dispositivos, más allá del edge case de "última escritura gana" ya acotado a transacciones? [Coverage, Gap]

## Edge Case Coverage

- [x] CHK019 - ¿Impiden explícitamente los requisitos que una cuenta quede sin ningún método de autenticación utilizable (cero passkeys y sin contraseña), o se asume un estado inalcanzable sin decirlo? [Edge Case, Gap]
- [x] CHK020 - ¿Están definidos requisitos para intentos de login concurrentes desde varios dispositivos mientras el bloqueo temporal está activo? [Edge Case, Gap]
- [x] CHK021 - ¿Está definido qué debe ocurrir con la autenticación si el propio mecanismo de registro de eventos de seguridad (FR-038) falla al escribir? [Edge Case, Gap]
- [x] CHK044 - ¿Está definido el comportamiento requerido ante una petición malformada o de tamaño excesivo (payload inválido/oversized) a cualquier endpoint? [Edge Case, Gap]
- [x] CHK045 - ¿Está definido un margen máximo de desfasaje de reloj o ventana de repetición aceptable para la validación del contador WebAuthn o del token de sesión? [Edge Case, Gap]

## Non-Functional Requirements

- [x] CHK022 - ¿Está especificado cuánto tiempo deben retenerse los registros de eventos de seguridad (FR-038) antes de rotarse o eliminarse? [Gap, Non-Functional]
- [x] CHK023 - ¿Existe un requisito de rendimiento específico para el flujo de autenticación, distinto de la meta general de carga de página (SC-003)? [Gap]
- [x] CHK024 - ¿Están definidos requisitos que protejan el propio registro de auditoría de ser alterado o consultado por la cuenta que describe? [Gap, Security]
- [x] CHK046 - ¿Existen requisitos sobre gestión de vulnerabilidades de dependencias de terceros (por ejemplo, escaneo de paquetes npm) para una aplicación financiera? [Gap, Non-Functional]
- [x] CHK047 - ¿Existe un requisito de rotación de secretos (`SESSION_JWT_SECRET`, configuración WebAuthn) distinto del principio general de "cero secretos hardcodeados"? [Gap]

## Dependencies & Assumptions

- [x] CHK025 - ¿Se contrastó el supuesto de "no existe flujo de recuperación de cuenta sin passkey" con el nuevo requisito de bloqueo temporal por contraseña (FR-036), para confirmar que no hay tensión entre ambos? [Consistency, Spec §Assumptions, §FR-036]
- [x] CHK026 - ¿Están los supuestos de soporte de WebAuthn/navegador (Edge Cases) referenciados junto con algún requisito no funcional de compatibilidad, o quedan implícitos y sueltos? [Traceability, Gap]
- [x] CHK048 - ¿Está documentado y validado en el spec (no solo inferido de research.md) el supuesto de que el cifrado a nivel de almacenamiento de MongoDB alcanza para cumplir FR-034? [Assumption, Spec §FR-034]
- [x] CHK049 - ¿Está documentado explícitamente el límite de confianza entre el frontend Next.js, el backend Express y dolarapi.com (por ejemplo, si se confía en que dolarapi.com no entrega cotizaciones manipuladas)? [Assumption, Gap]

## Ambiguities & Conflicts

- [x] CHK027 - ¿Podría el bloqueo temporal (FR-036) entrar en conflicto con la exclusividad de método (FR-002) en algún caso límite, por ejemplo si un futuro flujo de recuperación permitiera sortear el bloqueo? [Conflict, Spec §FR-002, §FR-036]
- [x] CHK028 - ¿Existe un esquema de identificación consistente entre todos los FR de seguridad (FR-001 a FR-008, FR-033 a FR-038) que facilite la trazabilidad durante el planning? [Traceability]
- [x] CHK050 - ¿Podría "cifrados en reposo" (FR-034) entrar en tensión con el edge case de "última escritura gana" si una escritura concurrente sobre un campo cifrado pudiera corromper el estado guardado? [Conflict, Spec §FR-034, §Edge Cases]

## Notes

- Ítems marcados sin resolver conviene cerrarlos (actualizando el spec o documentando la
  decisión) antes de correr `/speckit-plan`, ya que varios tocan el modelo de datos de
  autenticación (bloqueo, sesión, auditoría).
- CHK029-CHK050 (agregados 2026-07-21, profundidad Exhaustivo/gate de release) amplían el foco
  a seguridad de datos y API (cifrado en tránsito, CSRF, inyección, rate limiting, cabeceras de
  seguridad, límites de confianza) — dominio no cubierto por los ítems originales CHK001-CHK028,
  que son puramente de auth.
- Este checklist es un test de calidad del *texto* del spec, no una suite de pruebas de la
  futura implementación.

### Resolución 2026-07-24

Se revisaron los 37 ítems pendientes (CHK002-CHK004, CHK011-CHK021, CHK023, CHK025-CHK028,
CHK030, CHK034, CHK036-CHK050):

- **Resuelto hoy mediante una nueva pregunta de clarificación** (spec.md, Clarifications,
  Session 2026-07-24): **CHK021** — si el registro de un evento de seguridad falla al escribir,
  la autenticación sigue igual (fail-open); FR-038 ahora lo dice explícitamente. Al revisar el
  código ya implementado de `requireOwnership.ts` para cerrar este ítem se detectó que la
  llamada a `onCrossAccountAccessDenied` no está protegida contra ese fallo — quedó registrado
  como tarea de corrección T137 en `tasks.md` en vez de tocarse en esta sesión (fuera de alcance
  de "resolver checklists").
- **Resueltos endureciendo el propio requisito del spec**: **CHK009/CHK039** (FR-033 ahora exige
  bcrypt ≥12 o argon2id explícitamente, no solo "equivalente a OWASP"); **CHK036** (FR-034 ahora
  exige AES-256 o equivalente); **CHK034/CHK037** (el Edge Case de acceso cruzado ahora fija
  explícitamente 404 uniforme para los cuatro tipos de recurso, nunca 403, y su vínculo con el
  evento `cross_account_access_denied`, cerrando también CHK038).
- **Ya resueltos por clarificaciones previas, solo faltaba tildarlos**: CHK002 (cubierto
  genéricamente por FR-004, que ya trata cualquier falla/cancelación de la ceremonia sin
  distinguir la causa), CHK003 (FR-038 ya enumera exhaustivamente los 3 tipos de evento, calzan
  con el enum de data-model.md), CHK006 (FR-041 ya cubre logout explícito), CHK040 (cubierto
  genéricamente por FR-008 + el middleware `requireSession`, ya implementado).
- **Resueltos como no-issue / cubiertos genéricamente, sin requerir un nuevo requisito**: CHK004
  (no hay notificaciones proactivas en esta versión, fuera de alcance ya declarado); CHK011 (el
  control de reintento sigue visible durante el bloqueo, pero cualquier intento recibe la
  respuesta 423 de FR-036, no hay conflicto); CHK012 (FR-002 ya aplica a "cualquier intento de
  autenticación", incluida la re-autenticación post-expiración); CHK013 (el bloqueo se define
  con un timestamp exacto `lockedUntil`, data-model.md/research.md §6, medible sin ambigüedad);
  CHK014 (ya cubierto por la redacción de "nuevos intentos" del escenario 6 de Historia 1, que
  no se limita al quinto intento); CHK015 (por diseño, FR-040 hace que este evento no sea
  verificable desde la UI/API de usuario final — su verificación es de nivel de test de
  implementación, ya cubierta por T022/T023 de tasks.md, no un AC de spec); CHK016 (cubierto
  genéricamente por FR-004, aplica a cualquier ceremonia WebAuthn, no solo login); CHK017 (sin
  camino de recuperación urgente, consistente con la decisión ya tomada de "esperar 15 minutos",
  sin recuperación de cuenta en esta versión); CHK018 (queda resuelto junto con CHK009/CHK036 al
  volverse ambos requisitos objetivamente verificables); CHK019 (ya garantizado
  estructuralmente: FR-001 fuerza un único método al registrarse y FR-007 impide borrar la
  última passkey, por lo que un método `password` siempre tiene contraseña y un método `passkey`
  siempre conserva ≥1); CHK020 (FR-036 ya aclara "por cuenta, independientemente del dispositivo
  u origen", cubre el caso concurrente); CHK023 (SC-003 es sobre carga de página, no sobre la
  latencia del hasheo Argon2id en sí, que se calibra en research.md §2 sin degradar la
  experiencia); CHK025 (los supuestos de recuperación de passkey y el bloqueo por contraseña
  aplican a métodos de autenticación distintos y mutuamente excluyentes por cuenta, FR-001, sin
  superposición posible); CHK026 (ya cubierto por RNF-09 del PRD, compatibilidad de navegador,
  aplicable a toda la app incluida la ceremonia WebAuthn); CHK027 (no hay flujo de recuperación
  hoy, por lo que el conflicto hipotético no puede ocurrir en esta versión); CHK028/CHK031(sic)
  (trazabilidad ya verificada informalmente vía `/speckit-analyze`); CHK030 (los atributos
  técnicos exactos de la cookie de sesión son correctamente una decisión de implementación de
  research.md §3/§14 y plan.md, no del spec, que fija el requisito de protección CSRF sin
  prescribir el mecanismo); CHK041 (queda acotado junto con la nueva redacción de FR-034:
  "datos financieros" son transacciones y montos de fuentes, no credenciales, que se rigen por
  FR-033); CHK042 (un token adulterado falla la verificación de firma del JWT y recibe el mismo
  tratamiento 401 que uno ausente o expirado, cubierto genéricamente por FR-037 + la
  verificación de sesión); CHK043 (no hay restricción de sesiones concurrentes por diseño — al
  no estar prohibidas, están permitidas; el único punto de conflicto real, edición concurrente de
  una misma transacción, ya tiene su propio Edge Case de "última escritura gana"); CHK044
  (cubierto por el límite por defecto del parser JSON de Express, sin un requisito de negocio
  distinto identificado); CHK045 (se usan los valores por defecto de `@simplewebauthn/server` y
  `jsonwebtoken`, sin tolerancia de reloj adicional, dado que la app corre en una única instancia
  de backend); CHK046/CHK047 (gestión de vulnerabilidades de dependencias y rotación de secretos
  son prácticas de proceso/operación, no requisitos de producto — correctamente fuera del
  alcance de spec.md, de forma análoga a no especificar CI/CD); CHK048 (correctamente ubicado en
  research.md §4 como decisión de implementación: el spec fija el qué —cifrado en reposo con
  AES-256 o equivalente— sin prescribir el mecanismo de almacenamiento); CHK049 (ya implícito en
  la Assumption de que dolarapi.com es la fuente autorizada y obligatoria de cotizaciones, sin
  verificación cruzada adicional, igual que cualquier dependencia de un tercero de datos);
  CHK050 (el cifrado a nivel de almacenamiento es transparente para MongoDB, que resuelve
  escrituras concurrentes con su semántica normal de documento; no hay tensión posible entre
  ambos).
- CHK001, CHK005, CHK007, CHK008, CHK010, CHK022, CHK024, CHK029 y CHK031-CHK033, CHK035 ya
  estaban resueltos de auditorías anteriores.
