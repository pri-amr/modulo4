// Overlay circular centrado, a pantalla completa, con fondo semitransparente que bloquea
// clicks sobre el contenido subyacente mientras hay una operación en curso (FR-045,
// plan.md "Estado de carga global"). El spinner es un indicador circular indeterminado
// (arco que crece y se achica mientras gira) en el color #376BCB (FR-055).
export function Loader() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60"
      style={{ pointerEvents: "auto" }}
    >
      <svg className="h-12 w-12 animate-spin" viewBox="0 0 50 50" data-testid="loader-spinner">
        <circle
          className="animate-loader-dash"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#376BCB"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
