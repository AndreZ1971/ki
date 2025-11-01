import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const SocialMediaPoster: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [postContent, setPostContent] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [scheduleTime, setScheduleTime] = useState('now');
  const [postStats, setPostStats] = useState({ scheduled: 0, published: 0, engagement: 0 });

  const platformOptions = [
    { value: 'instagram', label: 'Instagram', icon: '📸', followers: '12.5k' },
    { value: 'facebook', label: 'Facebook', icon: '👍', followers: '8.2k' },
    { value: 'twitter', label: 'Twitter', icon: '🐦', followers: '5.1k' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼', followers: '3.8k' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵', followers: '18.9k' },
    { value: 'youtube', label: 'YouTube', icon: '▶️', followers: '22.4k' }
  ];

  const scheduleOptions = [
    { value: 'now', label: 'Sofort', icon: '⚡', description: 'Direkt veröffentlichen' },
    { value: 'schedule', label: 'Planen', icon: '📅', description: 'Zeitpunkt festlegen' },
    { value: 'optimal', label: 'Optimal', icon: '🎯', description: 'Beste Zeit automatisch' },
    { value: 'recurring', label: 'Wiederkehrend', icon: '🔄', description: 'Regelmäßig posten' }
  ];

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      showToast('Bitte gib Post-Inhalt ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/marketing/social/poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent, platform, scheduleTime })
      });
      
      const data = await response.json();
      
      if (data.success && data.post) {
        setPostStats(data.stats || {
          likes: 0,
          shares: 0,
          comments: 0,
          reach: 0
        });
        showToast(`Post ${data.post.status}!`, 'success');
        setPostContent('');
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📝 Post Erstellen</h3>

          <div className="form-group">
            <label>Plattform</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {platformOptions.map(p => (
                <motion.div key={p.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setPlatform(p.value)}
                  style={{ padding: '12px', background: platform === p.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: platform === p.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{p.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{p.followers} Follower</div>
                </motion.div>
              ))}
            </div>
          </div>

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
    </div>
  );
};

export default SocialMediaPoster;
