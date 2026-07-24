import express, { type Express, type Router } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorHandler } from "./shared/http/errorHandler";

export interface AppRoutes {
  auth?: Router;
  moneySources?: Router;
  categories?: Router;
  transactions?: Router;
  balances?: Router;
  charts?: Router;
  converter?: Router;
}

export function createApp(routes: AppRoutes = {}): Express {
  const app = express();

  // FR-047: set base de cabeceras de seguridad HTTP en toda respuesta.
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  if (routes.auth) app.use("/api/v1/auth", routes.auth);
  if (routes.moneySources) app.use("/api/v1/money-sources", routes.moneySources);
  if (routes.categories) app.use("/api/v1/categories", routes.categories);
  if (routes.transactions) app.use("/api/v1/transactions", routes.transactions);
  if (routes.balances) app.use("/api/v1/balances", routes.balances);
  if (routes.charts) app.use("/api/v1/charts", routes.charts);
  if (routes.converter) app.use("/api/v1/converter", routes.converter);

  app.use(errorHandler);

  return app;
}
