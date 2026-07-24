# Quickstart: Validación de Finanzas Personales

**Propósito**: escenarios ejecutables para comprobar de punta a punta que la implementación
cumple las Historias de Usuario del spec. No duplica contratos ni modelo de datos — ver
`contracts/api.md` y `data-model.md` para el detalle de cada endpoint/entidad.

## Prerrequisitos

- Node.js v24 LTS, pnpm instalado.
- MongoDB corriendo localmente (o `MONGODB_URI` apuntando a una instancia accesible).
- Variables de entorno configuradas (ver `.env.example` en `backend/` y `frontend/`; ningún
  secreto real committeado, Principio IV): `MONGODB_URI`, `SESSION_JWT_SECRET`,
  `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `DOLARAPI_BASE_URL`.

## Setup

```bash
cd backend && pnpm install && pnpm dev    # levanta la API en :4000 (o el puerto configurado)
cd frontend && pnpm install && pnpm dev   # levanta Next.js en :3000
```

## Escenario 1 — Registro y acceso exclusivo por método elegido (Historia 1)

1. Ir a `/registro`, elegir "usuario y contraseña", completar con contraseña de 3 caracteres →
   **esperado**: bloqueo de alta, mensaje de largo mínimo (FR-042).
2. Repetir con contraseña de 4+ caracteres → **esperado**: cuenta creada, redirección a
   `/dashboard` (FR-003).
3. Cerrar sesión (control visible) → **esperado**: sesión invalidada de inmediato, vuelta a
   pantalla de acceso (FR-041).
4. Intentar acceder a esa cuenta vía el flujo de passkey → **esperado**: rechazado (FR-002).
5. Fallar el login por contraseña 5 veces seguidas → **esperado**: bloqueo temporal informado
   (FR-036); reintentar antes de 15 minutos sigue bloqueado; después de 15 minutos o con
   contraseña correcta, el contador se resetea.
6. Registrar una segunda cuenta con "passkey", agregar una segunda passkey desde otro
   navegador/perfil con un nombre elegido → **esperado**: ambas listadas con su nombre (FR-006).
7. Intentar borrar la única passkey restante en una cuenta con una sola → **esperado**: rechazo
   explícito (FR-007).

## Escenario 2 — Alta de fuentes de dinero y categorías propias (Historia 2)

1. Con una cuenta recién creada, ir al formulario de transacción → los selectores de fuente de
   dinero y de categoría aparecen vacíos (FR-008, FR-009, FR-012).
2. Dar de alta una fuente de dinero: nombre "Lemon", `virtual = true`, monto inicial 1000 ARS y
   0 USD → queda registrada y disponible en el selector con esos valores exactos (FR-010,
   FR-049, FR-050, FR-051).
3. Repetir el alta dejando `virtual` sin elegir, o sin completar el monto inicial en ARS o en
   USD → guardado bloqueado, se señala el campo faltante (FR-049/FR-050/FR-051).
4. Repetir con un monto inicial negativo en ARS o en USD → guardado bloqueado, mensaje de que no
   puede ser negativo (FR-050/FR-051).
5. Dar de alta una fuente de dinero con un nombre ya existente ("Lemon") → rechazado (FR-011).
6. Dar de alta una categoría propia (por ejemplo "Comida") → queda registrada y disponible en el
   selector (FR-013).
7. Repetir con un nombre de categoría ya existente → rechazado (FR-014).

## Escenario 3 — Alta, edición y borrado de transacciones (Historia 3)

1. Con al menos una fuente de dinero y una categoría ya dadas de alta (Escenario 2), completar
   el formulario de egreso con todos los campos válidos → aparece en el listado con esos datos
   exactos, y el monto de la fuente en esa moneda se reduce en el monto ingresado (FR-016,
   FR-017, FR-052).
2. Repetir dejando la descripción vacía → guardado bloqueado, se señala el campo faltante.
3. Ingresar monto `-5` → bloqueado, mensaje de monto > 0.
4. Ingresar monto con 3 decimales (`10.999`) → se guarda redondeado a 2 decimales (mitad hacia
   arriba, `11.00`), sin rechazar el guardado (FR-043).
5. Ingresar una fecha futura → bloqueado (FR-044).
6. Registrar egresos hasta dejar el monto de una fuente en negativo → se guarda igual, sin
   bloqueo; el monto de la fuente queda negativo (Edge Case, clarificación 2026-07-24).
7. Editar una transacción existente cambiando solo el monto → el listado y el monto de la fuente
   afectada reflejan el nuevo valor (FR-018, FR-021).
8. Editar una transacción existente cambiando su fuente de dinero y/o su moneda → el monto de la
   fuente original revierte el efecto de los valores viejos y el monto de la fuente nueva aplica
   los valores nuevos (FR-018, FR-052, clarificación 2026-07-24).
9. Eliminarla confirmando el diálogo → desaparece del listado y el monto de su fuente se
   recalcula como si nunca hubiera existido (FR-019, FR-052).
10. Hacer doble clic rápido en "Guardar" al crear una transacción → verificar que no se crean dos
    registros (FR-045).

## Escenario 4 — Saldos por fuente y consolidados (Historia 4)

1. Con fuentes que ya tienen monto inicial y transacciones en al menos dos fuentes y ambas
   monedas (ARS y USD).
2. Ir a la vista de saldos → el saldo por fuente/moneda coincide con su monto inicial más
   ingresos−egresos de esa combinación exacta (FR-021, SC-007); el consolidado ARS y el
   consolidado USD suman solo sus propias transacciones (FR-022).

## Escenario 5 — Filtros y paginación (Historia 5)

1. Cargar más de 50 transacciones en distintos días/meses/años.
2. Filtrar por un día específico → solo esas transacciones (FR-023).
3. Sin filtro, primera página → 50 resultados; página siguiente → el resto sin repetir ni omitir
   (FR-024).

## Escenario 6 — Gráficos de gastos (Historia 6)

1. Con gastos en 2+ categorías del mes en curso, entrar a la sección de gráficos sin filtros →
   torta con distribución porcentual (FR-025).
2. Filtrar por rango de fechas → solo esos gastos (FR-026).
3. Filtrar por categoría → solo esa categoría (FR-027).

## Escenario 7 — Conversor USD/ARS (Historia 7)

1. Entrar a la sección de conversión con dolarapi.com disponible → campo de monto, selector de
   dirección, resultado (FR-028).
2. Elegir "oficial", dirección USD→ARS, ingresar 100 → resultado usando el `venta` oficial
   vigente (FR-030, FR-031).
3. Repetir para cada uno de los 7 tipos de cambio (FR-029).
4. Simular caída de dolarapi.com (cortar red o apuntar `DOLARAPI_BASE_URL` a un host inválido) →
   mensaje de error explícito, ningún valor de conversión mostrado (FR-032, RF30); el resto de
   la app (transacciones, saldos, gráficos) sigue funcionando (FR-035).

## Validación no funcional

- Con un usuario ya autenticado en el dashboard, cronometrar desde que abre el formulario de
  transacción hasta que la transacción confirmada aparece en el listado → < 30s (SC-002).
- Cargar cualquier página en una conexión throttled a 10 Mbps → < 2s (SC-003).
- Medir el tiempo entre pedir una conversión y ver el resultado o el error → ≤ 5s (SC-004).
- Reducir el viewport a 320px de ancho en cada sección → sin scroll horizontal (SC-006).
- Intentar acceder a una transacción/fuente/categoría/passkey de otra cuenta manipulando un id
  en la URL o el body del request → `404`, sin exponer ni modificar el dato ajeno (FR-008); se
  genera un `security_events` de tipo `cross_account_access_denied` (verificar solo a nivel de
  base de datos, nunca expuesto en la UI/API de usuario final, FR-040).
- Inspeccionar las cabeceras de cualquier respuesta del backend → set base de cabeceras de
  seguridad HTTP presente (FR-047); la cookie de sesión tiene los atributos `httpOnly`,
  `secure` y `sameSite=strict` (FR-046).
- Enviar un `body` con un campo de forma inesperada (por ejemplo, un objeto en vez de texto) a
  cualquier endpoint de escritura → `400` con el formato de error estándar, sin llegar a tocar
  la base de datos (FR-048).
