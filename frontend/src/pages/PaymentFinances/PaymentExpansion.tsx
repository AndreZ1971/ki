// src/pages/PaymentFinances/PaymentExpansion.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentExpansion: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [targetRegion, setTargetRegion] = useState('eu');
  const [expansionPlan, setExpansionPlan] = useState<{markets: number; revenue: string; timeframe: string} | null>(null);

  const regions = [
    { value: 'eu', label: 'Europa', icon: '🇪🇺' },
    { value: 'us', label: 'USA', icon: '🇺🇸' },
    { value: 'asia', label: 'Asien', icon: '🌏' },
    { value: 'global', label: 'Global', icon: '🌍' }
  ];

  const handlePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setExpansionPlan({
        markets: Math.floor(Math.random() * 20) + 10,
        revenue: `${(Math.random() * 500 + 100).toFixed(0)}K EUR`,
        timeframe: `${Math.floor(Math.random() * 6) + 6} Monate`
      });
      showToast('Expansionsplan erstellt!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Planungsfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>📈 Payment Expansion</h1>
        <p>Strategische Expansion und Markterschließung</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Zielmarkt</h3>

          <div className="form-group">
            <label>Region</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {regions.map(region => (
                <motion.div key={region.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTargetRegion(region.value)}
                  style={{ padding: '14px', background: targetRegion === region.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: targetRegion === region.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{region.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{region.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handlePlan} loading={loading} loadingText="Plane...">📈 Plan Erstellen</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Expansionsplan</h3>
          {expansionPlan ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>{expansionPlan.markets}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Neue Märkte</div>
              </div>
              <div style={{ background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.5)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>{expansionPlan.revenue}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Erwarteter Umsatz</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Zeitrahmen</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{expansionPlan.timeframe}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
              <p>Kein Plan erstellt</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentExpansion;