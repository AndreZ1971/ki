import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProductManagement } from "../../hooks/useProductManagement";
import { useToast } from "../../hooks/useToast";
import { BackButton, ErrorMessage } from "../../components/shared";
import { ToastContainer } from "../../components/Toast/ToastContainer";
import { freebieApi } from "../../services/productApi";
import type { Freebie, FreebieIdea } from "../../types/product";
import "./page.css";
import "./CreateFreebies.css";

const CreateFreebies = () => {
  const { t } = useTranslation();
  const {
    handleBackToDashboard,
    loading,
    setLoading,
    error,
    setError,
    clearError,
  } = useProductManagement();
  const toast = useToast();
  const [freebieType, setFreebieType] = useState<Freebie["type"]>("ebook");
  const [freebies, setFreebies] = useState<Freebie[]>([]);
  const [ideas, setIdeas] = useState<Record<string, FreebieIdea[]>>({});
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<FreebieIdea | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<number>>(new Set());
  const [_initialLoading, setInitialLoading] = useState(true);

  // Load freebies on mount
  React.useEffect(() => {
    const loadFreebies = async () => {
      try {
        setInitialLoading(true);
        const response = await freebieApi.getFreebies();

        if (response.success && response.data) {
          setFreebies(response.data);
          toast.success(`${response.data.length} Freebies geladen`);
        } else {
          throw new Error(
            response.error || "Freebies konnten nicht geladen werden"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Fehler beim Laden der Freebies";
        setError(errorMessage);
        toast.error(errorMessage);
        setFreebies([]);
      } finally {
        setInitialLoading(false);
      }
    };

    loadFreebies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateIdeas = async () => {
    try {
      setIdeasLoading(true);
      const response = await freebieApi.generateIdeas(freebieType);

      if (response.success && response.data) {
        setIdeas((prev) => ({ ...prev, [freebieType]: response.data || [] }));
        toast.success(`✅ ${response.data.length} Freebie-Ideen generiert!`);
      } else {
        throw new Error(response.error || "Generierung fehlgeschlagen");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(msg);
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleCreateFromIdea = (idea: FreebieIdea) => {
    setSelectedIdea(idea);
    setShowCreateModal(true);
  };

  const handleCreateFromSelectedIdea = async () => {
    if (!selectedIdea) return;
    try {
      setLoading(true);
      const response = await freebieApi.createFreebie({
        name: selectedIdea.title,
        type: freebieType,
        downloads: 0,
        created: new Date().toISOString().split("T")[0],
        description: selectedIdea.description,
      });

      if (response.success && response.data) {
        setFreebies([response.data, ...freebies]);
        toast.success(`✅ "${selectedIdea.title}" erstellt!`);
        setShowCreateModal(false);
        setSelectedIdea(null);
      } else {
        throw new Error(response.error || "Fehler beim Erstellen");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-page">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <BackButton onClick={handleBackToDashboard} />

      <div className="analytics-header">
        <h1>{t("product.createFreebies.title")}</h1>
        <p>{t("product.createFreebies.title")}</p>
      </div>

      <div className="metric-card full-width">
        <h3>🆓 Gratis-Produkt erstellen</h3>

        <ErrorMessage message={error || ""} onClose={clearError} />

        <div className="freebie-options">
          <label className="option">
            <input
              type="radio"
              value="ebook"
              checked={freebieType === "ebook"}
              onChange={(e) =>
                setFreebieType(e.target.value as Freebie["type"])
              }
            />
            <span>📚 Ebook/Guide</span>
          </label>
          <label className="option">
            <input
              type="radio"
              value="checklist"
              checked={freebieType === "checklist"}
              onChange={(e) =>
                setFreebieType(e.target.value as Freebie["type"])
              }
            />
            <span>✅ Checkliste</span>
          </label>
          <label className="option">
            <input
              type="radio"
              value="templates"
              checked={freebieType === "templates"}
              onChange={(e) =>
                setFreebieType(e.target.value as Freebie["type"])
              }
            />
            <span>🎨 Vorlagen</span>
          </label>
        </div>

        <button
          onClick={handleGenerateIdeas}
          disabled={ideasLoading}
          className="ai-generate-btn"
        >
          {ideasLoading
            ? t("product.createFreebies.creating")
            : t("product.createFreebies.generate")}
        </button>
      </div>

      <div className="metric-card">
        <h3>📈 Freebie-Statistiken</h3>
        <div className="freebies-stats">
          <div className="stat">
            <span className="value">{freebies.length}</span>
            <span className="label">Aktive Freebies</span>
          </div>
          <div className="stat">
            <span className="value">
              {freebies.reduce((sum, f) => sum + f.downloads, 0)}
            </span>
            <span className="label">Downloads gesamt</span>
          </div>
          <div className="stat">
            <span className="value">
              {(
                freebies.reduce((sum, f) => sum + f.downloads, 0) /
                freebies.length
              ).toFixed(1)}
            </span>
            <span className="label">Ø Downloads</span>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <h3>📋 Meine Freebies</h3>
        <div className="freebies-list">
          {freebies.map((freebie) => (
            <div key={freebie.id} className="freebie-item">
              <div className="freebie-info">
                <span className="freebie-name">{freebie.name}</span>
                <span className="freebie-type">{freebie.type}</span>
              </div>
              <div className="freebie-stats">
                <span className="downloads">⬇️ {freebie.downloads}</span>
                <span className="date">{freebie.created}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {ideas[freebieType] && ideas[freebieType].length > 0 && (
        <div className="metric-card ideas-section">
          <h3>📋 Generierte Ideen</h3>
          <div className="ideas-grid">
            {ideas[freebieType].map((idea, idx) => (
              <div
                key={idx}
                className={`idea-card ${expandedIdeas.has(idx) ? "expanded" : ""}`}
              >
                <div className="idea-header">
                  <h4>{idea.title}</h4>
                  <div className="idea-score">
                    <span className="conversion-badge">
                      📊 {(idea.conversionScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <p className="idea-description">{idea.description}</p>

                <div className="idea-reason">
                  <small>💡 {idea.reason}</small>
                </div>

                <div className="idea-actions">
                  <button
                    onClick={() =>
                      setExpandedIdeas(
                        (prev) =>
                          new Set(
                            prev.has(idx)
                              ? [...prev].filter((i) => i !== idx)
                              : [...prev, idx]
                          )
                      )
                    }
                    className="expand-btn"
                  >
                    {expandedIdeas.has(idx) ? "−" : "+"}
                  </button>
                  <button
                    onClick={() => handleCreateFromIdea(idea)}
                    disabled={loading}
                    className="create-idea-btn"
                  >
                    {loading ? "⏳" : "→"} Erstellen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && selectedIdea && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Freebie aus Idee erstellen</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Titel:</label>
                <input
                  type="text"
                  value={selectedIdea.title}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>Beschreibung:</label>
                <textarea
                  value={selectedIdea.description}
                  disabled
                  className="disabled-input"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Konversionsrate:</label>
                <div className="conversion-display">
                  {(selectedIdea.conversionScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="cancel-btn"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateFromSelectedIdea}
                disabled={loading}
                className="confirm-btn"
              >
                {loading ? "⏳ Wird erstellt..." : "✓ Jetzt erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateFreebies;
