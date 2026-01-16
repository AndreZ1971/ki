// src/pages/PaymentFinances/PaymentIssuedDetector.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
import type { IssueDetectionResult, PaymentIssue } from "../../types/product";
import "./page.css";

const PaymentIssuedDetector: React.FC = () => {
  const { t } = useTranslation();
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  const [scanDepth, setScanDepth] = useState<"quick" | "standard" | "deep">(
    "standard"
  );
  const [detectionResult, setDetectionResult] =
    useState<IssueDetectionResult | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.detectIssues({
        scanDepth,
        timeRange: "last-24h",
      });

      if (response.success && response.data) {
        setDetectionResult(response.data);
        const issueCount = response.data.issues.length;
        const healthEmoji =
          response.data.systemHealth === "healthy"
            ? "✅"
            : response.data.systemHealth === "degraded"
              ? "⚠️"
              : "🚨";

        showToast(
          `${healthEmoji} ${issueCount} Issue(s) erkannt - System: ${response.data.systemHealth}`,
          issueCount === 0
            ? "success"
            : response.data.systemHealth === "critical"
              ? "error"
              : "info"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan-Fehler");
      showToast("❌ Scan fehlgeschlagen", "error");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "critical") return "#ff0000";
    if (severity === "high") return "#ff3b30";
    if (severity === "medium") return "#ff9500";
    return "#ffcc00";
  };

  const getSeverityEmoji = (severity: string) => {
    if (severity === "critical") return "🚨";
    if (severity === "high") return "🔴";
    if (severity === "medium") return "🟡";
    return "🟢";
  };

  const getHealthColor = (health: string) => {
    if (health === "critical") return "#ff0000";
    if (health === "degraded") return "#ff9500";
    return "#34c759";
  };

  const detectedIssues = detectionResult?.issues || [];

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Payment Issued Detector</h1>
        <p>Erkenne und behandle Payment-Probleme automatisch</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      {/* System Health Overview */}
      {detectionResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            border: `2px solid ${getHealthColor(detectionResult.systemHealth)}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "5px",
                }}
              >
                System Health
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: getHealthColor(detectionResult.systemHealth),
                  textTransform: "uppercase",
                }}
              >
                {detectionResult.systemHealth === "healthy" &&
                  `✅ Healthy`}
                {detectionResult.systemHealth === "degraded" &&
                  `⚠️ Degraded`}
                {detectionResult.systemHealth === "critical" &&
                  `🚨 Critical`}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "5px",
                }}
              >
                AI Confidence
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#007aff",
                }}
              >
                {Math.round(detectionResult.overallConfidence * 100)}%
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "5px",
                }}
              >
                Analyzed Events
              </div>
              <div
                style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}
              >
                {detectionResult.scanMetadata.scannedEvents}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "5px",
                }}
              >
                Failure Rate
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color:
                    detectionResult.scanMetadata.currentFailureRate > 0.1
                      ? "#ff3b30"
                      : "#34c759",
                }}
              >
                {(
                  detectionResult.scanMetadata.currentFailureRate * 100
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
            {t("payment.issueDetector.scanSettingsHeader")}
          </h3>

          <div className="form-group">
            <label>{t("payment.issueDetector.scanDepth")}</label>
            <select
              value={scanDepth}
              onChange={(e) =>
                setScanDepth(e.target.value as "quick" | "standard" | "deep")
              }
              className="form-input"
            >
              <option value="quick">{t("payment.issueDetector.quick")}</option>
              <option value="standard">
                {t("payment.issueDetector.standard")}
              </option>
              <option value="deep">{t("payment.issueDetector.deep")}</option>
            </select>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              padding: "15px",
              marginTop: "15px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "8px",
              }}
            >
              🤖 <strong>KI-Features:</strong>
            </div>
            <ul
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.6)",
                margin: 0,
                paddingLeft: "20px",
                lineHeight: "1.6",
              }}
            >
              <li>Gateway-Timeout Erkennung</li>
              <li>Validation-Fehler-Analyse</li>
              <li>Retry-Loop Detection</li>
              <li>Fraud-Anomalien</li>
              <li>Integration Health Checks</li>
              <li>Rate-Limiting Monitoring</li>
            </ul>
          </div>

          <div style={{ marginTop: "20px" }}>
            <LoadingButton
              onClick={handleScan}
              loading={loading}
              loadingText="🔍 KI scannt..."
            >
              🤖 KI-Scan starten
            </LoadingButton>
          </div>
        </motion.div>

        <motion.div
          className="result-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            🔍 Erkannte Issues
          </h3>
          {detectedIssues.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {detectedIssues.map((issue: PaymentIssue, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: `2px solid ${getSeverityColor(issue.severity)}`,
                    borderRadius: "12px",
                    padding: "16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Severity Badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          color: "white",
                          marginBottom: "4px",
                        }}
                      >
                        {getSeverityEmoji(issue.severity)} {issue.type}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        🎯 {issue.affectedArea}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: getSeverityColor(issue.severity),
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        background: `${getSeverityColor(issue.severity)}20`,
                        borderRadius: "6px",
                        border: `1px solid ${getSeverityColor(issue.severity)}40`,
                      }}
                    >
                      {issue.severity}
                    </div>
                  </div>

                  {/* Description */}
                  <div
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.8)",
                      marginBottom: "12px",
                      lineHeight: "1.5",
                    }}
                  >
                    {issue.description}
                  </div>

                  {/* Impact */}
                  <div
                    style={{
                      background: "rgba(255,165,0,0.1)",
                      borderLeft: "3px solid #ff9500",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: "4px",
                        fontWeight: "600",
                      }}
                    >
                      💥 Impact
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {issue.impact}
                    </div>
                  </div>

                  {/* Suggested Fix */}
                  <div
                    style={{
                      background: "rgba(52,199,89,0.1)",
                      borderLeft: "3px solid #34c759",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: "4px",
                        fontWeight: "600",
                      }}
                    >
                      🔧 Suggested Fix
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {issue.suggestedFix}
                    </div>
                  </div>

                  {/* Confidence Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      🤖 KI Confidence:
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: "6px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${issue.confidence * 100}%`,
                          background:
                            "linear-gradient(90deg, #007aff, #00d4ff)",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#007aff",
                      }}
                    >
                      {Math.round(issue.confidence * 100)}%
                    </div>
                  </div>
                </motion.div>
              ))}
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
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Keine Issues erkannt
              </div>
              <p style={{ fontSize: "13px", margin: 0 }}>System läuft stabil</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recommended Actions */}
      {detectionResult && detectionResult.recommendedActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(0,122,255,0.1)",
            border: "2px solid rgba(0,122,255,0.3)",
            borderRadius: "16px",
            padding: "20px",
            marginTop: "20px",
          }}
        >
          <h3
            style={{
              color: "white",
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            🎯 Empfohlene Aktionen
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "rgba(255,255,255,0.8)",
              lineHeight: "1.8",
            }}
          >
            {detectionResult.recommendedActions.map(
              (action: string, idx: number) => (
                <li key={idx} style={{ fontSize: "14px" }}>
                  {action}
                </li>
              )
            )}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentIssuedDetector;
