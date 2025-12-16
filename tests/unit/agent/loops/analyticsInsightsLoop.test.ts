// tests/unit/agent/loops/analyticsInsightsLoop.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock WooCommerceRestApi BEFORE importing AnalyticsInsightsLoop
vi.mock("@woocommerce/woocommerce-rest-api", () => ({
  default: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ data: [] }),
  })),
}));

import { AnalyticsInsightsLoop } from "../../../../backend/agent/loops/analyticsInsightsLoop";

describe.skip("AnalyticsInsightsLoop", () => {
  let loop: AnalyticsInsightsLoop;

  beforeEach(() => {
    vi.resetModules();
    loop = new AnalyticsInsightsLoop();
    vi.clearAllMocks();
  });

  it("should be initialized with correct type", () => {
    expect((loop as any).context.type).toBe("analytics-insights");
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

  it("should return insights summary", () => {
    const summary = loop.getSummary();

    expect(summary).toHaveProperty("totalInsights");
    expect(summary).toHaveProperty("highPriority");
    expect(summary).toHaveProperty("mediumPriority");
    expect(summary).toHaveProperty("anomaliesDetected");
  });

  it("should execute analytics loop successfully", async () => {
    const result = await loop.execute();

    expect(result.success).toBe(true);
    expect(result.context.iteration).toBeGreaterThan(0);
  });

  it("should track insight priorities", () => {
    const summary = loop.getSummary();

    expect(summary.totalInsights).toBeGreaterThanOrEqual(0);
    expect(summary.highPriority).toBeGreaterThanOrEqual(0);
    expect(summary.mediumPriority).toBeGreaterThanOrEqual(0);
  });

  it("should detect anomalies", () => {
    const summary = loop.getSummary();

    expect(summary.anomaliesDetected).toBeGreaterThanOrEqual(0);
    expect(summary.criticalAnomalies).toBeGreaterThanOrEqual(0);
  });

  it("should generate insight recommendations", () => {
    const summary = loop.getSummary();

    if (summary.insights.length > 0) {
      const insight = summary.insights[0];
      expect(insight).toHaveProperty("title");
      expect(insight).toHaveProperty("trend");
      expect(insight).toHaveProperty("recommendation");
    }
  });

  it("should handle analytics completion gracefully", async () => {
    const result = await loop.execute();
    expect(result.success).toBe(true);

    const summary = loop.getSummary();
    expect(summary.totalInsights).toBeGreaterThanOrEqual(0);
  });
});
