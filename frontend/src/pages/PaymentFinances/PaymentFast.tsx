// src/pages/PaymentFinances/PaymentFast.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface PaymentResult {
  transactionId: string;
  status: 'success' | 'failed';
  amount: string;
  timestamp: string;
  processingTime: string;
}

const PaymentFast: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const currencies = ['EUR', 'USD', 'GBP', 'CHF'];

  const handleProcess = async () => {
    if (!amount || !customerEmail) {
      showToast('Bitte fülle alle Felder aus', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const processingTime = `${Date.now() - startTime}ms`;
      setPaymentResult({
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'success',
        amount: `${amount} ${currency}`,
        timestamp: new Date().toLocaleString('de-DE'),
        processingTime
      });
      
      showToast('Payment erfolgreich verarbeitet! ⚡', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment-Fehler';
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
        <h1>⚡ Payment Fast</h1>
        <p>Blitzschnelle Payment-Verarbeitung in Echtzeit</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>💳 Payment-Details</h3>

          <div className="form-group">
            <label>Betrag *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="z.B. 99.99" step="0.01" min="0" className="form-input" />
          </div>

          <div className="form-group">
            <label>Währung</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="form-input">
              {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Kunden-Email *</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="kunde@beispiel.de" className="form-input" />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', marginTop: '15px' }}>
            <h4 style={{ color: 'white', fontSize: '13px', marginBottom: '10px' }}>⚡ Fast Payment Features</h4>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>✅ Verarbeitung in unter 1 Sekunde</div>
              <div>✅ Sofortige Bestätigung</div>
              <div>✅ Automatische Benachrichtigung</div>
              <div>✅ 99.9% Erfolgsquote</div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleProcess} loading={loading} loadingText="Verarbeite...">⚡ Sofort Verarbeiten</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Transaktions-Status</h3>
          {paymentResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: paymentResult.status === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                border: `1px solid ${paymentResult.status === 'success' ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 59, 48, 0.5)'}`,
                borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '15px' }}>{paymentResult.status === 'success' ? '✅' : '❌'}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                  {paymentResult.status === 'success' ? 'Erfolgreich!' : 'Fehlgeschlagen'}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>{paymentResult.amount}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Transaktions-ID</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', fontFamily: 'monospace' }}>{paymentResult.transactionId}</div>
                </div>

                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Zeitstempel</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{paymentResult.timestamp}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Verarbeitungszeit</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#34c759' }}>⚡ {paymentResult.processingTime}</div>
                </div>
              </div>

              <motion.button onClick={() => setPaymentResult(null)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.2)', border: '1px solid rgba(102, 126, 234, 0.5)', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                🔄 Neue Transaktion
              </motion.button>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <p>Keine Transaktion aktiv</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Starte eine Payment-Verarbeitung</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentFast;