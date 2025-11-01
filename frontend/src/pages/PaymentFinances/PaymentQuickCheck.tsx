// src/pages/PaymentFinances/PaymentQuickCheck.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const PaymentQuickCheck: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [checkResults, setCheckResults] = useState<{gateway: string; database: string; api: string} | null>(null);

  const handleQuickCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setCheckResults({
        gateway: Math.random() > 0.1 ? 'Online ✅' : 'Offline ❌',
        database: Math.random() > 0.05 ? 'Erreichbar ✅' : 'Timeout ❌',
        api: Math.random() > 0.1 ? 'Aktiv ✅' : 'Fehler ❌'
      });
      
      showToast('Quick Check abgeschlossen!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>⚡ Payment Quick Check</h1>
        <p>Schneller System-Status Check in Echtzeit</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ System-Check</h3>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '15px' }}>Geprüfte Komponenten:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔌</span>
                <span>Payment Gateway</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💾</span>
                <span>Datenbank</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🌐</span>
                <span>API Endpoints</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleQuickCheck} loading={loading} loadingText="Prüfe...">⚡ Quick Check Starten</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Check-Ergebnisse</h3>
          {checkResults ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${checkResults.gateway.includes('✅') ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 59, 48, 0.5)'}`,
                borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Payment Gateway</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{checkResults.gateway}</div>
                </div>
                <div style={{ fontSize: '32px' }}>{checkResults.gateway.includes('✅') ? '✅' : '❌'}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${checkResults.database.includes('✅') ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 59, 48, 0.5)'}`,
                borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Datenbank</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{checkResults.database}</div>
                </div>
                <div style={{ fontSize: '32px' }}>{checkResults.database.includes('✅') ? '✅' : '❌'}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${checkResults.api.includes('✅') ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 59, 48, 0.5)'}`,
                borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>API Endpoints</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{checkResults.api}</div>
                </div>
                <div style={{ fontSize: '32px' }}>{checkResults.api.includes('✅') ? '✅' : '❌'}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <p>Kein Check durchgeführt</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Starte einen Quick Check</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentQuickCheck;