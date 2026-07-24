import jwt from "jsonwebtoken";

// FR-037: la sesión dura 1 día desde el inicio de sesión.
export const SESSION_DURATION_SECONDS = 60 * 60 * 24;

export interface SessionPayload {
  userId: string;
}

export function signSessionToken(userId: string, secret: string): string {
  return jwt.sign({ userId }, secret, { expiresIn: SESSION_DURATION_SECONDS });
}

export function verifySessionToken(token: string, secret: string): SessionPayload {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string" || !("userId" in decoded)) {
    throw new Error("Invalid session token payload");
  }
  return { userId: (decoded as jwt.JwtPayload & SessionPayload).userId };
}
