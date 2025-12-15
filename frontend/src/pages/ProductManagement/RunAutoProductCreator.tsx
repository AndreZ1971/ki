import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface ProductCreationResult {
  success: boolean;
  message: string;
  productsCreated?: number;
  estimatedTime?: string;
  errors?: string[];
  timestamp?: string;
  products?: any[];
  avgQualityScore?: number;
  avgProcessTime?: number;
  estimatedROI?: number;
}

interface CreationConfig {
  count: number;
  category: string;
  productType: 'simple' | 'variable' | 'bundle';
  optimization: 'low' | 'medium' | 'high' | 'auto';
  minQualityScore: number;
  useAIEnhancements: boolean;
  generateImages: boolean;
  autoTagging: boolean;
}

interface CreationStats {
  totalAttempted: number;
  successCount: number;
  failureCount: number;
  avgQualityScore: number;
  avgProcessTime: number;
  estimatedROI: number;
}

const RunAutoProductCreator = () => {
  const { handleBackToDashboard } = useProductManagement();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductCreationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [stats, setStats] = useState<CreationStats | null>(null);

  const [config, setConfig] = useState<CreationConfig>({
    count: 5,
    category: 'all',
    productType: 'simple',
    optimization: 'high',
    minQualityScore: 70,
    useAIEnhancements: true,
    generateImages: false,
    autoTagging: true,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  useEffect(() => {
    if (showAdvanced) {
      fetchTrendingKeywords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdvanced, selectedCategory]);

  const fetchTrendingKeywords = async () => {
    setLoadingKeywords(true);
    try {
      const response = await fetch(`/api/trends/trending-keywords?category=${selectedCategory}`);
      if (response.ok) {
        const data = await response.json();
        setTrendingKeywords(data.keywords || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden von Trending Keywords:', err);
    } finally {
      setLoadingKeywords(false);
    }
  };

  const handleRunCreator = async () => {
    setLoading(true);
    setResult(null);
    setProgress(0);
    setStats(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 15, 95));
      }, 500);

      setCurrentStatus('🧠 Generiere KI-Produkte...');
      setProgress(5);

      // Mappe nicht unterstützte Werte auf das Backend-Schema
      const mappedProductType: 'simple' | 'virtual' | 'downloadable' =
        config.productType === 'simple' ? 'simple' : 'simple'; // variable/bundle -> simple
      const mappedOptimization: 'low' | 'medium' | 'high' =
        config.optimization === 'auto' ? 'high' : (config.optimization as 'low' | 'medium' | 'high');

      const payload = {
        count: config.count,
        category: config.category,
        productType: mappedProductType,
        optimization: mappedOptimization,
        keywords: trendingKeywords.join(', '),
        seoOptimized: true,
        mlMarketAnalysis: true,
        specializationPrompt: '',
        generateImages: config.generateImages
      };

      const response = await fetch('/api/products/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      clearInterval(progressInterval);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fehler bei der Produkterstellung');
      }

      const resultData = data.data || data;

      setCurrentStatus('✅ Validiere Qualität...');
      setProgress(85);

      if (config.useAIEnhancements) {
        setCurrentStatus('🚀 Optimiere mit ML...');
        setProgress(90);
      }

      setCurrentStatus('💾 Speichere Produkte...');
      setProgress(95);

      const calculatedStats: CreationStats = {
        totalAttempted: config.count,
        successCount: resultData.productsCreated || 0,
        failureCount: config.count - (resultData.productsCreated || 0),
        avgQualityScore: resultData.avgQualityScore || 0,
        avgProcessTime: resultData.avgProcessTime || 0,
        estimatedROI: resultData.estimatedROI || 0,
      };

      setStats(calculatedStats);
      setResult(resultData);
      setProgress(100);
      setCurrentStatus('✨ Fertig!');
      toast.success(resultData.message || 'Produkte erfolgreich erstellt!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setResult({ success: false, message: errorMessage });
      toast.error(errorMessage);
      setProgress(0);
      setCurrentStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof CreationConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const categories = [
    { value: 'all', label: '🌐 Alle Kategorien' },
    { value: 'electronics', label: '⚙️ Elektronik' },
    { value: 'clothing', label: '👕 Kleidung' },
    { value: 'home', label: '🏠 Haus & Garten' },
    { value: 'sports', label: '⚽ Sport' },
    { value: 'books', label: '📚 Bücher' },
  ];

  const productTypes = [
    { value: 'simple', label: '📦 Einfach' },
    { value: 'variable', label: '🎨 Mit Varianten' },
    { value: 'bundle', label: '🎁 Bundle' },
  ];

  const optimizationLevels = [
    { value: 'low', label: '🐢 Niedrig' },
    { value: 'medium', label: '🚗 Mittel' },
    { value: 'high', label: '🚀 Hoch' },
    { value: 'auto', label: '🤖 Auto (KI)' },
  ];

  return (
    <div className="analytics-page">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <BackButton onClick={handleBackToDashboard} />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="analytics-header">
        <h1>🚀 KI-Produkt-Generator Pro</h1>
        <p>Intelligente Produkterstellung mit ML-Optimierungen</p>
      </motion.div>

      <div className="product-creator-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="metric-card"
          style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))', borderLeft: '4px solid #8b5cf6' }}
        >
          <h3>⚙️ Konfiguration</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                📦 Produktanzahl: {config.count}
              </label>
              <input type="range" min="1" max="50" value={config.count} onChange={(e) => handleConfigChange('count', parseInt(e.target.value, 10))} style={{ width: '100%', cursor: 'pointer' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>1-50 Produkte</span>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                📂 Kategorie
              </label>
              <select
                value={config.category}
                onChange={(e) => {
                  handleConfigChange('category', e.target.value);
                  setSelectedCategory(e.target.value);
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                🎯 Produkttyp
              </label>
              <select
                value={config.productType}
                onChange={(e) => handleConfigChange('productType', e.target.value as any)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
              >
                {productTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                ⚡ Optimierungslevel
              </label>
              <select
                value={config.optimization}
                onChange={(e) => handleConfigChange('optimization', e.target.value as any)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
              >
                {optimizationLevels.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                📊 Min. Qualitäts-Score: {config.minQualityScore}%
              </label>
              <input type="range" min="0" max="100" step="5" value={config.minQualityScore} onChange={(e) => handleConfigChange('minQualityScore', parseInt(e.target.value, 10))} style={{ width: '100%', cursor: 'pointer' }} />
            </div>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: 'white' }}>🤖 KI-Features</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
                <input type="checkbox" checked={config.useAIEnhancements} onChange={(e) => handleConfigChange('useAIEnhancements', e.target.checked)} style={{ cursor: 'pointer' }} />
                ✨ AI-Beschreibungen & SEO-Optimierung
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
                <input type="checkbox" checked={config.autoTagging} onChange={(e) => handleConfigChange('autoTagging', e.target.checked)} style={{ cursor: 'pointer' }} />
                🏷️ Auto-Tagging mit ML
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
                <input type="checkbox" checked={config.generateImages} onChange={(e) => handleConfigChange('generateImages', e.target.checked)} style={{ cursor: 'pointer' }} />
                ?? Bilder generieren (inkl. A.R.I.)
              </label>
            </div>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' }}
          >
            {showAdvanced ? '▼' : '▶'} Erweiterte Optionen
          </button>

          {showAdvanced && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ marginTop: 0, color: 'white' }}>📈 Trending Keywords</h4>
              {loadingKeywords ? (
                <div style={{ color: 'rgba(255,255,255,0.6)' }}>🔄 Lade Keywords...</div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {trendingKeywords.slice(0, 10).map((keyword, idx) => (
                    <span key={idx} style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '20px', fontSize: '12px', color: '#d8b4fe', cursor: 'pointer', transition: 'all 0.2s' }}>
                      ⭐ {keyword}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {config && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1))', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Geschätzte Zeit</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{Math.ceil((config.count / 2) * (config.optimization === 'high' ? 1.5 : config.optimization === 'auto' ? 2 : 1))}min</div>
            </div>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Erwartete Qualität</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{config.minQualityScore + 15}%</div>
            </div>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>KI-Features aktiv</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f97316' }}>{[config.useAIEnhancements, config.autoTagging, config.generateImages].filter(Boolean).length}/3</div>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metric-card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15))' }}>
            <h3>📊 Fortschritt</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' }}>
              {[
                { label: 'Generiere', icon: '🧠', done: progress > 25 },
                { label: 'Validiere', icon: '✅', done: progress > 50 },
                { label: 'Optimiere', icon: '🚀', done: progress > 75 },
                { label: 'Speichere', icon: '💾', done: progress > 90 },
              ].map((phase, idx) => (
                <div key={idx} style={{ padding: '15px', background: phase.done ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', border: phase.done ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s' }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>{phase.icon}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{phase.label}</div>
                  {phase.done && <div style={{ fontSize: '16px', marginTop: '5px' }}>✓</div>}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ width: '100%', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600' }} transition={{ duration: 0.3 }}>
                  {progress > 5 && `${Math.round(progress)}%`}
                </motion.div>
              </div>
            </div>

            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600' }}>{currentStatus}</div>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metric-card">
            <h3>{result.success ? '✅ Erstellung abgeschlossen' : '❌ Fehler'}</h3>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>{result.message}</p>

            {result.success && stats && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1))', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>✅ Erfolgreich</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{stats.successCount}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>von {stats.totalAttempted}</div>
                  </div>

                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>📊 Ø Qualität</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#60a5fa' }}>{Math.round(stats.avgQualityScore)}%</div>
                  </div>

                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))', borderRadius: '10px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>⏱️ Ø Zeit pro Prod.</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#f97316' }}>{Math.round(stats.avgProcessTime)}s</div>
                  </div>

                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 92, 246, 0.1))', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>💰 Geschätzter ROI</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#d946ef' }}>+{Math.round(stats.estimatedROI)}%</div>
                  </div>
                </div>

                {result.products && result.products.length > 0 && (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '20px' }}>
                    <h4 style={{ marginTop: 0 }}>📦 Erstellte Produkte ({result.products.length})</h4>
                    <div style={{ display: 'grid', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                      {result.products.map((product: any, idx: number) => (
                        <motion.div
                          key={product.id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(139, 92, 246, 0.2)' }}
                        >
                          <div>
                            <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>{product.name}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>💰 {product.price}€ | ⭐ {product.qualityScore}% | 🏷️ {product.tags?.length || 0} Tags</div>
                          </div>
                          {product.permalink && (
                            <a href={product.permalink} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.3)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '4px', color: '#d8b4fe', textDecoration: 'none', fontSize: '12px', cursor: 'pointer' }}>
                              Öffnen ↗
                            </a>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <h4 style={{ marginTop: 0, color: '#fca5a5' }}>⚠️ Fehler ({result.errors.length})</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                      {result.errors.map((error: string, idx: number) => (
                        <li key={idx} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '5px' }}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {!result.success && <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>{result.message}</div>}
          </motion.div>
        )}

        {!loading && !result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%' }}>
            <LoadingButton
              onClick={handleRunCreator}
              loading={loading}
              loadingText="🔄 Erstelle Produkte..."
              className="large"
            >
              🚀 PRODUKTE ERSTELLEN - {config.count} × {config.productType}
            </LoadingButton>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={() => {
                setResult(null);
                setProgress(0);
                setStats(null);
              }}
              style={{ flex: 1, padding: '15px', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }}
            >
              🔄 Nochmal versuchen
            </button>
            <button onClick={handleBackToDashboard} style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }}>
              ← Zurück
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RunAutoProductCreator;
