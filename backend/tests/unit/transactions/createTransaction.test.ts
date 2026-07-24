import { createTransaction } from "@/modules/transactions/application/commands/createTransaction";
import type { CreateTransactionDeps } from "@/modules/transactions/application/commands/createTransaction";
import type { TransactionRepository } from "@/modules/transactions/domain/transaction";
import type { MoneySourceRepository } from "@/modules/money-sources/domain/moneySource";
import type { CategoryRepository } from "@/modules/categories/domain/category";
import { AppError } from "@/shared/http/errors";

function buildDeps(overrides: Partial<CreateTransactionDeps> = {}): CreateTransactionDeps {
  const transactionRepository: TransactionRepository = {
    create: jest.fn().mockImplementation(async (record) => ({
      id: "tx-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...record,
    })),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const moneySourceRepository: MoneySourceRepository = {
    findByIdForUser: jest.fn().mockResolvedValue({
      id: "source-1",
      userId: "user-1",
      name: "Lemon",
      virtual: true,
      amountARS: 1000,
      amountUSD: 0,
    }),
    adjustAmount: jest.fn().mockResolvedValue(undefined),
  };

  const categoryRepository: CategoryRepository = {
    findByIdForUser: jest.fn().mockResolvedValue({
      id: "category-1",
      userId: "user-1",
      name: "Comida",
    }),
  };

  return {
    transactionRepository,
    moneySourceRepository,
    categoryRepository,
    today: () => "2026-07-24",
    ...overrides,
  };
}

const baseInput = {
  userId: "user-1",
  type: "expense" as const,
  amount: 200,
  currency: "ARS" as const,
  moneySourceId: "source-1",
  categoryId: "category-1",
  date: "2026-07-24",
  description: "Almuerzo",
};

describe("createTransaction", () => {
  it("creates the transaction and reduces the money source amount for an expense (FR-016/FR-052)", async () => {
    const deps = buildDeps();

    const result = await createTransaction(deps, baseInput);

    expect(result.id).toBe("tx-1");
    expect(deps.transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 200, type: "expense" }),
    );
    expect(deps.moneySourceRepository.adjustAmount).toHaveBeenCalledWith("source-1", "ARS", -200);
  });

  it("increases the money source amount for an income (FR-016/FR-052)", async () => {
    const deps = buildDeps();

    await createTransaction(deps, { ...baseInput, type: "income" });

    expect(deps.moneySourceRepository.adjustAmount).toHaveBeenCalledWith("source-1", "ARS", 200);
  });

  it("rounds the amount to 2 decimals, half up, before persisting (FR-043)", async () => {
    const deps = buildDeps();

    await createTransaction(deps, { ...baseInput, amount: 10.999 });

    expect(deps.transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 11 }),
    );
    expect(deps.moneySourceRepository.adjustAmount).toHaveBeenCalledWith("source-1", "ARS", -11);
  });

  it("rejects an amount of zero or negative (FR-017)", async () => {
    const deps = buildDeps();

    await expect(createTransaction(deps, { ...baseInput, amount: 0 })).rejects.toMatchObject({
      statusCode: 400,
      field: "amount",
    });
    await expect(createTransaction(deps, { ...baseInput, amount: -5 })).rejects.toBeInstanceOf(
      AppError,
    );
    expect(deps.transactionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a future date (FR-044)", async () => {
    const deps = buildDeps();

    await expect(
      createTransaction(deps, { ...baseInput, date: "2026-07-25" }),
    ).rejects.toMatchObject({ statusCode: 400, field: "date" });
    expect(deps.transactionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a money source that does not exist or does not belong to the user (FR-017)", async () => {
    const deps = buildDeps({
      moneySourceRepository: {
        findByIdForUser: jest.fn().mockResolvedValue(null),
        adjustAmount: jest.fn(),
      },
    });

    await expect(createTransaction(deps, baseInput)).rejects.toMatchObject({
      statusCode: 400,
      field: "moneySourceId",
    });
    expect(deps.transactionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a category that does not exist or does not belong to the user (FR-017)", async () => {
    const deps = buildDeps({
      categoryRepository: { findByIdForUser: jest.fn().mockResolvedValue(null) },
    });

    await expect(createTransaction(deps, baseInput)).rejects.toMatchObject({
      statusCode: 400,
      field: "categoryId",
    });
    expect(deps.transactionRepository.create).not.toHaveBeenCalled();
  });

  it("does not validate available funds: an expense larger than the current amount is still created (Edge Case, negative balance allowed)", async () => {
    const deps = buildDeps({
      moneySourceRepository: {
        findByIdForUser: jest.fn().mockResolvedValue({
          id: "source-1",
          userId: "user-1",
          name: "Lemon",
          virtual: true,
          amountARS: 100,
          amountUSD: 0,
        }),
        adjustAmount: jest.fn().mockResolvedValue(undefined),
      },
    });

    await createTransaction(deps, { ...baseInput, amount: 500 });

    expect(deps.moneySourceRepository.adjustAmount).toHaveBeenCalledWith("source-1", "ARS", -500);
  });

  it("rolls back (deletes) the created transaction if adjusting the money source amount fails (research.md §16)", async () => {
    const adjustAmount = jest.fn().mockRejectedValue(new Error("db unavailable"));
    const deps = buildDeps({
      moneySourceRepository: {
        findByIdForUser: jest.fn().mockResolvedValue({
          id: "source-1",
          userId: "user-1",
          name: "Lemon",
          virtual: true,
          amountARS: 1000,
          amountUSD: 0,
        }),
        adjustAmount,
      },
    });

    await expect(createTransaction(deps, baseInput)).rejects.toThrow("db unavailable");

    expect(deps.transactionRepository.create).toHaveBeenCalledTimes(1);
    expect(deps.transactionRepository.delete).toHaveBeenCalledWith("tx-1");
  });

  it("still propagates the original error even if the compensating rollback itself fails", async () => {
    const deps = buildDeps({
      moneySourceRepository: {
        findByIdForUser: jest.fn().mockResolvedValue({
          id: "source-1",
          userId: "user-1",
          name: "Lemon",
          virtual: true,
          amountARS: 1000,
          amountUSD: 0,
        }),
        adjustAmount: jest.fn().mockRejectedValue(new Error("adjust failed")),
      },
      transactionRepository: {
        create: jest.fn().mockResolvedValue({
          id: "tx-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        delete: jest.fn().mockRejectedValue(new Error("delete also failed")),
      },
    });

    await expect(createTransaction(deps, baseInput)).rejects.toThrow("adjust failed");
  });
});
