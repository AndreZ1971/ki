import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./page.css";

interface AnalysisConfig {
  timeRange: string;
  analysisType: string;
  dataSources: string[];
  includePredictions: boolean;
  alertThreshold: number;
}

interface AnalysisResult {
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  estimatedTime: string;
  trendsFound: number;
  insights: string[] | InsightItem[];
  generatedReports: number;
}

interface InsightItem {
  title?: string;
  type?: string;
  value?: string | number;
  detail?: string;
  score?: number;
}

const RunTrendAnalysis = () => {
  const [config, setConfig] = useState<AnalysisConfig>({
    timeRange: "30d",
    analysisType: "comprehensive",
    dataSources: ["sales", "traffic", "conversion"],
    includePredictions: true,
    alertThreshold: 10,
  });

  const [result, setResult] = useState<AnalysisResult>({
    status: "idle",
    progress: 0,
    estimatedTime: "2min",
    trendsFound: 0,
    insights: [],
    generatedReports: 0,
  });

  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Lade Analyse-Historie vom Backend
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/trends/history");
        const data = await response.json();

        if (data.history) {
          // Map backend response to expected format
          const mappedHistory = data.history.map(
            (item: any, index: number) => ({
              id: index + 1,
              date: item.date,
              trends: item.trendsFound,
              duration: item.duration,
              status: item.status,
            })
          );
          setAnalysisHistory(mappedHistory);
        }
      } catch (error) {
        console.error("Failed to load analysis history:", error);
        // Fallback to empty array on error
        setAnalysisHistory([]);
      }
    };

    loadHistory();
  }, []);

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const handleConfigChange = (key: keyof AnalysisConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleDataSourceToggle = (source: string) => {
    const currentSources = [...config.dataSources];
    if (currentSources.includes(source)) {
      setConfig((prev) => ({
        ...prev,
        dataSources: currentSources.filter((s) => s !== source),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        dataSources: [...currentSources, source],
      }));
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || "";

  const runAnalysis = async () => {
    setResult({
      status: "running",
      progress: 0,
      estimatedTime: "...",
      trendsFound: 0,
      insights: [],
      generatedReports: 0,
    });

    // Simuliere den Fortschritt für Demo
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setResult((prev) => ({
          ...prev,
          progress,
          estimatedTime: `${Math.max(0, 120 - progress * 1.2)}s`,
        }));

        if (progress >= 100) {
          clearInterval(interval);
          // Simuliere abgeschlossene Analyse
          setTimeout(() => {
            setResult({
              status: "completed",
              progress: 100,
              estimatedTime: "0s",
              trendsFound: 14,
              insights: [
                "📈 Sales steigen um 24% in den Abendstunden",
                "👥 Mobile Traffic wächst um 31%",
                "🎯 Conversion-Rate um 18% verbessert",
                "📦 Bestandsdrehung um 42% erhöht",
              ],
              generatedReports: 3,
            });
          }, 500);
        }
      }, 300);
    };

    try {
      // ML/KI-Trendprognose über Backend
      if (API_URL) {
        // Keywords aus Datenquellen ableiten (z.B. sales, traffic, conversion)
        const keywords = config.dataSources;
        const res = await fetch(`${API_URL}/api/ml/test/trends`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          // KI-Insights aus ML-Response extrahieren
          const forecasts = data.result.prediction || [];
          setResult({
            status: "completed",
            progress: 100,
            estimatedTime: "ca. 1min",
            trendsFound: forecasts.length,
            insights: forecasts.map((f: any) => ({
              title: `${f.keyword} (${f.trend})`,
              value: `Score: ${Math.round(f.score)}`,
              detail: f.reasoning,
              score: f.confidence,
            })),
            generatedReports: 1,
          });
        } else {
          setResult({
            status: "error",
            progress: 0,
            estimatedTime: "0s",
            trendsFound: 0,
            insights: ["Fehler bei der ML/KI-Analyse."],
            generatedReports: 0,
          });
        }
      } else {
        // Simuliere die Analyse für Demo
        simulateProgress();
      }
    } catch (err) {
      console.error("Analyse-Fehler:", err);
      setResult({
        status: "error",
        progress: 0,
        estimatedTime: "0s",
        trendsFound: 0,
        insights: ["Fehler bei der Analyse. Bitte API überprüfen."],
        generatedReports: 0,
      });
    }
  };

  const stopAnalysis = () => {
    setResult((prev) => ({ ...prev, status: "idle", progress: 0 }));
  };

  const viewResults = () => {
    navigate("/analytics/trend-analysis");
  };

  const getStatusColor = () => {
    switch (result.status) {
      case "running":
        return "#ffc107";
      case "completed":
        return "#28a745";
      case "error":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusIcon = () => {
    switch (result.status) {
      case "running":
        return "🔄";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⏸️";
    }
  };

  return (
    <div className="analytics-page">
      {/* Absolut positionierter Back-Button */}
      <button
        className="back-button floating-back"
        onClick={handleBackToDashboard}
      >
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>🚀 Run Trend Analysis</h1>
        <p>Führe Trend-Analyse sofort aus und entdecke neue Insights</p>
        <div
          style={{
            background: "#e0f7fa",
            color: "#00796b",
            padding: "12px",
            borderRadius: "8px",
            margin: "16px 0",
            fontWeight: 500,
            fontSize: "1.1em",
          }}
        >
          Hinweis: Diese Analyse ist KI/MLgestützt.
        </div>
      </div>

      <div className="analysis-container">
        {/* Konfigurations-Sektion */}
        <div className="config-section">
          <div className="metric-card full-width">
            <h3>⚙️ Analyse Konfiguration</h3>

            <div className="config-grid">
              <div className="config-group">
                <label>Zeitraum:</label>
                <select
                  value={config.timeRange}
                  onChange={(e) =>
                    handleConfigChange("timeRange", e.target.value)
                  }
                  disabled={result.status === "running"}
                >
                  <option value="7d">Letzte 7 Tage</option>
                  <option value="30d">Letzte 30 Tage</option>
                  <option value="90d">Letzte 90 Tage</option>
                  <option value="1y">Letztes Jahr</option>
                </select>
              </div>

              <div className="config-group">
                <label>Analyse-Typ:</label>
                <select
                  value={config.analysisType}
                  onChange={(e) =>
                    handleConfigChange("analysisType", e.target.value)
                  }
                  disabled={result.status === "running"}
                >
                  <option value="quick">Schnell-Analyse</option>
                  <option value="comprehensive">Umfassende Analyse</option>
                  <option value="deep">Tiefen-Analyse</option>
                </select>
              </div>

              <div className="config-group">
                <label>Alert-Schwelle:</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={config.alertThreshold}
                  onChange={(e) =>
                    handleConfigChange(
                      "alertThreshold",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={result.status === "running"}
                />
                <span>{config.alertThreshold}% Veränderung</span>
              </div>
            </div>

            <div className="data-sources">
              <label>Datenquellen:</label>
              <div className="source-buttons">
                {[
                  "sales",
                  "traffic",
                  "conversion",
                  "inventory",
                  "social",
                  "competitor",
                ].map((source) => (
                  <button
                    key={source}
                    className={`source-button ${config.dataSources.includes(source) ? "active" : ""}`}
                    onClick={() => handleDataSourceToggle(source)}
                    disabled={result.status === "running"}
                  >
                    {source === "sales" && "💰 Sales"}
                    {source === "traffic" && "👥 Traffic"}
                    {source === "conversion" && "🎯 Conversion"}
                    {source === "inventory" && "📦 Inventory"}
                    {source === "social" && "💬 Social"}
                    {source === "competitor" && "🏆 Competitor"}
                  </button>
                ))}
              </div>
            </div>

            <div className="analysis-actions">
              {result.status !== "running" ? (
                <button
                  className="action-button primary large"
                  onClick={runAnalysis}
                >
                  🚀 Analyse Starten
                </button>
              ) : (
                <button
                  className="action-button warning large"
                  onClick={stopAnalysis}
                >
                  ⏹️ Analyse Stoppen
                </button>
              )}

              {result.status === "completed" && (
                <button
                  className="action-button success large"
                  onClick={viewResults}
                >
                  📊 Ergebnisse Anzeigen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fortschritts-Sektion */}
        {result.status !== "idle" && (
          <div className="progress-section">
            <div className="metric-card full-width">
              <h3>
                {getStatusIcon()} Analyse Fortschritt
                <span style={{ color: getStatusColor(), marginLeft: "10px" }}>
                  {result.status === "running"
                    ? "Läuft..."
                    : result.status === "completed"
                      ? "Abgeschlossen"
                      : "Fehler"}
                </span>
              </h3>

              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${result.progress}%`,
                    backgroundColor: getStatusColor(),
                  }}
                ></div>
                <span className="progress-text">
                  {Math.round(result.progress)}%
                </span>
              </div>

              <div className="progress-stats">
                <div className="progress-stat">
                  <span>Geschätzte Zeit:</span>
                  <span>{result.estimatedTime}</span>
                </div>
                <div className="progress-stat">
                  <span>Trends gefunden:</span>
                  <span>{result.trendsFound}</span>
                </div>
                <div className="progress-stat">
                  <span>Reports generiert:</span>
                  <span>{result.generatedReports}</span>
                </div>
              </div>

              {/* KI/ML Insights Grid */}
              {result.insights.length > 0 && (
                <div className="live-insights">
                  <h4>🧠 KI-Insights</h4>
                  <div className="insights-list">
                    {result.insights.map((insight, index) => {
                      if (typeof insight === "string") {
                        return (
                          <div key={index} className="insight-item live">
                            {insight}
                          </div>
                        );
                      } else {
                        const insightObj = insight as InsightItem;
                        return (
                          <div key={index} className="insight-item live">
                            {insightObj.title && (
                              <div style={{ fontWeight: 600 }}>
                                {insightObj.title}
                              </div>
                            )}
                            {insightObj.value && <div>{insightObj.value}</div>}
                            {insightObj.detail && (
                              <div style={{ color: "#6c757d" }}>
                                {insightObj.detail}
                              </div>
                            )}
                            {insightObj.score !== undefined && (
                              <div
                                style={{ color: "white", fontWeight: 700 }}
                              >
                                KI-Score: {Math.round(insightObj.score * 100)}%
                              </div>
                            )}
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analyse-Historie */}
        <div className="history-section">
          <div className="metric-card full-width">
            <h3>📚 Letzte Analysen</h3>
            <div className="history-list">
              {analysisHistory.map((analysis) => (
                <div key={analysis.id} className="history-item">
                  <span className="history-date">{analysis.date}</span>
                  <span className="history-trends">
                    {analysis.trends} Trends
                  </span>
                  <span className="history-duration">{analysis.duration}</span>
                  <span className={`history-status ${analysis.status}`}>
                    {analysis.status === "completed" ? "✅" : "🔄"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunTrendAnalysis;
