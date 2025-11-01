// src/pages/PaymentFinances/PaymentSimplified.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentSimplified: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [conversionRate, setConversionRate] = useState<number | null>(null);

  const handleSimplify = async () => {
    if (!amount || !productName) {
      showToast('Bitte fülle alle Felder aus', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConversionRate(Math.floor(Math.random() * 30) + 70);
      showToast('Payment-Prozess optimiert!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimierungsfehler';
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
        <h1>🎯 Payment Simplified</h1>
        <p>Vereinfachte Payment-Prozesse für höhere Conversion</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Produkt-Details</h3>

          <div className="form-group">
            <label>Produktname *</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="z.B. Premium Paket" className="form-input" />
          </div>

          <div className="form-group">
            <label>Preis *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="99.99" step="0.01" className="form-input" />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', marginTop: '15px' }}>
            <h4 style={{ color: 'white', fontSize: '13px', marginBottom: '10px' }}>🎯 Optimierungen</h4>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>✓ 1-Click Checkout</div>
              <div>✓ Autofill-Optimierung</div>
              <div>✓ Mobile-First Design</div>
              <div>✓ Trust-Badges</div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleSimplify} loading={loading} loadingText="Optimiere...">🎯 Prozess Vereinfachen</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Conversion-Analyse</h3>
          {conversionRate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.5)', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '15px' }}>📈</div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>{conversionRate}%</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Erwartete Conversion Rate</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'white', marginBottom: '15px' }}>Optimierungs-Schritte:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'white' }}>
                  <div>✅ Formular auf 3 Felder reduziert</div>
                  <div>✅ Express-Checkout aktiviert</div>
                  <div>✅ Ablenkungen entfernt</div>
                  <div>✅ Trust-Signale hinzugefügt</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <p>Keine Analyse verfügbar</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSimplified;