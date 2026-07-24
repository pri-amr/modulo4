import type { Currency } from "../../../shared/domain/currency";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  moneySourceId: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionRecord {
  userId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  moneySourceId: string;
  categoryId: string;
  date: string;
  description: string;
}

// Puerto del dominio: la capa de aplicación depende de esta interfaz, nunca del driver
// de persistencia concreto. La implementación Mongo vive en infrastructure/.
export interface TransactionRepository {
  create(record: CreateTransactionRecord, session?: unknown): Promise<Transaction>;
}
