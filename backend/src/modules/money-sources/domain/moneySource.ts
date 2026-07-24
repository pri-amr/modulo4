import type { Currency } from "../../../shared/domain/currency";

export interface MoneySource {
  id: string;
  userId: string;
  name: string;
  virtual: boolean;
  amountARS: number;
  amountUSD: number;
}

// Puerto del dominio. Solo expone lo que esta feature (crear transacción) necesita:
// leer una fuente propia y ajustar su monto de forma atómica (FR-052, research.md §16).
// El alta con sus validaciones (nombre, virtual, monto inicial — FR-010/FR-049/FR-050/
// FR-051) es responsabilidad de la Historia 2 y se agrega sobre este mismo repositorio.
export interface MoneySourceRepository {
  findByIdForUser(id: string, userId: string): Promise<MoneySource | null>;
  adjustAmount(
    id: string,
    currency: Currency,
    delta: number,
    session?: unknown,
  ): Promise<void>;
}
