import React, { useState } from "react";
import { apiClient } from '../../lib/api-client';

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
  const [insights, setInsights] = useState<MLPaymentInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/api/payment/ml/analyze?paymentId=${paymentId}`);
      if (data.success && data.insights) {
        setInsights(data.insights);
      } else {
        setError(data.error || "Error analyzing payment data");
      }
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-payment-analyzer">
      <button onClick={fetchInsights} disabled={loading}>Analyze Payments</button>
      {loading && <div>Analyzing...</div>}
      {error && <div className="error">{error}</div>}
      {insights.length > 0 && (
        <div className="insights-list">
          <h4>Payment Insights</h4>
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
