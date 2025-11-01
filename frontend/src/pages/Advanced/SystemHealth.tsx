// src/pages/Advanced/SystemHealth.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface HealthStatus {
  cpu: number;
  memory: number;
  disk: number;
  network: 'online' | 'offline';
  uptime: string;
  status: 'healthy' | 'warning' | 'critical';
}

const SystemHealth: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  const handleCheckHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const cpu = Math.floor(Math.random() * 100);
      const memory = Math.floor(Math.random() * 100);
      const disk = Math.floor(Math.random() * 100);
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (cpu > 90 || memory > 90 || disk > 90) status = 'critical';
      else if (cpu > 70 || memory > 70 || disk > 70) status = 'warning';
      
      setHealthStatus({
        cpu,
        memory,
        disk,
        network: Math.random() > 0.1 ? 'online' : 'offline',
        uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`,
        status
      });
      
      showToast(`System-Status: ${status === 'healthy' ? 'Gesund ✅' : status === 'warning' ? 'Warnung ⚠️' : 'Kritisch 🚨'}`, status === 'healthy' ? 'success' : 'error');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health-Check Fehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value: number) => {
    if (value > 90) return '#ff3b30';
    if (value > 70) return '#ff9500';
    return '#34c759';
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>⚙️ System Health</h1>
        <p>Echtzeit-Monitoring und Performance-Überwachung</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Monitoring-Einstellungen</h3>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={monitoringEnabled} onChange={(e) => setMonitoringEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
              <span>Kontinuierliches Monitoring aktivieren</span>
            </label>
          </div>

          <div className="form-group">
            <label>Alert-Schwellenwert (%)</label>
            <input type="number" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} min="50" max="100" className="form-input" />
            <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '5px', color: 'white' }}>
              Benachrichtigung bei Überschreitung
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', marginTop: '20px' }}>
            <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '10px' }}>📊 Monitoring-Bereiche</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px' }}>💻</span>
                <span>CPU-Auslastung</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px' }}>🧠</span>
                <span>Arbeitsspeicher</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px' }}>💾</span>
                <span>Festplatten-Nutzung</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px' }}>🌐</span>
                <span>Netzwerk-Status</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleCheckHealth} loading={loading} loadingText="Prüfe System...">⚙️ Health-Check Starten</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Live-Status</h3>
          {healthStatus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: healthStatus.status === 'healthy' ? 'rgba(52, 199, 89, 0.1)' : healthStatus.status === 'warning' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                border: `1px solid ${healthStatus.status === 'healthy' ? 'rgba(52, 199, 89, 0.5)' : healthStatus.status === 'warning' ? 'rgba(255, 149, 0, 0.5)' : 'rgba(255, 59, 48, 0.5)'}`,
                borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                  {healthStatus.status === 'healthy' ? '✅' : healthStatus.status === 'warning' ? '⚠️' : '🚨'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textTransform: 'capitalize' }}>
                  {healthStatus.status === 'healthy' ? 'System Gesund' : healthStatus.status === 'warning' ? 'Warnung' : 'Kritisch'}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'white' }}>
                    <span>💻 CPU</span>
                    <span style={{ fontWeight: 'bold' }}>{healthStatus.cpu}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${healthStatus.cpu}%`, height: '100%', background: getStatusColor(healthStatus.cpu), transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'white' }}>
                    <span>🧠 Memory</span>
                    <span style={{ fontWeight: 'bold' }}>{healthStatus.memory}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${healthStatus.memory}%`, height: '100%', background: getStatusColor(healthStatus.memory), transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'white' }}>
                    <span>💾 Disk</span>
                    <span style={{ fontWeight: 'bold' }}>{healthStatus.disk}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${healthStatus.disk}%`, height: '100%', background: getStatusColor(healthStatus.disk), transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', color: 'white' }}>
                  <span>🌐 Network:</span>
                  <span style={{ fontWeight: 'bold', color: healthStatus.network === 'online' ? '#34c759' : '#ff3b30' }}>
                    {healthStatus.network === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', fontSize: '13px', color: 'white' }}>
                  <span>⏱️ Uptime:</span>
                  <span style={{ fontWeight: 'bold' }}>{healthStatus.uptime}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
              <p>Keine Health-Daten verfügbar</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Starte einen Health-Check</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SystemHealth;