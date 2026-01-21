import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../../lib/i18n-utils";
import { useProductManagement } from "../../hooks/useProductManagement";
import { useToast } from "../../hooks/useToast";
import {
  BackButton,
  LoadingButton,
  ErrorMessage,
} from "../../components/shared";
import { ToastContainer } from "../../components/Toast/ToastContainer";
import { productApi, categoryApi } from "../../services/productApi";
import type { ProductCreationResult, Category } from "../../types/product";
import { MLProductIdeaGenerator } from "./MLProductIdeaGenerator";
import "./page.css";

const AutoProductCreator = () => {
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
  const [result, setResult] = useState<ProductCreationResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStatus, setCategoryStatus] = useState<'idle' | 'loading' | 'ok' | 'failed'>('idle');
  const [config, setConfig] = useState({
    count: 5,
    category: "all",
    productType: "simple" as "simple" | "virtual" | "downloadable",
    optimization: "high" as "low" | "medium" | "high",
    seoOptimized: true,
    keywords: "",
    mlMarketAnalysis: true,
    specializationPrompt: "",
  });

  // Lade WooCommerce Kategorien
   
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setCategoryStatus('loading');
      try {
        const response = await categoryApi.getCategories();
        if (!isMounted) return;
        
        if (response.success && response.data) {
          setCategories(response.data);
          setCategoryStatus('ok');
        }
        if (!response.success) {
          setCategoryStatus('failed');
          toast.warning('Kategorien konnten nicht geladen werden. Bitte Kategorie manuell wählen.');
        }
      } catch (_err) {
        if (!isMounted) return;
        setCategoryStatus('failed');
        toast.warning('Kategorien konnten nicht geladen werden. Bitte Kategorie manuell wählen.');
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast should not trigger reload
  }, []);

  const handleCreateProducts = async () => {
    try {
      setLoading(true);
      clearError();
      setResult(null);

      const response = await productApi.createAutoProducts(config);

      if (response.success && response.data) {
        setResult(response.data);
        toast.success(
          `${response.data.productsCreated} Produkte erfolgreich erstellt!`
        );
      } else {
        throw new Error(response.error || "Fehler bei der Produkterstellung");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-page">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <BackButton onClick={handleBackToDashboard} />

      <div className="analytics-header">
        <h1>Auto Product Creator</h1>
        <p>Automatische Erstellung und Optimierung von Produkten</p>
      </div>

      <div className="metric-card full-width">
        <h3>📋 Produkt-Erstellung Konfiguration</h3>
        <ErrorMessage message={error || ""} onClose={clearError} />
        <div className="config-section">
          <div className="config-item">
            <label>Anzahl der Produkte:</label>
            <select
              value={config.count}
              onChange={(e) =>
                setConfig({ ...config, count: Number(e.target.value) })
              }
            >
              <option value="3">3 Produkte</option>
              <option value="5">5 Produkte</option>
              <option value="10">10 Produkte</option>
            </select>
          </div>
          <div className="config-item">
            <label>Kategorie:</label>
            <select
              value={config.category}
              onChange={(e) =>
                setConfig({ ...config, category: e.target.value })
              }
            >
              <option value="all">Alle Kategorien</option>
              {categoryStatus === 'loading' && (
                <option value="loading" disabled>
                  Lädt Kategorien...
                </option>
              )}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categoryStatus === 'failed' && (
              <div className="config-hint" style={{ color: '#fca5a5' }}>
                Kategorien konnten nicht geladen werden. Bitte eine passende Kategorie manuell wählen.
              </div>
            )}
          </div>
          <div className="config-item">
            <label>Produkttyp:</label>
            <select
              value={config.productType}
              onChange={(e) =>
                setConfig({
                  ...config,
                  productType: e.target.value as
                    | "simple"
                    | "virtual"
                    | "downloadable",
                })
              }
            >
              <option value="simple">Simple (Physisch)</option>
              <option value="virtual">Virtual (Kein Versand)</option>
              <option value="downloadable">Downloadable (Digital)</option>
            </select>
          </div>
          <div className="config-item">
            <label>AI-Optimierung:</label>
            <select
              value={config.optimization}
              onChange={(e) =>
                setConfig({ ...config, optimization: e.target.value as any })
              }
            >
              <option value="low">Einfache Optimierung</option>
              <option value="medium">Mittlere Optimierung</option>
              <option value="high">Hohe Optimierung</option>
            </select>
          </div>
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.seoOptimized}
                onChange={(e) =>
                  setConfig({ ...config, seoOptimized: e.target.checked })
                }
              />
              SEO-optimierte Produktbeschreibung
            </label>
          </div>
          <div className="config-item">
            <label>Schlagwörter (Komma getrennt):</label>
            <input
              type="text"
              value={config.keywords}
              onChange={(e) =>
                setConfig({ ...config, keywords: e.target.value })
              }
              placeholder="z.B. digital, modern, trendy"
            />
          </div>
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.mlMarketAnalysis}
                onChange={(e) =>
                  setConfig({ ...config, mlMarketAnalysis: e.target.checked })
                }
              />
              Nur relevante Produkte für meinen Shop (ML/KI-Marktanalyse)
            </label>
            <div className="config-hint">
              Die Produktauswahl basiert auf Shop-Daten und aktuellen Trends.
            </div>
          </div>
          <div className="config-item">
            <label>Beschreibung (optional):</label>
            <textarea
              value={config.specializationPrompt}
              onChange={(e) =>
                setConfig({ ...config, specializationPrompt: e.target.value })
              }
              placeholder="Beschreibe hier besondere Anforderungen, Zielgruppe oder Stilwünsche..."
              rows={2}
            />
          </div>
        </div>

        <div className="config-section" style={{ marginTop: "10px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: "8px" }}>
          <div style={{ fontWeight: 700 }}>🔎 Daten-Transparenz</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
            <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>Kategorien (Woo)</div>
              <div style={{ fontWeight: 700 }}>
                {categoryStatus === 'ok' && '✅ Geladen'}
                {categoryStatus === 'loading' && '⏳ Lädt...'}
                {categoryStatus === 'failed' && '⚠️ Nicht verfügbar'}
                {categoryStatus === 'idle' && 'ℹ️ Noch nicht geladen'}
              </div>
            </div>
            <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>ML-Marktanalyse</div>
              <div style={{ fontWeight: 700 }}>{config.mlMarketAnalysis ? '🧠 Aktiv' : '⚪ Aus'}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>SEO/Content</div>
              <div style={{ fontWeight: 700 }}>{config.seoOptimized ? '✨ Aktiv' : '⚪ Aus'}</div>
            </div>
          </div>
          {categoryStatus === 'failed' && (
            <div style={{ fontSize: "12px", color: "#fca5a5" }}>
              Kategorien fehlen → Tool nutzt Standard-Prompts ohne Kategorie-Spezialisierung.
            </div>
          )}
        </div>

        {/* ML/AI Produktideen-Generator */}
        <MLProductIdeaGenerator
          count={config.count}
          category={config.category}
        />

        <LoadingButton
          onClick={handleCreateProducts}
          loading={loading}
          loadingText={t("product.autoCreator.creating")}
        >
          🚀 {t("product.autoCreator.create")}
        </LoadingButton>

        {result && (
          <div className="result-section">
            <h4>✅ Erstellung abgeschlossen</h4>
            <p>{result.message}</p>
            <div className="result-details">
              <span>📦 {result.productsCreated} Produkte</span>
              <span>⏱️ {result.estimatedTime}</span>
              {result.timestamp && (
                <span>
                  🕐{" "}
                  {formatDateTime(new Date(result.timestamp), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              )}
            </div>
            {result.products && result.products.length > 0 && (
              <div className="created-products">
                <h5>Erstellte Produkte:</h5>
                <ul>
                  {result.products.map((product: any) => (
                    <li key={product.id}>
                      <a
                        href={product.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {product.name} - {product.price}€
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="creation-errors">
                <h5>⚠️ Fehler:</h5>
                <ul>
                  {result.errors.map((error: string, idx: number) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoProductCreator;
