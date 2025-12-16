import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/i18n-utils";
import "./page.css";

interface ReportData {
  totalReports?: number;
  automatedReports?: number;
  manualReports?: number;
  exportSuccess?: number;
  scheduledReports?: number;
  realTimeReports?: number;
  avgReportTime?: string;
  lastUpdated?: string;
  recentReports?: Array<{
    title?: string;
    name?: string;
    createdAt?: string;
    date?: string;
    status?: string;
  }>;
}

interface Insight {
  type: string;
  title?: string;
  value?: string;
  detail?: string;
  score?: number;
}

interface NextStep {
  title?: string;
  description?: string;
  criticality?: string;
}

interface SummaryDetails {
  overallScore?: number;
  trend?: string;
  recommendation?: string;
}

const ConversionReported = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [realTimeInterval, setRealTimeInterval] = useState("5min");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryDetails, setSummaryDetails] = useState<SummaryDetails | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        let base = (import.meta.env.VITE_API_URL || "").trim();
        if (base.endsWith("/")) base = base.slice(0, -1);
        const apiUrl = base
          ? `${base}/api/analytics/conversion/ml/report-analysis`
          : `/api/analytics/conversion/ml/report-analysis`;

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getReportStats" }),
        });

        if (!res.ok) throw new Error("Failed to fetch report data");
        const data = await res.json();

        setReportData({
          totalReports: data.totalReports || 0,
          automatedReports: data.automatedReports || 0,
          manualReports: data.manualReports || 0,
          exportSuccess: data.exportSuccess || 0,
          scheduledReports: data.scheduledReports || 0,
          realTimeReports: data.realTimeReports || 0,
          avgReportTime: data.avgReportTime || "0min",
          lastUpdated: new Date().toISOString(),
        });
      } catch (_err) {
        setError("Fehler beim Laden der Report-Daten");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // KI/ML-Analyse: API-Call
  const handleAnalyzeAI = async () => {
    setInsightLoading(true);
    setInsightError(null);
    setInsights([]);
    setNextSteps([]);
    setSummary(null);
    setSummaryDetails(null);
    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/conversion/ml/report-analysis`
        : `/api/analytics/conversion/ml/report-analysis`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportData }),
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      setInsights(data.mlInsights || []);
      setNextSteps(data.nextSteps || []);
      setSummary(typeof data.summary === "string" ? data.summary : null);
      setSummaryDetails(data.summaryDetails || null);
    } catch (_err: any) {
      setInsightError("Fehler bei der KI-Analyse");
    } finally {
      setInsightLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  // ECHTER Datei-Download mit echten Daten vom Backend
  const handleExport = async (format: string) => {
    if (!reportData) {
      alert("Keine Report-Daten verfügbar");
      return;
    }

    setActiveAction("exporting");

    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/conversion/ml/report-analysis`
        : `/api/analytics/conversion/ml/report-analysis`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export", format, reportData }),
      });

      if (!res.ok) throw new Error("Export fehlgeschlagen");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `conversion-report-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xls" : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("✅ Report erfolgreich exportiert!");
    } catch (_err) {
      alert("❌ Fehler beim Export");
    } finally {
      setActiveAction(null);
    }
  };

  // Schedule Report mit echtem Backend
  const handleScheduleReport = async () => {
    setActiveAction("scheduling");

    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/conversion/ml/schedule`
        : `/api/analytics/conversion/ml/schedule`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleTime,
          frequency: "daily",
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Scheduling fehlgeschlagen");

      alert(`✅ Report wurde für ${scheduleTime} Uhr täglich geplant!`);
      setActiveAction(null);
    } catch (_err) {
      setError("Fehler beim Erstellen der Planung");
      setActiveAction(null);
    }
  };

  // Email Report mit echtem Backend
  const handleEmailReport = async () => {
    if (!emailRecipient) {
      alert("Bitte E-Mail Adresse eingeben!");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailRecipient)) {
      alert("Bitte gültige E-Mail Adresse eingeben!");
      return;
    }

    setActiveAction("emailing");

    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/conversion/ml/email`
        : `/api/analytics/conversion/ml/email`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: emailRecipient,
          reportData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Email-Versand fehlgeschlagen");

      alert(`✅ Report wurde an ${emailRecipient} gesendet!`);
      setEmailRecipient("");
      setActiveAction(null);
    } catch (_err) {
      setError("Fehler beim E-Mail-Versand");
      setActiveAction(null);
    }
  };

  // Real-Time Generierung mit echtem Backend
  const handleGenerateRealTime = async () => {
    setActiveAction("generating");

    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/conversion/ml/generate-realtime`
        : `/api/analytics/conversion/ml/generate-realtime`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interval: realTimeInterval,
          includeAI: true,
        }),
      });

      if (!res.ok) throw new Error("Real-Time Generierung fehlgeschlagen");

      const newReport = await res.json();
      setReportData(newReport);
      alert(
        `✅ Echtzeit-Report wurde generiert (Intervall: ${realTimeInterval})!`
      );
      setActiveAction(null);
    } catch (_err) {
      setError("Fehler bei Real-Time Generierung");
      setActiveAction(null);
    }
  };

  if (loading)
    return <div className="loading-spinner">📋 Loading Reports...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

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
        <h1>📋 Conversion Reported</h1>
        <p>
          Automatische Conversion-Reports, Export und jetzt KI-gestützte
          Analyse!
        </p>
      </div>

      {/* Metriken 2x4 Grid */}
      <div className="analytics-grid-2x4" style={{ marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-label">Total Reports</div>
          <div className="metric-value">{reportData?.totalReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🤖</div>
          <div className="metric-label">Automated</div>
          <div className="metric-value">
            {reportData?.automatedReports || 0}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">👨‍💼</div>
          <div className="metric-label">Manual</div>
          <div className="metric-value">{reportData?.manualReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📤</div>
          <div className="metric-label">Export Success</div>
          <div className="metric-value">{reportData?.exportSuccess || 0}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏰</div>
          <div className="metric-label">Scheduled</div>
          <div className="metric-value">
            {reportData?.scheduledReports || 0}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-label">Real-time</div>
          <div className="metric-value">{reportData?.realTimeReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-label">Avg Time</div>
          <div className="metric-value">
            {reportData?.avgReportTime || "0min"}
          </div>
        </div>
        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {reportData?.lastUpdated
              ? formatDate(new Date(reportData.lastUpdated))
              : "N/A"}
          </div>
        </div>
      </div>

      {/* KI Analyse unter den 8 Kacheln */}
      <div className="metric-card full-width" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "1.3rem", marginBottom: 8 }}>🧠 KI-Analyse</h3>
        <p
          style={{
            marginBottom: 12,
            color: "#2563eb",
            fontSize: "0.95rem",
            lineHeight: "1.5",
          }}
        >
          Analysiere Reports automatisch und erkenne Optimierungspotenziale.
        </p>
        <button
          className="action-button primary"
          onClick={handleAnalyzeAI}
          disabled={insightLoading}
          style={{ minWidth: 220 }}
        >
          {insightLoading ? "⏳ Läuft..." : "🧠 Starten"}
        </button>
        {insightError && (
          <div
            className="error-message"
            style={{ fontSize: "0.9rem", marginTop: 10 }}
          >
            {insightError}
          </div>
        )}

        {summary && (
          <div
            style={{
              marginTop: 14,
              padding: "12px",
              background: "#f8f9fa",
              borderRadius: 8,
              borderLeft: "3px solid #3498db",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                color: "#2c3e50",
                lineHeight: "1.6",
                marginBottom: 8,
              }}
            >
              {summary}
            </div>
            {summaryDetails && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  fontSize: "0.85rem",
                }}
              >
                {summaryDetails.overallScore !== undefined && (
                  <span
                    style={{
                      background: "#e3f2fd",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    Score: {summaryDetails.overallScore}
                  </span>
                )}
                {summaryDetails.trend && (
                  <span
                    style={{
                      background: "#e8f5e9",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    {summaryDetails.trend === "positive"
                      ? "📈 Positiv"
                      : summaryDetails.trend === "negative"
                        ? "📉 Negativ"
                        : "➡️ Neutral"}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KI Insights */}
      {Array.isArray(insights) && insights.length > 0 && (
        <div className="analytics-grid-2x4" style={{ marginBottom: 20 }}>
          {insights.map((insight: any, i) => (
            <div className="metric-card" key={i}>
              <div className="metric-icon" style={{ fontSize: "2rem" }}>
                {insight.type === "trend" && "📈"}
                {insight.type === "segment" && "🧩"}
                {insight.type === "forecast" && "🔮"}
                {insight.type === "anomaly" && "⚠️"}
                {insight.type === "conversion" && "🎯"}
                {!insight.type && "💡"}
              </div>
              <div
                className="metric-label"
                style={{ fontSize: "1rem", fontWeight: 700 }}
              >
                {insight.title || insight.type || "Insight"}
              </div>
              <div
                className="metric-value"
                style={{ fontSize: "0.95rem", lineHeight: "1.5" }}
              >
                {insight.description || insight.value || insight.detail || ""}
              </div>
              {(insight.confidence !== undefined ||
                insight.score !== undefined) && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "6px 10px",
                    background: "#e8f4fd",
                    borderRadius: 6,
                    color: "#2563eb",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  ✓{" "}
                  {insight.confidence || Math.round((insight.score || 0) * 100)}
                  % Konfidenz
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Steps / Empfehlungen */}
      {Array.isArray(nextSteps) && nextSteps.length > 0 && (
        <div className="next-steps" style={{ marginBottom: 20 }}>
          <h4>🚀 Empfohlene Next Steps</h4>
          {nextSteps.map((step, i) => (
            <div className={`next-step ${step.criticality || "good"}`} key={i}>
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

      {/* Report Actions Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🚀 Report Actions</h3>
          <div
            className="actions-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {/* Export Current Report */}
            <div className="action-group">
              <h4>📥 Export Current Report</h4>
              <div className="format-selector">
                {["pdf", "excel", "csv", "json"].map((format) => (
                  <button
                    key={format}
                    className={`format-button ${exportFormat === format ? "active" : ""}`}
                    onClick={() => setExportFormat(format)}
                    disabled={activeAction !== null}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                className="action-button primary"
                onClick={() => handleExport(exportFormat)}
                disabled={activeAction !== null}
              >
                {activeAction === "exporting"
                  ? "⏳ Exporting..."
                  : `📥 Export as ${exportFormat.toUpperCase()}`}
              </button>
            </div>
            {/* Schedule New Report */}
            <div className="action-group">
              <h4>⏰ Schedule New Report</h4>
              <div className="input-group">
                <label>Uhrzeit:</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={activeAction !== null}
                />
              </div>
              <button
                className="action-button secondary"
                onClick={handleScheduleReport}
                disabled={activeAction !== null}
              >
                {activeAction === "scheduling"
                  ? "⏳ Scheduling..."
                  : "⏰ Schedule Report"}
              </button>
            </div>
            {/* Email Report */}
            <div className="action-group">
              <h4>📧 Email Report</h4>
              <div className="input-group">
                <label>Empfänger:</label>
                <input
                  type="email"
                  placeholder="email@beispiel.de"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  disabled={activeAction !== null}
                />
              </div>
              <button
                className="action-button secondary"
                onClick={handleEmailReport}
                disabled={activeAction !== null}
              >
                {activeAction === "emailing"
                  ? "⏳ Sending..."
                  : "📧 Send Report"}
              </button>
            </div>
            {/* Generate Real-time */}
            <div className="action-group">
              <h4>🔄 Generate Real-time</h4>
              <div className="input-group">
                <label>Intervall:</label>
                <select
                  value={realTimeInterval}
                  onChange={(e) => setRealTimeInterval(e.target.value)}
                  disabled={activeAction !== null}
                >
                  <option value="1min">1 Minute</option>
                  <option value="5min">5 Minuten</option>
                  <option value="15min">15 Minuten</option>
                  <option value="30min">30 Minuten</option>
                </select>
              </div>
              <button
                className="action-button secondary"
                onClick={handleGenerateRealTime}
                disabled={activeAction !== null}
              >
                {activeAction === "generating"
                  ? "⏳ Generating..."
                  : "🔄 Generate Real-time"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports Sektion - ECHTE DATEN VOM BACKEND */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📈 Recent Reports</h3>
          {reportData && (
            <div className="reports-list">
              {reportData.recentReports &&
              reportData.recentReports.length > 0 ? (
                reportData.recentReports.map((report: any, idx: number) => (
                  <div className="report-item" key={idx}>
                    <span className="report-name">
                      {report.title || report.name || `Report ${idx + 1}`}
                    </span>
                    <span className="report-date">
                      {formatDate(new Date(report.createdAt || report.date))}
                    </span>
                    <span
                      className={`report-status ${report.status === "live" ? "live" : "completed"}`}
                    >
                      {report.status === "live"
                        ? "🟢 Live"
                        : "✅ " + (report.status || "Completed")}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  📭 Keine bisherigen Reports vorhanden. Erstellen Sie den
                  ersten Report!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversionReported;
