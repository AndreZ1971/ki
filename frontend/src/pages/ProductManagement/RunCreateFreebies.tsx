import React, { useState, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface Freebie {
  id: number;
  name: string;
  type: string;
  downloads: number;
  created: string;
  description?: string;
  fileUrl?: string;
}

interface AutoCreateResponse {
  success: boolean;
  data?: Freebie;
  message?: string;
  woocommerceId?: number;
  permalink?: string;
  timestamp?: string;
  error?: string;
}

const RunCreateFreebies = () => {
  const { handleBackToDashboard } = useProductManagement();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [recentFreebies, setRecentFreebies] = useState<Freebie[]>([]);
  const [lastCreated, setLastCreated] = useState<AutoCreateResponse | null>(null);

  // Lade existierende Freebies beim Start
  useEffect(() => {
    loadFreebies();
  }, []);

  const loadFreebies = async () => {
    try {
      const response = await fetch('/api/freebies');
      const data = await response.json();
      if (data.success && data.data) {
        setRecentFreebies(data.data.slice(0, 5)); // Nur die letzten 5
      }
    } catch (err) {
      console.error('Failed to load freebies:', err);
    }
  };

  const handleRunCreator = async () => {
    setLoading(true);
    setLastCreated(null);

    try {
      // Rufe Auto-Create Freebie Endpoint auf (rotierend durch Typen)
      const types = ['ebook', 'checklist', 'templates', 'guide'];
      const randomType = types[Math.floor(Math.random() * types.length)];

      const response = await fetch('/api/freebies/auto-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: randomType
        })
      });

      const data: AutoCreateResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fehler bei der Freebie-Erstellung');
      }

      setLastCreated(data);
      toast.success(`Freebie "${data.data?.name}" erfolgreich erstellt!`);
      
      // Lade Freebies neu
      await loadFreebies();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
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

        <LoadingButton
          onClick={handleRunCreator}
          loading={loading}
          loadingText="🔄 Erstelle Freebie mit AI..."
          className="large"
        >
          🚀 FREEBIE JETZT ERSTELLEN
        </LoadingButton>

        {lastCreated && lastCreated.success && (
          <div className="result-section">
            <h4>✅ Freebie erstellt!</h4>
            <p>{lastCreated.message}</p>
            <div className="result-details">
              <div><strong>Name:</strong> {lastCreated.data?.name}</div>
              <div><strong>Typ:</strong> {lastCreated.data?.type}</div>
              <div><strong>WooCommerce ID:</strong> {lastCreated.woocommerceId}</div>
              {lastCreated.permalink && (
                <div>
                  <a href={lastCreated.permalink} target="_blank" rel="noopener noreferrer">
                    � Im Shop ansehen
                  </a>
                </div>
              )}
              {lastCreated.timestamp && (
                <div className="timestamp">
                  🕐 {new Date(lastCreated.timestamp).toLocaleString('de-DE', {
                    dateStyle: 'short',
                    timeStyle: 'short'
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