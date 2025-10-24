// src/agent/jobs/index.ts

// external
import 'dotenv/config';

// internal
import { logger } from '../../logger';

const JOB_NAME = process.env.JOB?.trim() || 'wooListCategories';
const MODE = (process.env.JOB_MODE?.trim() || 'once').toLowerCase();
const INTERVAL_MS = Number(process.env.JOB_INTERVAL_MS || 15 * 60 * 1000);

type UnknownModule = Record<string, unknown>;
type AsyncVoidFn = () => Promise<void>;
const toErr = (e: unknown) =>
  e instanceof Error
    ? e
    : new Error(typeof e === 'string' ? e : JSON.stringify(e));

/**
 * Ermittelt eine ausführbare Funktion aus einem Modul.
 * Akzeptiert: default, run, execute, job (jeweils async () => void)
 */
function resolveRunner(mod: UnknownModule): AsyncVoidFn {
  const candidate =
    (typeof mod?.default === 'function' && (mod.default as AsyncVoidFn)) ||
    (typeof (mod as { run?: unknown })?.run === 'function' &&
      ((mod as { run: AsyncVoidFn }).run as AsyncVoidFn)) ||
    (typeof (mod as { execute?: unknown })?.execute === 'function' &&
      ((mod as { execute: AsyncVoidFn }).execute as AsyncVoidFn)) ||
    (typeof (mod as { job?: unknown })?.job === 'function' &&
      ((mod as { job: AsyncVoidFn }).job as AsyncVoidFn));

  if (!candidate) {
    throw new Error(
      'Kein ausführbarer Export gefunden. Erwarte eine Funktion als default, run, execute oder job.'
    );
  }
  return async () => await Promise.resolve(candidate());
}

/**
 * Lädt das Job-Modul anhand des Namens.
 * Hinweis: Ohne Dateiendung importieren (TS/tsx & bundler-freundlich).
 */
async function loadJobModule(name: string): Promise<UnknownModule> {
  switch (name) {
    case 'createFreebie':
      return await import('./createFreebie');

    // ─── Neue Woo-Jobs ────────────────────────────────────────────────────────
    case 'wooListCategories':
      // Listet Woo-Kategorien (z.B. zur ID-Ermittlung)
      return await import('./wooListCategories');

    case 'wooCreateProduct':
      // Legt ein Produkt in Woo an (z. B. Mini-Audit, virtuell, nicht downloadbar)
      return await import('./wooCreateProduct');

    case 'wooUpdateProduct':
      // Aktualisiert ein Produkt (short_description, description, Preis, Status …)
      return await import('./wooUpdateProduct');

    default:
      throw new Error(
        `Unbekannter JOB "${name}". Unterstützt: createFreebie, wooListCategories, wooCreateProduct, wooUpdateProduct`
      );
  }
}

async function runOnce() {
  logger.info({ job: JOB_NAME, mode: MODE }, 'Starte Job einmal');
  const startedAt = Date.now();

  try {
    const mod = await loadJobModule(JOB_NAME);
    const runner = resolveRunner(mod);
    await runner();

    const dur = Date.now() - startedAt;
    logger.info({ job: JOB_NAME, duration_ms: dur }, 'Job erfolgreich beendet');
    process.exit(0);
  } catch (err: unknown) {
    const dur = Date.now() - startedAt;
    const e = toErr(err);
    logger.error(
      { job: JOB_NAME, duration_ms: dur, err: e.message, stack: e.stack },
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
      logger.warn(
        { job: JOB_NAME },
        'Vorherige Ausführung läuft noch – überspringe Tick'
      );
      return;
    }
    running = true;
    const startedAt = Date.now();

    try {
      const mod = await loadJobModule(JOB_NAME);
      const runner = resolveRunner(mod);
      await runner();

      const dur = Date.now() - startedAt;
      logger.info(
        { job: JOB_NAME, duration_ms: dur },
        'Intervall-Run erfolgreich'
      );
    } catch (err: unknown) {
      const dur = Date.now() - startedAt;
      const e = toErr(err);
      logger.error(
        { job: JOB_NAME, duration_ms: dur, err: e.message, stack: e.stack },
        'Intervall-Run fehlgeschlagen'
      );
    } finally {
      running = false;
    }
  };

  // sofort starten + Intervall setzen
  tick();
  setInterval(tick, INTERVAL_MS);

  process.on('SIGINT', () => {
    logger.info({ job: JOB_NAME }, 'Beende (SIGINT)');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    logger.info({ job: JOB_NAME }, 'Beende (SIGTERM)');
    process.exit(0);
  });
}

(async () => {
  try {
    if (MODE === 'interval') {
      await runInterval();
    } else {
      await runOnce();
    }
  } catch (err: unknown) {
    const e = toErr(err);
    logger.fatal(
      { err: e.message, stack: e.stack },
      'Job-Bootstrap fehlgeschlagen'
    );
    process.exit(1);
  }
})();
