// src/pages/PaymentFinances/PaymentValidation.tsx
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
import type { PaymentVerificationResult } from "../../types/product";
import "./page.css";

const PaymentValidation: React.FC = () => {
  const { t } = useTranslation();
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  const [cardNumber, setCardNumber] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [validationResult, setValidationResult] =
    useState<PaymentVerificationResult | null>(null);

  const handleValidate = async () => {
    if (!cardNumber || !email || !amount) {
      showToast(t("common.fillRequiredFields"), "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Rufe ECHTEN Backend-Endpoint auf mit ECHTEN Daten (keine Mock-Daten!)
      const response = await paymentApi.verifyTransaction({
        transactionId: "", // Wird vom Backend generiert, nicht clientseitig!
        amount: parseFloat(amount),
        currency: "EUR",
        customerEmail: email,
        ipAddress: ipAddress || undefined, // Optional: vom Browser ermittelt
        paymentMethod: "card",
        signature: undefined, // Wird vom Backend generiert, nicht Math.random()!
        payload: cardNumber, // ECHTE Kartendaten zum Validieren
        environment: undefined, // Wird vom Backend bestimmt, nicht hardcoded!
      });

      if (response.success && response.data) {
        setValidationResult(response.data);

        const toastType =
          response.data.riskLevel === "low"
            ? "success"
            : response.data.riskLevel === "medium"
              ? "warning"
              : "error";
        const emoji =
          response.data.riskLevel === "low"
            ? "✅"
            : response.data.riskLevel === "medium"
              ? "⚠️"
              : "🚫";

        showToast(
          `${emoji} Risk Level: ${response.data.riskLevel.toUpperCase()}`,
          toastType
        );
      } else {
        setError(response.error || "Validierungsfehler");
        showToast("Validierung fehlgeschlagen", "error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Validierungsfehler";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Risk-Gauge Component
  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "#34C759"; // 🟢
      case "medium":
        return "#FF9500"; // 🟡
      case "high":
        return "#FF3B30"; // 🔴
      case "critical":
        return "#8B0000"; // 🔴🔴
      default:
        return "#666";
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case "low":
        return "🟢";
      case "medium":
        return "🟡";
      case "high":
        return "🔴";
      case "critical":
        return "🔴";
      default:
        return "⭕";
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
        <h1>Payment Validation</h1>
        <p>Sichere Payment-Validierung und Fraud-Check</p>
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
        {/* Input Form */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            📋 Transaktions-Daten
          </h3>

          <div className="form-group">
            <label>Kartennummer (Test) *</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4111 1111 1111 1111"
              className="form-input"
            />
            <small
              style={{
                color: "rgba(255,255,255,0.6)",
                marginTop: "4px",
                display: "block",
              }}
            >
              Test: 4111111111111111
            </small>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Betrag (EUR) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="99.99"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>IP-Adresse (optional)</label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="203.0.113.45"
              className="form-input"
            />
          </div>

          <div
            style={{
              background: "rgba(102, 126, 234, 0.1)",
              borderRadius: "12px",
              padding: "12px",
              marginTop: "15px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: "1.6",
              }}
            >
              <strong>🧠 KI-Analyse führt durch:</strong>
              <br />
              ✓ Fraud-Pattern Erkennung
              <br />
              ✓ Email-Domain Validierung
              <br />
              ✓ Betrag-Anomalie-Check
              <br />
              ✓ GeoIP Konsistenz
              <br />✓ Rate Limiting Prüfung
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <LoadingButton
              onClick={handleValidate}
              loading={loading}
              loadingText={t("common.validating")}
            >
              Validate Payment
            </LoadingButton>
          </div>
        </motion.div>

        {/* Result Card */}
        <motion.div
          className="result-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            📊 Validierungs-Ergebnis
          </h3>

          {validationResult ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Risk Score Gauge */}
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `2px solid ${getRiskColor(validationResult.riskLevel)}`,
                  borderRadius: "12px",
                  padding: "25px",
                  textAlign: "center",
                  boxShadow: `0 0 20px ${getRiskColor(validationResult.riskLevel)}33`,
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: getRiskColor(validationResult.riskLevel),
                    marginBottom: "10px",
                  }}
                >
                  {validationResult.riskScore}
                </div>
                <div
                  style={{
                    color: getRiskColor(validationResult.riskLevel),
                    textTransform: "uppercase",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "15px",
                  }}
                >
                  {getRiskEmoji(validationResult.riskLevel)}{" "}
                  {validationResult.riskLevel}
                </div>
                <div
                  style={{
                    height: "12px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${validationResult.riskScore}%`,
                      background: getRiskColor(validationResult.riskLevel),
                      transition: "width 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)",
                      boxShadow: `0 0 15px ${getRiskColor(validationResult.riskLevel)}cc`,
                    }}
                  />
                </div>
                <div
                  style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}
                >
                  {validationResult.riskScore <= 25 &&
                    "✅ Sehr sicher - Transaktion empfohlen"}
                  {validationResult.riskScore > 25 &&
                    validationResult.riskScore <= 50 &&
                    "⚠️ Moderat - Zusätzliche Checks empfohlen"}
                  {validationResult.riskScore > 50 &&
                    validationResult.riskScore <= 75 &&
                    "⛔ Erhöhtes Risiko - Manuelle Prüfung"}
                  {validationResult.riskScore > 75 &&
                    "🚫 Kritisch - Transaktion ablehnen"}
                </div>
              </div>

              {/* Security Checks */}
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "12px",
                  padding: "15px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "white",
                    marginBottom: "12px",
                  }}
                >
                  Security Checks
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {validationResult.checks.map((check, idx) => {
                    const statusColor =
                      check.status === "pass"
                        ? "rgba(52, 199, 89, 0.1)"
                        : check.status === "fail"
                          ? "rgba(255, 59, 48, 0.1)"
                          : "rgba(255, 149, 0, 0.1)";
                    const statusEmoji =
                      check.status === "pass"
                        ? "✅"
                        : check.status === "fail"
                          ? "❌"
                          : "⚠️";
                    const borderColor =
                      check.status === "pass"
                        ? "rgba(52, 199, 89, 0.3)"
                        : check.status === "fail"
                          ? "rgba(255, 59, 48, 0.3)"
                          : "rgba(255, 149, 0, 0.3)";

                    return (
                      <div
                        key={idx}
                        style={{
                          background: statusColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: "8px",
                          padding: "10px",
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "16px",
                            marginTop: "2px",
                            flexShrink: 0,
                          }}
                        >
                          {statusEmoji}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "white",
                              marginBottom: "2px",
                            }}
                          >
                            {check.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.6)",
                            }}
                          >
                            {check.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Flags & Recommendations */}
              {validationResult.flags.length > 0 && (
                <div
                  style={{
                    background: "rgba(255, 149, 0, 0.1)",
                    border: "1px solid rgba(255, 149, 0, 0.3)",
                    borderRadius: "12px",
                    padding: "15px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "white",
                      marginBottom: "10px",
                    }}
                  >
                    🚩 Erkannte Flags
                  </div>
                  {validationResult.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.8)",
                        marginBottom: "6px",
                        paddingLeft: "16px",
                      }}
                    >
                      • {flag}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              <div
                style={{
                  background:
                    validationResult.recommendedAction === "approve"
                      ? "rgba(52, 199, 89, 0.15)"
                      : validationResult.recommendedAction === "manual-review"
                        ? "rgba(255, 149, 0, 0.15)"
                        : "rgba(255, 59, 48, 0.15)",
                  border: `2px solid ${
                    validationResult.recommendedAction === "approve"
                      ? "rgba(52, 199, 89, 0.4)"
                      : validationResult.recommendedAction === "manual-review"
                        ? "rgba(255, 149, 0, 0.4)"
                        : "rgba(255, 59, 48, 0.4)"
                  }`,
                  borderRadius: "12px",
                  padding: "15px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "white",
                    marginBottom: "8px",
                  }}
                >
                  💡 Empfehlung
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {validationResult.recommendedAction === "approve" &&
                    "✅ Transaktion genehmigen"}
                  {validationResult.recommendedAction === "manual-review" &&
                    "⚠️ Manuelle Prüfung erforderlich"}
                  {validationResult.recommendedAction === "reject" &&
                    "🚫 Transaktion ablehnen"}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.7)",
                    marginTop: "8px",
                  }}
                >
                  {validationResult.reasoning}
                </div>
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
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
              <p style={{ margin: 0 }}>Keine Validierung durchgeführt</p>
              <small
                style={{
                  marginTop: "8px",
                  display: "block",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Füllen Sie die Formularfelder aus und klicken Sie "Mit KI
                Validieren"
              </small>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentValidation;
