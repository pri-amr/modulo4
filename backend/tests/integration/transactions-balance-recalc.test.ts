import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createTransaction } from "@/modules/transactions/application/commands/createTransaction";
import { MongoTransactionRepository } from "@/modules/transactions/infrastructure/transactionRepository";
import {
  MongoMoneySourceRepository,
  MoneySourceModel,
} from "@/modules/money-sources/infrastructure/moneySourceRepository";
import { CategoryModel } from "@/modules/categories/infrastructure/categoryRepository";
import { todayInArgentina } from "@/shared/domain/argentinaDate";

// FR-052: verifica el recálculo contra un Mongo real (no mockeado) — en particular que el
// `$inc` sobre un campo Decimal128 se comporta como se espera, algo que un test unitario con
// repos mockeados no puede probar. No requiere replica set (research.md §16).
describe("CreateTransaction — recálculo de saldo (integración)", () => {
  let mongod: MongoMemoryServer;
  const userId = new mongoose.Types.ObjectId().toString();
  const categoryId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    // launchTimeout ampliado: en este entorno Windows el arranque en frío de mongod (primer
    // uso, antivirus escaneando el binario) supera el default de 10s de la librería.
    mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
    await mongoose.connect(mongod.getUri());
  }, 90_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await MoneySourceModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await mongoose.connection.collection("transactions").deleteMany({});
    await CategoryModel.create({ _id: categoryId, userId, name: "Comida" });
  });

  function deps() {
    return {
      transactionRepository: new MongoTransactionRepository(),
      moneySourceRepository: new MongoMoneySourceRepository(),
      categoryRepository: {
        findByIdForUser: async (id: string, uid: string) => {
          const doc = await CategoryModel.findOne({ _id: id, userId: uid });
          return doc ? { id: doc._id.toString(), userId: doc.userId.toString(), name: doc.name } : null;
        },
      },
      today: todayInArgentina,
    };
  }

  it("reduces amountARS by the exact expense amount, leaving amountUSD untouched", async () => {
    const source = await MoneySourceModel.create({
      userId,
      name: "Lemon",
      virtual: true,
      amountARS: mongoose.Types.Decimal128.fromString("1000.00"),
      amountUSD: mongoose.Types.Decimal128.fromString("0.00"),
    });

    await createTransaction(deps(), {
      userId,
      type: "expense",
      amount: 200,
      currency: "ARS",
      moneySourceId: source._id.toString(),
      categoryId,
      date: "2020-01-01",
      description: "Almuerzo",
    });

    const updated = await MoneySourceModel.findById(source._id);
    expect(Number(updated!.amountARS.toString())).toBe(800);
    expect(Number(updated!.amountUSD.toString())).toBe(0);
  });

  it("increases amountUSD by the exact income amount", async () => {
    const source = await MoneySourceModel.create({
      userId,
      name: "Brubank",
      virtual: false,
      amountARS: mongoose.Types.Decimal128.fromString("0.00"),
      amountUSD: mongoose.Types.Decimal128.fromString("50.00"),
    });

    await createTransaction(deps(), {
      userId,
      type: "income",
      amount: 25.5,
      currency: "USD",
      moneySourceId: source._id.toString(),
      categoryId,
      date: "2020-01-01",
      description: "Freelance",
    });

    const updated = await MoneySourceModel.findById(source._id);
    expect(Number(updated!.amountUSD.toString())).toBe(75.5);
  });

  it("allows the amount to go negative without blocking the write (Edge Case, clarificación 2026-07-24)", async () => {
    const source = await MoneySourceModel.create({
      userId,
      name: "Lemon",
      virtual: true,
      amountARS: mongoose.Types.Decimal128.fromString("100.00"),
      amountUSD: mongoose.Types.Decimal128.fromString("0.00"),
    });

    await createTransaction(deps(), {
      userId,
      type: "expense",
      amount: 500,
      currency: "ARS",
      moneySourceId: source._id.toString(),
      categoryId,
      date: "2020-01-01",
      description: "Compra grande",
    });

    const updated = await MoneySourceModel.findById(source._id);
    expect(Number(updated!.amountARS.toString())).toBe(-400);
  });

  it("accumulates correctly across several transactions", async () => {
    const source = await MoneySourceModel.create({
      userId,
      name: "Lemon",
      virtual: true,
      amountARS: mongoose.Types.Decimal128.fromString("0.00"),
      amountUSD: mongoose.Types.Decimal128.fromString("0.00"),
    });

    const commonInput = {
      userId,
      currency: "ARS" as const,
      moneySourceId: source._id.toString(),
      categoryId,
      date: "2020-01-01",
    };

    await createTransaction(deps(), { ...commonInput, type: "income", amount: 1000, description: "Sueldo" });
    await createTransaction(deps(), { ...commonInput, type: "expense", amount: 300, description: "Alquiler" });
    await createTransaction(deps(), { ...commonInput, type: "expense", amount: 150.25, description: "Super" });

    const updated = await MoneySourceModel.findById(source._id);
    expect(Number(updated!.amountARS.toString())).toBe(549.75);
  });
});
