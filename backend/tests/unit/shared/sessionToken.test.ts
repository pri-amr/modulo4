import jwt from "jsonwebtoken";
import {
  signSessionToken,
  verifySessionToken,
  SESSION_DURATION_SECONDS,
} from "@/shared/auth/sessionToken";

const SECRET = "test-secret";

describe("sessionToken", () => {
  it("signs a token that verifies back to the same userId", () => {
    const token = signSessionToken("user-123", SECRET);

    const payload = verifySessionToken(token, SECRET);

    expect(payload.userId).toBe("user-123");
  });

  it("expires 1 day after issuance (FR-037)", () => {
    const token = signSessionToken("user-123", SECRET);
    const decoded = jwt.decode(token) as { iat: number; exp: number };

    expect(decoded.exp - decoded.iat).toBe(SESSION_DURATION_SECONDS);
  });

  it("throws when the token is expired", () => {
    const expiredToken = jwt.sign(
      { userId: "user-123", exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET,
    );

    expect(() => verifySessionToken(expiredToken, SECRET)).toThrow();
  });

  it("throws when the token was signed with a different secret", () => {
    const token = signSessionToken("user-123", SECRET);

    expect(() => verifySessionToken(token, "wrong-secret")).toThrow();
  });
});
