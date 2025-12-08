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
          {analysis.map((insight, i) => (
            <div className="metric-card" key={i}>
              <div className="metric-icon" style={{fontSize: '2.2rem'}}>
                {insight.type === 'trend' && '📈'}
                {insight.type === 'sentiment' && '💬'}
                {insight.type === 'topic' && '🏷️'}
                {insight.type === 'complaint' && '⚠️'}
                {insight.type === 'praise' && '🌟'}
                {insight.type === 'suggestion' && '💡'}
                {insight.type === 'other' && '🔎'}
              </div>
              <div className="metric-label">{insight.title || insight.type}</div>
              <div className="metric-value" style={{fontSize: '1.3rem'}}>{insight.value}</div>
              {insight.detail && <div style={{color: '#6c757d', fontSize: '0.95rem', marginTop: 8}}>{insight.detail}</div>}
            </div>
          ))}
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

      {/* Bewertungen & Tickets als Card-Grid */}
      <div className="mini-checks-grid" style={{marginBottom: 32}}>
        <div className="mini-check-card">
          <div className="check-header"><span className="check-icon">⭐</span><span className="check-name">Bewertungen</span></div>
          <div className="check-value">{reviews.length}</div>
          <div className="check-description">Anzahl geladener Kundenbewertungen</div>
        </div>
        <div className="mini-check-card">
          <div className="check-header"><span className="check-icon">🎫</span><span className="check-name">Support-Tickets</span></div>
          <div className="check-value">{tickets.length}</div>
          <div className="check-description">Anzahl geladener Support-Tickets</div>
        </div>
      </div>

      {/* Optional: Rohdaten-Ansicht */}
      {showRaw && (
        <div style={{margin: '32px 0'}}>
          <h3>🔎 Rohdaten</h3>
          <div style={{display: 'flex', gap: 32, flexWrap: 'wrap'}}>
            <div style={{flex: 1, minWidth: 320}}>
              <h4>Bewertungen</h4>
              <pre style={{background: '#f6f8fa', padding: 12, borderRadius: 8, fontSize: 13}}>{JSON.stringify(reviews, null, 2)}</pre>
            </div>
            <div style={{flex: 1, minWidth: 320}}>
              <h4>Support-Tickets</h4>
              <pre style={{background: '#f6f8fa', padding: 12, borderRadius: 8, fontSize: 13}}>{JSON.stringify(tickets, null, 2)}</pre>
            </div>
            <div style={{flex: 1, minWidth: 320}}>
              <h4>Analyse</h4>
              <pre style={{background: '#f6f8fa', padding: 12, borderRadius: 8, fontSize: 13}}>{JSON.stringify(analysis, null, 2)}</pre>
            </div>
            <div style={{flex: 1, minWidth: 320}}>
              <h4>Zusammenfassung</h4>
              <pre style={{background: '#f6f8fa', padding: 12, borderRadius: 8, fontSize: 13}}>{JSON.stringify(summary, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackAnalysis;
// ...existing FeedbackAnalysis.tsx code with import '../../page.css';