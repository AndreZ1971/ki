import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { bundleApi } from '../../services/productApi';
import type { Bundle, BundleIdea } from '../../types/product';
import './page.css';
import './CreateFreebies.css';
import './ProductBundles.css';
import ProductAIAnalysis from './ProductAIAnalysis';

const ProductBundles = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [_initialLoading, setInitialLoading] = useState(true);
  
  // ML State
  const [bundleIdeas, setBundleIdeas] = useState<BundleIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [_selectedIdea, setSelectedIdea] = useState<BundleIdea | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: '50-200',
    targetAudience: 'B2B & Selbstständige'
  });

  // Load bundles on mount
  React.useEffect(() => {
    const loadBundles = async () => {
      try {
        setInitialLoading(true);
        const response = await bundleApi.getBundles();
        
        if (response.success && response.data) {
          setBundles(response.data);
          toast.success(`${response.data.length} Bundles geladen`);
        } else {
          throw new Error(response.error || 'Bundles konnten nicht geladen werden');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Bundles';
        setError(errorMessage);
        toast.error(errorMessage);
        setBundles([]);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadBundles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateBundleIdeas = async () => {
    try {
      setIdeasLoading(true);
      const response = await bundleApi.generateBundleIdeas(filters);

      if (response.success && response.data) {
        setBundleIdeas(response.data);
        toast.success(`✅ ${response.data.length} Bundle-Ideen generiert`);
      } else {
        throw new Error(response.error || 'Bundle-Ideen konnten nicht generiert werden');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(errorMessage);
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleCreateFromIdea = async (idea: BundleIdea) => {
    try {
      setLoading(true);
      clearError();

      const newBundleData: Partial<Bundle> = {
        name: idea.name,
        products: idea.products,
        price: idea.suggestedPrice,
        discount: idea.suggestedDiscount,
        active: true,
        description: `${idea.reason} | Zielgruppe: ${idea.targetAudience}`
      };

      const response = await bundleApi.createBundle(newBundleData);

      if (response.success && response.data) {
        setBundles([response.data, ...bundles]);
        toast.success(`Bundle "${idea.name}" erfolgreich erstellt!`);
        setSelectedIdea(null);
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

  const calculateSavings = (bundle: any) => {
    return (bundle.price * bundle.discount / 100).toFixed(2);
  };

  return (
    <div className="analytics-page">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <BackButton onClick={handleBackToDashboard} />

      <div className="analytics-header">
        <h1>📦 Product Bundles</h1>
        <p>Erstelle und verwalte Produkt-Bundles automatisch</p>
      </div>

      <div className="metric-card full-width">
        <h3>🤖 KI-gestützte Bundle-Erstellung</h3>
        
        <ErrorMessage message={error || ''} onClose={clearError} />
        
        <div className="bundle-config">
          <div className="config-group">
            <label>Kategorie:</label>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="all">Alle Kategorien</option>
              <option value="digital">Digitale Produkte</option>
              <option value="marketing">Marketing</option>
              <option value="design">Design & Templates</option>
              <option value="education">Kurse & Schulungen</option>
            </select>
          </div>
          <div className="config-group">
            <label>Preisspanne (€):</label>
            <select value={filters.priceRange} onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}>
              <option value="25-75">25-75€</option>
              <option value="50-200">50-200€</option>
              <option value="100-300">100-300€</option>
              <option value="200-500">200-500€</option>
            </select>
          </div>
          <div className="config-group">
            <label>Zielgruppe:</label>
            <input 
              type="text" 
              value={filters.targetAudience}
              onChange={(e) => setFilters({ ...filters, targetAudience: e.target.value })}
              placeholder="z.B. B2B, Freelancer, Startups"
            />
          </div>
        </div>

        <LoadingButton
          onClick={handleGenerateBundleIdeas}
          loading={ideasLoading}
          loadingText="🔄 KI generiert Bundle-Ideen..."
        >
          ✨ Bundle-Ideen mit KI generieren
        </LoadingButton>
      </div>

      {bundleIdeas.length > 0 && (
        <div className="metric-card ideas-section">
          <h3>📋 KI-generierte Bundle-Vorschläge</h3>
          <div className="ideas-grid">
            {bundleIdeas
              .sort((a, b) => b.conversionScore - a.conversionScore)
              .map((idea, idx) => (
                <div
                  key={`${idea.name}-${idx}`}
                  className={`idea-card ${expandedIdeas.has(idx) ? 'expanded' : ''}`}
                >
                  <div className="idea-header">
                    <h4>{idea.name}</h4>
                    <span className="conversion-badge">
                      📊 {(idea.conversionScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="bundle-idea-details">
                    <div className="products-list">
                      <strong>Enthält:</strong>
                      <ul>
                        {idea.products.map((prod, i) => (
                          <li key={i}>{prod}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pricing-info">
                      <div className="price-row">
                        <span className="original-price">Regulär: €{idea.originalPrice.toFixed(2)}</span>
                        <span className="discount-badge">-{idea.suggestedDiscount}%</span>
                      </div>
                      <div className="bundle-price">Bundle-Preis: €{idea.suggestedPrice.toFixed(2)}</div>
                      <div className="savings">💰 Ersparnis: €{(idea.originalPrice - idea.suggestedPrice).toFixed(2)}</div>
                    </div>

                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="metric-label">🎯 Zielgruppe:</span>
                        <span className="metric-value">{idea.targetAudience}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">💵 Erwarteter Umsatz/Monat:</span>
                        <span className="metric-value">€{idea.expectedRevenue.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="idea-reason">
                      <small>💡 {idea.reason}</small>
                    </div>
                  </div>

                  <div className="idea-actions">
                    <button
                      className="expand-btn"
                      onClick={() => {
                        const newExpanded = new Set(expandedIdeas);
                        if (newExpanded.has(idx)) {
                          newExpanded.delete(idx);
                        } else {
                          newExpanded.add(idx);
                        }
                        setExpandedIdeas(newExpanded);
                        setSelectedIdea(idea);
                      }}
                    >
                      {expandedIdeas.has(idx) ? '−' : '+'} Details
                    </button>
                    <button
                      className="create-idea-btn"
                      onClick={() => handleCreateFromIdea(idea)}
                      disabled={loading}
                    >
                      {loading ? '⏳' : '→'} Bundle erstellen
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="metric-card">
        <h3>📊 Meine Bundles</h3>
        <div className="bundles-list">
          {bundles.map(bundle => (
            <div key={bundle.id} className={`bundle-item ${bundle.active ? 'active' : 'inactive'}`}>
              <div className="bundle-header">
                <span className="bundle-name">{bundle.name}</span>
                <span className={`status ${bundle.active ? 'active' : 'inactive'}`}>
                  {bundle.active ? '✅ Aktiv' : '⏸️ Inaktiv'}
                </span>
              </div>
              
              <div className="bundle-products">
                <strong>Enthalten:</strong>
                {bundle.products.join(', ')}
              </div>
              
              <div className="bundle-pricing">
                <span className="price">€{bundle.price}</span>
                <span className="discount">-{bundle.discount}%</span>
                <span className="savings">💵 Spare €{calculateSavings(bundle)}</span>
              </div>
              
              <div className="bundle-actions">
                <button className="edit-button">✏️ Bearbeiten</button>
                <button className="toggle-button">
                  {bundle.active ? '⏸️ Deaktivieren' : '▶️ Aktivieren'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="metric-card">
        <h3>📈 Bundle-Performance</h3>
        <div className="performance-stats">
          <div className="stat">
            <span className="value">{bundles.length}</span>
            <span className="label">Aktive Bundles</span>
          </div>
          <div className="stat">
            <span className="value">{bundles.filter(b => b.active).length}</span>
            <span className="label">Aktiv</span>
          </div>
          <div className="stat">
            <span className="value">{(bundles.reduce((sum, b) => sum + b.discount, 0) / bundles.length).toFixed(0)}%</span>
            <span className="label">Ø Rabatt</span>
          </div>
        </div>
      </div>

      <h2>KI-Produktanalyse</h2>
      <ProductAIAnalysis />
    </div>
  );
};

export default ProductBundles;