// src/pages/Advanced/StringGenerator.tsx
import React, { useMemo, useState } from "react";
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
import "./page.css";

const StringGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { handleBackToDashboard, loading, setLoading, error, setError } =
    useProductManagement();
  const { toasts, showToast } = useToast();

  const [stringType, setStringType] = useState("id");
  const [length, setLength] = useState("16");
  const [format, setFormat] = useState("alphanumeric");
  const [count, setCount] = useState(1);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedStrings, setGeneratedStrings] = useState<
    Array<{ value: string; entropy: number; source: "crypto" | "fallback" }>
  >([]);
  const [toolStatus, setToolStatus] = useState({
    mode: "local" as const,
    dataCompleteness: 1,
    confidence: 1,
    notes: ["entropy=crypto"],
  });

  const stringTypes = [
    { value: "id", label: "Unique ID", icon: "🆔", description: "UUID/GUID" },
    {
      value: "password",
      label: "Password",
      icon: "🔐",
      description: "Sicheres Passwort",
    },
    {
      value: "token",
      label: "API Token",
      icon: "🔑",
      description: "Auth Token",
    },
    {
      value: "slug",
      label: "URL Slug",
      icon: "🔗",
      description: "SEO-freundlich",
    },
  ];

  const formats = [
    { value: "alphanumeric", label: "Alphanumerisch", icon: "🔤" },
    { value: "numeric", label: "Nur Zahlen", icon: "🔢" },
    { value: "alphabetic", label: "Nur Buchstaben", icon: "🔠" },
    { value: "hexadecimal", label: "Hexadezimal", icon: "⬡" },
  ];

  const baseCharSet = useMemo(() => {
    if (format === "numeric") return "0123456789";
    if (format === "hexadecimal") return "0123456789abcdef";
    if (format === "alphabetic")
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    if (
      includeSymbols &&
      (stringType === "password" || stringType === "token")
    ) {
      chars += "!@#$%^&*()-_=+[]{};:,.?/";
    }
    return chars;
  }, [format, includeSymbols, stringType]);

  const secureRandomString = (len: number, charset: string) => {
    if (len <= 0) return { value: "", source: "crypto" as const };
    if (charset.length === 0) return { value: "", source: "crypto" as const };
    const array = new Uint32Array(len);
    let source: "crypto" | "fallback" = "crypto";
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback auf Math.random nur wenn nötig
      for (let i = 0; i < len; i++) {
        array[i] = Math.floor(Math.random() * 0xffffffff);
      }
      source = "fallback";
    }
    let out = "";
    for (let i = 0; i < len; i++) {
      out += charset[array[i] % charset.length];
    }
    return { value: out, source };
  };

  const toUuidLike = (raw: string) => {
    const padded = (raw + secureRandomString(32, baseCharSet).value).slice(0, 32);
    return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20)}`;
  };

  const slugify = (raw: string) =>
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleGenerate = async () => {
    const len = Math.min(Math.max(parseInt(length, 10) || 0, 4), 128);
    if (Number.isNaN(len) || len < 4) {
      showToast("Bitte eine Länge zwischen 4 und 128 wählen", "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 120));

      const results: Array<{ value: string; entropy: number; source: "crypto" | "fallback" }> = [];
      const iterations = Math.min(Math.max(count, 1), 5);
      let entropyNote: "entropy=crypto" | "entropy=fallback" = "entropy=crypto";

      for (let i = 0; i < iterations; i++) {
        const generated = secureRandomString(len, baseCharSet);
        let raw = generated.value;
        if (generated.source === "fallback") {
          entropyNote = "entropy=fallback";
        }

        if (stringType === "id") {
          raw = toUuidLike(raw);
        } else if (stringType === "slug") {
          raw = slugify(raw).slice(0, len);
        }

        const entropy =
          Math.round(len * Math.log2(baseCharSet.length) * 100) / 100;
        results.push({ value: raw, entropy, source: generated.source });
      }

      setGeneratedStrings(results);
      setToolStatus({
        mode: "local",
        dataCompleteness: 1,
        confidence: 1,
        notes: [entropyNote],
      });
      showToast(`${results.length} String(s) generiert`, "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast("In Zwischenablage kopiert!", "success");
        return;
      }
    } catch (_err) {
      // Fallback below
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("In Zwischenablage kopiert!", "success");
    } catch (_err) {
      showToast("Kopieren nicht möglich", "error");
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
        transition={{ duration: 0.5 }}
      >
        <h1>{t("ml.stringGenerator.title")}</h1>
        <p>{t("ml.stringGenerator.subtitle", "Generate secure local strings")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "linear-gradient(135deg, rgba(45, 55, 72, 0.6), rgba(26, 32, 44, 0.8))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          color: "white",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span>🛠️</span>
          <div>
            <div style={{ fontWeight: 700 }}>Mode: {toolStatus.mode}</div>
            <div style={{ opacity: 0.8 }}>Confidence: {toolStatus.confidence}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span>ℹ️</span>
          <div>
            <div style={{ fontWeight: 700 }}>Data Completeness: {toolStatus.dataCompleteness}</div>
            <div style={{ opacity: 0.8 }}>{toolStatus.notes.join(", ")}</div>
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
          transition={{ delay: 0.2 }}
        >
          <h3
            style={{
              color: "white",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            ⚙️ {t("ml.stringGenerator.type")}
          </h3>

          <div className="form-group">
            <label>{t("ml.stringGenerator.type")}</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {stringTypes.map((type) => (
                <motion.div
                  key={type.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStringType(type.value)}
                  style={{
                    padding: "14px",
                    background:
                      stringType === type.value
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "rgba(255,255,255,0.05)",
                    border:
                      stringType === type.value
                        ? "2px solid rgba(102, 126, 234, 0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                    {type.icon}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "white",
                      marginBottom: "4px",
                    }}
                  >
                    {type.label}
                  </div>
                  <div
                    style={{ fontSize: "10px", opacity: 0.7, color: "white" }}
                  >
                    {type.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div
            className="form-group"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <label>{t("ml.stringGenerator.length")}</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                min="4"
                max="128"
                className="form-input"
              />
            </div>
            <div>
              <label>Anzahl</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min={1}
                max={5}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t("ml.stringGenerator.type")}</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {formats.map((fmt) => (
                <motion.div
                  key={fmt.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFormat(fmt.value)}
                  style={{
                    padding: "12px",
                    background:
                      format === fmt.value
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "rgba(255,255,255,0.05)",
                    border:
                      format === fmt.value
                        ? "2px solid rgba(102, 126, 234, 0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>
                    {fmt.icon}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    {fmt.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {(stringType === "password" || stringType === "token") && (
            <div
              className="form-group"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <input
                id="symbols"
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
              />
              <label htmlFor="symbols" style={{ color: "white" }}>
                {t("common.generate")}
              </label>
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <LoadingButton
              onClick={handleGenerate}
              loading={loading}
              loadingText={t("ml.stringGenerator.generating")}
            >
              🔤 {t("ml.stringGenerator.generate")}
            </LoadingButton>
          </div>
        </motion.div>

        <motion.div
          className="result-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3
            style={{
              color: "white",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            📋 Generierte Strings
          </h3>
          {generatedStrings.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {generatedStrings.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      Entropy: {item.entropy} bits · Source: {item.source}
                    </div>
                    <motion.button
                      onClick={() => copyToClipboard(item.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: "6px 12px",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        borderRadius: "6px",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      📋 Kopieren
                    </motion.button>
                  </div>
                  <div
                    style={{
                      color: "white",
                      fontFamily: "monospace",
                      fontSize: "16px",
                      wordBreak: "break-all",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
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
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔤</div>
              <p>Hier erscheinen die generierten Strings</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StringGenerator;
