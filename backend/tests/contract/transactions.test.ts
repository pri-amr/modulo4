import request from "supertest";
import { createApp } from "@/app";
import { createTransactionRoutes } from "@/modules/transactions/interface/transactionRoutes";
import type { TransactionRepository } from "@/modules/transactions/domain/transaction";
import type { MoneySourceRepository } from "@/modules/money-sources/domain/moneySource";
import type { CategoryRepository } from "@/modules/categories/domain/category";
import { signSessionToken } from "@/shared/auth/sessionToken";
import { SESSION_COOKIE_NAME } from "@/shared/http/sessionCookie";

const SESSION_SECRET = "test-secret";
const USER_ID = "user-1";

function buildApp() {
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
      userId: USER_ID,
      name: "Lemon",
      virtual: true,
      amountARS: 1000,
      amountUSD: 0,
    }),
    adjustAmount: jest.fn().mockResolvedValue(undefined),
  };

  const categoryRepository: CategoryRepository = {
    findByIdForUser: jest.fn().mockResolvedValue({ id: "category-1", userId: USER_ID, name: "Comida" }),
  };

  const app = createApp({
    transactions: createTransactionRoutes({
      sessionSecret: SESSION_SECRET,
      transactionRepository,
      moneySourceRepository,
      categoryRepository,
    }),
  });

  return { app, transactionRepository, moneySourceRepository, categoryRepository };
}

function sessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=${signSessionToken(USER_ID, SESSION_SECRET)}`;
}

const validBody = {
  type: "expense",
  amount: 200,
  currency: "ARS",
  moneySourceId: "source-1",
  categoryId: "category-1",
  date: "2020-01-01",
  description: "Almuerzo",
};

describe("POST /api/v1/transactions", () => {
  it("returns 201 and the created transaction for a valid request (FR-016/FR-017)", async () => {
    const { app } = buildApp();

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", sessionCookie())
      .send(validBody);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: "tx-1", amount: 200, type: "expense" });
  });

  it("returns 401 without a session cookie", async () => {
    const { app } = buildApp();

    const response = await request(app).post("/api/v1/transactions").send(validBody);

    expect(response.status).toBe(401);
  });

  it("returns 400 with the failing field when a required field is missing (FR-017)", async () => {
    const { app } = buildApp();
    const { description, ...bodyWithoutDescription } = validBody;
    void description;

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", sessionCookie())
      .send(bodyWithoutDescription);

    expect(response.status).toBe(400);
    expect(response.body.error.field).toBe("description");
  });

  it("returns 400 when the amount is zero or negative (FR-017)", async () => {
    const { app } = buildApp();

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", sessionCookie())
      .send({ ...validBody, amount: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error.field).toBe("amount");
  });

  it("returns 400 for a future date (FR-044)", async () => {
    const { app } = buildApp();
    const farFuture = "2999-01-01";

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", sessionCookie())
      .send({ ...validBody, date: farFuture });

    expect(response.status).toBe(400);
    expect(response.body.error.field).toBe("date");
  });

  it("returns 400 when the money source does not exist or belongs to another user (FR-017)", async () => {
    const { app, moneySourceRepository } = buildApp();
    (moneySourceRepository.findByIdForUser as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", sessionCookie())
      .send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.error.field).toBe("moneySourceId");
  });

  it("rejects an unexpected field per the strict schema (FR-048)", async () => {
    const { app } = buildApp();

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", sessionCookie())
      .send({ ...validBody, unexpectedField: "nope" });

    expect(response.status).toBe(400);
  });
});
