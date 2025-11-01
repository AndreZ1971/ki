import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { productApi } from '../../services/productApi';
import type { UpdateType } from '../../types/product';
import './page.css';

interface ProductItem {
  id: number;
  name: string;
  price: number;
  updated: boolean;
}

const WooProductUpdate = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [updateType, setUpdateType] = useState<UpdateType>('prices');
  const [products, setProducts] = useState<ProductItem[]>([
    { id: 1, name: 'Premium Theme', price: 49.99, updated: true },
    { id: 2, name: 'Business Plugin', price: 29.99, updated: false },
    { id: 3, name: 'SEO Template', price: 19.99, updated: true }
  ]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      clearError();

      const response = await productApi.updateWooProducts({
        type: updateType,
        productIds: products.map(p => p.id)
      });

      if (response.success) {
        setProducts(products.map(p => ({ ...p, updated: true })));
        toast.success('Produkt-Updates erfolgreich durchgeführt!');
      } else {
        throw new Error(response.error || 'Update fehlgeschlagen');
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
        <h1>✏️ Woo Product Updater</h1>
        <p>Automatische Produkt-Updates und Synchronisation</p>
      </div>

      <div className="metric-card full-width">
        <h3>🔄 Update-Typ auswählen</h3>
        
        <ErrorMessage message={error || ''} onClose={clearError} />
        <div className="update-options">
          <label className="option">
            <input 
              type="radio" 
              value="prices" 
              checked={updateType === 'prices'}
              onChange={(e) => setUpdateType(e.target.value as UpdateType)}
            />
            <span>💰 Preise anpassen</span>
          </label>
          <label className="option">
            <input 
              type="radio" 
              value="inventory" 
              checked={updateType === 'inventory'}
              onChange={(e) => setUpdateType(e.target.value as UpdateType)}
            />
            <span>📦 Lagerbestand</span>
          </label>
          <label className="option">
            <input 
              type="radio" 
              value="descriptions" 
              checked={updateType === 'descriptions'}
              onChange={(e) => setUpdateType(e.target.value as UpdateType)}
            />
            <span>📝 Beschreibungen</span>
          </label>
          <label className="option">
            <input 
              type="radio" 
              value="all" 
              checked={updateType === 'all'}
              onChange={(e) => setUpdateType(e.target.value as UpdateType)}
            />
            <span>⚡ Komplett-Update</span>
          </label>
        </div>

        <LoadingButton
          onClick={handleUpdate}
          loading={loading}
          loadingText="🔄 Aktualisiere..."
        >
          🚀 Updates starten
        </LoadingButton>
      </div>

      <div className="metric-card">
        <h3>📋 Zu aktualisierende Produkte</h3>
        <div className="products-list">
          {products.map(product => (
            <div key={product.id} className="product-item">
              <span className="product-name">{product.name}</span>
              <span className="product-price">€{product.price}</span>
              <span className={`status ${product.updated ? 'success' : 'pending'}`}>
                {product.updated ? '✅ Aktuell' : '⚠️ Update nötig'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WooProductUpdate;