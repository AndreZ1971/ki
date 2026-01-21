// src/pages/analytics/ShopMetrics.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/i18n-utils";
import "./page.css";

interface MetricsData {
  totalSales?: number;
  todaySales?: number;
  totalOrders?: number;
  todayOrders?: number;
  totalCustomers?: number;
  totalProducts?: number;
  conversionRate?: number;
  lastUpdated?: string;
}

interface MLInsight {
  type: string;
  title: string;
  value: string;
  score?: number;
  detail?: string;
  priority?: "critical" | "high" | "medium" | "low";
  category?: string;
}

const ShopMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // KI/ML-Analyse States
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlInsights, setMlInsights] = useState<MLInsight[]>([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const apiUrl = `/api/analytics/metrics/dashboard`;


      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError("Failed to load metrics");
      }
    } catch (err) {
      setError("Connection error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  // KI/ML-Analyse: Shop Metrics mit KI-Insights
  const handleMLAnalyze = async () => {
    setMlLoading(true);
    setMlError(null);
    setMlInsights([]);
    try {
      const apiUrl = `/api/analytics/metrics/ml-analysis`;

      const payload = {
        metrics: metrics || {
          totalSales: 50000,
          todaySales: 2500,
          totalOrders: 850,
          todayOrders: 45,
          totalCustomers: 1200,
          totalProducts: 450,
          conversionRate: 3.2,
          lastUpdated: new Date().toISOString(),
        },
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

  if (loading)
    return <div className="loading-spinner">📊 Loading Metrics...</div>;
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
        <h1>📊 Live Shop Metrics</h1>
        <p>Echtzeit-Kennzahlen deines Shops</p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "12px",
          }}
        >
          <button
            className="ml-analytics-btn"
            onClick={handleMLAnalyze}
            disabled={mlLoading}
            title="KI-gestützte Shop-Metriken Analyse"
            style={{
              fontSize: "1em",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: mlLoading ? "not-allowed" : "pointer",
              opacity: mlLoading ? 0.5 : 1,
            }}
          >
            <span role="img" aria-label="AI" style={{ fontSize: "1.2em" }}>
              🤖
            </span>
            {mlLoading ? "KI analysiert..." : "KI-Analyse"}
          </button>
        </div>
        {mlError && (
          <div style={{ color: "#e74c3c", marginTop: "8px" }}>{mlError}</div>
        )}
      </div>

      {/* KI-Insights Sektion */}
      {mlInsights.length > 0 && (
        <div className="analysis-section" style={{ marginBottom: "30px" }}>
          <div
            style={{
              marginBottom: 24,
              padding: "20px",
              background: "rgba(102,126,234,0.05)",
              borderRadius: 12,
              border: "2px solid rgba(102,126,234,0.2)",
            }}
          >
            <h4
              style={{
                marginBottom: 16,
                color: "#667eea",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span role="img" aria-label="AI">
                🤖
              </span>
              KI-Metriken-Analyse
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {mlInsights.map((insight: any, idx: number) => (
                <li
                  key={idx}
                  style={{
                    background:
                      insight.priority === "critical"
                        ? "rgba(231,76,60,0.1)"
                        : insight.priority === "high"
                          ? "rgba(230,126,34,0.1)"
                          : insight.priority === "medium"
                            ? "rgba(241,196,15,0.08)"
                            : "#f6f8fa",
                    borderLeft: `4px solid ${
                      insight.priority === "critical"
                        ? "#e74c3c"
                        : insight.priority === "high"
                          ? "#e67e22"
                          : insight.priority === "medium"
                            ? "#f1c40f"
                            : "white"
                    }`,
                    borderRadius: 8,
                    marginBottom: 12,
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(102,126,234,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#667eea",
                        fontSize: "1.05em",
                      }}
                    >
                      {insight.title}
                    </span>
                    {insight.priority && (
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: "0.85em",
                          fontWeight: 600,
                          background:
                            insight.priority === "critical"
                              ? "#e74c3c"
                              : insight.priority === "high"
                                ? "#e67e22"
                                : insight.priority === "medium"
                                  ? "#f1c40f"
                                  : "#27ae60",
                          color: "#fff",
                        }}
                      >
                        {insight.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "1.08em",
                      color: "#222",
                      lineHeight: 1.5,
                    }}
                  >
                    {insight.value}
                  </span>
                  {insight.detail && (
                    <span
                      style={{
                        color: "#6c757d",
                        fontSize: "0.95em",
                        marginTop: 4,
                      }}
                    >
                      {insight.detail}
                    </span>
                  )}
                  {insight.category && (
                    <span
                      style={{
                        color: "#764ba2",
                        fontSize: "0.9em",
                        fontWeight: 500,
                      }}
                    >
                      📂 {insight.category}
                    </span>
                  )}
                  {insight.score !== undefined && (
                    <span
                      style={{
                        color: "#764ba2",
                        fontWeight: 600,
                        fontSize: "0.95em",
                      }}
                    >
                      KI-Confidence: {Math.round(insight.score * 100)}%
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* KORRIGIERT: 2x4 Grid Layout - 2 Reihen, 4 Spalten */}
      <div className="analytics-grid-2x4">
        {/* Erste Reihe - 4 Karten nebeneinander */}
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-label">Total Sales</div>
          <div className="metric-value">${metrics?.totalSales || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-label">Today's Sales</div>
          <div className="metric-value">${metrics?.todaySales || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🛒</div>
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">{metrics?.totalOrders || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-label">Today's Orders</div>
          <div className="metric-value">{metrics?.todayOrders || 0}</div>
        </div>

        {/* Zweite Reihe - 4 Karten nebeneinander */}
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-label">Total Customers</div>
          <div className="metric-value">{metrics?.totalCustomers || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📱</div>
          <div className="metric-label">Total Products</div>
          <div className="metric-value">{metrics?.totalProducts || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">{metrics?.conversionRate || 0}%</div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {metrics?.lastUpdated
              ? formatDate(new Date(metrics.lastUpdated))
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopMetrics;
