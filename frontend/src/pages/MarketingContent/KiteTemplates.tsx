import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const KiteTemplates: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [templateCategory, setTemplateCategory] = useState('email');
  const [industry, setIndustry] = useState('ecommerce');
  const [customization, setCustomization] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [engagementScore, setEngagementScore] = useState<number | null>(null);
  const [_engagementConfidence, setEngagementConfidence] = useState<number | null>(null);
  const [_recommendedCategory, setRecommendedCategory] = useState<any>(null);
  const [performanceForecast, setPerformanceForecast] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);

  const categories = [
    { value: 'email', label: 'E-Mail', icon: '📧', count: 45 },
    { value: 'landing-page', label: 'Landing Page', icon: '🌐', count: 32 },
    { value: 'social-media', label: 'Social Media', icon: '📱', count: 68 },
    { value: 'blog', label: 'Blog', icon: '✍️', count: 28 },
    { value: 'product', label: 'Produkt', icon: '🛍️', count: 52 },
    { value: 'ad', label: 'Werbeanzeige', icon: '📣', count: 38 }
  ];

  const industries = [
    { value: 'ecommerce', label: 'E-Commerce', icon: '🛒' },
    { value: 'saas', label: 'SaaS', icon: '💻' },
    { value: 'agency', label: 'Agentur', icon: '🎨' },
    { value: 'consulting', label: 'Beratung', icon: '💼' },
    { value: 'education', label: 'Bildung', icon: '🎓' },
    { value: 'health', label: 'Gesundheit', icon: '🏥' }
  ];

  const handleLoadTemplate = async () => {
    setLoading(true);
    setError(null);
    setEngagementScore(null);
    setPerformanceForecast(null);

    try {
      const response = await fetch('/api/marketing/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateCategory, industry, customization })
      });
      
      const data = await response.json();
      
      if (data.success && data.template) {
        setSelectedTemplate(data.template);
        showToast(`Template "${data.template.name}" erfolgreich geladen!`, 'success');

        // 🤖 Automatisch ML-Features triggern
        await Promise.all([
          predictEngagement(data.template.content),
          forecastPerformance(data.template.content)
        ]);
      } else {
        throw new Error(data.error || 'Fehler beim Laden des Templates');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🤖 ML: Engagement-Vorhersage
  const predictEngagement = async (content: string) => {
    try {
      const response = await fetch('/api/marketing/templates/predict-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateContent: content,
          templateCategory,
          industry
        })
      });
      
      const data = await response.json();
      if (data.success && data.prediction) {
        setEngagementScore(data.prediction.engagementScore);
        setEngagementConfidence(data.prediction.confidence);
      }
    } catch (_err) {

    }
  };

  // 🤖 ML: Performance-Vorhersage
  const forecastPerformance = async (content: string) => {
    try {
      const response = await fetch('/api/marketing/templates/forecast-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateContent: content,
          templateCategory,
          industry
        })
      });
      
      const data = await response.json();
      if (data.success && data.forecast) {
        setPerformanceForecast(data.forecast);
      }
    } catch (_err) {

    }
  };

  // 🤖 ML: Template optimieren
  const optimizeTemplate = async () => {
    if (!selectedTemplate) return;
    
    setOptimizing(true);
    try {
      const response = await fetch('/api/marketing/templates/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateContent: selectedTemplate.content,
          industry,
          targetAudience: customization
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('Template optimiert!', 'success');
        // Update template mit optimiertem Content
        setSelectedTemplate({
          ...selectedTemplate,
          content: data.optimized.optimized_copy || selectedTemplate.content
        });
      }
    } catch (_err) {
      showToast('Optimierung fehlgeschlagen', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  // 🤖 ML: Kategorie empfehlen
  const getRecommendedCategory = async () => {
    if (!customization) {
      showToast('Bitte geben Sie Produktinfo ein', 'error');
      return;
    }

    try {
      const response = await fetch('/api/marketing/templates/recommend-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo: customization,
          targetAudience: industry
        })
      });
      
      const data = await response.json();
      if (data.success && data.recommendation) {
        setRecommendedCategory(data.recommendation);
        setTemplateCategory(data.recommendation.recommendedCategory);
        showToast(
          `Empfohlen: ${data.recommendation.recommendedCategory} (Confidence: ${(data.recommendation.confidence * 100).toFixed(0)}%)`,
          'success'
        );
      }
    } catch (_err) {
      showToast('Empfehlung fehlgeschlagen', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedTemplate) return;

    const element = document.createElement('a');
    const file = new Blob([selectedTemplate.content], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Template heruntergeladen!', 'success');
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    // Kopiere Template-Code in Zwischenablage
    navigator.clipboard.writeText(selectedTemplate.content).then(() => {
      showToast('Template in Zwischenablage kopiert!', 'success');
    }).catch(() => {
      showToast('Fehler beim Kopieren', 'error');
    });
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />
      
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>🪁 Kite Templates</h1>
        <p>Professionelle Templates für schnelles Marketing</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🔍 Template Suche</h3>

          <div className="form-group">
            <label>Template-Kategorie</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {categories.map(cat => (
                <motion.div key={cat.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTemplateCategory(cat.value)}
                  style={{ padding: '12px', background: templateCategory === cat.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: templateCategory === cat.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                    <div><div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{cat.label}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{cat.count} Templates</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Branche</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {industries.map(ind => (
                <motion.div key={ind.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIndustry(ind.value)}
                  style={{ padding: '12px', background: industry === ind.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                    border: industry === ind.value ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{ind.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{ind.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Anpassungen (optional)</label>
            <textarea value={customization} onChange={(e) => setCustomization(e.target.value)} placeholder="Besondere Anpassungswünsche..." className="form-textarea" rows={4} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
            <LoadingButton onClick={handleLoadTemplate} loading={loading} loadingText="Lade...">
              🪁 Template Laden
            </LoadingButton>
            <button 
              onClick={getRecommendedCategory}
              style={{ padding: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              disabled={loading}
            >
              🤖 KI Kategorie
            </button>
          </div>
        </motion.div>

        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📄 Template Preview</h3>
          {selectedTemplate ? (
            <div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ color: 'white', marginBottom: '8px' }}>{selectedTemplate.name}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '12px' }}>{selectedTemplate.description}</p>
                  </div>
                  
                  {/* 🤖 ML Badges */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {engagementScore !== null && (
                      <div style={{ padding: '6px 12px', background: engagementScore >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)', border: `1px solid ${engagementScore >= 75 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(249, 115, 22, 0.5)'}`, borderRadius: '6px', fontSize: '11px', color: 'white' }}>
                        📊 {engagementScore}% Engagement
                      </div>
                    )}
                    {performanceForecast && (
                      <div style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: '6px', fontSize: '11px', color: 'white' }}>
                        📈 Conv: {performanceForecast.estimatedConversionRate?.toFixed(1) || 3.2}%
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                  Kategorie: {selectedTemplate.category} • Branche: {selectedTemplate.industry}
                </div>
              </div>

              {/* Preview iFrame */}
              <div style={{ marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', height: '300px' }}>
                <iframe
                  srcDoc={selectedTemplate.content}
                  style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
                  title="Template Preview"
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Performance Details */}
              {performanceForecast && (
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>📊 Performance-Vorhersage:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>Open Rate</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{performanceForecast.estimatedOpenRate?.toFixed(1) || 22.5}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>Click Rate</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{performanceForecast.estimatedClickThroughRate?.toFixed(1) || 2.8}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>Benchmark</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        {performanceForecast.benchmark === 'above' ? '⬆️ Über' : performanceForecast.benchmark === 'below' ? '⬇️ Unter' : '➡️ Durch.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
                <button 
                  onClick={handleUseTemplate}
                  style={{ padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  📋 In Zwischenablage
                </button>
                <button 
                  onClick={handleDownloadTemplate}
                  style={{ padding: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  📥 Download HTML
                </button>
              </div>

              <button 
                onClick={optimizeTemplate}
                disabled={optimizing}
                style={{ padding: '12px', width: '100%', background: optimizing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '8px', color: 'white', cursor: optimizing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                {optimizing ? '🔄 Optimiere...' : '✨ Template Optimieren'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎨</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Wähle Kategorie & Branche aus</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default KiteTemplates;