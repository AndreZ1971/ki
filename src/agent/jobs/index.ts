// src/agent/jobs/index.ts
import 'dotenv/config';
import { logger } from '../../logger';

// ⚙️ Konfiguration über ENV
const JOB_NAME = process.env.JOB?.trim() || 'createFreebie';      // z.B. createFreebie
const MODE = (process.env.JOB_MODE?.trim() || 'once').toLowerCase(); // 'once' | 'interval'
const INTERVAL_MS = Number(process.env.JOB_INTERVAL_MS || 15 * 60 * 1000); // Standard: 15 min

// Hilfs-Typ für dynamisch importierte Module
type AnyModule = Record<string, any>;

/**
 * Ermittelt eine ausführbare Funktion aus einem beliebigen Modul.
 * Unterstützt:
 *   - default export (funktion)
 *   - benannte Exports: run, execute, job
 */
function resolveRunner(mod: AnyModule): (() => Promise<void>) {
  const candidate =
    (typeof mod?.default === 'function' && mod.default) ||
    (typeof mod?.run === 'function' && mod.run) ||
    (typeof mod?.execute === 'function' && mod.execute) ||
    (typeof mod?.job === 'function' && mod.job);

  if (!candidate) {
    throw new Error(
      'Kein ausführbarer Export gefunden. Erwarte eine Funktion als default, run, execute oder job.'
    );
  }
  // in Promise hüllen, falls sync
  return async () => await Promise.resolve(candidate());
}

/**
 * Mappe Job-Namen auf Module.
 * 👉 Neue Jobs hier eintragen (nur Import-Pfad, keine harten Exports nötig).
 */
async function loadJobModule(name: string): Promise<AnyModule> {
  switch (name) {
    case 'createFreebie':
      // namespace-import ist robust gegen unterschiedliche Export-Formen
      return await import('./createFreebie');
    // weitere Jobs:
    // case 'ordersSync':
    //   return await import('./ordersSync');
    default:
      throw new Error(`Unbekannter JOB "${name}".`);
  }
}

async function runOnce() {
  logger.info({ job: JOB_NAME, mode: MODE }, 'Starte Job einmal');
  const mod = await loadJobModule(JOB_NAME);
  const runner = resolveRunner(mod);

  const startedAt = Date.now();
  try {
    await runner();
    const dur = Date.now() - startedAt;
    logger.info({ job: JOB_NAME, duration_ms: dur }, 'Job erfolgreich beendet');
    process.exit(0);
  } catch (err: any) {
    const dur = Date.now() - startedAt;
    logger.error(
      { job: JOB_NAME, duration_ms: dur, err: err?.message, stack: err?.stack },
      'Job fehlgeschlagen'
    );
    process.exit(1);
  }
}

async function runInterval() {
  logger.info(
    { job: JOB_NAME, mode: MODE, every_ms: INTERVAL_MS },
    'Starte Intervall-Runner'
  );

  let running = false;

  const tick = async () => {
    if (running) {
      logger.warn({ job: JOB_NAME }, 'Vorherige Ausführung läuft noch – überspringe Tick');
      return;
    }
    running = true;
    const startedAt = Date.now();

    try {
      const mod = await loadJobModule(JOB_NAME);
      const runner = resolveRunner(mod);
      await runner();
      const dur = Date.now() - startedAt;
      logger.info({ job: JOB_NAME, duration_ms: dur }, 'Intervall-Run erfolgreich');
    } catch (err: any) {
      const dur = Date.now() - startedAt;
      logger.error(
        { job: JOB_NAME, duration_ms: dur, err: err?.message, stack: err?.stack },
        'Intervall-Run fehlgeschlagen'
      );
    } finally {
      running = false;
    }
  };

  // sofort einmal ausführen, dann im Intervall
  tick();
  setInterval(tick, INTERVAL_MS);

  // Prozess am Leben halten
  process.on('SIGINT', () => {
    logger.info({ job: JOB_NAME }, 'Beende (SIGINT)');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    logger.info({ job: JOB_NAME }, 'Beende (SIGTERM)');
    process.exit(0);
  });
}

// Bootstrap
(async () => {
  try {
    if (MODE === 'interval') {
      await runInterval();
    } else {
      await runOnce();
    }
  } catch (err: any) {
    logger.fatal({ err: err?.message, stack: err?.stack }, 'Job-Bootstrap fehlgeschlagen');
    process.exit(1);
  }
})();
