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
- [ ] CHK002 - ¿Está definido qué debe requerirse si el ceremonial WebAuthn se interrumpe por pérdida de conectividad del dispositivo durante el registro de una passkey (distinto de la cancelación ya cubierta)? [Gap, Edge Case]
- [ ] CHK003 - ¿Está enumerado de forma exhaustiva el conjunto de "eventos de seguridad" a registrar, o queda abierto a interpretación qué otros eventos deberían sumarse? [Completeness, Spec §FR-038]
- [ ] CHK004 - ¿Está definido si el usuario recibe algún aviso in-app cuando su propia cuenta entra en bloqueo temporal, más allá del mensaje de error al momento del intento? [Completeness, Spec §FR-036]
- [x] CHK005 - ¿Están definidos requisitos de recuperación de contraseña ("olvidé mi contraseña") para el método usuario/contraseña, dado que solo se aclaró la ausencia de recuperación para passkeys? [Gap]
- [x] CHK006 - ¿Está definido un mecanismo de cierre de sesión explícito antes de que expire el día de duración de sesión (FR-037)? [Gap, Spec §FR-037]
- [x] CHK029 - ¿Están especificados requisitos de cifrado en tránsito (HTTPS/TLS) para los datos financieros, distintos del cifrado en reposo de FR-034? [Gap, Spec §FR-034]
- [ ] CHK030 - ¿Están documentados en el spec (no solo en research.md) los atributos de seguridad exigidos a la cookie de sesión (`httpOnly`, `secure`, `sameSite`)? [Gap, Spec §FR-037]
- [x] CHK031 - ¿Están definidos requisitos de protección contra CSRF para las operaciones que modifican estado (alta/edición/borrado de transacciones, passkeys, fuentes de dinero)? [Gap]
- [x] CHK032 - ¿Están definidos requisitos de sanitización/validación de entrada más allá de la validación de campos ya cubierta (FR-017), para prevenir inyección hacia la base de datos? [Gap]
- [x] CHK033 - ¿Existen requisitos de límite de tasa (rate limiting) para operaciones distintas del login (por ejemplo, alta de transacciones o de passkeys)? [Gap]
- [ ] CHK034 - ¿Está el comportamiento "404 en vez de 403 ante acceso cruzado" (documentado en contracts/api.md) especificado también como requisito de negocio dentro del spec, y no solo como detalle de contrato de API? [Gap, Spec §FR-008]
- [x] CHK035 - ¿Existe algún requisito sobre qué cabeceras de seguridad HTTP (CSP, X-Content-Type-Options, etc.) debe emitir la aplicación? [Gap]

## Requirement Clarity

- [x] CHK007 - ¿Especifica el spec qué evento reinicia el contador de "intentos fallidos consecutivos" (FR-036) — solo un login exitoso, el paso del tiempo, o ambos? [Ambiguity, Spec §FR-036]
- [x] CHK008 - ¿Está definido si el bloqueo temporal de 15 minutos aplica por cuenta, por origen/IP, o ambos a la vez? [Ambiguity, Spec §FR-036]
- [ ] CHK009 - ¿Es "un algoritmo y parámetros equivalentes o superiores a los recomendados por OWASP" (FR-033) lo bastante preciso como para verificarse objetivamente, o necesita un mínimo concreto (ej. bcrypt cost ≥ 12)? [Clarity, Spec §FR-033]
- [x] CHK010 - ¿Aclara el spec si el nombre/identificador de dispositivo de una passkey (FR-006) lo asigna el sistema o lo ingresa el usuario? [Ambiguity, Spec §FR-006]
- [ ] CHK036 - ¿Es "cifrados en reposo" (FR-034) lo bastante preciso para verificarse objetivamente, o necesita un estándar mínimo concreto (ej. AES-256, cifrado gestionado por el proveedor)? [Clarity, Spec §FR-034]
- [ ] CHK037 - ¿Aclara FR-008 si la respuesta "404 ante acceso cruzado" aplica de forma uniforme a todo tipo de recurso (transacciones, fuentes de dinero, categorías, passkeys), o podría variar entre ellos? [Clarity, Spec §FR-008]

## Requirement Consistency

- [ ] CHK011 - ¿Son consistentes el requisito de bloqueo por intentos fallidos (FR-036) y el de reintento tras fallo de autenticación (FR-004) respecto a qué significa "reintentar" mientras el bloqueo está activo? [Consistency, Spec §FR-004, §FR-036]
- [ ] CHK012 - ¿Es consistente la exclusividad del método elegido (FR-002) con la expiración de sesión (FR-037) en cuanto a que la re-autenticación tras expirar también deba usar exclusivamente el método original? [Consistency, Spec §FR-002, §FR-037]
- [ ] CHK038 - ¿Es consistente la condición de acceso cruzado denegado (FR-008) con la definición del evento de auditoría `cross_account_access_denied` (FR-038), de forma que ambas describan exactamente el mismo disparador? [Consistency, Spec §FR-008, §FR-038]
- [ ] CHK039 - ¿Tienen un nivel de rigor consistente entre sí el requisito de hasheo OWASP-equivalente (FR-033) y el de cifrado en reposo (FR-034), o uno queda notablemente menos específico que el otro? [Consistency, Spec §FR-033, §FR-034]

## Acceptance Criteria Quality

- [ ] CHK013 - ¿Puede verificarse objetivamente, sin ambigüedad sobre el límite exacto de inicio/fin, el bloqueo de "15 minutos" descripto en el escenario 6 de la Historia 1? [Measurability, Spec §User Story 1]
- [ ] CHK014 - ¿Existe un escenario de aceptación que cubra el intento de login de un usuario mientras su cuenta está dentro de la ventana de bloqueo activo? [Coverage, Gap]
- [ ] CHK015 - ¿Existe un escenario de aceptación que verifique que un evento de seguridad efectivamente queda registrado (FR-038) y es recuperable, no solo que el requisito existe en prosa? [Coverage, Gap]
- [ ] CHK040 - ¿Existe un escenario de aceptación que verifique el rechazo de una petición no autenticada a un recurso protegido, distinto del escenario ya cubierto de acceso cruzado entre cuentas? [Coverage, Gap]
- [ ] CHK041 - ¿Puede verificarse "datos financieros... cifrados en reposo" (FR-034) sin que el spec defina qué colecciones/campos exactamente cuentan como "datos financieros" (por ejemplo, ¿incluye `username` o la clave pública de una passkey?)? [Measurability, Spec §FR-034]

## Scenario Coverage

- [ ] CHK016 - ¿Están definidos requisitos de excepción para cuando el dispositivo rechaza o cancela a mitad del registro de una passkey adicional (distinto del rechazo durante un login)? [Coverage, Gap]
- [ ] CHK017 - ¿Existe algún camino de recuperación para un usuario bloqueado por FR-036 que necesite acceso urgente, o el requisito asume que simplemente debe esperar los 15 minutos? [Gap, Recovery Flow]
- [ ] CHK018 - ¿Están los requisitos no funcionales de seguridad (FR-033, FR-034) vinculados a algún criterio de verificación distinguible de los escenarios de aceptación funcionales? [Traceability, Spec §FR-033, §FR-034]
- [ ] CHK042 - ¿Está definido el comportamiento esperado ante una sesión con token adulterado o expirado a mitad de una operación, distinto del caso general de "no autenticado"? [Coverage, Gap]
- [ ] CHK043 - ¿Están definidos requisitos para sesiones concurrentes de la misma cuenta desde varios dispositivos, más allá del edge case de "última escritura gana" ya acotado a transacciones? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK019 - ¿Impiden explícitamente los requisitos que una cuenta quede sin ningún método de autenticación utilizable (cero passkeys y sin contraseña), o se asume un estado inalcanzable sin decirlo? [Edge Case, Gap]
- [ ] CHK020 - ¿Están definidos requisitos para intentos de login concurrentes desde varios dispositivos mientras el bloqueo temporal está activo? [Edge Case, Gap]
- [ ] CHK021 - ¿Está definido qué debe ocurrir con la autenticación si el propio mecanismo de registro de eventos de seguridad (FR-038) falla al escribir? [Edge Case, Gap]
- [ ] CHK044 - ¿Está definido el comportamiento requerido ante una petición malformada o de tamaño excesivo (payload inválido/oversized) a cualquier endpoint? [Edge Case, Gap]
- [ ] CHK045 - ¿Está definido un margen máximo de desfasaje de reloj o ventana de repetición aceptable para la validación del contador WebAuthn o del token de sesión? [Edge Case, Gap]

## Non-Functional Requirements

- [x] CHK022 - ¿Está especificado cuánto tiempo deben retenerse los registros de eventos de seguridad (FR-038) antes de rotarse o eliminarse? [Gap, Non-Functional]
- [ ] CHK023 - ¿Existe un requisito de rendimiento específico para el flujo de autenticación, distinto de la meta general de carga de página (SC-003)? [Gap]
- [x] CHK024 - ¿Están definidos requisitos que protejan el propio registro de auditoría de ser alterado o consultado por la cuenta que describe? [Gap, Security]
- [ ] CHK046 - ¿Existen requisitos sobre gestión de vulnerabilidades de dependencias de terceros (por ejemplo, escaneo de paquetes npm) para una aplicación financiera? [Gap, Non-Functional]
- [ ] CHK047 - ¿Existe un requisito de rotación de secretos (`SESSION_JWT_SECRET`, configuración WebAuthn) distinto del principio general de "cero secretos hardcodeados"? [Gap]

## Dependencies & Assumptions

- [ ] CHK025 - ¿Se contrastó el supuesto de "no existe flujo de recuperación de cuenta sin passkey" con el nuevo requisito de bloqueo temporal por contraseña (FR-036), para confirmar que no hay tensión entre ambos? [Consistency, Spec §Assumptions, §FR-036]
- [ ] CHK026 - ¿Están los supuestos de soporte de WebAuthn/navegador (Edge Cases) referenciados junto con algún requisito no funcional de compatibilidad, o quedan implícitos y sueltos? [Traceability, Gap]
- [ ] CHK048 - ¿Está documentado y validado en el spec (no solo inferido de research.md) el supuesto de que el cifrado a nivel de almacenamiento de MongoDB alcanza para cumplir FR-034? [Assumption, Spec §FR-034]
- [ ] CHK049 - ¿Está documentado explícitamente el límite de confianza entre el frontend Next.js, el backend Express y dolarapi.com (por ejemplo, si se confía en que dolarapi.com no entrega cotizaciones manipuladas)? [Assumption, Gap]

## Ambiguities & Conflicts

- [ ] CHK027 - ¿Podría el bloqueo temporal (FR-036) entrar en conflicto con la exclusividad de método (FR-002) en algún caso límite, por ejemplo si un futuro flujo de recuperación permitiera sortear el bloqueo? [Conflict, Spec §FR-002, §FR-036]
- [ ] CHK028 - ¿Existe un esquema de identificación consistente entre todos los FR de seguridad (FR-001 a FR-008, FR-033 a FR-038) que facilite la trazabilidad durante el planning? [Traceability]
- [ ] CHK050 - ¿Podría "cifrados en reposo" (FR-034) entrar en tensión con el edge case de "última escritura gana" si una escritura concurrente sobre un campo cifrado pudiera corromper el estado guardado? [Conflict, Spec §FR-034, §Edge Cases]

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
