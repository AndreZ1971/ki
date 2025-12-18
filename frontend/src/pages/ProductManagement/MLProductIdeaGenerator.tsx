import React, { useState } from "react";
import { useTranslation } from "react-i18next";

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

export const MLProductIdeaGenerator: React.FC<MLProductIdeaGeneratorProps> = ({
  count,
  category,
}) => {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<MLProductIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/products/ml/generate-ideas?count=${count}&category=${category}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.ideas) && data.ideas.length > 0) {
        setIdeas(data.ideas);
      } else {
        setIdeas([]);
        setError(data.error || t("ml.productIdeaGenerator.error"));
      }
    } catch (err: any) {
      setIdeas([]);
      setError(err.message || t("ml.productIdeaGenerator.error"));
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
        title={t("ml.productIdeaGenerator.title")}
      >
        <span
          role="img"
          aria-label="Glühbirne"
          style={{ marginRight: 8, fontSize: "1.3em" }}
        >
          💡
        </span>
        {t("ml.productIdeaGenerator.generate")}
      </button>
      {loading && (
        <div className="ml-idea-loading">
          {t("ml.productIdeaGenerator.generating")}
        </div>
      )}
      {error && <div className="ml-idea-error">{error}</div>}
      {!error && !loading && ideas.length === 0 && (
        <div className="ml-idea-error" style={{ color: "#6c757d" }}>
          {t("ml.productIdeaGenerator.ideas")}
        </div>
      )}
      {ideas.length > 0 && (
        <div className="ml-idea-list">
          <h4>{t("ml.productIdeaGenerator.ideas")}</h4>
          <div className="ml-idea-cards">
            {ideas.map((idea, i) => (
              <div className="ml-idea-card" key={i}>
                <div className="ml-idea-title">{idea.title}</div>
                <div className="ml-idea-meta">
                  {idea.category} &nbsp;|&nbsp; <span>€{idea.price}</span>
                </div>
                <div className="ml-idea-desc">{idea.description}</div>
                <div className="ml-idea-score">
                  Score: <b>{idea.score}</b>{" "}
                  <span className="ml-idea-reason">{idea.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
