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
      <button
        className="ml-idea-btn"
        onClick={fetchIdeas}
        disabled={loading}
        title="KI-gestützte Produktideen für deinen Shop generieren"
      >
        <span role="img" aria-label="Glühbirne" style={{marginRight: 8, fontSize: '1.3em'}}>💡</span>
        KI-Produktideen generieren
      </button>
      {loading && <div className="ml-idea-loading">Generierung läuft...</div>}
      {error && <div className="ml-idea-error">{error}</div>}
      {ideas.length > 0 && (
        <div className="ml-idea-list">
          <h4>KI-Produktideen</h4>
          <div className="ml-idea-cards">
            {ideas.map((idea, i) => (
              <div className="ml-idea-card" key={i}>
                <div className="ml-idea-title">{idea.title}</div>
                <div className="ml-idea-meta">{idea.category} &nbsp;|&nbsp; <span>€{idea.price}</span></div>
                <div className="ml-idea-desc">{idea.description}</div>
                <div className="ml-idea-score">Score: <b>{idea.score}</b> <span className="ml-idea-reason">{idea.reason}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
