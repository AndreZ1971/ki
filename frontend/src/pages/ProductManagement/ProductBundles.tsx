import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { bundleApi } from '../../services/productApi';
import type { Bundle } from '../../types/product';
import './page.css';

const ProductBundles = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

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

  const handleCreateBundle = async () => {
    try {
      setLoading(true);
      clearError();

      const newBundleData: Partial<Bundle> = {
        name: `Premium Bundle #${bundles.length + 1}`,
        products: ['Product A', 'Product B', 'Bonus'],
        price: 99.99,
        discount: 15,
        active: true
      };

      const response = await bundleApi.createBundle(newBundleData);

      if (response.success && response.data) {
        setBundles([...bundles, response.data]);
        toast.success('Produkt-Bundle erfolgreich erstellt!');
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
        <h3>🎁 Bundle erstellen</h3>
        
        <ErrorMessage message={error || ''} onClose={clearError} />
        
        <div className="bundle-config">
          <div className="config-group">
            <label>Bundle-Name:</label>
            <input type="text" placeholder="z.B. Complete Marketing Bundle" />
          </div>
          <div className="config-group">
            <label>Rabatt (%):</label>
            <input type="number" defaultValue="15" min="5" max="50" />
          </div>
          <div className="config-group">
            <label>Enthaltene Produkte:</label>
            <select multiple>
              <option value="theme">Premium Theme</option>
              <option value="plugin">SEO Plugin</option>
              <option value="ebook">Marketing Ebook</option>
              <option value="template">Email Templates</option>
            </select>
          </div>
        </div>

        <LoadingButton
          onClick={handleCreateBundle}
          loading={loading}
          loadingText="🔄 Erstelle Bundle..."
        >
          📦 Bundle erstellen
        </LoadingButton>
      </div>

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
    </div>
  );
};

export default ProductBundles;