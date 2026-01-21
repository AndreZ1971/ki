import React, { useState, useCallback } from "react";
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
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `/api/products/woo/products?per_page=50`;
      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(t("pages.analytics_pages.realWebAnalytics.loadProductsError"));
      const data = await response.json();
      setProducts(data.data || []);
    } catch (_err) {
      setError(t("pages.analytics_pages.realWebAnalytics.loadProductsError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Produkte beim ersten Render automatisch laden
  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Trend-Analyse für alle Produkte im gewählten Zeitraum
  const analyzeTrends = async (_interval: "today" | "week" | "month") => {
    setLoading(true);
    setError(null);
    setTrendResults([]);
    setKIReport(null);
    try {
      if (products.length === 0) {
        setError(t("pages.analytics_pages.realWebAnalytics.noProductsForAnalysis"));
        setLoading(false);
        return;
      }
      const keywords = products.map((p) => p.name).filter(Boolean);
      if (keywords.length === 0) {
        setError(t("pages.analytics_pages.realWebAnalytics.noValidProductNames"));
        setLoading(false);
        return;
      }
      const batchUrl = `/api/analytics/trends/analyze`;
      const batchRes = await fetch(batchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      const batchData = await batchRes.json();
      setTrendResults(batchData.results || []);
      if ((batchData.results || []).length === 0) {
        setError(t("pages.analytics_pages.realWebAnalytics.noTrendsFound"));
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
      setError(t("pages.analytics_pages.realWebAnalytics.analyzeFailed"));
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
          <h1>{t("pages.analytics_pages.realWebAnalytics.title")}</h1>
          <p>{t("pages.analytics_pages.realWebAnalytics.subtitle")}</p>
        </div>
        <div className="loading-spinner">
          {t("pages.analytics_pages.realWebAnalytics.analyzing")}
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
        <h1>{t("pages.analytics_pages.realWebAnalytics.title")}</h1>
        <p>{t("pages.analytics_pages.realWebAnalytics.subtitle")}</p>
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
          <h3>{t("pages.analytics_pages.realWebAnalytics.productsInShop")}</h3>
          {products.length === 0 ? (
            <div>{t("pages.analytics_pages.realWebAnalytics.noProductsFound")}</div>
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
          <h3>{t("pages.analytics_pages.realWebAnalytics.trendAnalysis")}</h3>
          {trendResults.length === 0 ? (
            <div>{t("pages.analytics_pages.realWebAnalytics.noTrendData")}</div>
          ) : (
            <div className="trend-list">
              {trendResults.map((tr) => (
                <div key={tr.keyword} className="trend-item">
                  <span className="trend-keyword">{tr.keyword}</span>
                  <span className="trend-score">
                    {t("pages.analytics_pages.realWebAnalytics.scoreLabel")} {tr.overallScore.toFixed(1)}
                  </span>
                  <span className="trend-confidence">
                    {t("pages.analytics_pages.realWebAnalytics.confidenceLabel")} {tr.confidence.toFixed(1)}%
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
            <h3>{t("pages.analytics_pages.realWebAnalytics.kiReport")}</h3>
            <div className="ki-report-text" style={{ whiteSpace: "pre-line" }}>
              {kiReport.report}
            </div>
            <div className="ki-report-summary">
              <strong>{t("pages.analytics_pages.realWebAnalytics.topTrendLabel")}:</strong> {kiReport.summary?.topTrend ?? "-"}
              <br />
              <strong>{t("pages.analytics_pages.realWebAnalytics.avgScoreLabel")}:</strong>{" "}
              {typeof kiReport.summary?.avgScore === "number" &&
              !isNaN(kiReport.summary.avgScore)
                ? kiReport.summary.avgScore.toFixed(1)
                : "-"}
              <br />
              <strong>{t("pages.analytics_pages.realWebAnalytics.analyzedProductsLabel")}:</strong>{" "}
              {kiReport.summary?.total ?? "-"}
            </div>
          </div>
        </div>
      )}
      <div className="analysis-section">
        <div className="metric-card full-width info">
          <h3>ℹ️ {t("pages.analytics_pages.realWebAnalytics.aboutTitle")}</h3>
          <p>
            <strong>{t("pages.analytics_pages.realWebAnalytics.aboutDescription")}</strong>
            <br />
            {t("pages.analytics_pages.realWebAnalytics.analysisDetails")}
            <br />
            {t("pages.analytics_pages.realWebAnalytics.timeIntervalsExplanation")}
            <br />
          </p>
          <div>
            {t("pages.analytics_pages.realWebAnalytics.lastUpdate")}: {" "}
            {formatTime(lastUpdate)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealWebAnalytics;
