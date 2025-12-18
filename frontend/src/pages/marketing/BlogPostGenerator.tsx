import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/marketing/blogpost/generate", {
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
      if (data.success) setResult(data.content);
      else
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
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ width: 100 }}
          />
        </label>
      </div>
      <button onClick={handleGenerate} disabled={loading || !topic}>
        {loading
          ? t("pages.blogpost.generating")
          : t("pages.blogpost.generate")}
      </button>
      <div style={{ marginTop: 24 }}>
        <h3>{t("pages.blogpost.result")}</h3>
        <textarea value={result} readOnly rows={16} style={{ width: "100%" }} />
      </div>
    </div>
  );
};

export default BlogPostGenerator;
