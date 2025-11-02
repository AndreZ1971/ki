import React, { useState, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { categoryApi } from '../../services/productApi';
import type { Category } from '../../types/product';
import './page.css';

const CategoriesManager = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setInitialLoading(true);
      console.log('🔍 Starting to load categories...');
      
      if (!categoryApi || !categoryApi.getCategories) {
        throw new Error('Category API is not available');
      }
      
      const response = await categoryApi.getCategories();
      console.log('📦 API Response:', response);
      
      if (response.success && response.data) {
        setCategories(response.data);
        if (toast && toast.success) {
          toast.success(`${response.data.length} Kategorien geladen`);
        }
      } else {
        throw new Error(response.error || 'Kategorien konnten nicht geladen werden');
      }
    } catch (err) {
      console.error('❌ Load Categories Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Kategorien';
      if (setError) setError(errorMessage);
      if (toast && toast.error) toast.error(errorMessage);
      setCategories([]);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Nur beim Mount laden

  const handleOptimizeAll = async () => {
    try {
      setLoading(true);
      clearError();

      const response = await categoryApi.optimizeCategories();

      if (response.success) {
        setCategories(categories.map(cat => ({ ...cat, needsOptimization: false })));
        toast.success('Alle Kategorien erfolgreich optimiert!');
      } else {
        throw new Error(response.error || 'Optimierung fehlgeschlagen');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = prompt('Neue Kategorie Name:');
    if (!name) return;

    try {
      setLoading(true);
      const response = await categoryApi.createCategory({ name, productCount: 0, needsOptimization: false });

      if (response.success && response.data) {
        setCategories([...categories, response.data]);
        toast.success(`Kategorie "${name}" erstellt!`);
      } else {
        throw new Error(response.error || 'Fehler beim Erstellen');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (initialLoading) {
    return (
      <div className="analytics-page">
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        <BackButton onClick={handleBackToDashboard} />
        <div className="analytics-header">
          <h1>📑 Categories Manager</h1>
          <p>Lade Kategorien...</p>
        </div>
      </div>
    );
  }

  // Error State (no data)
  if (error && categories.length === 0) {
    return (
      <div className="analytics-page">
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        <BackButton onClick={handleBackToDashboard} />
        <div className="analytics-header">
          <h1>📑 Categories Manager</h1>
          <p style={{ color: '#f44336' }}>{error}</p>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <button onClick={loadCategories} className="action-button">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (categories.length === 0) {
    return (
      <div className="analytics-page">
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        <BackButton onClick={handleBackToDashboard} />
        <div className="analytics-header">
          <h1>📑 Categories Manager</h1>
          <p>Keine Kategorien gefunden</p>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <button onClick={loadCategories} className="action-button">
            Kategorien aktualisieren
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <BackButton onClick={handleBackToDashboard} />

      <div className="analytics-header">
        <h1>📑 Categories Manager</h1>
        <p>Automatische Kategorie-Verwaltung und Optimierung</p>
      </div>

      <div className="metric-card full-width">
        <h3>📊 Kategorie-Übersicht</h3>
        
        <ErrorMessage message={error || ''} onClose={clearError} />
        <div className="categories-stats">
          <div className="stat">
            <span className="value">{categories.length}</span>
            <span className="label">Kategorien</span>
          </div>
          <div className="stat">
            <span className="value">{categories.reduce((sum, cat) => sum + cat.productCount, 0)}</span>
            <span className="label">Produkte gesamt</span>
          </div>
          <div className="stat">
            <span className="value warning">{categories.filter(cat => cat.needsOptimization).length}</span>
            <span className="label">Optimierung nötig</span>
          </div>
        </div>

        <div className="action-buttons">
          <LoadingButton
            onClick={handleOptimizeAll}
            loading={loading}
            loadingText="🔄 Optimiere..."
          >
            ⚡ Alle optimieren
          </LoadingButton>
          <LoadingButton
            onClick={handleCreateCategory}
            loading={loading}
            variant="secondary"
          >
            ➕ Neue Kategorie
          </LoadingButton>
        </div>
      </div>

      <div className="metric-card">
        <h3>📋 Kategorie-Liste</h3>
        <div className="categories-list">
          {categories.map(category => (
            <div key={category.id} className="category-item">
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className="product-count">{category.productCount} Produkte</span>
              </div>
              <div className="category-actions">
                {category.needsOptimization && (
                  <span className="optimization-badge">⚠️ Optimieren</span>
                )}
                <button className="edit-button">✏️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesManager;