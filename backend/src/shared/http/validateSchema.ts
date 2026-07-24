import type { NextFunction, Request, Response } from "express";
import { z, ZodError, type ZodSchema } from "zod";
import { AppError } from "./errors";

// FR-048: rechaza cualquier campo inesperado en el body/query, no solo forma/tipo
// incorrectos, por lo que todo ZodObject se fuerza a modo estricto acá — no depende de
// que cada comando recuerde llamar .strict() por su cuenta.
function toStrict(schema: ZodSchema): ZodSchema {
  return schema instanceof z.ZodObject ? schema.strict() : schema;
}

export function validateSchema(schema: ZodSchema) {
  const strictSchema = toStrict(schema);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = strictSchema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = (result.error as ZodError).issues[0];
      const field = firstIssue?.path.join(".") || null;
      next(new AppError(400, "VALIDATION_ERROR", firstIssue?.message ?? "Invalid input", field));
      return;
    }

    req.body = result.data;
    next();
  };
}
