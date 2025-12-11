import React, { useState } from 'react';
import { categoryApi } from '../../services/productApi';
import type { CategorySuggestion } from '../../types/product';

interface MLCategorySuggesterProps {
  productTitle: string;
  productDescription: string;
}

export const MLCategorySuggester: React.FC<MLCategorySuggesterProps> = ({ productTitle, productDescription }) => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryApi.suggestCategories({
        title: productTitle,
        description: productDescription,
        maxSuggestions: 5
      });

      if (response.success && response.data) {
        setSuggestions(response.data);
      } else {
        setError(response.error || 'Fehler bei der Kategorie-Vorschlag-Generierung');
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
