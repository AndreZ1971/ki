import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface AuditCategory {
  id: string;
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  recommendations: number;
  details: string;
}

interface AuditRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  effort: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

const PremiumAudit = () => {
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState<AuditCategory[]>([]);
  const [recommendations, setRecommendations] = useState<AuditRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [overallScore, setOverallScore] = useState(0);
  
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

  // Details Modal States
  const [selectedRecommendation, setSelectedRecommendation] = useState<AuditRecommendation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Audit-Daten laden
  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/premium');
      if (!res.ok) throw new Error('Fehler beim Laden der Audit-Daten');
      const data = await res.json();
      setAuditData(data.categories || []);
      setRecommendations(data.recommendations || []);
      if (data.categories && data.categories.length > 0) {
        const totalScore = data.categories.reduce((sum: number, cat: any) => sum + cat.score, 0) / data.categories.length;
        setOverallScore(Math.round(totalScore));
      } else {
        setOverallScore(0);
      }
    } catch (_e) {
      setAuditData([]);
      setRecommendations([]);
      setOverallScore(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  // KI/ML-Analyse: Shop-Optimierung mit GPT
  const handleMLAnalyze = async () => {
    setMlLoading(true);
    setMlError(null);
    setMlInsights([]);
    try {
      let base = (import.meta.env.VITE_API_URL || '').trim();
      if (base.endsWith('/')) base = base.slice(0, -1);
      const apiUrl = base ? `${base}/api/audit/premium/ml-analysis` : `/api/audit/premium/ml-analysis`;
      
      // Nur echte Daten verwenden - keine Mock-Fallbacks
      const payload = {
        auditData: auditData,
        recommendations: recommendations,
        overallScore: overallScore
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

  // Audit starten
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string|null>(null);
  const startAuditScan = async () => {
    setScanLoading(true);
    setScanError(null);
    try {
      const res = await fetch('/api/audit/premium/scan', { method: 'POST' });
      if (!res.ok) throw new Error('Audit konnte nicht gestartet werden');
      await res.json();
      await fetchAudit();
    } catch (e: any) {
      setScanError(e.message || 'Unbekannter Fehler');
    }
    setScanLoading(false);
  };

  const handleBack = () => {
    navigate('/');
  };

  // Details Modal Handler
  const openDetailsModal = (recommendation: AuditRecommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setTimeout(() => setSelectedRecommendation(null), 300);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  if (loading) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBack}>
          ← Zurück
        </button>
        <div className="analytics-header">
          <h1>⭐ Premium Audit</h1>
          <p>Führe umfassenden Shop-Audit durch...</p>
        </div>
        <div className="loading-spinner">🔍 Analysiere alle Shop-Bereiche...</div>
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
        <h1>⭐ Premium Audit</h1>
        <p>Umfassender Shop-Audit mit detaillierten Optimierungsempfehlungen</p>
        <div className="header-controls" style={{display:'flex', gap:'16px', flexWrap:'wrap'}}>
          <button className="refresh-button" onClick={startAuditScan} disabled={scanLoading}>
            {scanLoading ? '🔄 Audit läuft...' : '🔍 Audit jetzt starten'}
          </button>
          <button 
            className="ml-analytics-btn" 
            onClick={handleMLAnalyze} 
            disabled={mlLoading}
            title="KI-gestützte Optimierungsvorschläge & Cost-Benefit-Analyse"
            style={{
              fontSize:'1em', 
              padding:'8px 18px', 
              borderRadius:'8px', 
              background:'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', 
              color:'#fff', 
              border:'none', 
              minWidth:'220px', 
              display:'flex', 
              alignItems:'center', 
              gap:'8px',
              cursor: mlLoading ? 'not-allowed' : 'pointer',
              opacity: mlLoading ? 0.5 : 1
            }}
          >
            <span role="img" aria-label="AI" style={{fontSize: '1.2em'}}>🤖</span>
            {mlLoading ? 'KI analysiert...' : 'KI-Optimierung starten'}
          </button>
          <button className="refresh-button">
            📊 Audit-Report exportieren
          </button>
        </div>
        {scanError && <div style={{color:'#e74c3c', marginTop:'8px'}}>{scanError}</div>}
        {mlError && <div className="error-message" style={{marginTop:'8px', color:'#e74c3c'}}>{mlError}</div>}
      </div>

      {/* Overall Audit Score */}
      <div className="analysis-section">
        <div className="metric-card full-width health-score">
          <div className="health-score-main">
            <div className="score-circle">
              <div className="score-value">{overallScore}</div>
              <div className="score-label">Audit-Score</div>
            </div>
            <div className="health-stats">
              <div className="health-stat">
                <span className="stat-label">Kritische Bereiche:</span>
                <span className="stat-value critical">
                  {auditData.filter(cat => cat.status === 'critical').length}
                </span>
              </div>
              <div className="health-stat">
                <span className="stat-label">Empfehlungen:</span>
                <span className="stat-value good">{recommendations.length}</span>
              </div>
              <div className="health-stat">
                <span className="stat-label">Optimale Bereiche:</span>
                <span className="stat-value excellent">
                  {auditData.filter(cat => cat.status === 'excellent').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Categories Grid */}
      <div className="analysis-section">
        <h3>📊 Audit-Kategorien</h3>
        <div className="analytics-grid-2x4">
          {auditData.map((category) => (
            <div 
              key={category.id}
              className={`metric-card audit-category ${selectedCategory === category.id ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="metric-icon">{category.name.split(' ')[0]}</div>
              <div className="metric-label">{category.name.split(' ')[1]}</div>
              <div className="metric-value">{category.score}%</div>
              <div 
                className="trend-indicator"
                style={{ color: getStatusColor(category.status) }}
              >
                {getStatusIcon(category.status)} {category.status.toUpperCase()}
              </div>
              <div className="recommendations-count">
                {category.recommendations} Empfehlungen
              </div>
              <div className="category-details">
                {category.details}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <div className="recommendations-header">
            <h3>💡 Optimierungsempfehlungen</h3>
            <div className="filter-controls">
              <button 
                className={`filter-button ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                Alle ({recommendations.length})
              </button>
              {auditData.map(category => (
                <button
                  key={category.id}
                  className={`filter-button ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name.split(' ')[1]} ({category.recommendations})
                </button>
              ))}
            </div>
          </div>

          {/* KI-Insights Sektion */}
          {mlInsights.length > 0 && (
            <div style={{marginBottom: 24, padding: '20px', background: 'rgba(102,126,234,0.05)', borderRadius: 12, border: '2px solid rgba(102,126,234,0.2)'}}>
              <h4 style={{marginBottom: 16, color: '#667eea', display: 'flex', alignItems: 'center', gap: 8}}>
                <span role="img" aria-label="AI">🤖</span>
                KI-Optimierungsvorschläge
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
          )}

          <div className="recommendations-list">
            {filteredRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="recommendation-item">
                <div className="rec-main">
                  <div className="rec-header">
                    <h4>{recommendation.title}</h4>
                    <div className="rec-meta">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(recommendation.priority) }}
                      >
                        {recommendation.priority.toUpperCase()}
                      </span>
                      <span className="impact">Impact: {recommendation.impact}%</span>
                    </div>
                  </div>
                  <p className="rec-description">{recommendation.description}</p>
                  <div className="rec-details">
                    <span 
                      className="effort-badge"
                      style={{ backgroundColor: getEffortColor(recommendation.effort) }}
                    >
                      Aufwand: {recommendation.effort}
                    </span>
                    <span className="estimated-time">⏱️ {recommendation.estimatedTime}</span>
                    <span className="rec-category">
                      Kategorie: {auditData.find(cat => cat.id === recommendation.category)?.name}
                    </span>
                  </div>
                </div>
                <div className="rec-actions">
                  <button 
                    className="action-button primary"
                    onClick={() => openDetailsModal(recommendation)}
                  >
                    📋 Details
                  </button>
                  <button className="action-button secondary">Später erinnern</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>⚡ Schnellaktionen</h3>
          <div className="quick-actions">
            <button className="action-button primary">📈 SEO sofort optimieren</button>
            <button className="action-button warning">⚡ Performance boosten</button>
            <button className="action-button success">💰 Conversion erhöhen</button>
            <button className="action-button secondary">🔒 Sicherheit prüfen</button>
          </div>
        </div>
      </div>

      {/* Implementation Timeline */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📅 Umsetzungsplan</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-phase">Phase 1</div>
              <div className="timeline-content">
                <h4>Kritische Probleme beheben</h4>
                <p>Hohe Priorität - Sofort umsetzen</p>
                <div className="timeline-recs">
                  {filteredRecommendations.filter(rec => rec.priority === 'high').slice(0, 3).map(rec => (
                    <span key={rec.id} className="timeline-rec">{rec.title}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-phase">Phase 2</div>
              <div className="timeline-content">
                <h4>Mittlere Optimierungen</h4>
                <p>Mittlere Priorität - Nächste 2 Wochen</p>
                <div className="timeline-recs">
                  {filteredRecommendations.filter(rec => rec.priority === 'medium').slice(0, 3).map(rec => (
                    <span key={rec.id} className="timeline-rec">{rec.title}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-phase">Phase 3</div>
              <div className="timeline-content">
                <h4>Langfristige Verbesserungen</h4>
                <p>Niedrige Priorität - Nächste 2 Monate</p>
                <div className="timeline-recs">
                  {filteredRecommendations.filter(rec => rec.priority === 'low').slice(0, 3).map(rec => (
                    <span key={rec.id} className="timeline-rec">{rec.title}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRecommendation && (
        <div 
          className="modal-overlay"
          onClick={closeDetailsModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-in'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 600,
              maxHeight: 80 + 'vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24}}>
              <div>
                <h2 style={{margin: 0, marginBottom: 8, color: '#f5f7ff', fontSize: '1.5em'}}>
                  {selectedRecommendation.title}
                </h2>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: '0.85em',
                    fontWeight: 600,
                    background: getPriorityColor(selectedRecommendation.priority),
                    color: '#fff',
                    marginRight: 8
                  }}
                >
                  {selectedRecommendation.priority.toUpperCase()}
                </span>
              </div>
              <button
                onClick={closeDetailsModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5em',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#6c757d',
                  transition: 'color 0.2s'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{marginBottom: 24}}>
              <h3 style={{margin: '0 0 12px 0', color: '#f5f7ff'}}>📝 Beschreibung</h3>
              <p style={{margin: 0, color: '#555', lineHeight: 1.6}}>{selectedRecommendation.description}</p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24}}>
              <div style={{background: '#f8f9fa', padding: 16, borderRadius: 8}}>
                <div style={{color: '#6c757d', fontSize: '0.9em', marginBottom: 4}}>Impact</div>
                <div style={{fontSize: '1.3em', fontWeight: 600, color: getPriorityColor(selectedRecommendation.priority)}}>
                  {selectedRecommendation.impact}%
                </div>
              </div>
              <div style={{background: '#f8f9fa', padding: 16, borderRadius: 8}}>
                <div style={{color: '#6c757d', fontSize: '0.9em', marginBottom: 4}}>Aufwand</div>
                <div style={{fontSize: '1.1em', fontWeight: 600, color: getEffortColor(selectedRecommendation.effort)}}>
                  {selectedRecommendation.effort.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24}}>
              <div style={{background: '#f8f9fa', padding: 16, borderRadius: 8}}>
                <div style={{color: '#6c757d', fontSize: '0.9em', marginBottom: 4}}>Kategorie</div>
                <div style={{fontSize: '1.1em', fontWeight: 600, color: '#f5f7ff'}}>
                  {auditData.find(cat => cat.id === selectedRecommendation.category)?.name || 'N/A'}
                </div>
              </div>
              <div style={{background: '#f8f9fa', padding: 16, borderRadius: 8}}>
                <div style={{color: '#6c757d', fontSize: '0.9em', marginBottom: 4}}>Geschätzter Aufwand</div>
                <div style={{fontSize: '1.1em', fontWeight: 600, color: '#f5f7ff'}}>
                  {selectedRecommendation.estimatedTime}
                </div>
              </div>
            </div>

            <div style={{display: 'flex', gap: 12}}>
              <button 
                onClick={() => {
                  closeDetailsModal();
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
              >
                ✅ Jetzt umsetzen
              </button>
              <button 
                onClick={closeDetailsModal}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumAudit;

// Animationen für Modal
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { 
        opacity: 0; 
        transform: translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
  `;
  if (!document.head.querySelector('style[data-premium-audit-modal]')) {
    style.setAttribute('data-premium-audit-modal', 'true');
    document.head.appendChild(style);
  }
}