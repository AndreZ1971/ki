import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { productApi } from '../../services/productApi';
import type { Product } from '../../types/product';
import './page.css';

const WooProductCreate = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [productData, setProductData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    type: 'simple'
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!productData.name || productData.name.trim() === '') {
      errors.push('Produktname ist erforderlich');
    }
    if (!productData.price || productData.price <= 0) {
      errors.push('Preis muss größer als 0 sein');
    }
    if (!productData.category) {
      errors.push('Kategorie ist erforderlich');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    try {
      setLoading(true);
      clearError();
      setValidationErrors([]);

      const response = await productApi.createWooProduct(productData);

      if (response.success && response.data) {
        toast.success('Produkt erfolgreich in WooCommerce erstellt!');
        setProductData({
          name: '',
          description: '',
          price: 0,
          category: '',
          type: 'simple'
        });
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
        <h1>🛒 Woo Product Creator</h1>
        <p>Direkte Produkterstellung in WooCommerce</p>
      </div>

      <div className="metric-card full-width">
        <h3>➕ Neues Produkt erstellen</h3>
        
        <ErrorMessage message={error || ''} onClose={clearError} />
        
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            {validationErrors.map((err, idx) => (
              <div key={idx} className="error-item">⚠️ {err}</div>
            ))}
          </div>
        )}
        
        <div className="form-section">
          <div className="form-group">
            <label>Produktname *</label>
            <input 
              type="text" 
              value={productData.name || ''}
              onChange={(e) => setProductData({...productData, name: e.target.value})}
              placeholder="z.B. Premium WordPress Theme"
              required
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea 
              value={productData.description || ''}
              onChange={(e) => setProductData({...productData, description: e.target.value})}
              placeholder="Detaillierte Produktbeschreibung..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preis (€) *</label>
              <input 
                type="number" 
                value={productData.price || 0}
                onChange={(e) => setProductData({...productData, price: parseFloat(e.target.value) || 0})}
                placeholder="29.99"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Kategorie</label>
              <select 
                value={productData.category || ''}
                onChange={(e) => setProductData({...productData, category: e.target.value})}
                required
              >
                <option value="">Kategorie wählen</option>
                <option value="themes">WordPress Themes</option>
                <option value="plugins">Plugins</option>
                <option value="templates">Vorlagen</option>
              </select>
            </div>

            <div className="form-group">
              <label>Produkttyp</label>
              <select 
                value={productData.type}
                onChange={(e) => setProductData({...productData, type: e.target.value as Product['type']})}
              >
                <option value="simple">Einfaches Produkt</option>
                <option value="variable">Variables Produkt</option>
                <option value="grouped">Gruppiertes Produkt</option>
                <option value="external">Externes Produkt</option>
              </select>
            </div>
          </div>
        </div>

        <LoadingButton
          onClick={handleCreate}
          loading={loading}
          loadingText="🔄 Erstelle Produkt..."
          disabled={!productData.name || !productData.price}
        >
          🛒 In WooCommerce erstellen
        </LoadingButton>
      </div>

      <div className="metric-card">
        <h3>📝 Schnell-Erstellung</h3>
        <div className="quick-templates">
          <button className="template-button" onClick={() => setProductData({
            ...productData,
            type: 'simple' as Product['type'],
            category: 'themes'
          })}>
            🎨 WordPress Theme
          </button>
          <button className="template-button" onClick={() => setProductData({
            ...productData,
            type: 'simple' as Product['type'], 
            category: 'plugins'
          })}>
            🔌 WordPress Plugin
          </button>
          <button className="template-button" onClick={() => setProductData({
            ...productData,
            type: 'simple' as Product['type'],
            category: 'templates'
          })}>
            📄 Vorlage
          </button>
        </div>
      </div>
    </div>
  );
};

export default WooProductCreate;