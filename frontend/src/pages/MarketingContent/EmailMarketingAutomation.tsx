// src/pages/MarketingContent/EmailMarketingAutomation.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const EmailMarketingAutomation: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [campaignName, setCampaignName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [targetSegment, setTargetSegment] = useState('all');
  const [sendTime, setSendTime] = useState('immediate');
  const [campaignStats, setCampaignStats] = useState({ sent: 0, opened: 0, clicked: 0 });

  const segments = [
    { value: 'all', label: 'Alle Kunden', icon: '👥', count: '1.2k' },
    { value: 'new', label: 'Neue Kunden', icon: '🆕', count: '320' },
    { value: 'active', label: 'Aktive Kunden', icon: '⭐', count: '650' },
    { value: 'inactive', label: 'Inaktive Kunden', icon: '😴', count: '230' }
  ];

  const scheduleOptions = [
    { value: 'immediate', label: 'Sofort senden', icon: '⚡', description: 'Direkt nach Erstellung' },
    { value: 'scheduled', label: 'Geplant', icon: '📅', description: 'Zu bestimmter Zeit' },
    { value: 'automated', label: 'Automatisiert', icon: '🤖', description: 'Trigger-basiert' }
  ];

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !emailSubject.trim()) {
      showToast('Bitte fülle alle Pflichtfelder aus', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/marketing/email/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignName, emailSubject, targetSegment, sendTime })
      });
      
      const data = await response.json();
      
      if (data.success && data.campaign) {
        setCampaignStats(data.stats || {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        });
        showToast(`Kampagne "${data.campaign.name}" erfolgreich erstellt!`, 'success');
        setCampaignName('');
        setEmailSubject('');
        setTargetSegment('all');
        setSendTime('');
      } else {
        throw new Error(data.error || 'Fehler beim Erstellen der Kampagne');
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
        <h1>✉️ Email Marketing Automation</h1>
        <p>Komplette Email-Marketing Automatisierung</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

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
    </div>
  );
};

export default EmailMarketingAutomation;