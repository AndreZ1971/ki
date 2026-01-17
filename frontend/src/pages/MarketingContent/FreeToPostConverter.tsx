import React, { useState } from "react";
import { motion } from "framer-motion";
import { useProductManagement } from "../../hooks/useProductManagement";
import { useToast } from "../../hooks/useToast";
import {
  BackButton,
  LoadingButton,
  ErrorMessage,
} from "../../components/shared";
import { ToastContainer } from "../../components/Toast/ToastContainer";
import "./page.css";

const FreeToPostConverter: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  // Map ML segment IDs to API enum values
  const mapSegmentId = (mlSegmentId: string): string => {
    const mapping: { [key: string]: string } = {
      inactive: "inactive",
      oneTime: "one-time",
      abandonedCart: "abandoned-cart",
      lowValue: "low-value",
    };
    return mapping[mlSegmentId] || mlSegmentId;
  };

  // Map recommended incentive names to API enum values
  const mapIncentiveType = (incentiveName: string): string => {
    const mapping: { [key: string]: string } = {
      "Loyalty Program": "loyalty",
      "Free Shipping": "free-shipping",
      "Discount Code": "discount",
      "Bundle Offer": "bundle",
    };
    return (
      mapping[incentiveName] || incentiveName.toLowerCase().replace(/\s+/g, "-")
    );
  };

  const [userSegment, setUserSegment] = useState("inactive");
  const [incentiveType, setIncentiveType] = useState("discount");
  const [conversionGoal, setConversionGoal] = useState("");
  const [mlSegments, setMlSegments] = useState<any[]>([]);
  const [aiCampaign, setAiCampaign] = useState<any>(null);
  const [showAiCampaign, setShowAiCampaign] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [_segments, _setSegments] = useState([
    {
      value: "inactive",
      label: "Inaktive Kunden",
      icon: "🔴",
      count: "...",
      rate: "...",
    },
    {
      value: "one-time",
      label: "Einmalkäufer",
      icon: "🛒",
      count: "...",
      rate: "...",
    },
    {
      value: "abandoned-cart",
      label: "Warenkorbabbrecher",
      icon: "🛒❌",
      count: "...",
      rate: "...",
    },
    {
      value: "low-value",
      label: "Niedrigwert-Kunden",
      icon: "💰",
      count: "...",
      rate: "...",
    },
  ]);
  const segments = _segments;

  const incentives = [
    { value: "discount", label: "Rabatt-Code", icon: "🏷️", conversion: "+18%" },
    {
      value: "free-shipping",
      label: "Gratis Versand",
      icon: "📦",
      conversion: "+25%",
    },
    {
      value: "loyalty",
      label: "Treueprogramm",
      icon: "⭐",
      conversion: "+32%",
    },
    {
      value: "bundle",
      label: "Bundle-Angebot",
      icon: "🎁",
      conversion: "+28%",
    },
  ];

  React.useEffect(() => {
    const loadMlSegments = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(
          `${apiBase}/api/marketing/conversion/analyze-segments-ai`,
          {
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.success) setMlSegments(data.data.segments);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {

        } else {

        }
      }
    };
    loadMlSegments();
  }, []);

  const handleGenerateAiCampaign = async () => {
    if (!conversionGoal.trim()) {
      showToast("Bitte gib ein Conversion-Ziel ein", "error");
      return;
    }

    setAiLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      // Find the ML segment if user selected from ML segments
      const selectedMlSegment = mlSegments.find(
        (s) => s.segmentId === userSegment
      );

      // Use the actual segment data for AI generation
      const segmentId = selectedMlSegment?.segmentId || userSegment;
      const segmentName = selectedMlSegment?.segmentName || "Segment";

      // Map incentive type to API format
      const mappedIncentiveType = mapIncentiveType(incentiveType);

      const response = await fetch(
        `${apiBase}/api/marketing/conversion/generate-campaign-ai`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segmentId,
            segmentName,
            conversionGoal,
            incentiveType: mappedIncentiveType,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setAiCampaign(data.data.proposal);
        setShowAiCampaign(true);
        showToast("🤖 KI-Kampagne erfolgreich generiert!", "success");
      } else {
        showToast(
          "KI-Generierung fehlgeschlagen: " +
            (data.error || "Unbekannter Fehler"),
          "error"
        );
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "KI-Generierung fehlgeschlagen",
        "error"
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!conversionGoal.trim()) {
      showToast("Bitte gib ein Conversion-Ziel ein", "error");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";

      // Map segment ID to API enum value
      const mappedSegment = mapSegmentId(userSegment);
      const mappedIncentiveType = mapIncentiveType(incentiveType);

      const response = await fetch(
        `${apiBase}/api/marketing/conversion/create-campaign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userSegment: mappedSegment,
            incentiveType: mappedIncentiveType,
            conversionGoal,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        showToast("✅ Kampagne erfolgreich erstellt!", "success");
        setConversionGoal("");
        setShowAiCampaign(false);
      } else {
        throw new Error(data.error || "Campaign creation failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler";
      setError(msg);
      showToast(msg, "error");
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
        <h1>🔄 Customer Conversion Tool mit KI</h1>
        <p>ML & KI-generierte Kampagnen für maximale Conversions</p>
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
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ color: "white", marginBottom: "20px" }}>
            🎯 Conversion Setup
          </h3>
          <div className="form-group">
            <label>Nutzer-Segment</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {segments.map((seg) => (
                <div
                  key={seg.value}
                  onClick={() => setUserSegment(seg.value)}
                  style={{
                    padding: "12px",
                    background:
                      userSegment === seg.value
                        ? "rgba(167, 139, 250, 0.3)"
                        : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  {seg.icon} {seg.label}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Anreiz-Typ</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {incentives.map((inc) => (
                <div
                  key={inc.value}
                  onClick={() => setIncentiveType(inc.value)}
                  style={{
                    padding: "12px",
                    background:
                      incentiveType === inc.value
                        ? "rgba(34, 197, 94, 0.3)"
                        : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  {inc.icon} {inc.label}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Conversion-Ziel *</label>
            <input
              type="text"
              value={conversionGoal}
              onChange={(e) => setConversionGoal(e.target.value)}
              placeholder="z.B. Premium kaufen"
              className="form-input"
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <LoadingButton
                onClick={handleGenerateAiCampaign}
                loading={aiLoading}
                loadingText="KI lädt..."
              >
                🤖 KI generieren
              </LoadingButton>
            </div>
            <div style={{ flex: 1 }}>
              <LoadingButton
                onClick={handleConvert}
                loading={loading}
                loadingText="Erstelle..."
              >
                🚀 Starten
              </LoadingButton>
            </div>
          </div>
        </motion.div>
        {showAiCampaign && aiCampaign && (
          <motion.div
            className="form-container"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ background: "rgba(168, 85, 247, 0.1)" }}
          >
            <h3 style={{ color: "#a855f7" }}>✨ KI-Kampagne</h3>
            <div
              style={{
                padding: "16px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <h4 style={{ color: "white", margin: "0 0 8px 0" }}>
                {aiCampaign.campaignTitle}
              </h4>
              <p
                style={{ color: "rgba(255,255,255,0.8)", margin: "0 0 12px 0" }}
              >
                {aiCampaign.campaignText}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    padding: "8px",
                    background: "rgba(59, 130, 246, 0.2)",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}
                  >
                    Angebot
                  </div>
                  <div style={{ color: "#60a5fa", fontWeight: "bold" }}>
                    {aiCampaign.offerDescription}
                  </div>
                </div>
                <div
                  style={{
                    padding: "8px",
                    background: "rgba(34, 197, 94, 0.2)",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}
                  >
                    Lift
                  </div>
                  <div style={{ color: "#22c55e", fontWeight: "bold" }}>
                    +{aiCampaign.estimatedLift}%
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAiCampaign(false);
                showToast("Kampagne gespeichert!", "success");
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "#a855f7",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✅ Verwenden
            </button>
          </motion.div>
        )}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ color: "white" }}>📊 ML-Segmente</h3>
          {mlSegments.length > 0 ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {mlSegments.map((seg) => (
                <div
                  key={seg.segmentId}
                  onClick={() => setUserSegment(seg.segmentId)}
                  style={{
                    padding: "12px",
                    background:
                      userSegment === seg.segmentId
                        ? "rgba(168, 85, 247, 0.2)"
                        : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {seg.segmentName}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.6)" }}>
                        Kunden
                      </div>
                      <div style={{ color: "#60a5fa" }}>
                        {seg.customerCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.6)" }}>Conv</div>
                      <div style={{ color: "#22c55e" }}>
                        {seg.conversionRate}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.6)" }}>
                        Risiko
                      </div>
                      <div
                        style={{
                          color:
                            seg.churnRisk === "high" ? "#ef4444" : "#f59e0b",
                        }}
                      >
                        {seg.churnRisk}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}
            >
              ⚙️ Lädt...
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FreeToPostConverter;
