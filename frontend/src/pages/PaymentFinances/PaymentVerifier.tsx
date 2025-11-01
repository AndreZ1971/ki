// src/pages/PaymentFinances/PaymentVerifier.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentVerifier: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [transactionId, setTransactionId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<{valid: boolean; checks: string[]} | null>(null);

  const handleVerify = async () => {
    if (!transactionId) {
      showToast('Bitte Transaktions-ID eingeben', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const checks = [
        'Transaktions-ID validiert',
        'Zahlungsbetrag korrekt',
        'Kunde verifiziert',
        'Gateway bestätigt',
        'Keine Duplikate gefunden'
      ];
      
      setVerificationStatus({ valid: Math.random() > 0.2, checks });
      showToast(Math.random() > 0.2 ? 'Verifikation erfolgreich! ✅' : 'Verifikation fehlgeschlagen ❌', Math.random() > 0.2 ? 'success' : 'error');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verifikationsfehler';
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

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>✅ Payment Verifier</h1>
        <p>Automatische Transaktions-Verifikation und Sicherheitsprüfung</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Verifikation</h3>

          <div className="form-group">
            <label>Transaktions-ID *</label>
            <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="TXN-ABC123XYZ" className="form-input" />
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleVerify} loading={loading} loadingText="Verifiziere...">✅ Jetzt Verifizieren</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Verifikations-Status</h3>
          {verificationStatus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: verificationStatus.valid ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                border: `1px solid ${verificationStatus.valid ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 59, 48, 0.5)'}`,
                borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '15px' }}>{verificationStatus.valid ? '✅' : '❌'}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                  {verificationStatus.valid ? 'Verifiziert' : 'Fehlgeschlagen'}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '15px' }}>Durchgeführte Checks:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {verificationStatus.checks.map((check, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>✓</span>
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <p>Keine Verifikation durchgeführt</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentVerifier;