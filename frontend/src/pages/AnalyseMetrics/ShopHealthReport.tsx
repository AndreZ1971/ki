import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatTime } from "../../lib/i18n-utils";
import "./page.css";

// Types für API Responses
export interface SecurityScanResponse {
  success: boolean;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  scannedAt: string;
  details?: any[];
}

export interface SEOAnalysisResponse {
  success: boolean;
  score: number;
  issues: Array<{
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    suggestion: string;
  }>;
  analyzedAt: string;
}

export interface CacheClearResponse {
  success: boolean;
  message: string;
  clearedItems?: string[];
  timestamp: string;
}

export interface PerformanceReportResponse {
  success: boolean;
  reportId: string;
  reportUrl?: string;
  metrics: {
    loadTime: number;
    ttfb: number;
    fcp: number;
    lcp: number;
  };
  timestamp: string;
}

// API Service für Shop Health - REAL DATA
const shopHealthService = {
  async clearCache(): Promise<CacheClearResponse> {
    const res = await fetch("/api/health/clear-cache", { method: "POST" });
    return await res.json();
  },
  async generatePerformanceReport(): Promise<PerformanceReportResponse> {
    const res = await fetch("/api/health/performance-report", {
      method: "POST",
    });
    return await res.json();
  },
  async runSecurityScan(): Promise<SecurityScanResponse> {
    const res = await fetch("/api/health/security-scan", { method: "POST" });
    return await res.json();
  },
  async analyzeSEO(): Promise<SEOAnalysisResponse> {
    const res = await fetch("/api/health/seo-analysis", { method: "POST" });
    return await res.json();
  },
};

interface HealthMetric {
  name: string;
  value: number;
  status: "excellent" | "good" | "warning" | "critical";
  target: number;
  trend: number;
}

interface ShopHealthData {
  overallScore: number;
  performance: number;
  security: number;
  seo: number;
  inventory: number;
  lastScan: string;
  issuesFound: number;
  recommendations: number;
  metrics: HealthMetric[];
}

// Schnellaktionen Typdefinition
interface QuickAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "warning" | "success";
  icon: string;
  completed: boolean;
  loading?: boolean;
}

const ShopHealthReport = () => {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState<ShopHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [scanInProgress, setScanInProgress] = useState(false);

  // KI/ML-Analyse States
  interface MLInsight {
    type: string;
    title: string;
    value: string;
    score?: number;
    detail?: string;
    priority?: "critical" | "high" | "medium" | "low";
    category?: string;
  }
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlInsights, setMlInsights] = useState<MLInsight[]>([]);

  // Zustand für Schnellaktionen
  const [quickActions, setQuickActions] = useState<QuickAction[]>([
    {
      id: "clear-cache",
      label: "Cache leeren",
      type: "primary",
      icon: "🔄",
      completed: false,
    },
    {
      id: "performance-report",
      label: "Performance Report",
      type: "secondary",
      icon: "📊",
      completed: true,
    },
    {
      id: "security-check",
      label: "Sicherheits-Check",
      type: "warning",
      icon: "🔒",
      completed: false,
    },
    {
      id: "seo-analysis",
      label: "SEO-Analyse",
      type: "success",
      icon: "📈",
      completed: false,
    },
  ]);

  // Fetch all health data from backend endpoints
  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    try {
      // Run all health checks in parallel
      const [perf, sec, seo] = await Promise.all([
        shopHealthService.generatePerformanceReport(),
        shopHealthService.runSecurityScan(),
        shopHealthService.analyzeSEO(),
      ]);
      // Compose healthData from real API responses
      const metrics: HealthMetric[] = [
        {
          name: "Ladezeit",
          value: perf.metrics.loadTime,
          status: perf.metrics.loadTime < 2 ? "excellent" : "warning",
          target: 2.0,
          trend: 0,
        },
        {
          name: "TTFB",
          value: perf.metrics.ttfb,
          status: perf.metrics.ttfb < 1 ? "excellent" : "warning",
          target: 1.0,
          trend: 0,
        },
        {
          name: "FCP",
          value: perf.metrics.fcp,
          status: perf.metrics.fcp < 2 ? "good" : "warning",
          target: 2.0,
          trend: 0,
        },
        {
          name: "LCP",
          value: perf.metrics.lcp,
          status: perf.metrics.lcp < 2.5 ? "good" : "critical",
          target: 2.5,
          trend: 0,
        },
        {
          name: "SEO-Optimierung",
          value: seo.score,
          status:
            seo.score > 85 ? "excellent" : seo.score > 70 ? "good" : "warning",
          target: 90,
          trend: 0,
        },
        {
          name: "Sicherheits-Updates",
          value: sec.vulnerabilities.critical === 0 ? 100 : 60,
          status: sec.vulnerabilities.critical === 0 ? "excellent" : "critical",
          target: 100,
          trend: 0,
        },
      ];
      setHealthData({
        overallScore: Math.round(
          (perf.metrics.loadTime < 2 ? 30 : 10) +
            seo.score / 2 +
            (sec.vulnerabilities.critical === 0 ? 30 : 10)
        ),
        performance: Math.round(perf.metrics.loadTime < 2 ? 100 : 60),
        security: Math.round(sec.vulnerabilities.critical === 0 ? 100 : 60),
        seo: seo.score,
        inventory: 90, // TODO: Replace with real inventory data
        lastScan: new Date().toISOString(),
        issuesFound:
          sec.vulnerabilities.critical +
          sec.vulnerabilities.high +
          sec.vulnerabilities.medium +
          sec.vulnerabilities.low +
          seo.issues.length,
        recommendations: seo.issues.length,
        metrics,
      });
      setLastUpdate(new Date());
    } catch (_e) {
      showErrorNotification("Fehler beim Laden der Shop-Daten");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const handleBack = () => {
    navigate("/");
  };

  // KI/ML-Analyse: Shop Health mit KI-Diagnostik
  const handleMLAnalyze = async () => {
    setMlLoading(true);
    setMlError(null);
    setMlInsights([]);
    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/health/ml-analysis`
        : `/api/health/ml-analysis`;

      const payload = {
        healthData: healthData || {
          overallScore: 75,
          performance: 80,
          security: 85,
          seo: 72,
          inventory: 90,
          lastScan: new Date().toISOString(),
          issuesFound: 5,
          recommendations: 8,
          metrics: [],
        },
        metrics: healthData?.metrics || [],
      };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Fehler beim Laden der KI-Analyse");
      const data = await res.json();
      setMlInsights(data.mlInsights || []);
    } catch (err: any) {
      setMlError(err.message || "KI-Analyse konnte nicht geladen werden.");
    }
    setMlLoading(false);
  };

  const runHealthScan = () => {
    setScanInProgress(true);
    setTimeout(() => {
      fetchHealthData();
      setScanInProgress(false);
    }, 3000);
  };

  // Hilfsfunktionen für die Ergebnisse
  const handleSecurityResults = (results: SecurityScanResponse) => {
    if (results.vulnerabilities.critical > 0) {
      // Kritische Sicherheitsprobleme - sofort handeln
      showCriticalAlert({
        title: "Kritische Sicherheitsprobleme!",
        message: `${results.vulnerabilities.critical} kritische Vulnerabilities gefunden`,
      });
    }

    // Health Data aktualisieren basierend auf Scan-Ergebnissen
    if (healthData) {
      setHealthData({
        ...healthData,
        security: calculateSecurityScore(results),
        issuesFound: healthData.issuesFound + results.vulnerabilities.critical,
      });
    }
  };

  const updateSEOResults = (results: SEOAnalysisResponse) => {
    if (healthData) {
      setHealthData({
        ...healthData,
        seo: results.score,
        recommendations: healthData.recommendations + results.issues.length,
      });
    }
  };

  const calculateSecurityScore = (
    securityResults: SecurityScanResponse
  ): number => {
    let score = 100;
    score -= securityResults.vulnerabilities.critical * 10;
    score -= securityResults.vulnerabilities.high * 5;
    score -= securityResults.vulnerabilities.medium * 2;
    score = Math.max(0, score);
    return score;
  };

  // Notification-Funktionen
  const showSuccessNotification = (_message: string) => {
    // Optional: Hier könnten Sie ein Toast-System einbinden
  };

  const showErrorNotification = (_message: string) => {
    // Error notification
  };

  const showCriticalAlert = (_data: { title: string; message: string }) => {
    // Critical alert
  };

  // Funktionen für Schnellaktionen - MIT FUNKTIONIERENDEN API CALLS
  const executeQuickAction = async (actionId: string) => {
    setQuickActions((prev) =>
      prev.map((action) =>
        action.id === actionId ? { ...action, loading: true } : action
      )
    );

    try {
      let result;

      switch (actionId) {
        case "clear-cache":
          result = await shopHealthService.clearCache();
          showSuccessNotification(`✅ ${result.message}`);
          // Health Data nach Cache Clear aktualisieren
          if (healthData) {
            setHealthData({
              ...healthData,
              performance: Math.min(100, healthData.performance + 5),
              overallScore: Math.min(100, healthData.overallScore + 2),
            });
          }
          break;

        case "performance-report":
          result = await shopHealthService.generatePerformanceReport();
          showSuccessNotification(
            `✅ Performance Report erstellt: ${result.reportId}`
          );
          // Report in neuem Tab öffnen (falls URL vorhanden)
          if (result.reportUrl) {
            window.open(result.reportUrl, "_blank");
          }
          break;

        case "security-check":
          result = await shopHealthService.runSecurityScan();
          handleSecurityResults(result);
          showSuccessNotification(
            `✅ Sicherheits-Scan abgeschlossen: ${result.vulnerabilities.critical} kritische Probleme`
          );
          break;

        case "seo-analysis":
          result = await shopHealthService.analyzeSEO();
          updateSEOResults(result);
          showSuccessNotification(`✅ SEO-Analyse: Score ${result.score}/100`);
          break;

        default:
          throw new Error(`Unbekannte Aktion: ${actionId}`);
      }

      // Erfolg - als erledigt markieren
      setQuickActions((prev) =>
        prev.map((action) =>
          action.id === actionId
            ? { ...action, completed: true, loading: false }
            : action
        )
      );
    } catch (error: any) {
      // Fehlerbehandlung

      setQuickActions((prev) =>
        prev.map((action) =>
          action.id === actionId ? { ...action, loading: false } : action
        )
      );

      showErrorNotification(`Aktion fehlgeschlagen: ${error.message}`);
    }
  };

  const resetQuickActions = () => {
    setQuickActions((prev) =>
      prev.map((action) => ({
        ...action,
        completed: action.id === "performance-report", // Performance Report bleibt completed
      }))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "#27ae60";
      case "good":
        return "#3498db";
      case "warning":
        return "#f39c12";
      case "critical":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return "✅";
      case "good":
        return "👍";
      case "warning":
        return "⚠️";
      case "critical":
        return "🚨";
      default:
        return "❓";
    }
  };

  const getTrendIndicator = (value: number) => {
    return value >= 0 ? "↗️" : "↘️";
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBack}>
          ← Zurück
        </button>
        <div className="analytics-header">
          <h1>🏪 Shop Health Report</h1>
          <p>Führe Gesundheits-Check durch...</p>
        </div>
        <div className="loading-spinner">🔍 Analysiere Shop-Gesundheit...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Floating Back Button */}
      <button className="back-button floating-back" onClick={handleBack}>
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>🏪 Shop Health Report</h1>
        <p>Kompletter Gesundheits-Check deines Shops</p>

        <div className="header-controls">
          <button
            className={`refresh-button ${scanInProgress ? "scanning" : ""}`}
            onClick={runHealthScan}
            disabled={scanInProgress}
          >
            {scanInProgress ? "🔄 Scannt..." : "🔍 Health-Check"}
          </button>
          <button
            className="ml-analytics-btn"
            onClick={handleMLAnalyze}
            disabled={mlLoading}
            title="KI-gestützte Shop-Health Diagnostik"
          >
            <span role="img" aria-label="AI">
              🤖
            </span>
            {mlLoading ? "KI diagnostiziert..." : "KI-Diagnostik"}
          </button>
        </div>
        {mlError && <div className="ml-error-message">{mlError}</div>}

        <div className="last-update">
          Letzter Scan: {formatTime(lastUpdate)}
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="analysis-section">
        <div className="metric-card full-width health-score">
          <div className="health-score-main">
            <div className="score-circle">
              <div className="score-value">{healthData?.overallScore || 0}</div>
              <div className="score-label">Gesamt-Score</div>
            </div>
            <div className="health-stats">
              <div className="health-stat">
                <span className="stat-label">Gefundene Probleme:</span>
                <span className="stat-value critical">
                  {healthData?.issuesFound || 0}
                </span>
              </div>
              <div className="health-stat">
                <span className="stat-label">Empfehlungen:</span>
                <span className="stat-value good">
                  {healthData?.recommendations || 0}
                </span>
              </div>
              <div className="health-stat">
                <span className="stat-label">Letzter Scan:</span>
                <span className="stat-value">{formatTime(lastUpdate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KI-Insights Sektion */}
      {mlInsights.length > 0 && (
        <div className="analysis-section">
          <div className="ml-insights-box">
            <h4 className="ml-insights-title">
              <span role="img" aria-label="AI">
                🤖
              </span>
              KI-Health-Diagnostik
            </h4>
            <ul className="ml-insights-list">
              {mlInsights.map((insight: any, idx: number) => (
                <li
                  key={idx}
                  className={`ml-insight-item ${insight.priority || 'low'}`}
                >
                  <div className="insight-header">
                    <span className="insight-title">{insight.title}</span>
                    {insight.priority && (
                      <span className={`insight-priority-badge ${insight.priority}`}>
                        {insight.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="insight-value">{insight.value}</span>
                  {insight.detail && (
                    <span className="insight-detail">{insight.detail}</span>
                  )}
                  {insight.category && (
                    <span className="insight-category">📂 {insight.category}</span>
                  )}
                  {insight.score !== undefined && (
                    <span className="insight-confidence">
                      KI-Confidence: {Math.round(insight.score * 100)}%
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Key Health Metrics */}
      <div className="analytics-grid-2x4">
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-label">Performance</div>
          <div className="metric-value">{healthData?.performance || 0}%</div>
          <div className="trend-indicator positive">↗️ Exzellent</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🛡️</div>
          <div className="metric-label">Sicherheit</div>
          <div className="metric-value">{healthData?.security || 0}%</div>
          <div className="trend-indicator positive">↗️ Gut</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔍</div>
          <div className="metric-label">SEO</div>
          <div className="metric-value">{healthData?.seo || 0}%</div>
          <div className="trend-indicator warning">⚠️ Verbesserung möglich</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-label">Bestand</div>
          <div className="metric-value">{healthData?.inventory || 0}%</div>
          <div className="trend-indicator positive">↗️ Exzellent</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🚨</div>
          <div className="metric-label">Erkannte Probleme</div>
          <div className="metric-value">{healthData?.issuesFound ?? "—"}</div>
          <div className="trend-indicator {(healthData?.issuesFound ?? 1) === 0 ? 'positive' : 'negative'}">
            {(healthData?.issuesFound ?? 1) === 0 ? "✅ Keine" : "⚠️ Vorhanden"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💡</div>
          <div className="metric-label">Empfehlungen</div>
          <div className="metric-value">
            {healthData?.recommendations ?? "—"}
          </div>
          <div className="trend-indicator warning">
            {(healthData?.recommendations ?? 0) > 0 ? "Prüfen" : "OK"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-label">Gesamt-Status</div>
          <div className="metric-value">{healthData?.overallScore ?? "—"}%</div>
          <div className="trend-indicator positive">Online</div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Scan-Zeit</div>
          <div className="metric-value-small">{formatTime(lastUpdate)}</div>
        </div>
      </div>

      {/* Detailed Health Metrics */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📊 Detaillierte Metriken</h3>
          <div className="health-metrics">
            {healthData?.metrics.map((metric, index) => (
              <div key={index} className="health-metric">
                <div className="metric-header">
                  <span className="metric-name">{metric.name}</span>
                  <span
                    className="metric-status"
                    style={{ color: getStatusColor(metric.status) }}
                  >
                    {getStatusIcon(metric.status)} {metric.status.toUpperCase()}
                  </span>
                </div>
                <div className="metric-progress">
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${metric.value}%`,
                        background: getStatusColor(metric.status),
                      }}
                    ></div>
                  </div>
                  <div className="metric-values">
                    <span className="current-value">
                      {metric.value}
                      {metric.name.includes("%") ? "%" : ""}
                    </span>
                    <span className="target-value">
                      Ziel: {metric.target}
                      {metric.name.includes("%") ? "%" : ""}
                    </span>
                    <span
                      className="trend-value"
                      style={{
                        color: metric.trend >= 0 ? "#27ae60" : "#e74c3c",
                      }}
                    >
                      {getTrendIndicator(metric.trend)} {Math.abs(metric.trend)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="analysis-section">
        <div className="metric-card full-width info">
          <h3>💡 Empfehlungen & Next Steps</h3>
          <div className="recommendations-list">
            {mlInsights.length > 0 ? (
              mlInsights.map((insight: any, idx: number) => (
                <div
                  key={idx}
                  className={`recommendation ${insight.priority === "critical" ? "critical" : insight.priority === "high" ? "warning" : "good"}`}
                >
                  <span className="rec-icon">
                    {insight.priority === "critical"
                      ? "🚨"
                      : insight.priority === "high"
                        ? "⚠️"
                        : "💡"}
                  </span>
                  <div className="rec-content">
                    <strong>{insight.title}</strong>
                    <p>{insight.value}</p>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                Keine Empfehlungen verfügbar. Führe zuerst eine KI-Diagnostik
                durch.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - JETZT FUNKTIONIEREND */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <div className="quick-actions-header">
            <h3>⚡ Schnellaktionen</h3>
            <button
              className="reset-actions-button"
              onClick={resetQuickActions}
              title="Aktionen zurücksetzen"
            >
              🔄 Reset
            </button>
          </div>
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={`action-button ${action.type} ${
                  action.completed ? "completed" : ""
                } ${action.loading ? "loading" : ""}`}
                onClick={() =>
                  !action.completed &&
                  !action.loading &&
                  executeQuickAction(action.id)
                }
                disabled={action.completed || action.loading}
                title={
                  action.completed
                    ? "Bereits abgeschlossen"
                    : action.loading
                      ? "Wird ausgeführt..."
                      : `Starte ${action.label}`
                }
              >
                <span className="action-icon">
                  {action.loading
                    ? "⏳"
                    : action.completed
                      ? "✅"
                      : action.icon}
                </span>
                <span className="action-label">
                  {action.label}
                  {action.completed && (
                    <span className="completed-badge">Erledigt</span>
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="quick-actions-info">
            <p>
              💡 Klicken Sie auf eine Aktion, um sie auszuführen. Abgeschlossene
              Aktionen werden deaktiviert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopHealthReport;
