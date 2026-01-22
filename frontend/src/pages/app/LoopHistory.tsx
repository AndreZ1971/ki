// frontend/src/pages/app/LoopHistory.tsx
/**
 * Loop History - Zeigt automatische Cronjob-Läufe der Agentic Loops
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoopHistory.css';

interface HistoryEntry {
  timestamp: number;
  success: boolean;
  executionTime: number;
  insights: number;
  recommendations: number;
  error?: string;
}

interface LoopStats {
  totalRuns: number;
  successRate: number;
  avgExecutionTime: number;
  lastRun?: number;
}

const LOOP_TYPES = [
  { id: 'anomaly-detection', name: '🚨 Anomaly Detection', color: '#ef4444' },
  { id: 'product-performance', name: '📊 Product Performance', color: '#8b5cf6' },
  { id: 'payment-recovery', name: '💳 Payment Recovery', color: '#10b981' },
  { id: 'analytics-insights', name: '📈 Analytics Insights', color: '#3b82f6' },
];

const LoopHistory: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLoop, setSelectedLoop] = useState<string>('anomaly-detection');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<Record<string, LoopStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Load history for selected loop
  useEffect(() => {
    loadHistory(selectedLoop);
    loadAllStats();
  }, [selectedLoop]);

  const loadHistory = async (loopType: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/agent/monitoring/history/${loopType}`);
      if (!response.ok) throw new Error('Failed to load history');
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStats = async () => {
    const statsData: Record<string, LoopStats> = {};
    
    for (const loop of LOOP_TYPES) {
      try {
        const response = await fetch(`/api/agent/monitoring/stats/${loop.id}`);
        if (response.ok) {
          const data = await response.json();
          statsData[loop.id] = data.stats || {
            totalRuns: 0,
            successRate: 0,
            avgExecutionTime: 0,
          };
        }
      } catch (err) {
        console.error(`Failed to load stats for ${loop.id}:`, err);
      }
    }
    
    setStats(statsData);
  };

  const handleDownload = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/agent/monitoring/export/${selectedLoop}/${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedLoop}-history-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download fehlgeschlagen');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms || isNaN(ms) || !isFinite(ms)) return '–';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const filteredHistory = history.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'success') return entry.success;
    if (filter === 'failed') return !entry.success;
    return true;
  });

  return (
    <div className="loop-history">
      {/* Header */}
      <div className="history-header">
        <div className="header-content">
          <h1>📜 Loop Execution History</h1>
          <p>Automatische Cronjob-Läufe der Agentic Loops</p>
        </div>
        <button className="back-button" onClick={() => navigate('/agentic-loops')}>
          ← Zurück
        </button>
      </div>

      {/* Loop Selector & Stats */}
      <div className="loop-selector">
        {LOOP_TYPES.map((loop) => {
          const loopStats = stats[loop.id];
          return (
            <div
              key={loop.id}
              className={`loop-card ${selectedLoop === loop.id ? 'selected' : ''}`}
              onClick={() => setSelectedLoop(loop.id)}
              style={{ borderLeftColor: loop.color }}
            >
              <div className="loop-card-header">
                <span className="loop-name">{loop.name}</span>
                {loopStats && loopStats.totalRuns > 0 && (
                  <span className="success-rate" style={{ color: loop.color }}>
                    {(loopStats.successRate * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="loop-card-stats">
                <div className="stat">
                  <span className="stat-label">Runs:</span>
                  <span className="stat-value">{loopStats?.totalRuns || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg:</span>
                  <span className="stat-value">
                    {loopStats ? formatDuration(loopStats.avgExecutionTime) : '-'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="history-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          <button
            className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
            onClick={() => setFilter('success')}
          >
            ✅ Erfolgreich
          </button>
          <button
            className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
            onClick={() => setFilter('failed')}
          >
            ❌ Fehlgeschlagen
          </button>
        </div>

        <div className="export-buttons">
          <button className="export-btn" onClick={() => handleDownload('json')}>
            📥 JSON
          </button>
          <button className="export-btn" onClick={() => handleDownload('csv')}>
            📥 CSV
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="history-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Lade Verlauf...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Keine Einträge gefunden</p>
            <small>
              {filter !== 'all'
                ? 'Probiere einen anderen Filter'
                : 'Dieser Loop wurde noch nicht automatisch ausgeführt'}
            </small>
          </div>
        ) : (
          <div className="history-table">
            <div className="table-header">
              <div className="col-timestamp">Zeitstempel</div>
              <div className="col-status">Status</div>
              <div className="col-duration">Dauer</div>
              <div className="col-insights">Insights</div>
              <div className="col-recommendations">Empfehlungen</div>
            </div>

            {filteredHistory.map((entry, index) => (
              <div
                key={index}
                className={`table-row ${entry.success ? 'success' : 'failed'}`}
              >
                <div className="col-timestamp">{formatDate(entry.timestamp)}</div>
                <div className="col-status">
                  {entry.success ? (
                    <span className="status-badge success">✅ Erfolg</span>
                  ) : (
                    <span className="status-badge failed">❌ Fehler</span>
                  )}
                </div>
                <div className="col-duration">{formatDuration(entry.executionTime)}</div>
                <div className="col-insights">{entry.insights}</div>
                <div className="col-recommendations">{entry.recommendations}</div>
                {!entry.success && entry.error && (
                  <div className="row-error">{entry.error}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {history.length > 0 && (
        <div className="history-summary">
          <div className="summary-card">
            <span className="summary-label">Gesamt</span>
            <span className="summary-value">{filteredHistory.length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Erfolgsrate</span>
            <span className="summary-value">
              {filteredHistory.length > 0
                ? ((filteredHistory.filter((e) => e.success).length / filteredHistory.length) * 100).toFixed(0)
                : '–'}%
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">⏱️ Ø Dauer</span>
            <span className={`summary-value ${filteredHistory.length === 0 ? 'empty' : ''}`}>
              {filteredHistory.length > 0
                ? formatDuration(
                    filteredHistory.reduce((sum, e) => sum + e.executionTime, 0) /
                      filteredHistory.length
                  )
                : '–'}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">💡 Gesamt Insights</span>
            <span className={`summary-value ${filteredHistory.length === 0 ? 'empty' : ''}`}>
              {filteredHistory.length > 0
                ? filteredHistory.reduce((sum, e) => sum + (e.insights || 0), 0)
                : '–'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoopHistory;
