import express, { type Express, type Router } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
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

export interface AppOptions {
  // Origen del frontend permitido por CORS. Reutiliza el mismo valor que WEBAUTHN_ORIGIN
  // (research.md §1): ambos representan "dónde vive el frontend/RP". Si se omite (tests),
  // refleja el origen de la request en vez de restringir — no usar así en producción.
  allowedOrigin?: string;
}

export function createApp(routes: AppRoutes = {}, options: AppOptions = {}): Express {
  const app = express();

  // FR-047: set base de cabeceras de seguridad HTTP en toda respuesta.
  app.use(helmet());
  // Frontend y backend son proyectos separados en orígenes distintos (AGENTS.md); sin esto
  // el navegador bloquea toda petición cross-origin del frontend antes de llegar a Express.
  // credentials:true es necesario porque handleRequest.ts manda la cookie de sesión
  // (withCredentials) — exige un origin explícito, "*" no es válido junto con credentials.
  app.use(cors({ origin: options.allowedOrigin ?? true, credentials: true }));
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
