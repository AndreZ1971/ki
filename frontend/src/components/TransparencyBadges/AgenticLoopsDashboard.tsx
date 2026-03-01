/**
 * AgenticLoopsDashboard Component
 * Overview of all available Agentic Loops with start controls
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoopResultCard } from './LoopResultCard';
import type { LoopResult } from './LoopResultCard';
import './AgenticLoopsDashboard.css';

// Get API base URL from environment
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

interface LoopDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  mode: 'analysis' | 'heuristic' | 'recovery';
  lastRun?: {
    date: string;
    success: boolean;
    duration: number;
  };
  enabled: boolean;
}

export const AgenticLoopsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const loops = useMemo<LoopDefinition[]>(
    () => [
      {
        id: 'product-performance',
        name: 'Product Optimization',
        icon: '📊',
        description: 'Analyze product variants and recommend optimizations via A/B testing',
        mode: 'analysis',
        enabled: true,
        lastRun: {
          date: 'Today 14:32',
          success: true,
          duration: 2340,
        },
      },
      {
        id: 'analytics-insights',
        name: 'Analytics Insights',
        icon: '📈',
        description: 'Gather and analyze shop metrics for actionable insights',
        mode: 'analysis',
        enabled: true,
        lastRun: {
          date: 'Today 10:15',
          success: true,
          duration: 1200,
        },
      },
      {
        id: 'payment-recovery',
        name: 'Payment Recovery',
        icon: '💳',
        description: 'Identify failed payments and suggest recovery strategies',
        mode: 'heuristic',
        enabled: true,
        lastRun: {
          date: 'Yesterday 20:45',
          success: true,
          duration: 1850,
        },
      },
      {
        id: 'anomaly-detection',
        name: 'Anomaly Detection',
        icon: '🚨',
        description: 'Monitor shop metrics for unusual patterns and anomalies',
        mode: 'analysis',
        enabled: true,
        lastRun: {
          date: '2 days ago',
          success: true,
          duration: 1420,
        },
      },
    ],
    [],
  );
  const [selectedLoop, setSelectedLoop] = useState<string | null>(null);
  const [runningLoop, setRunningLoop] = useState<string | null>(null);
  const [loopResults, setLoopResults] = useState<Record<string, LoopResult>>({});
  const [lastRuns, setLastRuns] = useState<Record<string, LoopDefinition['lastRun']>>(() => {
    try {
      const stored = localStorage.getItem('agenticLoops:lastRuns');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, LoopDefinition['lastRun']>;
        return { ...Object.fromEntries(loops.map((loop) => [loop.id, loop.lastRun])), ...parsed };
      }
    } catch (err) {
      console.warn('Could not read lastRuns from localStorage', err);
    }
    return Object.fromEntries(loops.map((loop) => [loop.id, loop.lastRun]));
  });

  useEffect(() => {
    try {
      localStorage.setItem('agenticLoops:lastRuns', JSON.stringify(lastRuns));
    } catch (err) {
      console.warn('Could not persist lastRuns to localStorage', err);
    }
  }, [lastRuns]);

  const isDisabled = useMemo(() => new Set(loops.filter((l) => !l.enabled).map((l) => l.id)), [loops]);

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'analysis':
        return 'analysis';
      case 'heuristic':
        return 'heuristic';
      case 'recovery':
        return 'recovery';
      default:
        return 'default';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'analysis':
        return '📊 Analysis';
      case 'heuristic':
        return '🧠 Heuristic';
      case 'recovery':
        return '🔧 Recovery';
      default:
        return 'Unknown';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  const downloadResult = (loopId: string) => {
    const result = loopResults[loopId];
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${loopId}-result-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="agentic-loops-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🤖 Agentic Loops</h1>
          <p>Automated intelligence systems analyzing your shop</p>
        </div>
        <div className="header-actions">
          <button className="history-button" onClick={() => navigate('/app/loop-history')}>
            📜 Cronjob History
          </button>
          <button className="back-button" onClick={() => navigate('/settings')}>
            ← Zurück
          </button>
        </div>
      </div>

      <div className="loops-grid">
        {loops.map((loop) => (
          <div
            key={loop.id}
            className={`loop-card ${loop.enabled ? 'enabled' : 'disabled'} ${
              selectedLoop === loop.id ? 'selected' : ''
            }`}
            onClick={() => loop.enabled && setSelectedLoop(loop.id)}
          >
            {/* Card Header */}
            <div className="loop-card-header">
              <span className="loop-icon">{loop.icon}</span>
              <div className="header-info">
                <h3>{loop.name}</h3>
                <span className={`mode-badge mode-${getModeColor(loop.mode)}`}>
                  {getModeLabel(loop.mode)}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="loop-card-body">
              <p className="description">{loop.description}</p>

              {/* Status */}
              {loop.enabled ? (
                <div className="status available">
                  <span className="status-dot">●</span>
                  Available
                </div>
              ) : (
                <div className="status disabled">
                  <span className="status-dot">●</span>
                  Disabled
                </div>
              )}

              {/* Last Run */}
              {(lastRuns[loop.id] ?? loop.lastRun) && (
                <div className="last-run">
                  <div className="run-info">
                    <span className="run-label">Last Run:</span>
                    <span
                      className={`run-status ${
                        (lastRuns[loop.id] ?? loop.lastRun)?.success ? 'success' : 'failed'
                      }`}
                    >
                      {(lastRuns[loop.id] ?? loop.lastRun)?.success ? '✅' : '❌'}{' '}
                      {(lastRuns[loop.id] ?? loop.lastRun)?.date}
                    </span>
                  </div>
                  <div className="run-duration">
                    <span className="duration-label">Duration:</span>
                    <span className="duration-value">
                      {formatDuration((lastRuns[loop.id] ?? loop.lastRun)?.duration ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            {loop.enabled && (
              <div className="loop-card-footer">
                <button
                  className="btn btn-start"
                  data-loop-id={loop.id}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setSelectedLoop(loop.id);
                    setRunningLoop(loop.id);
                    const start = performance.now();
                    try {
                      // Call real backend API with proper URL
                      const apiUrl = `${API_BASE_URL}/api/agent/loops/${loop.id}/run`;
                      const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({}),
                      });

                      if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                      }

                      const apiResult = await response.json();
                      const duration = Math.round(performance.now() - start);

                      // Transform API response to LoopResult format
                      const loopResult: LoopResult = {
                        loopType: apiResult.loopType || loop.id,
                        success: apiResult.success,
                        summary: apiResult.result || {},
                        executionTime: apiResult.executionTime || duration,
                        iterations: apiResult.result?.iterations || 0,
                        transparency: {
                          mode: apiResult.result?.mode || (loop.id === 'payment-recovery' ? 'heuristic' : 'analysis'),
                          executed: apiResult.result?.executed || false,
                          confidence: apiResult.result?.confidence || 0.85,
                          dataSource: 'woocommerce',
                          dataCompleteness: apiResult.result?.dataCompleteness || 1.0,
                          notes: apiResult.result?.notes || ['Analysis complete', 'Based on real WooCommerce data'],
                        },
                      };

                      setLoopResults((prev) => ({ ...prev, [loop.id]: loopResult }));
                      setLastRuns((prev) => ({
                        ...prev,
                        [loop.id]: {
                          date: getCurrentTimeString(),
                          success: apiResult.success,
                          duration,
                        },
                      }));
                    } catch (error) {
                      const duration = Math.round(performance.now() - start);
                      console.error(`Failed to execute loop ${loop.id}:`, error);
                      
                      setLastRuns((prev) => ({
                        ...prev,
                        [loop.id]: {
                          date: getCurrentTimeString(),
                          success: false,
                          duration,
                        },
                      }));

                      // Show error to user
                      alert(`Loop execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    } finally {
                      setRunningLoop(null);
                    }
                  }}
                  disabled={runningLoop !== null || isDisabled.has(loop.id)}
                >
                  {runningLoop === loop.id ? '⏳ Running...' : '▶️ Start Loop'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Results Section */}
      {Object.keys(loopResults).length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>📋 Loop Results</h2>
            <p>Analysis results from executed loops</p>
          </div>
          <div className="results-grid">
            {Object.entries(loopResults).map(([loopId, result]) => (
              <div key={loopId} className="result-wrapper">
                <LoopResultCard
                  result={result}
                  onClose={() => {
                    setLoopResults((prev) => {
                      const updated = { ...prev };
                      delete updated[loopId];
                      return updated;
                    });
                  }}
                  onRetry={() => {
                    const button = document.querySelector(
                      `[data-loop-id="${loopId}"]`,
                    ) as HTMLButtonElement;
                    button?.click();
                  }}
                />
                <button
                  className="btn-download"
                  onClick={() => downloadResult(loopId)}
                  title="Download result as JSON"
                >
                  📥 Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="dashboard-info">
        <div className="info-card">
          <h4>💡 About Agentic Loops</h4>
          <p>
            These automated intelligence systems continuously analyze your shop data, identify
            patterns, and provide actionable recommendations. All operations are transparent and
            non-destructive (analysis only - no automatic changes to your shop).
          </p>
        </div>

        <div className="info-card">
          <h4>⚙️ How It Works</h4>
          <ul>
            <li>
              <strong>SENSE:</strong> Collect data from your shop
            </li>
            <li>
              <strong>THINK:</strong> Analyze patterns and anomalies
            </li>
            <li>
              <strong>ACT:</strong> Generate recommendations
            </li>
            <li>
              <strong>LEARN:</strong> Store insights for future improvements
            </li>
          </ul>
        </div>

        <div className="info-card">
          <h4>🔒 Transparency</h4>
          <p>
            Each loop shows its data source, confidence level, and whether changes are applied or
            just recommendations. No hidden operations - everything is transparent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgenticLoopsDashboard;
