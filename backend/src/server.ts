import { loadEnv } from "./shared/config/env";
import { connectToDatabase } from "./shared/infrastructure/db";
import { createApp } from "./app";

async function main(): Promise<void> {
  const env = loadEnv();
  await connectToDatabase(env.MONGODB_URI);

  const app = createApp();
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
