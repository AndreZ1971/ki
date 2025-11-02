import React, { useState, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { productApi, categoryApi } from '../../services/productApi';
import type { ProductCreationResult, Category } from '../../types/product';
import './page.css';

const AutoProductCreator = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [result, setResult] = useState<ProductCreationResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState({
    count: 5,
    category: 'all',
    productType: 'simple' as 'simple' | 'virtual' | 'downloadable',
    optimization: 'high' as 'low' | 'medium' | 'high'
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
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProducts = async () => {
    try {
      setLoading(true);
      clearError();
      setResult(null);

      const response = await productApi.createAutoProducts(config);

      if (response.success && response.data) {
        setResult(response.data);
        toast.success(`${response.data.productsCreated} Produkte erfolgreich erstellt!`);
      } else {
        throw new Error(response.error || 'Fehler bei der Produkterstellung');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
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
        <h1>🤖 Auto Product Creator</h1>
        <p>Automatische Erstellung und Optimierung von Produkten</p>
      </div>

      <div className="metric-card full-width">
        <h3>📋 Produkt-Erstellung Konfiguration</h3>
        
        <ErrorMessage message={error || ''} onClose={clearError} />

        <div className="config-section">
          <div className="config-item">
            <label>Anzahl der Produkte:</label>
            <select 
              value={config.count} 
              onChange={(e) => setConfig({...config, count: Number(e.target.value)})}
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
              onChange={(e) => setConfig({...config, category: e.target.value})}
            >
              <option value="all">Alle Kategorien</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="config-item">
            <label>Produkttyp:</label>
            <select 
              value={config.productType}
              onChange={(e) => setConfig({...config, productType: e.target.value as 'simple' | 'virtual' | 'downloadable'})}
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
              onChange={(e) => setConfig({...config, optimization: e.target.value as any})}
            >
              <option value="low">Einfache Optimierung</option>
              <option value="medium">Mittlere Optimierung</option>
              <option value="high">Hohe Optimierung</option>
            </select>
          </div>
        </div>

        <LoadingButton
          onClick={handleCreateProducts}
          loading={loading}
          loadingText="🔄 Erstelle Produkte..."
        >
          🚀 Produkte automatisch erstellen
        </LoadingButton>

        {result && (
          <div className="result-section">
            <h4>✅ Erstellung abgeschlossen</h4>
            <p>{result.message}</p>
            <div className="result-details">
              <span>📦 {result.productsCreated} Produkte</span>
              <span>⏱️ {result.estimatedTime}</span>
              {result.timestamp && (
                <span>🕐 {new Date(result.timestamp).toLocaleString('de-DE', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}</span>
              )}
            </div>
            {result.products && result.products.length > 0 && (
              <div className="created-products">
                <h5>Erstellte Produkte:</h5>
                <ul>
                  {result.products.map((product: any) => (
                    <li key={product.id}>
                      <a href={product.permalink} target="_blank" rel="noopener noreferrer">
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