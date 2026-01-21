// ProductAnalyzer.tsx - Product Selection & Analysis Tool
import React, { useState, useCallback, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { ProductAnalysis } from '../app/ProductAnalysis';
import { apiClient } from '../../lib/api-client';
import './page.css';
import '../shared-analytics.css';

interface Product {
  id: number;
  name: string;
  price: string;
}

const ProductAnalyzer: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [toastList, setToastList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [productDebug, setProductDebug] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState<any | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Lade Produktliste beim Mounten
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiClient.get('/api/products/woo/products?per_page=100');
        
        // Handle both response formats
        let productsArray = null;
        let errorMsg = null;
        
        if (data.success && Array.isArray(data.data)) {
          productsArray = data.data;
        } else if (data.error) {
          errorMsg = data.error;
        }
        
        if (!productsArray && !errorMsg) {
          errorMsg = `Ungültiges Response-Format: ${JSON.stringify(data).substring(0, 200)}`;
        }
        
        if (errorMsg) {
          throw new Error(errorMsg);
        }
        
        const mapped = productsArray.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price || '0'
        }));
        setProducts(mapped.slice(0, 100));
        if (mapped.length > 0) {
          setSelectedProductId(mapped[0].id);
        }

      } catch (err) {
        setProducts([]);
        setAnalysisError(err instanceof Error ? err.message : 'Produkte konnten nicht geladen werden');
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const openDetailsModal = useCallback(async () => {
    if (!selectedProductId) return;
    setShowModal(true);
    setModalLoading(true);
    setAnalysis(null);
    setAnalysisError(null);
    setProductError(null);
    setProductDebug(null);
    setEditMode(false);
    setEditedProduct(null);
    setSaveError(null);
    try {
      const data = await apiClient.get(`/api/products/woo/products/${selectedProductId}?ts=${Date.now()}`);
      setProductDebug(data);
      const productPayload = data?.data ?? data;
      if (data.success && productPayload && Object.keys(productPayload).length > 0) {
        setProductDetails(productPayload);
        setEditedProduct(productPayload);
      } else {
        throw new Error(data.error || 'Produktdetails konnten nicht geladen werden (leere Antwort)');
      }
    } catch (err: any) {
      setProductDetails(null);
      setAnalysisError(err.message);
      setProductError(err.message);
    } finally {
      setModalLoading(false);
    }
  }, [selectedProductId]);

  const runAnalysis = useCallback(async () => {
    if (!selectedProductId) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const data = await apiClient.post(`/api/products/adviser/analyze/${selectedProductId}`, {});
      if (data) {
        setAnalysis(data);
      } else {
        setAnalysisError(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (err: any) {
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedProductId]);

  const saveProduct = useCallback(async () => {
    if (!selectedProductId || !editedProduct) return;
    setSaveLoading(true);
    setSaveError(null);
    try {
      const updateData = {
        name: editedProduct.name,
        regular_price: editedProduct.regular_price,
        sale_price: editedProduct.sale_price || '',
        stock_quantity: editedProduct.stock_quantity,
        description: editedProduct.description,
        short_description: editedProduct.short_description,
      };
      const data = await apiClient.put(`/api/products/woo/products/${selectedProductId}`, updateData);
      if (data.success) {
        setProductDetails(data.data);
        setEditedProduct(data.data);
        setEditMode(false);
        setToastList([...toastList, {
          id: Date.now().toString(),
          type: 'success',
          message: '✅ Produkt erfolgreich gespeichert!',
        }]);
      } else {
        throw new Error(data.error || 'Speichern fehlgeschlagen');
      }
    } catch (err: any) {
      setSaveError(err.message);
      setToastList([...toastList, {
        id: Date.now().toString(),
        type: 'error',
        message: `❌ Fehler: ${err.message}`,
      }]);
    } finally {
      setSaveLoading(false);
    }
  }, [selectedProductId, editedProduct, toastList]);

  const toggleEditMode = useCallback(() => {
    if (editMode) {
      setEditedProduct(productDetails);
    }
    setEditMode(!editMode);
    setSaveError(null);
  }, [editMode, productDetails]);

  const updateField = useCallback((field: string, value: any) => {
    setEditedProduct((prev: any) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return (
    <div className="analytics-page">
      {/* Floating Back Button */}
      <button className="back-button floating-back" onClick={handleBackToDashboard}>← Zurück</button>
      {/* Unified Header */}
      <div className="analytics-header">
        <h1>🔍 Product Analyzer</h1>
        <p>Analysiere deine Produkte mit KI und erhalte detaillierte Verbesserungsvorschläge</p>
      </div>

      {/* Product Selection */}
      <div className="analysis-section">
        <h3 style={{ textTransform: 'uppercase', marginTop: 0 }}>🎯 Produkt auswählen</h3>
        {productsLoading ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
            📦 Produkte werden geladen...
          </div>
        ) : products.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
            ⚠️ Keine Produkte gefunden. Bitte WooCommerce konfigurieren.
          </div>
        ) : (
          <div className="filters-container" style={{ alignItems: 'flex-end' }}>
            <div className="filter-group" style={{ flex: 1 }}>
              <label className="filter-label">Produkt</label>
              <select
                className="filter-select"
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
              >
                <option value="">-- Produkt wählen --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ID: {p.id}) - {p.price}€
                  </option>
                ))}
              </select>
            </div>
            <button
              className={selectedProductId ? 'export-button primary' : 'export-button'}
              onClick={openDetailsModal}
              disabled={!selectedProductId}
              title="Produktdetails anzeigen und analysieren"
            >
              🔍 Details & Analyse
            </button>
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
          💡 Wählen Sie ein Produkt aus der Liste und klicken Sie auf „Analyse starten"
        </div>
      </div>

      {/* Modal: Produktdetails & Analyse */}
      {showModal && (
        <div 
          className="product-analyzer-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(6, 8, 17, 0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}
        >
          <div 
            className="product-analyzer-modal"
            style={{ width: '900px', maxWidth: '90vw', maxHeight: '90vh', background: 'rgb(45, 50, 75)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '18px', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.4)' }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f5f7ff' }}>
                  {editMode ? '✏️ Produkt bearbeiten' : 'Produktdetails'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>ID: {selectedProductId}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {editMode && (
                  <>
                    <button 
                      onClick={saveProduct}
                      disabled={saveLoading}
                      style={{ 
                        border: '1px solid rgba(52, 199, 89, 0.5)', 
                        background: saveLoading ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.3)', 
                        color: saveLoading ? 'rgba(255, 255, 255, 0.7)' : '#fff', 
                        borderRadius: 8, 
                        padding: '6px 14px', 
                        cursor: saveLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 600 
                      }}
                    >
                      {saveLoading ? '⏳ Speichert…' : '💾 Speichern'}
                    </button>
                    <button 
                      onClick={toggleEditMode} 
                      style={{ 
                        border: '1px solid rgba(255, 255, 255, 0.2)', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: '#f5f7ff', 
                        borderRadius: 8, 
                        padding: '6px 12px', 
                        cursor: 'pointer' 
                      }}
                    >
                      Abbrechen
                    </button>
                  </>
                )}
                {!editMode && productDetails && productDetails.stock_quantity !== undefined && (
                  <button 
                    onClick={toggleEditMode} 
                    style={{ 
                      border: '1px solid rgba(59, 130, 246, 0.5)', 
                      background: 'rgba(59, 130, 246, 0.2)', 
                      color: '#60a5fa', 
                      borderRadius: 8, 
                      padding: '6px 14px', 
                      cursor: 'pointer',
                      fontWeight: 600 
                    }}
                  >
                    ✏️ Bearbeiten
                  </button>
                )}
                <button 
                  onClick={() => setShowModal(false)} 
                  style={{ 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    color: '#f5f7ff', 
                    borderRadius: 8, 
                    padding: '6px 10px', 
                    cursor: 'pointer' 
                  }}
                >
                  ✖ Schließen
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'grid', gap: '16px', overflowY: 'auto' }}>
              {saveError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 8, padding: 12, color: '#fca5a5', fontSize: 12 }}>
                  ⚠️ {saveError}
                </div>
              )}
              {modalLoading ? (
                <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>⏳ Produktdetails werden geladen…</div>
              ) : productDetails ? (
                <div style={{ display: 'grid', gridTemplateColumns: editMode ? '1fr' : '2fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'rgb(55, 60, 85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 12, padding: 16, maxHeight: editMode ? 'none' : '420px', overflowY: 'auto' }}>
                    {editMode ? (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: 6 }}>Produktname</label>
                          <input
                            type="text"
                            value={editedProduct?.name || ''}
                            onChange={(e) => updateField('name', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgb(35, 40, 60)', borderRadius: 8, fontSize: 14, color: '#f5f7ff' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: 6 }}>Normalpreis (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editedProduct?.regular_price || ''}
                              onChange={(e) => updateField('regular_price', e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgb(35, 40, 60)', borderRadius: 8, fontSize: 14, color: '#f5f7ff' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: 6 }}>Sale-Preis (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editedProduct?.sale_price || ''}
                              onChange={(e) => updateField('sale_price', e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgb(35, 40, 60)', borderRadius: 8, fontSize: 14, color: '#f5f7ff' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: 6 }}>Lagerbestand</label>
                            <input
                              type="number"
                              value={editedProduct?.stock_quantity ?? ''}
                              onChange={(e) => updateField('stock_quantity', e.target.value === '' ? null : parseInt(e.target.value))}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgb(35, 40, 60)', borderRadius: 8, fontSize: 14, color: '#f5f7ff' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: 6 }}>Kurzbeschreibung</label>
                          <textarea
                            value={editedProduct?.short_description?.replace(/<[^>]*>/g, '') || ''}
                            onChange={(e) => updateField('short_description', e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgb(35, 40, 60)', borderRadius: 8, fontSize: 13, color: '#f5f7ff', fontFamily: 'inherit', resize: 'vertical' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: 6 }}>Beschreibung</label>
                          <textarea
                            value={editedProduct?.description?.replace(/<[^>]*>/g, '') || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={6}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgb(35, 40, 60)', borderRadius: 8, fontSize: 13, color: '#f5f7ff', fontFamily: 'inherit', resize: 'vertical' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f7ff', marginBottom: 8 }}>{productDetails.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 12 }}>
                          Preis: {(productDetails.price ?? productDetails.regular_price) ? `${productDetails.price ?? productDetails.regular_price}€` : '—'} {productDetails.sale_price ? `(Sale: ${productDetails.sale_price}€)` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'pre-wrap' }}
                          dangerouslySetInnerHTML={{ __html: (productDetails.description || productDetails.short_description || '—') }}
                        />
                        {productDetails.images && productDetails.images.length > 0 && (
                          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {productDetails.images.slice(0,4).map((img: any, i: number) => (
                              <img key={i} src={img.src} alt={img.alt || 'image'} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.2)' }} />
                            ))}
                          </div>
                        )}
                        {productDetails.price_html && (
                          <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }} dangerouslySetInnerHTML={{ __html: productDetails.price_html }} />
                        )}
                      </>
                    )}
                  </div>
                  {!editMode && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ background: 'rgb(55, 60, 85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 6 }}>📈 Kennzahlen</div>
                        <div style={{ fontSize: 13, color: '#f5f7ff' }}>Gesamtverkäufe: {productDetails.total_sales ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#f5f7ff' }}>Lagerbestand: {productDetails.stock_quantity ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#f5f7ff' }}>Status: {productDetails.stock_status ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#f5f7ff' }}>Kategorien: {(productDetails.categories || []).map((c: any) => c.name).join(', ') || '—'}</div>
                      </div>
                      <button onClick={runAnalysis} disabled={analysisLoading} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.5)', background: analysisLoading ? 'rgba(59, 130, 246, 0.2)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(52, 199, 89, 0.2))', color: '#60a5fa', cursor: analysisLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                        {analysisLoading ? '⏳ KI analysiert…' : '🤖 Mit KI analysieren'}
                      </button>
                      {analysisError && (
                        <div style={{ fontSize: 12, color: '#fca5a5' }}>⚠️ {analysisError}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#fca5a5', display: 'grid', gap: 12 }}>
                  <div>⚠️ Keine Produktdetails gefunden.</div>
                  {productError && <div style={{ fontSize: 12, color: '#fca5a5' }}>Fehler: {productError}</div>}
                  {productDebug && (
                    <pre style={{ margin: 0, fontSize: 11, color: '#f5f7ff', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: 10, overflowX: 'auto' }}>
                      {JSON.stringify(productDebug, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {analysis && (
                <div style={{ background: 'rgb(55, 60, 85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 12, padding: 16, maxHeight: '320px', overflowY: 'auto' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f7ff', marginBottom: 8 }}>Analyse-Ergebnis</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={{ background: 'rgba(52, 199, 89, 0.15)', border: '1px solid rgba(52, 199, 89, 0.3)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 12, color: 'rgba(52, 199, 89, 0.9)' }}>Gesamt-Score</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{analysis.score}</div>
                    </div>
                    {analysis.metrics && (
                      <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 12, color: 'rgba(96, 165, 250, 0.9)' }}>Metriken</div>
                        <div style={{ fontSize: 12, color: '#f5f7ff' }}>Bilder: {analysis.metrics.imageCount}</div>
                        <div style={{ fontSize: 12, color: '#f5f7ff' }}>Kategorien: {analysis.metrics.categoryCount}</div>
                      </div>
                    )}
                  </div>
                  {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: '#f5f7ff', marginBottom: 6 }}>Empfehlungen</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {analysis.recommendations.map((r: string, i: number) => (
                          <li key={i} style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Analysis Component */}
      {selectedProductId && (
        <div className="analysis-section">
          <ProductAnalysis productId={selectedProductId} />
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer 
        toasts={toastList}
        onRemove={(id: string) => setToastList(toastList.filter(t => t.id !== id))}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        
        /* Modal bleibt unverändert */
      `}</style>
    </div>
  );
};

export default ProductAnalyzer;
