import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { corsMiddleware } from "./cors.js";

describe("gate CORS", () => {
  it.each(["https://sadhutech.com", "https://www.sadhutech.com", "http://localhost:3000"])("allows health checks and preflights from %s", async (origin) => {
    const app = Fastify();
    app.addHook("onRequest", corsMiddleware);
    app.get("/health", async () => ({ status: "ok" }));
    try {
      const health = await app.inject({ url: "/health", headers: { origin } });
      expect(health.headers["access-control-allow-origin"]).toBe(origin);
      expect(health.headers.vary).toContain("Origin");
      const preflight = await app.inject({ method: "OPTIONS", url: "/v1/analyze", headers: { origin, "access-control-request-method": "POST" } });
      expect(preflight.statusCode).toBe(204);
      expect(preflight.headers["access-control-allow-origin"]).toBe(origin);
      expect(preflight.headers["access-control-allow-methods"]).toContain("POST");
    } finally {
      await app.close();
    }
  });

  it.each(["https://sadhutech.com.example", "https://untrusted.example", "http://www.sadhutech.com"])("does not authorize %s", async (origin) => {
    const app = Fastify();
    app.addHook("onRequest", corsMiddleware);
    app.get("/health", async () => ({ status: "ok" }));
    try {
      const response = await app.inject({ url: "/health", headers: { origin } });
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});