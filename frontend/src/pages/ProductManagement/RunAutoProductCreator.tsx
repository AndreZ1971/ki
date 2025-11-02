import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface ProductCreationResult {
  success: boolean;
  message: string;
  productsCreated?: number;
  estimatedTime?: string;
  errors?: string[];
  timestamp?: string;
  products?: any[];
}

const RunAutoProductCreator = () => {
  const { handleBackToDashboard } = useProductManagement();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductCreationResult | null>(null);

  const handleRunCreator = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Standard-Konfiguration: 5 Produkte, alle Kategorien, simple type, high optimization
      const response = await fetch('/api/products/auto-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 5,
          category: 'all',
          productType: 'simple',
          optimization: 'high'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fehler bei der Produkterstellung');
      }

      // Backend gibt {success, data: {success, message, ...}} zurück
      const resultData = data.data || data;
      setResult(resultData);
      toast.success(resultData.message || 'Produkte erfolgreich erstellt!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setResult({
        success: false,
        message: errorMessage
      });
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
        <h1>🚀 Run Product Creator</h1>
        <p>Starte automatische Produkterstellung sofort</p>
      </div>

      <div className="metric-card full-width">
        <h3>⚡ Sofort-Starter</h3>
        <p>Startet die Produkterstellung mit Standard-Einstellungen sofort.</p>
        
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="label">Standard-Konfiguration:</span>
            <span className="value">5 Produkte, Alle Kategorien</span>
          </div>
          <div className="quick-stat">
            <span className="label">Geschätzte Zeit:</span>
            <span className="value">2-3 Minuten</span>
          </div>
        </div>

        <LoadingButton
          onClick={handleRunCreator}
          loading={loading}
          loadingText="🔄 Erstelle 5 Produkte mit AI..."
          className="large"
        >
          🚀 JETZT STARTEN
        </LoadingButton>

        {result && (
          <div className="result-section">
            <h4>{result.success ? '✅ Erstellung abgeschlossen' : '❌ Fehler'}</h4>
            <p>{result.message}</p>
            {result.success && (
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
            )}
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

export default RunAutoProductCreator;