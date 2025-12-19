// frontend/src/components/LoopScheduleEditor.tsx
/**
 * Loop Schedule Editor Component
 * Zeigt schedule-spezifische Kontrollen je nach Loop-Typ
 */

import React from "react";

interface DailyScheduleConfig {
  enabled: boolean;
  type: "daily";
  time: string; // HH:MM
}

interface WeeklyScheduleConfig {
  enabled: boolean;
  type: "weekly";
  time: string; // HH:MM
  weekdays: string[]; // ['Monday', 'Wednesday', ...]
}

interface IntervalScheduleConfig {
  enabled: boolean;
  type: "interval";
  minutes: 15 | 30 | 45 | 60;
}

type ScheduleConfig =
  | DailyScheduleConfig
  | WeeklyScheduleConfig
  | IntervalScheduleConfig;

interface Props {
  loopType:
    | "anomaly-detection"
    | "payment-recovery"
    | "product-optimization"
    | "analytics-insights";
  config: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const LoopScheduleEditor: React.FC<Props> = ({
  loopType: _loopType,
  config,
  onChange,
  onClose,
  onSave,
  saving,
}) => {
  const handleToggleEnabled = () => {
    onChange({ ...config, enabled: !config.enabled } as ScheduleConfig);
  };

  const handleTimeChange = (time: string) => {
    if (config.type === "daily" || config.type === "weekly") {
      onChange({ ...config, time } as ScheduleConfig);
    }
  };

  const handleWeekdayToggle = (weekday: string) => {
    if (config.type !== "weekly") return;

    const isSelected = config.weekdays.includes(weekday);
    const newWeekdays = isSelected
      ? config.weekdays.filter((d) => d !== weekday)
      : [...config.weekdays, weekday];

    onChange({ ...config, weekdays: newWeekdays } as ScheduleConfig);
  };

  const handleIntervalChange = (minutes: 15 | 30 | 45 | 60) => {
    if (config.type !== "interval") return;
    onChange({ ...config, minutes } as ScheduleConfig);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          border: "2px solid rgba(6, 182, 212, 0.3)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          color: "#e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: "24px", color: "#06b6d4" }}>
          ⚙️ Schedule konfigurieren
        </h3>

        {/* Enable/Disable Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            padding: "16px",
            background: "rgba(6, 182, 212, 0.05)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            borderRadius: "8px",
          }}
        >
          <label style={{ flex: 1, fontWeight: "600" }}>Loop aktivieren:</label>
          <button
            onClick={handleToggleEnabled}
            style={{
              padding: "8px 24px",
              background: config.enabled
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "rgba(100, 100, 100, 0.3)",
              border: "none",
              borderRadius: "6px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {config.enabled ? "✅ Aktiv" : "⏸️ Pausiert"}
          </button>
        </div>

        {/* Schedule Controls */}
        {config.enabled && (
          <>
            {/* Daily: Time Picker */}
            {config.type === "daily" && (
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  🕐 Ausführungszeit:
                </label>
                <input
                  type="time"
                  value={config.time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                    fontSize: "16px",
                  }}
                />
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  Der Loop wird täglich um {config.time} Uhr ausgeführt.
                </p>
              </div>
            )}

            {/* Weekly: Weekdays + Time */}
            {config.type === "weekly" && (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    📅 Wochentage auswählen:
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {WEEKDAYS.map((weekday) => {
                      const isSelected = config.weekdays.includes(weekday);
                      return (
                        <button
                          key={weekday}
                          onClick={() => handleWeekdayToggle(weekday)}
                          style={{
                            padding: "10px",
                            background: isSelected
                              ? "linear-gradient(135deg, #06b6d4, #0891b2)"
                              : "rgba(255, 255, 255, 0.05)",
                            border: isSelected
                              ? "2px solid #06b6d4"
                              : "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "6px",
                            color: isSelected ? "white" : "#e5e7eb",
                            fontSize: "13px",
                            fontWeight: isSelected ? "bold" : "normal",
                            cursor: "pointer",
                          }}
                        >
                          {weekday.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    🕐 Ausführungszeit:
                  </label>
                  <input
                    type="time"
                    value={config.time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                      fontSize: "16px",
                    }}
                  />
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    Läuft {config.weekdays.join(", ")} um {config.time} Uhr.
                  </p>
                </div>
              </>
            )}

            {/* Interval: Dropdown */}
            {config.type === "interval" && (
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  ⏱️ Intervall wählen:
                </label>
                <select
                  value={config.minutes}
                  onChange={(e) =>
                    handleIntervalChange(
                      Number(e.target.value) as 15 | 30 | 45 | 60
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  <option value={15}>Alle 15 Minuten</option>
                  <option value={30}>Alle 30 Minuten</option>
                  <option value={45}>Alle 45 Minuten</option>
                  <option value={60}>Stündlich</option>
                </select>
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  Der Loop wird alle {config.minutes} Minuten ausgeführt.
                </p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              background: "rgba(100, 100, 100, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "#e5e7eb",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "12px",
              background: saving
                ? "rgba(100, 100, 100, 0.3)"
                : "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {saving ? "⏳ Speichert..." : "✅ Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
};
