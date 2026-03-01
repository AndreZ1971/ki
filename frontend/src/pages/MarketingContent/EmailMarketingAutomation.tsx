// src/pages/MarketingContent/EmailMarketingAutomation.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

type Tone = 'professional' | 'friendly' | 'enthusiastic' | 'informative';
type LengthMode = 'short' | 'medium' | 'long';
type Formality = 'du' | 'sie';

type GeneratedEmail = {
  subjectLines?: string[];
  previewText?: string;
  body?: string;
  ctas?: string[];
  personalizationHints?: string[];
  followUps?: string[];
  abTests?: { variant: string; subject: string; angle: string }[];
  wordCount?: number;
  readTimeMinutes?: number;
};

const EmailMarketingAutomation: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [campaignName, setCampaignName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [targetSegment, setTargetSegment] = useState('all');
  const [sendTime, setSendTime] = useState('immediate');
  const [tone, setTone] = useState<Tone>('professional');
  const [lengthMode, setLengthMode] = useState<LengthMode>('medium');
  const [formality, setFormality] = useState<Formality>('du');
  const [valueProps, setValueProps] = useState('');
  const [avoidTerms, setAvoidTerms] = useState('');
  const [ctaStyle, setCtaStyle] = useState('');
  const [campaignStats, setCampaignStats] = useState({ sent: 0, opened: 0, clicked: 0 });
  const [segments, setSegments] = useState([
    { value: 'all', label: 'Alle Kunden', icon: '👥', count: '...' },
    { value: 'new', label: 'Neue Kunden', icon: '🆕', count: '...' },
    { value: 'active', label: 'Aktive Kunden', icon: '⭐', count: '...' },
    { value: 'inactive', label: 'Inaktive Kunden', icon: '😴', count: '...' }
  ]);
  const [segmentMetadata, setSegmentMetadata] = useState<{ mode: 'real' | 'fallback'; dataCompleteness: boolean }>({ mode: 'real', dataCompleteness: false });
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);

  // Lade echte Kundendaten aus WooCommerce
  React.useEffect(() => {
    const loadCustomerSegments = async () => {
      try {
        const response = await fetch('/api/customers/segments', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`API Error ${response.status}`);
        }
        const data = await response.json();
        const seg = data.data || { all: 0, new: 0, active: 0, inactive: 0 };

        setSegments([
          { value: 'all', label: 'Alle Kunden', icon: '👥', count: seg.all.toString() },
          { value: 'new', label: 'Neue Kunden', icon: '🆕', count: seg.new.toString() },
          { value: 'active', label: 'Aktive Kunden', icon: '⭐', count: seg.active.toString() },
          { value: 'inactive', label: 'Inaktive Kunden', icon: '😴', count: seg.inactive.toString() }
        ]);
        // REAL Daten vom Backend erhalten
        setSegmentMetadata({ mode: 'real', dataCompleteness: true });
      } catch (err) {
        console.warn('Customer segments API failed - using fallback', err instanceof Error ? err.message : 'Unknown error');
        // FALLBACK: Sichere Default-Werte
        setSegments([
          { value: 'all', label: 'Alle Kunden', icon: '👥', count: '0 (fallback)' },
          { value: 'new', label: 'Neue Kunden', icon: '🆕', count: '0 (fallback)' },
          { value: 'active', label: 'Aktive Kunden', icon: '⭐', count: '0 (fallback)' },
          { value: 'inactive', label: 'Inaktive Kunden', icon: '😴', count: '0 (fallback)' }
        ]);
        // FALLBACK Daten - eindeutig gekennzeichnet
        setSegmentMetadata({ mode: 'fallback', dataCompleteness: false });
      }
    };
    
    loadCustomerSegments();
  }, []);

  const scheduleOptions = [
    { value: 'immediate', label: 'Sofort senden', icon: '⚡', description: 'Direkt nach Erstellung' },
    { value: 'scheduled', label: 'Geplant', icon: '📅', description: 'Zu bestimmter Zeit' },
    { value: 'automated', label: 'Automatisiert', icon: '🤖', description: 'Trigger-basiert' }
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professionell', icon: '💼', description: 'Klar & seriös' },
    { value: 'friendly', label: 'Freundlich', icon: '😊', description: 'Locker & nahbar' },
    { value: 'enthusiastic', label: 'Enthusiastisch', icon: '🚀', description: 'Energiegeladen' },
    { value: 'informative', label: 'Informativ', icon: '📚', description: 'Nutzwert & Fakten' }
  ];

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !emailSubject.trim() || !emailContent.trim()) {
      showToast('Bitte füllen Sie alle erforderlichen Felder aus', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketing/email/send-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignName, 
          emailSubject, 
          emailContent,
          targetSegment, 
          sendTime 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCampaignStats({
          sent: data.stats?.sent || 0,
          opened: 0,
          clicked: 0
        });
        showToast(data.message || `E-Mails erfolgreich gesendet!`, 'success');
        setCampaignName('');
        setEmailSubject('');
        setEmailContent('');
        setTargetSegment('all');
        setSendTime('immediate');
      } else {
        throw new Error(data.error || 'Fehler beim Senden der E-Mails');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!campaignName.trim() && !productDescription.trim() && !emailSubject.trim()) {
      showToast('Bitte gib mindestens Kampagnenname oder Produktbeschreibung an', 'error');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketing/email/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          goal: campaignName,
          productDescription,
          targetAudience: targetSegment,
          tone,
          lengthMode,
          formality,
          valueProps,
          avoidTerms,
          ctaStyle,
          sendTime
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result: GeneratedEmail = await response.json();
      setGeneratedEmail(result);

      if (result.subjectLines?.[0]) {
        setEmailSubject(result.subjectLines[0]);
      }
      if (result.body) {
        setEmailContent(result.body);
      }

      showToast('KI-Kampagne generiert', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setAiLoading(false);
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
        <h1>✉️ Email Marketing Automation</h1>
        <p>Komplette Email-Marketing Automatisierung</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      {/* Data Availability Row */}
      {!segmentMetadata.dataCompleteness && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: segmentMetadata.mode === 'fallback' ? 'rgba(255,159,64,0.1)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${segmentMetadata.mode === 'fallback' ? 'rgba(255,159,64,0.3)' : 'rgba(59,130,246,0.3)'}`,
            borderRadius: '12px', 
            padding: '12px 16px',
            marginTop: '20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '18px' }}>
            {segmentMetadata.mode === 'fallback' ? '⚠️' : 'ℹ️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: segmentMetadata.mode === 'fallback' ? '#ff9f0a' : '#3b82f6', marginBottom: '2px' }}>
              {segmentMetadata.mode === 'fallback' ? 'Fallback Mode' : 'Source Information'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
              {segmentMetadata.mode === 'fallback' 
                ? 'Kundensegmente nicht erreichbar - verwende Fallback-Daten'
                : 'Kundensegmente werden in Echtzeit von WooCommerce geladen'
              }
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {/* Kampagnen-Erstellung */}
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📝 Neue Kampagne</h3>

          <div className="form-group">
            <label>Kampagnen-Name *</label>
            <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="z.B. Willkommens-Serie 2024" className="form-input" />
          </div>

          <div className="form-group">
            <label>E-Mail Betreff *</label>
            <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="z.B. Willkommen bei unserem Shop!" className="form-input" />
          </div>

          <div className="form-group">
            <label>E-Mail Inhalt *</label>
            <textarea 
              value={emailContent} 
              onChange={(e) => setEmailContent(e.target.value)} 
              placeholder="Ihre E-Mail Nachricht..." 
              className="form-input" 
              rows={6}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div className="form-group">
            <label>Produkt / Angebot (für KI) *</label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Was soll verkauft / vorgestellt werden?"
              className="form-input"
              rows={4}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div className="form-group">
            <label>Zielgruppe</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {segments.map(seg => (
                <motion.div key={seg.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTargetSegment(seg.value)}
                  style={{ padding: '12px', background: targetSegment === seg.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: targetSegment === seg.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{seg.icon}</span>
                    <div><div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{seg.label}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{seg.count} Kunden</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Versandzeitpunkt</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '10px' }}>
              {scheduleOptions.map(opt => (
                <motion.div key={opt.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSendTime(opt.value)}
                  style={{ padding: '12px', background: sendTime === opt.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                    border: sendTime === opt.value ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{opt.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{opt.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{opt.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <LoadingButton onClick={handleCreateCampaign} loading={loading} loadingText="Erstelle...">
            🚀 Kampagne Erstellen
          </LoadingButton>
        </motion.div>

        {/* Stats Dashboard */}
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Kampagnen-Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>{campaignStats.sent}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Gesendet</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>{campaignStats.opened}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Geöffnet</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>{campaignStats.clicked}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Geklickt</div>
            </div>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📈</div>
            <p style={{ margin: 0 }}>Stats werden nach Kampagnen-Start angezeigt</p>
          </div>
        </motion.div>
      </div>

      <div className="marketing-ml-section">
        <h3>KI E-Mail Assistent</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h4 style={{ color: 'white', marginBottom: '12px' }}>Briefing</h4>

            <div className="form-group">
              <label>Ton & Länge</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '8px' }}>
                <select className="form-input" value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                  {toneOptions.map((t) => (
                    <option key={t.value} value={t.value}>{`${t.icon} ${t.label}`}</option>
                  ))}
                </select>
                <select className="form-input" value={lengthMode} onChange={(e) => setLengthMode(e.target.value as LengthMode)}>
                  <option value="short">Kurz</option>
                  <option value="medium">Mittel</option>
                  <option value="long">Lang</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Formulierung</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
                {['du', 'sie'].map((mode) => (
                  <motion.div
                    key={mode}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFormality(mode as Formality)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: formality === mode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                      border: formality === mode ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      color: 'white',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}
                  >
                    {mode === 'du' ? 'Du-Ansprache' : 'Sie-Ansprache'}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Werteversprechen / USPs</label>
              <textarea
                value={valueProps}
                onChange={(e) => setValueProps(e.target.value)}
                placeholder="Bullet Points oder Kommagetrennt"
                className="form-input"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Vermeiden</label>
              <textarea
                value={avoidTerms}
                onChange={(e) => setAvoidTerms(e.target.value)}
                placeholder="z.B. Rabattschlacht, zu aggressiver Ton"
                className="form-input"
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>CTA-Stil</label>
              <input
                type="text"
                value={ctaStyle}
                onChange={(e) => setCtaStyle(e.target.value)}
                placeholder="z.B. Demo buchen, Jetzt testen"
                className="form-input"
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <LoadingButton onClick={handleGenerateWithAI} loading={aiLoading} loadingText="Generiere...">
                🤖 KI-E-Mail erstellen
              </LoadingButton>
            </div>
          </motion.div>

          <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h4 style={{ color: 'white', marginBottom: '12px' }}>KI-Vorschlag</h4>
            {generatedEmail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {generatedEmail.subjectLines && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Betreff-Ideen</strong>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        {generatedEmail.readTimeMinutes || Math.max(1, Math.round((generatedEmail.wordCount || 0) / 180))} min · {generatedEmail.wordCount || '--'} Wörter
                      </span>
                    </div>
                    <ul style={{ margin: '8px 0 0 16px' }}>
                      {generatedEmail.subjectLines.map((line, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ flex: 1 }}>{line}</span>
                          <button className="secondary-button" onClick={() => setEmailSubject(line)}>Übernehmen</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedEmail.previewText && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                    <strong>Preview-Text:</strong>
                    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.85)' }}>{generatedEmail.previewText}</div>
                  </div>
                )}

                {generatedEmail.body && (
                  <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', whiteSpace: 'pre-wrap' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                      <span>KI-Body</span>
                      <button className="secondary-button" onClick={() => setEmailContent(generatedEmail.body || '')}>In Formular übernehmen</button>
                    </div>
                    {generatedEmail.body}
                  </div>
                )}

                {generatedEmail.ctas && generatedEmail.ctas.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                    <strong>CTA-Ideen:</strong>
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {generatedEmail.ctas.map((cta, idx) => (
                        <span key={idx} style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.35)', fontSize: '12px' }}>{cta}</span>
                      ))}
                    </div>
                  </div>
                )}

                {generatedEmail.followUps && generatedEmail.followUps.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                    <strong>Follow-ups:</strong>
                    <ul style={{ margin: '8px 0 0 16px' }}>
                      {generatedEmail.followUps.map((f, idx) => <li key={idx}>{f}</li>)}
                    </ul>
                  </div>
                )}

                {generatedEmail.personalizationHints && generatedEmail.personalizationHints.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                    <strong>Personalisierung:</strong>
                    <ul style={{ margin: '8px 0 0 16px' }}>
                      {generatedEmail.personalizationHints.map((p, idx) => <li key={idx}>{p}</li>)}
                    </ul>
                  </div>
                )}

                {generatedEmail.abTests && generatedEmail.abTests.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                    <strong>A/B Varianten:</strong>
                    <ul style={{ margin: '8px 0 0 16px' }}>
                      {generatedEmail.abTests.map((variant, idx) => (
                        <li key={idx}>{variant.variant}: {variant.subject} ({variant.angle})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ fontSize: '46px', marginBottom: '8px' }}>🤖</div>
                <div>Briefing ausfüllen und KI starten</div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EmailMarketingAutomation;