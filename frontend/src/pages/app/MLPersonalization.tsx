import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from '../../lib/api-client';

interface MLPersonalizationOffer {
  title: string;
  description: string;
  score: number;
  reason: string;
}

interface MLPersonalizationProps {
  userId: number;
}

export const MLPersonalization: React.FC<MLPersonalizationProps> = ({
  userId,
}) => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<MLPersonalizationOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(
        `/api/personalization/ml/offers?userId=${userId}`
      );
      if (data.success && data.offers) {
        setOffers(data.offers);
      } else {
        setError(data.error || t("ml.personalization.error"));
      }
    } catch (err: any) {
      setError(err.message || t("ml.personalization.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-personalization">
      <button onClick={fetchOffers} disabled={loading}>
        {t("ml.personalization.analyze")}
      </button>
      {loading && <div>{t("ml.personalization.analyzing")}</div>}
      {error && <div className="error">{error}</div>}
      {offers.length > 0 && (
        <div className="offers-list">
          <h4>{t("ml.personalization.title")}</h4>
          <ul>
            {offers.map((offer, i) => (
              <li key={i}>
                <strong>{offer.title}</strong>
                <br />
                <span>{offer.description}</span>
                <br />
                <em>
                  Score: {Math.round(offer.score * 100)}% – {offer.reason}
                </em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
