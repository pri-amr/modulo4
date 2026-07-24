import type { NextFunction, Request, Response } from "express";
import { AppError, toErrorResponseBody } from "./errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(toErrorResponseBody(err));
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Unexpected server error", field: null },
  });
}
