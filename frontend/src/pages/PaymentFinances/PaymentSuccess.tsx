// src/pages/PaymentFinances/PaymentSuccess.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentSuccess: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [timeRange, setTimeRange] = useState('today');
  const [successMetrics, setSuccessMetrics] = useState<{total: number; successRate: number; revenue: string} | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMetrics({
        total: Math.floor(Math.random() * 500) + 100,
        successRate: Math.floor(Math.random() * 20) + 80,
        revenue: `${(Math.random() * 10000 + 5000).toFixed(2)} EUR`
      });
      showToast('Analyse abgeschlossen!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysefehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🎉 Payment Success</h1>
        <p>Analyse erfolgreicher Transaktionen und Umsätze</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Analyse-Zeitraum</h3>

          <div className="form-group">
            <label>Zeitraum</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="form-input">
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
              <option value="month">Dieser Monat</option>
              <option value="year">Dieses Jahr</option>
            </select>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleAnalyze} loading={loading} loadingText="Analysiere...">🎉 Erfolge Analysieren</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Erfolgs-Metriken</h3>
          {successMetrics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.5)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>{successMetrics.total}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Erfolgreiche Transaktionen</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>{successMetrics.successRate}%</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Erfolgsrate</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>{successMetrics.revenue}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Gesamtumsatz</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <p>Keine Metriken verfügbar</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;