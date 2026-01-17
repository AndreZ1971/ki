import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const ContentMonetized: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  const apiBase = import.meta.env.VITE_API_URL || '';
  
  const [contentType, setContentType] = useState('digital');
  const [monetizationStrategy, setMonetizationStrategy] = useState('one-time');
  const [pricing, setPricing] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [revenue, setRevenue] = useState({ today: 0, week: 0, month: 0, total: 0, productCount: 0 });
  const [forecast, setForecast] = useState<{ week: number; month: number; avgDay: number } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [priceReason, setPriceReason] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<{ headline?: string; body?: string; cta?: string }>({});

  // Lade echte WooCommerce Revenue-Daten
  React.useEffect(() => {
    const loadRevenueData = async () => {
      try {
        const response = await fetch(`${apiBase}/api/marketing/content/revenue`);
        const data = await response.json();
        
        if (data.success) {
          setRevenue({
            today: data.data.today || 0,
            week: data.data.week || 0,
            month: data.data.month || 0,
            total: data.data.total || 0,
            productCount: data.data.productCount || 0
          });
        }

        // Forecast
        const forecastRes = await fetch(`${apiBase}/api/marketing/content/revenue-forecast`);
        const forecastData = await forecastRes.json();
        if (forecastData.success) {
          setForecast({ week: forecastData.data.forecastWeek, month: forecastData.data.forecastMonth, avgDay: forecastData.data.avgDay });
        }
      } catch (_err) {
        // Silent fail - no forecast
      }
    };
    
    loadRevenueData();
  }, [apiBase]);

  const contentTypes = [
    { value: 'digital', label: 'Digitales Produkt', icon: '💾', avgPrice: '€49' },
    { value: 'downloadable', label: 'Download', icon: '�', avgPrice: '€29' },
    { value: 'virtual', label: 'Virtuelles Produkt', icon: '🌐', avgPrice: '€79' },
    { value: 'subscription', label: 'Abo-Produkt', icon: '�', avgPrice: '€19/Mo' },
    { value: 'course', label: 'Online-Kurs', icon: '🎓', avgPrice: '€149' },
    { value: 'template', label: 'Template/Theme', icon: '🎨', avgPrice: '€59' }
  ];

  const strategies = [
    { value: 'one-time', label: 'Einmalzahlung', icon: '💰', growth: 'Stabil' },
    { value: 'subscription', label: 'Abo-Modell', icon: '🔄', growth: 'Wachsend' },
    { value: 'freemium', label: 'Freemium', icon: '🆓', growth: 'Schnell' },
    { value: 'tiered', label: 'Preis-Stufen', icon: '📊', growth: 'Optimal' }
  ];

  const handleMonetize = async () => {
    if (!contentTitle.trim() || !pricing.trim()) {
      showToast(t('validation.fillRequired'), 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/marketing/content/create-digital-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contentTitle, 
          contentType, 
          monetizationStrategy, 
          pricing: parseFloat(pricing) 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message || 'Digitales Produkt erfolgreich erstellt!', 'success');
        setContentTitle('');
        setPricing('');
        
        // Reload revenue
        const revenueResponse = await fetch(`${apiBase}/api/marketing/content/revenue`);
        const revenueData = await revenueResponse.json();
        if (revenueData.success) {
          setRevenue({
            today: revenueData.data.today || 0,
            week: revenueData.data.week || 0,
            month: revenueData.data.month || 0,
            total: revenueData.data.total || 0,
            productCount: revenueData.data.productCount || 0
          });
        }
      } else {
        throw new Error(data.error || 'Fehler beim Erstellen des Produkts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceSuggest = async () => {
    setPriceLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/marketing/content/price-recommendation?contentType=${contentType}&strategy=${monetizationStrategy}&basePrice=${pricing || 49}`);
      const data = await res.json();
      if (data.success) {
        setRecommendedPrice(data.data.recommendedPrice);
        setPriceRange(data.data.range);
        setPriceReason(data.data.reasoning);
        showToast(`Preisvorschlag: €${data.data.recommendedPrice}`, 'success');
      } else {
        showToast(data.error || 'Preisempfehlung fehlgeschlagen', 'error');
      }
    } catch (_err) {
      showToast('Preisempfehlung fehlgeschlagen', 'error');
    } finally {
      setPriceLoading(false);
    }
  };

  const applyRecommendedPrice = () => {
    if (recommendedPrice) {
      setPricing(recommendedPrice.toString());
      showToast(`Preis gesetzt auf €${recommendedPrice}`, 'success');
    }
  };

  const handleGenerateCopy = async () => {
    if (!contentTitle.trim()) {
      showToast('Bitte Content-Titel angeben', 'error');
      return;
    }
    setCopyLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/marketing/content/generate-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentTitle, contentType, monetizationStrategy, pricing: parseFloat(pricing || '49') })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCopy(data.data);
        showToast('KI-Text generiert', 'success');
      } else {
        showToast(data.error || 'KI-Text fehlgeschlagen', 'error');
      }
    } catch (_err) {
      showToast('KI-Text fehlgeschlagen', 'error');
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />
      
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>💸 Digital Product Revenue</h1>
        <p>Verwalte und analysiere digitale Produkte & Downloads</p>
        {forecast && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.15)', borderRadius: '8px', color: '#10b981', fontWeight: 700 }}>
              Forecast Woche: €{forecast.week}
            </span>
            <span style={{ padding: '6px 10px', background: 'rgba(59,130,246,0.15)', borderRadius: '8px', color: '#3b82f6', fontWeight: 700 }}>
              Forecast Monat: €{forecast.month}
            </span>
          </div>
        )}
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>💰 Content Setup</h3>

        <div className="form-group">
          <label>Content-Titel *</label>
          <input type="text" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Titel deines Contents" className="form-input" />
        </div>

        <div className="form-group">
          <label>Content-Typ</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '10px' }}>
            {contentTypes.map(ct => (
              <motion.div key={ct.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setContentType(ct.value)}
                style={{ padding: '12px', background: contentType === ct.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                  border: contentType === ct.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>{ct.icon}</span>
                  <div><div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{ct.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>Ø {ct.avgPrice}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Monetarisierungs-Strategie</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '10px' }}>
            {strategies.map(str => (
              <motion.div key={str.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setMonetizationStrategy(str.value)}
                style={{ padding: '12px', background: monetizationStrategy === str.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                  border: monetizationStrategy === str.value ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>{str.icon}</span>
                  <div><div style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{str.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{str.growth}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Preis (€) *</label>
          <input type="text" value={pricing} onChange={(e) => setPricing(e.target.value)} placeholder="z.B. 49.99" className="form-input" />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <LoadingButton onClick={handlePriceSuggest} loading={priceLoading} loadingText="Berechne...">🤖 Preisvorschlag</LoadingButton>
            {recommendedPrice && (
              <button onClick={applyRecommendedPrice} style={{ padding: '8px 10px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Übernehmen (€{recommendedPrice})
              </button>
            )}
          </div>
          {recommendedPrice && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
              Empfehlung: €{recommendedPrice} (Range €{priceRange?.min} - €{priceRange?.max}) · {priceReason}
            </div>
          )}
        </div>

        <LoadingButton onClick={handleMonetize} loading={loading} loadingText="Erstelle...">
          💸 Content Monetarisieren
        </LoadingButton>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>KI Offer-Text</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <LoadingButton onClick={handleGenerateCopy} loading={copyLoading} loadingText="Generiere...">⚡ KI-Text generieren</LoadingButton>
          </div>
          {generatedCopy.headline && (
            <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ color: 'white', fontWeight: 700, marginBottom: '6px' }}>{generatedCopy.headline}</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '6px' }}>{generatedCopy.body}</div>
              <div style={{ color: '#10b981', fontWeight: 700 }}>{generatedCopy.cta}</div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Revenue Dashboard</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>€{revenue.today}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Heute</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>€{revenue.week}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Diese Woche</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>€{revenue.month}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Dieser Monat</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>€{revenue.total}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Gesamt</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💸</div>
          <p style={{ margin: 0 }}>Verknüpfe Zahlungsanbieter für Live-Daten</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ContentMonetized;