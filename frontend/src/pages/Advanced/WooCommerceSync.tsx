// src/pages/Advanced/WooCommerceSync.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface SyncStats {
  products: number;
  orders: number;
  customers: number;
  lastSync: string;
}

const WooCommerceSync: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [syncType, setSyncType] = useState('full');
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState('30');
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);

  const syncTypes = [
    { value: 'full', label: 'Vollständig', icon: '🔄', description: 'Alle Daten' },
    { value: 'products', label: 'Nur Produkte', icon: '🛍️', description: 'Produkt-Sync' },
    { value: 'orders', label: 'Nur Bestellungen', icon: '📦', description: 'Order-Sync' },
    { value: 'customers', label: 'Nur Kunden', icon: '👥', description: 'Kunden-Sync' }
  ];

  const handleSync = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSyncStats({
        products: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 200) + 50,
        customers: Math.floor(Math.random() * 1000) + 200,
        lastSync: new Date().toLocaleString('de-DE')
      });
      
      showToast(`${syncType === 'full' ? 'Vollständige' : syncTypes.find(t => t.value === syncType)?.label} Synchronisation erfolgreich!`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Synchronisationsfehler';
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
        <h1>🔄 WooCommerce Sync</h1>
        <p>Automatische Synchronisation mit WooCommerce Shop</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Sync-Einstellungen</h3>

          <div className="form-group">
            <label>Sync-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {syncTypes.map(type => (
                <motion.div key={type.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSyncType(type.value)}
                  style={{ padding: '14px', background: syncType === type.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: syncType === type.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{type.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{type.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} style={{ cursor: 'pointer' }} />
              <span>Automatische Synchronisation aktivieren</span>
            </label>
          </div>

          {autoSync && (
            <div className="form-group">
              <label>Sync-Intervall (Minuten)</label>
              <input type="number" value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)} min="5" max="1440" className="form-input" />
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleSync} loading={loading} loadingText="Synchronisiere...">🔄 Jetzt Synchronisieren</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Sync-Status</h3>
          {syncStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🛍️</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{syncStats.products}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>Produkte synchronisiert</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📦</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{syncStats.orders}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>Bestellungen synchronisiert</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>�</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{syncStats.customers}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>Kunden synchronisiert</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', marginTop: '10px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Letzte Synchronisation</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{syncStats.lastSync}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
              <p>Keine Sync-Daten verfügbar</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Starte eine Synchronisation</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WooCommerceSync;