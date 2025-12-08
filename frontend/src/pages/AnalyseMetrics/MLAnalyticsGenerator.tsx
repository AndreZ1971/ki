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
      const res = await fetch(`/api/analytics/ml/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, period })
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
      } else {
        setError(data.error || 'Fehler bei der Analytics-Generierung');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Analytics-Generierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-analytics-generator">
      <button onClick={fetchInsights} disabled={loading}>
        KI-Analytics-Insights generieren
      </button>
      {loading && <div>Generierung läuft...</div>}
      {error && <div className="error">{error}</div>}
      {insights.length > 0 && (
        <div className="insights-list">
          <h4>KI-Analytics-Insights</h4>
          <ul>
            {insights.map((insight, i) => (
              <li key={i}>
                <strong>{insight.type === 'forecast' ? 'Prognose' : insight.type === 'segment' ? 'Segmentierung' : insight.type === 'conversion' ? 'Conversion-Optimierung' : 'Anomalie'}</strong><br />
                <span>{insight.value}</span><br />
                {insight.score !== undefined && <span>Score: {Math.round(insight.score * 100)}%</span>}<br />
                {insight.reason && <em>{insight.reason}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
