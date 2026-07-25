import { loadEnv } from "./shared/config/env";
import { connectToDatabase } from "./shared/infrastructure/db";
import { createApp } from "./app";
import { createTransactionRoutes } from "./modules/transactions/interface/transactionRoutes";
import { MongoTransactionRepository } from "./modules/transactions/infrastructure/transactionRepository";
import { MongoMoneySourceRepository } from "./modules/money-sources/infrastructure/moneySourceRepository";
import { MongoCategoryRepository } from "./modules/categories/infrastructure/categoryRepository";

async function main(): Promise<void> {
  const env = loadEnv();
  await connectToDatabase(env.MONGODB_URI);

  const app = createApp(
    {
      transactions: createTransactionRoutes({
        sessionSecret: env.SESSION_JWT_SECRET,
        transactionRepository: new MongoTransactionRepository(),
        moneySourceRepository: new MongoMoneySourceRepository(),
        categoryRepository: new MongoCategoryRepository(),
      }),
    },
    { allowedOrigin: env.WEBAUTHN_ORIGIN },
  );
  app.listen(Number(env.PORT), () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port ${env.PORT}`);
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error);
  process.exit(1);
});
