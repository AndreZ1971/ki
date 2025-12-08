import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';
import { MLAnalyticsGenerator } from './MLAnalyticsGenerator';

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
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simuliere Daten-Fetch
    setTimeout(() => {
      setConversionData({
        overallRate: 2.8,
        cartAbandonment: 68,
        checkoutCompletion: 32,
        mobileRate: 1.9,
        desktopRate: 3.5,
        returningCustomers: 4.2,
        newCustomers: 1.8,
        lastUpdated: new Date().toISOString()
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (loading) return <div className="loading-spinner">📈 Loading Conversion Analysis...</div>;
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
        <h1>📈 Conversion Analysis</h1>
        <p>Detaillierte Analyse der Conversion-Raten und Optimierung</p>
      </div>

      {/* 2x4 Grid Layout */}
      <div className="analytics-grid-2x4">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Overall Conversion Rate</div>
          <div className="metric-value">{conversionData?.overallRate || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🛒</div>
          <div className="metric-label">Cart Abandonment</div>
          <div className="metric-value">{conversionData?.cartAbandonment || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-label">Checkout Completion</div>
          <div className="metric-value">{conversionData?.checkoutCompletion || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📱</div>
          <div className="metric-label">Mobile Conversion</div>
          <div className="metric-value">{conversionData?.mobileRate || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💻</div>
          <div className="metric-label">Desktop Conversion</div>
          <div className="metric-value">{conversionData?.desktopRate || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔄</div>
          <div className="metric-label">Returning Customers</div>
          <div className="metric-value">{conversionData?.returningCustomers || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🆕</div>
          <div className="metric-label">New Customers</div>
          <div className="metric-value">{conversionData?.newCustomers || 0}%</div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {conversionData?.lastUpdated ? new Date(conversionData.lastUpdated).toLocaleDateString('de-DE') : 'N/A'}
          </div>
        </div>
      </div>

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
      <div className="analytics-ml-section">
        <h3>KI-Analytics-Generator</h3>
        {/* Beispielhafte Metrik und Zeitraum, kann dynamisch ersetzt werden */}
        <MLAnalyticsGenerator metric="conversion" period="30d" />
      </div>
    </div>
  );
};

export default ConversionAnalysis;