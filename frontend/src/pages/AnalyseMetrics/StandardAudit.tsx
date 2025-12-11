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
  
  // KI/ML-Analyse States
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlInsights, setMlInsights] = useState<Array<{
    type: string;
    title: string;
    value: string;
    score?: number;
    detail?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    category?: string;
  }>>([]);

  // Audit-Daten vom Backend laden
  const loadAuditData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/standard');
      if (!res.ok) throw new Error('Fehler beim Laden der Audit-Daten');
      const data = await res.json();
      setAuditChecks(data.checks || []);
      calculateSummary(data.checks || []);
    } catch (_e) {
      setAuditChecks([]);
      calculateSummary([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // KI/ML-Analyse: Schnelle KI-Checks mit GPT
  const handleMLAnalyze = async () => {
    setMlLoading(true);
    setMlError(null);
    setMlInsights([]);
    try {
      let base = (import.meta.env.VITE_API_URL || '').trim();
      if (base.endsWith('/')) base = base.slice(0, -1);
      const apiUrl = base ? `${base}/api/audit/standard/ml-analysis` : `/api/audit/standard/ml-analysis`;
      
      const payload = {
        auditChecks: auditChecks,
        summary: summary
      };
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Fehler beim Laden der KI-Analyse');
      const data = await res.json();
      setMlInsights(data.mlInsights || []);
    } catch (err: any) {
      setMlError(err.message || 'KI-Analyse konnte nicht geladen werden.');
    }
    setMlLoading(false);
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

  // Scan auslösen und Daten neu laden
  const runQuickScan = async () => {
    setScanInProgress(true);
    try {
      const res = await fetch('/api/audit/standard/scan', { method: 'POST' });
      if (!res.ok) throw new Error('Scan konnte nicht gestartet werden');
      await res.json();
      await loadAuditData();
    } catch (_e) {
      // Fehlerhandling optional
    }
    setScanInProgress(false);
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
        
        <div className="header-controls" style={{display:'flex', gap:'16px', flexWrap:'wrap'}}>
          <button 
            className={`refresh-button ${scanInProgress ? 'scanning' : ''}`}
            onClick={runQuickScan}
            disabled={scanInProgress}
          >
            {scanInProgress ? '🔄 Scannt...' : '🔍 Schnell-Scan starten'}
          </button>
          <button 
            className="ml-analytics-btn" 
            onClick={handleMLAnalyze} 
            disabled={mlLoading || auditChecks.length === 0}
            title="KI-gestützte Quick-Checks & Optimierungsvorschläge"
            style={{
              fontSize:'1em', 
              padding:'8px 18px', 
              borderRadius:'8px', 
              background:'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', 
              color:'#fff', 
              border:'none', 
              minWidth:'200px', 
              display:'flex', 
              alignItems:'center', 
              gap:'8px',
              cursor: auditChecks.length === 0 ? 'not-allowed' : 'pointer',
              opacity: auditChecks.length === 0 ? 0.5 : 1
            }}
          >
            <span role="img" aria-label="AI" style={{fontSize: '1.2em'}}>🤖</span>
            {mlLoading ? 'KI prüft...' : 'KI-Quick-Check'}
          </button>
        </div>
        {mlError && <div className="error-message" style={{marginTop:'8px', color:'#e74c3c'}}>{mlError}</div>}
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

      {/* KI-Insights Sektion */}
      {mlInsights.length > 0 && (
        <div className="analysis-section">
          <div className="metric-card full-width" style={{background: 'rgba(102,126,234,0.05)', border: '2px solid rgba(102,126,234,0.2)'}}>
            <h4 style={{marginBottom: 16, color: '#667eea', display: 'flex', alignItems: 'center', gap: 8}}>
              <span role="img" aria-label="AI">🤖</span>
              KI-Quick-Check Ergebnisse
            </h4>
            <ul style={{listStyle:'none', padding:0, margin:0}}>
              {mlInsights.map((insight, idx) => (
                <li 
                  key={idx} 
                  style={{
                    background: insight.priority === 'critical' ? 'rgba(231,76,60,0.1)' : 
                               insight.priority === 'high' ? 'rgba(230,126,34,0.1)' :
                               insight.priority === 'medium' ? 'rgba(241,196,15,0.08)' : '#f6f8fa',
                    borderLeft: `4px solid ${
                      insight.priority === 'critical' ? '#e74c3c' :
                      insight.priority === 'high' ? '#e67e22' :
                      insight.priority === 'medium' ? '#f1c40f' : '#2563eb'
                    }`,
                    borderRadius: 8,
                    marginBottom: 12,
                    padding: '16px 18px',
                    boxShadow: '0 2px 8px rgba(102,126,234,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                    <span style={{fontWeight: 600, color: '#2563eb', fontSize: '1.05em'}}>{insight.title}</span>
                    {insight.priority && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.85em',
                        fontWeight: 600,
                        background: insight.priority === 'critical' ? '#e74c3c' :
                                   insight.priority === 'high' ? '#e67e22' :
                                   insight.priority === 'medium' ? '#f1c40f' : '#27ae60',
                        color: '#fff'
                      }}>
                        {insight.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span style={{fontSize: '1.08em', color: '#222', lineHeight: 1.5}}>{insight.value}</span>
                  {insight.detail && (
                    <span style={{color: '#6c757d', fontSize: '0.95em', marginTop: 4}}>{insight.detail}</span>
                  )}
                  {insight.category && (
                    <span style={{color: '#764ba2', fontSize: '0.9em', fontWeight: 500}}>
                      📂 {insight.category}
                    </span>
                  )}
                  {insight.score !== undefined && (
                    <span style={{color: '#764ba2', fontWeight: 600, fontSize: '0.95em'}}>
                      KI-Confidence: {Math.round(insight.score * 100)}%
                    </span>
                  )}
                </li>
              ))}
            </ul>
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