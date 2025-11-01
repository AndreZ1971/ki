// src/pages/PaymentFinances/PaymentValidation.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentValidation: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [cardNumber, setCardNumber] = useState('');
  const [validationResult, setValidationResult] = useState<{valid: boolean; risks: string[]} | null>(null);

  const handleValidate = async () => {
    if (!cardNumber) {
      showToast('Bitte Kartendetails eingeben', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const risks = Math.random() > 0.7 ? ['Ungewöhnliches Kaufverhalten', 'Neue IP-Adresse'] : [];
      setValidationResult({ valid: risks.length === 0, risks });
      showToast(risks.length === 0 ? 'Validierung erfolgreich! 🔐' : 'Risiken erkannt! ⚠️', risks.length === 0 ? 'success' : 'error');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validierungsfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🔐 Payment Validation</h1>
        <p>Sichere Validierung und Fraud-Detection</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Validierungs-Daten</h3>

          <div className="form-group">
            <label>Kartennummer (Test) *</label>
            <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" className="form-input" />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', marginTop: '15px' }}>
            <h4 style={{ color: 'white', fontSize: '13px', marginBottom: '10px' }}>🔐 Security Checks</h4>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>✓ Fraud Detection</div>
              <div>✓ 3D Secure</div>
              <div>✓ CVV Validation</div>
              <div>✓ Address Verification</div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleValidate} loading={loading} loadingText="Validiere...">🔐 Jetzt Validieren</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Validierungs-Ergebnis</h3>
          {validationResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: validationResult.valid ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                border: `1px solid ${validationResult.valid ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 149, 0, 0.5)'}`,
                borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '15px' }}>{validationResult.valid ? '🔐' : '⚠️'}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                  {validationResult.valid ? 'Sicher' : 'Risiken Erkannt'}
                </div>
              </div>
              {validationResult.risks.length > 0 && (
                <div style={{ background: 'rgba(255, 149, 0, 0.1)', border: '1px solid rgba(255, 149, 0, 0.3)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '10px' }}>⚠️ Erkannte Risiken:</div>
                  {validationResult.risks.map((risk, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'white', marginBottom: '6px' }}>• {risk}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
              <p>Keine Validierung durchgeführt</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentValidation;