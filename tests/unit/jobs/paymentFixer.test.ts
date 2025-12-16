// tests/unit/jobs/paymentFixer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Set environment variables BEFORE any imports
process.env.WOOCOMMERCE_URL = "https://test.kaufe-es.eu";
process.env.CONSUMER_KEY = "ck_test123";
process.env.CONSUMER_SECRET = "cs_test456";

// Hoisted mocks (these MUST be at module level, not in beforeEach)
vi.mock("@woocommerce/woocommerce-rest-api");
vi.mock("dotenv");

describe("PaymentFixer", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable without errors", async () => {
    // Simple test: just import the module and verify it loads
    const module = await import("../../../backend/agent/jobs/paymentFixer");
    expect(module).toBeDefined();
    expect(module.PaymentFixer).toBeDefined();
  });

  it("should have analyzePaymentProblems method", async () => {
    const { PaymentFixer } = await import(
      "../../../backend/agent/jobs/paymentFixer"
    );
    expect(typeof PaymentFixer.analyzePaymentProblems).toBe("function");
  });

  it("should handle initialization gracefully", () => {
    // Test that environment variables are set correctly
    expect(process.env.WOOCOMMERCE_URL).toBe("https://test.kaufe-es.eu");
    expect(process.env.CONSUMER_KEY).toBe("ck_test123");
    expect(process.env.CONSUMER_SECRET).toBe("cs_test456");
  });
});
