// KI Insight Typen
interface KIInsight {
  title: string;
  value: string;
  detail?: string;
  score?: number;
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatNumber, formatTime } from "../../lib/i18n-utils";
import "./page.css";

interface RealTimeData {
  totalProducts: number | null;
  totalOrders: number | null;
  totalCustomers: number | null;
  todaySales: number | null;
  conversionRate: number | null;
  activeSessions: number | null;
  popularProduct: string;
  lastUpdated: string;
}

const RealAnalytics = () => {
  const [kiLoading, setKiLoading] = useState(false);
  const [kiError, setKiError] = useState<string | null>(null);
  const [kiInsights, setKiInsights] = useState<KIInsight[]>([]);
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Holt die aktuellen Shopdaten
  const fetchRealTimeData = async () => {
    setLoading(true);
    setDataError(null);
    try {
      const apiUrl = `/api/analytics/real-time/dashboard`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-woocommerce-key":
            import.meta.env.VITE_WOOCOMMERCE_CONSUMER_KEY || "",
          "x-woocommerce-secret":
            import.meta.env.VITE_WOOCOMMERCE_CONSUMER_SECRET || "",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      if (!(data.success && data.data)) {
        throw new Error(data?.error || "API returned error");
      }

      setRealTimeData({
        totalProducts: data.data.totalProducts ?? null,
        totalOrders: data.data.totalOrders ?? null,
        totalCustomers: data.data.totalCustomers ?? null,
        todaySales: data.data.todaySales ?? null,
        conversionRate: data.data.conversionRate ?? null,
        activeSessions:
          data.data.activeUsers ?? data.data.activeSessions ?? null,
        popularProduct: data.data.popularProduct || "Keine Daten",
        lastUpdated: data.data.lastUpdated || new Date().toISOString(),
      });
    } catch (error: any) {

      setDataError(
        error?.message || "Echtzeit-Daten konnten nicht geladen werden"
      );
      setRealTimeData(null);
    } finally {
      setLastUpdate(new Date());
      setLoading(false);
    }
  };

  // KI/ML-Analyse für Shopdaten
  const runKIAnalysis = async () => {
    if (!realTimeData) return;
    setKiLoading(true);
    setKiError(null);
    setKiInsights([]);
    try {
      const apiUrl = `/api/analytics/ml/generate`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(realTimeData),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.insights)) {
          const normalized = data.insights.map((insight: any) => ({
            title: insight.title || insight.category || "Insight",
            value: insight.value || insight.finding || insight.reason || "",
            detail: insight.detail || insight.recommendation || insight.reason,
            score:
              typeof insight.score === "number"
                ? insight.score
                : typeof insight.confidence === "number"
                  ? insight.confidence / 100
                  : undefined,
          }));
          setKiInsights(normalized);
        } else {
          setKiError("Keine KI-Insights erhalten.");
        }
      } else {
        setKiError("Fehler beim KI-Analyse-Request.");
      }
    } catch (_err) {
      setKiError("Fehler bei der KI-Analyse.");
    } finally {
      setKiLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData();

    let interval: number;
    if (autoRefresh) {
      interval = window.setInterval(fetchRealTimeData, 30000); // Alle 30 Sekunden
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const safeFormatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || Number.isNaN(amount))
      return "–";
    return formatCurrency(amount);
  };

  const safeFormatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value))
      return "–";
    return formatNumber(value);
  };

  if (loading && !realTimeData) {
    return <div className="loading-spinner">🔍 Lade Echtzeit-Daten...</div>;
  }

  return (
    <div className="analytics-page">
      <button
        className="back-button floating-back"
        onClick={handleBackToDashboard}
      >
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>🔍 Real Analytics</h1>
        <p>Echtzeit-Daten aus deinem WooCommerce Shop</p>

        <div className="header-controls">
          <button
            className={`refresh-button ${autoRefresh ? "active" : ""}`}
            onClick={toggleAutoRefresh}
          >
            {autoRefresh ? "🔄 Auto-Refresh ON" : "⏸️ Auto-Refresh OFF"}
          </button>
          <button
            className="refresh-button"
            onClick={fetchRealTimeData}
            disabled={loading}
          >
            {loading ? "⏳ Lade..." : "🔄 Aktualisieren"}
          </button>
        </div>

        <div className="last-update">
          Letztes Update: {formatTime(lastUpdate)}
        </div>
        {dataError && (
          <div
            className="error-message"
            style={{ marginTop: 12, textAlign: "center" }}
          >
            ⚠️ {dataError}
          </div>
        )}
        <div style={{ marginTop: 16, marginBottom: 8, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <button
            className="action-button primary"
            onClick={runKIAnalysis}
            disabled={kiLoading || !realTimeData}
            style={{ fontSize: "1.1em", padding: "10px 24px" }}
          >
            {kiLoading ? "⏳ KI-Analyse läuft..." : "🧠 KI-Analyse starten"}
          </button>
          {kiError && (
            <div
              className="error-message"
              style={{ marginTop: 8, textAlign: "center" }}
            >
              {kiError}
            </div>
          )}
        </div>
      </div>

      {/* Echtzeit Metrics Grid mit REALEN DATEN */}
      <div className="analytics-grid-2x4">
        <div className="metric-card real-time">
          <div className="metric-icon">📦</div>
          <div className="metric-label">Produkte</div>
          <div className="metric-value">
            {safeFormatNumber(realTimeData?.totalProducts)}
          </div>
          <div className="real-time-indicator">
            <span className="pulse">🟢</span>{" "}
            {realTimeData ? "Verfügbar" : "Keine Daten"}
          </div>
        </div>

        <div className="metric-card real-time">
          <div className="metric-icon">🛒</div>
          <div className="metric-label">Bestellungen</div>
          <div className="metric-value">
            {safeFormatNumber(realTimeData?.totalOrders)}
          </div>
          <div className="trend-indicator positive">
            {realTimeData ? "Aus WooCommerce" : "Keine Daten"}
          </div>
        </div>

        <div className="metric-card real-time">
          <div className="metric-icon">👥</div>
          <div className="metric-label">Kunden</div>
          <div className="metric-value">
            {safeFormatNumber(realTimeData?.totalCustomers)}
          </div>
          <div className="real-time-indicator">
            {realTimeData?.totalCustomers ? "Registriert" : "Keine Daten"}
          </div>
        </div>

        <div className="metric-card real-time">
          <div className="metric-icon">💰</div>
          <div className="metric-label">Heutiger Umsatz</div>
          <div className="metric-value">
            {safeFormatCurrency(realTimeData?.todaySales)}
          </div>
          <div className="trend-indicator">
            {realTimeData?.todaySales ? "📈 Verkäufe" : "Keine Daten"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">
            {safeFormatNumber(realTimeData?.conversionRate)}%
          </div>
          <div className="trend-indicator">Basierend auf Besuchern</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-label">Aktive Sessions</div>
          <div className="metric-value">
            {safeFormatNumber(realTimeData?.activeSessions)}
          </div>
          <div className="trend-indicator">
            {realTimeData?.activeSessions ? "Gemessen" : "Nicht gemessen"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-label">Beliebtestes Produkt</div>
          <div className="metric-value-small">
            {realTimeData?.popularProduct || "N/A"}
          </div>
          <div className="trend-indicator">
            {realTimeData?.popularProduct !== "Nicht getrackt"
              ? "Top Seller"
              : "Nicht getrackt"}
          </div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Datenstand</div>
          <div className="metric-value-small">
            {realTimeData?.lastUpdated
              ? formatTime(new Date(realTimeData.lastUpdated))
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Verfügbare Daten Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📊 Verfügbare Datenquellen</h3>
          <div className="data-sources-grid">
            <div className="data-source available">
              <span className="source-icon">📦</span>
              <div>
                <strong>Produkt-Daten</strong>
                <p>
                  {formatNumber(realTimeData?.totalProducts ?? 0)} Produkte in
                  Datenbank
                </p>
              </div>
            </div>

            <div className="data-source available">
              <span className="source-icon">🛒</span>
              <div>
                <strong>Bestellungen</strong>
                <p>
                  {formatNumber(realTimeData?.totalOrders ?? 0)} WooCommerce
                  Bestellungen
                </p>
              </div>
            </div>

            <div
              className={`data-source ${realTimeData?.totalCustomers ? "available" : "limited"}`}
            >
              <span className="source-icon">👥</span>
              <div>
                <strong>Kunden-Daten</strong>
                <p>
                  {formatNumber(realTimeData?.totalCustomers ?? 0)} registrierte
                  Kunden
                </p>
              </div>
            </div>

            <div
              className={`data-source ${realTimeData?.todaySales ? "available" : "limited"}`}
            >
              <span className="source-icon">💰</span>
              <div>
                <strong>Umsatz-Daten</strong>
                <p>
                  {formatCurrency(realTimeData?.todaySales ?? 0)} heutiger
                  Umsatz
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daten-Qualität Hinweis */}
      <div className="analysis-section">
        <div className="metric-card full-width info">
          <h3>ℹ️ Datenstatus</h3>
          <p>
            <strong>
              Diese Analytics zeigen ausschließlich reale Daten aus deinem
              WooCommerce Shop.
            </strong>
            <br />
            Aktuell verfügbar: Produkte, Bestellungen und Basis-Metriken.
            <br />
            Erweiterte Tracking-Funktionen können bei Bedarf integriert werden.
          </p>
        </div>
        {/* KI/ML-Insights Sektion */}
        {kiInsights.length > 0 && (
          <div className="metric-card full-width" style={{ marginTop: 24 }}>
            <h3>🧠 KI-Insights</h3>
            <div className="insights-list">
              {kiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="insight-item live"
                  style={{ marginBottom: 12 }}
                >
                  <div style={{ fontWeight: 600 }}>{insight.title}</div>
                  <div>{insight.value}</div>
                  {insight.detail && (
                    <div style={{ color: "#343a40", fontSize: "0.95rem" }}>{insight.detail}</div>
                  )}
                  {insight.score !== undefined && (
                    <div style={{ color: "white", fontWeight: 700 }}>
                      KI-Score: {Math.round(insight.score * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealAnalytics;
