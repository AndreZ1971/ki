import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface MLPaymentInsight {
  type: "anomaly" | "churn" | "fraud";
  score: number;
  message: string;
  details?: string;
}

interface MLPaymentAnalyzerProps {
  paymentId: string;
}

export const MLPaymentAnalyzer: React.FC<MLPaymentAnalyzerProps> = ({
  paymentId,
}) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<MLPaymentInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payment/ml/analyze?paymentId=${paymentId}`);
      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
      } else {
        setError(data.error || t("ml.paymentAnalyzer.error"));
      }
    } catch (err: any) {
      setError(err.message || t("ml.paymentAnalyzer.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-payment-analyzer">
      <button onClick={fetchInsights} disabled={loading}></button>
      {loading && <div>{t("ml.paymentAnalyzer.analyzing")}</div>}
      {error && <div className="error">{error}</div>}
      {insights.length > 0 && (
        <div className="insights-list">
          <h4>{t("ml.paymentAnalyzer.title")}</h4>
          <ul>
            {insights.map((insight, i) => (
              <li key={i}>
                <strong>
                  {insight.type === "anomaly"
                    ? "Anomalie"
                    : insight.type === "churn"
                      ? "Churn-Risiko"
                      : "Fraud-Alarm"}
                </strong>
                <br />
                <span>Score: {Math.round(insight.score * 100)}%</span>
                <br />
                <span>{insight.message}</span>
                {insight.details && (
                  <div>
                    <em>{insight.details}</em>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
