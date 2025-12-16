// src/pages/PaymentFinances/PaymentFast.tsx
import React, { useState, useEffect } from "react";
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
import type { FraudAnalysis, AmountSuggestion } from "../../types/product";
import "./page.css";

interface PaymentResult {
  transactionId: string;
  status: "success" | "failed";
  amount: string;
  timestamp: string;
  processingTime: string;
}

const PaymentFast: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );

  // ML State
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudAnalysis | null>(
    null
  );
  const [analyzingFraud, setAnalyzingFraud] = useState(false);
  const [suggestedAmounts, setSuggestedAmounts] = useState<AmountSuggestion[]>(
    []
  );
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const currencies = ["EUR", "USD", "GBP", "CHF"];

  // ML Handlers
  const handleFraudCheck = async () => {
    if (!amount || !customerEmail || parseFloat(amount) <= 0) {
      setFraudAnalysis(null);
      return;
    }

    setAnalyzingFraud(true);
    try {
      const response = await paymentApi.checkFraud({
        amount: parseFloat(amount),
        currency,
        customerEmail,
      });

      if (response.success && response.data) {
        setFraudAnalysis(response.data);

        if (response.data.riskLevel === "high") {
          showToast(`⚠️ Hohes Risiko: ${response.data.riskScore}%`, "warning");
        }
      }
    } catch (_err) {
      showToast("❌ Fraud-Check fehlgeschlagen", "error");
    } finally {
      setAnalyzingFraud(false);
    }
  };

  const handleLoadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await paymentApi.suggestAmounts({ currency });

      if (response.success && response.data) {
        setSuggestedAmounts(response.data);
        showToast(`✨ ${response.data.length} Empfehlungen geladen`, "success");
      }
    } catch (_err) {
      showToast("❌ Empfehlungen konnten nicht geladen werden", "error");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AmountSuggestion) => {
    setAmount(suggestion.amount.toString());
    showToast(`✅ ${suggestion.amount} ${currency} ausgewählt`, "success");
    setTimeout(handleFraudCheck, 300);
  };

  // Auto fraud check (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && customerEmail) {
        handleFraudCheck();
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, customerEmail, currency]);

  const handleProcess = async () => {
    if (!amount || !customerEmail) {
      showToast("Bitte fülle alle Felder aus", "error");
      return;
    }

    // Check fraud risk
    if (
      fraudAnalysis &&
      fraudAnalysis.riskLevel === "high" &&
      fraudAnalysis.riskScore > 80
    ) {
      const confirm = window.confirm(
        `⚠️ Hohes Betrugsrisiko (${fraudAnalysis.riskScore}%)!\n\n${fraudAnalysis.recommendation}\n\nTrotzdem fortfahren?`
      );
      if (!confirm) return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const processingTime = `${Date.now() - startTime}ms`;
      setPaymentResult({
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "success",
        amount: `${amount} ${currency}`,
        timestamp: formatDateTime(new Date()),
        processingTime,
      });

      showToast("Payment erfolgreich verarbeitet! ⚡", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment-Fehler";
      setError(errorMessage);
      showToast(errorMessage, "error");
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
        <h1>⚡ Payment Fast</h1>
        <p>Blitzschnelle Payment-Verarbeitung in Echtzeit</p>
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
            💳 Payment-Details
          </h3>

          {/* Amount Suggestions */}
          <div style={{ marginBottom: "15px" }}>
            <button
              onClick={handleLoadSuggestions}
              disabled={loadingSuggestions}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                color: "white",
                fontWeight: "600",
                cursor: loadingSuggestions ? "not-allowed" : "pointer",
                opacity: loadingSuggestions ? 0.7 : 1,
                transition: "all 0.2s",
              }}
            >
              {loadingSuggestions
                ? "⏳ Lade..."
                : "✨ Smarte Betragsempfehlungen"}
            </button>
          </div>

          {suggestedAmounts.length > 0 && (
            <div
              style={{
                marginBottom: "15px",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {suggestedAmounts.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  style={{
                    background: "rgba(102, 126, 234, 0.1)",
                    border: "1px solid rgba(102, 126, 234, 0.5)",
                    borderRadius: "20px",
                    padding: "8px 16px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(102, 126, 234, 0.2)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(102, 126, 234, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {suggestion.amount} {currency}
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "11px",
                      opacity: 0.8,
                      background: "rgba(52, 199, 89, 0.2)",
                      padding: "2px 6px",
                      borderRadius: "8px",
                    }}
                  >
                    📊 {suggestion.conversionScore}%
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>Betrag *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="z.B. 99.99"
              step="0.01"
              min="0"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Währung</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="form-input"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Kunden-Email *</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="kunde@beispiel.de"
              className="form-input"
            />
          </div>

          {/* Fraud Analysis Display */}
          {fraudAnalysis && (
            <div
              style={{
                background:
                  fraudAnalysis.riskLevel === "high"
                    ? "rgba(255, 59, 48, 0.1)"
                    : fraudAnalysis.riskLevel === "medium"
                      ? "rgba(255, 159, 10, 0.1)"
                      : "rgba(52, 199, 89, 0.1)",
                border: `1px solid ${
                  fraudAnalysis.riskLevel === "high"
                    ? "rgba(255, 59, 48, 0.5)"
                    : fraudAnalysis.riskLevel === "medium"
                      ? "rgba(255, 159, 10, 0.5)"
                      : "rgba(52, 199, 89, 0.5)"
                }`,
                borderRadius: "12px",
                padding: "15px",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "white",
                  }}
                >
                  {fraudAnalysis.riskLevel === "high"
                    ? "⚠️ Hohes Risiko"
                    : fraudAnalysis.riskLevel === "medium"
                      ? "⚡ Mittleres Risiko"
                      : "✅ Niedriges Risiko"}
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  {fraudAnalysis.riskScore}%
                </span>
              </div>

              {analyzingFraud && (
                <div
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}
                >
                  🔄 Analysiere...
                </div>
              )}

              {fraudAnalysis.flags.length > 0 && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {fraudAnalysis.flags.map((flag, idx) => (
                    <div key={idx} style={{ marginBottom: "4px" }}>
                      • {flag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              padding: "15px",
              marginTop: "15px",
            }}
          >
            <h4
              style={{ color: "white", fontSize: "13px", marginBottom: "10px" }}
            >
              ⚡ Fast Payment Features
            </h4>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div>✅ Verarbeitung in unter 1 Sekunde</div>
              <div>✅ Sofortige Bestätigung</div>
              <div>✅ Automatische Benachrichtigung</div>
              <div>✅ 99.9% Erfolgsquote</div>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <LoadingButton
              onClick={handleProcess}
              loading={loading}
              loadingText="Verarbeite..."
            >
              ⚡ Sofort Verarbeiten
            </LoadingButton>
          </div>
        </motion.div>

        <motion.div
          className="result-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            📊 Transaktions-Status
          </h3>
          {paymentResult ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div
                style={{
                  background:
                    paymentResult.status === "success"
                      ? "rgba(52, 199, 89, 0.1)"
                      : "rgba(255, 59, 48, 0.1)",
                  border: `1px solid ${paymentResult.status === "success" ? "rgba(52, 199, 89, 0.5)" : "rgba(255, 59, 48, 0.5)"}`,
                  borderRadius: "12px",
                  padding: "25px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "64px", marginBottom: "15px" }}>
                  {paymentResult.status === "success" ? "✅" : "❌"}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  {paymentResult.status === "success"
                    ? "Erfolgreich!"
                    : "Fehlgeschlagen"}
                </div>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  {paymentResult.amount}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    marginBottom: "15px",
                    paddingBottom: "15px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "5px",
                    }}
                  >
                    Transaktions-ID
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "white",
                      fontFamily: "monospace",
                    }}
                  >
                    {paymentResult.transactionId}
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: "15px",
                    paddingBottom: "15px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "5px",
                    }}
                  >
                    Zeitstempel
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    {paymentResult.timestamp}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "5px",
                    }}
                  >
                    Verarbeitungszeit
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#34c759",
                    }}
                  >
                    ⚡ {paymentResult.processingTime}
                  </div>
                </div>
              </div>

              {/* Fraud Analysis Result */}
              {fraudAnalysis && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h4
                    style={{
                      color: "white",
                      fontSize: "14px",
                      marginBottom: "15px",
                    }}
                  >
                    🛡️ Sicherheitsanalyse
                  </h4>

                  <div style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.7)",
                        marginBottom: "8px",
                      }}
                    >
                      Risiko-Score
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        height: "24px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${fraudAnalysis.riskScore}%`,
                          height: "100%",
                          background:
                            fraudAnalysis.riskLevel === "high"
                              ? "linear-gradient(90deg, #ff3b30 0%, #ff6b60 100%)"
                              : fraudAnalysis.riskLevel === "medium"
                                ? "linear-gradient(90deg, #ff9f0a 0%, #ffb340 100%)"
                                : "linear-gradient(90deg, #34c759 0%, #5dd589 100%)",
                          transition: "width 0.5s ease",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "white",
                          textShadow: "0 0 4px rgba(0,0,0,0.5)",
                        }}
                      >
                        {fraudAnalysis.riskScore}%
                      </div>
                    </div>
                  </div>

                  {fraudAnalysis.flags.length > 0 && (
                    <div style={{ marginBottom: "15px" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.7)",
                          marginBottom: "8px",
                        }}
                      >
                        Erkannte Flags
                      </div>
                      {fraudAnalysis.flags.map((flag, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: "12px",
                            color: "white",
                            background: "rgba(255, 59, 48, 0.1)",
                            border: "1px solid rgba(255, 59, 48, 0.3)",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            marginBottom: "6px",
                          }}
                        >
                          ⚠️ {flag}
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.7)",
                        marginBottom: "8px",
                      }}
                    >
                      Empfehlung
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "white",
                        background: "rgba(102, 126, 234, 0.1)",
                        border: "1px solid rgba(102, 126, 234, 0.3)",
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    >
                      💡 {fraudAnalysis.recommendation}
                    </div>
                  </div>

                  {fraudAnalysis.confidence && (
                    <div
                      style={{
                        marginTop: "15px",
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                      }}
                    >
                      Konfidenz: {(fraudAnalysis.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              )}

              <motion.button
                onClick={() => setPaymentResult(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "12px",
                  background: "rgba(102, 126, 234, 0.2)",
                  border: "1px solid rgba(102, 126, 234, 0.5)",
                  borderRadius: "12px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                🔄 Neue Transaktion
              </motion.button>
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
              <p>Keine Transaktion aktiv</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Starte eine Payment-Verarbeitung
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentFast;
