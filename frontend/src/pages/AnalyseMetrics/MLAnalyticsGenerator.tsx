import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./page.css";

interface MLAnalyticsInsight {
  type: "forecast" | "segment" | "conversion" | "anomaly";
  value: string;
  score?: number;
  reason?: string;
}

interface MLAnalyticsGeneratorProps {
  metric: string;
  period: string;
}

export const MLAnalyticsGenerator: React.FC<MLAnalyticsGeneratorProps> = ({
  metric,
  period,
}) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<MLAnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `/api/analytics/ml/generate`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric, period }),
      });
      const data = await res.json();



      if (data.success && data.insights) {
        setInsights(data.insights);
      } else if (data.insights) {
        // Fallback: insights direkt vorhanden
        setInsights(data.insights);
      } else {
        setError(data.error || t("ml.analyticsGenerator.error"));
      }
    } catch (err: any) {

      setError(err.message || t("ml.analyticsGenerator.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ml-analytics-section">
      <h3 className="ml-analytics-title">
        🚀 {t("ml.analyticsGenerator.title")}
      </h3>
      <div className="ml-analytics-desc">{t("dashboard.subtitle")}</div>
      <button
        className="ml-analytics-btn"
        onClick={fetchInsights}
        disabled={loading}
        title={t("ml.analyticsGenerator.title")}
      >
        <span
          role="img"
          aria-label="Rocket"
          style={{ marginRight: 8, fontSize: "1.2em" }}
        >
          🚀
        </span>
        {t("ml.analyticsGenerator.generate")}
      </button>
      {loading && (
        <div className="ml-analytics-loading">
          {t("ml.analyticsGenerator.generating")}
        </div>
      )}
      {error && <div className="ml-analytics-error">{error}</div>}
      {insights.length > 0 && (
        <div className="ml-analytics-card-list">
          {insights.map((insight, i) => (
            <div
              className={`ml-analytics-card ml-analytics-type-${insight.type}`}
              key={i}
            >
              <div className="ml-analytics-card-header">
                <span className="ml-analytics-card-icon">
                  {insight.type === "forecast" && "📈"}
                  {insight.type === "segment" && "🧩"}
                  {insight.type === "conversion" && "🎯"}
                  {insight.type === "anomaly" && "⚠️"}
                </span>
                <span className="ml-analytics-card-title">
                  {insight.type === "forecast"
                    ? "Prognose"
                    : insight.type === "segment"
                      ? "Segmentierung"
                      : insight.type === "conversion"
                        ? "Conversion-Optimierung"
                        : "Anomalie"}
                </span>
                {insight.score !== undefined && (
                  <span className="ml-analytics-card-score">
                    {Math.round(insight.score * 100)}%
                  </span>
                )}
              </div>
              <div className="ml-analytics-card-value">{insight.value}</div>
              {insight.reason && (
                <div className="ml-analytics-card-reason">{insight.reason}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
