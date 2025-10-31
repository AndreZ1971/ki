import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { productApi } from '../../services/productApi';
import type { ProductCreationResult } from '../../types/product';
import './page.css';

const AutoProductCreator = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [result, setResult] = useState<ProductCreationResult | null>(null);
  const [config, setConfig] = useState({
    count: 5,
    category: 'all',
    optimization: 'high' as 'low' | 'medium' | 'high'
  });

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
              <option value="digital">Digitale Produkte</option>
              <option value="physical">Physische Produkte</option>
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
            <h4>✅ Erstellung gestartet</h4>
            <p>{result.message}</p>
            <div className="result-details">
              <span>📦 {result.productsCreated} Produkte</span>
              <span>⏱️ {result.estimatedTime}</span>
            </div>
          </div>
        )}
      </div>

      <div className="metric-card">
        <h3>📊 Letzte Erstellungen</h3>
        <div className="history-list">
          <div className="history-item">
            <span className="date">Heute, 14:30</span>
            <span className="products">5 Produkte erstellt</span>
            <span className="status success">✅ Abgeschlossen</span>
          </div>
          <div className="history-item">
            <span className="date">Gestern, 09:15</span>
            <span className="products">3 Produkte erstellt</span>
            <span className="status success">✅ Abgeschlossen</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoProductCreator;