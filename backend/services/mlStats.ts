// backend/services/mlStats.ts
// Lightweight in-memory metrics for ML endpoints (non-persistent)

export interface MlEvent {
  feature: string;
  success: boolean;
  confidence: number;
  timestamp: number;
}

const events: MlEvent[] = [];
const MAX_EVENTS = 5000;

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

export function recordMlEvent(feature: string, success: boolean, confidence = 0.7): void {
  const safeConfidence = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.7;
  events.push({ feature, success, confidence: safeConfidence, timestamp: Date.now() });
  if (events.length > MAX_EVENTS) {
    events.shift();
  }
}

export function getMlEvents() {
  return [...events];
}

export function getMlStats() {
  const now = Date.now();
  const todayEvents = events.filter((e) => isSameDay(e.timestamp, now));
  const total = events.length;
  const today = todayEvents.length;
  const success = events.filter((e) => e.success).length;
  const failed = total - success;

  const avgConfidence = events.length
    ? events.reduce((sum, e) => sum + e.confidence, 0) / events.length
    : 0;

  const lastPrediction = events.length ? new Date(events[events.length - 1].timestamp).toISOString() : null;

  return {
    predictions: {
      total,
      today,
      success,
      failed,
    },
    avgConfidence,
    lastPrediction,
  };
}
