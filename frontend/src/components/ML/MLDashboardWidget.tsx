import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MLStatus {
  enabled: boolean;
  activeFeatures: string[];
  featureCount: number;
  models: {
    productRecommendation: { enabled: boolean; minConfidence: number };
    trendForecasting: { enabled: boolean; minConfidence: number };
    emailSendTime: { enabled: boolean; minConfidence: number };
  };
}

interface MLStats {
  predictions: {
    total: number;
    today: number;
    success: number;
    failed: number;
  };
  avgConfidence: number;
  lastPrediction: string | null;
}

export const MLDashboardWidget: React.FC = () => {
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);
  const [mlStats, setMlStats] = useState<MLStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  fetchMLStatus();
  fetchMLStats();
  setError(null);
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMLStatus();
      fetchMLStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const fetchMLStatus = async () => {
  try {
    const response = await fetch(`${apiUrl}/ml/status`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    setMlStatus(data);
  } catch (_error) {
    setError('Fehler beim Laden des ML-Status. Bitte API prüfen.');
    console.error('Failed to fetch ML status:', _error);
  }
};
  const fetchMLStats = async () => {
    try {
      // Mock stats for now - replace with real API call later
      setMlStats({
        predictions: {
          total: 127,
          today: 23,
          success: 118,
          failed: 9
        },
        avgConfidence: 0.82,
        lastPrediction: new Date().toISOString()
      });
    } catch (_error) {
      setError('Fehler beim Laden der ML-Statistiken.');
      console.error('Failed to fetch ML stats:', _error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="ml-widget-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Lade ML Status...</p>
        {error && (
          <p style={{ color: '#ef4444', marginTop: '10px', fontWeight: 'bold' }}>
            ⚠️ {error}
            <br />
            <small>API: {import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}</small>
          </p>
        )}
      </motion.div>
    );
  }

  if (!mlStatus || !mlStatus.enabled) {
    return (
      <motion.div
        className="ml-widget-disabled"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '2px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
        <h3 style={{ color: 'white', marginBottom: '8px' }}>Machine Learning</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>
          ML ist derzeit deaktiviert
        </p>
        <button
          onClick={() => window.location.href = '/settings/ml'}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '8px',
            color: '#a78bfa',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ML aktivieren
        </button>
      </motion.div>
    );
  }

  const successRate = mlStats 
    ? ((mlStats.predictions.success / mlStats.predictions.total) * 100).toFixed(1)
    : '0';

  return (
    <motion.div
      className="ml-widget"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
        border: '2px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '32px' }}>🤖</div>
          <div>
            <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>Machine Learning</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '12px' }}>
              {mlStatus.featureCount} Feature{mlStatus.featureCount !== 1 ? 's' : ''} aktiv
            </p>
          </div>
        </div>
        <span
          className="live-pulse"
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          ● AKTIV
        </span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>
            {mlStats?.predictions.today || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Predictions heute</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
            {successRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Erfolgsrate</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
            {mlStats ? (mlStats.avgConfidence * 100).toFixed(0) : 0}%
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Ø Konfidenz</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
            {mlStats?.predictions.total || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Gesamt</div>
        </motion.div>
      </div>

      {/* Active Features */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
          Aktive Features:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {mlStatus.models.productRecommendation.enabled && (
            <span style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              color: '#a78bfa'
            }}>
              🛒 Empfehlungen
            </span>
          )}
          {mlStatus.models.trendForecasting.enabled && (
            <span style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              color: '#60a5fa'
            }}>
              📈 Trends
            </span>
          )}
          {mlStatus.models.emailSendTime.enabled && (
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              color: '#34d399'
            }}>
              📧 E-Mail Timing
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/ml/dashboard'}
          style={{
            flex: 1,
            padding: '10px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
          }}
        >
          📊 Dashboard
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/settings/ml'}
          style={{
            flex: 1,
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ⚙️ Einstellungen
        </motion.button>
      </div>

      {/* Background Gradient Effect */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />
    </motion.div>
  );
};
