import { Router } from "express";
import { z } from "zod";
import { validateSchema } from "../../../shared/http/validateSchema";
import { requireSession } from "../../../shared/http/requireSession";
import { todayInArgentina } from "../../../shared/domain/argentinaDate";
import { createTransaction } from "../application/commands/createTransaction";
import type { TransactionRepository } from "../domain/transaction";
import type { MoneySourceRepository } from "../../money-sources/domain/moneySource";
import type { CategoryRepository } from "../../categories/domain/category";

const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number(),
  currency: z.enum(["ARS", "USD"]),
  moneySourceId: z.string().min(1),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  description: z.string().min(1),
});

export interface TransactionRoutesDeps {
  sessionSecret: string;
  transactionRepository: TransactionRepository;
  moneySourceRepository: MoneySourceRepository;
  categoryRepository: CategoryRepository;
}

// FR-016/FR-017/FR-043/FR-044/FR-052: solo POST por ahora (alta de transacción); PUT/DELETE
// se agregan junto con UpdateTransaction/DeleteTransaction (T094/T095).
export function createTransactionRoutes(deps: TransactionRoutesDeps): Router {
  const router = Router();

  router.post(
    "/",
    requireSession(deps.sessionSecret),
    validateSchema(createTransactionSchema),
    async (req, res, next) => {
      try {
        const transaction = await createTransaction(
          {
            transactionRepository: deps.transactionRepository,
            moneySourceRepository: deps.moneySourceRepository,
            categoryRepository: deps.categoryRepository,
            today: todayInArgentina,
          },
          { ...req.body, userId: req.userId as string },
        );
        res.status(201).json(transaction);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
