import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

interface OnboardingConfig {
  shopUrl: string | null;
  isConfigured: boolean;
}

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [shopUrl, setShopUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Load aktuelle Konfiguration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/onboarding/config');
        if (!response.ok) throw new Error('Failed to load config');

        const config: OnboardingConfig = await response.json();
        if (config.isConfigured && config.shopUrl) {
          setShopUrl(config.shopUrl);
          // Wenn bereits konfiguriert, zur Dashboard weiterleiten (harte Weiterleitung, verhindert Back)
          window.location.replace('/dashboard');
          return;
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading configuration');
        setLoading(false);
      }
    };

    loadConfig();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      // Validiere URL
      try {
        new URL(shopUrl);
      } catch {
        setError('Bitte geben Sie eine gültige URL ein (z.B. https://mein-shop.de)');
        setSubmitting(false);
        return;
      }

      // Speichere Shop-URL
      const response = await fetch('/api/onboarding/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadConfig = async () => {
    setError(null);
    try {
      setDownloading(true);
      const response = await fetch('/api/settings/connection/download', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Download fehlgeschlagen');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ari-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download fehlgeschlagen');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-loader">
          <div className="spinner"></div>
          <p>Lade Konfiguration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>🚀 Willkommen zu A.R.I.</h1>
          <p>Artificial Retail Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="shopUrl">
              🛍️ Shop URL
              <span className="required">*</span>
            </label>
            <input
              id="shopUrl"
              type="url"
              placeholder="https://mein-shop.de"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              required
              disabled={submitting}
              className="form-input"
            />
            <small>Die URL zu deinem WooCommerce-Shop</small>
          </div>

          {error && <div className="error-message">❌ {error}</div>}
          {success && (
            <div className="success-message">
              ✅ Konfiguration gespeichert!
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !shopUrl}
            className="submit-button"
          >
            {submitting ? '⏳ Wird gespeichert...' : '✅ Speichern & Fortfahren'}
          </button>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleDownloadConfig}
              disabled={!success || downloading}
              className="submit-button"
              style={{ background: '#10b981' }}
            >
              {downloading ? '⏳ Download...' : '📥 Konfiguration herunterladen'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              disabled={!success}
              className="submit-button"
              style={{ background: '#3b82f6' }}
            >
              🚀 Weiter zum Dashboard
            </button>
          </div>
        </form>

        <div className="onboarding-info">
          <h3>📝 Was passiert jetzt?</h3>
          <ul>
            <li>Deine Shop-URL wird in der Konfiguration gespeichert</li>
            <li>Die WooCommerce-Integration wird konfiguriert</li>
            <li>Du kannst anschließend über Settings weitere APIs einrichten</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
