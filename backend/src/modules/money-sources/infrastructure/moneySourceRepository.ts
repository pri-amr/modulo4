import mongoose, { Schema } from "mongoose";
import type { Currency } from "../../../shared/domain/currency";
import type { MoneySource, MoneySourceRepository } from "../domain/moneySource";

export interface MoneySourceDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  virtual: boolean;
  amountARS: mongoose.Types.Decimal128;
  amountUSD: mongoose.Types.Decimal128;
  createdAt: Date;
}

const moneySourceSchema = new Schema<MoneySourceDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  name: { type: String, required: true, maxlength: 60 },
  virtual: { type: Boolean, required: true },
  amountARS: { type: Schema.Types.Decimal128, required: true },
  amountUSD: { type: Schema.Types.Decimal128, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

// FR-011: nombre único (case-sensitive exacto) por cuenta.
moneySourceSchema.index({ userId: 1, name: 1 }, { unique: true });

export const MoneySourceModel =
  (mongoose.models.MoneySource as mongoose.Model<MoneySourceDocument>) ||
  mongoose.model<MoneySourceDocument>("MoneySource", moneySourceSchema, "money_sources");

function toDomain(doc: MoneySourceDocument): MoneySource {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    virtual: doc.virtual,
    amountARS: Number(doc.amountARS.toString()),
    amountUSD: Number(doc.amountUSD.toString()),
  };
}

export class MongoMoneySourceRepository implements MoneySourceRepository {
  async findByIdForUser(id: string, userId: string): Promise<MoneySource | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await MoneySourceModel.findOne({ _id: id, userId });
    return doc ? toDomain(doc) : null;
  }

  // FR-052: incrementa/decrementa el campo de la moneda correspondiente con un `$inc`
  // atómico de un solo documento (research.md §16), en vez de leer+recalcular+sobrescribir,
  // para que sea seguro ante escrituras concurrentes sobre la misma fuente.
  async adjustAmount(id: string, currency: Currency, delta: number): Promise<void> {
    const field = currency === "ARS" ? "amountARS" : "amountUSD";
    await MoneySourceModel.updateOne(
      { _id: id },
      { $inc: { [field]: mongoose.Types.Decimal128.fromString(delta.toFixed(2)) } },
    );
  }
}
