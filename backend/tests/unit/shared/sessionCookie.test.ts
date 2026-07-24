import type { Response } from "express";
import { setSessionCookie, clearSessionCookie, SESSION_COOKIE_NAME } from "@/shared/http/sessionCookie";

function mockRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

describe("sessionCookie", () => {
  it("sets the session cookie as httpOnly, secure and sameSite=strict (FR-046)", () => {
    const res = mockRes();

    setSessionCookie(res, "a-jwt-token");

    expect(res.cookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "a-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      }),
    );
  });

  it("clears the session cookie on logout (FR-041)", () => {
    const res = mockRes();

    clearSessionCookie(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: "strict" }),
    );
  });
});
