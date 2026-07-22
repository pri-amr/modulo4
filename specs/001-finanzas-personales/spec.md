# Feature Specification: Finanzas Personales (Multi-banco, ARS/USD)

**Feature Branch**: `001-finanzas-personales`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Generá el spec a partir del @PRD.md" — PRD-001: Aplicación Web de Finanzas Personales, que centraliza el control de ingresos y egresos en múltiples bancos y efectivo (ARS/USD), con acceso seguro mediante passkeys o contraseña.

## Clarifications

### Session 2026-07-20

- Q: ¿El sistema debe limitar o bloquear intentos repetidos de autenticación con contraseña incorrecta? → A: Bloqueo temporal tras intentos fallidos consecutivos (5 intentos → bloqueo de 15 minutos).
- Q: ¿Por cuánto tiempo permanece autenticado un usuario antes de requerir volver a autenticarse? → A: La sesión dura 1 día desde el inicio de sesión.
- Q: ¿El sistema debe registrar (log/auditoría) eventos de seguridad como logins fallidos, bloqueos de cuenta e intentos de acceso a datos de otra cuenta? → A: Sí, registrar internamente (login fallido, bloqueo, acceso cruzado denegado).
- Q: Si dos ediciones a la misma transacción llegan casi al mismo tiempo (misma cuenta, dos pestañas/dispositivos), ¿el sistema debe avisar del conflicto o aplicar la última escritura? → A: Última escritura gana, sin aviso de conflicto.
- Q: ¿El sistema debe ofrecer un flujo de recuperación de contraseña olvidada en esta versión? → A: No, fuera de alcance en esta versión (igual que la recuperación de passkey).
- Q: ¿Por cuánto tiempo deben conservarse los registros de eventos de seguridad antes de poder eliminarse o rotarse? → A: 30 días.
- Q: ¿Debe el usuario final tener algún acceso (lectura, edición o borrado) a los registros de eventos de seguridad que su propia cuenta generó? → A: Ningún acceso: el usuario final no puede ver, editar ni borrar sus propios registros de seguridad.

### Session 2026-07-21

- Q: ¿Debe existir una acción explícita de "cerrar sesión" en la aplicación, distinta de la expiración automática al cabo de 1 día? → A: Sí, un control visible de "cerrar sesión" que invalida la sesión de inmediato.
- Q: ¿Debe el sistema exigir requisitos mínimos de complejidad para la contraseña, más allá del hasheo al guardarla? → A: Sí, un mínimo de 4 caracteres solamente, sin otras reglas de complejidad.
- Q: El bloqueo temporal de 15 minutos tras 5 intentos fallidos (FR-036), ¿aplica por cuenta o también considera el origen/IP del intento? → A: Solo por cuenta, independientemente del dispositivo u origen.
- Q: ¿Qué reinicia a cero el contador de intentos fallidos consecutivos del bloqueo? → A: Tanto una autenticación exitosa como la expiración del período de bloqueo de 15 minutos.
- Q: El nombre/identificador de una passkey en el listado, ¿lo asigna el sistema automáticamente o lo define el usuario al registrarla? → A: Lo define el usuario al momento de registrarla.
- Q: ¿Con qué precisión decimal se registran los montos de una transacción? → A: Hasta 2 decimales (estándar de centavos).
- Q: ¿Se permite registrar una transacción con fecha futura? → A: No, solo fecha de hoy o pasada; una fecha futura se rechaza como inválida.
- Q: ¿Cómo se evita el registro duplicado de una transacción por doble clic/tap en "guardar"? → A: El sistema deshabilita el control de guardar mientras la operación está en curso.
- Q: ¿Existe un límite máximo de longitud para el nombre de una fuente de dinero/categoría y para la descripción de una transacción? → A: 60 caracteres para nombre de fuente de dinero o categoría; sin límite máximo para la descripción de la transacción.
- Q: ¿Qué nivel de accesibilidad (teclado, contraste, lectores de pantalla) se exige en esta versión? → A: Ninguno definido; queda fuera de alcance en esta versión.
- Q: ¿Con qué regla se redondean los porcentajes del gráfico de gastos por categoría (FR-025) cuando no suman exactamente 100%? → A: Redondeo a 1 decimal por categoría, con ajuste en la categoría de mayor monto para que la suma total dé exactamente 100%.
- Q: ¿Qué patrón de confirmación visual usa la pantalla de Transacciones tras guardar, editar o eliminar una transacción (Historia 2)? → A: Actualización en línea — el listado se refresca al instante y el formulario se limpia, sin navegar a otra pantalla.
- Q: Si dolarapi.com responde exitosamente pero sin el tipo de cambio solicitado (FR-030), ¿cómo debe tratarse? → A: Igual que cualquier otro fallo de la fuente: error explícito, sin valor de conversión (mismo tratamiento que FR-032).
- Q: ¿Cuál es el orden por defecto del listado de transacciones (FR-023, FR-024)? → A: Más reciente primero, por fecha de transacción descendente y `createdAt` descendente como desempate.
- Q: ¿En qué zona horaria se calculan los límites del "mes en curso" del gráfico de gastos (FR-025)? → A: Zona horaria de Argentina (America/Argentina/Buenos_Aires, UTC-3 fijo, sin horario de verano).

### Session 2026-07-21 (seguridad de datos y API)

- Q: ¿Alcanza con que la sesión rechace solicitudes entre sitios (mecanismo definido en el plan técnico) como única protección CSRF, o se exige además un token anti-CSRF explícito por operación? → A: Basta con que el mecanismo de sesión rechace solicitudes entre sitios; no se exige un token anti-CSRF adicional.
- Q: ¿Debe el sistema emitir cabeceras de seguridad HTTP estándar (CSP, X-Content-Type-Options, X-Frame-Options, etc.)? → A: Sí, en alcance: un set base de cabeceras de seguridad HTTP estándar es requisito de esta versión.
- Q: ¿Se exige un requisito general de validación de entrada (contra inyección hacia la base de datos), más allá de la validación de campos ya cubierta por FR-017? → A: Sí, todo input externo (body, query params) se valida contra un esquema estricto de tipo/forma antes de alcanzar la capa de persistencia.
- Q: ¿El cifrado en tránsito (HTTPS/TLS) de los datos financieros es un requisito funcional explícito de la app, o un supuesto de infraestructura/despliegue fuera de alcance del spec? → A: Supuesto de infraestructura/despliegue — TLS se termina en la capa de despliegue, fuera del alcance funcional del spec.
- Q: ¿Se exige un límite de tasa (rate limiting) para operaciones distintas del login (alta de transacciones, registro de passkeys, etc.)? → A: Fuera de alcance en esta versión — solo el login tiene límite de tasa (FR-036); el resto queda para una versión futura si se detecta abuso.

### Session 2026-07-21 (remediación `/speckit-analyze`)

- Q: FR-043 dejaba abierto si un monto con más de 2 decimales se redondea o se rechaza. ¿Cuál de las dos? → A: Se redondea a 2 decimales (redondeo estándar, mitad hacia arriba); no se rechaza el guardado por ese motivo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro y acceso seguro a la cuenta (Priority: P1)

Un usuario argentino se registra eligiendo un único método de autenticación (passkey o
usuario/contraseña) y, en cada visita posterior, accede a su cuenta exclusivamente con ese
método. Puede registrar más de una passkey como respaldo y gestionarlas desde su cuenta.

**Why this priority**: Sin una cuenta segura y accesible no existe ninguna otra funcionalidad;
es la puerta de entrada a todo el resto del sistema y protege datos financieros sensibles.

**Independent Test**: Se puede probar de forma completa registrando una cuenta nueva con cada
método, cerrando sesión, y verificando que solo el método elegido permite volver a entrar,
entregando valor por sí sola (acceso seguro) sin depender de ninguna otra historia.

**Acceptance Scenarios**:

1. **Given** un usuario nuevo que aún no tiene cuenta, **When** se registra eligiendo passkey o
   usuario/contraseña, **Then** el sistema crea la cuenta asociada a ese único método.
2. **Given** un usuario ya registrado con un método específico, **When** completa el flujo de
   autenticación con ese mismo método, **Then** el sistema lo redirige al dashboard.
3. **Given** un usuario registrado con un método específico, **When** cancela el diálogo, el
   dispositivo rechaza la verificación, o ingresa credenciales incorrectas, **Then** el sistema
   muestra un mensaje de error, ofrece un control para reintentar, y no lo redirige al dashboard.
4. **Given** un usuario autenticado con al menos una passkey, **When** registra una passkey
   adicional desde otro dispositivo e ingresa un nombre para identificarla, **Then** la nueva
   passkey aparece en su listado con ese nombre y sirve para autenticarse en sesiones futuras.
5. **Given** un usuario con exactamente una passkey registrada, **When** intenta eliminarla,
   **Then** el sistema bloquea la operación y explica que debe quedar al menos una activa.
6. **Given** un usuario cuyo método elegido es usuario/contraseña, **When** falla la
   autenticación 5 veces consecutivas, **Then** el sistema bloquea temporalmente nuevos
   intentos con ese usuario durante 15 minutos y lo informa explícitamente.
7. **Given** un usuario que se autenticó exitosamente, **When** transcurre 1 día desde ese
   inicio de sesión, **Then** el sistema deja de considerarlo autenticado y le exige volver a
   completar el flujo de autenticación para continuar usando la aplicación.
8. **Given** un usuario autenticado, **When** hace clic en el control de "cerrar sesión",
   **Then** el sistema invalida la sesión de inmediato y lo redirige a la pantalla de acceso,
   exigiéndole volver a autenticarse para su próximo uso de la aplicación.
9. **Given** un usuario registrándose con el método usuario/contraseña, **When** ingresa una
   contraseña de menos de 4 caracteres, **Then** el sistema impide el registro y explica el
   largo mínimo requerido.

---

### User Story 2 - Registro de ingresos y egresos (Priority: P1)

Un usuario autenticado registra sus movimientos de dinero (ingresos y egresos), indicando
monto, fuente de dinero, moneda, categoría, fecha y descripción, y puede corregir o eliminar
movimientos ya cargados.

**Why this priority**: Es el corazón del producto: sin poder cargar movimientos, la aplicación
no cumple su propósito central de centralizar el control de ingresos y egresos.

**Independent Test**: Se puede probar de forma completa creando, editando y eliminando
transacciones desde una cuenta ya autenticada (usando las fuentes y categorías predefinidas que
el sistema ofrece de fábrica), y verificando que el listado y el detalle reflejan exactamente
los datos ingresados — entrega valor de forma independiente de gráficos, filtros o conversor.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado en el dashboard, **When** completa el formulario de egreso
   con monto, fuente de dinero, moneda, categoría, fecha y descripción válidos y confirma,
   **Then** la transacción aparece en el listado con esos datos exactos, el listado se
   actualiza en línea sin navegar a otra pantalla, y el formulario se limpia para una carga
   siguiente.
2. **Given** un usuario autenticado en el dashboard, **When** completa el formulario de ingreso
   con datos válidos y confirma, **Then** la transacción aparece en el listado con esos datos
   exactos, con la misma actualización en línea sin navegación.
3. **Given** un usuario completando el formulario de transacción, **When** intenta guardar sin
   completar el monto, la fuente de dinero, la moneda, la categoría, la fecha o la descripción,
   **Then** el sistema impide el guardado y señala cuál campo falta.
4. **Given** un usuario completando el formulario de transacción, **When** ingresa un monto
   igual a cero o negativo, **Then** el sistema impide el guardado y explica que el monto debe
   ser mayor a cero.
5. **Given** una transacción existente, **When** el usuario la edita y confirma los cambios,
   **Then** el listado refleja los nuevos valores de forma inmediata y en línea, sin navegar a
   otra pantalla.
6. **Given** una transacción existente, **When** el usuario la elimina y confirma la acción en
   el diálogo de confirmación, **Then** la transacción desaparece del listado de forma
   inmediata y en línea.
7. **Given** un usuario que completó correctamente el formulario, **When** el guardado falla
   (por ejemplo, un error de red), **Then** el sistema muestra un mensaje de error y conserva
   los datos ingresados para que pueda reintentar sin volver a escribirlos.
8. **Given** un usuario dando de alta una fuente de dinero o categoría propia, **When** ingresa
   un nombre que ya existe, **Then** el sistema impide el alta y explica que ya existe una con
   ese nombre.

---

### User Story 3 - Visibilidad de saldos por fuente y consolidados (Priority: P2)

Un usuario autenticado consulta cuánto dinero tiene disponible en cada banco o efectivo, y
cuánto tiene en total en ARS y en USD.

**Why this priority**: Convierte el registro de movimientos en información útil para tomar
decisiones; depende de que existan transacciones cargadas (Historia 2) pero no de filtros,
gráficos ni del conversor.

**Independent Test**: Con transacciones ya cargadas en distintas fuentes y monedas, se puede
verificar de forma aislada que el saldo mostrado por cada fuente y el consolidado por moneda
coinciden con la suma esperada de ingresos menos egresos.

**Acceptance Scenarios**:

1. **Given** un usuario con ingresos y egresos registrados en una fuente de dinero en una
   moneda determinada, **When** accede a la vista de saldos, **Then** el saldo mostrado para
   esa fuente y moneda es igual a la suma de sus ingresos menos la suma de sus egresos en esa
   fuente y moneda.
2. **Given** un usuario con transacciones en ARS y en USD distribuidas en varias fuentes,
   **When** accede a la vista de saldos, **Then** el sistema muestra el total consolidado en
   ARS y el total consolidado en USD por separado, cada uno sumando solo las transacciones de
   su propia moneda.

---

### User Story 4 - Filtrado y navegación del historial de transacciones (Priority: P2)

Un usuario autenticado con muchos movimientos cargados filtra el listado por día, mes o año, y
navega entre páginas cuando hay más de 50 resultados.

**Why this priority**: Se vuelve necesario a medida que crece el historial de transacciones
(Historia 2); mejora la usabilidad pero no es indispensable para el valor mínimo de registrar y
ver movimientos.

**Independent Test**: Con un conjunto de transacciones que abarca varios días, meses, años y
supera las 50 filas, se puede verificar de forma aislada que cada filtro acota el listado
correctamente y que la paginación no repite ni omite registros.

**Acceptance Scenarios**:

1. **Given** transacciones registradas en distintas fechas, **When** el usuario filtra por un
   día específico, **Then** el listado muestra únicamente las transacciones de esa fecha.
2. **Given** transacciones registradas en distintos meses, **When** el usuario filtra por un
   mes específico, **Then** el listado muestra únicamente las transacciones de ese mes.
3. **Given** transacciones registradas en distintos años, **When** el usuario filtra por un año
   específico, **Then** el listado muestra únicamente las transacciones de ese año.
4. **Given** un usuario con más de 50 transacciones y sin filtros activos, **When** la página
   carga por primera vez, **Then** se muestran solo las primeras 50, y al navegar a la página
   siguiente se muestra el siguiente lote sin repetir ninguna transacción ya mostrada, pudiendo
   volver a la página anterior.

---

### User Story 5 - Análisis visual de gastos (Priority: P3)

Un usuario autenticado visualiza gráficos de sus gastos, filtrables por rango de fechas y por
categoría, para entender en qué y cuándo gasta más.

**Why this priority**: Aporta valor analítico adicional sobre datos que ya existen gracias a la
Historia 2; no bloquea el uso diario de registrar y consultar movimientos.

**Independent Test**: Con gastos cargados en varias categorías y fechas, se puede verificar de
forma aislada que el gráfico por defecto y los filtros de fecha/categoría muestran exactamente
los subconjuntos de datos esperados.

**Acceptance Scenarios**:

1. **Given** el usuario navega a la sección de gráficos sin filtros aplicados, **When** la
   sección termina de cargar, **Then** se muestra un gráfico de torta con la distribución
   porcentual de gastos por categoría del mes en curso.
2. **Given** transacciones registradas en distintos períodos, **When** el usuario selecciona un
   rango de fechas, **Then** el gráfico muestra únicamente los gastos de ese rango.
3. **Given** gastos registrados en múltiples categorías, **When** el usuario selecciona una
   categoría específica, **Then** el gráfico muestra únicamente la información de esa categoría.

---

### User Story 6 - Conversión entre USD y ARS (Priority: P3)

Un usuario autenticado convierte un monto entre USD y ARS en cualquier dirección, eligiendo
entre los distintos tipos de cambio vigentes en Argentina (oficial, blue, bolsa, cripto,
tarjeta, contado con liqui, mayorista).

**Why this priority**: Es una utilidad de consulta independiente del registro de movimientos;
agrega valor por sí sola pero no es indispensable para el resto del producto.

**Independent Test**: Se puede probar de forma aislada ingresando montos y eligiendo distintos
tipos de cambio y direcciones, verificando el resultado contra la cotización vigente, y
verificando que un fallo de la fuente de cotización se comunica sin mostrar un valor de
conversión.

**Acceptance Scenarios**:

1. **Given** el usuario accede a la sección de conversión y las cotizaciones están disponibles,
   **When** la página termina de cargar, **Then** se muestra un campo de monto, un selector de
   dirección de conversión (USD → ARS o ARS → USD) y un campo para el resultado.
2. **Given** el usuario eligió una dirección y un tipo de cambio, y las cotizaciones están
   disponibles, **When** ingresa un monto válido mayor a cero, **Then** el sistema muestra el
   monto convertido a la moneda destino usando la cotización vigente del tipo elegido.
3. **Given** el usuario se encuentra en la sección de conversión, **When** selecciona uno de los
   tipos de cambio disponibles (oficial, blue, bolsa, cripto, tarjeta, contado con liqui o
   mayorista), **Then** el sistema usa esa cotización específica para calcular el resultado.
4. **Given** el usuario solicitó una conversión, **When** la fuente de cotizaciones no responde,
   devuelve error, o excede el tiempo máximo de espera, **Then** el sistema muestra un mensaje
   de error explícito y no muestra ningún valor de conversión.

---

### Edge Cases

- Si dos ediciones a la misma transacción llegan casi simultáneamente desde dos
  pestañas/dispositivos de la misma cuenta, gana la última escritura procesada, sin aviso de
  conflicto al usuario: el estado guardado es el de la operación que se completó al final, sin
  duplicar ni perder movimientos.
- ¿Qué pasa si un usuario intenta acceder, editar o eliminar una transacción, fuente de dinero,
  categoría o passkey que pertenece a otra cuenta (por ejemplo, manipulando un identificador en
  la URL o en una petición)? El sistema no debe exponer ni modificar datos de otra cuenta.
- ¿Qué pasa si el usuario da de alta una fuente de dinero o categoría con un nombre casi
  idéntico a uno existente pero con una diferencia mínima (mayúsculas, espacio o typo)? Se
  acepta como entrada válida y distinta: solo se bloquean los nombres exactamente duplicados.
  Una vez creada, ni las fuentes de dinero ni las categorías pueden editarse ni eliminarse.
- ¿Qué pasa si el usuario pierde acceso a todos sus dispositivos con passkey y no tiene
  contraseña configurada (porque eligió passkey como único método)? No hay flujo de
  recuperación de cuenta en esta versión; el usuario debe mitigar este riesgo registrando
  varias passkeys en dispositivos distintos.
- ¿Qué pasa si el usuario filtra el listado de transacciones por un período sin ningún
  movimiento? El listado se muestra vacío en vez de mostrar un error.
- ¿Qué pasa si el usuario intenta convertir un monto igual a cero o negativo, o deja el campo
  de monto vacío? El sistema no debe entregar una conversión y debe indicar que el monto es
  inválido.
- ¿Qué pasa si el dispositivo del usuario no soporta WebAuthn/passkeys? Debe poder registrarse
  y autenticarse igualmente eligiendo el método de usuario y contraseña.
- ¿Qué pasa si un usuario cuyo método es usuario/contraseña olvida su contraseña? No hay flujo
  de recuperación de contraseña en esta versión; el usuario queda sin poder acceder a la cuenta
  hasta que se implemente un flujo de recuperación en una versión futura.

## Requirements *(mandatory)*

### Functional Requirements

**Autenticación y cuenta**

- **FR-001**: El sistema MUST permitir a un usuario, al registrarse, elegir exactamente uno de
  dos métodos de autenticación: passkey o usuario/contraseña.
- **FR-002**: El sistema MUST rechazar cualquier intento de autenticación con un método distinto
  al elegido en el registro para esa cuenta.
- **FR-003**: El sistema MUST redirigir al dashboard tras una autenticación exitosa, con
  cualquiera de los dos métodos.
- **FR-004**: El sistema MUST mostrar un mensaje de error y un control para reintentar cuando la
  autenticación falla o es cancelada, sin importar el método.
- **FR-005**: El sistema MUST permitir registrar más de una passkey por cuenta.
- **FR-006**: El sistema MUST listar las passkeys registradas, cada una con un nombre que el
  usuario define al momento de registrarla.
- **FR-007**: El sistema MUST permitir eliminar una passkey solo si, tras la eliminación, queda
  al menos una passkey activa en la cuenta; MUST bloquear la eliminación de la última passkey.
- **FR-008**: El sistema MUST verificar en cada operación que el usuario autenticado sea el
  propietario de los datos solicitados (transacciones, saldos, fuentes de dinero, categorías,
  passkeys) y MUST negar el acceso a datos de otra cuenta.
- **FR-036**: El sistema MUST bloquear temporalmente los intentos de autenticación con
  usuario/contraseña de una cuenta durante 15 minutos después de 5 intentos fallidos
  consecutivos, e informar al usuario que la cuenta está temporalmente bloqueada. El bloqueo
  MUST determinarse exclusivamente por cuenta (usuario), independientemente del dispositivo o
  la dirección IP de origen de los intentos. El contador de intentos fallidos consecutivos
  MUST reiniciarse a cero tanto ante una autenticación exitosa como al cumplirse el período de
  bloqueo de 15 minutos.
- **FR-037**: El sistema MUST mantener la sesión de un usuario autenticado activa durante 1 día
  desde el inicio de sesión, y MUST exigir volver a autenticarse una vez transcurrido ese plazo.
- **FR-038**: El sistema MUST registrar internamente los eventos de seguridad relevantes
  (intentos de autenticación fallidos, bloqueos temporales de cuenta, e intentos denegados de
  acceso a datos de otra cuenta) con fecha, hora y cuenta involucrada, para permitir su revisión
  posterior.
- **FR-039**: El sistema MUST conservar cada registro de evento de seguridad durante 30 días
  desde su creación, y MUST permitir su eliminación o rotación una vez transcurrido ese plazo.
- **FR-040**: El sistema MUST NOT exponer a la cuenta de usuario final ninguna vía para leer,
  editar o borrar sus propios registros de eventos de seguridad; estos registros quedan
  completamente fuera del alcance de la interfaz y la API del usuario final.
- **FR-041**: El sistema MUST proveer un control de "cerrar sesión" accesible por el usuario
  autenticado en cualquier momento, y MUST invalidar la sesión activa de forma inmediata al
  accionarlo, sin esperar el vencimiento automático de FR-037.
- **FR-042**: El sistema MUST exigir una contraseña de al menos 4 caracteres para el método
  usuario/contraseña, sin imponer otros requisitos de complejidad (combinación obligatoria de
  mayúsculas, números o símbolos).

**Fuentes de dinero y categorías**

- **FR-009**: El sistema MUST ofrecer, al crear la cuenta, una lista predefinida de fuentes de
  dinero: Santander, BNA, Macro, Lemon, Brubank y Efectivo.
- **FR-010**: El sistema MUST permitir al usuario dar de alta una fuente de dinero propia con un
  nombre elegido por él, de hasta 60 caracteres.
- **FR-011**: El sistema MUST impedir el alta de una fuente de dinero cuyo nombre coincida
  exactamente con uno ya existente en esa cuenta.
- **FR-012**: El sistema MUST ofrecer, al crear la cuenta, una lista predefinida de categorías:
  comida, transporte, sueldo y freelance.
- **FR-013**: El sistema MUST permitir al usuario dar de alta una categoría propia con un nombre
  elegido por él, de hasta 60 caracteres.
- **FR-014**: El sistema MUST impedir el alta de una categoría cuyo nombre coincida exactamente
  con una ya existente en esa cuenta.
- **FR-015**: El sistema MUST NOT permitir editar ni eliminar una fuente de dinero o categoría
  una vez creada (solo se soporta el alta).

**Transacciones**

- **FR-016**: El sistema MUST permitir registrar una transacción de tipo egreso y una de tipo
  ingreso.
- **FR-017**: El sistema MUST requerir, para guardar una transacción, un monto numérico mayor a
  cero, una fuente de dinero existente, una moneda (ARS o USD), una categoría existente, una
  fecha y una descripción de texto libre sin límite máximo de longitud; MUST impedir el
  guardado si falta alguno de estos datos y MUST indicar cuál falta.
- **FR-043**: El sistema MUST aceptar montos de transacción con hasta 2 decimales (precisión de
  centavos); si el usuario ingresa un valor con mayor precisión, el sistema MUST redondearlo a 2
  decimales (redondeo estándar, mitad hacia arriba) antes de guardarlo, sin rechazar el
  guardado por ese motivo.
- **FR-044**: El sistema MUST rechazar como inválida cualquier fecha de transacción posterior a
  la fecha actual; solo se permite fecha de hoy o anterior.
- **FR-018**: El sistema MUST permitir editar una transacción existente y reflejar los nuevos
  valores en el listado y en los saldos afectados.
- **FR-019**: El sistema MUST permitir eliminar una transacción existente, exigiendo
  confirmación explícita del usuario antes de borrarla.
- **FR-020**: El sistema MUST mostrar un mensaje de error y MUST conservar los datos ya
  ingresados por el usuario si el guardado de una transacción falla, para permitir reintentar
  sin volver a completarlos.
- **FR-045**: El sistema MUST deshabilitar el control de guardar mientras una operación de alta
  o edición de transacción está en curso, para impedir el envío duplicado por doble clic o
  doble tap.

**Saldos**

- **FR-021**: El sistema MUST mostrar el saldo disponible por separado para cada fuente de
  dinero y moneda, calculado como la suma de ingresos menos la suma de egresos de esa fuente y
  moneda.
- **FR-022**: El sistema MUST mostrar el saldo total consolidado en ARS (sumando solo
  transacciones en ARS de todas las fuentes) y el saldo total consolidado en USD (sumando solo
  transacciones en USD de todas las fuentes), de forma independiente entre sí.

**Vistas por período y paginación**

- **FR-023**: El sistema MUST permitir filtrar el listado de transacciones por día, por mes y
  por año.
- **FR-024**: El sistema MUST paginar el listado de transacciones mostrando un máximo de 50
  registros por página y MUST permitir navegar entre páginas sin repetir ni omitir registros. El
  orden por defecto del listado (con o sin filtro aplicado) MUST ser por fecha de transacción
  descendente (más reciente primero), usando `createdAt` descendente como criterio de desempate
  entre transacciones de la misma fecha.

**Gráficos**

- **FR-025**: El sistema MUST mostrar, por defecto al ingresar a la sección de gráficos y sin
  filtros aplicados, un gráfico de torta con la distribución porcentual de gastos por categoría
  del mes en curso, calculado en la zona horaria de Argentina (America/Argentina/Buenos_Aires,
  UTC-3 fijo, sin horario de verano). El porcentaje de cada categoría se redondea a 1 decimal;
  si la suma de los porcentajes redondeados no da exactamente 100%, se ajusta el porcentaje de
  la categoría de mayor monto para que la suma total sea exactamente 100%.
- **FR-026**: El sistema MUST permitir filtrar el gráfico de gastos por rango de fechas.
- **FR-027**: El sistema MUST permitir filtrar el gráfico de gastos por categoría.

**Conversor de divisas**

- **FR-028**: El sistema MUST ofrecer una sección dedicada para convertir montos entre USD y
  ARS en ambas direcciones (USD → ARS y ARS → USD).
- **FR-029**: El sistema MUST permitir al usuario elegir el tipo de cambio a aplicar entre:
  oficial, blue, bolsa, cripto, tarjeta, contado con liqui y mayorista.
- **FR-030**: El sistema MUST consultar la cotización vigente del tipo elegido en el momento de
  cada conversión, usando el valor de venta correspondiente a ese tipo de cambio.
- **FR-031**: El sistema MUST mostrar el resultado de la conversión en la moneda destino que
  corresponda a la dirección elegida.
- **FR-032**: El sistema MUST mostrar un mensaje de error explícito y MUST NOT mostrar ningún
  valor de conversión cuando la fuente de cotizaciones no responde, responde con error, supera
  el tiempo máximo de espera configurado, o responde exitosamente pero sin el tipo de cambio
  solicitado (FR-030) — este último caso recibe el mismo tratamiento que los anteriores.

**Seguridad y datos**

- **FR-033**: El sistema MUST proteger las contraseñas mediante hasheo con un algoritmo y
  parámetros equivalentes o superiores a los recomendados por OWASP para el estado del arte
  vigente (nunca en texto plano).
- **FR-034**: El sistema MUST almacenar los datos financieros del usuario cifrados en reposo.
- **FR-035**: El sistema MUST seguir siendo navegable y funcional aunque la fuente de
  cotizaciones no esté disponible; solo la sección de conversión se ve afectada.
- **FR-046**: El sistema MUST proteger toda operación que modifique estado (transacciones,
  fuentes de dinero, categorías, passkeys) contra solicitudes falsificadas entre sitios (CSRF).
  Es suficiente que el mecanismo de sesión rechace estructuralmente solicitudes originadas en
  otro sitio (sin exigir un token anti-CSRF adicional por operación).
- **FR-047**: El sistema MUST emitir en cada respuesta HTTP un conjunto base de cabeceras de
  seguridad estándar (política de contenido, prevención de MIME sniffing, prevención de
  embebido en iframes de terceros) para mitigar ataques comunes del lado del cliente (XSS,
  clickjacking, MIME sniffing).
- **FR-048**: El sistema MUST validar todo input externo (cuerpo de la petición, parámetros de
  consulta) contra un esquema estricto de tipo y forma antes de que alcance la capa de
  persistencia, para prevenir que un valor con forma inesperada (por ejemplo, un objeto en un
  campo que espera texto) altere una consulta a la base de datos.

### Key Entities

- **Usuario**: persona dueña de una cuenta; tiene un único método de autenticación elegido en
  el registro (passkey o usuario/contraseña) y es dueña exclusiva de todos sus datos.
- **Credencial de acceso**: representa el método de autenticación de un usuario; puede ser una o
  más passkeys (cada una con un nombre definido por el usuario al registrarla) o un par
  usuario/contraseña de al menos 4 caracteres (nunca ambos para la misma cuenta).
- **Fuente de dinero**: banco o medio (por ejemplo Santander, BNA, Macro, Lemon, Brubank,
  Efectivo) donde el usuario mantiene dinero; predefinida o dada de alta por el usuario; nombre
  único por cuenta; no editable ni eliminable una vez creada.
- **Categoría**: clasificación de un movimiento (por ejemplo comida, transporte, sueldo,
  freelance); predefinida o dada de alta por el usuario; nombre único por cuenta; no editable ni
  eliminable una vez creada.
- **Transacción**: movimiento de dinero (ingreso o egreso) con monto, moneda (ARS o USD), fuente
  de dinero asociada, categoría asociada, fecha y descripción; pertenece a un único usuario.
- **Saldo**: valor derivado (no una entidad almacenada de forma independiente) calculado a
  partir de las transacciones de una fuente de dinero y moneda, o consolidado por moneda.
- **Cotización**: valor de cambio USD/ARS para un tipo específico (oficial, blue, bolsa, cripto,
  tarjeta, contado con liqui, mayorista), obtenido de una fuente externa en el momento de cada
  conversión; no se almacena de forma persistente.
- **Registro de evento de seguridad**: entrada interna (no visible en la UI del usuario final)
  que documenta un evento de seguridad relevante — tipo de evento (login fallido, bloqueo
  temporal, acceso cruzado denegado), cuenta involucrada y fecha/hora — para permitir revisión
  posterior; se conserva 30 días desde su creación y luego puede eliminarse o rotarse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede registrarse y llegar al dashboard, con cualquiera de los
  dos métodos de autenticación, sin asistencia externa.
- **SC-002**: Un usuario puede registrar una transacción completa desde el dashboard en menos de
  30 segundos.
- **SC-003**: Las páginas de la aplicación cargan en menos de 2 segundos bajo condiciones de red
  normales (conexión de 10 Mbps o superior).
- **SC-004**: El resultado de una consulta de cotización se refleja en pantalla en un máximo de
  5 segundos desde que el usuario la solicita; si no llega en ese plazo, se informa un error en
  lugar de dejar la pantalla esperando indefinidamente.
- **SC-005**: La aplicación está disponible al menos el 99% del tiempo medido mensualmente.
- **SC-006**: La interfaz es completamente usable, sin scroll horizontal, en anchos de pantalla
  desde 320 px.
- **SC-007**: El saldo mostrado por cada fuente de dinero y el saldo consolidado por moneda
  coinciden, en el 100% de los casos verificados, con la suma de ingresos menos egresos
  correspondiente.
- **SC-008**: Ningún usuario puede ver ni modificar transacciones, saldos, fuentes de dinero,
  categorías o passkeys de otra cuenta, verificado en el 100% de los intentos de acceso cruzado
  probados.
- **SC-009**: Cuando la fuente de cotizaciones no está disponible, el 100% de los intentos de
  conversión muestran un mensaje de error explícito y ningún valor de conversión, y el resto de
  la aplicación permanece utilizable.

## Assumptions

- La aplicación es de un único usuario por cuenta; no existen cuentas compartidas ni perfiles
  familiares (fuera de alcance en esta versión).
- No hay integración directa con APIs bancarias ni sincronización automática de movimientos:
  toda transacción se carga manualmente.
- No hay notificaciones push, por email ni SMS en esta versión.
- No hay exportación de datos a CSV ni PDF, ni aplicación móvil nativa, en esta versión.
- No hay límite de tasa (rate limiting) para operaciones distintas del login (FR-036) en esta
  versión; queda como brecha conocida a revisar si se detecta abuso en producción.
- No se definen requisitos formales de accesibilidad (navegación por teclado, lectores de
  pantalla, contraste WCAG) en esta versión; queda como brecha conocida para una versión futura.
- No se gestionan inversiones, plazos fijos ni criptoactivos como activos propios de la cuenta
  (distinto del uso de "cripto" como uno de los tipos de cambio disponibles en el conversor).
- Las fuentes de dinero y categorías, una vez creadas, no pueden editarse ni eliminarse, para no
  afectar el histórico de transacciones ya registradas; solo se valida que no se dupliquen
  nombres exactos.
- No existe flujo de recuperación de cuenta sin passkey en esta versión; la mitigación
  disponible es que el usuario registre passkeys en varios dispositivos.
- No existe flujo de recuperación de contraseña olvidada en esta versión, de forma simétrica a
  la ausencia de recuperación de cuenta sin passkey; ambas quedan para una versión futura.
- La fuente de cotizaciones de tipos de cambio es un servicio externo de terceros; su
  disponibilidad y estructura de respuesta no están garantizadas por este equipo, por lo que el
  sistema debe seguir siendo funcional (salvo la sección de conversión) cuando ese servicio
  falla.
- El cifrado en tránsito (HTTPS/TLS) de los datos financieros es responsabilidad de la capa de
  despliegue (terminación TLS en el reverse proxy/balanceador y su certificado), no un requisito
  funcional del código de la aplicación; queda fuera del alcance funcional de este spec, de
  forma análoga a como no se definen detalles de hosting.
