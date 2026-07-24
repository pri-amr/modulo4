import { AppError } from "../../../../shared/http/errors";
import type { Currency } from "../../../../shared/domain/currency";
import type { MoneySourceRepository } from "../../../money-sources/domain/moneySource";
import type { CategoryRepository } from "../../../categories/domain/category";
import type {
  Transaction,
  TransactionRepository,
  TransactionType,
} from "../../domain/transaction";

export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  moneySourceId: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  description: string;
}

export interface CreateTransactionDeps {
  transactionRepository: TransactionRepository;
  moneySourceRepository: MoneySourceRepository;
  categoryRepository: CategoryRepository;
  // Inyectable para tests; en producción usa la zona horaria de Argentina (FR-044).
  today: () => string;
}

// FR-043: hasta 2 decimales; si llega con más precisión, se redondea (mitad hacia arriba),
// nunca se rechaza el guardado por ese motivo.
function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function createTransaction(
  deps: CreateTransactionDeps,
  input: CreateTransactionInput,
): Promise<Transaction> {
  // FR-017/FR-024 (AC): monto numérico mayor a cero, sin límite superior.
  if (!(input.amount > 0)) {
    throw new AppError(400, "VALIDATION_ERROR", "El monto debe ser mayor a cero", "amount");
  }

  // FR-044: no se permite una fecha posterior a hoy.
  if (input.date > deps.today()) {
    throw new AppError(400, "VALIDATION_ERROR", "La fecha no puede ser futura", "date");
  }

  const moneySource = await deps.moneySourceRepository.findByIdForUser(
    input.moneySourceId,
    input.userId,
  );
  if (!moneySource) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "La fuente de dinero no existe",
      "moneySourceId",
    );
  }

  const category = await deps.categoryRepository.findByIdForUser(
    input.categoryId,
    input.userId,
  );
  if (!category) {
    throw new AppError(400, "VALIDATION_ERROR", "La categoría no existe", "categoryId");
  }

  const amount = roundToTwoDecimals(input.amount);
  // FR-052: un ingreso suma, un egreso resta — sin validar fondos disponibles (Edge Case,
  // el monto de la fuente puede quedar negativo).
  const delta = input.type === "income" ? amount : -amount;

  const transaction = await deps.transactionRepository.create({
    userId: input.userId,
    type: input.type,
    amount,
    currency: input.currency,
    moneySourceId: input.moneySourceId,
    categoryId: input.categoryId,
    date: input.date,
    description: input.description,
  });

  try {
    await deps.moneySourceRepository.adjustAmount(input.moneySourceId, input.currency, delta);
  } catch (err) {
    // Rollback de compensación (research.md §16): sin replica set no hay transacción de
    // Mongo que revierta ambas escrituras sola. Si el ajuste del monto falla, se borra la
    // transacción recién creada para no dejar datos financieros inconsistentes (Principio
    // III). Si el propio rollback fallara, se deja constancia y se prioriza informar el
    // error original al usuario.
    try {
      await deps.transactionRepository.delete(transaction.id);
    } catch (rollbackErr) {
      // eslint-disable-next-line no-console
      console.error(
        `No se pudo revertir la transacción ${transaction.id} tras un fallo de recálculo de saldo; requiere reconciliación manual.`,
        rollbackErr,
      );
    }
    throw err;
  }

  return transaction;
}
