import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface QuickCheck {
  id: string;
  name: string;
  icon: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  value: string;
  trend: number;
  description: string;
  quickAction?: string;
}

interface MiniMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

const MiniAudit = () => {
  const navigate = useNavigate();
  const [quickChecks, setQuickChecks] = useState<QuickCheck[]>([]);
  const [miniMetrics, setMiniMetrics] = useState<MiniMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanTime, setScanTime] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadMiniAuditData();
  }, []);

  const loadMiniAuditData = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      let base = (import.meta.env.VITE_API_URL || '').trim();
      if (base.endsWith('/')) base = base.slice(0, -1);
      const apiUrl = base ? `${base}/api/audit/mini` : `/api/audit/mini`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Fehler beim Laden der Mini-Audit-Daten');
      const data = await res.json();
      if (data.success && data.data) {
        setQuickChecks(data.data.quickChecks);
        setMiniMetrics(data.data.miniMetrics);
      }
    } catch (_err) {
      // Fallback zu Mock-Daten
      const mockQuickChecks: QuickCheck[] = [
        {
          id: 'load-time',
          name: 'Ladezeit',
          icon: '⚡',
          status: 'good',
          value: '1.8s',
          trend: 12,
          description: 'Seiten-Geschwindigkeit',
          quickAction: 'Cache optimieren'
        },
        {
          id: 'mobile-score',
          name: 'Mobile',
          icon: '📱',
          status: 'warning',
          value: '72/100',
          trend: -5,
          description: 'Mobile Performance',
          quickAction: 'Responsive prüfen'
        },
        {
          id: 'seo-basic',
          name: 'SEO Basis',
          icon: '🔍',
          status: 'good',
          value: '85/100',
          trend: 3,
          description: 'Grundlegende SEO',
          quickAction: 'Meta-Tags prüfen'
        },
        {
          id: 'security',
          name: 'Sicherheit',
          icon: '🛡️',
          status: 'excellent',
          value: '95/100',
          trend: 2,
          description: 'Basic Security Check'
        },
        {
          id: 'uptime',
          name: 'Verfügbarkeit',
          icon: '📈',
          status: 'excellent',
          value: '99.9%',
          trend: 0,
          description: 'Uptime letzten 30 Tage'
        },
        {
          id: 'core-vitals',
          name: 'Core Vitals',
          icon: '🎯',
          status: 'warning',
          value: '68/100',
          trend: -8,
          description: 'Google Core Web Vitals',
          quickAction: 'CLS optimieren'
        }
      ];

      const mockMiniMetrics: MiniMetric[] = [
        {
          id: 'conversion',
          name: 'Conversion Rate',
          value: 2.3,
          target: 3.0,
          unit: '%',
          status: 'warning'
        },
        {
          id: 'bounce-rate',
          name: 'Absprungrate',
          value: 42,
          target: 35,
          unit: '%',
          status: 'critical'
        },
        {
          id: 'page-views',
          name: 'Seitenaufrufe',
          value: 12450,
          target: 10000,
          unit: '',
          status: 'excellent'
        },
        {
          id: 'avg-session',
          name: 'Session-Dauer',
          value: 2.8,
          target: 3.0,
          unit: 'min',
          status: 'good'
        }
      ];

      setQuickChecks(mockQuickChecks);
      setMiniMetrics(mockMiniMetrics);
    } finally {
      setScanTime(Date.now() - startTime);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const runQuickScan = async () => {
    setIsScanning(true);
    try {
      let base = (import.meta.env.VITE_API_URL || '').trim();
      if (base.endsWith('/')) base = base.slice(0, -1);
      const apiUrl = base ? `${base}/api/audit/mini/scan` : `/api/audit/mini/scan`;
      const res = await fetch(apiUrl, { method: 'POST' });
      if (!res.ok) throw new Error('Scan konnte nicht gestartet werden');
      await res.json();
      await loadMiniAuditData();
    } catch (_err) {
      // Bei Fehler: lokaler Scan
      await loadMiniAuditData();
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#27ae60';
      case 'good': return '#3498db';
      case 'warning': return '#f39c12';
      case 'critical': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return '✅';
      case 'good': return '👍';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? '↗️' : '↘️';
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? '#27ae60' : '#e74c3c';
  };

  const applyQuickAction = (checkId: string) => {
    // Simuliere Quick Action
    setQuickChecks(prev => prev.map(check => 
      check.id === checkId 
        ? { 
            ...check, 
            status: 'good' as const,
            trend: Math.abs(check.trend),
            value: check.id === 'load-time' ? '1.4s' : 
                   check.id === 'mobile-score' ? '78/100' :
                   check.id === 'core-vitals' ? '75/100' : check.value
          }
        : check
    ));
  };

  const criticalIssues = quickChecks.filter(check => 
    check.status === 'critical' || check.status === 'warning'
  ).length;

  const excellentScores = quickChecks.filter(check => 
    check.status === 'excellent'
  ).length;

  if (loading) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBack}>
          ← Zurück
        </button>
        <div className="analytics-header">
          <h1>🔎 Mini Audit</h1>
          <p>Starte schnellen Shop-Check...</p>
        </div>
        <div className="loading-spinner">⚡ Prüfe Hauptkennzahlen...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Floating Back Button */}
      <button className="back-button floating-back" onClick={handleBack}>
        ← Zurück
      </button>

      <div className="analytics-header mini-audit-header">
        <div className="header-main">
          <h1>🔎 Mini Audit</h1>
          <p>Schneller Check der wichtigsten Shop-Kennzahlen</p>
        </div>
        
        <div className="header-controls">
          <div className="scan-info">
            <span className="scan-time">⏱️ {scanTime}ms</span>
            <span className="scan-status">{isScanning ? 'Scannt...' : 'Bereit'}</span>
          </div>
          <button 
            className={`refresh-button mini-scan ${isScanning ? 'scanning' : ''}`}
            onClick={runQuickScan}
            disabled={isScanning}
          >
            {isScanning ? '⚡ Scannt...' : '🔎 Schnell-Check'}
          </button>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="analysis-section">
        <div className="metric-card full-width mini-overview">
          <div className="overview-stats">
            <div className="overview-stat">
              <div className="stat-value">{quickChecks.length}</div>
              <div className="stat-label">Geprüfte Bereiche</div>
            </div>
            <div className="overview-stat">
              <div className="stat-value excellent">{excellentScores}</div>
              <div className="stat-label">Optimal</div>
            </div>
            <div className="overview-stat">
              <div className="stat-value warning">{criticalIssues}</div>
              <div className="stat-label">Aktionen benötigt</div>
            </div>
            <div className="overview-stat">
              <div className="stat-value">{miniMetrics.length}</div>
              <div className="stat-label">Business KPIs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Checks Grid */}
      <div className="analysis-section">
        <h3>⚡ Schnell-Checks</h3>
        <div className="mini-checks-grid">
          {quickChecks.map((check) => (
            <div key={check.id} className="mini-check-card">
              <div className="check-header">
                <div className="check-icon">{check.icon}</div>
                <div className="check-name">{check.name}</div>
                <div 
                  className="check-status-badge"
                  style={{ backgroundColor: getStatusColor(check.status) }}
                >
                  {getStatusIcon(check.status)}
                </div>
              </div>
              
              <div className="check-value">{check.value}</div>
              
              <div className="check-trend">
                <span 
                  className="trend-indicator"
                  style={{ color: getTrendColor(check.trend) }}
                >
                  {getTrendIcon(check.trend)} {Math.abs(check.trend)}%
                </span>
              </div>
              
              <div className="check-description">{check.description}</div>
              
              {check.quickAction && (
                <button 
                  className="quick-action-button"
                  onClick={() => applyQuickAction(check.id)}
                >
                  🚀 {check.quickAction}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mini Metrics */}
      <div className="analysis-section">
        <h3>📊 Business KPIs</h3>
        <div className="mini-metrics-grid">
          {miniMetrics.map((metric) => (
            <div key={metric.id} className="mini-metric-card">
              <div className="metric-name">{metric.name}</div>
              <div className="metric-value-container">
                <div className="metric-value">
                  {metric.value}
                  <span className="metric-unit">{metric.unit}</span>
                </div>
                <div 
                  className="metric-status"
                  style={{ color: getStatusColor(metric.status) }}
                >
                  {getStatusIcon(metric.status)}
                </div>
              </div>
              <div className="metric-target">
                Ziel: {metric.target}{metric.unit}
              </div>
              <div className="metric-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
                    backgroundColor: getStatusColor(metric.status)
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🎯 Sofort-Maßnahmen</h3>
          <div className="immediate-actions">
            {criticalIssues > 0 ? (
              <div className="action-list">
                {quickChecks
                  .filter(check => check.status === 'critical' || check.status === 'warning')
                  .slice(0, 3)
                  .map((check) => (
                    <div key={check.id} className="action-item">
                      <span className="action-icon">{check.icon}</span>
                      <div className="action-content">
                        <strong>{check.name} verbessern</strong>
                        <p>{check.description} - Aktuell: {check.value}</p>
                      </div>
                      {check.quickAction && (
                        <button 
                          className="action-button primary small"
                          onClick={() => applyQuickAction(check.id)}
                        >
                          Jetzt fixen
                        </button>
                      )}
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="all-good-message">
                <span className="success-icon">🎉</span>
                <div>
                  <strong>Alles im grünen Bereich!</strong>
                  <p>Ihr Shop performt ausgezeichnet in allen wichtigen Bereichen.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="analysis-section">
        <div className="metric-card full-width info">
          <h3>💡 Tipps für heute</h3>
          <div className="quick-tips">
            <div className="quick-tip">
              <span className="tip-icon">📸</span>
              <div className="tip-content">
                <strong>Bilder komprimieren</strong>
                <p>Reduzieren Sie Bildgrößen um 20-30% für schnellere Ladezeiten</p>
              </div>
            </div>
            <div className="quick-tip">
              <span className="tip-icon">🔍</span>
              <div className="tip-content">
                <strong>Meta-Titles prüfen</strong>
                <p>Stellen Sie sicher, dass jede Seite einen einzigartigen Title hat</p>
              </div>
            </div>
            <div className="quick-tip">
              <span className="tip-icon">📱</span>
              <div className="tip-content">
                <strong>Mobile Test</strong>
                <p>Testen Sie Ihren Shop auf verschiedenen Mobilgeräten</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <div className="export-options">
            <h3>📤 Export & Weiter</h3>
            <div className="export-buttons">
              <button className="export-button">
                📋 Report kopieren
              </button>
              <button className="export-button">
                📧 Email senden
              </button>
              <button 
                className="export-button primary"
                onClick={() => navigate('/analytics/premium-audit')}
              >
                🔍 Detaillierten Audit starten
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniAudit;