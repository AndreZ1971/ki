// src/pages/MarketingContent/GermanContentGenerator.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const GermanContentGenerator: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [contentType, setContentType] = useState('blog-post');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const contentTypes = [
    { value: 'blog-post', label: 'Blog-Beitrag', icon: '📝', description: 'SEO-optimierte Artikel' },
    { value: 'product-description', label: 'Produktbeschreibung', icon: '🛍️', description: 'Verkaufsstarke Texte' },
    { value: 'social-media', label: 'Social Media', icon: '📱', description: 'Engaging Posts' },
    { value: 'email', label: 'E-Mail Marketing', icon: '📧', description: 'Newsletter & Kampagnen' },
    { value: 'landing-page', label: 'Landing Page', icon: '🎯', description: 'Conversion-optimiert' },
    { value: 'press-release', label: 'Pressemitteilung', icon: '📰', description: 'Professionelle PR' }
  ];

  const tones = [
    { value: 'professional', label: 'Professionell', icon: '💼', description: 'Seriös & kompetent' },
    { value: 'friendly', label: 'Freundlich', icon: '😊', description: 'Sympathisch & nahbar' },
    { value: 'enthusiastic', label: 'Enthusiastisch', icon: '🚀', description: 'Begeisternd & energisch' },
    { value: 'informative', label: 'Informativ', icon: '📚', description: 'Sachlich & lehrreich' }
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast('Bitte gib ein Thema ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/marketing/content/german`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          topic,
          targetAudience,
          tone
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      setGeneratedContent(result.content || 'Content wurde generiert');
      showToast('Content erfolgreich generiert!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('In Zwischenablage kopiert!', 'success');
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
        <h1>🇩🇪 German Content Generator</h1>
        <p>Deutsche Content-Erstellung für lokales Marketing</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {/* Linke Spalte: Eingabe-Formular */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            ⚙️ Einstellungen
          </h3>

          {/* Content-Typ Auswahl - Grid */}
          <div className="form-group">
            <label>Content-Typ wählen</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {contentTypes.map(type => (
                <motion.div
                  key={type.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setContentType(type.value)}
                  style={{
                    padding: '14px',
                    background: contentType === type.value 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: contentType === type.value 
                      ? '2px solid rgba(102, 126, 234, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                    {type.label}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>
                    {type.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Thema */}
          <div className="form-group">
            <label>Thema / Produkt *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. DSGVO-konforme Software"
              className="form-input"
            />
          </div>

          {/* Zielgruppe */}
          <div className="form-group">
            <label>Zielgruppe (optional)</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="z.B. KMU in Deutschland"
              className="form-input"
            />
          </div>

          {/* Ton Auswahl - Grid */}
          <div className="form-group">
            <label>Schreibstil wählen</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {tones.map(t => (
                <motion.div
                  key={t.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTone(t.value)}
                  style={{
                    padding: '12px',
                    background: tone === t.value 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: tone === t.value 
                      ? '2px solid rgba(16, 185, 129, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{t.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{t.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>
                    {t.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <LoadingButton
              onClick={handleGenerate}
              loading={loading}
              loadingText="Generiere Content..."
            >
              🚀 Content Generieren
            </LoadingButton>
          </div>
        </motion.div>

        {/* Rechte Spalte: Content-Vorschau */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            👁️ Vorschau
          </h3>

          {generatedContent ? (
            <>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '15px',
                maxHeight: '400px',
                overflowY: 'auto',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {generatedContent}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => copyToClipboard(generatedContent)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📋 Kopieren
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setGeneratedContent(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Neu generieren
                </motion.button>
              </div>
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: 'rgba(255,255,255,0.5)' 
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
              <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Kein Content generiert</p>
              <p style={{ fontSize: '14px', margin: 0 }}>Fülle das Formular aus und klicke auf "Content Generieren"</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GermanContentGenerator;