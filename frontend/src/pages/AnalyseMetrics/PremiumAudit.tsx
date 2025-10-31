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

  useEffect(() => {
    // Simuliere Audit-Daten laden
    setTimeout(() => {
      const mockAuditData: AuditCategory[] = [
        {
          id: 'performance',
          name: '⚡ Performance',
          score: 72,
          status: 'warning',
          recommendations: 8,
          details: 'Ladezeiten und Core Web Vitals optimierungsbedürftig'
        },
        {
          id: 'seo',
          name: '🔍 SEO',
          score: 65,
          status: 'warning',
          recommendations: 12,
          details: 'Meta-Tags, Strukturierte Daten und Inhaltsoptimierung benötigt'
        },
        {
          id: 'security',
          name: '🛡️ Sicherheit',
          score: 88,
          status: 'good',
          recommendations: 4,
          details: 'Gute Sicherheitsbasis, kleine Verbesserungen möglich'
        },
        {
          id: 'conversion',
          name: '💰 Conversion',
          score: 45,
          status: 'critical',
          recommendations: 15,
          details: 'Hohe Abbruchraten, Checkout-Prozess optimierungsbedürftig'
        },
        {
          id: 'mobile',
          name: '📱 Mobile Experience',
          score: 78,
          status: 'good',
          recommendations: 6,
          details: 'Gute Mobile Performance, kleine Anpassungen empfohlen'
        },
        {
          id: 'content',
          name: '📝 Content Quality',
          score: 82,
          status: 'good',
          recommendations: 5,
          details: 'Hohe Inhaltsqualität, weitere Optimierung möglich'
        },
        {
          id: 'technical',
          name: '🔧 Technische Struktur',
          score: 58,
          status: 'warning',
          recommendations: 9,
          details: 'Code-Qualität und Architektur verbesserungsfähig'
        },
        {
          id: 'ux',
          name: '🎨 User Experience',
          score: 71,
          status: 'warning',
          recommendations: 7,
          details: 'Navigation und Benutzerführung können verbessert werden'
        }
      ];

      const mockRecommendations: AuditRecommendation[] = [
        {
          id: 'conv-1',
          category: 'conversion',
          title: 'Checkout-Prozess optimieren',
          description: 'Reduzieren Sie die Anzahl der Schritte im Checkout und fügen Sie Trust-Badges hinzu',
          priority: 'high',
          impact: 85,
          effort: 'medium',
          estimatedTime: '2-3 Wochen'
        },
        {
          id: 'perf-1',
          category: 'performance',
          title: 'Bildkomprimierung implementieren',
          description: 'Implementieren Sie WebP-Format und Lazy Loading für Produktbilder',
          priority: 'high',
          impact: 75,
          effort: 'low',
          estimatedTime: '1 Woche'
        },
        {
          id: 'seo-1',
          category: 'seo',
          title: 'Strukturierte Daten hinzufügen',
          description: 'Implementieren Sie Schema.org Markup für Produkte und Bewertungen',
          priority: 'high',
          impact: 70,
          effort: 'medium',
          estimatedTime: '2 Wochen'
        },
        {
          id: 'seo-2',
          category: 'seo',
          title: 'Meta-Beschreibungen optimieren',
          description: 'Erstellen Sie einzigartige Meta-Beschreibungen für alle Produktseiten',
          priority: 'medium',
          impact: 60,
          effort: 'low',
          estimatedTime: '1 Woche'
        },
        {
          id: 'conv-2',
          category: 'conversion',
          title: 'Exit-Intent Popup implementieren',
          description: 'Fangen Sie abspringende Besucher mit speziellen Angeboten ab',
          priority: 'medium',
          impact: 55,
          effort: 'low',
          estimatedTime: '3-4 Tage'
        },
        {
          id: 'technical-1',
          category: 'technical',
          title: 'CSS und JavaScript minifizieren',
          description: 'Reduzieren Sie die Dateigrößen durch Komprimierung und Bundling',
          priority: 'medium',
          impact: 65,
          effort: 'low',
          estimatedTime: '1 Woche'
        },
        {
          id: 'ux-1',
          category: 'ux',
          title: 'Breadcrumb-Navigation hinzufügen',
          description: 'Verbessern Sie die Navigation und SEO durch Breadcrumbs',
          priority: 'medium',
          impact: 50,
          effort: 'low',
          estimatedTime: '2-3 Tage'
        },
        {
          id: 'security-1',
          category: 'security',
          title: 'Content Security Policy implementieren',
          description: 'Erhöhen Sie die Sicherheit durch CSP-Header',
          priority: 'low',
          impact: 40,
          effort: 'medium',
          estimatedTime: '1 Woche'
        }
      ];

      setAuditData(mockAuditData);
      setRecommendations(mockRecommendations);
      
      // Berechne Gesamt-Score
      const totalScore = mockAuditData.reduce((sum, category) => sum + category.score, 0) / mockAuditData.length;
      setOverallScore(Math.round(totalScore));
      setLoading(false);
    }, 1500);
  }, []);

  const handleBack = () => {
    navigate('/');
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
        
        <div className="header-controls">
          <button className="refresh-button">
            📊 Audit-Report exportieren
          </button>
        </div>
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
                  <button className="action-button primary">Jetzt umsetzen</button>
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
    </div>
  );
};

export default PremiumAudit;