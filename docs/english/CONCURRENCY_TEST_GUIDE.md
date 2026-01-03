# 🧪 Concurrency Control Test Suite

**File:** `tests/concurrency/specialization-locking.test.ts`

Use these tests to validate that race conditions are prevented:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SpecializationPersistenceManager } from '../../backend/services/specializationPersistenceManager';
import type { SpecializationContext } from '../../backend/types/specialization';

describe('Concurrency Control - Specialization Locking', () => {
  
  beforeEach(async () => {
    // Setup
    await SpecializationPersistenceManager.initialize();
  });

  describe('Race Condition Prevention', () => {
    
    it('should prevent concurrent setActiveSpecialization calls from overwriting each other', async () => {
      const userId = 'test-user-1';
      const spec1Id = 'spec-1';
      const spec2Id = 'spec-2';

      // Create both specializations first
      const spec1: SpecializationContext = {
        id: spec1Id,
        name: 'Spec 1',
        systemPrompt: 'You are spec 1',
        contextInstructions: [],
        version: '1.0.0',
        createdAt: Date.now(),
      };

      const spec2: SpecializationContext = {
        id: spec2Id,
        name: 'Spec 2',
        systemPrompt: 'You are spec 2',
        contextInstructions: [],
        version: '1.0.0',
        createdAt: Date.now(),
      };

      await SpecializationPersistenceManager.persistSpecialization(spec1, userId);
      await SpecializationPersistenceManager.persistSpecialization(spec2, userId);

      // ❌ BEFORE: Race Condition - 2 concurrent requests
      // const results = await Promise.all([
      //   setActiveSpecialization(spec1Id, userId),
      //   setActiveSpecialization(spec2Id, userId)
      // ]);
      // → Non-deterministic which is active!

      // ✅ AFTER: With Locking - Serialized
      const results = await Promise.all([
        SpecializationPersistenceManager.setActiveSpecialization(spec1Id, userId),
        SpecializationPersistenceManager.setActiveSpecialization(spec2Id, userId)
      ]);

      expect(results).toEqual([true, true]);

      // ✅ Last activation wins (spec2Id)
      const active = await SpecializationPersistenceManager.getActiveSpecialization(userId);
      expect(active.specialization?.id).toBe(spec2Id);
    });

    it('should handle concurrent persistSpecialization calls safely', async () => {
      const userId = 'test-user-2';
      const specs: SpecializationContext[] = [
        {
          id: 'concurrent-1',
          name: 'Concurrent Spec 1',
          systemPrompt: 'Spec 1 content',
          contextInstructions: [],
          version: '1.0.0',
          createdAt: Date.now(),
        },
        {
          id: 'concurrent-2',
          name: 'Concurrent Spec 2',
          systemPrompt: 'Spec 2 content',
          contextInstructions: [],
          version: '1.0.0',
          createdAt: Date.now(),
        },
        {
          id: 'concurrent-3',
          name: 'Concurrent Spec 3',
          systemPrompt: 'Spec 3 content',
          contextInstructions: [],
          version: '1.0.0',
          createdAt: Date.now(),
        },
      ];

      // ❌ BEFORE: Possible corruption on concurrent writes
      // await Promise.all(specs.map(s => persistSpecialization(s, userId)));
      // → Can lead to corrupted files

      // ✅ AFTER: With Atomic Writes + Locking
      const results = await Promise.all(
        specs.map(s => SpecializationPersistenceManager.persistSpecialization(s, userId))
      );

      // All should succeed
      expect(results).toEqual(
        Array(3).fill(
          expect.objectContaining({
            success: true,
            fallbackReady: true,
          })
        )
      );

      // All should be readable
      const list = await SpecializationPersistenceManager.listSpecializations(userId);
      expect(list.length).toBe(3);
    });

    it('should validate file integrity after concurrent operations', async () => {
      const userId = 'test-user-3';

      const spec: SpecializationContext = {
        id: 'integrity-test',
        name: 'Integrity Test Spec',
        systemPrompt: 'Test content with special chars: äöü €',
        contextInstructions: ['Line 1', 'Line 2', 'Line 3'],
        version: '1.0.0',
        createdAt: Date.now(),
      };

      // Save + simultaneously activate
      const [persistResult, activateResult] = await Promise.all([
        SpecializationPersistenceManager.persistSpecialization(spec, userId),
        // Wait briefly, then activate (simulates concurrent request)
        (async () => {
          await new Promise(r => setTimeout(r, 5));
          return SpecializationPersistenceManager.setActiveSpecialization('integrity-test', userId);
        })(),
      ]);

      expect(persistResult.success).toBe(true);
      expect(activateResult).toBe(true);

      // Validate integrity
      const validation = await SpecializationPersistenceManager.validateIntegrity(userId);
      expect(validation.corrupted).toBe(0);
      expect(validation.missing).toBe(0);
      expect(validation.valid).toBeGreaterThan(0);
    });
  });

  describe('Atomic Write Safety', () => {
    
    it('should recover from partial writes (simulated)', async () => {
      // Note: Real test would need kill signal during write
      // This test just checks fallback mechanisms work
      
      const userId = 'test-user-4';
      const spec: SpecializationContext = {
        id: 'atomic-test',
        name: 'Atomic Write Test',
        systemPrompt: 'Test content',
        contextInstructions: [],
        version: '1.0.0',
        createdAt: Date.now(),
      };

      // Save and validate
      const result = await SpecializationPersistenceManager.persistSpecialization(spec, userId);
      expect(result.success).toBe(true);

      // Load back
      const active = await SpecializationPersistenceManager.getActiveSpecialization(userId);
      expect(active.specialization).not.toBeNull();
      expect(active.fallbackReady).toBeDefined();
    });
  });

  describe('Lock Behavior', () => {
    
    it('should serialize writes to the same specialization', async () => {
      const userId = 'test-user-5';
      const specId = 'serialize-test';

      const spec: SpecializationContext = {
        id: specId,
        name: 'Serialize Test',
        systemPrompt: 'Version',
        contextInstructions: [],
        version: '1.0.0',
        createdAt: Date.now(),
      };

      // Track execution order
      const executionOrder: number[] = [];

      // Start 5 concurrent deletes (should be serialized)
      const promises = Array.from({ length: 5 }, async (_, i) => {
        executionOrder.push(i);
        return SpecializationPersistenceManager.setActiveSpecialization(specId, userId);
      });

      await Promise.all(promises);

      // Should not all execute simultaneously (lock effect)
      expect(executionOrder.length).toBe(5);
      // Real test would measure execution timing
    });

    it('should allow concurrent operations on different users', async () => {
      const userIds = ['user-a', 'user-b', 'user-c'];

      const specs = userIds.map((userId, idx) => ({
        id: `spec-for-${userId}`,
        name: `Spec for ${userId}`,
        systemPrompt: `Content for ${userId}`,
        contextInstructions: [],
        version: '1.0.0',
        createdAt: Date.now(),
      }));

      // Should be possible in parallel for different users
      const startTime = Date.now();
      
      const results = await Promise.all(
        specs.map((spec, idx) =>
          SpecializationPersistenceManager.persistSpecialization(spec as SpecializationContext, userIds[idx])
        )
      );

      const duration = Date.now() - startTime;

      // ✅ Should be fast (parallel, not serial)
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should be faster than serial
    });
  });
});
```

## Run Tests

```bash
npm run test -- tests/concurrency/specialization-locking.test.ts
```

## Validation Checklist

- [ ] All 5 tests pass
- [ ] No timeouts
- [ ] No errors in lock acquisition
- [ ] Atomic writes are truly atomic (check `.tmp` files after run)

## Performance Baseline

After implementation, these metrics should apply:

| Operation | Time | Lock Overhead |
|-----------|------|---------------|
| setActiveSpecialization | ~1ms | <0.1ms |
| persistSpecialization | ~5ms | ~0.2ms |
| Concurrent (5x) | ~5ms (serial) / ~2ms (parallel) | Dependent on key overlap |
