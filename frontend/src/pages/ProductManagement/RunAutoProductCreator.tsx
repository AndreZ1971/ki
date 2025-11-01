import React from 'react';
import { useProductManagement, useProgress } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ProgressBar } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const RunAutoProductCreator = () => {
  const { handleBackToDashboard } = useProductManagement();
  const { progress, isRunning, startProgress } = useProgress(500);
  const toast = useToast();

  const handleRunCreator = () => {
    startProgress(() => {
      toast.success('Produkterstellung erfolgreich abgeschlossen!');
    });
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
          loading={isRunning}
          loadingText={`🔄 Läuft... ${progress}%`}
          className="large"
        >
          🚀 JETZT STARTEN
        </LoadingButton>

        {isRunning && (
          <ProgressBar 
            progress={progress}
            steps={['📝 Konzept', '🖼️ Bilder', '📋 Beschreibung', '🏷️ Kategorien', '✅ Fertig']}
          />
        )}
      </div>
    </div>
  );
};

export default RunAutoProductCreator;