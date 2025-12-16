// tests/unit/agent/loops/productOptimizationLoop.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock WooCommerceRestApi BEFORE importing ProductOptimizationLoop
vi.mock("@woocommerce/woocommerce-rest-api", () => ({
  default: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ data: [] }),
  })),
}));

import { ProductOptimizationLoop } from "../../../../backend/agent/loops/productOptimizationLoop";

describe.skip("ProductOptimizationLoop", () => {
  let loop: ProductOptimizationLoop;

  beforeEach(() => {
    vi.resetModules();
    loop = new ProductOptimizationLoop();
    vi.clearAllMocks();
  });

  it("should be initialized with correct type", () => {
    expect((loop as any).context.type).toBe("product-optimization");
    expect((loop as any).context.maxIterations).toBe(4);
  });

  it("should have all required steps", () => {
    const steps = (loop as any).getSteps?.();
    expect(steps?.length).toBeGreaterThanOrEqual(5);
    expect(steps?.map((s: any) => s.name)).toContain("sense");
    expect(steps?.map((s: any) => s.name)).toContain("think");
    expect(steps?.map((s: any) => s.name)).toContain("act");
    expect(steps?.map((s: any) => s.name)).toContain("learn");
  });

  it("should return summary with optimization data", () => {
    const summary = loop.getSummary();

    expect(summary).toHaveProperty("totalTests");
    expect(summary).toHaveProperty("winners");
    expect(summary).toHaveProperty("avgImprovement");
    expect(summary).toHaveProperty("topOpportunities");
  });

  it("should execute full optimization loop", async () => {
    const result = await loop.execute();

    expect(result.success).toBe(true);
    expect(result.context.iteration).toBeGreaterThan(0);

    const summary = loop.getSummary();
    expect(summary.totalTests).toBeGreaterThanOrEqual(0);
  });

  it("should track improvement metrics", () => {
    const summary = loop.getSummary();

    expect(summary.topOpportunities).toBeInstanceOf(Array);
    expect(typeof summary.avgImprovement).toBe("string");
  });

  it("should handle optimization completion gracefully", async () => {
    const result = await loop.execute();
    expect(result.success).toBe(true);
  });
});
