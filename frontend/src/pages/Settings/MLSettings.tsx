import { useState, useEffect } from 'react';

interface MLConfig {
  enabled: boolean;
  features: { productRecommendations: boolean; trendForecasting: boolean; emailOptimization: boolean };
  models: { productRecommendation: { minConfidence: number } };
  performance: { maxInferenceTime: number };
}

export default function MLSettings() {
  const [config, setConfig] = useState<MLConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/ml/config').then(r => r.json()).then(d => { setConfig(d); setLoading(false); });
  }, []);

  const save = () => {
    if (config) fetch('http://localhost:3000/api/ml/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }).then(() => alert('Gespeichert!'));
  };

  if (loading) return <div>Lädt...</div>;
  if (!config) return <div>Fehler</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🧠 ML Einstellungen</h1>
      <button onClick={save}>Speichern</button>
      <div style={{ marginTop: '20px' }}>
        <label><input type="checkbox" checked={config.enabled} onChange={e => setConfig({...config, enabled: e.target.checked})} /> ML Aktiv</label>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>Features</h3>
        <label><input type="checkbox" checked={config.features.productRecommendations} onChange={e => setConfig({...config, features: {...config.features, productRecommendations: e.target.checked}})} /> Produkt-Empfehlungen</label><br/>
        <label><input type="checkbox" checked={config.features.trendForecasting} onChange={e => setConfig({...config, features: {...config.features, trendForecasting: e.target.checked}})} /> Trend-Prognose</label><br/>
        <label><input type="checkbox" checked={config.features.emailOptimization} onChange={e => setConfig({...config, features: {...config.features, emailOptimization: e.target.checked}})} /> E-Mail Optimierung</label>
      </div>
      <div style={{ marginTop: '20px' }}>
        <label>Konfidenz: {Math.round(config.models.productRecommendation.minConfidence * 100)}%</label><br/>
        <input type="range" min="0" max="100" value={config.models.productRecommendation.minConfidence * 100} onChange={e => setConfig({...config, models: {...config.models, productRecommendation: {...config.models.productRecommendation, minConfidence: parseInt(e.target.value) / 100}}})} style={{width: '300px'}} />
      </div>
    </div>
  );
}