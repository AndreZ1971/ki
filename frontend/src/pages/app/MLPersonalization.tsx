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
      <button 
        onClick={fetchOffers} 
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 16px",
          background: loading ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.15)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          borderRadius: "8px",
          color: "#a78bfa",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.2s",
        }}
      >
        {t("ml.personalization.analyze")}
      </button>
      {loading && <div style={{ color: "rgba(255,255,255,0.7)", marginTop: "12px", fontSize: "13px" }}>{t("ml.personalization.analyzing")}</div>}
      {error && <div className="error" style={{ color: "#ef4444", marginTop: "12px", fontSize: "13px" }}>{error}</div>}
      {offers.length > 0 && (
        <div className="offers-list" style={{ marginTop: "16px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "rgba(255,255,255,0.95)" }}>{t("ml.personalization.title")}</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {offers.map((offer, i) => (
              <li 
                key={i}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  background: "rgba(139, 92, 246, 0.1)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                <strong style={{ color: "rgba(255,255,255,0.95)", display: "block", marginBottom: "4px" }}>{offer.title}</strong>
                <span style={{ color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "6px" }}>{offer.description}</span>
                <em style={{ color: "rgba(167, 139, 250, 0.8)", fontSize: "12px" }}>
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
