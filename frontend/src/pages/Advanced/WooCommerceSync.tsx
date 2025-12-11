// src/pages/Advanced/WooCommerceSync.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { wooCommerceSyncApi } from '../../services/productApi';
import './page.css';

interface SyncStats {
  products: number;
  orders: number;
  customers: number;
  lastSync: string;
  durationMs?: number;
  type?: SyncType;
}

type SyncType = 'full' | 'products' | 'orders' | 'customers';

const WooCommerceSync: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [syncType, setSyncType] = useState<SyncType>('full');
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState('30');
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [nextRun, setNextRun] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const syncTypes: { value: SyncType; label: string; icon: string; description: string }[] = [
    { value: 'full', label: 'Vollständig', icon: '🔄', description: 'Alle Daten' },
    { value: 'products', label: 'Nur Produkte', icon: '🛍️', description: 'Produkt-Sync' },
    { value: 'orders', label: 'Nur Bestellungen', icon: '📦', description: 'Order-Sync' },
    { value: 'customers', label: 'Nur Kunden', icon: '👥', description: 'Kunden-Sync' }
  ];

  const intervalMinutes = useMemo(() => {
    const parsed = Number(syncInterval);
    if (!Number.isFinite(parsed) || parsed < 5) return 5;
    return Math.min(parsed, 1440);
  }, [syncInterval]);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setLoading(true);
    setError(null);

    try {
      const response = await wooCommerceSyncApi.sync({ type: syncType });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Sync fehlgeschlagen');
      }

      const stats = response.data;
      setSyncStats({
        products: stats.products,
        orders: stats.orders,
        customers: stats.customers,
        lastSync: new Date(stats.lastSync).toLocaleString('de-DE'),
        durationMs: stats.durationMs,
        type: stats.type,
      });
      showToast(`Sync (${stats.type}) erfolgreich`, 'success');

      if (autoSync) {
        const next = new Date(Date.now() + intervalMinutes * 60 * 1000);
        setNextRun(next.toLocaleTimeString('de-DE'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Synchronisationsfehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [autoSync, intervalMinutes, setError, setLoading, showToast, syncType, syncing]);

  useEffect(() => {
    if (!autoSync) {
      setNextRun(null);
      return undefined;
    }
    const ms = intervalMinutes * 60 * 1000;
    const id = setInterval(() => {
      handleSync();
    }, ms);
    const next = new Date(Date.now() + ms);
    setNextRun(next.toLocaleTimeString('de-DE'));
    return () => clearInterval(id);
  }, [autoSync, handleSync, intervalMinutes]);

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
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>Min. 5 Minuten, aktuell: {intervalMinutes} min</div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleSync} loading={loading || syncing} loadingText="Synchronisiere...">🔄 Jetzt Synchronisieren</LoadingButton>
            {autoSync && nextRun && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>Nächster Auto-Sync ca. {nextRun}</div>
            )}
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
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{syncStats.customers}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>Kunden synchronisiert</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', marginTop: '10px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Letzte Synchronisation</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{syncStats.lastSync}</div>
                {syncStats.durationMs ? (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>Dauer: {syncStats.durationMs} ms</div>
                ) : null}
                {syncStats.type ? (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Typ: {syncStats.type}</div>
                ) : null}
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