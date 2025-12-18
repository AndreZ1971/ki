import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface MLSupportSuggestion {
  type: "reply" | "category" | "sentiment";
  content: string;
  score?: number;
  reason?: string;
}

interface MLSupportGeneratorProps {
  ticketText: string;
}

export const MLSupportGenerator: React.FC<MLSupportGeneratorProps> = ({
  ticketText,
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<MLSupportSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/support/ml/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ticketText }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error || t("ml.supportGenerator.error"));
      }
    } catch (err: any) {
      setError(err.message || t("ml.supportGenerator.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-support-generator">
      <button onClick={fetchSuggestions} disabled={loading}>
        {t("ml.supportGenerator.generate")}
      </button>
      {loading && <div>{t("ml.supportGenerator.generating")}</div>}
      {error && <div className="error">{error}</div>}
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          <h4>{t("ml.supportGenerator.title")}</h4>
          <ul>
            {suggestions.map((s, i) => (
              <li key={i}>
                <strong>
                  {s.type === "reply"
                    ? "Antwort"
                    : s.type === "category"
                      ? "Kategorie"
                      : "Sentiment"}
                </strong>
                <br />
                <span>{s.content}</span>
                <br />
                {s.score !== undefined && (
                  <span>Score: {Math.round(s.score * 100)}%</span>
                )}
                <br />
                {s.reason && <em>{s.reason}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
