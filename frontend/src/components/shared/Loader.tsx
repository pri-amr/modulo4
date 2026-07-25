// Overlay circular centrado, a pantalla completa, con fondo semitransparente que bloquea
// clicks sobre el contenido subyacente mientras hay una operación en curso (FR-045,
// plan.md "Estado de carga global").
export function Loader() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60"
      style={{ pointerEvents: "auto" }}
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-accent dark:border-slate-700" />
    </div>
  );
}
