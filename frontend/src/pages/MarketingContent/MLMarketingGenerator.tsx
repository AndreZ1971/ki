import React, { useState } from 'react';

interface MLMarketingIdea {
  type: 'text' | 'image' | 'audience' | 'forecast';
  content: string;
  score?: number;
  reason?: string;
}

interface MLMarketingGeneratorProps {
  campaignGoal: string;
  audience: string;
}

export const MLMarketingGenerator: React.FC<MLMarketingGeneratorProps> = ({ campaignGoal, audience }) => {
  const [ideas, setIdeas] = useState<MLMarketingIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/ml/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: campaignGoal, audience })
      });
      const data = await res.json();
      if (data.success && data.ideas) {
        setIdeas(data.ideas);
      } else {
        setError(data.error || 'Fehler bei der Marketing-Generierung');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Marketing-Generierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-marketing-generator">
      <button onClick={fetchIdeas} disabled={loading}>
        KI-Marketing-Ideen generieren
      </button>
      {loading && <div>Generierung läuft...</div>}
      {error && <div className="error">{error}</div>}
      {ideas.length > 0 && (
        <div className="ideas-list">
          <h4>KI-Marketing-Ideen</h4>
          <ul>
            {ideas.map((idea, i) => (
              <li key={i}>
                <strong>{idea.type === 'text' ? 'Text' : idea.type === 'image' ? 'Bild' : idea.type === 'audience' ? 'Zielgruppe' : 'Prognose'}</strong><br />
                <span>{idea.content}</span><br />
                {idea.score !== undefined && <span>Score: {Math.round(idea.score * 100)}%</span>}<br />
                {idea.reason && <em>{idea.reason}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
