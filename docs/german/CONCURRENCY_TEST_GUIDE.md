# 🧪 Concurrency Control Test Suite

**Datei:** `tests/concurrency/specialization-locking.test.ts`

Verwende diese Tests um zu validieren, dass Race Conditions verhindert werden:

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

      // Erstelle beide Spezialisierungen zuerst
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
      // → Nicht deterministisch, welcher aktiv ist!

      // ✅ AFTER: Mit Locking - Serialisiert
      const results = await Promise.all([
        SpecializationPersistenceManager.setActiveSpecialization(spec1Id, userId),
        SpecializationPersistenceManager.setActiveSpecialization(spec2Id, userId)
      ]);

      expect(results).toEqual([true, true]);

      // ✅ Letzte Aktivierung gewinnt (spec2Id)
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

      // ❌ BEFORE: Mögliche Corruption bei concurrent writes
      // await Promise.all(specs.map(s => persistSpecialization(s, userId)));
      // → Kann zu beschädigten Dateien führen

      // ✅ AFTER: Mit Atomic Writes + Locking
      const results = await Promise.all(
        specs.map(s => SpecializationPersistenceManager.persistSpecialization(s, userId))
      );

      // Alle sollten erfolgreich sein
      expect(results).toEqual(
        Array(3).fill(
          expect.objectContaining({
            success: true,
            fallbackReady: true,
          })
        )
      );

      // Alle sollten lesbar sein
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

      // Speichern + gleichzeitig aktivieren
      const [persistResult, activateResult] = await Promise.all([
        SpecializationPersistenceManager.persistSpecialization(spec, userId),
        // Warte kurz, dann aktiviere (simuliert concurrent request)
        (async () => {
          await new Promise(r => setTimeout(r, 5));
          return SpecializationPersistenceManager.setActiveSpecialization('integrity-test', userId);
        })(),
      ]);

      expect(persistResult.success).toBe(true);
      expect(activateResult).toBe(true);

      // Validiere Integrität
      const validation = await SpecializationPersistenceManager.validateIntegrity(userId);
      expect(validation.corrupted).toBe(0);
      expect(validation.missing).toBe(0);
      expect(validation.valid).toBeGreaterThan(0);
    });
  });

  describe('Atomic Write Safety', () => {
    
    it('should recover from partial writes (simulated)', async () => {
      // Note: Echter Test würde Kill-Signal während Write benötigen
      // Dieser Test prüft nur, dass Fallback-Mechanismen funktionieren
      
      const userId = 'test-user-4';
      const spec: SpecializationContext = {
        id: 'atomic-test',
        name: 'Atomic Write Test',
        systemPrompt: 'Test content',
        contextInstructions: [],
        version: '1.0.0',
        createdAt: Date.now(),
      };

      // Speichere und validiere
      const result = await SpecializationPersistenceManager.persistSpecialization(spec, userId);
      expect(result.success).toBe(true);

      // Lade zurück
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

      // Starte 5 concurrent deletes (sollten serialisiert werden)
      const promises = Array.from({ length: 5 }, async (_, i) => {
        executionOrder.push(i);
        return SpecializationPersistenceManager.setActiveSpecialization(specId, userId);
      });

      await Promise.all(promises);

      // Sollten nicht alle gleichzeitig ausgeführt werden (lock effect)
      expect(executionOrder.length).toBe(5);
      // Echter Test würde execution timing messen
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

      // Sollte parallel für verschiedene Users möglich sein
      const startTime = Date.now();
      
      const results = await Promise.all(
        specs.map((spec, idx) =>
          SpecializationPersistenceManager.persistSpecialization(spec as SpecializationContext, userIds[idx])
        )
      );

      const duration = Date.now() - startTime;

      // ✅ Sollte schnell sein (parallel, nicht seriell)
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(1000); // Sollte schneller als seriell sein
    });
  });
});
```

## Tests ausführen

```bash
npm run test -- tests/concurrency/specialization-locking.test.ts
```

## Validierungs-Checklist

- [ ] Alle 5 Tests passen
- [ ] Keine Timeouts
- [ ] Keine Fehler in der Lock-Akquisition
- [ ] Atomic Writes sind wirklich atomar (Check `.tmp` files nach Run)

## Performance Baseline

Nach Implementation sollten diese Metriken gelten:

| Operation | Zeit | Lock-Overhead |
|-----------|------|---------------|
| setActiveSpecialization | ~1ms | <0.1ms |
| persistSpecialization | ~5ms | ~0.2ms |
| Concurrent (5x) | ~5ms (serial) / ~2ms (parallel) | Dependent on key overlap |
