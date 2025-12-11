// src/pages/PaymentFinances/PaymentVerifier.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { paymentApi } from '../../services/productApi';
import type { PaymentVerificationResult } from '../../types/product';
import './page.css';

const PaymentVerifier: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();

  const [form, setForm] = useState({
    transactionId: '',
    amount: 49,
    currency: 'EUR',
    customerEmail: '',
    ipAddress: '',
    paymentMethod: 'card',
    signature: '',
    payload: '',
    environment: 'staging' as 'prod' | 'staging' | 'dev',
  });

  const [result, setResult] = useState<PaymentVerificationResult | null>(null);

  const updateField = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleVerify = async () => {
    if (!form.transactionId.trim()) {
      showToast('Bitte Transaktions-ID eingeben', 'error');
      return;
    }
    if (!form.customerEmail.trim()) {
      showToast('Bitte Kunden-Email eingeben', 'error');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      showToast('Betrag muss > 0 sein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.verifyTransaction({
        ...form,
        transactionId: form.transactionId.trim(),
        customerEmail: form.customerEmail.trim(),
        signature: form.signature.trim() || 'not-provided',
        payload: form.payload.trim() || 'not-provided',
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Verifikation fehlgeschlagen');
      }

      setResult(response.data);
      showToast(response.data.valid ? 'Verifikation erfolgreich' : 'Verifikation mit Findings', response.data.valid ? 'success' : 'error');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verifikationsfehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (level: PaymentVerificationResult['riskLevel']) => {
    switch (level) {
      case 'low':
        return 'rgba(52, 199, 89, 0.15)';
      case 'medium':
        return 'rgba(255, 204, 0, 0.15)';
      case 'high':
        return 'rgba(255, 149, 0, 0.18)';
      case 'critical':
        return 'rgba(255, 59, 48, 0.2)';
      default:
        return 'rgba(255,255,255,0.05)';
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
            <input
              type="text"
              value={form.transactionId}
              onChange={(e) => updateField('transactionId', e.target.value)}
              placeholder="TXN-ABC123XYZ"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Betrag *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => updateField('amount', Number(e.target.value))}
              placeholder="49.00"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Währung *</label>
            <select value={form.currency} onChange={(e) => updateField('currency', e.target.value)} className="form-input">
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="form-group">
            <label>Kunden-Email *</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => updateField('customerEmail', e.target.value)}
              placeholder="kunde@example.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>IP-Adresse</label>
            <input
              type="text"
              value={form.ipAddress}
              onChange={(e) => updateField('ipAddress', e.target.value)}
              placeholder="203.0.113.42"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Payment-Methode</label>
            <select value={form.paymentMethod} onChange={(e) => updateField('paymentMethod', e.target.value)} className="form-input">
              <option value="card">Card</option>
              <option value="paypal">PayPal</option>
              <option value="apple-pay">Apple Pay</option>
              <option value="klarna">Klarna</option>
            </select>
          </div>

          <div className="form-group">
            <label>Signatur (optional)</label>
            <input
              type="text"
              value={form.signature}
              onChange={(e) => updateField('signature', e.target.value)}
              placeholder="Webhook-Signatur"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Payload (JSON / Rohdaten, optional)</label>
            <textarea
              value={form.payload}
              onChange={(e) => updateField('payload', e.target.value)}
              placeholder="Webhook-Payload oder Gateway-Rohdaten"
              className="form-input"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Environment</label>
            <select value={form.environment} onChange={(e) => updateField('environment', e.target.value)} className="form-input">
              <option value="prod">prod</option>
              <option value="staging">staging</option>
              <option value="dev">dev</option>
            </select>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleVerify} loading={loading} loadingText="Verifiziere...">✅ Jetzt Verifizieren</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Verifikations-Status</h3>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div
                style={{
                  background: riskColor(result.riskLevel),
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Risk Level</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>{result.riskLevel}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Action: {result.recommendedAction}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Score</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'white' }}>{Math.round(result.riskScore)}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{result.valid ? 'Validiert' : 'Warnungen gefunden'}</div>
                </div>
              </div>

              {!!result.flags.length && (
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '10px' }}>Flags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.flags.map((flag, idx) => (
                      <span key={idx} style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: 'white' }}>
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.reasoning && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', color: 'rgba(255,255,255,0.85)' }}>
                  {result.reasoning}
                </div>
              )}

              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Checks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.checks.map((check, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{check.name}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{check.detail}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '12px', color: check.status === 'pass' ? '#34c759' : check.status === 'fail' ? '#ff3b30' : '#ffcc00' }}>
                        {check.status}
                      </div>
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