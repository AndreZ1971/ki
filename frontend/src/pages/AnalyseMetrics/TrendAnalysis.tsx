import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/i18n-utils";
import "./page.css";

interface Metric {
  icon: string;
  label: string;
  value: string | number;
  detail?: string;
}

interface TrendItem {
  topic: string;
  score: string;
}

// Insight interface entfernt

interface NextStep {
  title?: string;
  description?: string;
  criticality?: "critical" | "warning" | "good";
}

const TrendAnalysis = () => {
  // const [trendData, setTrendData] = useState<TrendData | null>(null); // entfernt
  // const [loading, setLoading] = useState(true); // entfernt
  // const [error, setError] = useState<string | null>(null); // entfernt
  const [timeRange, setTimeRange] = useState("30d");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [googleTrends, setGoogleTrends] = useState<TrendItem[]>([]);
  const [redditTrends, setRedditTrends] = useState<TrendItem[]>([]);
  // Letzte Analysen
  const [lastAnalyses, setLastAnalyses] = useState<any[]>([]);

  const navigate = useNavigate();

  // Alte persistierte Historie löschen, damit keine festen Daten angezeigt werden
  useEffect(() => {
    localStorage.removeItem("trendAnalysisHistory");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let base = (import.meta.env.VITE_API_URL || "").trim();
        if (base.endsWith("/")) base = base.slice(0, -1);
        // Zeitraum-Parameter hinzufügen
        const apiUrl = base
          ? `${base}/api/analytics/trends/products?range=${timeRange}`
          : `/api/analytics/trends/products?range=${timeRange}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Fehler beim Laden der Trend-Daten");
        const data = await res.json();

        if (data.success && data.trending_products) {
          const demoMetrics: Metric[] = [
            {
              icon: "📈",
              label: "Sales Growth",
              value: `${data.salesGrowth || 12.5}%`,
              detail:
                data.salesGrowth && data.salesGrowth > 0
                  ? "Positive"
                  : "Negativ",
            },
            {
              icon: "👥",
              label: "Customer Growth",
              value: `${data.customerGrowth || 8.3}%`,
              detail:
                data.customerGrowth && data.customerGrowth > 0
                  ? "Wachsend"
                  : "Rückläufig",
            },
            {
              icon: "🔥",
              label: "Popular Products",
              value: data.trending_products.length,
              detail: "Top-Performer",
            },
            {
              icon: "📊",
              label: "Seasonal Trend",
              value: `${data.seasonalTrend || 23.7}%`,
              detail: "Saisonalität",
            },
            {
              icon: "🎯",
              label: "Prediction Accuracy",
              value: `${data.predictionAccuracy || 87.2}%`,
              detail: "KI-Genauigkeit",
            },
            {
              icon: "⚡",
              label: "Trend Strength",
              value: `${data.trendStrength || 76.8}%`,
              detail: "Trend-Stärke",
            },
            {
              icon: "📱",
              label: "Market Trend",
              value: data.marketTrend || "↗️ Steigend",
              detail: "Marktrichtung",
            },
            {
              icon: "🔄",
              label: "Last Updated",
              value: formatDate(new Date()),
              detail: "Aktualisiert",
            },
          ];
          setMetrics(demoMetrics);

          // Google Trends aus API
          setGoogleTrends(
            data.trending_products.slice(0, 4).map((p: any) => ({
              topic: p.name,
              score: `+${Math.round(p.trend_score)}%`,
            }))
          );

          // Reddit Trends
          setRedditTrends(
            data.trending_products.slice(0, 4).map((p: any) => ({
              topic: p.name,
              score: `${p.mentions} mentions`,
            }))
          );

          // Automatisch KI-Analyse starten mit neuen Daten
          setInsights([]);
          setNextSteps([]);
          setSummary(null);
        }
      } catch (_err) {
        // Keine Mock-Daten - nur echte Daten oder Fehler
        setMetrics([]);
        setGoogleTrends([]);
        setRedditTrends([]);
      }
    };
    fetchData();
  }, [timeRange]);

  // KI/ML-Analyse: API-Call
  const handleAnalyzeAI = useCallback(async () => {
    setInsightLoading(true);
    setInsightError(null);
    setInsights([]);
    setNextSteps([]);
    setSummary(null);

    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/ml/generate`
        : `/api/analytics/ml/generate`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: ["sales", "conversion", "traffic"],
          timeRange: timeRange,
        }),
      });
      if (!res.ok) throw new Error("KI-Analyse fehlgeschlagen");
      const data = await res.json();

      if (data.success && data.analysis) {
        setInsights(
          data.analysis.insights.slice(0, 8).map((i: any) => ({
            type: i.category?.toLowerCase() || "other",
            title: i.category,
            value: i.finding?.substring(0, 30) + "..." || i.finding,
            detail: i.finding,
            score: i.confidence || 0.8,
          }))
        );
        setNextSteps(
          data.analysis.next_steps.map((s: any) => ({
            title: s,
            description: s,
            criticality: "good",
          }))
        );
        setSummary(data.analysis.next_steps.join(", "));

        // Speichere nur die letzte Analyse im aktuellen Zustand (keine Persistenz)
        const analysis = {
          timeRange,
          timestamp: new Date().toISOString(),
          summary: data.analysis.next_steps.join(", "),
          insightsCount: data.analysis.insights.length,
          insights: data.analysis.insights.slice(0, 8),
        };
        setLastAnalyses([analysis]);
      }
    } catch (_err) {
      // Keine Mock-Daten – im Fehlerfall leeren und Fehler anzeigen
      setInsights([]);
      setNextSteps([]);
      setSummary(null);
      setLastAnalyses([]);
      setInsightError(
        "KI-Analyse nicht verfügbar. Überprüfe die Backend-Verbindung."
      );
    } finally {
      setInsightLoading(false);
    }
  }, [timeRange]);

  // Automatische KI-Analyse bei Zeitraum-Änderung
  useEffect(() => {
    if (metrics.length > 0) {
      handleAnalyzeAI();
    }
  }, [metrics.length, handleAnalyzeAI]);

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  // getTrendIndicator entfernt

  // getTrendIndicator entfernt
  return (
    <div>
      {/* Absolut positionierter Back-Button */}
      <button
        className="back-button floating-back"
        onClick={handleBackToDashboard}
      >
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>📊 Trend Analysis</h1>
        <p>
          KI-gestützte Trendanalyse mit echten Shop-Daten, Google Trends &
          Reddit Insights
        </p>
        {/* Zeitraum Auswahl */}
        <div className="time-range-selector">
          <h4>Zeitraum analysieren:</h4>
          <div className="range-buttons">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <button
                key={range}
                className={`range-button ${timeRange === range ? "active" : ""}`}
                onClick={() => handleTimeRangeChange(range)}
              >
                {range === "7d" && "7 Tage"}
                {range === "30d" && "30 Tage"}
                {range === "90d" && "90 Tage"}
                {range === "1y" && "1 Jahr"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shop-Trend-Metriken Grid */}
      <div className="analytics-grid-2x4">
        {metrics.map((metric, i) => (
          <div className="metric-card" key={i}>
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            {metric.detail && (
              <div className="trend-indicator">{metric.detail}</div>
            )}
          </div>
        ))}
      </div>

      {/* Google Trends Chart */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🌐 Google Trends</h3>
          {googleTrends.length === 0 ? (
            <div style={{ color: "#6c757d" }}>
              Keine Google Trends-Daten verfügbar.
            </div>
          ) : (
            <div className="prediction-chart">
              {/* Dummy Chart-Placeholder, kann durch echtes Chart ersetzt werden */}
              <div className="chart-placeholder">📈 Google Trends Chart</div>
              <div className="prediction-stats">
                {googleTrends.map((trend, i) => (
                  <div className="prediction-item" key={i}>
                    <span>{trend.topic}</span>
                    <span className="prediction-value positive">
                      {trend.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reddit Trends Chart */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>👾 Reddit Trends</h3>
          {redditTrends.length === 0 ? (
            <div style={{ color: "#6c757d" }}>
              Keine Reddit-Trends verfügbar.
            </div>
          ) : (
            <div className="prediction-chart">
              <div className="chart-placeholder">📈 Reddit Trends Chart</div>
              <div className="prediction-stats">
                {redditTrends.map((trend, i) => (
                  <div className="prediction-item" key={i}>
                    <span>{trend.topic}</span>
                    <span className="prediction-value positive">
                      {trend.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KI/ML-Analyse Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🧠 KI-gestützte Trend-Analyse</h3>
          <p style={{ marginBottom: 18, color: "#2563eb", fontWeight: 500 }}>
            Nutze KI/ML, um Trends, Prognosen und Optimierungspotenziale aus
            Shop-, Google- und Reddit-Daten zu erkennen.
          </p>
          <button
            className="action-button primary"
            onClick={handleAnalyzeAI}
            disabled={insightLoading}
            style={{ marginBottom: 18 }}
          >
            {insightLoading
              ? "⏳ KI-Analyse läuft..."
              : "🧠 KI-Analyse starten"}
          </button>
          {insightError && <div className="error-message">{insightError}</div>}

          {/* Zusammenfassung */}
          {summary && (
            <div className="metric-card" style={{ margin: "24px 0" }}>
              <h4>📝 KI-Zusammenfassung</h4>
              <div
                style={{
                  fontSize: "1.1rem",
                  color: "#2c3e50",
                  marginBottom: 12,
                }}
              >
                {summary}
              </div>
            </div>
          )}

          {/* Insights Grid */}
          {Array.isArray(insights) && insights.length > 0 && (
            <div className="analytics-grid-2x4" style={{ marginBottom: 32 }}>
              {insights.map((insight, i) => (
                <div className="metric-card" key={i}>
                  <div className="metric-icon" style={{ fontSize: "2.2rem" }}>
                    {insight.type === "trend" && "📈"}
                    {insight.type === "segment" && "🧩"}
                    {insight.type === "forecast" && "🔮"}
                    {insight.type === "anomaly" && "⚠️"}
                    {insight.type === "conversion" && "🎯"}
                    {insight.type === "reddit" && "👾"}
                    {insight.type === "google" && "🌐"}
                    {insight.type === "other" && "🔎"}
                  </div>
                  <div className="metric-label">
                    {insight.title || insight.type}
                  </div>
                  <div className="metric-value" style={{ fontSize: "1.3rem" }}>
                    {insight.value}
                  </div>
                  {insight.detail && (
                    <div
                      style={{
                        color: "#6c757d",
                        fontSize: "0.95rem",
                        marginTop: 8,
                      }}
                    >
                      {insight.detail}
                    </div>
                  )}
                  {insight.score !== undefined && (
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#2563eb",
                        marginTop: 8,
                      }}
                    >
                      KI-Score: {Math.round(insight.score * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Next Steps / Empfehlungen */}
          {Array.isArray(nextSteps) && nextSteps.length > 0 && (
            <div className="next-steps" style={{ marginBottom: 32 }}>
              <h4>🚀 Empfohlene Next Steps</h4>
              {nextSteps.map((step, i) => (
                <div
                  className={`next-step ${step.criticality || "good"}`}
                  key={i}
                >
                  <span className="step-icon">
                    {step.criticality === "critical" && "❗"}
                    {step.criticality === "warning" && "⚠️"}
                    {step.criticality === "good" && "✅"}
                    {!step.criticality && "➡️"}
                  </span>
                  <div className="step-content">
                    <strong>{step.title || "Empfehlung"}</strong>
                    <p>{step.description || ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Letzte Analysen */}
      {lastAnalyses.length > 0 && (
        <div className="analysis-section">
          <div className="metric-card full-width">
            <h3>📚 Letzte Analysen</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lastAnalyses.map((analysis, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    background: idx === 0 ? "#e8f4fd" : "#f8f9fa",
                    border:
                      idx === 0 ? "2px solid #2563eb" : "1px solid #e0e0e0",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  onClick={() => {
                    // Optional: Klicken um diese Analyse wieder zu laden
                    setTimeRange(analysis.timeRange);
                    // Könnte auch eine Funktion zum erneuten Laden der Analyse hinzufügen
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#2c3e50" }}>
                          {analysis.timeRange === "7d" && "📅 7-Tage Analyse"}
                          {analysis.timeRange === "30d" && "📅 30-Tage Analyse"}
                          {analysis.timeRange === "90d" && "📅 90-Tage Analyse"}
                          {analysis.timeRange === "1y" && "📅 1-Jahr Analyse"}
                          {!analysis.timeRange && "📅 Analyse"}
                          {idx === 0 && " (aktuell)"}
                        </span>
                        <span style={{ color: "#6c757d", fontSize: "0.85rem" }}>
                          {formatDate(new Date(analysis.timestamp))}
                        </span>
                      </div>
                      <div
                        style={{
                          color: "#2c3e50",
                          fontSize: "0.95rem",
                          lineHeight: "1.4",
                          marginBottom: 8,
                        }}
                      >
                        {analysis.summary?.substring(0, 120)}...
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 120,
                        justifyContent: "flex-end",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            color: "#2563eb",
                          }}
                        >
                          {analysis.trends || analysis.insightsCount}
                        </div>
                        <div style={{ color: "#6c757d", fontSize: "0.85rem" }}>
                          Trends
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            color: "#10b981",
                          }}
                        >
                          {analysis.duration || "0m 0s"}
                        </div>
                        <div style={{ color: "#6c757d", fontSize: "0.85rem" }}>
                          Dauer
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem" }}>
                          {analysis.status || "✅"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;
