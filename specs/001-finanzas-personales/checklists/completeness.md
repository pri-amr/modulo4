# Functional Completeness Checklist: Finanzas Personales (Multi-banco, ARS/USD)

**Purpose**: Validar la calidad (completitud, claridad, consistencia y verificabilidad) de los
requisitos de los dominios funcionales aún no auditados por otros checklists — fuentes de
dinero/categorías, transacciones, saldos, filtros/paginación, gráficos, conversor de divisas,
seguridad de datos (FR-034/FR-035), entidades y criterios de éxito — para cerrar la cobertura al
100% del spec antes de `/speckit-plan`.
**Created**: 2026-07-21
**Feature**: [spec.md](../spec.md)
**Depth**: Estándar
**Focus**: Dominios funcionales no cubiertos por `security.md` (auth/seguridad) ni `ux.md` (UX)
**Audience/Timing**: Autor, pre-`/speckit-plan`

**Note**: Este checklist valida los REQUISITOS tal como están escritos, no la implementación.
Cada ítem pregunta si el spec está completo, claro, consistente y medible — no si el sistema
"funciona correctamente".

## Requirement Completeness

- [ ] CHK001 - ¿Está definido qué ocurre si el usuario intenta dar de alta una fuente de dinero o categoría con el nombre vacío, distinto del caso de duplicado ya cubierto? [Gap, Spec §FR-010, §FR-013]
- [ ] CHK002 - ¿Está especificado un límite máximo de longitud para el nombre de una fuente de dinero, una categoría o la descripción de una transacción? [Gap, Spec §FR-010, §FR-013, §FR-017]
- [ ] CHK003 - ¿Está definido si existe un tope máximo de monto para una transacción, o el sistema acepta cualquier valor positivo sin límite superior? [Gap, Spec §FR-017]
- [ ] CHK004 - ¿Está especificado si se permite registrar una transacción con fecha futura? [Gap, Spec §FR-017]
- [ ] CHK005 - ¿Está definido el criterio de ordenamiento por defecto del listado de transacciones? [Gap, Spec §FR-023, §FR-024]
- [ ] CHK006 - ¿Están definidos requisitos de cifrado en tránsito, además del cifrado en reposo de FR-034, para los datos financieros? [Gap, Spec §FR-034]
- [ ] CHK007 - ¿Está especificado cómo se trata el gráfico de gastos (FR-025) cuando el usuario tiene egresos tanto en ARS como en USD dentro del mismo mes? [Gap, Spec §FR-025]

## Requirement Clarity

- [ ] CHK008 - ¿Aclara el spec si el gráfico de gastos (FR-025) incluye únicamente transacciones de tipo egreso, o también ingresos categorizados? [Ambiguity, Spec §FR-025]
- [ ] CHK009 - ¿Especifica FR-030 qué debe ocurrir si dolarapi.com responde exitosamente pero sin el campo `venta` esperado para el tipo de cambio elegido? [Ambiguity, Spec §FR-030, §FR-032]
- [ ] CHK010 - ¿Es "el mes en curso" (FR-025) lo bastante preciso para determinar de forma objetiva sus límites (huso horario, día de corte)? [Clarity, Spec §FR-025]
- [ ] CHK011 - ¿Aclara el spec si el saldo por fuente y moneda (FR-021) se recalcula en tiempo real o se cachea, en relación con "reflejar los nuevos valores... en los saldos afectados" de FR-018? [Ambiguity, Spec §FR-018, §FR-021]
- [ ] CHK012 - ¿Define el spec el valor concreto de "tiempo máximo de espera configurado" en FR-032, más allá del máximo de 5 segundos mencionado en SC-004? [Clarity, Spec §FR-032, §SC-004]

## Requirement Consistency

- [ ] CHK013 - ¿Es consistente la prohibición de editar/eliminar fuentes de dinero y categorías (FR-015) con la edición de transacciones (FR-018), en cuanto a si una transacción editada puede cambiar de fuente o categoría? [Consistency, Spec §FR-015, §FR-018]
- [ ] CHK014 - ¿Son consistentes entre sí los requisitos de mensaje de error para validación de formulario (FR-017), fallo de guardado (FR-020) y fallo de cotización (FR-032) en cuanto a su nivel de detalle exigido? [Consistency, Spec §FR-017, §FR-020, §FR-032]
- [ ] CHK015 - ¿Es consistente el alcance de "navegable y funcional" pese a la caída de cotizaciones (FR-035) con los requisitos de saldos y gráficos, que no dependen de dolarapi.com? [Consistency, Spec §FR-035]

## Acceptance Criteria Quality

- [ ] CHK016 - ¿Existe un escenario de aceptación que verifique el cálculo del saldo consolidado (FR-022) cuando una fuente de dinero tiene transacciones en ambas monedas (ARS y USD)? [Coverage, Gap, Spec §FR-022]
- [ ] CHK017 - ¿Existe un escenario de aceptación para el límite exacto de paginación (transacción número 50 frente a 51) descripto en FR-024? [Measurability, Spec §FR-024]
- [ ] CHK018 - ¿Puede verificarse objetivamente "distribución porcentual de gastos por categoría" (FR-025) sin que el spec defina el redondeo o el tratamiento de porcentajes que no suman exactamente 100%? [Measurability, Spec §FR-025]
- [ ] CHK019 - ¿Existe un escenario de aceptación que cubra la selección de cada uno de los siete tipos de cambio de FR-029, o solo se ilustra el caso general? [Coverage, Spec §FR-029, §User Story 6]

## Scenario Coverage

- [ ] CHK020 - ¿Están definidos requisitos de excepción para cuando el usuario intenta editar o eliminar una transacción que ya fue eliminada o editada por otra sesión, en línea con el Edge Case de última escritura gana? [Coverage, Gap, Spec §Edge Cases]
- [ ] CHK021 - ¿Está definido qué debe mostrarse en el resultado del conversor (FR-031) si el usuario cambia el tipo de cambio elegido después de haber obtenido un resultado, antes de confirmar una nueva conversión? [Gap, Spec §FR-029, §FR-031]
- [ ] CHK022 - ¿Existe un escenario de aceptación para una cuenta recién creada que solo cuenta con las fuentes de dinero y categorías predefinidas, sin ninguna dada de alta por el usuario? [Coverage, Gap, Spec §FR-009, §FR-012]

## Edge Case Coverage

- [ ] CHK023 - ¿Está definido el comportamiento cuando el gráfico de gastos se filtra por rango de fechas o categoría (FR-026, FR-027) sin ningún gasto en ese subconjunto, de forma análoga al listado vacío ya cubierto en Edge Cases? [Edge Case, Gap, Spec §FR-026, §FR-027]
- [ ] CHK024 - ¿Está definido qué ocurre si el usuario ingresa un monto con más decimales de los que la moneda soporta (por ejemplo, centavos de ARS o USD)? [Edge Case, Gap, Spec §FR-017]
- [ ] CHK025 - ¿Está definido un límite superior al monto que puede convertirse en el conversor (FR-028), o el sistema acepta cualquier valor positivo sin tope? [Edge Case, Gap, Spec §FR-028]

## Non-Functional Requirements

- [ ] CHK026 - ¿Está definido un requisito de rendimiento específico para el cálculo de saldos consolidados (FR-022) cuando el historial de transacciones es extenso, distinto de la meta general de carga de página (SC-003)? [Gap, Spec §SC-003, §FR-022]
- [ ] CHK027 - ¿Está especificado el algoritmo o estándar de cifrado en reposo exigido por FR-034, o queda abierto a interpretación del equipo de implementación? [Clarity, Spec §FR-034]
- [ ] CHK028 - ¿Está definido un requisito de disponibilidad o timeout específico para la consulta de saldos y transacciones, distinto del SC-005 general de disponibilidad de la aplicación? [Gap, Spec §SC-005]

## Dependencies & Assumptions

- [ ] CHK029 - ¿Está documentada como supuesto validado la dependencia de la estructura específica de la respuesta de dolarapi.com (campos, tipos de cambio disponibles), más allá de mencionarla como fuente obligatoria? [Assumption, Spec §Assumptions, §FR-029, §FR-030]
- [ ] CHK030 - ¿Se contrastó el supuesto de "toda transacción se carga manualmente" (sin integración bancaria) con los requisitos de saldos (FR-021, FR-022), para confirmar que no se espera ninguna conciliación automática? [Consistency, Spec §Assumptions, §FR-021, §FR-022]

## Ambiguities & Conflicts

- [ ] CHK031 - ¿Existe un esquema de identificación consistente entre los FR funcionales (FR-009 a FR-032) y los criterios de éxito (SC-001 a SC-009) que permita trazar cada meta medible a los requisitos que la sustentan? [Traceability, Spec §Requirements, §Success Criteria]
- [ ] CHK032 - ¿Podría SC-007 ("el saldo... coincide en el 100% de los casos verificados") entrar en conflicto con FR-021 si una transacción queda en un estado intermedio por el Edge Case de última escritura gana en ediciones concurrentes? [Conflict, Spec §SC-007, §FR-021, §Edge Cases]

## Notes

- Este checklist complementa a `security.md` (auth/seguridad) y `ux.md` (UX) sin duplicar sus
  ítems; junto a ambos cubre el 100% de los dominios funcionales declarados en el spec.
- Ítems marcados sin resolver conviene cerrarlos (actualizando el spec o documentando la
  decisión) antes de correr `/speckit-plan`.
- Este checklist es un test de calidad del *texto* del spec, no una suite de pruebas de la
  futura implementación.
