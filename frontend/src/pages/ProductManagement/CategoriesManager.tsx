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
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'WordPress Themes', productCount: 15, needsOptimization: false },
    { id: 2, name: 'Plugins', productCount: 8, needsOptimization: true },
    { id: 3, name: 'Templates', productCount: 12, needsOptimization: false },
    { id: 4, name: 'Digital Products', productCount: 25, needsOptimization: true }
  ]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      // Fallback auf Mock-Daten wenn Backend nicht verfügbar
      console.log('Using mock data for categories');
    }
  };

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