import type { Response } from "express";
import { SESSION_DURATION_SECONDS } from "../auth/sessionToken";

export const SESSION_COOKIE_NAME = "session";

// FR-046: sameSite=strict es la única protección CSRF exigida (sin token adicional).
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
};

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DURATION_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, COOKIE_OPTIONS);
}
