// src/pages/PaymentFinances/PaymentQuickCheck.tsx
import React, { useState } from "react";
import { formatTime } from "../../lib/i18n-utils";
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
import type {
  IssueDetectionResult,
  PaymentIssue,
  PaymentSuccessMetrics,
} from "../../types/product";
import "./page.css";

const PaymentQuickCheck: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  const [scanDepth, setScanDepth] = useState<"quick" | "standard" | "deep">(
    "quick"
  );
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "today"
  );
  const [detectionResult, setDetectionResult] =
    useState<IssueDetectionResult | null>(null);
  const [successMetrics, setSuccessMetrics] =
    useState<PaymentSuccessMetrics | null>(null);

  const handleQuickCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const [issuesRes, metricsRes] = await Promise.all([
        paymentApi.detectIssues({ scanDepth, timeRange }),
        paymentApi.successMetrics(
          timeRange as "today" | "week" | "month" | "year"
        ),
      ]);

      if (!issuesRes.success || !issuesRes.data) {
        throw new Error(issuesRes.error || "Issue-Scan fehlgeschlagen");
      }

      setDetectionResult(issuesRes.data);

      if (metricsRes.success && metricsRes.data) {
        setSuccessMetrics(metricsRes.data);
      }

      const healthEmoji =
        issuesRes.data.systemHealth === "healthy"
          ? "✅"
          : issuesRes.data.systemHealth === "degraded"
            ? "⚠️"
            : "🚨";
      showToast(
        `${healthEmoji} Quick Check abgeschlossen (${issuesRes.data.systemHealth})`,
        issuesRes.data.systemHealth === "healthy" ? "success" : "warning"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-Fehler");
      showToast("❌ Quick Check fehlgeschlagen", "error");
    } finally {
      setLoading(false);
    }
  };

  const deriveStatus = (
    area: "gateway" | "database" | "api"
  ): { label: string; issue?: PaymentIssue; healthy: boolean } => {
    if (!detectionResult) return { label: "—", healthy: false };

    const matcher = (text: string) => {
      const t = text.toLowerCase();
      if (area === "gateway") return t.includes("gateway");
      if (area === "database")
        return t.includes("db") || t.includes("database");
      return t.includes("api") || t.includes("integration");
    };

    const issue = detectionResult.issues.find(
      (i) => matcher(i.affectedArea) || matcher(i.type)
    );
    return {
      label: issue ? `${issue.type} (${issue.severity})` : "Stabil",
      issue,
      healthy: !issue,
    };
  };

  const gatewayStatus = deriveStatus("gateway");
  const dbStatus = deriveStatus("database");
  const apiStatus = deriveStatus("api");

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>⚡ Payment Quick Check (KI)</h1>
        <p>GPT-4o-mini Gesundheits-Scan für Gateway, DB und API</p>
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
            ⚙️ System-Check
          </h3>

          <div className="form-group">
            <label>Scan-Tiefe</label>
            <select
              value={scanDepth}
              onChange={(e) =>
                setScanDepth(e.target.value as "quick" | "standard" | "deep")
              }
              className="form-input"
            >
              <option value="quick">🚀 Quick (unter 5s)</option>
              <option value="standard">⚡ Standard</option>
              <option value="deep">🔬 Deep-Dive</option>
            </select>
          </div>

          <div className="form-group">
            <label>Zeitraum</label>
            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as "today" | "week" | "month")
              }
              className="form-input"
            >
              <option value="today">Heute</option>
              <option value="week">Letzte 7 Tage</option>
              <option value="month">Letzte 30 Tage</option>
            </select>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h4
              style={{ color: "white", fontSize: "14px", marginBottom: "15px" }}
            >
              Geprüfte Komponenten:
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "13px",
                color: "white",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "20px" }}>🔌</span>
                <span>Payment Gateway</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "20px" }}>💾</span>
                <span>Datenbank</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "20px" }}>🌐</span>
                <span>API Endpoints</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <LoadingButton
              onClick={handleQuickCheck}
              loading={loading}
              loadingText="KI scannt..."
            >
              ⚡ Quick Check Starten
            </LoadingButton>
          </div>
        </motion.div>

        <motion.div
          className="result-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            📊 Check-Ergebnisse
          </h3>
          {detectionResult ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Overall system health */}
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `2px solid ${detectionResult.systemHealth === "healthy" ? "rgba(52,199,89,0.6)" : detectionResult.systemHealth === "degraded" ? "rgba(255,149,0,0.6)" : "rgba(255,59,48,0.7)"}`,
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "5px",
                    }}
                  >
                    System Health
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "white",
                      textTransform: "uppercase",
                    }}
                  >
                    {detectionResult.systemHealth}
                  </div>
                  <div
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}
                  >
                    Confidence:{" "}
                    {Math.round(detectionResult.overallConfidence * 100)}%
                  </div>
                </div>
                <div style={{ fontSize: "32px" }}>
                  {detectionResult.systemHealth === "healthy"
                    ? "✅"
                    : detectionResult.systemHealth === "degraded"
                      ? "⚠️"
                      : "🚨"}
                </div>
              </div>

              {/* Success metrics snapshot */}
              {successMetrics && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(52,199,89,0.08)",
                      border: "1px solid rgba(52,199,89,0.4)",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{ fontSize: "12px", opacity: 0.7, color: "white" }}
                    >
                      Success Rate
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      {(successMetrics.successRate * 100).toFixed(1)}%
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Valid: {successMetrics.valid}/{successMetrics.total}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "rgba(0,122,255,0.08)",
                      border: "1px solid rgba(0,122,255,0.4)",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{ fontSize: "12px", opacity: 0.7, color: "white" }}
                    >
                      Avg KI Confidence
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      {(successMetrics.avgConfidence * 100).toFixed(0)}%
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Letztes Event:{" "}
                      {successMetrics.lastEvent
                        ? formatTime(new Date(successMetrics.lastEvent))
                        : "—"}
                    </div>
                  </div>
                </div>
              )}

              {/* Component statuses */}
              {[
                { title: "Payment Gateway", icon: "🔌", status: gatewayStatus },
                { title: "Datenbank", icon: "💾", status: dbStatus },
                { title: "API Endpoints", icon: "🌐", status: apiStatus },
              ].map((item, idx) => {
                const color = item.status.healthy
                  ? "rgba(52,199,89,0.5)"
                  : "rgba(255,149,0,0.6)";
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${color}`,
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>{item.icon}</span>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            opacity: 0.7,
                            color: "white",
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "white",
                          }}
                        >
                          {item.status.label}
                        </div>
                        {item.status.issue && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "rgba(255,255,255,0.7)",
                            }}
                          >
                            {item.status.issue.impact}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "30px" }}>
                      {item.status.healthy ? "✅" : "⚠️"}
                    </div>
                  </div>
                );
              })}

              {/* Recommended actions */}
              {detectionResult.recommendedActions.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "white",
                      marginBottom: "10px",
                      fontWeight: 700,
                    }}
                  >
                    Nächste Schritte
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "13px",
                    }}
                  >
                    {detectionResult.recommendedActions
                      .slice(0, 4)
                      .map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                  </ul>
                </div>
              )}
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
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚡</div>
              <p>Kein Check durchgeführt</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Starte einen Quick Check
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentQuickCheck;
