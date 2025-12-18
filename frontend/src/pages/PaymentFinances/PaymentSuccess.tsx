// src/pages/PaymentFinances/PaymentSuccess.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../../lib/i18n-utils";
import { motion } from "framer-motion";
import { useProductManagement } from "../../hooks/useProductManagement";
import { useToast } from "../../hooks/useToast";
import {
  BackButton,
  LoadingButton,
  ErrorMessage,
} from "../../components/shared";
import { ToastContainer } from "../../components/Toast/ToastContainer";
import { paymentApi } from "../../services/productApi";
import type { PaymentSuccessMetrics } from "../../types/product";
import "./page.css";

const PaymentSuccess: React.FC = () => {
  const { t } = useTranslation();
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  const [timeRange, setTimeRange] = useState<
    "today" | "week" | "month" | "year"
  >("today");
  const [successMetrics, setSuccessMetrics] =
    useState<PaymentSuccessMetrics | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.successMetrics(timeRange);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Keine Metriken verfügbar");
      }
      setSuccessMetrics(response.data);
      showToast("Analyse abgeschlossen!", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysefehler");
      showToast(err instanceof Error ? err.message : "Analysefehler", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>{t("payment.success.title")}</h1>
        <p>{t("payment.success.subtitle")}</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            {t("payment.success.timeRangeLabel")}
          </h3>

          <div className="form-group">
            <label>{t("common.timeRange")}</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="form-input"
            >
              <option value="today">{t("common.today")}</option>
              <option value="week">{t("common.thisWeek")}</option>
              <option value="month">{t("common.thisMonth")}</option>
              <option value="year">{t("common.thisYear")}</option>
            </select>
          </div>

          <div style={{ marginTop: "20px" }}>
            <LoadingButton
              onClick={handleAnalyze}
              loading={loading}
              loadingText={t("common.analyzing")}
            >
              {t("payment.success.analyzeButton")}
            </LoadingButton>
          </div>
        </motion.div>

        <motion.div
          className="result-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            {t("payment.success.metricsHeader")}
          </h3>
          {successMetrics ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div
                style={{
                  background: "rgba(52, 199, 89, 0.1)",
                  border: "1px solid rgba(52, 199, 89, 0.5)",
                  borderRadius: "12px",
                  padding: "25px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  {successMetrics.valid}
                </div>
                <div
                  style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}
                >
                  {t("payment.success.verifiedTransactions")}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(102, 126, 234, 0.1)",
                  border: "1px solid rgba(102, 126, 234, 0.3)",
                  borderRadius: "12px",
                  padding: "25px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  {(successMetrics.successRate * 100).toFixed(1)}%
                </div>
                <div
                  style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}
                >
                  {t("payment.success.successRate")}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(102, 126, 234, 0.1)",
                  border: "1px solid rgba(102, 126, 234, 0.3)",
                  borderRadius: "12px",
                  padding: "25px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  {(successMetrics.avgConfidence * 100).toFixed(0)}%
                </div>
                <div
                  style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}
                >
                  {t("payment.success.avgConfidence")}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  {t("payment.success.eventsByFeature")}
                </div>
                {Object.keys(successMetrics.byFeature).length === 0 && (
                  <div
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}
                  >
                    {t("common.noEventsInRange")}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {Object.entries(successMetrics.byFeature).map(
                    ([feature, count]) => (
                      <div
                        key={feature}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "white",
                        }}
                      >
                        <span>{feature}</span>
                        <span>{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  textAlign: "center",
                }}
              >
                {t("payment.success.lastEvent")}{" "}
                {successMetrics.lastEvent
                  ? formatDateTime(new Date(successMetrics.lastEvent))
                  : "—"}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "2px dashed rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
              <p>{t("payment.success.noMetricsAvailable")}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
