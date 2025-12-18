import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatTime } from "../../lib/i18n-utils";
import "./page.css";

interface Product {
  id: number;
  name: string;
  price: string;
  description?: string;
}

interface TrendResult {
  keyword: string;
  overallScore: number;
  sources: Array<{
    source: string;
    score: number;
    metadata?: any;
  }>;
  confidence: number;
}

interface KIReport {
  report: string;
  summary: {
    total: number;
    topTrend: string;
    avgScore: number;
  };
  raw: TrendResult[];
}

const RealWebAnalytics = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [trendResults, setTrendResults] = useState<TrendResult[]>([]);
  const [kiReport, setKIReport] = useState<KIReport | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "week"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Hilfsfunktion: Produkte aus WooCommerce holen
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/products/woo/products?per_page=50`
        : `/api/products/woo/products?per_page=50`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Fehler beim Laden der Produkte");
      const data = await response.json();
      setProducts(data.data || []);
    } catch (_err) {
      setError("Produkte konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  // Produkte beim ersten Render automatisch laden
  React.useEffect(() => {
    fetchProducts();
  }, []);

  // Trend-Analyse für alle Produkte im gewählten Zeitraum
  const analyzeTrends = async (_interval: "today" | "week" | "month") => {
    setLoading(true);
    setError(null);
    setTrendResults([]);
    setKIReport(null);
    try {
      if (products.length === 0) {
        setError("Keine Produkte für Trend-Analyse vorhanden.");
        setLoading(false);
        return;
      }
      const keywords = products.map((p) => p.name).filter(Boolean);
      if (keywords.length === 0) {
        setError("Keine gültigen Produktnamen für Trend-Analyse.");
        setLoading(false);
        return;
      }
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const batchUrl = base
        ? `${base}/api/analytics/trends/analyze`
        : `/api/analytics/trends/analyze`;
      const batchRes = await fetch(batchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      const batchData = await batchRes.json();
      setTrendResults(batchData.results || []);
      if ((batchData.results || []).length === 0) {
        setError("Keine Trends für die aktuellen Produkte gefunden.");
      }
      // KI-Report für alle Produkte
      const aiUrl = base
        ? `${base}/api/analytics/ml/report`
        : `/api/analytics/ml/report`;
      const aiRes = await fetch(aiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      const aiData = await aiRes.json();
      setKIReport(aiData);
      setLastUpdate(new Date());
    } catch (_err) {
      setError("Analyse fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const safeFormatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || Number.isNaN(amount))
      return "–";
    return formatCurrency(amount);
  };
  const handleBack = () => navigate("/");

  if (loading) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBack}>
          {t("common.back")}
        </button>
        <div className="analytics-header">
          <h1>{t("analytics.realWebAnalytics.title")}</h1>
          <p>{t("analytics.realWebAnalytics.subtitle")}</p>
        </div>
        <div className="loading-spinner">
          {t("analytics.realWebAnalytics.analyzing")}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <button className="back-button floating-back" onClick={handleBack}>
        {t("common.back")}
      </button>
      <div className="analytics-header">
        <h1>{t("analytics.realWebAnalytics.title")}</h1>
        <p>{t("analytics.realWebAnalytics.subtitle")}</p>
        <div className="time-range-selector">
          <button
            className={timeRange === "today" ? "active" : ""}
            onClick={() => {
              setTimeRange("today");
              analyzeTrends("today");
            }}
            disabled={products.length === 0}
          >
            {t("common.today")}
          </button>
          <button
            className={timeRange === "week" ? "active" : ""}
            onClick={() => {
              setTimeRange("week");
              analyzeTrends("week");
            }}
            disabled={products.length === 0}
          >
            {t("common.thisWeek")}
          </button>
          <button
            className={timeRange === "month" ? "active" : ""}
            onClick={() => {
              setTimeRange("month");
              analyzeTrends("month");
            }}
            disabled={products.length === 0}
          >
            {t("common.thisMonth")}
          </button>
        </div>
      </div>
      {error && <div className="info-banner">❌ {error}</div>}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>{t("analytics.realWebAnalytics.productsInShop")}</h3>
          {products.length === 0 ? (
            <div>{t("analytics.realWebAnalytics.noProductsFound")}</div>
          ) : (
            <div className="products-list">
              {products.map((p) => (
                <div key={p.id} className="product-item">
                  <span className="product-name">{p.name}</span>
                  <span className="product-price">
                    {safeFormatCurrency(Number(p.price))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>{t("analytics.realWebAnalytics.trendAnalysis")}</h3>
          {trendResults.length === 0 ? (
            <div>{t("analytics.realWebAnalytics.noTrendData")}</div>
          ) : (
            <div className="trend-list">
              {trendResults.map((tr) => (
                <div key={tr.keyword} className="trend-item">
                  <span className="trend-keyword">{tr.keyword}</span>
                  <span className="trend-score">
                    Score: {tr.overallScore.toFixed(1)}
                  </span>
                  <span className="trend-confidence">
                    Confidence: {tr.confidence.toFixed(1)}%
                  </span>
                  <div className="trend-sources">
                    {tr.sources.map((src, idx) => (
                      <span key={idx} className="trend-source">
                        {src.source}: {src.score.toFixed(1)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {kiReport && (
        <div className="analysis-section">
          <div className="metric-card full-width">
            <h3>{t("analytics.realWebAnalytics.kiReport")}</h3>
            <div className="ki-report-text" style={{ whiteSpace: "pre-line" }}>
              {kiReport.report}
            </div>
            <div className="ki-report-summary">
              <strong>Top Trend:</strong> {kiReport.summary?.topTrend ?? "-"}
              <br />
              <strong>Durchschnittlicher Score:</strong>{" "}
              {typeof kiReport.summary?.avgScore === "number" &&
              !isNaN(kiReport.summary.avgScore)
                ? kiReport.summary.avgScore.toFixed(1)
                : "-"}
              <br />
              <strong>Analysierte Produkte:</strong>{" "}
              {kiReport.summary?.total ?? "-"}
            </div>
          </div>
        </div>
      )}
      <div className="analysis-section">
        <div className="metric-card full-width info">
          <h3>ℹ️ {t("analytics.realWebAnalytics.aboutTitle")}</h3>
          <p>
            <strong>{t("analytics.realWebAnalytics.aboutDescription")}</strong>
            <br />
            {t("analytics.realWebAnalytics.analysisDetails")}
            <br />
            {t("analytics.realWebAnalytics.timeIntervalsExplanation")}
            <br />
          </p>
          <div>
            {t("analytics.realWebAnalytics.lastUpdate")}:{" "}
            {formatTime(lastUpdate)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealWebAnalytics;
