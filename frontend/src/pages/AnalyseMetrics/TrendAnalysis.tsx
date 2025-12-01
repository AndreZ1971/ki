import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface TrendData {
  salesGrowth?: number;
  customerGrowth?: number;
  popularProducts?: number;
  seasonalTrend?: number;
  marketTrend?: string;
  predictionAccuracy?: number;
  trendStrength?: number;
  lastUpdated?: string;
}

const TrendAnalysis = () => {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const navigate = useNavigate();

  useEffect(() => {
    // Simuliere Daten-Fetch basierend auf timeRange
    setTimeout(() => {
      const data = generateTrendData(timeRange);
      setTrendData(data);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const generateTrendData = (range: string): TrendData => {
    const baseData = {
      salesGrowth: 12.5,
      customerGrowth: 8.3,
      popularProducts: 15,
      seasonalTrend: 23.7,
      marketTrend: "↗️ Steigend",
      predictionAccuracy: 87.2,
      trendStrength: 76.8,
      lastUpdated: new Date().toISOString()
    };

    // Passe Daten basierend auf Zeitraum an
    switch (range) {
      case '7d':
        return { ...baseData, salesGrowth: 5.2, customerGrowth: 3.1, trendStrength: 65.4 };
      case '30d':
        return baseData;
      case '90d':
        return { ...baseData, salesGrowth: 18.9, customerGrowth: 12.7, trendStrength: 82.1 };
      case '1y':
        return { ...baseData, salesGrowth: 34.2, customerGrowth: 25.8, trendStrength: 91.5 };
      default:
        return baseData;
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleTimeRangeChange = (range: string) => {
    setLoading(true);
    setTimeRange(range);
  };

  const getTrendIndicator = (value: number) => {
    if (value > 0) return '📈';
    if (value < 0) return '📉';
    return '➡️';
  };

  if (loading) return <div className="loading-spinner">📊 Analyzing Trends...</div>;
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
        <h1>📊 Trend Analysis</h1>
        <p>Erkenne Markt- und Verkaufstrends automatisch</p>
        
        {/* Zeitraum Auswahl */}
        <div className="time-range-selector">
          <h4>Zeitraum analysieren:</h4>
          <div className="range-buttons">
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                className={`range-button ${timeRange === range ? 'active' : ''}`}
                onClick={() => handleTimeRangeChange(range)}
              >
                {range === '7d' && '7 Tage'}
                {range === '30d' && '30 Tage'}
                {range === '90d' && '90 Tage'}
                {range === '1y' && '1 Jahr'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2x4 Grid Layout */}
      <div className="analytics-grid-2x4">
        <div className="metric-card">
          <div className="metric-icon">{getTrendIndicator(trendData?.salesGrowth || 0)}</div>
          <div className="metric-label">Sales Growth</div>
          <div className="metric-value">{trendData?.salesGrowth || 0}%</div>
          <div className="trend-indicator">
            {trendData?.salesGrowth && trendData.salesGrowth > 0 ? 'Positive' : 'Negative'} Entwicklung
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-label">Customer Growth</div>
          <div className="metric-value">{trendData?.customerGrowth || 0}%</div>
          <div className="trend-indicator">
            {trendData?.customerGrowth && trendData.customerGrowth > 0 ? 'Wachsend' : 'Rückläufig'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-label">Popular Products</div>
          <div className="metric-value">{trendData?.popularProducts || 0}</div>
          <div className="trend-indicator">Top-Performer</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🌞</div>
          <div className="metric-label">Seasonal Trend</div>
          <div className="metric-value">{trendData?.seasonalTrend || 0}%</div>
          <div className="trend-indicator">Saisonaler Einfluss</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-label">Market Trend</div>
          <div className="metric-value">{trendData?.marketTrend || 'Stabil'}</div>
          <div className="trend-indicator">Gesamtmarkt</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Prediction Accuracy</div>
          <div className="metric-value">{trendData?.predictionAccuracy || 0}%</div>
          <div className="trend-indicator">Vorhersagegenauigkeit</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💪</div>
          <div className="metric-label">Trend Strength</div>
          <div className="metric-value">{trendData?.trendStrength || 0}%</div>
          <div className="trend-indicator">
            {trendData?.trendStrength && trendData.trendStrength > 75 ? 'Stark' : 'Mittel'}
          </div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {trendData?.lastUpdated ? new Date(trendData.lastUpdated).toLocaleDateString('de-DE') : 'N/A'}
          </div>
        </div>
      </div>

      {/* Trend Insights Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🔍 Trend Insights</h3>
          <div className="insights-grid">
            <div className="insight-item positive">
              <span className="insight-label">Empfohlene Aktion:</span>
              <span className="insight-value">Bestände erhöhen</span>
            </div>
            <div className="insight-item positive">
              <span className="insight-label">Chancen:</span>
              <span className="insight-value">Wachstumsmarkt</span>
            </div>
            <div className="insight-item warning">
              <span className="insight-label">Risiken:</span>
              <span className="insight-value">Saisonende naht</span>
            </div>
            <div className="insight-item info">
              <span className="insight-label">Nächster Peak:</span>
              <span className="insight-value">In 2 Wochen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Prediction Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🔮 Trend Prediction</h3>
          <div className="prediction-chart">
            <div className="chart-placeholder">
              📈 Trend-Vorhersage Diagramm wird geladen...
            </div>
            <div className="prediction-stats">
              <div className="prediction-item">
                <span>Nächste Woche:</span>
                <span className="prediction-value positive">+8.2%</span>
              </div>
              <div className="prediction-item">
                <span>Nächster Monat:</span>
                <span className="prediction-value positive">+15.7%</span>
              </div>
              <div className="prediction-item">
                <span>Nächstes Quartal:</span>
                <span className="prediction-value positive">+28.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;