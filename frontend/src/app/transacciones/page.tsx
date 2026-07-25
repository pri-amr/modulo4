import { TransactionForm } from "../../components/transactions/TransactionForm";

// Server Component (SSR): la página no tiene estado propio ni "use client"; solo consume el
// componente cliente TransactionForm, que sí necesita interactividad (FR-045, formulario).
// Shell de 4 cuadrantes (plan.md, "Transacciones"): superior izquierda = alta de
// transacción (esta historia); superior derecha = saldos (US4); inferior izquierda =
// historial/filtros (US3/US5); inferior derecha = gráfico (US6). Se apilan en una columna
// por debajo de 500px. Por ahora solo el cuadrante de alta está implementado; el resto
// llega con las historias correspondientes.
export default async function TransaccionesPage() {
  return (
    <main className="grid grid-cols-1 gap-6 p-6 min-[500px]:grid-cols-2">
      <section aria-label="Alta de transacción">
        {/* TODO(US2): poblar moneySources/categories desde GET /money-sources y
            GET /categories una vez que esa historia exista. */}
        <TransactionForm moneySources={[{ id: "1", name: "BNA" }]} categories={[{ id: "1", name: "Compras" }]} />
      </section>
      <section aria-label="Saldos por fuente" />
      <section aria-label="Historial de transacciones" />
      <section aria-label="Gráfico de gastos" />
    </main>
  );
}
