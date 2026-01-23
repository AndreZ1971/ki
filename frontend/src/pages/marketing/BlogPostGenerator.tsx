import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import "./BlogPostGenerator.css";
// Entfernt: useNavigate (ungenuzt)
import { BackButton } from "../../components/shared/BackButton";
import { useProductManagement } from "../../hooks/useProductManagement";

const BlogPostGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { handleBackToDashboard } = useProductManagement();
  // Entfernt: navigate (ungenuzt)
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [seo, setSeo] = useState(true);
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [language, setLanguage] = useState("de");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<{
    mode: 'real' | 'fallback';
    confidence: number;
    inputs: Record<string, string>;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    setMetadata(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiBase}/api/marketing/blogpost/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          seo,
          length,
          language,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.content);
        if (data.mode && data.confidence !== undefined && data.inputs) {
          setMetadata({
            mode: data.mode,
            confidence: data.confidence,
            inputs: data.inputs
          });
        }
      } else
        setResult(t("pages.blogpost.error") + ": " + (data.error || "Unknown"));
    } catch (_e) {
      setResult(t("pages.blogpost.error"));
    }
    setLoading(false);
  };

  return (
    <div className="blogpost-generator-container">
      <BackButton onClick={handleBackToDashboard} />
      <h2>{t("pages.blogpost.title")}</h2>
      <div style={{ marginBottom: 12 }}>
        <label>
          {t("pages.blogpost.topic")}:&nbsp;
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ width: 300 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          {t("pages.blogpost.keywords")}:&nbsp;
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            style={{ width: 300 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          {t("pages.blogpost.seo")}:&nbsp;
          <input
            type="checkbox"
            checked={seo}
            onChange={(e) => setSeo(e.target.checked)}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          {t("pages.blogpost.length")}:&nbsp;
          <select
            value={length}
            onChange={(e) => setLength(e.target.value as any)}
          >
            <option value="short">{t("pages.blogpost.lengthShort")}</option>
            <option value="medium">{t("pages.blogpost.lengthMedium")}</option>
            <option value="long">{t("pages.blogpost.lengthLong")}</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          {t("pages.blogpost.language")}:&nbsp;
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="de">Deutsch (DE)</option>
            <option value="en">English (EN)</option>
            <option value="fr">Français (FR)</option>
            <option value="es">Español (ES)</option>
            <option value="it">Italiano (IT)</option>
            <option value="pt">Português (PT)</option>
            <option value="nl">Nederlands (NL)</option>
            <option value="pl">Polski (PL)</option>
          </select>
        </label>
      </div>
      <button onClick={handleGenerate} disabled={loading || !topic}>
        {loading
          ? t("pages.blogpost.generating")
          : t("pages.blogpost.generate")}
      </button>

      {/* Metadata Display */}
      {metadata && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: metadata.mode === 'fallback' 
              ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 234, 167, 0.15) 100%)' 
              : 'linear-gradient(135deg, rgba(23, 162, 184, 0.15) 0%, rgba(23, 162, 184, 0.25) 100%)',
            border: `2px solid ${metadata.mode === 'fallback' ? 'rgba(255, 193, 7, 0.4)' : 'rgba(23, 162, 184, 0.4)'}`,
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>
              {metadata.mode === 'fallback' ? '⚠️' : '✅'}
            </span>
            <div>
              <strong style={{ fontSize: '16px', display: 'block', color: 'white' }}>
                {metadata.mode === 'fallback' ? 'Fallback-Modus' : 'OpenAI GPT'}
              </strong>
              <span style={{ fontSize: '13px', opacity: 0.8, color: 'rgba(255,255,255,0.8)' }}>
                Confidence: {metadata.confidence}%
              </span>
            </div>
          </div>

          <div style={{ 
            fontSize: '13px', 
            opacity: 0.9, 
            background: 'rgba(255,255,255,0.05)', 
            padding: '12px', 
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.9)'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'white' }}>Input-Parameter:</strong>
            {Object.entries(metadata.inputs).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '4px' }}>
                <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{key}:</strong> <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3>{t("pages.blogpost.result")}</h3>
        <textarea value={result} readOnly rows={16} style={{ width: "100%" }} />
      </div>
    </div>
  );
};

export default BlogPostGenerator;
