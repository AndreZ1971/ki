// backend/types/loopSchedule.ts
/**
 * TypeScript Types für Loop Schedule Configuration
 */

export type LoopType =
  | 'anomaly-detection'
  | 'payment-recovery'
  | 'product-performance'
  | 'analytics-insights';

export type ScheduleType = 'daily' | 'weekly' | 'interval';

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface BaseScheduleConfig {
  enabled: boolean;
  type: ScheduleType;
}

export interface DailyScheduleConfig extends BaseScheduleConfig {
  type: 'daily';
  time: string; // Format: "HH:MM" (24h)
}

export interface WeeklyScheduleConfig extends BaseScheduleConfig {
  type: 'weekly';
  time: string; // Format: "HH:MM" (24h)
  weekdays: Weekday[]; // z.B. ["Monday", "Wednesday", "Friday"]
}

export interface IntervalScheduleConfig extends BaseScheduleConfig {
  type: 'interval';
  minutes: 15 | 30 | 45 | 60; // Payment Recovery: 15, 30, 45, 60 Minuten
}

export type ScheduleConfig =
  | DailyScheduleConfig
  | WeeklyScheduleConfig
  | IntervalScheduleConfig;

export interface LoopSchedules {
  'anomaly-detection': DailyScheduleConfig;
  'payment-recovery': IntervalScheduleConfig;
  'product-performance': WeeklyScheduleConfig;
  'analytics-insights': DailyScheduleConfig;
}

export type PartialLoopSchedules = Partial<LoopSchedules>;
