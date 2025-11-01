import React, { useState } from 'react';
import { useProductManagement, useProgress } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ProgressBar } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const RunCreateFreebies = () => {
  const { handleBackToDashboard } = useProductManagement();
  const { progress, isRunning, startProgress } = useProgress(600);
  const toast = useToast();
  const [recentFreebies, setRecentFreebies] = useState([
    'SEO Master Guide',
    'Social Media Calendar',
    'Email Marketing Templates'
  ]);

  const handleRunCreator = () => {
    startProgress(() => {
      const newFreebie = `Freebie #${recentFreebies.length + 1}`;
      setRecentFreebies([newFreebie, ...recentFreebies]);
      toast.success('Freebie erfolgreich erstellt!');
    });
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
          loading={isRunning}
          loadingText={`🔄 Erstelle Freebie... ${progress}%`}
          className="large"
        >
          🚀 FREEBIE JETZT ERSTELLEN
        </LoadingButton>

        {isRunning && (
          <ProgressBar 
            progress={progress}
            steps={['💡 Konzept', '📝 Inhalt', '🎨 Design', '🏷️ Kategorisieren', '✅ Veröffentlichen']}
          />
        )}
      </div>

      <div className="metric-card">
        <h3>📅 Zuletzt erstellte Freebies</h3>
        <div className="recent-list">
          {recentFreebies.map((freebie, index) => (
            <div key={index} className="recent-item">
              <span className="freebie-name">{freebie}</span>
              <span className="status">✅ Fertig</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunCreateFreebies;