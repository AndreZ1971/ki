// src/pages/Advanced/MemorySystem.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { memoryApi } from '../../services/memoryApi';
import type { MemoryStats, MemoryMessage } from '../../services/memoryApi';
import './page.css';

const MemorySystem: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [memoryType, setMemoryType] = useState('short-term');
  const [maxEntries, setMaxEntries] = useState('1000');
  const [ttl, setTtl] = useState('3600');
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [messages, setMessages] = useState<MemoryMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const ttlSeconds = useMemo(() => Math.max(60, Math.min(86400, Number(ttl) || 0)), [ttl]);
  const maxEntriesNum = useMemo(() => Math.max(100, Math.min(10000, Number(maxEntries) || 0)), [maxEntries]);

  const memoryTypes = [
    { value: 'short-term', label: 'Kurzzeit', icon: '⚡', description: 'Session Memory' },
    { value: 'long-term', label: 'Langzeit', icon: '💾', description: 'Persistent Storage' },
    { value: 'context', label: 'Kontext', icon: '🧠', description: 'Context Window' },
    { value: 'cache', label: 'Cache', icon: '🗄️', description: 'Fast Access' }
  ];

  const loadStats = async () => {
    const res = await memoryApi.getStats();
    if (res.success && res.data) {
      setMemoryStats(res.data);
    } else if (res.error) {
      showToast(res.error, 'error');
    }
  };

  const loadMessages = async () => {
    setLoadingMessages(true);
    const res = await memoryApi.getMessages(5, 0);
    if (res.success && (res as any).data?.messages) {
      setMessages((res as any).data.messages);
    }
    setLoadingMessages(false);
  };

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await memoryApi.optimize({ maxEntries: maxEntriesNum, ttlSeconds });
      if (!res.success || !res.data) throw new Error(res.error || 'Optimierung fehlgeschlagen');
      setMemoryStats(res.data);
      showToast('Memory optimiert', 'success');
      await loadMessages();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimierungsfehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await memoryApi.clear();
      if (!res.success) throw new Error(res.error || 'Konnte Memory nicht leeren');
      setMemoryStats({ totalMessages: 0, memorySize: 0, lastCleared: Date.now() });
      setMessages([]);
      showToast('Memory geleert', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Leeren';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadMessages();
  }, [loadStats, loadMessages]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(1)} ${sizes[i]}`;
  };

  const lastClearedDisplay = memoryStats?.lastCleared
    ? new Date(memoryStats.lastCleared).toLocaleString('de-DE')
    : '–';

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
                <div style={{ fontSize: '14px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Gesamt-Messages</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>{memoryStats.totalMessages.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Speicher</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{formatBytes(memoryStats.memorySize)}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '5px' }}>Zuletzt geleert</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{lastClearedDisplay}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Limit: {maxEntriesNum} • TTL: {ttlSeconds}s</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '12px', opacity: 0.8, color: 'white', marginBottom: '6px' }}>Zuletzt gespeicherte Nachrichten</div>
                {loadingMessages ? <div style={{ color: 'rgba(255,255,255,0.7)' }}>Lade…</div> : messages.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {messages.map((msg, idx) => (
                      <div key={idx} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{msg.role} • {new Date(msg.timestamp).toLocaleString('de-DE')}</div>
                        <div style={{ color: 'white', fontSize: '12px' }}>{msg.content}</div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color: 'rgba(255,255,255,0.7)' }}>Keine Nachrichten vorhanden</div>}
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