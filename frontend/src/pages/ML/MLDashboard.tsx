import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../AnalyseMetrics/page.css';

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

interface PredictionHistory {
  timestamp: string;
  feature: string;
  confidence: number;
  success: boolean;
  responseTime: number;
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

const MLDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);
  const [mlStats, setMlStats] = useState<MLStats | null>(null);

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      const baseApi = (import.meta.env.VITE_API_URL || '').trim();

      const statusResponse = await fetch(`${baseApi}/api/ml/status`);
      if (!statusResponse.ok) throw new Error(`Status API Error: ${statusResponse.status}`);
      const statusData = await statusResponse.json();
      setMlStatus(statusData);

      const statsResponse = await fetch(`${baseApi}/api/ml/stats`);
      if (!statsResponse.ok) throw new Error(`Stats API Error: ${statsResponse.status}`);
      const statsData = await statsResponse.json();
      if (!statsData?.success || !statsData?.data) throw new Error(statsData?.error || 'Ungültige ML-Stats');
      setMlStats(statsData.data as MLStats);

      // Bis echte Verlaufsdaten verfügbar sind, zeigen wir keine Dummy-Historie
      setPredictionHistory([]);
    } catch (error) {
      console.error('Failed to fetch ML data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
          <h1>Lade ML Dashboard...</h1>
        </div>
      </div>
    );
  }

  if (!mlStatus || !mlStatus.enabled) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBackToDashboard}>
          ← Zurück 
        </button>

        <div className="analytics-header">
          <div style={{ fontSize: '96px', marginBottom: '20px' }}>🤖</div>
          <h1>Machine Learning ist deaktiviert</h1>
          <p style={{ marginBottom: '24px' }}>
            Aktiviere ML in den Einstellungen, um intelligente Vorhersagen zu nutzen
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings/ml')}
            className="action-button"
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
            }}
          >
            ⚙️ ML Einstellungen öffnen
          </motion.button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalPredictions = mlStats?.predictions.total || 0;
  const successfulPredictions = mlStats?.predictions.success || 0;
  const successRate = totalPredictions > 0 ? ((successfulPredictions / totalPredictions) * 100).toFixed(1) : '0';
  const avgConfidence = mlStats?.avgConfidence || 0;
  const avgResponseTime = predictionHistory.length
    ? predictionHistory.reduce((sum, p) => sum + p.responseTime, 0) / predictionHistory.length
    : 0;

  // Chart data
  const confidenceData = predictionHistory.map((p) => ({
    name: p.timestamp,
    confidence: (p.confidence * 100).toFixed(0),
    feature: p.feature
  }));

  const featureLabel = (key: string) => {
    switch (key) {
      case 'productRecommendations': return 'Empfehlungen';
      case 'trendForecasting': return 'Trends';
      case 'emailOptimization': return 'E-Mail';
      case 'dynamicPricing': return 'Dynamic Pricing';
      case 'churnPrediction': return 'Churn';
      case 'sentimentAnalysis': return 'Sentiment';
      case 'fraudDetection': return 'Fraud Detection';
      default: return key;
    }
  };

  const palette = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

  const featureDistribution = (mlStatus?.activeFeatures || []).map((f, idx) => ({
    name: featureLabel(f),
    value: 1,
    color: palette[idx % palette.length]
  }));

  const performanceData: Array<{ name: string; responseTime: number }> = [];

  return (
    <div className="analytics-page">
      {/* Floating Back Button */}
      <button className="back-button floating-back" onClick={handleBackToDashboard}>
        ← Zurück 
      </button>

      {/* Header */}
      <div className="analytics-header">
        <h1>🤖 Machine Learning Dashboard</h1>
        <p>Echtzeit-Übersicht deiner ML-Modelle und Predictions</p>
        <span
          className="live-pulse"
          style={{
            display: 'inline-block',
            marginTop: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          ● ML SYSTEM AKTIV
        </span>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card"
        >
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Erfolgsrate</div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {successRate}%
          </div>
          <div className="metric-subtitle">
            {successfulPredictions} von {totalPredictions} erfolgreich
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="metric-card"
        >
          <div className="metric-icon">📊</div>
          <div className="metric-label">Ø Konfidenz</div>
          <div className="metric-value" style={{ color: '#8b5cf6' }}>
            {(avgConfidence * 100).toFixed(1)}%
          </div>
          <div className="metric-subtitle">
            Durchschnittliche Sicherheit
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="metric-card"
        >
          <div className="metric-icon">⚡</div>
          <div className="metric-label">Ø Response Time</div>
          <div className="metric-value" style={{ color: '#3b82f6' }}>
            {avgResponseTime.toFixed(2)}s
          </div>
          <div className="metric-subtitle">
            Durchschnittliche Antwortzeit
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="metric-card last-updated"
        >
          <div className="metric-icon">🔢</div>
          <div className="metric-label">Predictions heute</div>
          <div className="metric-value-small">
            {totalPredictions}
          </div>
          <div className="metric-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {mlStatus.featureCount} Features aktiv
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="analysis-section">
        {/* Confidence Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="metric-card full-width"
        >
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800' }}>
            📈 Konfidenz-Verlauf
          </h3>
          {confidenceData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>Keine Verlaufsdaten vorhanden</div>
          )}
        </motion.div>

        {/* Performance Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="metric-card full-width"
          style={{ marginTop: '20px' }}
        >
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800' }}>
            ⚡ Performance-Verlauf
          </h3>
          {performanceData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="responseTime" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>Keine Performance-Daten vorhanden</div>
          )}
        </motion.div>
      </div>

      {/* Feature Distribution & Recent Predictions */}
      <div className="analysis-section">
        {/* Feature Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="metric-card"
          style={{ marginBottom: '20px' }}
        >
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800' }}>
            🎯 Feature-Verteilung
          </h3>
          {featureDistribution.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={featureDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {featureDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>Keine aktiven Features gemeldet</div>
          )}
        </motion.div>

        {/* Recent Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="metric-card"
        >
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800' }}>
            🕒 Letzte Predictions
          </h3>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {predictionHistory.length === 0 && (
              <div style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Keine Prediction-Historie verfügbar
              </div>
            )}
            {predictionHistory.slice(0, 5).map((pred, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                    {pred.feature === 'recommendations' ? '🛒 Empfehlungen' : pred.feature === 'trends' ? '📈 Trends' : '📧 E-Mail'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    {pred.timestamp} • {pred.responseTime.toFixed(1)}s
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: pred.confidence >= 0.75 ? '#10b981' : '#f59e0b',
                    marginBottom: '4px'
                  }}>
                    {(pred.confidence * 100).toFixed(0)}%
                  </div>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: pred.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: pred.success ? '#10b981' : '#ef4444'
                  }}>
                    {pred.success ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Active Models */}
      <div className="analysis-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="metric-card full-width"
        >
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800' }}>
            🧠 Aktive Modelle
          </h3>
          <div className="metrics-grid">
          {/* Product Recommendations */}
          <div style={{
            background: mlStatus.models.productRecommendation.enabled
              ? 'rgba(139, 92, 246, 0.1)'
              : 'rgba(255,255,255,0.03)',
            border: `2px solid ${mlStatus.models.productRecommendation.enabled ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px' }}>🛒</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>Produkt-Empfehlungen</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>gpt-4o-mini</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
              Mindest-Konfidenz: {(mlStatus.models.productRecommendation.minConfidence * 100).toFixed(0)}%
            </div>
            <span style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: mlStatus.models.productRecommendation.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
              color: mlStatus.models.productRecommendation.enabled ? '#10b981' : '#6b7280',
              fontWeight: '600'
            }}>
              {mlStatus.models.productRecommendation.enabled ? '● AKTIV' : '○ INAKTIV'}
            </span>
          </div>

          {/* Trend Forecasting */}
          <div style={{
            background: mlStatus.models.trendForecasting.enabled
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(255,255,255,0.03)',
            border: `2px solid ${mlStatus.models.trendForecasting.enabled ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px' }}>📈</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>Trend-Prognosen</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>gpt-4o-mini + Google Trends</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
              Mindest-Konfidenz: {(mlStatus.models.trendForecasting.minConfidence * 100).toFixed(0)}%
            </div>
            <span style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: mlStatus.models.trendForecasting.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
              color: mlStatus.models.trendForecasting.enabled ? '#10b981' : '#6b7280',
              fontWeight: '600'
            }}>
              {mlStatus.models.trendForecasting.enabled ? '● AKTIV' : '○ INAKTIV'}
            </span>
          </div>

          {/* Email Send Time */}
          <div style={{
            background: mlStatus.models.emailSendTime.enabled
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(255,255,255,0.03)',
            border: `2px solid ${mlStatus.models.emailSendTime.enabled ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px' }}>📧</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>E-Mail Optimierung</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Coming Soon</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
              Mindest-Konfidenz: {(mlStatus.models.emailSendTime.minConfidence * 100).toFixed(0)}%
            </div>
            <span style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: mlStatus.models.emailSendTime.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
              color: mlStatus.models.emailSendTime.enabled ? '#10b981' : '#6b7280',
              fontWeight: '600'
            }}>
              {mlStatus.models.emailSendTime.enabled ? '● AKTIV' : '○ INAKTIV'}
            </span>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="analysis-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ display: 'flex', gap: '12px' }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/settings/ml')}
            style={{
              flex: 1,
              padding: '16px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            ⚙️ ML Einstellungen
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchMLData}
            style={{
              flex: 1,
              padding: '16px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            🔄 Daten aktualisieren
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default MLDashboard;
