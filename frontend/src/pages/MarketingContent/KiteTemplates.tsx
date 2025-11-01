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

    try {
      const response = await fetch('http://localhost:3000/api/marketing/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateCategory, industry, customization })
      });
      
      const data = await response.json();
      
      if (data.success && data.template) {
        setSelectedTemplate(data.template);
        showToast(`Template "${data.template.name}" erfolgreich geladen!`, 'success');
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

          <LoadingButton onClick={handleLoadTemplate} loading={loading} loadingText="Lade...">
            🪁 Template Laden
          </LoadingButton>
        </motion.div>

        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📄 Template Preview</h3>
          {selectedTemplate ? (
            <div><div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '12px' }}>
              <h4 style={{ color: 'white', marginBottom: '8px' }}>{selectedTemplate.name}</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>{selectedTemplate.description}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <button style={{ padding: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>✔️ Verwenden</button>
              <button style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>📥 Download</button>
            </div></div>
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