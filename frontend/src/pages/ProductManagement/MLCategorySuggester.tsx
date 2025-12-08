import React, { useState } from 'react';

interface MLCategorySuggestion {
  name: string;
  confidence: number;
  reason: string;
}

interface MLCategorySuggesterProps {
  productTitle: string;
  productDescription: string;
}

export const MLCategorySuggester: React.FC<MLCategorySuggesterProps> = ({ productTitle, productDescription }) => {
  const [suggestions, setSuggestions] = useState<MLCategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/ml/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: productTitle, description: productDescription })
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error || 'Fehler bei der Kategorie-Vorschlag-Generierung');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Kategorie-Vorschlag-Generierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-category-suggester">
      <button onClick={fetchSuggestions} disabled={loading}>
        KI-Kategorie-Vorschläge generieren
      </button>
      {loading && <div>Generierung läuft...</div>}
      {error && <div className="error">{error}</div>}
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          <h4>KI-Kategorie-Vorschläge</h4>
          <ul>
            {suggestions.map((s, i) => (
              <li key={i}>
                <strong>{s.name}</strong> (Confidence: {Math.round(s.confidence * 100)}%)<br />
                <em>{s.reason}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
