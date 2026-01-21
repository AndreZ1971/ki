import React, { useState } from 'react';
import type { JSX } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { AuthGate, type AuthState } from '../../components/AuthGate/AuthGate';
import './page.css';

type GeneratedPost = {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  content: string;
  hashtags?: string[];
  characterCount: number;
  estimatedEngagement?: string;
  suggestions?: string[];
};

const brandIcons: Record<string, JSX.Element> = {
  linkedin: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.024-3.036-1.85-3.036-1.853 0-2.136 1.445-2.136 2.938v5.667H9.354V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11.004-4.124 2.062 2.062 0 01-.004 4.124zM6.813 20.452H3.56V9h3.253v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 24h11.495V14.708h-3.13v-3.62h3.13V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.62h-3.12V24h6.116C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z"
      />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 0C8.741 0 8.332.014 7.052.072 5.771.13 4.629.372 3.678.878c-.986.52-1.798 1.332-2.318 2.318C.854 4.147.612 5.289.554 6.57.496 7.85.482 8.259.482 12c0 3.741.014 4.15.072 5.43.058 1.281.3 2.423.806 3.374.52.986 1.332 1.798 2.318 2.318.951.506 2.093.748 3.374.806 1.28.058 1.689.072 5.43.072 3.741 0 4.15-.014 5.43-.072 1.281-.058 2.423-.3 3.374-.806.986-.52 1.798-1.332 2.318-2.318.506-.951.748-2.093.806-3.374.058-1.28.072-1.689.072-5.43 0-3.741-.014-4.15-.072-5.43-.058-1.281-.3-2.423-.806-3.374-.52-.986-1.332-1.798-2.318-2.318-.951-.506-2.093-.748-3.374-.806C16.15.014 15.741 0 12 0zm0 5.838a6.162 6.162 0 1 1 0 12.324 6.162 6.162 0 0 1 0-12.324zm7.845-1.392a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"
      />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M23.643 4.937c-.835.371-1.732.622-2.675.733.962-.577 1.7-1.49 2.048-2.578-.9.534-1.897.923-2.958 1.135-1.804-1.924-4.83-2.032-6.754-.228-1.174 1.1-1.66 2.726-1.332 4.267-3.86-.194-7.46-2.03-9.798-5.058-1.29 2.213-.63 5.044 1.52 6.477-.78-.026-1.544-.234-2.228-.616v.061c0 2.332 1.624 4.355 3.874 4.814-.71.193-1.452.222-2.17.084.63 1.953 2.445 3.292 4.5 3.332-2.07 1.623-4.77 2.353-7.29 2.04 2.179 1.397 4.768 2.142 7.42 2.142 8.91 0 13.776-7.385 13.48-13.986.927-.67 1.73-1.5 2.368-2.448z"
      />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12.9 0h4.8c.1 1.2.5 2.3 1.2 3.3.7.9 1.7 1.7 2.8 2.1v4.8c-1.5 0-3-.4-4.3-1.1v7.8c0 2.4-1 4.7-2.7 6.3-1.7 1.7-4 2.7-6.3 2.7-5 0-9-4.1-9-9.1 0-5 4-9.1 9-9.1h.9v4.9c-.6-.2-1.3-.2-1.9 0-.6.2-1.2.6-1.6 1.1-.4.5-.7 1.1-.8 1.7-.1.6 0 1.3.3 1.9.3.6.7 1.1 1.3 1.4.6.3 1.2.5 1.9.4.6-.1 1.2-.3 1.7-.7.5-.4.9-.9 1.1-1.5.1-.4.2-.9.2-1.3V0z"
      />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M23.498 6.186a2.974 2.974 0 0 0-2.09-2.103C19.691 3.5 12 3.5 12 3.5s-7.691 0-9.408.583A2.974 2.974 0 0 0 .502 6.186 31.403 31.403 0 0 0 0 12a31.403 31.403 0 0 0 .502 5.814 2.974 2.974 0 0 0 2.09 2.103C4.309 20.5 12 20.5 12 20.5s7.691 0 9.408-.583a2.974 2.974 0 0 0 2.09-2.103A31.403 31.403 0 0 0 24 12a31.403 31.403 0 0 0-.502-5.814zM9.545 15.568V8.432L15.818 12z"
      />
    </svg>
  )
};

const SocialMediaPoster: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  // AI Generator State
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<'casual' | 'professional' | 'energetic' | 'educational'>('casual');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube']));
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [ctaType, setCtaType] = useState<'none' | 'click' | 'engagement' | 'message' | 'like'>('engagement');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [tileContents, setTileContents] = useState<Record<string, string>>({});
  // Removed old inline edit mode in favor of per-tile textareas
  const [error, setError] = useState<string | null>(null);
  const [postStats, setPostStats] = useState({ scheduled: 0, published: 0, engagement: 0 });
  const [aiTransformOnPublish, setAiTransformOnPublish] = useState(true);
  
  // Auth State Management
  const [globalAuthState, setGlobalAuthState] = useState<AuthState | null>(null);
  
  // Integration Options - connected accounts from Settings
  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    facebook: false,
    instagram: false,
    twitter: false,
    tiktok: false,
    youtube: false
  });
  const [youtubeVideoFile, setYoutubeVideoFile] = useState<File | null>(null);
  const [youtubeVideoPreview, setYoutubeVideoPreview] = useState<string>('');

  const apiBase = import.meta.env.VITE_API_URL || '';

  const platformOptions = [
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'facebook', label: 'Facebook', icon: '👍' },
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'twitter', label: 'Twitter', icon: '🐦' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'youtube', label: 'YouTube', icon: '📺' }
  ];

  const toneOptions = [
    { value: 'casual', label: 'Locker', icon: '😄' },
    { value: 'professional', label: 'Professionell', icon: '💼' },
    { value: 'energetic', label: 'Energetisch', icon: '🚀' },
    { value: 'educational', label: 'Lehrreich', icon: '📚' }
  ];

  const ctaOptions = [
    { value: 'none', label: 'Keine CTA', icon: '➖' },
    { value: 'click', label: 'Click/Besuch', icon: '🔗' },
    { value: 'engagement', label: 'Engagement', icon: '👍' },
    { value: 'message', label: 'Nachricht', icon: '💬' },
    { value: 'like', label: 'Like/Share', icon: '❤️' }
  ];
  // Check connection status on mount
  React.useEffect(() => {
    fetch(`${apiBase}/api/auth/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGlobalAuthState(data.authState);
          setConnectedAccounts({
            linkedin: data.accounts?.linkedin?.connected || false,
            facebook: data.accounts?.facebook?.connected || false,
            instagram: data.accounts?.instagram?.connected || false,
            twitter: data.accounts?.twitter?.connected || false,
            tiktok: data.accounts?.tiktok?.connected || false,
            youtube: data.accounts?.youtube?.connected || false
          });
        }
      })
      .catch(() => {
        setGlobalAuthState({
          available: false,
          blocked: true,
          mode: 'error',
          completeness: 0,
          message: 'OAuth-Status konnte nicht geladen werden'
        });
      });
  }, [apiBase]);

  // Sync tile contents whenever new posts are generated
  React.useEffect(() => {
    if (!generatedPosts || generatedPosts.length === 0) return;
    setTileContents(prev => {
      const next = { ...prev };
      generatedPosts.forEach(p => {
        next[p.platform] = p.content || '';
      });
      return next;
    });
  }, [generatedPosts]);

  const handleGenerateWithAI = async () => {
    if (!topic.trim()) {
      showToast('Bitte gib ein Thema ein', 'error');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/marketing/social/generate-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          targetAudience: targetAudience || undefined,
          tone,
          platforms: platformOptions.map(p => p.value),
          includeHashtags,
          includeEmojis,
          ctaType
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedPosts(data.posts);
        if (data.authState) {
          setGlobalAuthState(data.authState);
        }
        showToast('Posts erfolgreich generiert!', 'success');
      } else {
        throw new Error(data.error || 'Fehler bei der Generierung');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generierung fehlgeschlagen';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublishPost = async (platform: string, content: string) => {
    try {
      const supportedWebhookPlatforms = ['linkedin', 'facebook', 'tiktok', 'twitter'];
      
      // YouTube needs special handling for video upload
      if (platform === 'youtube') {
        if (!youtubeVideoFile) {
          showToast('Bitte lade ein Video für YouTube hoch', 'error');
          return;
        }

        // Check file size (max 100MB for YouTube uploads via API)
        const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
        if (youtubeVideoFile.size > MAX_VIDEO_SIZE) {
          showToast('Video zu groß! Max. 100 MB. Bitte komprimiere das Video.', 'error');
          return;
        }

        showToast('⏳ Video wird hochgeladen...', 'info');

        // Use FormData for direct file upload (no base64)
        const formData = new FormData();
        formData.append('platform', 'youtube');
        formData.append('content', content);
        formData.append('video', youtubeVideoFile);
        formData.append('videoTitle', tileContents['youtube']?.substring(0, 100) || 'Video');
        formData.append('videoDescription', content);
        formData.append('videoTags', JSON.stringify(content.match(/#\w+/g)?.map((tag: string) => tag.substring(1)) || []));

        try {
          const response = await fetch(`${apiBase}/api/social/post`, {
            method: 'POST',
            body: formData
            // Don't set Content-Type header - browser will set it with boundary
          });

          const data = await response.json();
          
          if (!response.ok) {
            showToast(`YouTube Upload Fehler: ${data.error || response.statusText}`, 'error');
            console.error('Backend error:', data);
            return;
          }
          
          if (data.success && data.results && data.results.youtube) {
            showToast(`✅ Video erfolgreich auf YouTube hochgeladen: ${data.results.youtube.url}`, 'success');
            setPostStats(prev => ({ ...prev, published: prev.published + 1 }));
          } else {
            const errorMsg = data.results?.youtube?.error || data.error || 'Unbekannter Fehler';
            showToast(`Fehler: ${errorMsg}`, 'error');
          }
        } catch (err) {
          showToast('Fehler beim YouTube-Upload. Bitte versuche es später erneut.', 'error');
          console.error('YouTube upload error:', err);
        }
        return;
      }

      if (!supportedWebhookPlatforms.includes(platform)) {
        showToast('Diese Plattform wird noch nicht unterstützt', 'error');
        return;
      }
      if (!connectedAccounts[platform as keyof typeof connectedAccounts]) {
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} ist nicht verbunden. Konfigurieren Sie die Credentials in den Einstellungen.`, 'error');
        return;
      }

      const response = await fetch(`${apiBase}/api/social/webhook/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          content,
          scheduleTime: 'now',
          useAI: aiTransformOnPublish
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Post auf ${platform} veröffentlicht!`, 'success');
        setPostStats(prev => ({
          ...prev,
          published: prev.published + 1
        }));
      } else {
        throw new Error(data.error || 'Veröffentlichung fehlgeschlagen');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler';
      showToast(errorMessage, 'error');
    }
  };

  // Deprecated inline edit removed; edits captured via tileContents

  const togglePlatform = (platformValue: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platformValue)) next.delete(platformValue); else next.add(platformValue);
      return next;
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
        <h1>📱 Social Media Poster</h1>
        <p>KI-generierte Posts optimiert für jede Plattform</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <AuthGate 
        authState={globalAuthState}
        toolName="Social Media Poster"
        requiredPlatforms={['LinkedIn', 'Facebook', 'Instagram', 'Twitter', 'TikTok', 'YouTube']}
      >
      {/* 2-Column Layout: Left = Post-Inhalt, Right = Plattform-Auswahl; Posts unten full-width */}
      <div className="social-poster-input-grid">
        {/* Left: KI Post Generator Briefing */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📝 Post-Inhalt *</h3>

          <div className="form-group">
            <label>Post-Inhalt *</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Schreibe hier deinen Basis-Post-Text..."
              className="form-textarea"
              rows={3}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label>Zielgruppe (optional)</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="z.B. Unternehmer, Studenten, Anfänger..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Ton</label>
            <div className="social-poster-select-grid">
              {toneOptions.map(t => (
                <div
                  key={t.value}
                  className={`social-poster-select-card ${tone === t.value ? 'selected' : 'unselected'}`}
                  onClick={() => setTone(t.value as any)}
                >
                  <span className="social-poster-select-icon">{t.icon}</span>
                  <span className="social-poster-select-label">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>CTA Typ</label>
            <div className="social-poster-select-grid">
              {ctaOptions.map(c => (
                <div
                  key={c.value}
                  className={`social-poster-select-card ${ctaType === c.value ? 'selected' : 'unselected'}`}
                  onClick={() => setCtaType(c.value as any)}
                >
                  <span className="social-poster-select-icon">{c.icon}</span>
                  <span className="social-poster-select-label">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="social-poster-checkbox-row">
            <label className="social-poster-checkbox-label">
              <input
                type="checkbox"
                checked={includeHashtags}
                onChange={(e) => setIncludeHashtags(e.target.checked)}
              />
              <span>Hashtags</span>
            </label>
            <label className="social-poster-checkbox-label">
              <input
                type="checkbox"
                checked={includeEmojis}
                onChange={(e) => setIncludeEmojis(e.target.checked)}
              />
              <span>Emojis</span>
            </label>
          </div>

          <LoadingButton
            onClick={handleGenerateWithAI}
            loading={aiLoading}
            loadingText="Generiere..."
          >
            ✨ Posts generieren
          </LoadingButton>
        </motion.div>

        {/* Right: Plattform-Auswahl (gleiche Breite wie links) */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📱 Plattform-Auswahl</h3>
          <div className="social-poster-platforms">
            {platformOptions.map(p => (
              <motion.div
                key={p.value}
                whileHover={{ scale: 1.03 }}
                onClick={() => togglePlatform(p.value)}
                className={`social-poster-platform-card ${selectedPlatforms.has(p.value) ? 'selected' : 'unselected'}`}
              >
                  <span className="social-poster-platform-icon">{brandIcons[p.value] || p.icon}</span>
                <div className="social-poster-platform-name">{p.label}</div>
                {selectedPlatforms.has(p.value) && (
                  <div className="social-poster-platform-check">✓</div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="social-poster-info-box">
            <div>
              ℹ️ <strong>Ausgewählt:</strong> {selectedPlatforms.size} {selectedPlatforms.size === 1 ? 'Plattform' : 'Plattformen'}
            </div>
          </div>

          <div className="social-poster-info-box" style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                🔌 <strong>Verbundene Plattformen:</strong> {Object.values(connectedAccounts).filter(Boolean).length}/6
              </div>
              <label className="social-poster-checkbox-label" title="AI-Optimierung beim Versand aktivieren (Backend transformiert den Text je Plattform)">
                <input
                  type="checkbox"
                  checked={aiTransformOnPublish}
                  onChange={(e) => setAiTransformOnPublish(e.target.checked)}
                />
                <span>AI-Optimierung</span>
              </label>
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, lineHeight: '1.6' }}>
              LinkedIn: {connectedAccounts.linkedin ? '✅' : '❌'} · 
              Facebook: {connectedAccounts.facebook ? '✅' : '❌'} · 
              Instagram: {connectedAccounts.instagram ? '✅' : '❌'} · 
              Twitter: {connectedAccounts.twitter ? '✅' : '❌'} · 
              TikTok: {connectedAccounts.tiktok ? '✅' : '❌'} · 
              YouTube: {connectedAccounts.youtube ? '✅' : '❌'}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full-width Plattform-Posts unter den beiden Karten */}
      <motion.div
        className="form-container social-poster-posts-wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 style={{ color: 'white', marginBottom: '20px' }}>📱 Plattform-Posts</h3>
        <div className="social-poster-posts-grid">
          {platformOptions.map(p => {
            const post = generatedPosts.find(g => g.platform === p.value);
            const content = tileContents[p.value] ?? post?.content ?? '';
            const characterCount = content?.length || 0;
            const isConnected = !!connectedAccounts[p.value as keyof typeof connectedAccounts];
            const disabled = !isConnected || !content?.trim() || !selectedPlatforms.has(p.value);
            const title = !isConnected
              ? 'Plattform nicht verbunden. Bitte in den Einstellungen verbinden.'
              : (!content?.trim() ? 'Bitte erst Inhalt generieren oder eingeben' : '');
            
            // Special handling for YouTube
            const isYouTube = p.value === 'youtube';
            const youtubeDisabled = disabled || (isYouTube && !youtubeVideoFile);
            const youtubeTitle = youtubeDisabled && isYouTube && !youtubeVideoFile
              ? 'Bitte lade ein Video hoch'
              : title;
            
            return (
              <motion.div
                key={p.value}
                className="social-poster-post-card form-container"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="social-poster-post-header">
                  <span className="social-poster-post-platform-icon">{brandIcons[p.value] || p.icon}</span>
                  <div className="social-poster-post-info">
                    <p className="social-poster-post-name">{p.label}</p>
                    <p className="social-poster-post-chars">{characterCount} Zeichen</p>
                  </div>
                </div>
                
                {/* YouTube Video Upload */}
                {isYouTube && (
                  <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255, 0, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 0, 0, 0.2)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#ff6b6b' }}>
                      🎬 Video hochladen (erforderlich)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setYoutubeVideoFile(file);
                          setYoutubeVideoPreview(`📹 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                        }
                      }}
                      style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}
                    />
                    {youtubeVideoPreview && (
                      <div style={{ fontSize: '12px', color: '#10b981' }}>✅ {youtubeVideoPreview}</div>
                    )}
                  </div>
                )}
                
                <textarea
                  value={content}
                  onChange={(e) => setTileContents(prev => ({ ...prev, [p.value]: e.target.value }))}
                  className="form-textarea"
                  rows={isYouTube ? 4 : 6}
                  placeholder={isYouTube ? 'Video-Beschreibung / Details...' : ''}
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
                <div className="social-poster-actions">
                  <button
                    onClick={() => handlePublishPost(p.value, content)}
                    className="social-poster-btn social-poster-btn-primary"
                    disabled={youtubeDisabled}
                    title={youtubeTitle}
                  >
                    {isYouTube ? '🎥 Hochladen' : '📤 Senden'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      

      {/* Stats */}
      <motion.div
        className="form-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: '30px' }}
      >
        <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Post Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
              {postStats.scheduled}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Geplant</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
              {postStats.published}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Veröffentlicht</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
              {postStats.engagement}%
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Engagement</div>
          </div>
        </div>
      </motion.div>
      </AuthGate>
    </div>
  );
};

export default SocialMediaPoster;
