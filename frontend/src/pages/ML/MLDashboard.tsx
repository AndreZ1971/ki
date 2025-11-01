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

const MLDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      // Fetch ML status
      const statusResponse = await fetch('http://localhost:3000/api/ml/status');
      const statusData = await statusResponse.json();
      setMlStatus(statusData);

      // Mock prediction history - replace with real API later
      const mockHistory: PredictionHistory[] = [
        { timestamp: '10:30', feature: 'recommendations', confidence: 0.87, success: true, responseTime: 2.1 },
        { timestamp: '10:25', feature: 'trends', confidence: 0.92, success: true, responseTime: 3.4 },
        { timestamp: '10:20', feature: 'recommendations', confidence: 0.78, success: true, responseTime: 1.8 },
        { timestamp: '10:15', feature: 'trends', confidence: 0.65, success: false, responseTime: 4.2 },
        { timestamp: '10:10', feature: 'recommendations', confidence: 0.91, success: true, responseTime: 2.3 },
        { timestamp: '10:05', feature: 'recommendations', confidence: 0.83, success: true, responseTime: 2.0 },
        { timestamp: '10:00', feature: 'trends', confidence: 0.88, success: true, responseTime: 3.1 },
      ];
      setPredictionHistory(mockHistory);
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
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Lade ML Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!mlStatus || !mlStatus.enabled) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button className="back-button" onClick={handleBackToDashboard}>
            ← Zurück
          </button>
          <h1>🤖 Machine Learning Dashboard</h1>
        </div>

        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '96px', marginBottom: '20px' }}>🤖</div>
          <h2 style={{ color: 'white', marginBottom: '12px' }}>Machine Learning ist deaktiviert</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '16px' }}>
            Aktiviere ML in den Einstellungen, um intelligente Vorhersagen zu nutzen
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings/ml')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
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
  const totalPredictions = predictionHistory.length;
  const successfulPredictions = predictionHistory.filter(p => p.success).length;
  const successRate = totalPredictions > 0 ? (successfulPredictions / totalPredictions * 100).toFixed(1) : '0';
  const avgConfidence = predictionHistory.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions;
  const avgResponseTime = predictionHistory.reduce((sum, p) => sum + p.responseTime, 0) / totalPredictions;

  // Chart data
  const confidenceData = predictionHistory.map((p) => ({
    name: p.timestamp,
    confidence: (p.confidence * 100).toFixed(0),
    feature: p.feature
  }));

  const featureDistribution = [
    { name: 'Empfehlungen', value: predictionHistory.filter(p => p.feature === 'recommendations').length, color: '#8b5cf6' },
    { name: 'Trends', value: predictionHistory.filter(p => p.feature === 'trends').length, color: '#3b82f6' },
    { name: 'E-Mail', value: predictionHistory.filter(p => p.feature === 'email').length, color: '#10b981' }
  ];

  const performanceData = predictionHistory.map(p => ({
    name: p.timestamp,
    responseTime: p.responseTime.toFixed(1)
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Zurück
        </button>
        <div>
          <h1>🤖 Machine Learning Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
            Echtzeit-Übersicht deiner ML-Modelle und Predictions
          </p>
        </div>
        <span
          className="live-pulse"
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            padding: '6px 16px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          ● AKTIV
        </span>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
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
          className="metric-card"
        >
          <div className="metric-icon">🔢</div>
          <div className="metric-label">Predictions heute</div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            {totalPredictions}
          </div>
          <div className="metric-subtitle">
            {mlStatus.featureCount} Features aktiv
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Confidence Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="metric-card full-width"
        >
          <h3 style={{ marginBottom: '20px' }}>📈 Konfidenz-Verlauf</h3>
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
        </motion.div>

        {/* Performance Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="metric-card full-width"
        >
          <h3 style={{ marginBottom: '20px' }}>⚡ Performance-Verlauf</h3>
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
        </motion.div>
      </div>

      {/* Feature Distribution & Recent Predictions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Feature Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="metric-card"
        >
          <h3 style={{ marginBottom: '20px' }}>🎯 Feature-Verteilung</h3>
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
        </motion.div>

        {/* Recent Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="metric-card"
        >
          <h3 style={{ marginBottom: '20px' }}>🕒 Letzte Predictions</h3>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="metric-card full-width"
      >
        <h3 style={{ marginBottom: '20px' }}>🧠 Aktive Modelle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
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

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{ display: 'flex', gap: '12px', marginTop: '20px' }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/settings/ml')}
          style={{
            flex: 1,
            padding: '14px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
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
            padding: '14px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔄 Daten aktualisieren
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MLDashboard;
