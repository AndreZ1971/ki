// src/pages/PaymentFinances/PaymentIssuedDetector.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface Issue { type: string; severity: 'low' | 'medium' | 'high'; description: string; }

const PaymentIssuedDetector: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [scanDepth, setScanDepth] = useState('standard');
  const [detectedIssues, setDetectedIssues] = useState<Issue[]>([]);

  const handleScan = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockIssues: Issue[] = [
        { type: 'Timeout', severity: 'high' as const, description: 'Gateway-Timeout bei 5% der Transaktionen' },
        { type: 'Retry', severity: 'medium' as const, description: 'Erhöhte Retry-Rate erkannt' },
        { type: 'Validation', severity: 'low' as const, description: 'Inkonsistente Adress-Validierung' }
      ].filter(() => Math.random() > 0.3);
      
      setDetectedIssues(mockIssues);
      showToast(`${mockIssues.length} Issue(s) erkannt`, mockIssues.length > 0 ? 'error' : 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan-Fehler');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'high' ? '#ff3b30' : severity === 'medium' ? '#ff9500' : '#ffcc00';
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>📋 Payment Issue Detector</h1>
        <p>Automatische Erkennung und Analyse von Payment-Problemen</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Scan-Einstellungen</h3>

          <div className="form-group">
            <label>Scan-Tiefe</label>
            <select value={scanDepth} onChange={(e) => setScanDepth(e.target.value)} className="form-input">
              <option value="quick">Schnell</option>
              <option value="standard">Standard</option>
              <option value="deep">Tiefgehend</option>
            </select>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleScan} loading={loading} loadingText="Scanne...">📋 System Scannen</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>🔍 Erkannte Issues</h3>
          {detectedIssues.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {detectedIssues.map((issue, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: `2px solid ${getSeverityColor(issue.severity)}`,
                  borderRadius: '12px', padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{issue.type}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: getSeverityColor(issue.severity), textTransform: 'uppercase', padding: '4px 8px', background: `${getSeverityColor(issue.severity)}20`, borderRadius: '6px' }}>
                      {issue.severity}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{issue.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p>Keine Issues erkannt</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentIssuedDetector;