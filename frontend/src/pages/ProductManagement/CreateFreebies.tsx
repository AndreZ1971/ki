import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { freebieApi } from '../../services/productApi';
import type { Freebie } from '../../types/product';
import './page.css';
import { MLFreebieGenerator } from './MLFreebieGenerator';

const CreateFreebies = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [freebieType, setFreebieType] = useState<Freebie['type']>('ebook');
  const [freebies, setFreebies] = useState<Freebie[]>([]);
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
          throw new Error(response.error || 'Freebies konnten nicht geladen werden');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Freebies';
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

  const handleCreateFreebie = async () => {
    try {
      setLoading(true);
      clearError();

      const response = await freebieApi.createFreebie({
        name: `${freebieType === 'ebook' ? 'Kostenloses Ebook' : 
               freebieType === 'checklist' ? 'Premium Checklist' : 
               'Social Media Templates'} #${freebies.length + 1}`,
        type: freebieType,
        downloads: 0,
        created: new Date().toISOString().split('T')[0]
      });

      if (response.success && response.data) {
        setFreebies([response.data, ...freebies]);
        toast.success('Gratis-Produkt erfolgreich erstellt!');
      } else {
        throw new Error(response.error || 'Fehler beim Erstellen');
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
        <h1>🎁 Freebies Creator</h1>
        <p>Erstelle automatisch Gratis-Produkte</p>
      </div>

      <div className="metric-card full-width">
        <h3>🆓 Gratis-Produkt erstellen</h3>
        
        <ErrorMessage message={error || ''} onClose={clearError} />
        
        <div className="freebie-options">
          <label className="option">
            <input 
              type="radio" 
              value="ebook" 
              checked={freebieType === 'ebook'}
              onChange={(e) => setFreebieType(e.target.value as Freebie['type'])}
            />
            <span>📚 Ebook/Guide</span>
          </label>
          <label className="option">
            <input 
              type="radio" 
              value="checklist" 
              checked={freebieType === 'checklist'}
              onChange={(e) => setFreebieType(e.target.value as Freebie['type'])}
            />
            <span>✅ Checkliste</span>
          </label>
          <label className="option">
            <input 
              type="radio" 
              value="templates" 
              checked={freebieType === 'templates'}
              onChange={(e) => setFreebieType(e.target.value as Freebie['type'])}
            />
            <span>🎨 Vorlagen</span>
          </label>
        </div>

        <LoadingButton
          onClick={handleCreateFreebie}
          loading={loading}
          loadingText="🔄 Erstelle..."
        >
          🎁 Gratis-Produkt erstellen
        </LoadingButton>
      </div>

      <div className="metric-card">
        <h3>📈 Freebie-Statistiken</h3>
        <div className="freebies-stats">
          <div className="stat">
            <span className="value">{freebies.length}</span>
            <span className="label">Aktive Freebies</span>
          </div>
          <div className="stat">
            <span className="value">{freebies.reduce((sum, f) => sum + f.downloads, 0)}</span>
            <span className="label">Downloads gesamt</span>
          </div>
          <div className="stat">
            <span className="value">{(freebies.reduce((sum, f) => sum + f.downloads, 0) / freebies.length).toFixed(1)}</span>
            <span className="label">Ø Downloads</span>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <h3>📋 Meine Freebies</h3>
        <div className="freebies-list">
          {freebies.map(freebie => (
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

      <div className="freebie-ml-section">
        <h3>KI-Freebie-Ideen</h3>
        {/* Beispielhafte Kategorie, kann dynamisch ersetzt werden */}
        <MLFreebieGenerator category={freebieType} />
      </div>
    </div>
  );
};

export default CreateFreebies;