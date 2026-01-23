import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

// Platform-Icons als SVG
const PlatformIcons = {
  linkedin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  facebook: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FD5" />
          <stop offset="50%" stopColor="#FF543E" />
          <stop offset="100%" stopColor="#C837AB" />
        </linearGradient>
      </defs>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
    </svg>
  ),
  twitter: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  ),
  tiktok: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  youtube: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
};

type GeneratedPost = {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  content: string;
  hashtags?: string[];
  characterCount: number;
  estimatedEngagement?: string;
  suggestions?: string[];
};

type UploadedAsset = {
  assetId: string;
  publicUrl: string;
  type: 'image' | 'audio' | 'video';
  mimeType: string;
  filename: string;
  size: number;
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
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [postStats, setPostStats] = useState({ scheduled: 0, published: 0, engagement: 0 });
  const [webhookConfig, setWebhookConfig] = useState<Record<string, boolean>>({ linkedin: false, facebook: false, tiktok: false });
  const [aiTransformOnPublish, setAiTransformOnPublish] = useState(true);
  
  // YouTube Video Upload
  const [youtubeVideoFile, setYoutubeVideoFile] = useState<File | null>(null);
  const [youtubeVideoPreview, setYoutubeVideoPreview] = useState<string>('');
  
  // Media Assets for Social Posts
  const [selectedMedia, setSelectedMedia] = useState<Array<{ file: File; type: 'image' | 'audio' | 'video' }>>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  
  // Integration Options (for manual posting)
  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    facebook: false,
    instagram: false,
    twitter: false,
    tiktok: false,
    youtube: false
  });

  const apiBase = '';

  const platformOptions = [
    { value: 'linkedin', label: 'LinkedIn', icon: PlatformIcons.linkedin },
    { value: 'facebook', label: 'Facebook', icon: PlatformIcons.facebook },
    { value: 'instagram', label: 'Instagram', icon: PlatformIcons.instagram },
    { value: 'twitter', label: 'Twitter', icon: PlatformIcons.twitter },
    { value: 'tiktok', label: 'TikTok', icon: PlatformIcons.tiktok },
    { value: 'youtube', label: 'YouTube', icon: PlatformIcons.youtube }
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
    fetch(`${apiBase}/api/connection/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.socialMedia) {
          setConnectedAccounts({
            linkedin: data.socialMedia.linkedin?.enabled || false,
            facebook: data.socialMedia.facebook?.enabled || false,
            instagram: data.socialMedia.instagram?.enabled || false,
            twitter: data.socialMedia.twitter?.enabled || false,
            tiktok: data.socialMedia.tiktok?.enabled || false,
            youtube: data.socialMedia.youtube?.enabled || false
          });
        }
      })
      .catch(() => {});
  }, [apiBase]);

  // Webhook-Status (Make/Zapier/n8n) laden
  React.useEffect(() => {
    fetch(`${apiBase}/api/social/webhook/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWebhookConfig(data.webhooks || {});
        }
      })
      .catch(() => {});
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

  const handleMediaSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newMedia: Array<{file: File, type: 'image' | 'audio' | 'video', name: string}> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mimeType = file.type;
      
      let assetType: 'image' | 'audio' | 'video' | null = null;
      
      if (mimeType.startsWith('image/')) {
        assetType = 'image';
      } else if (mimeType.startsWith('audio/')) {
        assetType = 'audio';
      } else if (mimeType.startsWith('video/')) {
        assetType = 'video';
      }
      
      if (assetType) {
        newMedia.push({file, type: assetType, name: file.name});
      }
    }
    
    if (newMedia.length > 0) {
      setSelectedMedia([...selectedMedia, ...newMedia]);
      await uploadMediaAssets(newMedia);
    } else {
      showToast('Keine gültigen Media-Dateien ausgewählt', 'error');
    }
  };

  const uploadMediaAssets = async (mediaToupload: Array<{file: File, type: 'image' | 'audio' | 'video', name: string}>) => {
    setUploadingMedia(true);
    const newAssets = [];
    
    for (const media of mediaToupload) {
      try {
        const formData = new FormData();
        formData.append('file', media.file);
        
        const response = await fetch(`${apiBase}/api/social/assets/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.success && data.asset) {
          newAssets.push({
            assetId: data.asset.assetId,
            publicUrl: data.asset.publicUrl,
            type: data.asset.type,
            mimeType: data.asset.mimeType,
            filename: data.asset.filename,
            size: data.asset.size
          });
          showToast(`${media.name} hochgeladen`, 'success');
        } else {
          throw new Error(data.error || 'Upload fehlgeschlagen');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload-Fehler';
        showToast(`Fehler bei ${media.name}: ${errorMessage}`, 'error');
      }
    }
    
    setUploadedAssets([...uploadedAssets, ...newAssets]);
    setUploadingMedia(false);
  };

  const removeUploadedAsset = (index: number) => {
    const assetToRemove = uploadedAssets[index];
    if (assetToRemove.assetId) {
      fetch(`${apiBase}/api/social/assets/${assetToRemove.assetId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Fehler beim Löschen des Assets:', err));
    }
    setUploadedAssets(uploadedAssets.filter((_, i) => i !== index));
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const handlePublishPost = async (platform: string, content: string) => {
    try {
      // YouTube special handling
      if (platform === 'youtube') {
        if (!youtubeVideoFile) {
          showToast('Bitte wähle zuerst ein Video aus', 'error');
          return;
        }
        
        const formData = new FormData();
        formData.append('video', youtubeVideoFile);
        formData.append('title', content.split('\n')[0] || 'A.R.I. Video');
        formData.append('description', content);

        const uploadResponse = await fetch(`${apiBase}/api/social/youtube/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          showToast(`Video auf YouTube hochgeladen!`, 'success');
          setYoutubeVideoFile(null);
          setYoutubeVideoPreview('');
          return;
        } else {
          throw new Error(uploadData.error || 'Upload fehlgeschlagen');
        }
      }

      const supportedWebhookPlatforms = ['linkedin', 'facebook', 'tiktok'];
      if (!supportedWebhookPlatforms.includes(platform)) {
        showToast('Diese Plattform wird noch nicht unterstützt', 'error');
        return;
      }
      if (!webhookConfig[platform]) {
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} ist nicht aktiviert. Siehe Bedienungsanleitung.`, 'error');
        return;
      }

      // Build assets from uploaded media
      const assets = uploadedAssets.map(asset => ({
        url: asset.publicUrl,
        type: asset.type as 'image' | 'audio' | 'video'
      }));

      const response = await fetch(`${apiBase}/api/social/webhook/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          content,
          assets: assets.length > 0 ? assets : undefined,
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
        // Clear media after successful post
        setSelectedMedia([]);
        setUploadedAssets([]);
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

  const handleYoutubeVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setYoutubeVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setYoutubeVideoPreview(previewUrl);
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
                <span className="social-poster-platform-icon">{p.icon()}</span>
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
                🔌 <strong>Verbundene Plattformen:</strong> {Object.values(connectedAccounts).filter(Boolean).length}/6
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
              LinkedIn: {connectedAccounts.linkedin ? '✅' : '❌'} · Facebook: {connectedAccounts.facebook ? '✅' : '❌'} · Instagram: {connectedAccounts.instagram ? '✅' : '❌'} · Twitter: {connectedAccounts.twitter ? '✅' : '❌'} · TikTok: {connectedAccounts.tiktok ? '✅' : '❌'} · YouTube: {connectedAccounts.youtube ? '✅' : '❌'}
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
                    {platformOptions.find(p => p.value === post.platform)?.icon()}
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

                {/* Media Upload Section */}
                {post.platform === 'youtube' ? (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                      🎥 Video auswählen
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleYoutubeVideoChange}
                      style={{ 
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    />
                    {youtubeVideoPreview && (
                      <div style={{ marginTop: '10px' }}>
                        <video
                          src={youtubeVideoPreview}
                          controls
                          style={{ width: '100%', maxHeight: '150px', borderRadius: '6px' }}
                        />
                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                          ✅ {youtubeVideoFile?.name}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                      📎 Media ({uploadedAssets.length} {uploadedAssets.length === 1 ? 'Datei' : 'Dateien'})
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,audio/*,video/*"
                      onChange={(e) => handleMediaSelect(e.target.files)}
                      disabled={uploadingMedia}
                      style={{ 
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        fontSize: '12px',
                        cursor: uploadingMedia ? 'not-allowed' : 'pointer',
                        opacity: uploadingMedia ? 0.5 : 1
                      }}
                    />
                    {uploadingMedia && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#fbbf24' }}>
                        ⏳ Dateien werden hochgeladen...
                      </div>
                    )}
                    {uploadedAssets.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        {uploadedAssets.map((asset, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '6px', fontSize: '11px' }}>
                            <span>✅ {asset.type === 'image' ? '🖼️' : asset.type === 'audio' ? '🎵' : '🎬'} {asset.filename}</span>
                            <button
                              onClick={() => removeUploadedAsset(idx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                              title="Datei entfernen"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                        // YouTube special handling
                        if (post.platform === 'youtube') {
                          return (
                            <button
                              onClick={() => handlePublishPost(post.platform, post.content)}
                              className="social-poster-btn social-poster-btn-primary"
                              disabled={!youtubeVideoFile}
                              title={!youtubeVideoFile ? 'Bitte Video auswählen' : 'Video auf YouTube hochladen'}
                            >
                              📤 Upload Video
                            </button>
                          );
                        }

                        const isConnected = connectedAccounts[post.platform as keyof typeof connectedAccounts];
                        const disabled = !isConnected;
                        const title = !isConnected ? 'Diese Plattform ist nicht verbunden' : '';
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