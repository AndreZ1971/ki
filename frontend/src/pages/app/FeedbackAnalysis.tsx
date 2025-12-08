import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './page.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const FeedbackAnalysis: React.FC = () => {
  const [reviews, setReviews] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
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

  const navigate = useNavigate();
  const handleBack = () => navigate('/');

  return (
    <div className="feedback-analysis-page">
      <button className="back-button floating-back" onClick={handleBack}>← Zurück</button>
      <h1>📝 Kunden-Feedback-Analyse</h1>
      <button onClick={fetchReviews}>Bewertungen laden</button>
      <button onClick={fetchTickets}>Support-Tickets laden</button>
      <button onClick={analyzeFeedback}>Feedback analysieren</button>
      {loading && <div>⏳ Lädt...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div>
        <h2>Bewertungen</h2>
        <pre>{JSON.stringify(reviews, null, 2)}</pre>
        <h2>Support-Tickets</h2>
        <pre>{JSON.stringify(tickets, null, 2)}</pre>
        <h2>Analyse</h2>
        <pre>{JSON.stringify(analysis, null, 2)}</pre>
        <h2>Zusammenfassung</h2>
        <pre>{JSON.stringify(summary, null, 2)}</pre>
      </div>
    </div>
  );
};

export default FeedbackAnalysis;
// ...existing FeedbackAnalysis.tsx code with import '../../page.css';