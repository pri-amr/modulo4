import request from "supertest";
import { createApp } from "@/app";

const FRONTEND_ORIGIN = "http://localhost:3000";

describe("CORS", () => {
  it("allows the configured frontend origin, with credentials, on a preflight request", async () => {
    const app = createApp({}, { allowedOrigin: FRONTEND_ORIGIN });

    const response = await request(app)
      .options("/api/v1/health")
      .set("Origin", FRONTEND_ORIGIN)
      .set("Access-Control-Request-Method", "GET");

    expect(response.headers["access-control-allow-origin"]).toBe(FRONTEND_ORIGIN);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("reflects the allowed origin on a normal request too", async () => {
    const app = createApp({}, { allowedOrigin: FRONTEND_ORIGIN });

    const response = await request(app).get("/api/v1/health").set("Origin", FRONTEND_ORIGIN);

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(FRONTEND_ORIGIN);
  });

  it("does not allow a different origin than the configured one", async () => {
    const app = createApp({}, { allowedOrigin: FRONTEND_ORIGIN });

    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://evil.example.com");

    expect(response.headers["access-control-allow-origin"]).not.toBe("http://evil.example.com");
  });
});
