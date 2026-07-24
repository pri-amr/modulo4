import type { NextFunction, Request, Response } from "express";
import { verifySessionToken } from "../auth/sessionToken";
import { SESSION_COOKIE_NAME } from "./sessionCookie";
import { AppError } from "./errors";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireSession(sessionSecret: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
      next(new AppError(401, "UNAUTHENTICATED", "No active session"));
      return;
    }

    try {
      const { userId } = verifySessionToken(token, sessionSecret);
      req.userId = userId;
      next();
    } catch {
      next(new AppError(401, "UNAUTHENTICATED", "Invalid or expired session"));
    }
  };
}
