// src/pages/PaymentFinances/PaymentUserFavor.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentUserFavor: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [customerId, setCustomerId] = useState('');
  const [preferences, setPreferences] = useState<{paymentMethod: string; language: string; currency: string} | null>(null);

  const handleAnalyze = async () => {
    if (!customerId) {
      showToast('Bitte Kunden-ID eingeben', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPreferences({
        paymentMethod: ['Kreditkarte', 'PayPal', 'SEPA'][Math.floor(Math.random() * 3)],
        language: 'Deutsch',
        currency: 'EUR'
      });
      showToast('Präferenzen geladen!', 'success');
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
        <h1>❤️ Payment User Favor</h1>
        <p>Personalisierte Payment-Erfahrungen für optimale Conversion</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Kunden-Analyse</h3>

          <div className="form-group">
            <label>Kunden-ID *</label>
            <input type="text" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="CUST-123456" className="form-input" />
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleAnalyze} loading={loading} loadingText="Analysiere...">❤️ Präferenzen Laden</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Kunden-Präferenzen</h3>
          {preferences ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Bevorzugte Zahlungsmethode</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{preferences.paymentMethod}</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Sprache</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{preferences.language}</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Währung</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{preferences.currency}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
              <p>Keine Präferenzen geladen</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentUserFavor;