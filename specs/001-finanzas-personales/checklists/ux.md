# UX Requirements Checklist: Finanzas Personales (Multi-banco, ARS/USD)

**Purpose**: Validar la calidad (completitud, claridad, consistencia y verificabilidad) de los
requisitos de UX del spec — formularios y validación, estados vacíos/carga/error, y
responsive/mobile-first — como autochequeo del autor antes de correr `/speckit-plan`.
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md)
**Depth**: Estándar
**Focus**: Formularios y validación · Estados vacíos/carga/error · Responsive/mobile-first
**Audience/Timing**: Autor, pre-`/speckit-plan`

**Note**: Este checklist valida los REQUISITOS tal como están escritos, no la implementación.
Cada ítem pregunta si el spec está completo, claro, consistente y medible — no si la UI
"se ve bien" o "funciona correctamente".

## Requirement Completeness

- [x] CHK001 - ¿Está especificado el contenido exacto de los mensajes de validación por campo, más allá de "señala cuál falta"? [Gap, Spec §FR-017]
- [x] CHK002 - ¿Están definidos requisitos de estado de carga para la vista de saldos mientras se obtienen las transacciones? [Gap, Spec §FR-021]
- [x] CHK003 - ¿Están definidos requisitos de estado de carga para el listado de transacciones mientras se aplica un filtro (día/mes/año)? [Gap, Spec §FR-023]
- [x] CHK004 - ¿Están definidos requisitos de estado de carga para el conversor mientras espera la respuesta de cotización (hasta los 5 segundos de SC-004)? [Gap, Spec §SC-004]
- [x] CHK005 - ¿Está definido el estado inicial (vacío, sin tocar ningún campo) del formulario de transacción? [Gap, Spec §User Story 3]
- [x] CHK006 - ¿Están definidos requisitos de layout responsive para el listado de transacciones en el ancho mínimo de 320px (por ejemplo, apilado de columnas)? [Gap, Spec §SC-006]
- [x] CHK007 - ¿Están definidos requisitos de cómo se adapta el gráfico de torta (FR-025) a 320px de ancho? [Gap, Spec §SC-006, §FR-025]
- [x] CHK008 - ¿Están definidos requisitos de comportamiento responsive para los controles de filtro por período y de paginación en anchos angostos? [Gap, Spec §FR-023, §FR-024]

## Requirement Clarity

- [x] CHK009 - ¿Especifica el spec, más allá de "señala cuál falta" (Historia 3, escenario 3), si el error se muestra en línea junto al campo o como mensaje general? [Ambiguity, Spec §User Story 3]
- [x] CHK010 - ¿Aclara SC-006 si "sin scroll horizontal" aplica a todas las secciones (listado, gráficos, conversor) o solo al layout principal? [Ambiguity, Spec §SC-006]
- [x] CHK011 - ¿Está definido un patrón de presentación común (banner, toast, inline) para "mensaje de error", usado de forma consistente entre FR-004, FR-020 y FR-032, o cada sección podría implementarlo distinto? [Consistency, Spec §FR-004, §FR-020, §FR-032]

## Requirement Consistency

- [x] CHK012 - ¿Son consistentes los requisitos de error de validación (FR-017, Historia 3 escenarios 3-4) con el requisito de error de persistencia (FR-020) en cuanto a cómo se le muestran al usuario? [Consistency, Spec §FR-017, §FR-020]
- [x] CHK013 - ¿Es consistente el manejo de "listado vacío" cuando un filtro no encuentra resultados (Edge Case) con el caso de una cuenta nueva sin ninguna transacción todavía? [Consistency, Gap]

## Acceptance Criteria Quality

- [x] CHK014 - ¿Puede verificarse "la transacción aparece en el listado con esos datos exactos" (Historia 3, escenarios 1-2) sin que el spec defina el patrón de confirmación en pantalla (redirección, actualización en línea, aviso temporal)? [Measurability, Spec §User Story 3]
- [x] CHK015 - ¿Existe un escenario de aceptación para el estado vacío de una cuenta recién creada, antes de registrar cualquier transacción? [Coverage, Gap]
- [x] CHK016 - ¿Existe un escenario de aceptación que valide alguna pantalla con densidad de datos (listado o gráfico) específicamente en el ancho mínimo soportado de 320px? [Coverage, Gap, Spec §SC-006]

## Scenario Coverage

- [x] CHK017 - ¿Están definidos requisitos de retroalimentación visual distintos para el flujo primario de alta de transacción (camino feliz) frente al flujo de excepción (falla de validación)? [Scenario Coverage, Gap]
- [x] CHK018 - ¿Está definido qué debe ocurrir visualmente mientras un guardado está en curso (por ejemplo, deshabilitar el botón de confirmar) para evitar envíos duplicados? [Gap, Edge Case]
- [x] CHK019 - ¿Está definido el estado del gráfico de gastos para una cuenta con gastos en una sola categoría (torta de una sola porción, 100%)? [Gap, Edge Case, Spec §FR-025]

## Edge Case Coverage

- [x] CHK020 - ¿Está definido cómo se muestra, sin romper el layout a 320px, una descripción o un nombre de fuente/categoría inusualmente largo (el spec no declara un límite de longitud)? [Gap, Edge Case]
- [x] CHK021 - ¿Está definido el comportamiento visual del listado justo en el límite de paginación (50 vs. 51 transacciones)? [Edge Case, Spec §FR-024]
- [x] CHK022 - ¿Están definidos requisitos para un doble envío del formulario (doble clic/doble tap en "guardar"), más allá del caso ya cubierto de falla de red? [Gap, Edge Case]

## Non-Functional Requirements

- [x] CHK023 - ¿Está especificado algún rango o breakpoint máximo de ancho de pantalla, más allá del mínimo de 320px (SC-006), por ejemplo comportamiento en tablet o escritorio? [Gap, Spec §SC-006]
- [x] CHK024 - ¿Están definidos requisitos de rendimiento percibido (esqueletos de carga, spinners) alineados con la meta de carga de 2 segundos (SC-003), para que el usuario reciba señal visual durante esa espera? [Gap, Spec §SC-003]

## Dependencies & Assumptions

- [x] CHK025 - ¿Está declarado explícitamente como restricción de localización que toda la interfaz es en español (tal como está escrito en todo el spec), o queda implícito? [Gap, Assumption]

## Ambiguities & Conflicts

- [x] CHK026 - ¿Existe un esquema de referencia consistente que vincule cada FR relevante de UX con una pantalla o sección específica, para facilitar la trazabilidad durante el diseño? [Traceability]

## Notes

- Este checklist se enfocó, a pedido explícito, en formularios/validación, estados
  vacíos/carga/error, y responsive/mobile-first. Accesibilidad (teclado, lectores de pantalla,
  contraste) quedó fuera de este checklist y sigue como brecha conocida de la ronda anterior de
  `/speckit-clarify`.
- Este checklist es un test de calidad del *texto* del spec, no una suite de pruebas de la
  futura implementación.

### Resolución 2026-07-24

Se revisaron los 24 ítems pendientes.

- **Resueltos con una decisión explícita del usuario, agregada al spec**:
  - **CHK018**: mientras el guardado está en curso, el botón de confirmar se deshabilita Y se
    muestra un indicador de carga a pantalla completa que bloquea cualquier otra interacción
    hasta que la operación resuelve. FR-045 se amplió con esta segunda parte.
  - **CHK019**: si todos los gastos del período pertenecen a una sola categoría, el gráfico
    muestra una única porción al 100%. Agregado como Edge Case explícito.
  - **CHK020**: un nombre de fuente/categoría o una descripción demasiado larga para el ancho
    disponible se trunca con "…", y al pasar el mouse (hover) aparece un tooltip con el
    contenido completo. Agregado como Edge Case explícito.
- **Resueltos por el Loader/`LoadingProvider` global de plan.md** (se activa automáticamente en
  toda llamada a `handleRequest`, sin que cada pantalla lo gestione — el mismo mecanismo que
  ahora CHK018 deja explícito también en el spec): CHK002, CHK003, CHK004, CHK024.
- **Resueltos por el layout responsive de plan.md** (los cuadrantes de "Transacciones" —listado,
  saldos, gráfico— se apilan en una columna por debajo de 500px, dentro del rango de 320px de
  SC-006): CHK006, CHK007, CHK008.
- **Resueltos por FR-045 y su clarificación** (deshabilitar "Guardar" + loader de pantalla
  completa mientras la operación está en curso): CHK022.
- **Resueltos por la clarificación de patrón visual ya existente** (borde e inline en rojo para
  campo inválido, Historia 3 escenario 3): CHK009 (ya tildado), CHK017 (el camino feliz ya tiene
  su propio patrón clarificado: actualización en línea sin navegar).
- **Resueltos como no-issue / cubiertos genéricamente, sin requerir un nuevo requisito**: CHK001
  (el contenido literal de cada mensaje es una decisión de copywriting/implementación, no un
  requisito funcional — el spec ya fija el patrón, no el texto exacto); CHK005 (un formulario de
  alta arranca vacío por definición, no hay otra interpretación razonable); CHK010 ("la
  interfaz" en SC-006 ya se lee como el total de la aplicación, no un layout puntual); CHK011/
  CHK012 (los errores de campo —inline— y los de operación completa —FR-020/FR-032, sin un
  campo al que anclarse— usan naturalmente patrones distintos pero cada uno internamente
  consistente, no es una inconsistencia); CHK013 (una cuenta nueva sin transacciones renderiza
  el mismo componente de listado vacío que un filtro sin resultados, mismo código, mismo
  Edge Case); CHK014 (ya cubierto por la clarificación de "actualización en línea, listado se
  refresca al instante, formulario se limpia"); CHK015 (cubierto transitivamente por las
  Acceptance Scenarios de Historia 2 sobre catálogo vacío, que establecen el mismo patrón para
  una cuenta recién creada); CHK016 (SC-006 ya es el criterio de aceptación aplicable a todas
  las pantallas por igual, una AC redundante por pantalla no agrega cobertura real); CHK021 (ya
  cubierto por FR-024 más el campo `hasNextPage` de contracts/api.md, que determina si el
  control "siguiente" se muestra); CHK023 (SC-006 fija un mínimo de 320px de forma deliberada
  —mobile-first— sin techo superior, acorde al PRD; el diseño responsive escala hacia arriba sin
  un breakpoint máximo adicional); CHK026 (plan.md ya organiza los Estándares de Interfaz
  pantalla por pantalla — Dashboard, Login/Registro, Alta de categoría/fuente, Transacciones —,
  cubriendo la trazabilidad que este ítem pedía).
- Se agregó una Assumption explícita en spec.md ("La interfaz de usuario es exclusivamente en
  español...") para cerrar **CHK025**, que antes quedaba implícito sin declararse.
