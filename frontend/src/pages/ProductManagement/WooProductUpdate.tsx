import React, { useState, useEffect } from 'react';
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
  stock_quantity?: number;
  description?: string;
  manage_stock?: boolean;
  permalink?: string;
}

const WooProductUpdate = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [updateType, setUpdateType] = useState<UpdateType>('prices');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Lade echte Produkte aus WooCommerce
    const loadProducts = React.useCallback(async () => {
      try {
        setLoadingProducts(true);
        console.log('[WooProductUpdate] Requesting products from /api/products/woo/list');
        const response = await fetch('/api/products/woo/list');
        console.log('[WooProductUpdate] Response:', response);
        const data = await response.json();
        console.log('[WooProductUpdate] Response JSON:', data);
        if (data.success && data.data) {
          setProducts(data.data);
          setSelectedProducts(data.data.map((p: ProductItem) => p.id));
        } else {
          console.warn('[WooProductUpdate] API returned no products or success=false:', data);
        }
      } catch (err) {
        console.error('[WooProductUpdate] Failed to load products:', err);
        toast.error('Fehler beim Laden der Produkte');
      } finally {
        setLoadingProducts(false);
      }
    }, [toast]);

    useEffect(() => {
      loadProducts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const toggleProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleUpdate = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Bitte wähle mindestens ein Produkt aus');
      return;
    }

    try {
      setLoading(true);
      clearError();

      const response = await productApi.updateWooProducts({
        type: updateType,
        productIds: selectedProducts
      });

      if (response.success) {
        toast.success(`${selectedProducts.length} Produkt(e) erfolgreich aktualisiert!`);
        // Produkte neu laden um aktuelle Daten zu zeigen
        await loadProducts();
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
        <h3>📋 Zu aktualisierende Produkte ({selectedProducts.length} ausgewählt)</h3>
        
        {loadingProducts ? (
          <p>Lade Produkte aus WooCommerce...</p>
        ) : products.length === 0 ? (
          <p>Keine Produkte gefunden.</p>
        ) : (
          <>
            <div className="select-all">
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedProducts.length === products.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts(products.map(p => p.id));
                    } else {
                      setSelectedProducts([]);
                    }
                  }}
                />
                <span>Alle auswählen</span>
              </label>
            </div>
            
            <div className="products-list">
              {products.map(product => (
                <div key={product.id} className="product-item">
                  <label className="product-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                    />
                  </label>
                  <span className="product-name">{product.name}</span>
                  <span className="product-price">€{product.price}</span>
                  {updateType === 'inventory' && product.manage_stock && (
                    <span className="product-stock">📦 {product.stock_quantity || 0} auf Lager</span>
                  )}
                  {product.permalink && (
                    <a href={product.permalink} target="_blank" rel="noopener noreferrer" className="product-link">
                      🔗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WooProductUpdate;