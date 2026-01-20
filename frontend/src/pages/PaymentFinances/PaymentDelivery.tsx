// src/pages/PaymentFinances/PaymentDelivery.tsx
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
import type { DeliveryOptimizationResult } from "../../types/product";
import "./page.css";

const PaymentDelivery: React.FC = () => {
  const { t } = useTranslation();
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  const [orderId, setOrderId] = useState("");
  const [destination, setDestination] = useState({
    country: "Deutschland",
    city: "Hamburg",
    postalCode: "20095",
  });
  const [urgency, setUrgency] = useState<"standard" | "express" | "overnight">(
    "standard"
  );
  const [optimization, setOptimization] =
    useState<DeliveryOptimizationResult | null>(null);

  const handleOptimize = async () => {
    if (!orderId || !destination.city || !destination.postalCode) {
      showToast(t("common.fillRequiredFields"), "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.optimizeDelivery({
        orderId,
        destination,
        urgency,
      });

      if (response.success && response.data) {
        setOptimization(response.data);
        showToast("✅ KI-Optimierung abgeschlossen!", "success");
      } else {
        throw new Error(response.error || "Optimierung fehlgeschlagen");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimierungs-Fehler");
      showToast("Optimierung fehlgeschlagen", "error");
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
        <h1>Payment Delivery</h1>
        <p>Payment-Delivery und Versandabwicklung</p>
      </motion.div>

      {/* Datenschutz-Hinweis */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(255,149,0,0.1)",
          border: "2px solid rgba(255,149,0,0.3)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "24px" }}>🔒</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#ff9500",
              marginBottom: "4px",
            }}
          >
            {t("common.privacyNotice")}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.8)",
              lineHeight: "1.5",
            }}
          >
            Alle Versand- und Payment-Daten werden verschlüsselt übertragen und nach Lieferung gelöscht.
          </div>
        </div>
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
            Delivery Optimization Configuration
          </h3>

          <div className="form-group">
            <label>Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-789456"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={destination.city}
              onChange={(e) =>
                setDestination({ ...destination, city: e.target.value })
              }
              placeholder="Hamburg"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Postal Code</label>
            <input
              type="text"
              value={destination.postalCode}
              onChange={(e) =>
                setDestination({ ...destination, postalCode: e.target.value })
              }
              placeholder="20095"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              value={destination.country}
              onChange={(e) =>
                setDestination({ ...destination, country: e.target.value })
              }
              placeholder="Deutschland"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Urgency</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="form-input"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="overnight">Overnight</option>
            </select>
          </div>

          <div style={{ marginTop: "20px" }}>
            <LoadingButton
              onClick={handleOptimize}
              loading={loading}
              loadingText={t("common.aiAnalyzing")}
            >
              Start Optimization
            </LoadingButton>
          </div>
        </motion.div>

        {optimization && (
          <>
            {/* KI Confidence Dashboard */}
            <motion.div
              className="result-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 style={{ color: "white", marginBottom: "20px" }}>
                🎯 KI Confidence & Metadata
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "rgba(52, 199, 89, 0.1)",
                    border: "1px solid rgba(52, 199, 89, 0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginBottom: "8px",
                      color: "white",
                    }}
                  >
                    KI Confidence
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#34c759",
                    }}
                  >
                    {(optimization.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,122,255,0.1)",
                    border: "1px solid rgba(0,122,255,0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginBottom: "8px",
                      color: "white",
                    }}
                  >
                    Gewicht
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#007aff",
                    }}
                  >
                    {optimization.metadata.totalWeight} kg
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(255,149,0,0.1)",
                    border: "1px solid rgba(255,149,0,0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginBottom: "8px",
                      color: "white",
                    }}
                  >
                    Warenwert
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#ff9500",
                    }}
                  >
                    €{optimization.metadata.totalValue.toFixed(0)}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(175,82,222,0.1)",
                    border: "1px solid rgba(175,82,222,0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginBottom: "8px",
                      color: "white",
                    }}
                  >
                    Ziel
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#af52de",
                      wordBreak: "break-word",
                    }}
                  >
                    {optimization.metadata.destination.split(",")[0]}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recommended Carrier */}
            <motion.div
              className="result-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 style={{ color: "white", marginBottom: "20px" }}>
                ⭐ Empfohlener Carrier
              </h3>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(52, 199, 89, 0.15), rgba(0,122,255,0.15))",
                  border: "2px solid rgba(52, 199, 89, 0.5)",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🚚</div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "8px",
                  }}
                >
                  {optimization.recommendedCarrier.name}
                </div>
                {optimization.recommendedCarrier.reason && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.8)",
                      marginBottom: "16px",
                    }}
                  >
                    {optimization.recommendedCarrier.reason}
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    marginTop: "16px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{ fontSize: "11px", opacity: 0.6, color: "white" }}
                    >
                      Lieferzeit
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#34c759",
                      }}
                    >
                      {optimization.recommendedCarrier.estimatedDays}d
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{ fontSize: "11px", opacity: 0.6, color: "white" }}
                    >
                      Kosten
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#ff9500",
                      }}
                    >
                      €{optimization.recommendedCarrier.cost.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{ fontSize: "11px", opacity: 0.6, color: "white" }}
                    >
                      Zuverlässigkeit
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#007aff",
                      }}
                    >
                      {optimization.recommendedCarrier.reliability}%
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Alternative Carriers */}
            {optimization.alternativeCarriers.length > 0 && (
              <motion.div
                className="result-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 style={{ color: "white", marginBottom: "20px" }}>
                  📋 Alternative Carrier
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {optimization.alternativeCarriers.map((carrier, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "white",
                          marginBottom: "8px",
                        }}
                      >
                        {carrier.name}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.6,
                              color: "white",
                            }}
                          >
                            Tage
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "white",
                            }}
                          >
                            {carrier.estimatedDays}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.6,
                              color: "white",
                            }}
                          >
                            Preis
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "white",
                            }}
                          >
                            €{carrier.cost.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.6,
                              color: "white",
                            }}
                          >
                            Score
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "white",
                            }}
                          >
                            {carrier.reliability}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Delivery Risks */}
            {optimization.deliveryRisks.length > 0 && (
              <motion.div
                className="result-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 style={{ color: "white", marginBottom: "20px" }}>
                  ⚠️ Risikofaktoren
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {optimization.deliveryRisks.map((risk, idx) => {
                    const color =
                      risk.probability === "high"
                        ? "#ff3b30"
                        : risk.probability === "medium"
                          ? "#ff9500"
                          : "#34c759";
                    const icon =
                      risk.probability === "high"
                        ? "🔴"
                        : risk.probability === "medium"
                          ? "🟡"
                          : "🟢";
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          border: `1px solid ${color}50`,
                          borderRadius: "12px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <span style={{ fontSize: "20px" }}>{icon}</span>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              color,
                            }}
                          >
                            {risk.risk}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.7)",
                            marginBottom: "8px",
                          }}
                        >
                          <strong>Wahrscheinlichkeit:</strong>{" "}
                          {risk.probability}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.8)",
                          }}
                        >
                          <strong>Lösung:</strong> {risk.mitigation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Route Optimization */}
            <motion.div
              className="result-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 style={{ color: "white", marginBottom: "20px" }}>
                🗺️ Routen-Optimierung
              </h3>
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
                    marginBottom: "16px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "6px",
                    }}
                  >
                    Schnellste Route
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    {optimization.routeOptimization.fastestRoute}
                  </div>
                </div>
                <div
                  style={{
                    marginBottom: "16px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "6px",
                    }}
                  >
                    Günstigste Route
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    {optimization.routeOptimization.cheapestRoute}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "6px",
                    }}
                  >
                    KI Empfehlung
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#34c759",
                    }}
                  >
                    {optimization.routeOptimization.recommended === "fastest"
                      ? "⚡ Schnellste"
                      : optimization.routeOptimization.recommended ===
                          "cheapest"
                        ? "💰 Günstigste"
                        : "⚖️ Balanced"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Estimated Delivery */}
            <motion.div
              className="result-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 style={{ color: "white", marginBottom: "20px" }}>
                📅 Lieferprognose
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "rgba(52, 199, 89, 0.1)",
                    border: "1px solid rgba(52, 199, 89, 0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "6px",
                    }}
                  >
                    Best Case
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#34c759",
                    }}
                  >
                    {optimization.estimatedDelivery.best || "N/A"}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,122,255,0.1)",
                    border: "1px solid rgba(0,122,255,0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "6px",
                    }}
                  >
                    Wahrscheinlich
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#007aff",
                    }}
                  >
                    {optimization.estimatedDelivery.likely || "N/A"}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(255,149,0,0.1)",
                    border: "1px solid rgba(255,149,0,0.5)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: "white",
                      marginBottom: "6px",
                    }}
                  >
                    Worst Case
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#ff9500",
                    }}
                  >
                    {optimization.estimatedDelivery.worst || "N/A"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Special Instructions */}
            {optimization.specialInstructions.length > 0 && (
              <motion.div
                className="result-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 style={{ color: "white", marginBottom: "20px" }}>
                  📝 Spezielle Hinweise
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {optimization.specialInstructions.map((instruction, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(175,82,222,0.1)",
                        border: "1px solid rgba(175,82,222,0.5)",
                        borderRadius: "10px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>✅</span>
                      <span style={{ fontSize: "14px", color: "white" }}>
                        {instruction}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentDelivery;
