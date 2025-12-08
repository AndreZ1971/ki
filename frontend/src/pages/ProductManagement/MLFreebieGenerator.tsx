import React, { useState } from 'react';

interface MLFreebieIdea {
  title: string;
  description: string;
  conversionScore: number;
  reason: string;
}

interface MLFreebieGeneratorProps {
  category: string;
}

export const MLFreebieGenerator: React.FC<MLFreebieGeneratorProps> = ({ category }) => {
  const [ideas, setIdeas] = useState<MLFreebieIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/freebies/ml/generate?category=${category}`);
      const data = await res.json();
      if (data.success && data.ideas) {
        setIdeas(data.ideas);
      } else {
        setError(data.error || 'Fehler bei der Freebie-Generierung');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Freebie-Generierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-freebie-generator">
      <button onClick={fetchIdeas} disabled={loading}>
        KI-Freebie-Ideen generieren
      </button>
      {loading && <div>Generierung läuft...</div>}
      {error && <div className="error">{error}</div>}
      {ideas.length > 0 && (
        <div className="ideas-list">
          <h4>KI-Freebie-Ideen</h4>
          <ul>
            {ideas.map((idea, i) => (
              <li key={i}>
                <strong>{idea.title}</strong><br />
                <span>{idea.description}</span><br />
                <em>Conversion-Score: {Math.round(idea.conversionScore * 100)}% – {idea.reason}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
