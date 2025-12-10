// src/pages/MarketingContent/SocialMediaAudio.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

type GeneratedScript = {
  script?: string;
  hooks?: string[];
  ctas?: string[];
  voiceRecommendations?: {
    recommended: string;
    alternatives: string[];
  };
  platformTips?: string[];
  wordCount?: number;
  estimatedDuration?: string;
  readTimeMinutes?: number;
};

const SocialMediaAudio: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [audioText, setAudioText] = useState('');
  const [voice, setVoice] = useState('neutral');
  const [platform, setPlatform] = useState('instagram');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // KI Script Generation
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'casual' | 'professional' | 'energetic' | 'educational'>('casual');
  const [targetAudience, setTargetAudience] = useState('');
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || '';

  const voices = [
    { value: 'neutral', label: 'Neutral', icon: '😐', description: 'Ausgewogene Stimme' },
    { value: 'friendly', label: 'Freundlich', icon: '😊', description: 'Warme, einladende Stimme' },
    { value: 'professional', label: 'Professionell', icon: '👔', description: 'Business-Stimme' },
    { value: 'energetic', label: 'Energetisch', icon: '⚡', description: 'Dynamische Stimme' }
  ];

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: '📸', duration: '60s' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵', duration: '3min' },
    { value: 'youtube', label: 'YouTube Shorts', icon: '▶️', duration: '60s' },
    { value: 'facebook', label: 'Facebook', icon: '👍', duration: '10min' }
  ];

  const toneOptions = [
    { value: 'casual', label: 'Locker', icon: '😄', description: 'Freundlich & entspannt' },
    { value: 'professional', label: 'Professionell', icon: '💼', description: 'Seriös & kompetent' },
    { value: 'energetic', label: 'Energetig', icon: '🚀', description: 'Dynamisch & packend' },
    { value: 'educational', label: 'Lehrreich', icon: '📚', description: 'Informativ & wertvoll' }
  ];

  const durationOptions = [
    { value: 'short', label: 'Kurz', duration: '30-45s', description: 'TikTok/Reels' },
    { value: 'medium', label: 'Mittel', duration: '60-90s', description: 'Standard Content' },
    { value: 'long', label: 'Lang', duration: '120-180s', description: 'Deep Dive' }
  ];

  const handleGenerateScript = async () => {
    if (!topic.trim()) {
      showToast('Bitte gib ein Thema ein', 'error');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/marketing/social/audio/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          platform,
          tone,
          targetAudience,
          duration,
          hooks: 3,
          ctas: 2,
          useEmojis: true
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result: GeneratedScript = await response.json();
      setGeneratedScript(result);

      if (result.script) {
        setAudioText(result.script);
      }

      // Auto-set voice basierend auf Empfehlung
      if (result.voiceRecommendations?.recommended) {
        const voiceMap: Record<string, string> = {
          'alloy': 'neutral',
          'nova': 'friendly',
          'onyx': 'professional',
          'fable': 'energetic'
        };
        setVoice(voiceMap[result.voiceRecommendations.recommended] || 'neutral');
      }

      showToast('Skript generiert! 🎉', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!audioText.trim()) {
      showToast('Bitte gib einen Text ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/marketing/social/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioText, voice, platform })
      });
      
      const data = await response.json();
      
      if (data.success && data.audio) {
        setGeneratedAudio(data.audio.data); // Base64 data URL
        setAudioDuration(data.audio.duration);
        showToast(`Audio erfolgreich generiert! (${data.audio.duration}s)`, 'success');
      } else {
        throw new Error(data.error || 'Fehler beim Generieren des Audios');
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
        <h1>🎵 Social Media Audio</h1>
        <p>Audio-Beiträge für Social Media mit KI-Unterstützung</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      {/* 2x2 Layout: Generatoren oben, Ergebnisse unten */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
        {/* KI Script Generation Section */}
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🤖 KI Script Generator</h3>

          <div className="form-group">
            <label>Thema *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Produktlaunch, Tipps, Story..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Plattform</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
              {platforms.map(p => (
                <motion.div
                  key={p.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPlatform(p.value)}
                  style={{
                    padding: '10px',
                    background: platform === p.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                    border: platform === p.value ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{p.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{p.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Ton & Länge</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
              <select className="form-input" value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}>
                {toneOptions.map((t) => (
                  <option key={t.value} value={t.value}>{`${t.icon} ${t.label}`}</option>
                ))}
              </select>
              <select className="form-input" value={duration} onChange={(e) => setDuration(e.target.value as typeof duration)}>
                {durationOptions.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Zielgruppe (optional)</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="z.B. Anfänger, Profis, Unternehmer..."
              className="form-input"
            />
          </div>

          <LoadingButton onClick={handleGenerateScript} loading={aiLoading} loadingText="Generiere...">
            ✨ Skript mit KI erstellen
          </LoadingButton>
        </motion.div>

        {/* Audio Studio Section (Text zu Audio) */}
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🎙️ Audio Studio</h3>

          <div className="form-group">
            <label>Text für Audio *</label>
            <textarea
              value={audioText}
              onChange={(e) => setAudioText(e.target.value)}
              placeholder="Gib den Text ein, der in Audio umgewandelt werden soll..."
              className="form-textarea"
              rows={5}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label>Stimme</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {voices.map(v => (
                <motion.div key={v.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setVoice(v.value)}
                  style={{ padding: '12px', background: voice === v.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: voice === v.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{v.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{v.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{v.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <LoadingButton onClick={handleGenerateAudio} loading={loading} loadingText="Generiere...">
            🎵 Audio Generieren
          </LoadingButton>
        </motion.div>
      </div>

      {/* Ergebnisse darunter: 2x2 Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
        {/* KI Results Section */}
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📋 Generiertes Skript</h3>
          {generatedScript ? (
            <div>
              {generatedScript.script && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {generatedScript.script}
                  </div>
                </div>
              )}
              {generatedScript.hooks && generatedScript.hooks.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '6px' }}>🎣 Hooks:</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                    {generatedScript.hooks.join(' • ')}
                  </div>
                </div>
              )}
              {generatedScript.ctas && generatedScript.ctas.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '6px' }}>📢 CTAs:</div>
                  {generatedScript.ctas.map((cta, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>• {cta}</div>
                  ))}
                </div>
              )}
              {generatedScript.voiceRecommendations && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '6px' }}>🎤 Voice Empfehlung:</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                    Empfohlen: {generatedScript.voiceRecommendations.recommended}<br/>
                    Alternativen: {generatedScript.voiceRecommendations.alternatives.join(', ')}
                  </div>
                </div>
              )}
              {generatedScript.platformTips && generatedScript.platformTips.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '6px' }}>💡 Plattform-Tipps:</div>
                  {generatedScript.platformTips.map((tip, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>• {tip}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '40px 10px' }}>
              <div style={{ fontSize: '46px', marginBottom: '8px' }}>✨</div>
              <div>Skript mit KI generieren</div>
            </div>
          )}
        </motion.div>

        {/* Audio Preview Section */}
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h3 style={{ color: 'white', marginBottom: '16px' }}>🎧 Audio Preview</h3>
          {generatedAudio ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '8px' }}>✅ Audio erfolgreich generiert</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Dauer: {audioDuration} Sekunden</div>
              </div>
              <audio controls style={{ width: '100%', marginBottom: '16px' }}>
                <source src={generatedAudio} type="audio/mpeg" />
              </audio>
              <a
                href={generatedAudio}
                download={`social-audio-${Date.now()}.mp3`}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                📥 Audio Herunterladen
              </a>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎵</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Noch kein Audio generiert</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SocialMediaAudio;