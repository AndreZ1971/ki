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

interface Metric {
  icon: string;
  label: string;
  value: string | number;
  detail?: string;
}

interface TrendItem {
  topic: string;
  score: string;
}

// Insight interface entfernt

interface NextStep {
  title?: string;
  description?: string;
  criticality?: 'critical' | 'warning' | 'good';
}

const TrendAnalysis = () => {
  // const [trendData, setTrendData] = useState<TrendData | null>(null); // entfernt
  // const [loading, setLoading] = useState(true); // entfernt
  // const [error, setError] = useState<string | null>(null); // entfernt
  const [timeRange, setTimeRange] = useState('30d');
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [googleTrends, setGoogleTrends] = useState<TrendItem[]>([]);
  const [redditTrends, setRedditTrends] = useState<TrendItem[]>([]);
  
  const navigate = useNavigate();
  // const API_URL = import.meta.env.VITE_API_URL || ''; // entfernt

  useEffect(() => {
    // Simuliere Daten-Fetch basierend auf timeRange
    const fetchData = async () => {
      try {
    // const API_URL = import.meta.env.VITE_API_URL || ''; // entfernt
        setError(null);
        
        // Simulierte Daten für Demo
        setTimeout(() => {
          const data = generateTrendData(timeRange);
          setTrendData(data);
          
          // Demo-Metriken
          const demoMetrics: Metric[] = [
            { icon: '📈', label: 'Sales Growth', value: `${data.salesGrowth || 0}%`, detail: data.salesGrowth && data.salesGrowth > 0 ? 'Positive' : 'Negative' },
            { icon: '👥', label: 'Customer Growth', value: `${data.customerGrowth || 0}%`, detail: data.customerGrowth && data.customerGrowth > 0 ? 'Wachsend' : 'Rückläufig' },
            { icon: '🔥', label: 'Popular Products', value: data.popularProducts || 0, detail: 'Top-Performer' },
            { icon: '📊', label: 'Seasonal Trend', value: `${data.seasonalTrend || 0}%`, detail: 'Saisonalität' },
            { icon: '🎯', label: 'Prediction Accuracy', value: `${data.predictionAccuracy || 0}%`, detail: 'KI-Genauigkeit' },
            { icon: '⚡', label: 'Trend Strength', value: `${data.trendStrength || 0}%`, detail: 'Trend-Stärke' },
            { icon: '📱', label: 'Market Trend', value: data.marketTrend || 'Stabil', detail: 'Marktrichtung' },
            { icon: '🔄', label: 'Last Updated', value: new Date(data.lastUpdated || '').toLocaleDateString(), detail: 'Aktualisiert' }
          ];
          
          setMetrics(demoMetrics);
          
          // Demo Google Trends
          setGoogleTrends([
            { topic: 'AI Tools', score: '+85%' },
            { topic: 'E-commerce', score: '+72%' },
            { topic: 'Digital Marketing', score: '+68%' },
            { topic: 'Remote Work', score: '+54%' }
          ]);
          
          // Demo Reddit Trends
          setRedditTrends([
            { topic: 'ChatGPT', score: '4.2k posts' },
            { topic: 'WebDev', score: '3.8k posts' },
            { topic: 'Entrepreneur', score: '2.9k posts' },
            { topic: 'SideProject', score: '2.1k posts' }
          ]);
          
          setLoading(false);
        }, 1000);
        
      } catch (_err) {
        // Fehlerbehandlung entfernt, da error nicht genutzt wird
      }
    };
    
    fetchData();
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

  // KI/ML-Analyse: API-Call
  const handleAnalyzeAI = async () => {
    setInsightLoading(true);
    setInsightError(null);
    setInsights([]);
    setNextSteps([]);
    setSummary(null);
    
    try {
      // Simulierte KI-Analyse für Demo
      setTimeout(() => {
        setInsights([
          { type: 'trend', title: 'E-Commerce Boom', value: '+42%', detail: 'Online-Verkäufe steigen stark', score: 0.92 },
          { type: 'segment', title: 'Mobile Conversion', value: '+28%', detail: 'Mobile Nutzer konvertieren besser', score: 0.87 },
          { type: 'forecast', title: 'Q4 Prognose', value: '+65%', detail: 'Starker Weihnachtsverkauf erwartet', score: 0.78 },
          { type: 'anomaly', title: 'Abend-Käufe', value: '+31%', detail: 'Mehr Verkäufe nach 18 Uhr', score: 0.65 },
          { type: 'conversion', title: 'Checkout-Optimierung', value: '+18%', detail: 'Potenzial bei Checkout', score: 0.82 },
          { type: 'reddit', title: 'AI Diskussion', value: '4.2k posts', detail: 'Hohe Engagement-Rate', score: 0.91 },
          { type: 'google', title: 'Marketing-Trends', value: '+72%', detail: 'Suchvolumen steigt', score: 0.88 },
          { type: 'other', title: 'Kundenzufriedenheit', value: '4.8/5', detail: 'Sehr positive Bewertungen', score: 0.95 }
        ]);
        
        setNextSteps([
          { title: 'Mobile-First Strategie', description: 'Optimierte für mobile Nutzer basierend auf +28% Conversion-Steigerung', criticality: 'good' },
          { title: 'Abend-Marketing', description: 'Gezielte Werbung nach 18 Uhr nutzen (+31% Verkäufe)', criticality: 'good' },
          { title: 'Checkout-Optimierung', description: '+18% Conversion-Potenzial im Checkout identifiziert', criticality: 'warning' },
          { title: 'AI-Inhalte erstellen', description: 'Hohe Nachfrage nach AI-Themen auf Reddit und Google', criticality: 'good' }
        ]);
        
        setSummary('Die KI-Analyse zeigt starkes Wachstum im E-Commerce, insbesondere im mobilen Bereich. Nutze die Abendstunden für gezieltes Marketing und optimiere den Checkout-Prozess für maximale Conversion.');
        
        setInsightLoading(false);
      }, 1500);
      
    } catch (_err) {
      setInsightError('Fehler bei der KI-Analyse');
      setInsightLoading(false);
    }
  };

  // getTrendIndicator entfernt

    // getTrendIndicator entfernt
    return (
      <div>
        {/* Absolut positionierter Back-Button */}
        <button 
          className="back-button floating-back" 
          onClick={handleBackToDashboard}
        >
          ← Zurück
        </button>

        <div className="analytics-header">
          <h1>📊 Trend Analysis</h1>
          <p>KI-gestützte Trendanalyse mit echten Shop-Daten, Google Trends & Reddit Insights</p>
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

        {/* Shop-Trend-Metriken Grid */}
        <div className="analytics-grid-2x4">
          {metrics.map((metric, i) => (
          <div className="metric-card" key={i}>
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            {metric.detail && <div className="trend-indicator">{metric.detail}</div>}
          </div>
        ))}
      </div>

      {/* Google Trends Chart */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🌐 Google Trends</h3>
          {googleTrends.length === 0 ? (
            <div style={{color: '#6c757d'}}>Keine Google Trends-Daten verfügbar.</div>
          ) : (
            <div className="prediction-chart">
              {/* Dummy Chart-Placeholder, kann durch echtes Chart ersetzt werden */}
              <div className="chart-placeholder">📈 Google Trends Chart</div>
              <div className="prediction-stats">
                {googleTrends.map((trend, i) => (
                  <div className="prediction-item" key={i}>
                    <span>{trend.topic}</span>
                    <span className="prediction-value positive">{trend.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reddit Trends Chart */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>👾 Reddit Trends</h3>
          {redditTrends.length === 0 ? (
            <div style={{color: '#6c757d'}}>Keine Reddit-Trends verfügbar.</div>
          ) : (
            <div className="prediction-chart">
              <div className="chart-placeholder">📈 Reddit Trends Chart</div>
              <div className="prediction-stats">
                {redditTrends.map((trend, i) => (
                  <div className="prediction-item" key={i}>
                    <span>{trend.topic}</span>
                    <span className="prediction-value positive">{trend.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KI/ML-Analyse Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🧠 KI-gestützte Trend-Analyse</h3>
          <p style={{marginBottom: 18, color: '#2563eb', fontWeight: 500}}>
            Nutze KI/ML, um Trends, Prognosen und Optimierungspotenziale aus Shop-, Google- und Reddit-Daten zu erkennen.
          </p>
          <button 
            className="action-button primary"
            onClick={handleAnalyzeAI}
            disabled={insightLoading}
            style={{marginBottom: 18}}
          >
            {insightLoading ? '⏳ KI-Analyse läuft...' : '🧠 KI-Analyse starten'}
          </button>
          {insightError && <div className="error-message">{insightError}</div>}

          {/* Zusammenfassung */}
          {summary && (
            <div className="metric-card" style={{margin: '24px 0'}}>
              <h4>📝 KI-Zusammenfassung</h4>
              <div style={{fontSize: '1.1rem', color: '#2c3e50', marginBottom: 12}}>{summary}</div>
            </div>
          )}

          {/* Insights Grid */}
          {Array.isArray(insights) && insights.length > 0 && (
            <div className="analytics-grid-2x4" style={{marginBottom: 32}}>
              {insights.map((insight, i) => (
                <div className="metric-card" key={i}>
                  <div className="metric-icon" style={{fontSize: '2.2rem'}}>
                    {insight.type === 'trend' && '📈'}
                    {insight.type === 'segment' && '🧩'}
                    {insight.type === 'forecast' && '🔮'}
                    {insight.type === 'anomaly' && '⚠️'}
                    {insight.type === 'conversion' && '🎯'}
                    {insight.type === 'reddit' && '👾'}
                    {insight.type === 'google' && '🌐'}
                    {insight.type === 'other' && '🔎'}
                  </div>
                  <div className="metric-label">{insight.title || insight.type}</div>
                  <div className="metric-value" style={{fontSize: '1.3rem'}}>{insight.value}</div>
                  {insight.detail && <div style={{color: '#6c757d', fontSize: '0.95rem', marginTop: 8}}>{insight.detail}</div>}
                  {insight.score !== undefined && (
                    <div style={{fontWeight: 700, color: '#2563eb', marginTop: 8}}>KI-Score: {Math.round(insight.score * 100)}%</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Next Steps / Empfehlungen */}
          {Array.isArray(nextSteps) && nextSteps.length > 0 && (
            <div className="next-steps" style={{marginBottom: 32}}>
              <h4>🚀 Empfohlene Next Steps</h4>
              {nextSteps.map((step, i) => (
                <div className={`next-step ${step.criticality || 'good'}`} key={i}>
                  <span className="step-icon">
                    {step.criticality === 'critical' && '❗'}
                    {step.criticality === 'warning' && '⚠️'}
                    {step.criticality === 'good' && '✅'}
                    {!step.criticality && '➡️'}
                  </span>
                  <div className="step-content">
                    <strong>{step.title || 'Empfehlung'}</strong>
                    <p>{step.description || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;