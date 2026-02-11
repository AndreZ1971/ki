import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AnalyseMetrics/page.css';

interface MLConfig {
  enabled: boolean;
  features: {
    productRecommendations: boolean;
    trendForecasting: boolean;
    emailOptimization: boolean;
    dynamicPricing: boolean;
    churnPrediction: boolean;
    sentimentAnalysis: boolean;
    fraudDetection: boolean;
  };
  models: {
    productRecommendation: {
      enabled: boolean;
      minConfidence: number;
      fallbackToRules: boolean;
    };
    trendForecasting: {
      enabled: boolean;
      minConfidence: number;
      fallbackToGoogleTrends: boolean;
    };
  };
  performance: {
    maxInferenceTime: number;
    cacheResults: boolean;
    cacheTTL: number;
  };
}

export default function MLSettings() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<MLConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ml/config');
      if (!response.ok) throw new Error('Fehler');
      const data = await response.json();
      setConfig(data);
    } catch (_error) {
      setMessage({ type: 'error', text: 'Fehler beim Laden der ML-Konfiguration' });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!config) return;
    try {
      setSaving(true);
  const response = await fetch('/api/ml/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Fehler');
      setMessage({ type: 'success', text: 'ML-Konfiguration erfolgreich gespeichert!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (_error) {
      setMessage({ type: 'error', text: 'Fehler beim Speichern' });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigate('/settings');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1a1f36 50%, #0f172a 100%)', color: '#e5e7eb' }}>
        <div style={{ padding: '60px 40px' }}>
          <h1 style={{ margin: 0 }}>Lade ML-Konfiguration...</h1>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1a1f36 50%, #0f172a 100%)', color: '#e5e7eb' }}>
        <div style={{ padding: '60px 40px' }}>
          <h1 style={{ margin: 0 }}>Fehler beim Laden</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1a1f36 50%, #0f172a 100%)',
      color: '#e5e7eb',
      paddingBottom: '40px'
    }}>
      <button className="back-button floating-back" onClick={handleBack}>
        ← Zurück
      </button>

      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '60px 40px 40px',
        backdropFilter: 'blur(10px)',
        marginTop: '0'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            margin: '0 0 10px',
            background: 'linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🧠 Machine Learning Einstellungen
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.88)', margin: 0 }}>
            KI-Features mit automatischen Fallbacks für deinen Shop
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {message && (
          <div 
            style={{
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
              border: `2px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}
          >
            <p style={{ margin: 0, fontSize: '16px', color: '#e5e7eb' }}>{message.text}</p>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Global ML Steuerung</h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)',
            padding: '18px',
            borderRadius: '10px',
            border: config.enabled ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.12)'
          }}>
            <div>
              <h4 style={{ marginBottom: '6px', fontSize: '18px' }}>Machine Learning Status</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                {config.enabled ? 'KI-Features sind aktiviert und einsatzbereit' : 'KI-Features sind deaktiviert'}
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 700,
                color: config.enabled ? '#8b5cf6' : 'rgba(255,255,255,0.5)'
              }}>
                {config.enabled ? 'AKTIV' : 'INAKTIV'}
              </span>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig({...config, enabled: e.target.checked})}
                style={{ width: '24px', height: '24px', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        <div className="metrics-grid">
          <div 
            className="metric-card"
            style={{
              background: config.features.productRecommendations ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)',
              border: config.features.productRecommendations ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛒</div>
            <h3>Produkt-Empfehlungen</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '15px', fontSize: '14px' }}>
              KI-basierte Produktempfehlungen für höhere Conversion
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px 0',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>+15-30% Umsatz</span>
              <label htmlFor="productRecommendations">
                <input
                  id="productRecommendations"
                  type="checkbox"
                  checked={config.features.productRecommendations}
                  onChange={e => setConfig({...config, features: {...config.features, productRecommendations: e.target.checked}})}
                  disabled={!config.enabled}
                  style={{ width: '20px', height: '20px', cursor: config.enabled ? 'pointer' : 'not-allowed' }}
                />
              </label>
            </div>
          </div>

          <div 
            className="metric-card"
            style={{
              background: config.features.trendForecasting ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)',
              border: config.features.trendForecasting ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📈</div>
            <h3>Trend-Prognose</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '15px', fontSize: '14px' }}>
              Vorhersage von Produkt-Trends und Marktentwicklung
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px 0',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>Bessere Auswahl</span>
              <label htmlFor="trendForecasting">
                <input
                  id="trendForecasting"
                  type="checkbox"
                  checked={config.features.trendForecasting}
                  onChange={e => setConfig({...config, features: {...config.features, trendForecasting: e.target.checked}})}
                  disabled={!config.enabled}
                  style={{ width: '20px', height: '20px', cursor: config.enabled ? 'pointer' : 'not-allowed' }}
                />
              </label>
            </div>
          </div>

          <div 
            className="metric-card"
            style={{
              background: config.features.emailOptimization ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)',
              border: config.features.emailOptimization ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📧</div>
            <h3>E-Mail Optimierung</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '15px', fontSize: '14px' }}>
              Optimale Versandzeiten für maximale Open-Rate
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px 0',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>+20-40% Öffnung</span>
              <label htmlFor="emailOptimization">
                <input
                  id="emailOptimization"
                  type="checkbox"
                  checked={config.features.emailOptimization}
                  onChange={e => setConfig({...config, features: {...config.features, emailOptimization: e.target.checked}})}
                  disabled={!config.enabled}
                  style={{ width: '20px', height: '20px', cursor: config.enabled ? 'pointer' : 'not-allowed' }}
                />
              </label>
            </div>
          </div>

          <div className="metric-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>💰</div>
            <h3>Dynamische Preise</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '15px', fontSize: '14px' }}>Automatische Preisoptimierung</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '12px', padding: '4px 8px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '4px' }}>Demnächst</span>
            </div>
          </div>

          <div className="metric-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
            <h3>Churn-Vorhersage</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '15px', fontSize: '14px' }}>Frühwarnung bei Kundenabwanderung</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '12px', padding: '4px 8px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '4px' }}>Demnächst</span>
            </div>
          </div>

          <div className="metric-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛡️</div>
            <h3>Betrugs-Erkennung</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '15px', fontSize: '14px' }}>Automatische Betrugsprävention</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '12px', padding: '4px 8px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '4px' }}>Demnächst</span>
            </div>
          </div>
        </div>

        <div className="metric-card full-width">
          <h3 style={{ marginBottom: '20px' }}>Erweiterte Einstellungen</h3>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '15px' }}>Produkt-Empfehlungen</h4>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                Mindest-Konfidenz: <strong>{Math.round(config.models.productRecommendation.minConfidence * 100)}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.models.productRecommendation.minConfidence * 100}
                onChange={e => setConfig({...config, models: {...config.models, productRecommendation: {...config.models.productRecommendation, minConfidence: parseInt(e.target.value) / 100}}})}
                disabled={!config.enabled}
                style={{ width: '100%', height: '8px', cursor: config.enabled ? 'pointer' : 'not-allowed' }}
              />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                Minimale Sicherheit für ML-Vorhersagen (höher = konservativer)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="fallbackRules" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: config.enabled ? 'pointer' : 'not-allowed', width: '100%' }}>
                <input
                  type="checkbox"
                  id="fallbackRules"
                  checked={config.models.productRecommendation.fallbackToRules}
                  onChange={e => setConfig({...config, models: {...config.models, productRecommendation: {...config.models.productRecommendation, fallbackToRules: e.target.checked}}})}
                  disabled={!config.enabled}
                  style={{ width: '18px', height: '18px', cursor: config.enabled ? 'pointer' : 'not-allowed' }}
                />
                <span style={{ fontSize: '14px' }}>Automatischer Fallback zu regelbasierten Empfehlungen</span>
              </label>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '15px' }}>Performance</h4>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                Max. Inferenzzeit: <strong>{config.performance.maxInferenceTime / 1000}s</strong>
              </label>
              <input
                type="range"
                min="1000"
                max="30000"
                step="1000"
                value={config.performance.maxInferenceTime}
                onChange={e => setConfig({...config, performance: {...config.performance, maxInferenceTime: parseInt(e.target.value)}})}
                disabled={!config.enabled}
                style={{ width: '100%', height: '8px', cursor: config.enabled ? 'pointer' : 'not-allowed' }}
              />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                Maximale Zeit für ML-Berechnungen (bei Timeout Fallback)
              </p>
            </div>
          </div>
        </div>

        <div className="metric-card full-width" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6' }}>
          <h3 style={{ marginBottom: '15px' }}>Zero-Risk ML Integration</h3>
          <ul style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', paddingLeft: '20px', margin: 0, lineHeight: '1.8' }}>
            <li>A/B Testing ohne Code-Änderungen möglich</li>
            <li>Alle Features funktionieren mit und ohne ML</li>
            <li>Performance-Monitoring inklusive</li>
            <li>Konfidenz-basierte Qualitätssicherung</li>
          </ul>
        </div>

        <div className="metric-card full-width">
          <button
            onClick={save}
            disabled={saving}
            style={{
              width: '100%',
              padding: '18px',
              background: saving ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: saving ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.4)'
            }}
          >
            {saving ? 'Speichert...' : 'Konfiguration speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
