// frontend/src/pages/app/LoopMonitoring.tsx
/**
 * Agentic Loop Monitoring Dashboard
 * Visualisiert Status, History, Stats von allen Loops
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../AnalyseMetrics/page.css";

interface ExecutionStats {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  successRate: number;
  lastRun: string | null;
}

interface TrendData {
  date: string;
  runs: number;
  success: number;
  failures: number;
}

const LoopMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<any>(null);
  const [selectedLoop, setSelectedLoop] = useState<string>("anomaly-detection");
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [_trends, _setTrends] = useState<TrendData[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const loops = [
    {
      id: "anomaly-detection",
      name: "🚨 Anomaly Detection",
      description: "Payment Anomalien erkennen",
    },
    {
      id: "product-optimization",
      name: "📈 Product Optimization",
      description: "A/B Testing für Produkte",
    },
    {
      id: "payment-recovery",
      name: "💳 Payment Recovery",
      description: "Failed Orders retten",
    },
    {
      id: "analytics-insights",
      name: "📊 Analytics Insights",
      description: "Automatische Reports",
    },
  ];

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use localhost:3000 for backend API (default Fastify port)
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

        // Get scheduler status
        const statusRes = await fetch(`${apiUrl}/api/agent/monitoring/status`);
        const statusData = await statusRes.json();
        setStatus(statusData?.scheduler || null);

        // Get stats for selected loop
        const statsRes = await fetch(
          `${apiUrl}/api/agent/monitoring/stats/${selectedLoop}?days=7`
        );
        const statsData = await statsRes.json();
        setStats(statsData?.stats || null);

        // Get trends
        const trendsRes = await fetch(
          `${apiUrl}/api/agent/monitoring/trends/${selectedLoop}?days=30`
        );
        const trendsData = await trendsRes.json();
        _setTrends(trendsData?.trends || []);

        // Get history
        const historyRes = await fetch(
          `${apiUrl}/api/agent/monitoring/history/${selectedLoop}?limit=20`
        );
        const historyData = await historyRes.json();
        setHistory(historyData?.history || []);

        // Get insights
        const insightsRes = await fetch(
          `${apiUrl}/api/agent/monitoring/insights/${selectedLoop}`
        );
        const insightsData = await insightsRes.json();
        setInsights(insightsData?.insights || []);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        // Set safe defaults on error
        setStatus(null);
        setStats(null);
        _setTrends([]);
        setHistory([]);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedLoop]);

  const handleStartScheduler = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(
        `${apiUrl}/api/agent/monitoring/scheduler/start`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start scheduler"
      );
    }
  };

  const handleStopScheduler = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/agent/monitoring/scheduler/stop`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop scheduler");
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">Loading monitoring data...</div>
      </div>
    );
  }

  const handleExport = (format: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const url = `${apiUrl}/api/agent/monitoring/export/${selectedLoop}/${format}?days=30&limit=100`;

    if (format === "pdf") {
      // PDF öffnet in neuem Tab zum Drucken
      window.open(url, "_blank");
    } else {
      // JSON/CSV direct download
      window.location.href = url;
    }

    setShowExportModal(false);
  };

  return (
    <div className="settings-container">
      <div
        className="settings-header"
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <div style={{ flex: 1 }}>
          <h1>🤖 Agentic Loop Monitoring</h1>
          <p>Überwache Status, Performance und Learnings aller Loops</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          💾 Sichern
        </button>
        <button
          onClick={() => navigate("/settings")}
          style={{
            padding: "10px 16px",
            background: "linear-gradient(135deg, #06b6d4, #0891b2)",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: "20px" }}>
          ❌ {error}
        </div>
      )}

      {/* Scheduler Control */}
      <div className="settings-section" style={{ marginBottom: "30px" }}>
        <h2>🕐 Scheduler Control</h2>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <button
            onClick={handleStartScheduler}
            disabled={status?.isRunning}
            style={{
              padding: "8px 16px",
              backgroundColor: status?.isRunning ? "#90ee90" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: status?.isRunning ? "not-allowed" : "pointer",
            }}
          >
            ▶️ Start
          </button>

          <button
            onClick={handleStopScheduler}
            disabled={!status?.isRunning}
            style={{
              padding: "8px 16px",
              backgroundColor: status?.isRunning ? "#f44336" : "#cccccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: status?.isRunning ? "pointer" : "not-allowed",
            }}
          >
            ⏹️ Stop
          </button>

          <span
            style={{ marginLeft: "20px", fontSize: "16px", fontWeight: "bold" }}
          >
            Status: {status?.isRunning ? "🟢 RUNNING" : "🔴 STOPPED"}
          </span>
        </div>
      </div>

      {/* Loop Selection */}
      <div className="settings-section" style={{ marginBottom: "30px" }}>
        <h2>📌 Select Loop</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          {loops.map((loop) => (
            <button
              key={loop.id}
              onClick={() => setSelectedLoop(loop.id)}
              style={{
                padding: "12px",
                backgroundColor:
                  selectedLoop === loop.id ? "#2196F3" : "#1e293b",
                color: selectedLoop === loop.id ? "white" : "#f1f5f9",
                border: selectedLoop === loop.id ? "2px solid #2196F3" : "2px solid #334155",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: "bold", color: selectedLoop === loop.id ? "white" : "#f1f5f9" }}>{loop.name}</div>
              <div style={{ fontSize: "12px", opacity: 0.8, color: selectedLoop === loop.id ? "white" : "#cbd5e1" }}>
                {loop.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Card */}
      {stats && (
        <div className="settings-section" style={{ marginBottom: "30px" }}>
          <h2>📊 Statistics (Last 7 Days)</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "15px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f0f0f0",
                padding: "15px",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#666" }}>Total Runs</div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                {stats.totalRuns}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#e8f5e9",
                padding: "15px",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#2e7d32" }}>
                ✅ Success
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#2e7d32",
                }}
              >
                {stats.successCount}
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                Success Rate: {(stats.successRate * 100).toFixed(1)}%
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#ffebee",
                padding: "15px",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#c62828" }}>
                ❌ Failed
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#c62828",
                }}
              >
                {stats.failureCount}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff3e0",
                padding: "15px",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#e65100" }}>
                ⏱️ Avg Duration
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                {(stats.avgDuration / 1000).toFixed(1)}s
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "4px",
                gridColumn: "span 2",
              }}
            >
              <div style={{ fontSize: "12px", color: "#1565c0" }}>Last Run</div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                {stats.lastRun
                  ? new Date(stats.lastRun).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {(insights ?? []).length > 0 && (
        <div className="settings-section" style={{ marginBottom: "30px" }}>
          <h2>💡 Top Insights</h2>
          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            {insights.slice(0, 5).map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  borderBottom: idx < 4 ? "1px solid #eee" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  <strong>{insight.pattern}</strong>
                </span>
                <span style={{ color: "#666" }}>
                  {insight.occurrences}x | Confidence:{" "}
                  {(insight.avgConfidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Executions */}
      {history.length > 0 && (
        <div className="settings-section">
          <h2>📜 Recent Executions</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f5f5f5",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  <th style={{ padding: "10px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Duration
                  </th>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Iterations
                  </th>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Insights
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((exec, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>
                      {new Date(exec.startTime).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {exec.status === "success" ? "✅" : "❌"} {exec.status}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {(exec.duration / 1000).toFixed(1)}s
                    </td>
                    <td style={{ padding: "10px" }}>{exec.iterations}</td>
                    <td style={{ padding: "10px" }}>
                      {exec.result.insights.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ color: "#06b6d4", margin: "0 0 8px 0" }}>
                💾 Export wählen
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
                Wähle das gewünschte Export-Format für{" "}
                <strong>
                  {loops.find((l) => l.id === selectedLoop)?.name}
                </strong>
              </p>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* JSON Export */}
              <button
                onClick={() => handleExport("json")}
                style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <span style={{ fontSize: "24px" }}>📄</span>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div>JSON Export</div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.8,
                      fontWeight: "normal",
                    }}
                  >
                    Strukturierte Daten für externe Tools
                  </div>
                </div>
              </button>

              {/* CSV Export */}
              <button
                onClick={() => handleExport("csv")}
                style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <span style={{ fontSize: "24px" }}>📊</span>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div>CSV Export</div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.8,
                      fontWeight: "normal",
                    }}
                  >
                    Für Excel & Datenanalyse
                  </div>
                </div>
              </button>

              {/* PDF Export */}
              <button
                onClick={() => handleExport("pdf")}
                style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <span style={{ fontSize: "24px" }}>📑</span>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div>PDF Report</div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.8,
                      fontWeight: "normal",
                    }}
                  >
                    Für Präsentationen & Berichte
                  </div>
                </div>
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "white",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoopMonitoring;
