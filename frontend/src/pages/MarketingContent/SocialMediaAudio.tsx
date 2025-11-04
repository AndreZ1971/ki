// src/pages/MarketingContent/SocialMediaAudio.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const SocialMediaAudio: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [audioText, setAudioText] = useState('');
  const [voice, setVoice] = useState('neutral');
  const [platform, setPlatform] = useState('instagram');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

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

  const handleGenerateAudio = async () => {
    if (!audioText.trim()) {
      showToast('Bitte gib einen Text ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketing/social/audio', {
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
        <p>Audio-Beiträge für Social Media automatisch erstellen</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🎙️ Audio Erstellen</h3>

          <div className="form-group">
            <label>Text für Audio *</label>
            <textarea value={audioText} onChange={(e) => setAudioText(e.target.value)} placeholder="Gib den Text ein, der in Audio umgewandelt werden soll..." className="form-textarea" rows={5} />
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

          <div className="form-group">
            <label>Plattform</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {platforms.map(p => (
                <motion.div key={p.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setPlatform(p.value)}
                  style={{ padding: '12px', background: platform === p.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                    border: platform === p.value ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{p.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>Max {p.duration}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <LoadingButton onClick={handleGenerateAudio} loading={loading} loadingText="Generiere...">
            🎵 Audio Generieren
          </LoadingButton>
        </motion.div>

        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🎧 Audio Preview</h3>
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