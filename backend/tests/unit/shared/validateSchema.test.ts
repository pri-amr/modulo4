import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import { validateSchema } from "@/shared/http/validateSchema";
import { AppError } from "@/shared/http/errors";

function mockReqRes(body: unknown) {
  const req = { body } as Request;
  const res = {} as Response;
  const next = jest.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("validateSchema", () => {
  const schema = z.object({
    amount: z.number().positive(),
    description: z.string(),
  });

  it("calls next() and replaces req.body with the parsed value when valid", () => {
    const { req, res, next } = mockReqRes({ amount: 10, description: "coffee" });

    validateSchema(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ amount: 10, description: "coffee" });
  });

  it("calls next(AppError) with 400 and the invalid field path when the body doesn't match", () => {
    const { req, res, next } = mockReqRes({ amount: -5, description: "coffee" });

    validateSchema(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errorArg = (next as jest.Mock).mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(AppError);
    expect(errorArg.statusCode).toBe(400);
    expect(errorArg.field).toBe("amount");
  });

  it("rejects an unexpected extra field (strict shape, FR-048)", () => {
    const { req, res, next } = mockReqRes({
      amount: 10,
      description: "coffee",
      unexpected: { nested: true },
    });

    validateSchema(schema)(req, res, next);

    const errorArg = (next as jest.Mock).mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(AppError);
    expect(errorArg.statusCode).toBe(400);
  });
});
