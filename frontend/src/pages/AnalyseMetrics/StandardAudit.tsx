import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface AuditCheck {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'failed' | 'not-checked';
  importance: 'critical' | 'important' | 'recommended';
  fixSuggestion: string;
  quickFix?: boolean;
}

interface AuditSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  failed: number;
  overallScore: number;
  criticalIssues: number;
}

const StandardAudit = () => {
  const navigate = useNavigate();
  const [auditChecks, setAuditChecks] = useState<AuditCheck[]>([]);
  const [summary, setSummary] = useState<AuditSummary>({
    totalChecks: 0,
    passed: 0,
    warnings: 0,
    failed: 0,
    overallScore: 0,
    criticalIssues: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scanInProgress, setScanInProgress] = useState(false);

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = () => {
    setLoading(true);
    
    // Simuliere Audit-Scan
    setTimeout(() => {
      const mockAuditChecks: AuditCheck[] = [
        // Performance Checks
        {
          id: 'perf-1',
          category: 'performance',
          name: 'Ladezeit optimieren',
          description: 'Seiten-Ladezeit unter 3 Sekunden',
          status: 'warning',
          importance: 'critical',
          fixSuggestion: 'Bilder komprimieren, Caching aktivieren',
          quickFix: true
        },
        {
          id: 'perf-2',
          category: 'performance',
          name: 'Mobile Performance',
          description: 'Mobile Ladezeit akzeptabel',
          status: 'passed',
          importance: 'important',
          fixSuggestion: 'Weiterhin überwachen'
        },
        {
          id: 'perf-3',
          category: 'performance',
          name: 'Browser-Caching',
          description: 'Caching korrekt konfiguriert',
          status: 'failed',
          importance: 'important',
          fixSuggestion: 'Cache-Header für statische Ressourcen setzen',
          quickFix: true
        },

        // SEO Checks
        {
          id: 'seo-1',
          category: 'seo',
          name: 'Meta-Titles',
          description: 'Einzigartige Title-Tags vorhanden',
          status: 'passed',
          importance: 'critical',
          fixSuggestion: '-'
        },
        {
          id: 'seo-2',
          category: 'seo',
          name: 'Meta-Descriptions',
          description: 'Meta-Beschreibungen optimieren',
          status: 'warning',
          importance: 'important',
          fixSuggestion: 'Beschreibungen für Produktseiten hinzufügen'
        },
        {
          id: 'seo-3',
          category: 'seo',
          name: 'SEO-freundliche URLs',
          description: 'URL-Struktur korrekt',
          status: 'passed',
          importance: 'recommended',
          fixSuggestion: '-'
        },

        // Security Checks
        {
          id: 'sec-1',
          category: 'security',
          name: 'SSL-Zertifikat',
          description: 'HTTPS aktiv und gültig',
          status: 'passed',
          importance: 'critical',
          fixSuggestion: '-'
        },
        {
          id: 'sec-2',
          category: 'security',
          name: 'Sicherheits-Headers',
          description: 'Basic Security Headers vorhanden',
          status: 'failed',
          importance: 'important',
          fixSuggestion: 'Content-Security-Policy implementieren'
        },
        {
          id: 'sec-3',
          category: 'security',
          name: 'Software-Updates',
          description: 'Aktuelle Versionen im Einsatz',
          status: 'warning',
          importance: 'critical',
          fixSuggestion: 'WordPress und Plugins updaten',
          quickFix: true
        },

        // UX/Conversion Checks
        {
          id: 'ux-1',
          category: 'ux',
          name: 'Mobile Responsive',
          description: 'Mobile Darstellung korrekt',
          status: 'passed',
          importance: 'critical',
          fixSuggestion: '-'
        },
        {
          id: 'ux-2',
          category: 'ux',
          name: 'Kontaktinformationen',
          description: 'Kontaktdaten leicht auffindbar',
          status: 'failed',
          importance: 'important',
          fixSuggestion: 'Im Footer und Impressum anzeigen'
        },
        {
          id: 'ux-3',
          category: 'ux',
          name: 'Ladeanzeigen',
          description: 'Loading States vorhanden',
          status: 'warning',
          importance: 'recommended',
          fixSuggestion: 'Loading-Spinner für langsame Bereiche'
        },

        // Content Checks
        {
          id: 'content-1',
          category: 'content',
          name: 'Rechtliche Seiten',
          description: 'Impressum, Datenschutz vorhanden',
          status: 'passed',
          importance: 'critical',
          fixSuggestion: '-'
        },
        {
          id: 'content-2',
          category: 'content',
          name: 'Produktbeschreibungen',
          description: 'Ausführliche Produktinfos',
          status: 'warning',
          importance: 'important',
          fixSuggestion: 'Beschreibungen um 30% erweitern'
        },
        {
          id: 'content-3',
          category: 'content',
          name: 'Bildqualität',
          description: 'Hohe Bildqualität gewährleistet',
          status: 'passed',
          importance: 'recommended',
          fixSuggestion: '-'
        }
      ];

      setAuditChecks(mockAuditChecks);
      calculateSummary(mockAuditChecks);
      setLoading(false);
    }, 2000);
  };

  const calculateSummary = (checks: AuditCheck[]) => {
    const total = checks.length;
    const passed = checks.filter(check => check.status === 'passed').length;
    const warnings = checks.filter(check => check.status === 'warning').length;
    const failed = checks.filter(check => check.status === 'failed').length;
    const criticalIssues = checks.filter(check => 
      check.importance === 'critical' && check.status !== 'passed'
    ).length;
    
    const score = Math.round((passed / total) * 100);

    setSummary({
      totalChecks: total,
      passed,
      warnings,
      failed,
      overallScore: score,
      criticalIssues
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  const runQuickScan = () => {
    setScanInProgress(true);
    setTimeout(() => {
      loadAuditData();
      setScanInProgress(false);
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#27ae60';
      case 'warning': return '#f39c12';
      case 'failed': return '#e74c3c';
      case 'not-checked': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'warning': return '⚠️';
      case 'failed': return '❌';
      case 'not-checked': return '⏸️';
      default: return '❓';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return '#e74c3c';
      case 'important': return '#f39c12';
      case 'recommended': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const applyQuickFix = (checkId: string) => {
    // Simuliere Quick Fix Anwendung
    setAuditChecks(prev => prev.map(check => 
      check.id === checkId 
        ? { ...check, status: 'passed' as const }
        : check
    ));
    
    // Recalculate summary after fix
    setTimeout(() => {
      calculateSummary(auditChecks.map(check => 
        check.id === checkId ? { ...check, status: 'passed' as const } : check
      ));
    }, 500);
  };

  const categories = ['all', 'performance', 'seo', 'security', 'ux', 'content'];
  const categoryNames = {
    all: 'Alle Kategorien',
    performance: '⚡ Performance',
    seo: '🔍 SEO',
    security: '🛡️ Sicherheit',
    ux: '🎨 UX/Conversion',
    content: '📝 Content'
  };

  const filteredChecks = selectedCategory === 'all' 
    ? auditChecks 
    : auditChecks.filter(check => check.category === selectedCategory);

  const quickFixes = auditChecks.filter(check => check.quickFix && check.status !== 'passed');

  if (loading) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBack}>
          ← Zurück
        </button>
        <div className="analytics-header">
          <h1>🔧 Standard Audit</h1>
          <p>Führe Basis-Audit durch...</p>
        </div>
        <div className="loading-spinner">🔍 Prüfe Shop-Grundfunktionen...</div>
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
        <h1>🔧 Standard Audit</h1>
        <p>Basis-Audit für schnelle Shop-Optimierung</p>
        
        <div className="header-controls">
          <button 
            className={`refresh-button ${scanInProgress ? 'scanning' : ''}`}
            onClick={runQuickScan}
            disabled={scanInProgress}
          >
            {scanInProgress ? '🔄 Scannt...' : '🔍 Schnell-Scan starten'}
          </button>
        </div>
      </div>

      {/* Audit Summary */}
      <div className="analysis-section">
        <div className="metric-card full-width health-score">
          <div className="health-score-main">
            <div className="score-circle">
              <div className="score-value">{summary.overallScore}</div>
              <div className="score-label">Audit-Score</div>
            </div>
            <div className="health-stats">
              <div className="health-stat">
                <span className="stat-label">Gesamt-Checks:</span>
                <span className="stat-value">{summary.totalChecks}</span>
              </div>
              <div className="health-stat">
                <span className="stat-label">Bestanden:</span>
                <span className="stat-value excellent">{summary.passed}</span>
              </div>
              <div className="health-stat">
                <span className="stat-label">Kritische Probleme:</span>
                <span className="stat-value critical">{summary.criticalIssues}</span>
              </div>
              <div className="health-stat">
                <span className="stat-label">Schnell-Fixes:</span>
                <span className="stat-value good">{quickFixes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Fixes Section */}
      {quickFixes.length > 0 && (
        <div className="analysis-section">
          <div className="metric-card full-width">
            <h3>🚀 Schnell-Fixes verfügbar</h3>
            <div className="quick-fixes-grid">
              {quickFixes.map((check) => (
                <div key={check.id} className="quick-fix-item">
                  <div className="quick-fix-content">
                    <h4>{check.name}</h4>
                    <p>{check.fixSuggestion}</p>
                    <span 
                      className="importance-badge"
                      style={{ backgroundColor: getImportanceColor(check.importance) }}
                    >
                      {check.importance.toUpperCase()}
                    </span>
                  </div>
                  <button 
                    className="quick-fix-button"
                    onClick={() => applyQuickFix(check.id)}
                  >
                    🔧 Jetzt fixen
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📋 Audit-Ergebnisse</h3>
          <div className="filter-controls">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {categoryNames[category as keyof typeof categoryNames]} 
                {category !== 'all' && (
                  <span className="filter-count">
                    ({auditChecks.filter(check => check.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Results */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <div className="audit-results">
            {filteredChecks.map((check) => (
              <div key={check.id} className="audit-check-item">
                <div className="check-status">
                  <span 
                    className="status-icon"
                    style={{ color: getStatusColor(check.status) }}
                  >
                    {getStatusIcon(check.status)}
                  </span>
                </div>
                <div className="check-content">
                  <div className="check-header">
                    <h4>{check.name}</h4>
                    <span 
                      className="importance-tag"
                      style={{ backgroundColor: getImportanceColor(check.importance) }}
                    >
                      {check.importance}
                    </span>
                  </div>
                  <p className="check-description">{check.description}</p>
                  <div className="check-fix">
                    <strong>Lösung:</strong> {check.fixSuggestion}
                  </div>
                </div>
                <div className="check-actions">
                  {check.quickFix && check.status !== 'passed' && (
                    <button 
                      className="action-button primary small"
                      onClick={() => applyQuickFix(check.id)}
                    >
                      🔧 Schnell-Fix
                    </button>
                  )}
                  <button className="action-button secondary small">
                    📋 Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📊 Fortschrittsübersicht</h3>
          <div className="progress-overview">
            <div className="progress-item">
              <div className="progress-label">Kritische Probleme</div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar critical"
                  style={{ width: `${(summary.criticalIssues / summary.totalChecks) * 100}%` }}
                ></div>
              </div>
              <div className="progress-value">{summary.criticalIssues}</div>
            </div>
            <div className="progress-item">
              <div className="progress-label">Warnungen</div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar warning"
                  style={{ width: `${(summary.warnings / summary.totalChecks) * 100}%` }}
                ></div>
              </div>
              <div className="progress-value">{summary.warnings}</div>
            </div>
            <div className="progress-item">
              <div className="progress-label">Bestanden</div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar success"
                  style={{ width: `${(summary.passed / summary.totalChecks) * 100}%` }}
                ></div>
              </div>
              <div className="progress-value">{summary.passed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="analysis-section">
        <div className="metric-card full-width info">
          <h3>🎯 Nächste Schritte</h3>
          <div className="next-steps">
            {summary.criticalIssues > 0 && (
              <div className="next-step critical">
                <span className="step-icon">🚨</span>
                <div className="step-content">
                  <strong>Kritische Probleme beheben ({summary.criticalIssues})</strong>
                  <p>Diese Probleme haben höchste Priorität und sollten sofort angegangen werden</p>
                </div>
              </div>
            )}
            {quickFixes.length > 0 && (
              <div className="next-step warning">
                <span className="step-icon">🔧</span>
                <div className="step-content">
                  <strong>Schnell-Fixes anwenden ({quickFixes.length})</strong>
                  <p>Einfache Probleme mit einem Klick beheben</p>
                </div>
              </div>
            )}
            <div className="next-step good">
              <span className="step-icon">✅</span>
              <div className="step-content">
                <strong>Regelmäßige Audits durchführen</strong>
                <p>Führen Sie monatliche Audits durch, um Probleme frühzeitig zu erkennen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardAudit;