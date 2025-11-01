// src/pages/Advanced/MemorySystem.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

interface MemoryStats {
  totalEntries: number;
  cacheSize: string;
  hitRate: number;
  lastCleared: string;
}

const MemorySystem: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [memoryType, setMemoryType] = useState('short-term');
  const [maxEntries, setMaxEntries] = useState('1000');
  const [ttl, setTtl] = useState('3600');
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);

  const memoryTypes = [
    { value: 'short-term', label: 'Kurzzeit', icon: '⚡', description: 'Session Memory' },
    { value: 'long-term', label: 'Langzeit', icon: '💾', description: 'Persistent Storage' },
    { value: 'context', label: 'Kontext', icon: '🧠', description: 'Context Window' },
    { value: 'cache', label: 'Cache', icon: '🗄️', description: 'Fast Access' }
  ];

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMemoryStats({
        totalEntries: Math.floor(Math.random() * 5000) + 1000,
        cacheSize: `${(Math.random() * 100 + 50).toFixed(2)} MB`,
        hitRate: Math.floor(Math.random() * 30) + 70,
        lastCleared: new Date().toLocaleString('de-DE')
      });
      
      showToast('Memory System optimiert!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimierungsfehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    setMemoryStats(null);
    showToast('Cache geleert!', 'success');
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>💾 Memory System</h1>
        <p>KI-Gedächtnisverwaltung für personalisierte Ergebnisse</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Memory-Konfiguration</h3>

          <div className="form-group">
            <label>Memory-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {memoryTypes.map(type => (
                <motion.div key={type.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setMemoryType(type.value)}
                  style={{ padding: '14px', background: memoryType === type.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: memoryType === type.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{type.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{type.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Max. Einträge</label>
            <input type="number" value={maxEntries} onChange={(e) => setMaxEntries(e.target.value)} min="100" max="10000" className="form-input" />
          </div>

          <div className="form-group">
            <label>TTL (Time To Live in Sekunden)</label>
            <input type="number" value={ttl} onChange={(e) => setTtl(e.target.value)} min="60" max="86400" className="form-input" />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <LoadingButton onClick={handleOptimize} loading={loading} loadingText="Optimiere...">💾 Optimieren</LoadingButton>
            <motion.button onClick={handleClearCache} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ flex: 1, padding: '12px', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.5)', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
              🗑️ Cache Leeren
            </motion.button>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Memory-Statistiken</h3>
          {memoryStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Gesamt-Einträge</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>{memoryStats.totalEntries.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Cache-Größe</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>{memoryStats.cacheSize}</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Hit Rate</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>{memoryStats.hitRate}%</div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${memoryStats.hitRate}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', transition: 'width 0.5s' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Zuletzt geleert</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{memoryStats.lastCleared}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💾</div>
              <p>Keine Memory-Daten verfügbar</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Starte die Optimierung</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MemorySystem;