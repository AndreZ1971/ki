import React, { useState } from 'react';
import './page.css';

interface MLAnalyticsInsight {
  type: 'forecast' | 'segment' | 'conversion' | 'anomaly';
  value: string;
  score?: number;
  reason?: string;
}

interface MLAnalyticsGeneratorProps {
  metric: string;
  period: string;
}

export const MLAnalyticsGenerator: React.FC<MLAnalyticsGeneratorProps> = ({ metric, period }) => {
  const [insights, setInsights] = useState<MLAnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      let base = (import.meta.env.VITE_API_URL || '').trim();
      if (base.endsWith('/')) base = base.slice(0, -1);
      const apiUrl = base ? `${base}/api/analytics/ml/generate` : `/api/analytics/ml/generate`;
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, period })
      });
      const data = await res.json();
      
      console.log('API Response:', data);
      
      if (data.success && data.insights) {
        setInsights(data.insights);
      } else if (data.insights) {
        // Fallback: insights direkt vorhanden
        setInsights(data.insights);
      } else {
        setError(data.error || 'Keine Insights erhalten');
      }
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(err.message || 'Fehler bei der Analytics-Generierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ml-analytics-section">
      <h3 className="ml-analytics-title">🚀 KI-gestützte Conversion-Analyse</h3>
      <div className="ml-analytics-desc">
        Erhalte datengetriebene Empfehlungen, Prognosen und Segmentierungen für deine Conversion-Optimierung.
      </div>
      <button
        className="ml-analytics-btn"
        onClick={fetchInsights}
        disabled={loading}
        title="KI-gestützte Insights für Conversion-Optimierung generieren"
      >
        <span role="img" aria-label="Rocket" style={{marginRight: 8, fontSize: '1.2em'}}>🚀</span>
        KI-Conversion-Insights generieren
      </button>
      {loading && <div className="ml-analytics-loading">Generierung läuft...</div>}
      {error && <div className="ml-analytics-error">{error}</div>}
      {insights.length > 0 && (
        <div className="ml-analytics-card-list">
          {insights.map((insight, i) => (
            <div className={`ml-analytics-card ml-analytics-type-${insight.type}`} key={i}>
              <div className="ml-analytics-card-header">
                <span className="ml-analytics-card-icon">
                  {insight.type === 'forecast' && '📈'}
                  {insight.type === 'segment' && '🧩'}
                  {insight.type === 'conversion' && '🎯'}
                  {insight.type === 'anomaly' && '⚠️'}
                </span>
                <span className="ml-analytics-card-title">
                  {insight.type === 'forecast' ? 'Prognose' : insight.type === 'segment' ? 'Segmentierung' : insight.type === 'conversion' ? 'Conversion-Optimierung' : 'Anomalie'}
                </span>
                {insight.score !== undefined && (
                  <span className="ml-analytics-card-score">{Math.round(insight.score * 100)}%</span>
                )}
              </div>
              <div className="ml-analytics-card-value">{insight.value}</div>
              {insight.reason && <div className="ml-analytics-card-reason">{insight.reason}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
