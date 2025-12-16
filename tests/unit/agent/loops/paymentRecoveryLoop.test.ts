// tests/unit/agent/loops/paymentRecoveryLoop.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock WooCommerceRestApi BEFORE importing PaymentRecoveryLoop
vi.mock("@woocommerce/woocommerce-rest-api", () => ({
  default: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ data: [] }),
  })),
}));

import { PaymentRecoveryLoop } from "../../../../backend/agent/loops/paymentRecoveryLoop";

describe.skip("PaymentRecoveryLoop", () => {
  let loop: PaymentRecoveryLoop;

  beforeEach(() => {
    vi.resetModules();
    loop = new PaymentRecoveryLoop();
    vi.clearAllMocks();
  });

  it("should be initialized with correct type", () => {
    expect((loop as any).context.type).toBe("payment-recovery");
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

  it("should return recovery summary", () => {
    const summary = loop.getSummary();

    expect(summary).toHaveProperty("totalAttempts");
    expect(summary).toHaveProperty("successCount");
    expect(summary).toHaveProperty("successRate");
    expect(summary).toHaveProperty("totalRecovered");
    expect(summary).toHaveProperty("byStrategy");
  });

  it("should execute recovery loop successfully", async () => {
    const result = await loop.execute();

    expect(result.success).toBe(true);
    expect(result.context.iteration).toBeGreaterThan(0);
  });

  it("should track recovery metrics", () => {
    const summary = loop.getSummary();

    expect(typeof summary.successRate).toBe("string");
    expect(typeof summary.totalRecovered).toBe("string");
    expect(typeof summary.byStrategy).toBe("object");
  });

  it("should handle no recoverable orders gracefully", async () => {
    const result = await loop.execute();
    expect(result.success).toBe(true);

    const summary = loop.getSummary();
    expect(summary.totalAttempts).toBeGreaterThanOrEqual(0);
  });
});
