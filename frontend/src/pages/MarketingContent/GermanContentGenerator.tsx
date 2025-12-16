// src/pages/MarketingContent/GermanContentGenerator.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

type GeneratedResult = {
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  headlines?: string[];
  faqs?: { question: string; answer: string }[];
  ctas?: string[];
  keywords?: string[];
  wordCount?: number;
  readTimeMinutes?: number;
};

const GermanContentGenerator: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [contentType, setContentType] = useState('blog-post');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [lengthMode, setLengthMode] = useState<'short' | 'medium' | 'long'>('medium');
  const [formality, setFormality] = useState<'du' | 'sie'>('du');
  const [includeSeo, setIncludeSeo] = useState(true);
  const [includeFaqs, setIncludeFaqs] = useState(true);
  const [includeCtas, setIncludeCtas] = useState(true);
  const [keywords, setKeywords] = useState('');
  const [avoidTerms, setAvoidTerms] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedResult | null>(null);

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
          tone,
          lengthMode,
          formality,
          includeSeo,
          includeFaqs,
          includeCtas,
          keywords,
          avoidTerms
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      setGeneratedContent(result);
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
        <h1>Content Generator</h1>
        <p>Content-Erstellung für lokales Marketing</p>
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

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Länge & Formalität</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '8px' }}>
                <select className="form-input" value={lengthMode} onChange={(e) => setLengthMode(e.target.value as 'short' | 'medium' | 'long')}>
                  <option value="short">Kurz</option>
                  <option value="medium">Mittel</option>
                  <option value="long">Lang</option>
                </select>
                <select className="form-input" value={formality} onChange={(e) => setFormality(e.target.value as 'du' | 'sie')}>
                  <option value="du">Du</option>
                  <option value="sie">Sie</option>
                </select>
              </div>
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

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Keywords / USPs (optional)</label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Kommagetrennt: KI, Automatisierung, B2B"
                className="form-input"
                style={{ minHeight: '70px' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Zu vermeidende Begriffe (optional)</label>
              <textarea
                value={avoidTerms}
                onChange={(e) => setAvoidTerms(e.target.value)}
                placeholder="z.B. billig, kostenlos"
                className="form-input"
                style={{ minHeight: '60px' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Zusatz-Optionen</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
                  <input type="checkbox" checked={includeSeo} onChange={(e) => setIncludeSeo(e.target.checked)} />
                  SEO-Elemente
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
                  <input type="checkbox" checked={includeFaqs} onChange={(e) => setIncludeFaqs(e.target.checked)} />
                  FAQs
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
                  <input type="checkbox" checked={includeCtas} onChange={(e) => setIncludeCtas(e.target.checked)} />
                  CTAs
                </label>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '20px',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  <span>~{generatedContent.readTimeMinutes || Math.max(1, Math.round((generatedContent.wordCount || 0)/180))} Min. Lesezeit</span>
                  <span>{generatedContent.wordCount || '--'} Wörter</span>
                </div>
                {generatedContent.content}
              </div>

              {generatedContent.metaTitle && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                  <strong>Meta Title:</strong> {generatedContent.metaTitle}
                  <div style={{ marginTop: '6px' }}><strong>Meta Description:</strong> {generatedContent.metaDescription}</div>
                </div>
              )}

              {(generatedContent.headlines && generatedContent.headlines.length > 0) && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                  <strong>Headlines:</strong>
                  <ul style={{ margin: '8px 0 0 16px' }}>
                    {generatedContent.headlines.map((h, idx) => <li key={idx}>{h}</li>)}
                  </ul>
                </div>
              )}

              {(generatedContent.faqs && generatedContent.faqs.length > 0) && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                  <strong>FAQs:</strong>
                  <ul style={{ margin: '8px 0 0 16px' }}>
                    {generatedContent.faqs.map((f, idx) => <li key={idx}><strong>{f.question}</strong><br />{f.answer}</li>)}
                  </ul>
                </div>
              )}

              {(generatedContent.ctas && generatedContent.ctas.length > 0) && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                  <strong>CTAs:</strong>
                  <ul style={{ margin: '8px 0 0 16px' }}>
                    {generatedContent.ctas.map((c, idx) => <li key={idx}>{c}</li>)}
                  </ul>
                </div>
              )}

              {(generatedContent.keywords && generatedContent.keywords.length > 0) && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                  <strong>Keywords:</strong>
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {generatedContent.keywords.map((k, idx) => (
                      <span key={idx} style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', fontSize: '12px' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => copyToClipboard(generatedContent.content)}
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
            </div>
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