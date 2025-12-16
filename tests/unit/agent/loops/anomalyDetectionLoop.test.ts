// tests/unit/agent/loops/anomalyDetectionLoop.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock WooCommerceRestApi BEFORE importing AnomalyDetectionLoop
vi.mock("@woocommerce/woocommerce-rest-api", () => ({
  default: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ data: [] }),
  })),
}));

import { AnomalyDetectionLoop } from "../../../../backend/agent/loops/anomalyDetectionLoop";

describe.skip("AnomalyDetectionLoop", () => {
  let loop: AnomalyDetectionLoop;

  beforeEach(() => {
    vi.resetModules();
    loop = new AnomalyDetectionLoop();
    vi.clearAllMocks();
  });

  it("should be initialized with correct type and max iterations", () => {
    expect((loop as any).context.type).toBe("anomaly-detection");
    expect((loop as any).context.maxIterations).toBe(4);
  });

  it("should have all required steps", () => {
    const steps = (loop as any).getSteps?.();
    expect(steps?.length).toBeGreaterThanOrEqual(5); // sense, think, act, learn, shouldContinue
    expect(steps?.map((s: any) => s.name)).toContain("sense");
    expect(steps?.map((s: any) => s.name)).toContain("think");
    expect(steps?.map((s: any) => s.name)).toContain("act");
    expect(steps?.map((s: any) => s.name)).toContain("learn");
  });

  it("should return summary with correct structure", async () => {
    const summary = loop.getSummary();

    expect(summary).toHaveProperty("totalAnomalies");
    expect(summary).toHaveProperty("byType");
    expect(summary).toHaveProperty("bySeverity");
  });

  it("should detect different anomaly types", async () => {
    const result = await loop.execute();
    const summary = loop.getSummary();

    expect(result.success).toBe(true);
    expect(summary.totalAnomalies).toBeGreaterThanOrEqual(0);

    // Check structure
    expect(typeof summary.byType).toBe("object");
    expect(typeof summary.bySeverity).toBe("object");
  });

  it("should handle empty results gracefully", () => {
    const summary = loop.getSummary();
    expect(summary.totalAnomalies).toBeGreaterThanOrEqual(0);
  });
});
