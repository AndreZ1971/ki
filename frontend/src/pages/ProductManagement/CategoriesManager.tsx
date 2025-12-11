import React, { useState, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { categoryApi } from '../../services/productApi';
import type { Category, CategorySuggestion } from '../../types/product';
import { MLCategorySuggester } from './MLCategorySuggester';
import './page.css';
import './CategoriesManager.css';

const CategoriesManager = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Record<number, CategorySuggestion[]>>({});
  const [suggestLoading, setSuggestLoading] = useState<Record<number, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set());

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

  const handleSuggestForCategory = async (category: Category) => {
    try {
      setSuggestLoading(prev => ({ ...prev, [category.id]: true }));
      const response = await categoryApi.suggestCategories({
        title: category.name,
        description: category.description || '',
        maxSuggestions: 5
      });

      if (response.success && response.data) {
        setSuggestions(prev => ({ ...prev, [category.id]: response.data || [] }));
        toast.success(`KI-Vorschläge für "${category.name}" geladen`);
      } else {
        throw new Error(response.error || 'Vorschläge fehlgeschlagen');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(msg);
    } finally {
      setSuggestLoading(prev => ({ ...prev, [category.id]: false }));
    }
  };

  const handleApplySuggestion = (category: Category, suggestion: CategorySuggestion) => {
    // Aktuell nur UI-State: setzt needsOptimization auf false und zeigt Übernahme an.
    // Backend-Update könnte hier ergänzt werden (WooCommerce PUT), falls gewünscht.
    setCategories(prev => prev.map(cat => cat.id === category.id
      ? { ...cat, name: suggestion.name, needsOptimization: false }
      : cat
    ));
    toast.success(`Vorschlag "${suggestion.name}" übernommen`);
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Kategoriename ist erforderlich');
      return;
    }

    try {
      setLoading(true);
      const response = await categoryApi.createCategory({ name, productCount: 0, needsOptimization: false });

      if (response.success && response.data) {
        setCategories([...categories, response.data]);
        toast.success(`✅ Kategorie "${name}" erstellt!`);
        setNewCategoryName('');
        setShowCreateModal(false);
      } else {
        throw new Error(response.error || 'Fehler beim Erstellen');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestionsExpanded = (categoryId: number) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
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
            onClick={() => setShowCreateModal(true)}
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
            <div key={category.id} className={`category-card ${category.needsOptimization ? 'needs-optimization' : ''}`}>
              <div className="category-card-header">
                <div className="category-card-info">
                  <h4 className="category-card-title">{category.name}</h4>
                  <div className="category-card-meta">
                    <span className="product-count">📦 {category.productCount} Produkte</span>
                    {category.description && <span className="description">{category.description}</span>}
                  </div>
                </div>
                <div className="category-card-badges">
                  {category.needsOptimization && (
                    <span className="badge optimization-badge" title="Diese Kategorie benötigt eine Beschreibung">
                      ⚠️ Optimierung nötig
                    </span>
                  )}
                </div>
              </div>

              <button
                className="suggest-button"
                onClick={() => handleSuggestForCategory(category)}
                disabled={suggestLoading[category.id]}
              >
                {suggestLoading[category.id] ? (
                  <><span className="spinner">⏳</span> KI analysiert...</>
                ) : (
                  <><span>🤖</span> KI-Vorschläge laden</>
                )}
              </button>

              {suggestions[category.id]?.length ? (
                <div className="suggestions-container">
                  <button
                    className="suggestions-toggle"
                    onClick={() => toggleSuggestionsExpanded(category.id)}
                  >
                    <span className="toggle-icon">{expandedSuggestions.has(category.id) ? '▼' : '▶'}</span>
                    <span>{suggestions[category.id].length} KI-Vorschlag{suggestions[category.id].length > 1 ? 'e' : ''}</span>
                  </button>

                  {expandedSuggestions.has(category.id) && (
                    <div className="suggestions-list">
                      {suggestions[category.id].map((s, idx) => (
                        <div key={idx} className="suggestion-item">
                          <div className="suggestion-content">
                            <div className="suggestion-header">
                              <strong className="suggestion-name">{s.name}</strong>
                              <span className={`confidence-badge confidence-${Math.round(s.confidence * 100)}`}>
                                {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                            <p className="suggestion-reason">{s.reason}</p>
                          </div>
                          <button
                            className="apply-button"
                            onClick={() => handleApplySuggestion(category, s)}
                          >
                            ✓ Übernehmen
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="category-ml-section">
        <h3>KI-Kategorie-Vorschläge</h3>
        {/* Beispielhafte Produktdaten, kann dynamisch ersetzt werden */}
        <MLCategorySuggester productTitle="Beispielprodukt" productDescription="Dies ist eine Beispielbeschreibung für ein Produkt, das kategorisiert werden soll." />
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Neue Kategorie erstellen</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)} disabled={loading}>✕</button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="category-form">
              <div className="form-group">
                <label htmlFor="category-name">Kategoriename</label>
                <input
                  id="category-name"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="z.B. Elektronik, Mode, Haushalt..."
                  maxLength={100}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? '⏳ Erstelle...' : '✓ Kategorie erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;