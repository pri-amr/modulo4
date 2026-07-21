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

- [ ] CHK001 - ¿Está especificado el contenido exacto de los mensajes de validación por campo, más allá de "señala cuál falta"? [Gap, Spec §FR-017]
- [ ] CHK002 - ¿Están definidos requisitos de estado de carga para la vista de saldos mientras se obtienen las transacciones? [Gap, Spec §FR-021]
- [ ] CHK003 - ¿Están definidos requisitos de estado de carga para el listado de transacciones mientras se aplica un filtro (día/mes/año)? [Gap, Spec §FR-023]
- [ ] CHK004 - ¿Están definidos requisitos de estado de carga para el conversor mientras espera la respuesta de cotización (hasta los 5 segundos de SC-004)? [Gap, Spec §SC-004]
- [ ] CHK005 - ¿Está definido el estado inicial (vacío, sin tocar ningún campo) del formulario de transacción? [Gap, Spec §User Story 2]
- [ ] CHK006 - ¿Están definidos requisitos de layout responsive para el listado de transacciones en el ancho mínimo de 320px (por ejemplo, apilado de columnas)? [Gap, Spec §SC-006]
- [ ] CHK007 - ¿Están definidos requisitos de cómo se adapta el gráfico de torta (FR-025) a 320px de ancho? [Gap, Spec §SC-006, §FR-025]
- [ ] CHK008 - ¿Están definidos requisitos de comportamiento responsive para los controles de filtro por período y de paginación en anchos angostos? [Gap, Spec §FR-023, §FR-024]

## Requirement Clarity

- [ ] CHK009 - ¿Especifica el spec, más allá de "señala cuál falta" (Historia 2, escenario 3), si el error se muestra en línea junto al campo o como mensaje general? [Ambiguity, Spec §User Story 2]
- [ ] CHK010 - ¿Aclara SC-006 si "sin scroll horizontal" aplica a todas las secciones (listado, gráficos, conversor) o solo al layout principal? [Ambiguity, Spec §SC-006]
- [ ] CHK011 - ¿Está definido un patrón de presentación común (banner, toast, inline) para "mensaje de error", usado de forma consistente entre FR-004, FR-020 y FR-032, o cada sección podría implementarlo distinto? [Consistency, Spec §FR-004, §FR-020, §FR-032]

## Requirement Consistency

- [ ] CHK012 - ¿Son consistentes los requisitos de error de validación (FR-017, Historia 2 escenarios 3-4) con el requisito de error de persistencia (FR-020) en cuanto a cómo se le muestran al usuario? [Consistency, Spec §FR-017, §FR-020]
- [ ] CHK013 - ¿Es consistente el manejo de "listado vacío" cuando un filtro no encuentra resultados (Edge Case) con el caso de una cuenta nueva sin ninguna transacción todavía? [Consistency, Gap]

## Acceptance Criteria Quality

- [x] CHK014 - ¿Puede verificarse "la transacción aparece en el listado con esos datos exactos" (Historia 2, escenarios 1-2) sin que el spec defina el patrón de confirmación en pantalla (redirección, actualización en línea, aviso temporal)? [Measurability, Spec §User Story 2]
- [ ] CHK015 - ¿Existe un escenario de aceptación para el estado vacío de una cuenta recién creada, antes de registrar cualquier transacción? [Coverage, Gap]
- [ ] CHK016 - ¿Existe un escenario de aceptación que valide alguna pantalla con densidad de datos (listado o gráfico) específicamente en el ancho mínimo soportado de 320px? [Coverage, Gap, Spec §SC-006]

## Scenario Coverage

- [ ] CHK017 - ¿Están definidos requisitos de retroalimentación visual distintos para el flujo primario de alta de transacción (camino feliz) frente al flujo de excepción (falla de validación)? [Scenario Coverage, Gap]
- [ ] CHK018 - ¿Está definido qué debe ocurrir visualmente mientras un guardado está en curso (por ejemplo, deshabilitar el botón de confirmar) para evitar envíos duplicados? [Gap, Edge Case]
- [ ] CHK019 - ¿Está definido el estado del gráfico de gastos para una cuenta con gastos en una sola categoría (torta de una sola porción, 100%)? [Gap, Edge Case, Spec §FR-025]

## Edge Case Coverage

- [ ] CHK020 - ¿Está definido cómo se muestra, sin romper el layout a 320px, una descripción o un nombre de fuente/categoría inusualmente largo (el spec no declara un límite de longitud)? [Gap, Edge Case]
- [ ] CHK021 - ¿Está definido el comportamiento visual del listado justo en el límite de paginación (50 vs. 51 transacciones)? [Edge Case, Spec §FR-024]
- [ ] CHK022 - ¿Están definidos requisitos para un doble envío del formulario (doble clic/doble tap en "guardar"), más allá del caso ya cubierto de falla de red? [Gap, Edge Case]

## Non-Functional Requirements

- [ ] CHK023 - ¿Está especificado algún rango o breakpoint máximo de ancho de pantalla, más allá del mínimo de 320px (SC-006), por ejemplo comportamiento en tablet o escritorio? [Gap, Spec §SC-006]
- [ ] CHK024 - ¿Están definidos requisitos de rendimiento percibido (esqueletos de carga, spinners) alineados con la meta de carga de 2 segundos (SC-003), para que el usuario reciba señal visual durante esa espera? [Gap, Spec §SC-003]

## Dependencies & Assumptions

- [ ] CHK025 - ¿Está declarado explícitamente como restricción de localización que toda la interfaz es en español (tal como está escrito en todo el spec), o queda implícito? [Gap, Assumption]

## Ambiguities & Conflicts

- [ ] CHK026 - ¿Existe un esquema de referencia consistente que vincule cada FR relevante de UX con una pantalla o sección específica, para facilitar la trazabilidad durante el diseño? [Traceability]

## Notes

- Este checklist se enfocó, a pedido explícito, en formularios/validación, estados
  vacíos/carga/error, y responsive/mobile-first. Accesibilidad (teclado, lectores de pantalla,
  contraste) quedó fuera de este checklist y sigue como brecha conocida de la ronda anterior de
  `/speckit-clarify`.
- Este checklist es un test de calidad del *texto* del spec, no una suite de pruebas de la
  futura implementación.
