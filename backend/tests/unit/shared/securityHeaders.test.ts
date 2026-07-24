import request from "supertest";
import { createApp } from "@/app";

describe("security headers (FR-047)", () => {
  it("includes the base set of HTTP security headers on every response", async () => {
    const app = createApp();

    const response = await request(app).get("/api/v1/health");

    expect(response.headers).toHaveProperty("content-security-policy");
    expect(response.headers).toHaveProperty("x-content-type-options", "nosniff");
    expect(response.headers).toHaveProperty("x-frame-options");
  });
});
