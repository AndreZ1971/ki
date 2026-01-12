import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatTime } from "../../lib/i18n-utils";
import "./page.css";

interface RegionData {
  totalRegions: number;
  activeCountries: number;
  topRegion: string;
  europeTraffic: number;
  northAmericaTraffic: number;
  asiaTraffic: number;
  otherRegions: number;
  regionalConversion: number;
  lastUpdated: string;
}

interface CountryData {
  country: string;
  visitors: number;
  conversion: number;
  revenue: number;
  trend: number;
}

const AnalyticRegioning = () => {
  const navigate = useNavigate();
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("global");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  // KI/ML-Analyse
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlInsights, setMlInsights] = useState<
    Array<{
      type: string;
      title: string;
      value: string;
      score?: number;
      detail?: string;
    }>
  >([]);

  useEffect(() => {
    const fetchRegionData = async () => {
      setLoading(true);
      try {
        let base = (import.meta.env.VITE_API_URL || "").trim();
        if (base.endsWith("/")) base = base.slice(0, -1);
        const apiUrl = base
          ? `${base}/api/analytics/regioning/data?region=${selectedRegion}`
          : `/api/analytics/regioning/data?region=${selectedRegion}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Fehler beim Laden der Regions-Daten");
        const data = await res.json();
        if (data.success && data.data) {
          // Die API liefert ein Objekt mit regionData und countryData
          setRegionData(data.data.regionData || null);
          setCountryData(data.data.countryData || []);
          setLastUpdate(new Date(data.data.regionData?.lastUpdated || Date.now()));
        } else {
          setRegionData(null);
          setCountryData([]);
        }
      } catch (_err) {
        setRegionData(null);
        setCountryData([]);
        setLastUpdate(new Date());
      } finally {
        setLoading(false);
      }
    };
    fetchRegionData();
  }, [selectedRegion]);

  // KI/ML-Analyse: Holt echte Insights vom Backend
  const handleMLAnalyze = async () => {
    setMlLoading(true);
    setMlError(null);
    setMlInsights([]);
    try {
      let base = (import.meta.env.VITE_API_URL || "").trim();
      if (base.endsWith("/")) base = base.slice(0, -1);
      const apiUrl = base
        ? `${base}/api/analytics/regioning/ml-analysis`
        : `/api/analytics/regioning/ml-analysis`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: selectedRegion }),
      });
      if (!res.ok) throw new Error("Fehler beim Laden der KI-Analyse");
      const data = await res.json();
      setMlInsights(data.mlInsights || []);
    } catch (_err: any) {
      setMlError("KI-Analyse konnte nicht geladen werden.");
    }
    setMlLoading(false);
  };

  const handleBack = () => {
    navigate("/");
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("de-DE").format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? "#27ae60" : "#e74c3c";
  };

  const getTrendIndicator = (value: number) => {
    return value >= 0 ? "↑" : "↓";
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBack}>
          ← Zurück
        </button>
        <div className="analytics-header">
          <h1>🗺️ Analytic Regioning</h1>
          <p>Lade regionale Analytics-Daten...</p>
        </div>
        <div className="loading-spinner">🌍 Lade Geo-Daten...</div>
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
        <h1>🗺️ Analytic Regioning</h1>
        <p>Regionale Analytics und Geo-Targeting</p>
        <div
          className="time-range-selector"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <button
            className={selectedRegion === "global" ? "active" : ""}
            onClick={() => setSelectedRegion("global")}
          >
            🌍 Global
          </button>
          <button
            className={selectedRegion === "europe" ? "active" : ""}
            onClick={() => setSelectedRegion("europe")}
          >
            🇪🇺 Europa
          </button>
          <button
            className={selectedRegion === "america" ? "active" : ""}
            onClick={() => setSelectedRegion("america")}
          >
            🇺🇸 Nordamerika
          </button>
          <button
            className={selectedRegion === "asia" ? "active" : ""}
            onClick={() => setSelectedRegion("asia")}
          >
            🇦🇸 Asien
          </button>
        </div>
        {/* KI/ML-Analyse Button unterhalb der Region-Buttons, zentriert */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "0 0 24px 0",
          }}
        >
          <button
            className="ml-analytics-btn"
            onClick={handleMLAnalyze}
            disabled={mlLoading}
            title="KI-gestützte Insights für regionale Optimierung generieren"
            style={{
              fontSize: "1em",
              padding: "8px 18px",
              borderRadius: "8px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              minWidth: "220px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span role="img" aria-label="Rocket" style={{ fontSize: "1.2em" }}>
              🚀
            </span>
            KI-Regionen-Analyse
          </button>
          {mlLoading && (
            <div
              className="ml-analytics-loading"
              style={{ marginLeft: "12px", color: "#2563eb" }}
            >
              KI-Analyse läuft...
            </div>
          )}
          {mlError && (
            <div className="error-message" style={{ marginLeft: "12px" }}>
              {mlError}
            </div>
          )}
        </div>
      </div>

      {/* Region Overview Grid */}
      <div className="analytics-grid-2x4">
        <div className="metric-card">
          <div className="metric-icon">🌍</div>
          <div className="metric-label">Aktive Regionen</div>
          <div className="metric-value">{regionData?.totalRegions || 0}</div>
          <div className="trend-indicator positive">↗️ +2 dieses Jahr</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇩🇪</div>
          <div className="metric-label">Top Region</div>
          <div className="metric-value-small">
            {regionData?.topRegion || "N/A"}
          </div>
          <div className="trend-indicator">🏆 Führend</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-label">Aktive Länder</div>
          <div className="metric-value">{regionData?.activeCountries || 0}</div>
          <div className="trend-indicator positive">↗️ +5 vs. Vorjahr</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Regionale Conversion</div>
          <div className="metric-value">
            {regionData?.regionalConversion || 0}%
          </div>
          <div className="trend-indicator positive">↑ +0.4%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇪🇺</div>
          <div className="metric-label">Europa Traffic</div>
          <div className="metric-value">{regionData?.europeTraffic || 0}%</div>
          <div className="trend-indicator positive">↑ Hauptmarkt</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇺🇸</div>
          <div className="metric-label">Nordamerika</div>
          <div className="metric-value">
            {regionData?.northAmericaTraffic || 0}%
          </div>
          <div className="trend-indicator positive">↑ Wachsend</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇦🇸</div>
          <div className="metric-label">Asien Traffic</div>
          <div className="metric-value">{regionData?.asiaTraffic || 0}%</div>
          <div className="trend-indicator warning">→ Stabil</div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">{formatTime(lastUpdate)}</div>
        </div>
      </div>

      {/* Regional Traffic Distribution */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🌐 Regionale Traffic-Verteilung</h3>
          <div className="traffic-sources">
            <div className="traffic-source">
              <span className="source-name">🇪🇺 Europa</span>
              <div className="source-bar">
                <div
                  className="source-fill direct"
                  style={{ width: `${regionData?.europeTraffic || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">
                {regionData?.europeTraffic || 0}%
              </span>
            </div>

            <div className="traffic-source">
              <span className="source-name">🇺🇸 Nordamerika</span>
              <div className="source-bar">
                <div
                  className="source-fill search"
                  style={{ width: `${regionData?.northAmericaTraffic || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">
                {regionData?.northAmericaTraffic || 0}%
              </span>
            </div>

            <div className="traffic-source">
              <span className="source-name">🇦🇸 Asien</span>
              <div className="source-bar">
                <div
                  className="source-fill social"
                  style={{ width: `${regionData?.asiaTraffic || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">
                {regionData?.asiaTraffic || 0}%
              </span>
            </div>

            <div className="traffic-source">
              <span className="source-name">🌍 Andere</span>
              <div className="source-bar">
                <div
                  className="source-fill email"
                  style={{ width: `${regionData?.otherRegions || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">
                {regionData?.otherRegions || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Countries Performance */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🏆 Top Länder nach Performance</h3>
          <div className="products-list">
            {countryData.map((country, index) => (
              <div key={country.country} className="product-item">
                <span className="product-rank">#{index + 1}</span>
                <span className="product-name">{country.country}</span>
                <span className="product-sales">
                  {formatNumber(country.visitors)} Besucher
                </span>
                <span className="product-sales">
                  {country.conversion}% Conversion
                </span>
                <span className="product-sales">
                  {formatCurrency(country.revenue)}
                </span>
                <span
                  className="product-sales"
                  style={{ color: getTrendColor(country.trend) }}
                >
                  {getTrendIndicator(country.trend)} {Math.abs(country.trend)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Insights */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>💡 Regionale Insights</h3>
          <div className="insights-grid">
            <div className="insight-item positive">
              <span className="insight-label">Top-Performer:</span>
              <span className="insight-value">Deutschland (+12% Wachstum)</span>
            </div>
            <div className="insight-item positive">
              <span className="insight-label">Aufstrebend:</span>
              <span className="insight-value">USA (+22% Wachstum)</span>
            </div>
            <div className="insight-item warning">
              <span className="insight-label">Optimierungsbedarf:</span>
              <span className="insight-value">Italien & Spanien</span>
            </div>
            <div className="insight-item info">
              <span className="insight-label">Empfehlung:</span>
              <span className="insight-value">Asien-Markt weiter ausbauen</span>
            </div>
            {/* KI/ML-Insights Sektion */}
            {mlInsights.length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 8 }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {mlInsights.map((insight, idx) => (
                    <li
                      key={idx}
                      style={{
                        background: "#f6f8fa",
                        borderRadius: 10,
                        marginBottom: 10,
                        padding: "14px 18px",
                        boxShadow: "0 2px 8px rgba(102,126,234,0.07)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#2563eb" }}>
                        {insight.title}
                      </span>
                      <span style={{ fontSize: "1.08em", color: "#222" }}>
                        {insight.value}
                      </span>
                      {insight.detail && (
                        <span style={{ color: "#6c757d", fontSize: "0.98em" }}>
                          {insight.detail}
                        </span>
                      )}
                      {insight.score !== undefined && (
                        <span style={{ color: "#764ba2", fontWeight: 500 }}>
                          KI-Score: {Math.round(insight.score * 100)}%
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticRegioning;
