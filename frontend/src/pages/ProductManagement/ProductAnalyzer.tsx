// ProductAnalyzer.tsx - Product Selection & Analysis Tool
import React, { useState, useCallback, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { ProductAnalysis } from '../app/ProductAnalysis';
import { apiClient } from '../../lib/api-client';
import './page.css';

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
  const [showRaw, setShowRaw] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productDebug, setProductDebug] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState<any | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const apiBase = 'http://localhost:3000';

  // Lade Produktliste beim Mounten
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('📥 Lade Produkte von:', `${apiBase}/api/products/woo/products?per_page=100`);
        const data = await apiClient.get(`${apiBase}/api/products/woo/products?per_page=100`);
        console.log('📋 Response Data:', data);
        
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
        console.log('✅ Produkte geladen:', mapped.length);
      } catch (err) {
        console.error('❌ Fehler beim Laden der Produkte:', err);
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
      const data = await apiClient.get(`${apiBase}/api/products/woo/products/${selectedProductId}?ts=${Date.now()}`);
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
  }, [apiBase, selectedProductId]);

  const runAnalysis = useCallback(async () => {
    if (!selectedProductId) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const data = await apiClient.post(`${apiBase}/api/products/adviser/analyze/${selectedProductId}`, {});
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
  }, [apiBase, selectedProductId]);

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
      const data = await apiClient.put(`${apiBase}/api/products/woo/products/${selectedProductId}`, updateData);
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
  }, [apiBase, selectedProductId, editedProduct, toastList]);

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
    <div className="app-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <button className="back-button floating-back" onClick={handleBackToDashboard}>← Zurück</button>
          <h1 style={{ marginTop: '16px', color: '#0b1220' }}>🔍 Product Analyzer & Optimizer</h1>
          <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>
            Analysiere deine Produkte mit KI und erhalte detaillierte Optimierungsvorschläge
          </p>
        </div>
      </div>

      {/* Product Selection */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', color: '#0b1220' }}>
          🎯 Produkt auswählen
        </div>
        {productsLoading ? (
          <div style={{ color: '#475569', textAlign: 'center', padding: '20px' }}>
            📦 Produkte werden geladen...
          </div>
        ) : products.length === 0 ? (
          <div style={{ color: '#475569', textAlign: 'center', padding: '20px' }}>
            ⚠️ Keine Produkte gefunden. Bitte WooCommerce konfigurieren.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#0b1220', display: 'block', marginBottom: '8px' }}>
                Produkt
              </label>
              <select
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#ffffff',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  color: '#0b1220',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
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
              onClick={openDetailsModal}
              disabled={!selectedProductId}
              style={{
                padding: '12px 24px',
                background: selectedProductId
                  ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(34, 197, 94, 0.08))'
                  : 'rgba(37, 99, 235, 0.06)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                borderRadius: '8px',
                color: '#1d4ed8',
                cursor: selectedProductId ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (selectedProductId) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(34, 197, 94, 0.12))';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(37, 99, 235, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedProductId) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(34, 197, 94, 0.08))';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              🔍 Details & Analyse
            </button>
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
          💡 Wählen Sie ein Produkt aus der Liste und klicken Sie auf „Analyse starten"
        </div>
      </div>

      {/* Modal: Produktdetails & Analyse */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{ width: '900px', maxWidth: '90vw', maxHeight: '90vh', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0b1220' }}>
                  {editMode ? '✏️ Produkt bearbeiten' : 'Produktdetails'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {selectedProductId}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {editMode && (
                  <>
                    <button 
                      onClick={saveProduct}
                      disabled={saveLoading}
                      style={{ 
                        border: '1px solid #22c55e', 
                        background: saveLoading ? '#f0fdf4' : '#22c55e', 
                        color: saveLoading ? '#16a34a' : '#fff', 
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
                        border: '1px solid #CBD5E1', 
                        background: '#fff', 
                        color: '#0b1220', 
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
                      border: '1px solid #2563eb', 
                      background: '#fff', 
                      color: '#2563eb', 
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
                    border: '1px solid #CBD5E1', 
                    background: '#fff', 
                    color: '#0b1220', 
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
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, color: '#b91c1c', fontSize: 12 }}>
                  ⚠️ {saveError}
                </div>
              )}
              {modalLoading ? (
                <div style={{ color: '#475569' }}>⏳ Produktdetails werden geladen…</div>
              ) : productDetails ? (
                <div style={{ display: 'grid', gridTemplateColumns: editMode ? '1fr' : '2fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, maxHeight: editMode ? 'none' : '420px', overflowY: 'auto' }}>
                    {editMode ? (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Produktname</label>
                          <input
                            type="text"
                            value={editedProduct?.name || ''}
                            onChange={(e) => updateField('name', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, color: '#0b1220' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Normalpreis (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editedProduct?.regular_price || ''}
                              onChange={(e) => updateField('regular_price', e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, color: '#0b1220' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Sale-Preis (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editedProduct?.sale_price || ''}
                              onChange={(e) => updateField('sale_price', e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, color: '#0b1220' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Lagerbestand</label>
                            <input
                              type="number"
                              value={editedProduct?.stock_quantity ?? ''}
                              onChange={(e) => updateField('stock_quantity', e.target.value === '' ? null : parseInt(e.target.value))}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, color: '#0b1220' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Kurzbeschreibung</label>
                          <textarea
                            value={editedProduct?.short_description?.replace(/<[^>]*>/g, '') || ''}
                            onChange={(e) => updateField('short_description', e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, color: '#0b1220', fontFamily: 'inherit', resize: 'vertical' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Beschreibung</label>
                          <textarea
                            value={editedProduct?.description?.replace(/<[^>]*>/g, '') || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={6}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, color: '#0b1220', fontFamily: 'inherit', resize: 'vertical' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0b1220', marginBottom: 8 }}>{productDetails.name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                          Preis: {(productDetails.price ?? productDetails.regular_price) ? `${productDetails.price ?? productDetails.regular_price}€` : '—'} {productDetails.sale_price ? `(Sale: ${productDetails.sale_price}€)` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#0b1220', whiteSpace: 'pre-wrap' }}
                          dangerouslySetInnerHTML={{ __html: (productDetails.description || productDetails.short_description || '—') }}
                        />
                        {productDetails.images && productDetails.images.length > 0 && (
                          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {productDetails.images.slice(0,4).map((img: any, i: number) => (
                              <img key={i} src={img.src} alt={img.alt || 'image'} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
                            ))}
                          </div>
                        )}
                        {productDetails.price_html && (
                          <div style={{ marginTop: 10, fontSize: 12, color: '#0b1220' }} dangerouslySetInnerHTML={{ __html: productDetails.price_html }} />
                        )}
                      </>
                    )}
                  </div>
                  {!editMode && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>📈 Kennzahlen</div>
                        <div style={{ fontSize: 13, color: '#0b1220' }}>Gesamtverkäufe: {productDetails.total_sales ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#0b1220' }}>Lagerbestand: {productDetails.stock_quantity ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#0b1220' }}>Status: {productDetails.stock_status ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#0b1220' }}>Kategorien: {(productDetails.categories || []).map((c: any) => c.name).join(', ') || '—'}</div>
                      </div>
                      <button onClick={runAnalysis} disabled={analysisLoading} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(37,99,235,0.35)', background: analysisLoading ? 'rgba(37,99,235,0.10)' : 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(34,197,94,0.1))', color: '#1d4ed8', cursor: analysisLoading ? 'not-allowed' : 'pointer' }}>
                        {analysisLoading ? '⏳ KI analysiert…' : '🤖 Mit KI analysieren'}
                      </button>
                      {analysisError && (
                        <div style={{ fontSize: 12, color: '#b91c1c' }}>⚠️ {analysisError}</div>
                      )}
                      <button onClick={() => setShowRaw(!showRaw)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', color: '#0b1220', cursor: 'pointer' }}>
                        {showRaw ? '🔎 Rohdaten ausblenden' : '🔎 Rohdaten anzeigen'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#b91c1c', display: 'grid', gap: 12 }}>
                  <div>⚠️ Keine Produktdetails gefunden.</div>
                  {productError && <div style={{ fontSize: 12, color: '#b91c1c' }}>Fehler: {productError}</div>}
                  {productDebug && (
                    <pre style={{ margin: 0, fontSize: 11, color: '#0b1220', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10, overflowX: 'auto' }}>
                      {JSON.stringify(productDebug, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {productDetails && showRaw && (
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Rohdaten (WooCommerce JSON)</div>
                  <pre style={{ margin: 0, fontSize: 11, color: '#0b1220', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10, overflowX: 'auto' }}>
                    {JSON.stringify(productDetails, null, 2)}
                  </pre>
                </div>
              )}
              {analysis && (
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, maxHeight: '320px', overflowY: 'auto' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0b1220', marginBottom: 8 }}>Analyse-Ergebnis</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 12, color: '#14532d' }}>Gesamt-Score</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{analysis.score}</div>
                    </div>
                    {analysis.metrics && (
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 12, color: '#1e3a8a' }}>Metriken</div>
                        <div style={{ fontSize: 12, color: '#0b1220' }}>Bilder: {analysis.metrics.imageCount}</div>
                        <div style={{ fontSize: 12, color: '#0b1220' }}>Kategorien: {analysis.metrics.categoryCount}</div>
                      </div>
                    )}
                  </div>
                  {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: '#0b1220', marginBottom: 6 }}>Empfehlungen</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {analysis.recommendations.map((r: string, i: number) => (
                          <li key={i} style={{ fontSize: 12, color: '#0b1220' }}>{r}</li>
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
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
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
      `}</style>
    </div>
  );
};

export default ProductAnalyzer;
