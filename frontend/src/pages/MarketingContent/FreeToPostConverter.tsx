import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const FreeToPostConverter: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [userSegment, setUserSegment] = useState('inactive');
  const [incentiveType, setIncentiveType] = useState('discount');
  const [conversionGoal, setConversionGoal] = useState('');
  const [conversionData, setConversionData] = useState({ current: 12, target: 28, users: 450 });

  const segments = [
    { value: 'inactive', label: 'Inaktive Nutzer', icon: '😴', count: '1.2k', rate: '8%' },
    { value: 'free-users', label: 'Kostenlos', icon: '🆓', count: '3.5k', rate: '12%' },
    { value: 'trial-expired', label: 'Trial Abgelaufen', icon: '⏰', count: '450', rate: '22%' },
    { value: 'low-engagement', label: 'Wenig Aktiv', icon: '📉', count: '890', rate: '15%' }
  ];

  const incentives = [
    { value: 'discount', label: 'Rabatt-Code', icon: '🏷️', conversion: '+18%' },
    { value: 'trial', label: 'Trial Verlängern', icon: '⏱️', conversion: '+25%' },
    { value: 'feature', label: 'Exklusive Features', icon: '⭐', conversion: '+32%' },
    { value: 'bundle', label: 'Bundle-Angebot', icon: '📦', conversion: '+28%' }
  ];

  const handleConvert = async () => {
    if (!conversionGoal.trim()) {
      showToast('Bitte gib ein Conversion-Ziel ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/marketing/conversion/free-to-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userSegment, incentiveType, conversionGoal })
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setConversionData(data.data);
        showToast('Conversion-Kampagne erfolgreich erstellt!', 'success');
        setConversionGoal('');
      } else {
        throw new Error(data.error || 'Fehler beim Erstellen der Conversion-Kampagne');
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
        <h1>� Free to Post Converter</h1>
        <p>Konvertiere kostenlose Nutzer zu zahlenden Kunden</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🎯 Conversion Setup</h3>

          <div className="form-group">
            <label>Nutzer-Segment</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {segments.map(seg => (
                <motion.div key={seg.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setUserSegment(seg.value)}
                  style={{ padding: '12px', background: userSegment === seg.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: userSegment === seg.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{seg.icon}</span>
                    <div><div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{seg.label}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{seg.count} • {seg.rate} Conv-Rate</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Anreiz-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {incentives.map(inc => (
                <motion.div key={inc.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIncentiveType(inc.value)}
                  style={{ padding: '12px', background: incentiveType === inc.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                    border: incentiveType === inc.value ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{inc.icon}</span>
                    <div><div style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{inc.label}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, color: '#10b981' }}>{inc.conversion}</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Conversion-Ziel *</label>
            <input type="text" value={conversionGoal} onChange={(e) => setConversionGoal(e.target.value)} placeholder="z.B. Premium-Mitgliedschaft kaufen" className="form-input" />
          </div>

          <LoadingButton onClick={handleConvert} loading={loading} loadingText="Erstelle...">
            🚀 Conversion Starten
          </LoadingButton>
        </motion.div>

        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📈 Conversion Prognose</h3>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Aktuelle Rate</span>
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '16px' }}>{conversionData.current}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Ziel Rate</span>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>{conversionData.target}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Betroffene Nutzer</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '16px' }}>{conversionData.users}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🆓➡️💰</div>
            <p style={{ margin: 0 }}>Starte Kampagne für detaillierte Analyse</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FreeToPostConverter;