// src/pages/PaymentFinances/PaymentEmergency.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentEmergency: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [issueType, setIssueType] = useState('gateway-down');
  const [description, setDescription] = useState('');
  const [ticketCreated, setTicketCreated] = useState<{id: string; priority: string} | null>(null);

  const issues = [
    { value: 'gateway-down', label: 'Gateway Ausfall', icon: '🚨' },
    { value: 'fraud-alert', label: 'Fraud Alert', icon: '⚠️' },
    { value: 'refund-issue', label: 'Rückerstattung', icon: '💸' },
    { value: 'other', label: 'Sonstiges', icon: '❓' }
  ];

  const handleReport = async () => {
    if (!description) {
      showToast('Bitte Beschreibung eingeben', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTicketCreated({
        id: `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        priority: issueType === 'gateway-down' ? 'KRITISCH' : 'HOCH'
      });
      showToast('Notfall-Ticket erstellt! 🚨', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🚨 Payment Emergency</h1>
        <p>Notfall-System für kritische Payment-Probleme</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Notfall Melden</h3>

          <div className="form-group">
            <label>Problem-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {issues.map(issue => (
                <motion.div key={issue.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIssueType(issue.value)}
                  style={{ padding: '12px', background: issueType === issue.value ? 'linear-gradient(135deg, #ff3b30 0%, #ff9500 100%)' : 'rgba(255,255,255,0.05)',
                    border: issueType === issue.value ? '2px solid rgba(255, 59, 48, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{issue.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>{issue.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Beschreibung *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibe das Problem..." className="form-input" rows={4} />
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleReport} loading={loading} loadingText="Melde...">🚨 Notfall Melden</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Ticket-Status</h3>
          {ticketCreated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(255, 59, 48, 0.1)', border: '2px solid rgba(255, 59, 48, 0.5)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '15px' }}>🚨</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>Notfall Gemeldet</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Support wurde benachrichtigt</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Ticket-ID</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', fontFamily: 'monospace' }}>{ticketCreated.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Priorität</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff3b30' }}>{ticketCreated.priority}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
              <p>Kein aktives Notfall-Ticket</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentEmergency;