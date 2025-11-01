// src/pages/PaymentFinances/PaymentDelivery.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentDelivery: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [orderId, setOrderId] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<{status: string; location: string; eta: string} | null>(null);

  const handleTrack = async () => {
    if (!orderId) {
      showToast('Bitte Bestell-ID eingeben', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statuses = ['In Bearbeitung', 'Versandt', 'Unterwegs', 'Zugestellt'];
      setDeliveryStatus({
        status: statuses[Math.floor(Math.random() * statuses.length)],
        location: 'Hamburg Depot',
        eta: new Date(Date.now() + 86400000).toLocaleDateString('de-DE')
      });
      showToast('Tracking aktualisiert!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tracking-Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>📦 Payment Delivery</h1>
        <p>Versandverfolgung und Lieferstatus-Management</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Tracking</h3>

          <div className="form-group">
            <label>Bestell-ID *</label>
            <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-789456" className="form-input" />
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleTrack} loading={loading} loadingText="Suche...">📦 Status Abrufen</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Lieferstatus</h3>
          {deliveryStatus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.5)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📦</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{deliveryStatus.status}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Aktueller Standort</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{deliveryStatus.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Voraussichtliche Lieferung</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{deliveryStatus.eta}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <p>Kein Tracking aktiv</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentDelivery;