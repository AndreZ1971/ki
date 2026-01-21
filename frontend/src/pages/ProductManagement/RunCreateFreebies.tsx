import React, { useState, useEffect } from "react";
import { formatDateTime } from "../../lib/i18n-utils";
import { useProductManagement } from "../../hooks/useProductManagement";
import { useToast } from "../../hooks/useToast";
import { BackButton, LoadingButton } from "../../components/shared";
import { ToastContainer } from "../../components/Toast/ToastContainer";
import { freebieApi } from "../../services/productApi";
import type { Freebie, FreebieIdea } from "../../types/product";
import "./page.css";
import "./CreateFreebies.css";

interface AutoCreateResponse {
  success: boolean;
  data?: Freebie;
  message?: string;
  woocommerceId?: number;
  permalink?: string;
  timestamp?: string;
  error?: string;
  idea?: FreebieIdea;
}

const RunCreateFreebies = () => {
  const { handleBackToDashboard } = useProductManagement();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [recentFreebies, setRecentFreebies] = useState<Freebie[]>([]);
  const [lastCreated, setLastCreated] = useState<AutoCreateResponse | null>(
    null
  );
  const [freebieType, setFreebieType] = useState<
    "ebook" | "checklist" | "templates"
  >("ebook");
  const [keywords, setKeywords] = useState("");
  const [ideas, setIdeas] = useState<FreebieIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<FreebieIdea | null>(null);
  const [autoPickBest, setAutoPickBest] = useState(true);

  const loadFreebies = async () => {
    try {
      const response = await fetch("/api/freebies");
      const data = await response.json();
      if (data.success && data.data) {
        setRecentFreebies(data.data.slice(0, 5)); // Nur die letzten 5
      }
    } catch {
      toast.error('Freebies konnten nicht geladen werden');
    }
  };

  // Lade existierende Freebies beim Start
  useEffect(() => {
    loadFreebies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateIdeas = async (): Promise<FreebieIdea[]> => {
    try {
      setIdeasLoading(true);
      const response = await freebieApi.generateIdeas(
        freebieType,
        keywords || undefined
      );

      if (response.success && response.data) {
        setIdeas(response.data);
        toast.success(`✅ ${response.data.length} KI-Ideen generiert`);
        if (autoPickBest && response.data.length > 0) {
          const best = response.data.reduce(
            (top, idea) =>
              idea.conversionScore > top.conversionScore ? idea : top,
            response.data[0]
          );
          setSelectedIdea(best);
        }
        return response.data;
      } else {
        throw new Error(
          response.error || "KI-Ideen konnten nicht geladen werden"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(errorMessage);
      return [];
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleCreateFromIdea = async (idea: FreebieIdea) => {
    try {
      setCreating(true);
      const response = await freebieApi.createFreebie({
        name: idea.title,
        type: freebieType,
        downloads: 0,
        created: new Date().toISOString().split("T")[0],
        description: idea.description,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Fehler bei der Freebie-Erstellung");
      }

      const payload: AutoCreateResponse = {
        success: true,
        data: response.data,
        idea,
        message: "Freebie mit KI-Idee erstellt",
      };

      setLastCreated(payload);
      toast.success(`Freebie "${response.data.name}" erfolgreich erstellt!`);
      await loadFreebies();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleRunCreator = async () => {
    setLastCreated(null);

    try {
      const generated =
        ideas.length === 0 ? await handleGenerateIdeas() : ideas;

      const sourceIdeas =
        generated.length > 0 ? generated : selectedIdea ? [selectedIdea] : [];
      if (sourceIdeas.length === 0) {
        throw new Error("Keine KI-Ideen verfügbar. Bitte erneut generieren.");
      }

      const best = autoPickBest
        ? sourceIdeas.reduce(
            (top, idea) =>
              idea.conversionScore > top.conversionScore ? idea : top,
            sourceIdeas[0]
          )
        : selectedIdea || sourceIdeas[0];

      await handleCreateFromIdea(best);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="analytics-page">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <BackButton onClick={handleBackToDashboard} />

      <div className="analytics-header">
        <h1>🚀 Run Freebies Creator</h1>
        <p>Starte Freebies-Erstellung sofort</p>
      </div>

      <div className="metric-card full-width">
        <h3>⚡ Sofort-Starter für Freebies</h3>
        <p>Erstellt automatisch ein Gratis-Produkt mit AI-Optimierung.</p>

        <div className="quick-info">
          <div className="info-item">
            <span className="label">📝 Typ:</span>
            <span className="value">AI-optimiertes Ebook</span>
          </div>
          <div className="info-item">
            <span className="label">⏱️ Dauer:</span>
            <span className="value">~30 Sekunden</span>
          </div>
          <div className="info-item">
            <span className="label">🎯 Ziel:</span>
            <span className="value">Lead-Generierung</span>
          </div>
        </div>

        <div className="freebie-type-selector" style={{ marginTop: "16px" }}>
          <label>
            <input
              type="radio"
              name="type"
              value="ebook"
              checked={freebieType === "ebook"}
              onChange={(e) =>
                setFreebieType(e.target.value as typeof freebieType)
              }
            />
            <span>📘 Ebook</span>
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="checklist"
              checked={freebieType === "checklist"}
              onChange={(e) =>
                setFreebieType(e.target.value as typeof freebieType)
              }
            />
            <span>📑 Checklist</span>
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="templates"
              checked={freebieType === "templates"}
              onChange={(e) =>
                setFreebieType(e.target.value as typeof freebieType)
              }
            />
            <span>🎨 Templates</span>
          </label>
        </div>

        <div className="metric-card" style={{ marginTop: "12px" }}>
          <div className="form-group">
            <label>🔍 Keywords / Zielgruppe (optional)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="z.B. E-Commerce, Conversion, B2B"
            />
          </div>

          <div
            className="form-group"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <input
              type="checkbox"
              id="autoPickBest"
              checked={autoPickBest}
              onChange={(e) => setAutoPickBest(e.target.checked)}
            />
            <label htmlFor="autoPickBest" style={{ margin: 0 }}>
              Beste Idee automatisch wählen
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              className="ai-generate-btn"
              onClick={handleGenerateIdeas}
              disabled={ideasLoading}
            >
              {ideasLoading
                ? "⏳ KI-Ideen werden generiert..."
                : "✨ KI-Ideen generieren"}
            </button>
            {selectedIdea && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#1e3c72",
                }}
              >
                Aktuell gewählt: <strong>{selectedIdea.title}</strong>
              </span>
            )}
          </div>
        </div>

        <LoadingButton
          onClick={handleRunCreator}
          loading={creating}
          loadingText="🔄 Erstelle Freebie mit KI-Idee..."
          className="large"
        >
          🚀 Freebie mit bester KI-Idee erstellen
        </LoadingButton>

        {ideas.length > 0 && (
          <div className="metric-card ideas-section">
            <h3>📋 KI-Ideen (nach Score sortiert)</h3>
            <div className="ideas-grid">
              {ideas
                .slice()
                .sort((a, b) => b.conversionScore - a.conversionScore)
                .map((idea, idx) => (
                  <div
                    key={`${idea.title}-${idx}`}
                    className={`idea-card ${selectedIdea?.title === idea.title ? "expanded" : ""}`}
                  >
                    <div className="idea-header">
                      <h4>{idea.title}</h4>
                      <span className="conversion-badge">
                        📊 {(idea.conversionScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="idea-description">{idea.description}</p>
                    <div className="idea-reason">
                      <small>💡 {idea.reason}</small>
                    </div>
                    <div className="idea-actions">
                      <button
                        className="expand-btn"
                        onClick={() => setSelectedIdea(idea)}
                      >
                        {selectedIdea?.title === idea.title
                          ? "Gewählt"
                          : "Wählen"}
                      </button>
                      <button
                        className="create-idea-btn"
                        onClick={() => handleCreateFromIdea(idea)}
                        disabled={creating}
                      >
                        {creating ? "⏳" : "→"} Erstellen
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {lastCreated && lastCreated.success && (
          <div className="result-section">
            <h4>✅ Freebie erstellt!</h4>
            <p>{lastCreated.message}</p>
            <div className="result-details">
              <div>
                <strong>Name:</strong> {lastCreated.data?.name}
              </div>
              <div>
                <strong>Typ:</strong> {lastCreated.data?.type}
              </div>
              <div>
                <strong>WooCommerce ID:</strong> {lastCreated.woocommerceId}
              </div>
              {lastCreated.idea && (
                <>
                  <div>
                    <strong>KI-Idee:</strong> {lastCreated.idea.title}
                  </div>
                  <div>
                    <strong>Score:</strong>{" "}
                    {(lastCreated.idea.conversionScore * 100).toFixed(0)}%
                  </div>
                  <div>
                    <strong>Grund:</strong> {lastCreated.idea.reason}
                  </div>
                </>
              )}
              {lastCreated.permalink && (
                <div>
                  <a
                    href={lastCreated.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    � Im Shop ansehen
                  </a>
                </div>
              )}
              {lastCreated.timestamp && (
                <div className="timestamp">
                  🕐{" "}
                  {formatDateTime(new Date(lastCreated.timestamp), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="metric-card">
        <h3>📅 Zuletzt erstellte Freebies</h3>
        {recentFreebies.length === 0 ? (
          <p>Noch keine Freebies erstellt.</p>
        ) : (
          <div className="recent-list">
            {recentFreebies.map((freebie) => (
              <div key={freebie.id} className="recent-item">
                <span className="freebie-name">{freebie.name}</span>
                <span className="freebie-type">{freebie.type}</span>
                <span className="status">✅ {freebie.downloads} Downloads</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunCreateFreebies;
