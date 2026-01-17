import React, { useState, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { productApi, categoryApi } from '../../services/productApi';
import { apiClient } from '../../lib/api-client';
import type { Product, Category } from '../../types/product';
import './page.css';

const WooProductCreate = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productData, setProductData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    type: 'simple'
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  
  // 🤖 AI Assistant States
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [qualityScore, setQualityScore] = useState<any>(null);
  const [seoSuggestions, setSeoSuggestions] = useState<any>(null);

  // Lade WooCommerce Kategorien
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
          } catch {
      // Load failed - silent
    }
    };
    loadCategories();
  }, []);

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

  // ✍️ AI Description Generator
  const generateAiDescription = async () => {
    if (!productData.name) {
      toast.error('Bitte gib zuerst einen Produktnamen ein');
      return;
    }

    try {
      setAiLoading(true);
      const data = await apiClient.post('/api/products/ai/generate-description', {
        productName: productData.name,
        category: productData.category,
        tone: 'professional',
        length: 'medium'
      });

      if (data.success) {
        setProductData({ ...productData, description: data.data.description });
        toast.success(`✨ KI-Beschreibung generiert (${data.data.metadata.wordCount} Wörter)`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Fehler bei KI-Beschreibung');
    } finally {
      setAiLoading(false);
    }
  };

  // 📊 Quality Score Check
  const checkQualityScore = async () => {
    if (!productData.name || !productData.description) {
      toast.error('Name und Beschreibung erforderlich');
      return;
    }

    try {
      setAiLoading(true);
      const data = await apiClient.post('/api/products/ai/quality-score', {
        productName: productData.name,
        description: productData.description,
        price: productData.price || 0,
        category: productData.category,
        images: 0
      });

      if (data.success) {
        setQualityScore(data.data);
        toast.success(`📊 Qualitäts-Score: ${data.data.overallScore}%`);
      }
    } catch (_err: any) {
      toast.error('Fehler bei Quality-Score');
    } finally {
      setAiLoading(false);
    }
  };

  // 🔍 SEO Optimize
  const optimizeSeo = async () => {
    if (!productData.name || !productData.description) {
      toast.error('Name und Beschreibung erforderlich');
      return;
    }

    try {
      setAiLoading(true);
      const data = await apiClient.post('/api/products/ai/seo-optimize', {
        productName: productData.name,
        description: productData.description,
        category: productData.category
      });

      if (data.success) {
        setSeoSuggestions(data.data);
        toast.success('🔍 SEO-Vorschläge geladen');
      }
    } catch (_err: any) {
      toast.error('Fehler bei SEO-Optimierung');
    } finally {
      setAiLoading(false);
    }
  };

  // 🎨 Image Generation
  const generateProductImage = async () => {
    if (!productData.name) {
      toast.error('Produktname erforderlich');
      return;
    }

    try {
      setAiLoading(true);
      toast.info('🎨 Generiere Produktbild... (dauert 10-15 Sek.)');
      
      const data = await apiClient.post('/api/products/ai/generate-image', {
        productName: productData.name,
        description: productData.description,
        style: 'professional'
      });

      if (data.success) {
        setGeneratedImageUrl(data.data.imageUrl);
        toast.success('🎨 Produktbild generiert! ✓ Mit Produkt gespeichert');
      }
    } catch (_err: any) {
      toast.error('Fehler bei Bildgenerierung');
    } finally {
      setAiLoading(false);
    }
  };

  // 💰 Dynamic Pricing
  const suggestPrice = async () => {
    if (!productData.name || !productData.category) {
      toast.error('Name und Kategorie erforderlich');
      return;
    }

    try {
      setAiLoading(true);
      const data = await apiClient.post('/api/products/ai/suggest-pricing', {
        productName: productData.name,
        category: productData.category,
        description: productData.description
      });

      if (data.success) {
        setProductData({ ...productData, price: data.data.suggestedPrice });
        toast.success(`💰 Empfohlener Preis: ${data.data.suggestedPrice}€ (Konfidenz: ${data.data.confidence}%)`);
      }
    } catch (_err: any) {
      toast.error('Fehler bei Preis-Vorschlag');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    try {
      setLoading(true);
      clearError();
      setValidationErrors([]);

      const productPayload = {
        ...productData,
        ...(generatedImageUrl && { image: generatedImageUrl })
      };
      
      const response = await productApi.createWooProduct(productPayload);

      if (response.success && response.data) {
        toast.success('Produkt erfolgreich in WooCommerce erstellt!');
        setProductData({
          name: '',
          description: '',
          price: 0,
          category: '',
          type: 'simple'
        });
        setGeneratedImageUrl('');
        setQualityScore(null);
        setSeoSuggestions(null);
      } else {
        throw new Error(response.error || 'Fehler beim Erstellen');
      }
    } catch {
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
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Beschreibung</span>
              <button 
                type="button"
                onClick={generateAiDescription}
                disabled={aiLoading || !productData.name}
                style={{
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: aiLoading || !productData.name ? 'not-allowed' : 'pointer',
                  opacity: aiLoading || !productData.name ? 0.6 : 1
                }}
              >
                {aiLoading ? '⏳ Generiere...' : '✨ KI-Beschreibung'}
              </button>
            </label>
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={productData.price || ''}
                  onChange={(e) => setProductData({...productData, price: parseFloat(e.target.value) || 0})}
                  placeholder="29.99"
                  style={{ flex: 1, paddingRight: '35px', fontSize: '14px' }}
                  required
                />
                <span style={{ position: 'absolute', right: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', pointerEvents: 'none' }}>€</span>
              </div>
            </div>

            <div className="form-group">
              <label>Kategorie *</label>
              <select 
                value={productData.category || ''}
                onChange={(e) => setProductData({...productData, category: e.target.value})}
                required
              >
                <option value="">WooCommerce Kategorie wählen</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.productCount} Produkte)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Produkttyp</label>
              <select 
                value={productData.type}
                onChange={(e) => setProductData({...productData, type: e.target.value as Product['type']})}
              >
                <option value="simple">Simple - Standard Produkt</option>
                <option value="virtual">Virtual - Kein Versand</option>
                <option value="downloadable">Downloadable - Digitaler Download</option>
                <option value="variable">Variable - Mit Varianten</option>
                <option value="grouped">Grouped - Produkt-Gruppe</option>
                <option value="external">External - Externes Produkt</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => setShowAiPanel(!showAiPanel)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#a78bfa',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {showAiPanel ? '▼' : '▶'} 🤖 KI-Assistent
          </button>
          
          <div style={{ flex: 2, display: 'flex', gap: '10px', alignItems: 'center' }}>
            {generatedImageUrl && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: '6px',
                color: '#6ee7b7',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}>
                ✓ Bild gespeichert
              </div>
            )}
            <LoadingButton
              onClick={handleCreate}
              loading={loading}
              loadingText="🔄 Erstelle Produkt..."
              disabled={!productData.name || !productData.price}
            >
              🛒 In WooCommerce erstellen
            </LoadingButton>
          </div>
        </div>
      </div>

      {showAiPanel && (
        <div className="metric-card" style={{ marginTop: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))', borderLeft: '4px solid #8b5cf6' }}>
          <h3>🤖 KI-Assistent für Produkterstellung</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={checkQualityScore}
              disabled={aiLoading || !productData.name || !productData.description}
              style={{
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: aiLoading || !productData.name || !productData.description ? 'not-allowed' : 'pointer',
                opacity: aiLoading || !productData.name || !productData.description ? 0.5 : 1,
                fontSize: '13px'
              }}
            >
              📊 Quality Score
            </button>
            
            <button
              onClick={optimizeSeo}
              disabled={aiLoading || !productData.name || !productData.description}
              style={{
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: aiLoading || !productData.name || !productData.description ? 'not-allowed' : 'pointer',
                opacity: aiLoading || !productData.name || !productData.description ? 0.5 : 1,
                fontSize: '13px'
              }}
            >
              🔍 SEO-Check
            </button>

            <button
              onClick={generateProductImage}
              disabled={aiLoading || !productData.name}
              style={{
                padding: '12px',
                background: generatedImageUrl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.1)',
                border: generatedImageUrl ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                color: generatedImageUrl ? '#6ee7b7' : 'white',
                fontWeight: '600',
                cursor: aiLoading || !productData.name ? 'not-allowed' : 'pointer',
                opacity: aiLoading || !productData.name ? 0.5 : 1,
                fontSize: '13px'
              }}
            >
              {generatedImageUrl ? '✓ 🎨 Bild (gespeichert)' : '🎨 Bild (DALL-E)'}
            </button>

            <button
              onClick={suggestPrice}
              disabled={aiLoading || !productData.name || !productData.category}
              style={{
                padding: '12px',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: aiLoading || !productData.name || !productData.category ? 'not-allowed' : 'pointer',
                opacity: aiLoading || !productData.name || !productData.category ? 0.5 : 1,
                fontSize: '13px'
              }}
            >
              💰 Preis-KI
            </button>
          </div>

          {qualityScore && (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '15px' }}>
              <h4 style={{ marginTop: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📊 Qualitäts-Analyse
                <span style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: qualityScore.overallScore >= 80 ? '#10b981' : qualityScore.overallScore >= 60 ? '#f59e0b' : '#ef4444' 
                }}>
                  {qualityScore.overallScore}%
                </span>
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Name</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa' }}>{Math.round(qualityScore.breakdown.nameQuality)}%</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Beschreibung</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa' }}>{Math.round(qualityScore.breakdown.descriptionQuality)}%</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>SEO</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa' }}>{Math.round(qualityScore.breakdown.seoScore)}%</div>
                </div>
              </div>

              {qualityScore.recommendations && qualityScore.recommendations.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>💡 Verbesserungen:</div>
                  {qualityScore.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', paddingLeft: '10px' }}>
                      • {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {seoSuggestions && (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
              <h4 style={{ marginTop: 0, color: 'white' }}>🔍 SEO-Optimierungen</h4>
              
              <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Meta Title:</div>
                  <div style={{ color: 'white', fontWeight: '600' }}>{seoSuggestions.metaTitle}</div>
                </div>
                
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Meta Description:</div>
                  <div style={{ color: 'white' }}>{seoSuggestions.metaDescription}</div>
                </div>
                
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>URL Slug:</div>
                  <div style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{seoSuggestions.urlSlug}</div>
                </div>
                
                {seoSuggestions.focusKeywords && seoSuggestions.focusKeywords.length > 0 && (
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Focus Keywords:</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {seoSuggestions.focusKeywords.map((kw: string, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 10px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#d8b4fe'
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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