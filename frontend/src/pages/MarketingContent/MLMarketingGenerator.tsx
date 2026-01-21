import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { productApi } from "../../services/productApi";

interface MLMarketingIdea {
  type: "text" | "image" | "audience" | "forecast";
  content: string;
  score?: number;
  reason?: string;
}

interface MLMarketingGeneratorProps {
  campaignGoal: string;
  audience: string;
}

export const MLMarketingGenerator: React.FC<MLMarketingGeneratorProps> = ({
  campaignGoal,
  audience,
}) => {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<MLMarketingIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productApi.generateMarketingIdeas({
        goal: campaignGoal,
        audience
      });
      
      if (response.success && response.data?.ideas) {
        setIdeas(response.data.ideas);
      } else {
        setError(response.error || t("ml.marketingGenerator.error"));
      }
    } catch (err: any) {
      setError(err.message || t("ml.marketingGenerator.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-marketing-generator">
      <button onClick={fetchIdeas} disabled={loading}>
        {t("ml.marketingGenerator.generate")}
      </button>
      {loading && <div>{t("ml.marketingGenerator.generating")}</div>}
      {error && <div className="error">{error}</div>}
      {ideas.length > 0 && (
        <div className="ideas-list">
          <h4>{t("ml.marketingGenerator.title")}</h4>
          <ul>
            {ideas.map((idea, i) => (
              <li key={i}>
                <strong>
                  {idea.type === "text"
                    ? "Text"
                    : idea.type === "image"
                      ? "Bild"
                      : idea.type === "audience"
                        ? "Zielgruppe"
                        : "Prognose"}
                </strong>
                <br />
                <span>{idea.content}</span>
                <br />
                {idea.score !== undefined && (
                  <span>Score: {Math.round(idea.score * 100)}%</span>
                )}
                <br />
                {idea.reason && <em>{idea.reason}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
