import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import simpleHealthRoutes from "../backend/routes/app/api/health";

describe("Health Endpoint", () => {
  let server: any;

  beforeAll(async () => {
    server = Fastify({
      logger: false,
    });

    await server.register(simpleHealthRoutes, { prefix: "/api" });
    await server.listen({ port: 0 });
  });

  afterAll(async () => {
    await server.close();
  });

  it("should return health status at GET /api/health", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("memory");
    expect(body).toHaveProperty("services");

    // Verify memory structure
    expect(body.memory).toHaveProperty("used");
    expect(body.memory).toHaveProperty("total");
    expect(body.memory).toHaveProperty("unit");
    expect(body.memory.unit).toBe("MB");

    // Verify services structure
    expect(body.services).toHaveProperty("configFile");
    expect(body.services).toHaveProperty("backupDir");
  });

  it("should have status ok or warning", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    const body = JSON.parse(response.body);
    expect(["ok", "warning", "error"]).toContain(body.status);
  });

  it("should have valid timestamp ISO format", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    const body = JSON.parse(response.body);
    const timestamp = new Date(body.timestamp);
    expect(timestamp.toString()).not.toBe("Invalid Date");
  });

  it("should have uptime greater than 0", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    const body = JSON.parse(response.body);
    expect(body.uptime).toBeGreaterThan(0);
  });

  it("should have memory values in MB", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    const body = JSON.parse(response.body);
    expect(body.memory.used).toBeGreaterThan(0);
    expect(body.memory.total).toBeGreaterThan(0);
    expect(body.memory.used).toBeLessThanOrEqual(body.memory.total);
  });
});
