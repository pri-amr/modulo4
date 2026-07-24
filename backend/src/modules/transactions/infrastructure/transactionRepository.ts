import mongoose, { Schema } from "mongoose";
import type { Currency } from "../../../shared/domain/currency";
import type {
  CreateTransactionRecord,
  Transaction,
  TransactionRepository,
  TransactionType,
} from "../domain/transaction";

export interface TransactionDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: mongoose.Types.Decimal128;
  currency: Currency;
  moneySourceId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  date: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    type: { type: String, required: true, enum: ["income", "expense"] },
    amount: { type: Schema.Types.Decimal128, required: true },
    currency: { type: String, required: true, enum: ["ARS", "USD"] },
    moneySourceId: { type: Schema.Types.ObjectId, required: true, ref: "MoneySource" },
    categoryId: { type: Schema.Types.ObjectId, required: true, ref: "Category" },
    // Fecha de la transacción (YYYY-MM-DD), no la fecha/hora de creación del registro.
    date: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

// FR-023/FR-024: filtros por período y orden por defecto (fecha desc, createdAt desc).
transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });
// Soporta el recálculo de saldo por fuente+moneda (research.md/data-model "Saldo").
transactionSchema.index({ userId: 1, moneySourceId: 1, currency: 1 });

export const TransactionModel =
  (mongoose.models.Transaction as mongoose.Model<TransactionDocument>) ||
  mongoose.model<TransactionDocument>("Transaction", transactionSchema, "transactions");

function toDomain(doc: TransactionDocument): Transaction {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    amount: Number(doc.amount.toString()),
    currency: doc.currency,
    moneySourceId: doc.moneySourceId.toString(),
    categoryId: doc.categoryId.toString(),
    date: doc.date,
    description: doc.description,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoTransactionRepository implements TransactionRepository {
  async create(record: CreateTransactionRecord): Promise<Transaction> {
    const doc = await TransactionModel.create({
      userId: record.userId,
      type: record.type,
      amount: mongoose.Types.Decimal128.fromString(record.amount.toFixed(2)),
      currency: record.currency,
      moneySourceId: record.moneySourceId,
      categoryId: record.categoryId,
      date: record.date,
      description: record.description,
    });

    return toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await TransactionModel.deleteOne({ _id: id });
  }
}
