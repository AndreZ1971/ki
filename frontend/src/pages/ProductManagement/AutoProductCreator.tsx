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
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
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
        <h1>{t("product.autoCreator.title")}</h1>
        <p>{t("product.autoCreator.title")}</p>
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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
