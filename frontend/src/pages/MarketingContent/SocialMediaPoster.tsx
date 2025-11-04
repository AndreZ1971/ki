import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const SocialMediaPoster: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  // State Management
  const [platform, setPlatform] = React.useState('facebook');
  const [postContent, setPostContent] = React.useState('');
  const [scheduleTime, setScheduleTime] = React.useState('now');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [postStats, setPostStats] = useState({ scheduled: 0, published: 0, engagement: 0 });
  
  // Integration Options
  const [useBuffer, setUseBuffer] = useState(false); // Buffer wartet auf Approval
  const [useWebhook, setUseWebhook] = useState(true); // 🎯 IFTTT/Make.com = EINFACH!
  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    facebook: false,
    instagram: false,
    twitter: false,
    tiktok: false,
    youtube: false
  });
  const [bufferProfiles, setBufferProfiles] = useState<any[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);

  const platformOptions = [
    { value: 'linkedin', label: 'LinkedIn', icon: '💼', followers: '0', connected: connectedAccounts.linkedin },
    { value: 'facebook', label: 'Facebook', icon: '👍', followers: '742', connected: connectedAccounts.facebook },
    { value: 'instagram', label: 'Instagram', icon: '📸', followers: '52', connected: connectedAccounts.instagram },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦', followers: '0', connected: connectedAccounts.twitter },
    { value: 'tiktok', label: 'TikTok', icon: '🎵', followers: '2.1k', connected: connectedAccounts.tiktok },
    { value: 'youtube', label: 'YouTube', icon: '📺', followers: '0', connected: connectedAccounts.youtube }
  ];

  // Check connection status on mount
  React.useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/api/auth/status`)
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
      .catch(err => console.error('Status check failed (OAuth mode):', err));
  }, []);

  const scheduleOptions = [
    { value: 'now', label: 'Sofort', icon: '⚡', description: 'Direkt veröffentlichen' },
    { value: 'schedule', label: 'Planen', icon: '📅', description: 'Zeitpunkt festlegen' },
    { value: 'optimal', label: 'Optimal', icon: '🎯', description: 'Beste Zeit automatisch' },
    { value: 'recurring', label: 'Wiederkehrend', icon: '🔄', description: 'Regelmäßig posten' }
  ];

  const handleConnectAccount = (accountPlatform: string, service?: 'ifttt' | 'make' | 'buffer') => {
    if (useWebhook && service) {
      if (service === 'ifttt') {
        window.open('https://ifttt.com/create', '_blank');
        showToast(`Erstelle ein Applet für ${accountPlatform.toUpperCase()} in IFTTT! (siehe docs/IFTTT_SETUP.md)`, 'info');
      } else if (service === 'make') {
        window.open('https://eu2.make.com/', '_blank');
        showToast(`Erstelle ein Scenario für ${accountPlatform.toUpperCase()} in Make.com! (siehe docs/MAKE_SETUP.md)`, 'info');
      }
    } else if (useBuffer) {
      window.open('https://buffer.com/app', '_blank');
      showToast(`Verbinde deinen ${accountPlatform.toUpperCase()} Account in Buffer und lade dann die Seite neu!`, 'info');
    } else {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${accountPlatform}`;
    }
  };  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      showToast('Bitte gib Post-Inhalt ein', 'error');
      return;
    }

    // Check if platform is connected
    const platformConnected = (connectedAccounts as any)[platform];
    if (!platformConnected) {
      showToast(`Bitte verbinde zuerst deinen ${platform.toUpperCase()} Account!`, 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
        const endpoint = useWebhook
          ? `${import.meta.env.VITE_API_URL}/api/social/webhook/post`
          : useBuffer 
            ? `${import.meta.env.VITE_API_URL}/api/social/buffer/post`
            : `${import.meta.env.VITE_API_URL}/api/social/post`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            content: postContent,
            scheduleTime: scheduleTime === 'now' ? 'now' : scheduleTime
          })
        });      const data = await response.json();
      
      if (data.success) {
        showToast(`Post erfolgreich auf ${platform} veröffentlicht!`, 'success');
        setPostContent('');
        // Update stats
        setPostStats(prev => ({
          ...prev,
          published: prev.published + 1
        }));
      } else {
        throw new Error(data.error || 'Fehler beim Erstellen des Posts');
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
        <h1>📱 Social Media Poster</h1>
        <p>Automatisches Posting auf Social Media Kanäle</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      {/* Kompakter Mode-Toggle oben rechts */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '10px', 
        marginTop: '15px',
        marginBottom: '15px' 
      }}>
        <motion.button
          onClick={() => { setUseWebhook(true); setUseBuffer(false); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: useWebhook ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            border: useWebhook ? 'none' : '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          🎯 Webhooks
        </motion.button>
        <motion.button
          onClick={() => { setUseWebhook(false); setUseBuffer(true); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: useBuffer ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            border: useBuffer ? 'none' : '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          ⏳ Buffer
        </motion.button>
      </div>

      {/* Plattform-Grid: 2 Spalten x 3 Reihen = 6 Plattformen */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        style={{ marginTop: '20px' }}
      >
        <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>� Social Media Plattformen</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px'
        }}>
          {platformOptions.map(p => (
            <motion.div 
              key={p.value} 
              whileHover={{ scale: 1.02 }} 
              onClick={() => setPlatform(p.value)}
              style={{ 
                padding: '14px', 
                background: platform === p.value 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'rgba(255,255,255,0.05)',
                border: platform === p.value 
                  ? '2px solid rgba(102, 126, 234, 0.5)' 
                  : '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              {/* Header mit Brand Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {/* Original Brand Button Style */}
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: p.value === 'linkedin' ? '#0A66C2' :
                              p.value === 'facebook' ? '#1877F2' :
                              p.value === 'instagram' ? 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)' :
                              p.value === 'twitter' ? '#000000' :
                              p.value === 'tiktok' ? '#000000' :
                              p.value === 'youtube' ? '#FF0000' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    {p.value === 'linkedin' && <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>}
                    {p.value === 'facebook' && <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>}
                    {p.value === 'instagram' && <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>}
                    {p.value === 'twitter' && <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>}
                    {p.value === 'tiktok' && <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>}
                    {p.value === 'youtube' && <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>}
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{p.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.9, color: 'white' }}>
                      {p.followers} Follower
                      {p.connected && <span style={{ marginLeft: '8px' }}>✓</span>}
                    </div>
                  </div>
                </div>
              </div>
              {/* Verbindungs-Buttons */}
              {!p.connected && useWebhook && (
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); handleConnectAccount(p.value, 'ifttt'); }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    title="IFTTT - Einfach"
                  >
                    🎯 IFTTT
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); handleConnectAccount(p.value, 'make'); }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    title="Make.com - 1000 ops gratis"
                  >
                    🚀 Make
                  </motion.button>
                </div>
              )}
              {!p.connected && !useWebhook && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleConnectAccount(p.value); }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Verbinden
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Info-Box */}
        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            {useWebhook ? (
              <>
                ℹ️ <strong>Webhook-Modus:</strong> Wähle IFTTT (einfach) oder Make.com (1000 ops gratis) zum Verbinden!
              </>
            ) : (
              <>
                ℹ️ <strong>Hinweis:</strong> Verbinde deine Business Accounts um Posts automatisch zu veröffentlichen.
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Post-Erstellung */}
      <motion.div 
        className="form-container" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        style={{ marginTop: '20px' }}
      >
        <h3 style={{ color: 'white', marginBottom: '20px' }}>✍️ Post Erstellen</h3>

        <div className="form-group">

          <div className="form-group">
            <label>Post-Inhalt *</label>
            <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Dein Social Media Post..." className="form-textarea" rows={5} />
            <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', textAlign: 'right', color: 'white' }}>{postContent.length} Zeichen</div>
          </div>

          <div className="form-group">
            <label>Zeitplan</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {scheduleOptions.map(s => (
                <motion.div key={s.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setScheduleTime(s.value)}
                  style={{ padding: '12px', background: scheduleTime === s.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                    border: scheduleTime === s.value ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{s.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{s.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <LoadingButton onClick={handleCreatePost} loading={loading} loadingText="Erstelle...">
            📤 Post Veröffentlichen
          </LoadingButton>
        </div>
      </motion.div>

      <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Post Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>{postStats.scheduled}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Geplant</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>{postStats.published}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Veröffentlicht</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>{postStats.engagement}%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Engagement</div>
            </div>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
            <p style={{ margin: 0 }}>Keine Posts in dieser Woche</p>
          </div>
        </motion.div>
    </div>
  );
};

export default SocialMediaPoster;
