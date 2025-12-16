import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

type GeneratedPost = {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  content: string;
  hashtags?: string[];
  characterCount: number;
  estimatedEngagement?: string;
  suggestions?: string[];
};

const SocialMediaPoster: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  // AI Generator State
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<'casual' | 'professional' | 'energetic' | 'educational'>('casual');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['facebook', 'instagram', 'tiktok']));
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [ctaType, setCtaType] = useState<'none' | 'click' | 'engagement' | 'message' | 'like'>('engagement');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [postStats, setPostStats] = useState({ scheduled: 0, published: 0, engagement: 0 });
  const [webhookConfig, setWebhookConfig] = useState<Record<string, boolean>>({ linkedin: false, facebook: false, tiktok: false });
  const [webhookConfiguredCount, setWebhookConfiguredCount] = useState(0);
  const [aiTransformOnPublish, setAiTransformOnPublish] = useState(true);
  
  // Integration Options (for manual posting)
  const [_connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    facebook: false,
    instagram: false,
    twitter: false,
    tiktok: false,
    youtube: false
  });

  const apiBase = import.meta.env.VITE_API_URL || '';

  const platformOptions = [
    { value: 'linkedin', label: 'LinkedIn', icon: '💼', followers: '0' },
    { value: 'facebook', label: 'Facebook', icon: '👍', followers: '742' },
    { value: 'instagram', label: 'Instagram', icon: '📸', followers: '52' },
    { value: 'twitter', label: 'Twitter', icon: '🐦', followers: '0' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵', followers: '2.1k' },
    { value: 'youtube', label: 'YouTube', icon: '📺', followers: '0' }
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
      .catch(err => console.error('Status check failed:', err));
  }, [apiBase]);

  // Webhook-Status (Make/Zapier/n8n) laden
  React.useEffect(() => {
    fetch(`${apiBase}/api/social/webhook/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWebhookConfig(data.webhooks || {});
          setWebhookConfiguredCount(data.configured || 0);
        }
      })
      .catch(err => console.error('Webhook status check failed:', err));
  }, [apiBase]);

  const handleGenerateWithAI = async () => {
    if (!topic.trim()) {
      showToast('Bitte gib ein Thema ein', 'error');
      return;
    }
    if (selectedPlatforms.size === 0) {
      showToast('Bitte wähle mindestens eine Plattform', 'error');
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
          platforms: Array.from(selectedPlatforms),
          includeHashtags,
          includeEmojis,
          ctaType
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedPosts(data.posts);
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
      const supportedWebhookPlatforms = ['linkedin', 'facebook', 'tiktok'];
      if (!supportedWebhookPlatforms.includes(platform)) {
        showToast('Diese Plattform wird noch nicht unterstützt', 'error');
        return;
      }
      if (!webhookConfig[platform]) {
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} ist nicht aktiviert. Siehe Bedienungsanleitung.`, 'error');
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

  const handleEditPost = (platform: string, content: string) => {
    setEditingPost(platform);
    setEditingContent(content);
  };

  const handleSaveEdit = (platform: string) => {
    setGeneratedPosts(prev =>
      prev.map(post =>
        post.platform === platform
          ? { ...post, content: editingContent, characterCount: editingContent.length }
          : post
      )
    );
    setEditingPost(null);
    setEditingContent('');
    showToast('Post aktualisiert!', 'success');
  };

  const togglePlatform = (platformValue: string) => {
    setSelectedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platformValue)) {
        newSet.delete(platformValue);
      } else {
        newSet.add(platformValue);
      }
      return newSet;
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

      {/* 2-Column Layout: Left = Input, Right = Platform Selection */}
      <div className="social-poster-input-grid">
        {/* Left: KI Post Generator Briefing */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🤖 KI Post Generator</h3>

          <div className="form-group">
            <label>Thema *</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Neues Produkt, Tipps, Ankündigung..."
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
            <select className="form-input" value={tone} onChange={(e) => setTone(e.target.value as any)}>
              {toneOptions.map(t => (
                <option key={t.value} value={t.value}>{`${t.icon} ${t.label}`}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>CTA Typ</label>
            <select className="form-input" value={ctaType} onChange={(e) => setCtaType(e.target.value as any)}>
              {ctaOptions.map(c => (
                <option key={c.value} value={c.value}>{`${c.icon} ${c.label}`}</option>
              ))}
            </select>
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

        {/* Right: Platform Selection */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📱 Plattformen</h3>
          <div className="social-poster-platforms">
            {platformOptions.map(p => (
              <motion.div
                key={p.value}
                whileHover={{ scale: 1.03 }}
                onClick={() => togglePlatform(p.value)}
                className={`social-poster-platform-card ${selectedPlatforms.has(p.value) ? 'selected' : 'unselected'}`}
              >
                <span className="social-poster-platform-icon">{p.icon}</span>
                <div className="social-poster-platform-name">{p.label}</div>
                <div className="social-poster-platform-followers">{p.followers}</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                🔌 <strong>Aktivierte Plattformen:</strong> {webhookConfiguredCount}/3
                <span
                  title={
                    'Einige Plattformen sind zum Versand nicht aktiviert. ' +
                    'Siehe Bedienungsanleitung für Details.'
                  }
                  style={{ marginLeft: 8, cursor: 'help', opacity: 0.9 }}
                >
                  ⓘ
                </span>
              </div>
              <label className="social-poster-checkbox-label" title="AI-Optimierung beim Versand aktivieren (Backend transformiert den Text je Plattform)">
                <input
                  type="checkbox"
                  checked={aiTransformOnPublish}
                  onChange={(e) => setAiTransformOnPublish(e.target.checked)}
                />
                <span>AI-Optimierung beim Versand</span>
              </label>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              LinkedIn: {webhookConfig.linkedin ? '✅' : '❌'} · Facebook: {webhookConfig.facebook ? '✅' : '❌'} · TikTok: {webhookConfig.tiktok ? '✅' : '❌'}
              {!webhookConfiguredCount && (
                <span> · Tipp: Siehe Bedienungsanleitung für Informationen</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Generated Posts Grid: 3x2 */}
      {generatedPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="social-poster-generated-section"
        >
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📋 Generierte Posts</h3>
          <div className="social-poster-posts-grid">
            {generatedPosts.map(post => (
              <motion.div
                key={post.platform}
                className="social-poster-post-card form-container"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="social-poster-post-header">
                  <span className="social-poster-post-platform-icon">
                    {platformOptions.find(p => p.value === post.platform)?.icon}
                  </span>
                  <div className="social-poster-post-info">
                    <p className="social-poster-post-name">
                      {platformOptions.find(p => p.value === post.platform)?.label}
                    </p>
                    <p className="social-poster-post-chars">
                      {post.characterCount} Zeichen
                    </p>
                  </div>
                </div>

                {/* Content */}
                {editingPost === post.platform ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="form-textarea"
                    rows={6}
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                ) : (
                  <div className="social-poster-post-content">
                    {post.content}
                  </div>
                )}

                {/* Engagement Badge */}
                {post.estimatedEngagement && (
                  <div className="social-poster-engagement-badge">
                    {post.estimatedEngagement}
                  </div>
                )}

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="social-poster-hashtags">
                    {post.hashtags.map(tag => `#${tag}`).join(' ')}
                  </div>
                )}

                {/* Suggestions */}
                {post.suggestions && post.suggestions.length > 0 && (
                  <div className="social-poster-suggestions">
                    <div className="social-poster-suggestions-title">💡 Tipps:</div>
                    <ul className="social-poster-suggestions-list">
                      {post.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="social-poster-actions">
                  {editingPost === post.platform ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(post.platform)}
                        className="social-poster-btn social-poster-btn-primary"
                      >
                        ✓ Speichern
                      </button>
                      <button
                        onClick={() => setEditingPost(null)}
                        className="social-poster-btn social-poster-btn-cancel"
                      >
                        ✕ Abbrechen
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditPost(post.platform, post.content)}
                        className="social-poster-btn social-poster-btn-secondary"
                      >
                        ✎ Bearbeiten
                      </button>
                      {(() => {
                        const supportedWebhookPlatforms = ['linkedin', 'facebook', 'tiktok'];
                        const isSupported = supportedWebhookPlatforms.includes(post.platform);
                        const isConfigured = isSupported && !!webhookConfig[post.platform];
                        const disabled = !isSupported || !isConfigured;
                        const title = !isSupported
                          ? 'Diese Plattform wird noch nicht unterstützt'
                          : (!isConfigured ? 'Diese Plattform ist nicht aktiviert' : '');
                        return (
                          <button
                            onClick={() => handlePublishPost(post.platform, post.content)}
                            className="social-poster-btn social-poster-btn-primary"
                            disabled={disabled}
                            title={title}
                          >
                            📤 Publish
                          </button>
                        );
                      })()}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {generatedPosts.length === 0 && !aiLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="social-poster-empty-state"
        >
          <div className="social-poster-empty-icon">✨</div>
          <p className="social-poster-empty-text">
            Gib ein Thema ein und generiere Posts!
          </p>
          <p className="social-poster-empty-hint">
            Die KI optimiert automatisch für jede Plattform
          </p>
        </motion.div>
      )}

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
    </div>
  );
};

export default SocialMediaPoster;