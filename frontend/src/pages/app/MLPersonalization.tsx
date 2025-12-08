import React, { useState } from 'react';

interface MLPersonalizationOffer {
  title: string;
  description: string;
  score: number;
  reason: string;
}

interface MLPersonalizationProps {
  userId: number;
}

export const MLPersonalization: React.FC<MLPersonalizationProps> = ({ userId }) => {
  const [offers, setOffers] = useState<MLPersonalizationOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/personalization/ml/offers?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.offers) {
        setOffers(data.offers);
      } else {
        setError(data.error || 'Fehler bei der Personalisierung');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Personalisierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-personalization">
      <button onClick={fetchOffers} disabled={loading}>
        KI-Angebote für mich generieren
      </button>
      {loading && <div>Generierung läuft...</div>}
      {error && <div className="error">{error}</div>}
      {offers.length > 0 && (
        <div className="offers-list">
          <h4>Individuelle KI-Angebote</h4>
          <ul>
            {offers.map((offer, i) => (
              <li key={i}>
                <strong>{offer.title}</strong><br />
                <span>{offer.description}</span><br />
                <em>Score: {Math.round(offer.score * 100)}% – {offer.reason}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
