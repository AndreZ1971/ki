import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const FeedbackAnalysis: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const navigate = useNavigate();

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analytics/feedback/reviews`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (_err) {
      setError('Fehler beim Laden der Bewertungen');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analytics/feedback/tickets`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (_err) {
      setError('Fehler beim Laden der Tickets');
    } finally {
      setLoading(false);
    }
  };

  const analyzeFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analytics/feedback/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews, tickets })
      });
      const data = await res.json();
      setAnalysis(data.analysis || []);
      setSummary(data.summary || null);
    } catch (_err) {
      setError('Fehler bei der Analyse');
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => navigate('/');

  return (
    <div className="analytics-page">
      <button className="back-button floating-back" onClick={handleBack}>← Zurück</button>
      <div className="analytics-header">
        <h1>📝 Kunden-Feedback-Analyse</h1>
        <p>
          Analysiere Kundenbewertungen & Support-Tickets mit KI, entdecke Trends, Stimmungen und Optimierungspotenziale. Erhalte professionelle Insights und konkrete Next Steps für deinen Shop-Erfolg.
        </p>
      </div>

      <div className="actions-grid">
        <button className="action-button primary" onClick={fetchReviews} disabled={loading}>⭐ Bewertungen laden</button>
        <button className="action-button primary" onClick={fetchTickets} disabled={loading}>🎫 Support-Tickets laden</button>
        <button className="action-button secondary" onClick={analyzeFeedback} disabled={loading || reviews.length === 0 || tickets.length === 0}>🧠 Feedback analysieren</button>
        <button className="action-button secondary" onClick={() => setShowRaw((v) => !v)}>
          {showRaw ? '🔒 Rohdaten ausblenden' : '🔎 Rohdaten anzeigen'}
        </button>
      </div>

      {loading && <div className="loading-spinner">⏳ Analyse läuft...</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Zusammenfassung als Card */}
      {summary && (
        <div className="metric-card full-width" style={{margin: '32px 0'}}>
          <h3>🧾 Zusammenfassung</h3>
          <div style={{fontSize: '1.1rem', color: '#2c3e50', marginBottom: 12}}>{summary.text || summary.summary || 'Keine Zusammenfassung verfügbar.'}</div>
          {summary.sentiment && (
            <div style={{fontWeight: 700, color: summary.sentiment === 'positive' ? '#27ae60' : summary.sentiment === 'negative' ? '#e74c3c' : '#f39c12'}}>
              Stimmung: {summary.sentiment === 'positive' ? '😊 Positiv' : summary.sentiment === 'negative' ? '😟 Negativ' : '😐 Neutral'}
            </div>
          )}
        </div>
      )}

      {/* Insights Grid */}
      {Array.isArray(analysis) && analysis.length > 0 && (
        <div className="analytics-grid-2x4" style={{marginBottom: 40}}>
          {analysis.map((insight, i) => {
            // Map Backend-Format (category/finding) auf Frontend-Format
            const category = insight.category || 'Other';
            const finding = insight.finding || insight.value || '';
            const recommendation = insight.recommendation || insight.detail || '';
            const confidence = insight.confidence || 0;
            const impact = insight.impact || 'medium';
            
            // Icon basierend auf Kategorie
            let icon = '🔎';
            if (category === 'Customer' || category === 'sentiment') icon = '💬';
            if (category === 'Performance' || category === 'trend') icon = '📈';
            if (category === 'Products' || category === 'topic') icon = '🏷️';
            if (category === 'Traffic' || category === 'complaint') icon = '⚠️';
            if (category === 'Conversion' || category === 'praise') icon = '🌟';
            
            // Impact-Badge
            const impactColor = impact === 'high' ? '#e74c3c' : impact === 'medium' ? '#f39c12' : '#27ae60';
            const impactText = impact === 'high' ? 'Hoch' : impact === 'medium' ? 'Mittel' : 'Niedrig';
            
            return (
              <div className="metric-card" key={i}>
                <div className="metric-icon" style={{fontSize: '2.2rem'}}>{icon}</div>
                <div className="metric-label" style={{fontSize: '1.1rem', fontWeight: 700, color: '#2c3e50'}}>{category}</div>
                <div className="metric-value" style={{fontSize: '0.95rem', lineHeight: '1.5', color: '#34495e', marginTop: 8}}>
                  {finding}
                </div>
                {recommendation && (
                  <div style={{
                    background: '#f0f4ff', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    marginTop: 12, 
                    fontSize: '0.9rem',
                    color: '#2c3e50',
                    borderLeft: '3px solid #3498db'
                  }}>
                    💡 <strong>Empfehlung:</strong> {recommendation}
                  </div>
                )}
                <div style={{display: 'flex', gap: 12, marginTop: 12, alignItems: 'center'}}>
                  <span style={{
                    background: impactColor, 
                    color: 'white', 
                    padding: '4px 10px', 
                    borderRadius: 12, 
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    Impact: {impactText}
                  </span>
                  <span style={{
                    color: '#7f8c8d',
                    fontSize: '0.85rem'
                  }}>
                    ✓ {confidence}% Konfidenz
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Next Steps / Empfehlungen */}
      {summary?.nextSteps && Array.isArray(summary.nextSteps) && summary.nextSteps.length > 0 && (
        <div className="next-steps" style={{marginBottom: 32}}>
          <h3>🚀 Empfohlene Next Steps</h3>
          {summary.nextSteps.map((step: any, i: number) => (
            <div className={`next-step ${step.criticality || 'good'}`} key={i}>
              <span className="step-icon">
                {step.criticality === 'critical' && '❗'}
                {step.criticality === 'warning' && '⚠️'}
                {step.criticality === 'good' && '✅'}
                {!step.criticality && '➡️'}
              </span>
              <div className="step-content">
                <strong>{step.title || 'Empfehlung'}</strong>
                <p>{step.description || step.text || ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistik-Kacheln mit erweiterten Infos */}
      {(reviews.length > 0 || tickets.length > 0 || summary) && (
        <div className="analytics-grid-2x4" style={{marginBottom: 32}}>
          {/* Bewertungen Stats */}
          {reviews.length > 0 && (
            <div className="metric-card">
              <div className="metric-icon" style={{fontSize: '2.5rem'}}>⭐</div>
              <div className="metric-label">Kundenbewertungen</div>
              <div className="metric-value" style={{fontSize: '2.5rem'}}>{reviews.length}</div>
              {summary?.avgRating && (
                <div style={{color: '#27ae60', fontWeight: 600, fontSize: '1.1rem', marginTop: 8}}>
                  Ø {summary.avgRating} ★
                </div>
              )}
            </div>
          )}

          {/* Tickets Stats */}
          {tickets.length > 0 && (
            <div className="metric-card">
              <div className="metric-icon" style={{fontSize: '2.5rem'}}>🎫</div>
              <div className="metric-label">Support-Tickets</div>
              <div className="metric-value" style={{fontSize: '2.5rem'}}>{tickets.length}</div>
              {summary?.openTickets !== undefined && (
                <div style={{color: summary.openTickets > 0 ? '#e74c3c' : '#27ae60', fontWeight: 600, fontSize: '1.1rem', marginTop: 8}}>
                  {summary.openTickets} offen
                </div>
              )}
            </div>
          )}

          {/* Sentiment */}
          {summary?.sentiment && (
            <div className="metric-card">
              <div className="metric-icon" style={{fontSize: '2.5rem'}}>
                {summary.sentiment === 'positive' ? '😊' : summary.sentiment === 'negative' ? '😟' : '😐'}
              </div>
              <div className="metric-label">Stimmung</div>
              <div className="metric-value" style={{fontSize: '1.8rem', color: summary.sentiment === 'positive' ? '#27ae60' : summary.sentiment === 'negative' ? '#e74c3c' : '#f39c12'}}>
                {summary.sentiment === 'positive' ? 'Positiv' : summary.sentiment === 'negative' ? 'Negativ' : 'Neutral'}
              </div>
            </div>
          )}

          {/* Resolution Time */}
          {summary?.resolutionTime && (
            <div className="metric-card">
              <div className="metric-icon" style={{fontSize: '2.5rem'}}>⏱️</div>
              <div className="metric-label">Bearbeitungszeit</div>
              <div className="metric-value" style={{fontSize: '1.8rem'}}>{summary.resolutionTime}</div>
              <div style={{color: '#7f8c8d', fontSize: '0.9rem', marginTop: 8}}>Durchschnittliche Lösung</div>
            </div>
          )}
        </div>
      )}

      {/* Bewertungen anzeigen */}
      {reviews.length > 0 && showRaw && (
        <div className="metric-card full-width" style={{marginBottom: 32}}>
          <h3 style={{marginBottom: 20}}>⭐ Kundenbewertungen</h3>
          <div style={{display: 'grid', gap: 16}}>
            {reviews.map((review: any) => (
              <div key={review.id} style={{
                background: '#f8f9fa',
                padding: '16px 20px',
                borderRadius: 8,
                borderLeft: '4px solid #ffc107'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                  <strong style={{color: '#2c3e50', fontSize: '1.05rem'}}>{review.author}</strong>
                  <span style={{color: '#ffc107', fontSize: '1.1rem'}}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <p style={{color: '#34495e', lineHeight: '1.6', margin: '8px 0'}}>{review.text}</p>
                <div style={{color: '#7f8c8d', fontSize: '0.85rem', marginTop: 8}}>📅 {review.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support-Tickets anzeigen */}
      {tickets.length > 0 && showRaw && (
        <div className="metric-card full-width" style={{marginBottom: 32}}>
          <h3 style={{marginBottom: 20}}>🎫 Support-Tickets</h3>
          <div style={{display: 'grid', gap: 16}}>
            {tickets.map((ticket: any) => {
              const statusColor = ticket.status === 'closed' ? '#27ae60' : '#e74c3c';
              const priorityColor = ticket.priority === 'high' ? '#e74c3c' : ticket.priority === 'medium' ? '#f39c12' : '#95a5a6';
              return (
                <div key={ticket.id} style={{
                  background: '#f8f9fa',
                  padding: '16px 20px',
                  borderRadius: 8,
                  borderLeft: `4px solid ${statusColor}`
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                    <strong style={{color: '#2c3e50', fontSize: '1.05rem'}}>{ticket.title}</strong>
                    <div style={{display: 'flex', gap: 8}}>
                      <span style={{
                        background: priorityColor,
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {ticket.priority}
                      </span>
                      <span style={{
                        background: statusColor,
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <p style={{color: '#34495e', lineHeight: '1.6', margin: '8px 0'}}>{ticket.description}</p>
                  <div style={{display: 'flex', gap: 16, marginTop: 8, fontSize: '0.85rem', color: '#7f8c8d'}}>
                    <span>📅 Erstellt: {ticket.created}</span>
                    {ticket.resolved && <span>✅ Gelöst: {ticket.resolved}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackAnalysis;
// ...existing FeedbackAnalysis.tsx code with import '../../page.css';