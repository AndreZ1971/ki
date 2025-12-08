import React, { useState } from 'react';

interface MLProductIdea {
  title: string;
  description: string;
  category: string;
  price: number;
  score: number;
  reason: string;
}

interface MLProductIdeaGeneratorProps {
  count: number;
  category: string;
}

export const MLProductIdeaGenerator: React.FC<MLProductIdeaGeneratorProps> = ({ count, category }) => {
  const [ideas, setIdeas] = useState<MLProductIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/ml/generate-ideas?count=${count}&category=${category}`);
      const data = await res.json();
      if (data.success && data.ideas) {
        setIdeas(data.ideas);
      } else {
        setError(data.error || 'Fehler bei der Generierung');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Generierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-product-idea-generator">
      <button onClick={fetchIdeas} disabled={loading}>
        KI-Produktideen generieren
      </button>
      {loading && <div>Generierung läuft...</div>}
      {error && <div className="error">{error}</div>}
      {ideas.length > 0 && (
        <div className="ideas-list">
          <h4>KI-Produktideen</h4>
          <ul>
            {ideas.map((idea, i) => (
              <li key={i}>
                <strong>{idea.title}</strong> ({idea.category}, €{idea.price})<br />
                <span>{idea.description}</span><br />
                <em>Score: {idea.score} – {idea.reason}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
