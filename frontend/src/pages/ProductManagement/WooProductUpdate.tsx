import React, { useState, useEffect } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { productApi } from '../../services/productApi';
import { apiClient } from '../../lib/api-client';
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

interface TrendData {
  trendScore: number;
  suggestedPrice?: number;
  priceChange?: string;
  strategy?: string;
  reasoning?: string;
  redditSentiment?: string;
  redditScore?: number;
}

interface RedditSentiment {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore: number;
  confidence: number;
  totalMentions: number;
  trendingScore: number;
  topKeywords: string[];
  recentPosts: Array<{
    title: string;
    subreddit: string;
    score: number;
    url: string;
  }>;
}

const WooProductUpdate = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError, clearError } = useProductManagement();
  const toast = useToast();
  const [updateType, setUpdateType] = useState<UpdateType>('prices');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // AI/ML States
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [trendData, setTrendData] = useState<Record<number, TrendData>>({});
  const [redditData, setRedditData] = useState<RedditSentiment | null>(null);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<ProductItem | null>(null);
  const [aiAutoApply, setAiAutoApply] = useState(false);
  const [optimizedDescriptions, setOptimizedDescriptions] = useState<Record<number, string>>({});
  const [maxPriceIncrease, setMaxPriceIncrease] = useState<number>(20);
  const [maxPriceDecrease, setMaxPriceDecrease] = useState<number>(15);

  // Lade echte Produkte aus WooCommerce
    const loadProducts = React.useCallback(async () => {
      try {
        setLoadingProducts(true);
        console.log('[WooProductUpdate] Requesting products from /api/products/woo/list');
        const data = await apiClient.get('/api/products/woo/list');
        console.log('[WooProductUpdate] Response:', data);
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

  // ==================== AI/ML Functions ====================

  const analyzeTrendPricing = async (product: ProductItem) => {
    try {
      setAiLoading(true);
      const result = await apiClient.post('/api/products/ai/trend-pricing', {
        productId: product.id,
        productName: product.name,
        currentPrice: product.price,
        category: 'general',
        maxPriceIncreasePercent: maxPriceIncrease,
        maxPriceDecreasePercent: maxPriceDecrease
      });
      
      if (result.success) {
        setTrendData(prev => ({
          ...prev,
          [product.id]: result.data
        }));
        
        // Bei AI-Auto-Apply: Preis direkt übernehmen
        if (aiAutoApply && result.data.suggestedPrice) {
          setProducts(prev => prev.map(p => 
            p.id === product.id 
              ? { ...p, price: result.data.suggestedPrice }
              : p
          ));
          toast.success(`✅ Preis automatisch auf €${result.data.suggestedPrice} angepasst!`);
        } else {
          toast.success(`🔥 Trend-Analyse für "${product.name}" abgeschlossen!`);
        }
      } else {
        toast.error('Trend-Analyse fehlgeschlagen');
      }
    } catch (error) {
      toast.error('Fehler bei Trend-Analyse');
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const analyzeRedditSentiment = async (product: ProductItem) => {
    try {
      setAiLoading(true);
      setSelectedProductForAnalysis(product);
      
      const result = await apiClient.post('/api/products/ai/reddit-sentiment', {
        productName: product.name,
        category: 'general'
      });
      
      if (result.success) {
        setRedditData(result.data);
        toast.success(`💬 Reddit-Analyse für "${product.name}" abgeschlossen!`);
      } else {
        toast.error('Reddit-Analyse fehlgeschlagen');
      }
    } catch (error) {
      toast.error('Fehler bei Reddit-Analyse');
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const optimizeDescriptionWithTrends = async (product: ProductItem) => {
    if (!product.description) {
      toast.error('Produkt hat keine Beschreibung');
      return;
    }

    try {
      setAiLoading(true);
      const result = await apiClient.post('/api/products/ai/optimize-description-trends', {
        productName: product.name,
        currentDescription: product.description,
        category: 'general'
      });
      
      if (result.success) {
        // Speichere optimierte Beschreibung
        setOptimizedDescriptions(prev => ({
          ...prev,
          [product.id]: result.data.optimizedDescription
        }));

        // Bei AI-Auto-Apply: Beschreibung direkt übernehmen
        if (aiAutoApply) {
          setProducts(prev => prev.map(p => 
            p.id === product.id 
              ? { ...p, description: result.data.optimizedDescription }
              : p
          ));
          toast.success(`✅ Beschreibung automatisch optimiert! SEO: ${result.data.seoScore}%`);
        } else {
          toast.success(`📝 Beschreibung optimiert! SEO-Score: ${result.data.seoScore}% (klicke "Updates starten" zum Übernehmen)`);
        }
        
        console.log('Optimierte Beschreibung:', result.data.optimizedDescription);
      } else {
        toast.error('Beschreibungs-Optimierung fehlgeschlagen');
      }
    } catch (error) {
      toast.error('Fehler bei Beschreibungs-Optimierung');
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Bitte wähle mindestens ein Produkt aus');
      return;
    }

    try {
      setLoading(true);
      clearError();

      // Wenn AI-Daten vorhanden sind, führe direkte WooCommerce-Updates durch
      const hasAiData = selectedProducts.some(id => trendData[id] || optimizedDescriptions[id]);
      
      if (hasAiData && (updateType === 'prices' || updateType === 'descriptions' || updateType === 'all')) {
        toast.info('🤖 Verwende AI-optimierte Werte...');
        
        // Direct WooCommerce Update mit AI-Werten
        let successCount = 0;
        let errorCount = 0;

        for (const productId of selectedProducts) {
          const product = products.find(p => p.id === productId);
          if (!product) continue;

          const updatePayload: any = {};

          // AI-optimierter Preis
          if ((updateType === 'prices' || updateType === 'all') && trendData[productId]?.suggestedPrice) {
            updatePayload.regular_price = trendData[productId].suggestedPrice.toString();
          }

          // AI-optimierte Beschreibung
          if ((updateType === 'descriptions' || updateType === 'all') && optimizedDescriptions[productId]) {
            updatePayload.description = optimizedDescriptions[productId];
          }

          // Nur updaten wenn Änderungen vorliegen
          if (Object.keys(updatePayload).length === 0) continue;

          try {
            await apiClient.put(`/api/products/woo/update-single/${productId}`, updatePayload);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`Update failed for product ${productId}:`, error);
          }
        }

        toast.success(`✅ ${successCount} Produkte mit AI-Werten aktualisiert!`);
        if (errorCount > 0) {
          toast.warning(`⚠️ ${errorCount} Produkte konnten nicht aktualisiert werden`);
        }

        // Produkte neu laden
        await loadProducts();
        
      } else {
        // Standard-Update ohne AI
        const response = await productApi.updateWooProducts({
          type: updateType,
          productIds: selectedProducts
        });

        if (response.success) {
          toast.success(`${selectedProducts.length} Produkt(e) erfolgreich aktualisiert!`);
          await loadProducts();
        } else {
          throw new Error(response.error || 'Update fehlgeschlagen');
        }
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

      {/* AI/ML Dashboard */}
      <div className="metric-card full-width" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🤖 KI-Assistenz mit Google Trends & Reddit</h3>
          <button 
            onClick={() => setShowAiPanel(!showAiPanel)}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {showAiPanel ? '🔼 Ausblenden' : '🔽 Anzeigen'}
          </button>
        </div>
        
        {showAiPanel && (
          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
            <p style={{ marginBottom: '15px' }}>
              Nutze Echtzeit-Daten von <strong>Google Trends</strong> und <strong>Reddit</strong> für intelligente Produkt-Updates.
            </p>

            {/* Price Limits - Percentage Based */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '15px',
              padding: '15px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '10px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  📈 Max. Preiserhöhung (%)
                </label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={maxPriceIncrease}
                  onChange={(e) => setMaxPriceIncrease(Number(e.target.value))}
                  style={{ 
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.9)',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                />
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '6px' }}>
                  Preis darf max. +{maxPriceIncrease}% steigen
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  📉 Max. Preissenkung (%)
                </label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={maxPriceDecrease}
                  onChange={(e) => setMaxPriceDecrease(Number(e.target.value))}
                  style={{ 
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.9)',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                />
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '6px' }}>
                  Preis darf max. -{maxPriceDecrease}% sinken
                </div>
              </div>
            </div>

            {/* AI-Auto-Apply Toggle */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              marginBottom: '20px',
              padding: '15px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '10px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                <input 
                  type="checkbox"
                  checked={aiAutoApply}
                  onChange={(e) => setAiAutoApply(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <strong>🤖 Auto-Apply Modus</strong>
                  <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>
                    {aiAutoApply 
                      ? '✅ AI-Vorschläge werden automatisch übernommen' 
                      : '⏸️ AI-Vorschläge nur anzeigen (manuelles Übernehmen)'}
                  </div>
                </div>
              </label>

              <button
                onClick={async () => {
                  if (selectedProducts.length === 0) {
                    toast.error('Wähle mindestens ein Produkt aus');
                    return;
                  }
                  
                  setAiLoading(true);
                  let analyzed = 0;
                  
                  for (const productId of selectedProducts) {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                      await analyzeTrendPricing(product);
                      analyzed++;
                      await new Promise(r => setTimeout(r, 1500)); // Rate-Limiting
                    }
                  }
                  
                  setAiLoading(false);
                  toast.success(`🎯 ${analyzed} Produkte analysiert!`);
                }}
                disabled={aiLoading || selectedProducts.length === 0}
                style={{
                  background: aiLoading ? '#6b7280' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: aiLoading || selectedProducts.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                {aiLoading ? '⏳ Analysiere...' : `🎯 Alle analysieren (${selectedProducts.length})`}
              </button>
            </div>
            
            {aiLoading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p>🔍 Analysiere Trends und Community-Feedback...</p>
              </div>
            )}

            {/* Reddit Sentiment Panel */}
            {redditData && selectedProductForAnalysis && (
              <div style={{ 
                background: 'white', 
                color: '#333', 
                padding: '20px', 
                borderRadius: '12px',
                marginTop: '20px'
              }}>
                <h4>💬 Reddit Sentiment: {selectedProductForAnalysis.name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  <div>
                    <strong>Sentiment:</strong>
                    <div style={{ 
                      fontSize: '24px', 
                      color: redditData.sentiment === 'POSITIVE' ? '#10b981' : redditData.sentiment === 'NEGATIVE' ? '#ef4444' : '#6b7280' 
                    }}>
                      {redditData.sentiment === 'POSITIVE' ? '😊 Positiv' : redditData.sentiment === 'NEGATIVE' ? '😞 Negativ' : '😐 Neutral'}
                    </div>
                  </div>
                  <div>
                    <strong>Score:</strong>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {redditData.sentimentScore > 0 ? '+' : ''}{redditData.sentimentScore}
                    </div>
                  </div>
                  <div>
                    <strong>Mentions:</strong>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{redditData.totalMentions}</div>
                  </div>
                  <div>
                    <strong>Trending:</strong>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{redditData.trendingScore}%</div>
                  </div>
                </div>

                {redditData.topKeywords.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <strong>🔑 Top Keywords:</strong>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {redditData.topKeywords.map((keyword, idx) => (
                        <span key={idx} style={{ 
                          background: '#e5e7eb', 
                          padding: '4px 12px', 
                          borderRadius: '16px',
                          fontSize: '14px'
                        }}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {redditData.recentPosts.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <strong>📰 Aktuelle Reddit-Posts:</strong>
                    <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                      {redditData.recentPosts.map((post, idx) => (
                        <div key={idx} style={{ 
                          padding: '8px', 
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}>
                          <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                            📍 r/{post.subreddit}: {post.title}
                          </a>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            ⬆️ {post.score} upvotes
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setRedditData(null)}
                  style={{ 
                    marginTop: '15px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Schließen
                </button>
              </div>
            )}
          </div>
        )}
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
              {products.map(product => {
                const trend = trendData[product.id];
                return (
                  <div key={product.id} className="product-item" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'auto 1fr auto auto auto auto auto auto',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '12px',
                    background: trend ? '#f0fdf4' : 'transparent',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <label className="product-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        aria-label={`Produkt ${product.name} auswählen`}
                      />
                    </label>
                    <span className="product-name">{product.name}</span>
                    <span className="product-price">€{product.price}</span>
                    
                    {/* Trend Indicators */}
                    {trend && (
                      <>
                        <span style={{ 
                          background: trend.strategy === 'INCREASE' ? '#dcfce7' : trend.strategy === 'DECREASE' ? '#fee2e2' : '#f3f4f6',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          🔥 {trend.trendScore?.toFixed(0)}/100
                        </span>
                        {trend.suggestedPrice && (
                          <>
                            <span style={{ 
                              color: '#10b981',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}>
                              → €{trend.suggestedPrice} ({trend.priceChange})
                            </span>
                            {!aiAutoApply && (
                              <button
                                onClick={async () => {
                                  try {
                                    await apiClient.put(`/api/products/woo/update-single/${product.id}`, {
                                      regular_price: trend.suggestedPrice?.toString()
                                    });
                                    toast.success(`✅ Preis für "${product.name}" auf €${trend.suggestedPrice} aktualisiert!`);
                                    await loadProducts();
                                  } catch (_error) {
                                    toast.error('Fehler beim Aktualisieren');
                                  }
                                }}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                                title="Vorgeschlagenen Preis übernehmen"
                              >
                                ✓ Übernehmen
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                    
                    {updateType === 'inventory' && product.manage_stock && (
                      <span className="product-stock">📦 {product.stock_quantity || 0}</span>
                    )}
                    
                    {/* AI Action Buttons */}
                    <button
                      onClick={() => analyzeTrendPricing(product)}
                      disabled={aiLoading}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: aiLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: aiLoading ? 0.5 : 1
                      }}
                      title="Google Trends Pricing"
                    >
                      🔥 Trends
                    </button>
                    
                    <button
                      onClick={() => analyzeRedditSentiment(product)}
                      disabled={aiLoading}
                      style={{
                        background: '#ff4500',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: aiLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: aiLoading ? 0.5 : 1
                      }}
                      title="Reddit Sentiment"
                    >
                      💬 Reddit
                    </button>
                    
                    <button
                      onClick={() => optimizeDescriptionWithTrends(product)}
                      disabled={aiLoading || !product.description}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: (aiLoading || !product.description) ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: (aiLoading || !product.description) ? 0.5 : 1
                      }}
                      title="AI Description"
                    >
                      📝 Opt
                    </button>
                    
                    {product.permalink && (
                      <a href={product.permalink} target="_blank" rel="noopener noreferrer" className="product-link">
                        🔗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WooProductUpdate;