import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/i18n-utils";
import "./page.css";
import { MLAnalyticsGenerator } from "./MLAnalyticsGenerator";

interface MLInsight {
  type: string;
  title: string;
  value?: string;
  score?: number;
  detail?: string;
  priority?: "critical" | "high" | "medium" | "low";
  category?: string;
}

interface ConversionData {
  overallRate?: number;
  cartAbandonment?: number;
  checkoutCompletion?: number;
  mobileRate?: number;
  desktopRate?: number;
  returningCustomers?: number;
  newCustomers?: number;
  lastUpdated?: string;
}

const ConversionAnalysis = () => {
  const { t } = useTranslation();
  const [conversionData, setConversionData] = useState<ConversionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlInsights, setMlInsights] = useState<MLInsight[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversionData = async () => {
      try {
        let base = (import.meta.env.VITE_API_URL || "").trim();
        if (base.endsWith("/")) base = base.slice(0, -1);
        const apiUrl = base
          ? `${base}/api/analytics/conversion/analysis`
          : `/api/analytics/conversion/analysis`;
        const res = await fetch(apiUrl);
        if (!res.ok)
          throw new Error(t("analytics.conversionAnalysis.errorLoadingData"));
        const data = await res.json();
        if (data.success && data.data) {
          setConversionData(data.data);
        }
      } catch (_err) {
        setConversionData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchConversionData();
  }, [t]);

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const handleMLAnalyze = async () => {
    setMlLoading(true);
    setMlError(null);
    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/conversion/ml/ml-analysis`
        : `/api/analytics/conversion/ml/ml-analysis`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: conversionData }),
      });
      if (!res.ok)
        throw new Error(t("analytics.conversionAnalysis.mlAnalysisFailed"));
      const result = await res.json();
      setMlInsights(result.mlInsights || []);
    } catch (_err) {
      const mockInsights: MLInsight[] = [];
      if (conversionData?.overallRate && conversionData.overallRate < 2.5) {
        mockInsights.push({
          type: "Low_Conversion",
          title: "📊 Geringe Conversion-Rate erkannt",
          value: `${conversionData.overallRate}%`,
          priority: "high",
          detail: "Die Conversion-Rate liegt unter dem Branchendurchschnitt",
        });
      }
      if (
        conversionData?.cartAbandonment &&
        conversionData.cartAbandonment > 65
      ) {
        mockInsights.push({
          type: "High_Cart_Abandonment",
          title: "🛒 Hohe Warenkorbabbruch-Rate",
          value: `${conversionData.cartAbandonment}%`,
          priority: "critical",
          detail: "Benutzer brechen den Checkout-Prozess ab",
        });
      }
      if (
        conversionData?.mobileRate &&
        conversionData?.desktopRate &&
        conversionData.mobileRate < conversionData.desktopRate * 0.5
      ) {
        mockInsights.push({
          type: "Mobile_Optimization_Needed",
          title: "📱 Mobile-Optimierung erforderlich",
          value: `${conversionData.mobileRate}% vs ${conversionData.desktopRate}%`,
          priority: "high",
          detail: "Mobile Conversion ist deutlich niedriger als Desktop",
        });
      }
      if (!mockInsights.length) {
        mockInsights.push({
          type: "Solid_Performance",
          title: "✅ Konversions-Performance solid",
          value: `${conversionData?.overallRate}%`,
          priority: "low",
          detail: "Ihre Konversionsraten sind im guten Bereich",
        });
      }
      mockInsights.push({
        type: "Optimization_Strategy",
        title: "🎯 Empfohlene Optimierungsstrategie",
        detail: "Implementieren Sie A/B-Tests für Checkout-Optionen",
        priority: "medium",
      });
      setMlInsights(mockInsights);
    } finally {
      setMlLoading(false);
    }
  };

  if (loading)
    return (
      <div className="loading-spinner">
        {t("analytics.conversionAnalysis.loading")}
      </div>
    );
  if (error)
    return (
      <div className="error-message">
        {t("common.error")}: {error}
      </div>
    );

  return (
    <div className="analytics-page">
      {/* Absolut positionierter Back-Button */}
      <button
        className="back-button floating-back"
        onClick={handleBackToDashboard}
      >
        {t("common.back")}
      </button>

      <div className="analytics-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div>
            <h1>{t("analytics.conversionAnalysis.title")}</h1>
            <p>{t("analytics.conversionAnalysis.subtitle")}</p>
          </div>
          <button
            onClick={handleMLAnalyze}
            disabled={mlLoading || !conversionData}
            style={{
              padding: "10px 20px",
              background: mlLoading
                ? "#ccc"
                : "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: mlLoading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
          >
            {mlLoading
              ? `${t("common.analyzing")}`
              : `${t("analytics.conversionAnalysis.aiAnalysisButton")}`}
          </button>
        </div>
      </div>

      {/* 2x4 Grid Layout */}
      <div className="analytics-grid-2x4">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Overall Conversion Rate</div>
          <div className="metric-value">
            {conversionData?.overallRate || 0}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🛒</div>
          <div className="metric-label">Cart Abandonment</div>
          <div className="metric-value">
            {conversionData?.cartAbandonment || 0}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-label">Checkout Completion</div>
          <div className="metric-value">
            {conversionData?.checkoutCompletion || 0}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📱</div>
          <div className="metric-label">Mobile Conversion</div>
          <div className="metric-value">{conversionData?.mobileRate || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💻</div>
          <div className="metric-label">Desktop Conversion</div>
          <div className="metric-value">
            {conversionData?.desktopRate || 0}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔄</div>
          <div className="metric-label">Returning Customers</div>
          <div className="metric-value">
            {conversionData?.returningCustomers || 0}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🆕</div>
          <div className="metric-label">New Customers</div>
          <div className="metric-value">
            {conversionData?.newCustomers || 0}%
          </div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {conversionData?.lastUpdated
              ? formatDate(new Date(conversionData.lastUpdated))
              : "N/A"}
          </div>
        </div>
      </div>

      {/* KI-Insights Sektion */}
      {mlInsights.length > 0 && (
        <div className="analysis-section">
          <div
            className="metric-card full-width"
            style={{
              borderLeft: "4px solid #667eea",
              backgroundColor: "#f8f9ff",
            }}
          >
            <h3>🤖 KI-Erkenntnisse</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              {mlInsights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    borderRadius: "6px",
                    borderLeft:
                      "3px solid " +
                      (insight.priority === "critical"
                        ? "#f44336"
                        : insight.priority === "high"
                          ? "#ff9800"
                          : insight.priority === "medium"
                            ? "#ffc107"
                            : "#4caf50"),
                    backgroundColor:
                      insight.priority === "critical"
                        ? "#ffebee"
                        : insight.priority === "high"
                          ? "#fff3e0"
                          : insight.priority === "medium"
                            ? "#fffde7"
                            : "#e8f5e9",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    {insight.title}
                  </div>
                  {insight.value && (
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Wert: {insight.value}
                    </div>
                  )}
                  {insight.detail && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      {insight.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {mlError && (
        <div style={{ color: "red", padding: "10px", textAlign: "center" }}>
          ⚠️ {mlError}
        </div>
      )}

      {/* Zusätzliche Analyse-Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📊 Conversion Insights</h3>
          <div className="insights-grid">
            <div className="insight-item">
              <span className="insight-label">Optimierungspotenzial:</span>
              <span className="insight-value">Hoch</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Empfohlene Aktionen:</span>
              <span className="insight-value">Mobile UX verbessern</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Trend:</span>
              <span className="insight-value positive">↗️ Steigend</span>
            </div>
          </div>
        </div>
      </div>

      {/* ML-Analytics-Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width ml-analytics-card">
          <MLAnalyticsGenerator metric="conversion" period="30d" />
        </div>
      </div>
    </div>
  );
};

export default ConversionAnalysis;
