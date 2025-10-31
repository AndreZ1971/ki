import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface AnalysisConfig {
  timeRange: string;
  analysisType: string;
  dataSources: string[];
  includePredictions: boolean;
  alertThreshold: number;
}

interface AnalysisResult {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  estimatedTime: string;
  trendsFound: number;
  insights: string[];
  generatedReports: number;
}

const RunTrendAnalysis = () => {
  const [config, setConfig] = useState<AnalysisConfig>({
    timeRange: '30d',
    analysisType: 'comprehensive',
    dataSources: ['sales', 'traffic', 'conversion'],
    includePredictions: true,
    alertThreshold: 10
  });
  
  const [result, setResult] = useState<AnalysisResult>({
    status: 'idle',
    progress: 0,
    estimatedTime: '2min',
    trendsFound: 0,
    insights: [],
    generatedReports: 0
  });
  
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Lade Analyse-Historie
    const history = [
      { id: 1, date: '2025-10-30', trends: 12, duration: '1m 45s', status: 'completed' },
      { id: 2, date: '2025-10-28', trends: 8, duration: '1m 20s', status: 'completed' },
      { id: 3, date: '2025-10-25', trends: 15, duration: '2m 10s', status: 'completed' }
    ];
    setAnalysisHistory(history);
  }, []);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleConfigChange = (key: keyof AnalysisConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleDataSourceToggle = (source: string) => {
    const currentSources = [...config.dataSources];
    if (currentSources.includes(source)) {
      setConfig(prev => ({
        ...prev,
        dataSources: currentSources.filter(s => s !== source)
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        dataSources: [...currentSources, source]
      }));
    }
  };

  const runAnalysis = () => {
    setResult({
      status: 'running',
      progress: 0,
      estimatedTime: '2min',
      trendsFound: 0,
      insights: [],
      generatedReports: 0
    });

    // Simuliere Analyse-Fortschritt
    const interval = setInterval(() => {
      setResult(prev => {
        const newProgress = prev.progress + Math.random() * 15;
        const trendsFound = Math.floor(newProgress / 10);
        const insights = [
          'Saisonaler Anstieg erkannt',
          'Neue Kunden-Gruppe identifiziert',
          'Produkt-Trend vorhergesagt'
        ].slice(0, trendsFound);

        if (newProgress >= 100) {
          clearInterval(interval);
          return {
            status: 'completed',
            progress: 100,
            estimatedTime: '0s',
            trendsFound: 12,
            insights: [
              '📈 Starker Umsatzanstieg am Wochenende',
              '👥 Neue Kundengruppe aus 25-34 Jahren',
              '🔥 Produkt #234 wird zum Bestseller',
              '🌍 Internationale Expansion möglich',
              '⏰ Beste Verkaufszeit: 19-21 Uhr'
            ],
            generatedReports: 3
          };
        }

        return {
          ...prev,
          progress: Math.min(newProgress, 100),
          trendsFound,
          insights,
          estimatedTime: `${Math.max(0, 120 - Math.floor(newProgress * 1.2))}s`
        };
      });
    }, 800);
  };

  const stopAnalysis = () => {
    setResult(prev => ({ ...prev, status: 'idle', progress: 0 }));
  };

  const viewResults = () => {
    navigate('/analytics/trend-analysis');
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'running': return '#ffc107';
      case 'completed': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = () => {
    switch (result.status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏸️';
    }
  };

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
        <h1>🚀 Run Trend Analysis</h1>
        <p>Führe Trend-Analyse sofort aus und entdecke neue Insights</p>
      </div>

      <div className="analysis-container">
        {/* Konfigurations-Sektion */}
        <div className="config-section">
          <div className="metric-card full-width">
            <h3>⚙️ Analyse Konfiguration</h3>
            
            <div className="config-grid">
              <div className="config-group">
                <label>Zeitraum:</label>
                <select 
                  value={config.timeRange}
                  onChange={(e) => handleConfigChange('timeRange', e.target.value)}
                  disabled={result.status === 'running'}
                >
                  <option value="7d">Letzte 7 Tage</option>
                  <option value="30d">Letzte 30 Tage</option>
                  <option value="90d">Letzte 90 Tage</option>
                  <option value="1y">Letztes Jahr</option>
                </select>
              </div>

              <div className="config-group">
                <label>Analyse-Typ:</label>
                <select 
                  value={config.analysisType}
                  onChange={(e) => handleConfigChange('analysisType', e.target.value)}
                  disabled={result.status === 'running'}
                >
                  <option value="quick">Schnell-Analyse</option>
                  <option value="comprehensive">Umfassende Analyse</option>
                  <option value="deep">Tiefen-Analyse</option>
                </select>
              </div>

              <div className="config-group">
                <label>Alert-Schwelle:</label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="5"
                  value={config.alertThreshold}
                  onChange={(e) => handleConfigChange('alertThreshold', parseInt(e.target.value))}
                  disabled={result.status === 'running'}
                />
                <span>{config.alertThreshold}% Veränderung</span>
              </div>
            </div>

            <div className="data-sources">
              <label>Datenquellen:</label>
              <div className="source-buttons">
                {['sales', 'traffic', 'conversion', 'inventory', 'social', 'competitor'].map(source => (
                  <button
                    key={source}
                    className={`source-button ${config.dataSources.includes(source) ? 'active' : ''}`}
                    onClick={() => handleDataSourceToggle(source)}
                    disabled={result.status === 'running'}
                  >
                    {source === 'sales' && '💰 Sales'}
                    {source === 'traffic' && '👥 Traffic'}
                    {source === 'conversion' && '🎯 Conversion'}
                    {source === 'inventory' && '📦 Inventory'}
                    {source === 'social' && '💬 Social'}
                    {source === 'competitor' && '🏆 Competitor'}
                  </button>
                ))}
              </div>
            </div>

            <div className="analysis-actions">
              {result.status !== 'running' ? (
                <button className="action-button primary large" onClick={runAnalysis}>
                  🚀 Analyse Starten
                </button>
              ) : (
                <button className="action-button warning large" onClick={stopAnalysis}>
                  ⏹️ Analyse Stoppen
                </button>
              )}
              
              {result.status === 'completed' && (
                <button className="action-button success large" onClick={viewResults}>
                  📊 Ergebnisse Anzeigen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fortschritts-Sektion */}
        {result.status !== 'idle' && (
          <div className="progress-section">
            <div className="metric-card full-width">
              <h3>
                {getStatusIcon()} Analyse Fortschritt 
                <span style={{ color: getStatusColor(), marginLeft: '10px' }}>
                  {result.status === 'running' ? 'Läuft...' : 
                   result.status === 'completed' ? 'Abgeschlossen' : 'Pausiert'}
                </span>
              </h3>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${result.progress}%`, backgroundColor: getStatusColor() }}
                ></div>
                <span className="progress-text">{Math.round(result.progress)}%</span>
              </div>
              
              <div className="progress-stats">
                <div className="progress-stat">
                  <span>Geschätzte Zeit:</span>
                  <span>{result.estimatedTime}</span>
                </div>
                <div className="progress-stat">
                  <span>Trends gefunden:</span>
                  <span>{result.trendsFound}</span>
                </div>
                <div className="progress-stat">
                  <span>Reports generiert:</span>
                  <span>{result.generatedReports}</span>
                </div>
              </div>

              {/* Live Insights */}
              {result.insights.length > 0 && (
                <div className="live-insights">
                  <h4>🔍 Live Insights</h4>
                  <div className="insights-list">
                    {result.insights.map((insight, index) => (
                      <div key={index} className="insight-item live">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analyse-Historie */}
        <div className="history-section">
          <div className="metric-card full-width">
            <h3>📚 Letzte Analysen</h3>
            <div className="history-list">
              {analysisHistory.map(analysis => (
                <div key={analysis.id} className="history-item">
                  <span className="history-date">{analysis.date}</span>
                  <span className="history-trends">{analysis.trends} Trends</span>
                  <span className="history-duration">{analysis.duration}</span>
                  <span className={`history-status ${analysis.status}`}>
                    {analysis.status === 'completed' ? '✅' : '🔄'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunTrendAnalysis;