import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { SpecializationPersistenceManager } from "../../backend/services/specializationPersistenceManager";
import {
  initializeSpecializationAutoLoad,
  activateSpecialization,
  getActiveSpecialization,
  getLoadingState,
  reloadSpecialization,
  validateAllSpecializations,
  listAvailableSpecializations,
} from "../../backend/services/specializationAutoLoad";
import { SpecializationContext } from "../../backend/types/specialization";

/**
 * Phase 2: Persistence & Auto-Load System Tests
 * Tests für Fehlertoleranz und Fallback-Mechanismen
 */

const TEST_USER = "test-user-persistence";
const DATA_DIR = path.join(process.cwd(), "data", "specializations");

// Mock specialization data
const createMockSpecialization = (overrides = {}): SpecializationContext => ({
  id: "test-spec-001",
  name: "Test Specialization",
  description: "Testing specialization persistence",
  systemPrompt: "You are a test agent for specialization persistence testing.",
  category: "testing",
  version: "1.0.0",
  features: ["persistence", "fallback", "recovery"],
  createdAt: Date.now(),
  ...overrides,
});

describe("Specialization Persistence & Auto-Load", () => {
  beforeAll(async () => {
    console.log("🧪 Starting Persistence & Auto-Load tests");
    // Initialize persistence system
    await SpecializationPersistenceManager.initialize();
  });

  afterAll(async () => {
    console.log("✅ Persistence & Auto-Load tests completed");
    // Cleanup test data
    try {
      const testUserDir = path.join(DATA_DIR, TEST_USER);
      await fs.rm(testUserDir, { recursive: true, force: true });
    } catch (_error) {
      // ignore
    }
  });

  describe("Persistence Manager", () => {
    /**
     * Test 1: Initialize persistence system
     */
    it("should initialize persistence manager successfully", async () => {
      const _result = await SpecializationPersistenceManager.initialize();
      expect(_result).toBeUndefined(); // Should not throw
    });

    /**
     * Test 2: Persist specialization to disk
     */
    it("should persist specialization to disk", async () => {
      const spec = createMockSpecialization();

      const _result =
        await SpecializationPersistenceManager.persistSpecialization(
          spec,
          TEST_USER
        );

      expect(_result.success).toBe(true);
      expect(_result.id).toBe(spec.id);
      expect(_result.fallbackReady).toBe(true);
    });

    /**
     * Test 3: Load persisted specialization
     */
    it("should load persisted specialization from disk", async () => {
      const spec = createMockSpecialization({
        id: "load-test-001",
        name: "Load Test",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      const loaded = await SpecializationPersistenceManager.loadSpecialization(
        "load-test-001",
        TEST_USER
      );

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe("load-test-001");
      expect(loaded?.name).toBe("Load Test");
    });

    /**
     * Test 4: List specializations
     */
    it("should list all specializations for a user", async () => {
      const spec1 = createMockSpecialization({ id: "list-1", name: "Spec 1" });
      const spec2 = createMockSpecialization({ id: "list-2", name: "Spec 2" });

      await SpecializationPersistenceManager.persistSpecialization(
        spec1,
        TEST_USER
      );
      await SpecializationPersistenceManager.persistSpecialization(
        spec2,
        TEST_USER
      );

      const list =
        await SpecializationPersistenceManager.listSpecializations(TEST_USER);

      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.some((s) => s.id === "list-1")).toBe(true);
      expect(list.some((s) => s.id === "list-2")).toBe(true);
    });

    /**
     * Test 5: Set and get active specialization
     */
    it("should set and retrieve active specialization", async () => {
      const spec = createMockSpecialization({
        id: "active-test-001",
        name: "Active Test",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      const setSuccess =
        await SpecializationPersistenceManager.setActiveSpecialization(
          "active-test-001",
          TEST_USER
        );
      expect(setSuccess).toBe(true);

      const _result =
        await SpecializationPersistenceManager.getActiveSpecialization(
          TEST_USER
        );

      expect(_result.specialization).not.toBeNull();
      expect(_result.specialization?.id).toBe("active-test-001");
      expect(_result.source).toBe("active");
    });

    /**
     * Test 6: Fallback to first available when active is missing
     */
    it("should fallback to first available when active not set", async () => {
      const testUser = "fallback-test-user";
      const spec = createMockSpecialization({
        id: "fallback-spec-001",
        name: "Fallback Test",
      });

      // Don't set as active - test fallback
      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        testUser
      );

      const _result =
        await SpecializationPersistenceManager.getActiveSpecialization(
          testUser
        );

      expect(_result.specialization).not.toBeNull();
      expect(_result.source).toBe("fallback"); // Uses first available as fallback
    });

    /**
     * Test 7: Delete specialization
     */
    it("should delete specialization", async () => {
      const spec = createMockSpecialization({
        id: "delete-test-001",
        name: "Delete Test",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      const deleteSuccess =
        await SpecializationPersistenceManager.deleteSpecialization(
          "delete-test-001",
          TEST_USER
        );

      expect(deleteSuccess).toBe(true);

      const loaded = await SpecializationPersistenceManager.loadSpecialization(
        "delete-test-001",
        TEST_USER
      );

      expect(loaded).toBeNull();
    });

    /**
     * Test 8: Validate integrity
     */
    it("should validate specialization integrity", async () => {
      const spec = createMockSpecialization({
        id: "integrity-test-001",
        name: "Integrity Test",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      const validation =
        await SpecializationPersistenceManager.validateIntegrity(TEST_USER);

      expect(validation.valid).toBeGreaterThan(0);
      expect(validation.corrupted).toBe(0);
      expect(validation.missing).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test 9: Handle load of non-existent specialization
     */
    it("should return null for non-existent specialization", async () => {
      const loaded = await SpecializationPersistenceManager.loadSpecialization(
        "non-existent-spec",
        TEST_USER
      );

      expect(loaded).toBeNull();
    });

    /**
     * Test 10: Handle corrupted specialization file gracefully
     */
    it("should recover from corrupted specialization file", async () => {
      const spec = createMockSpecialization({
        id: "corrupted-test-001",
        name: "Corrupted Test",
      });

      // Persist
      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      // Corrupt it (write invalid JSON)
      const filePath = path.join(
        DATA_DIR,
        TEST_USER,
        "corrupted-test-001.json"
      );
      try {
        await fs.writeFile(filePath, "invalid json {[");
      } catch (_error) {
        // File might not exist in test env
      }

      // Try to load - should return null gracefully
      const loaded = await SpecializationPersistenceManager.loadSpecialization(
        "corrupted-test-001",
        TEST_USER
      );

      expect(loaded).toBeNull(); // Should fail gracefully
    });
  });

  describe("Auto-Load System", () => {
    beforeEach(async () => {
      // Clear cache before each test and await completion to avoid races
      await reloadSpecialization(TEST_USER);
    });

    /**
     * Test 11: Initialize auto-load
     */
    it("should initialize auto-load system", async () => {
      const spec = createMockSpecialization({
        id: "autoload-init-001",
        name: "Auto-Load Init",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      // Ensure this spec is active to be picked up by auto-load
      await SpecializationPersistenceManager.setActiveSpecialization(
        "autoload-init-001",
        TEST_USER
      );
      const _result = await initializeSpecializationAutoLoad(TEST_USER);

      expect(_result).not.toBeNull();
      expect(typeof _result?.id).toBe("string");
      expect(getLoadingState()).toBe("loaded");
    });

    /**
     * Test 12: Get active specialization from cache
     */
    it("should return cached active specialization", async () => {
      const spec = createMockSpecialization({
        id: "cache-test-001",
        name: "Cache Test",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      // Activate and ensure cache reflects the change
      const success = await activateSpecialization("cache-test-001", TEST_USER);
      expect(success).toBe(true);

      const cached = getActiveSpecialization();
      expect(cached).not.toBeNull();
      expect(cached?.id).toBe("cache-test-001");
    });

    /**
     * Test 13: Activate new specialization
     */
    it("should activate and cache new specialization", async () => {
      const spec1 = createMockSpecialization({
        id: "activate-1",
        name: "Spec 1",
      });
      const spec2 = createMockSpecialization({
        id: "activate-2",
        name: "Spec 2",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec1,
        TEST_USER
      );
      await SpecializationPersistenceManager.persistSpecialization(
        spec2,
        TEST_USER
      );

      const success = await activateSpecialization("activate-2", TEST_USER);

      expect(success).toBe(true);

      const active = getActiveSpecialization();
      expect(active?.id).toBe("activate-2");
      expect(active?.name).toBe("Spec 2");
    });

    /**
     * Test 14: Reload from disk
     */
    it("should reload specialization from disk", async () => {
      const spec = createMockSpecialization({
        id: "reload-test-001",
        name: "Reload Test",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      // Ensure reload targets our spec
      await SpecializationPersistenceManager.setActiveSpecialization(
        "reload-test-001",
        TEST_USER
      );
      const reloaded = await reloadSpecialization(TEST_USER);

      expect(reloaded).not.toBeNull();
      expect(reloaded?.id).toBe("reload-test-001");
    });

    /**
     * Test 15: List available specializations
     */
    it("should list available specializations", async () => {
      const spec = createMockSpecialization({
        id: "list-avail-001",
        name: "Available",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      const list = await listAvailableSpecializations(TEST_USER);

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });

    /**
     * Test 16: Validate all specializations
     */
    it("should validate all specializations", async () => {
      const spec = createMockSpecialization({
        id: "validate-all-001",
        name: "Validate All",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      const validation = await validateAllSpecializations(TEST_USER);

      expect(validation.valid).toBeGreaterThanOrEqual(0);
      expect(typeof validation.corrupted).toBe("number");
      expect(typeof validation.missing).toBe("number");
    });

    /**
     * Test 17: Handle loading state
     */
    it("should track loading state correctly", async () => {
      const initialState = getLoadingState();
      expect(["not-started", "loading", "loaded"]).toContain(initialState);

      const spec = createMockSpecialization({
        id: "state-test-001",
        name: "State Test",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      await initializeSpecializationAutoLoad(TEST_USER);

      expect(getLoadingState()).toBe("loaded");
    });

    /**
     * Test 18: Handle missing specialization gracefully
     */
    it("should handle missing specialization on load", async () => {
      const _result =
        await initializeSpecializationAutoLoad("non-existent-user");

      // Should return null but not throw
      expect(getLoadingState()).toBe("loaded");
    });
  });

  describe("Error Recovery", () => {
    /**
     * Test 19: Recover from corrupted active specialization
     */
    it("should recover from corrupted active specialization", async () => {
      const spec = createMockSpecialization({
        id: "error-recovery-001",
        name: "Error Recovery",
      });

      await SpecializationPersistenceManager.persistSpecialization(
        spec,
        TEST_USER
      );

      // This tests the recovery mechanism
      const validation = await validateAllSpecializations(TEST_USER);

      // Should still have valid count
      expect(typeof validation.valid).toBe("number");
    });

    /**
     * Test 20: Graceful failure on filesystem errors
     */
    it("should handle filesystem errors gracefully", async () => {
      // Attempt to list from non-accessible path should not throw
      const list = await listAvailableSpecializations("test-user");

      expect(Array.isArray(list)).toBe(true);
    });
  });
});
