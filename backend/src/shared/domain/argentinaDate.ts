const ARGENTINA_UTC_OFFSET_MS = -3 * 60 * 60 * 1000;

// Argentina no usa horario de verano; UTC-3 es fijo (research.md, FR-025/FR-044).
export function todayInArgentina(): string {
  const nowInArgentina = new Date(Date.now() + ARGENTINA_UTC_OFFSET_MS);
  return nowInArgentina.toISOString().slice(0, 10);
}
