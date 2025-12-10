import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AnalyseMetrics/page.css';

interface ShopCredentials {
    // Reddit
    redditClientId: string;
    redditClientSecret: string;

    // E-Mail
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    smtpFrom: string;

    // Machine Learning
    mlEnabled: boolean;
    mlProductRecommendations: boolean;
    mlTrendForecasting: boolean;
    mlDynamicPricing: boolean;
    mlEmailOptimization: boolean;
    mlChurnPrediction: boolean;
    mlSentimentAnalysis: boolean;
    mlFraudDetection: boolean;
    mlProductRecMinConfidence: number;
    mlProductRecFallback: boolean;
    mlTrendMinConfidence: number;
    mlTrendFallback: boolean;
    mlEmailMinConfidence: number;
    mlEmailFallback: boolean;
    mlEmailDefaultTime: string;
    mlMaxInferenceTime: number;
    mlCacheResults: boolean;
    mlCacheTtl: number;
  // WordPress
  wpUrl: string;
  wpUsername: string;
  wpAppPassword: string;
  
  // WooCommerce
  wcApiUrl: string;
  wcConsumerKey: string;
  wcConsumerSecret: string;
  wooAuthMode: 'basic' | 'oauth';
  wooTimeoutMs: number;
  
  // AI & Services
  openaiApiKey: string;
  openaiModel: string;
  
  // Job Configuration
  jobMode: 'once' | 'interval';
  jobIntervalMs: number;
  
  // Optional Services
  enableAnalytics: boolean;
  enableAutoProducts: boolean;
  enableEmailMarketing: boolean;

  // Social Media Accounts
  linkedinEnabled: boolean;
  linkedinAccessToken: string;
  linkedinRefreshToken: string;

  facebookEnabled: boolean;
  facebookAccessToken: string;
  facebookPageId: string;

  instagramEnabled: boolean;
  instagramAccessToken: string;
  instagramBusinessAccountId: string;

  twitterEnabled: boolean;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessTokenSecret: string;

  tiktokEnabled: boolean;
  tiktokAccessToken: string;
  tiktokRefreshToken: string;

  youtubeEnabled: boolean;
  youtubeAccessToken: string;
  youtubeRefreshToken: string;
  youtubeChannelId: string;
}

interface Specialization {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  isActive: boolean;
  features: string[];
}


const defaultCredentials: ShopCredentials = {
  wpUrl: '',
  wpUsername: '',
  wpAppPassword: '',
  wcApiUrl: '',
  wcConsumerKey: '',
  wcConsumerSecret: '',
  wooAuthMode: 'basic',
  wooTimeoutMs: 30000,
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  jobMode: 'once',
  jobIntervalMs: 900000,
  enableAnalytics: true,
  enableAutoProducts: true,
  enableEmailMarketing: true,
  redditClientId: '',
  redditClientSecret: '',
  smtpHost: '',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPassword: '',
  smtpFrom: '',
  mlEnabled: true,
  mlProductRecommendations: true,
  mlTrendForecasting: true,
  mlDynamicPricing: false,
  mlEmailOptimization: true,
  mlChurnPrediction: false,
  mlSentimentAnalysis: false,
  mlFraudDetection: false,
  mlProductRecMinConfidence: 0.7,
  mlProductRecFallback: true,
  mlTrendMinConfidence: 0.6,
  mlTrendFallback: true,
  mlEmailMinConfidence: 0.65,
  mlEmailFallback: true,
  mlEmailDefaultTime: '09:00',
  mlMaxInferenceTime: 5000,
  mlCacheResults: true,
  mlCacheTtl: 3600,
  
  // Social Media Defaults
  linkedinEnabled: false,
  linkedinAccessToken: '',
  linkedinRefreshToken: '',
  facebookEnabled: false,
  facebookAccessToken: '',
  facebookPageId: '',
  instagramEnabled: false,
  instagramAccessToken: '',
  instagramBusinessAccountId: '',
  twitterEnabled: false,
  twitterApiKey: '',
  twitterApiSecret: '',
  twitterAccessToken: '',
  twitterAccessTokenSecret: '',
  tiktokEnabled: false,
  tiktokAccessToken: '',
  tiktokRefreshToken: '',
  youtubeEnabled: false,
  youtubeAccessToken: '',
  youtubeRefreshToken: '',
  youtubeChannelId: ''
};

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'connection' | 'specialization' | 'license' | 'social'>('connection');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Shop-Verbindungsdaten
  const [credentials, setCredentials] = useState<ShopCredentials>({ ...defaultCredentials });

  // Load credentials on mount
  React.useEffect(() => {
    loadCredentials();
  }, []);

  // Import-Konfiguration (connection.json) laden
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        // Mapping von verschachtelter Struktur zu flachem ShopCredentials-Objekt
        const mapped: ShopCredentials = {
          // WordPress
          wpUrl: data.wordpress?.url || '',
          wpUsername: data.wordpress?.username || '',
          wpAppPassword: data.wordpress?.appPassword || '',
          // WooCommerce
          wcApiUrl: data.woocommerce?.url || '',
          wcConsumerKey: data.woocommerce?.consumerKey || '',
          wcConsumerSecret: data.woocommerce?.consumerSecret || '',
          wooAuthMode: data.woocommerce?.authMode || 'basic',
          wooTimeoutMs: data.woocommerce?.timeoutMs || 30000,
          // AI & Services
          openaiApiKey: data.openAI?.apiKey || '',
          openaiModel: data.openAI?.model || 'gpt-4o-mini',
          // Job Configuration
          jobMode: data.job?.mode || 'once',
          jobIntervalMs: data.job?.intervalMs || 900000,
          // Optional Services
          enableAnalytics: data.features?.enableAnalytics ?? true,
          enableAutoProducts: data.features?.enableAutoProducts ?? true,
          enableEmailMarketing: data.features?.enableEmailMarketing ?? true,
          // Reddit
          redditClientId: data.reddit?.clientId || '',
          redditClientSecret: data.reddit?.clientSecret || '',
          // E-Mail
          smtpHost: data.smtp?.host || '',
          smtpPort: data.smtp?.port || 465,
          smtpSecure: data.smtp?.secure ?? true,
          smtpUser: data.smtp?.user || '',
          smtpPassword: data.smtp?.password || '',
          smtpFrom: data.smtp?.from || '',
          // Machine Learning
          mlEnabled: data.ml?.enabled ?? true,
          mlProductRecommendations: data.ml?.productRecommendations ?? true,
          mlTrendForecasting: data.ml?.trendForecasting ?? true,
          mlDynamicPricing: data.ml?.dynamicPricing ?? false,
          mlEmailOptimization: data.ml?.emailOptimization ?? true,
          mlChurnPrediction: data.ml?.churnPrediction ?? false,
          mlSentimentAnalysis: data.ml?.sentimentAnalysis ?? false,
          mlFraudDetection: data.ml?.fraudDetection ?? false,
          mlProductRecMinConfidence: data.ml?.productRecMinConfidence ?? 0.7,
          mlProductRecFallback: data.ml?.productRecFallback ?? true,
          mlTrendMinConfidence: data.ml?.trendMinConfidence ?? 0.6,
          mlTrendFallback: data.ml?.trendFallback ?? true,
          mlEmailMinConfidence: data.ml?.emailMinConfidence ?? 0.65,
          mlEmailFallback: data.ml?.emailFallback ?? true,
          mlEmailDefaultTime: data.ml?.emailDefaultTime || '09:00',
          mlMaxInferenceTime: data.ml?.maxInferenceTime ?? 5000,
          mlCacheResults: data.ml?.cacheResults ?? true,
          mlCacheTtl: data.ml?.cacheTtl ?? 3600,
          // Social Media
          linkedinEnabled: data.socialMedia?.linkedin?.enabled ?? false,
          linkedinAccessToken: data.socialMedia?.linkedin?.accessToken || '',
          linkedinRefreshToken: data.socialMedia?.linkedin?.refreshToken || '',
          facebookEnabled: data.socialMedia?.facebook?.enabled ?? false,
          facebookAccessToken: data.socialMedia?.facebook?.accessToken || '',
          facebookPageId: data.socialMedia?.facebook?.pageId || '',
          instagramEnabled: data.socialMedia?.instagram?.enabled ?? false,
          instagramAccessToken: data.socialMedia?.instagram?.accessToken || '',
          instagramBusinessAccountId: data.socialMedia?.instagram?.businessAccountId || '',
          twitterEnabled: data.socialMedia?.twitter?.enabled ?? false,
          twitterApiKey: data.socialMedia?.twitter?.apiKey || '',
          twitterApiSecret: data.socialMedia?.twitter?.apiSecret || '',
          twitterAccessToken: data.socialMedia?.twitter?.accessToken || '',
          twitterAccessTokenSecret: data.socialMedia?.twitter?.accessTokenSecret || '',
          tiktokEnabled: data.socialMedia?.tiktok?.enabled ?? false,
          tiktokAccessToken: data.socialMedia?.tiktok?.accessToken || '',
          tiktokRefreshToken: data.socialMedia?.tiktok?.refreshToken || '',
          youtubeEnabled: data.socialMedia?.youtube?.enabled ?? false,
          youtubeAccessToken: data.socialMedia?.youtube?.accessToken || '',
          youtubeRefreshToken: data.socialMedia?.youtube?.refreshToken || '',
          youtubeChannelId: data.socialMedia?.youtube?.channelId || ''
        };
        setCredentials({ ...defaultCredentials, ...mapped });
        setConnectionMessage('✅ Konfiguration geladen. Jetzt speichern, um sie zu übernehmen.');
      } catch (_err) {
        setConnectionMessage('❌ Fehler beim Laden der Datei. Bitte gültige connection.json wählen.');
      }
    };
    reader.readAsText(file);
  };

  // Lizenz-Daten
  const [licenseKey, setLicenseKey] = useState('');
  const [activatingLicense, setActivatingLicense] = useState(false);

  // Verfügbare Spezialisierungen
  const [specializations] = useState<Specialization[]>([
    {
      id: 'dsgvo-digital',
      name: 'DSGVO Digitale Produkte',
      description: 'Spezialisiert auf datenschutzkonforme digitale Inhalte für EU-Markt',
      price: 99,
      icon: '🔒',
      isActive: true,
      features: [
        'DSGVO-konforme Produkttexte',
        'EU-rechtskonforme Beschreibungen',
        'Cookie-Consent Templates',
        'Impressum & AGB Generator',
        'Datenschutz-Optimierung'
      ]
    },
    {
      id: 'reisebuero',
      name: 'Reisebüro',
      description: 'Optimiert für Reise- und Tourismusbranche',
      price: 149,
      icon: '✈️',
      isActive: false,
      features: [
        'Reisebeschreibungen',
        'Hotel & Unterkunft Marketing',
        'Destination Content',
        'Buchungsoptimierung',
        'Review-Management'
      ]
    },
    {
      id: '3d-druck',
      name: '3D-Druck Objekte',
      description: 'Spezialisiert auf 3D-Druck E-Commerce',
      price: 129,
      icon: '🖨️',
      isActive: false,
      features: [
        'Technische Spezifikationen',
        'Material-Beschreibungen',
        'STL-File Handling',
        'Custom-Order Workflows',
        'Drucker-Kompatibilität'
      ]
    },
    {
      id: 'fashion',
      name: 'Fashion & Bekleidung',
      description: 'Mode und Bekleidungshandel',
      price: 119,
      icon: '👗',
      isActive: false,
      features: [
        'Produkt-Styling Texte',
        'Größentabellen',
        'Material & Pflege',
        'Trend-Analysen',
        'Lookbook-Content'
      ]
    }
  ]);

  const handleBack = () => {
    navigate('/');
  };

  const loadCredentials = async () => {
    try {
      setLoading(true);
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/connection`);
      if (!response.ok) throw new Error('Fehler beim Laden');
      const data = await response.json();
      
      // Backend sends masked credentials, keep them for display
      if (data.success && data.credentials) {
        // Merge mit defaults um fehlende neue Properties zu füllen
        setCredentials(_prev => ({ ...defaultCredentials, ...data.credentials }));
      }
    } catch (error) {
      console.warn('Hinweis: Einstellungen noch nicht ausgefüllt.', error);
      setConnectionMessage('ℹ️ Ihr Agent ist noch nicht konfiguriert. Bitte füllen Sie alle Pflichtfelder aus, um die Verbindung herzustellen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = (field: keyof ShopCredentials, value: string | number | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('');
    
    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/connection/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) throw new Error('Test fehlgeschlagen');
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('success');
        setConnectionMessage(
          `${data.results.wordpress.message}\n${data.results.woocommerce.message}`
        );
      } else {
        setConnectionStatus('error');
        setConnectionMessage(data.message || 'Verbindungstest fehlgeschlagen');
      }
      
      console.log('🔍 Verbindungstest:', data);
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('❌ Verbindungsfehler - Backend nicht erreichbar');
      console.error('❌ Verbindungsfehler:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      // Mapping: flach -> verschachtelt
      const payload = {
        wordpress: {
          url: credentials.wpUrl,
          username: credentials.wpUsername,
          appPassword: credentials.wpAppPassword,
        },
        woocommerce: {
          url: credentials.wcApiUrl,
          consumerKey: credentials.wcConsumerKey,
          consumerSecret: credentials.wcConsumerSecret,
          authMode: credentials.wooAuthMode,
          timeoutMs: credentials.wooTimeoutMs,
        },
        openAI: {
          apiKey: credentials.openaiApiKey,
          model: credentials.openaiModel,
        },
        smtp: {
          host: credentials.smtpHost,
          port: credentials.smtpPort,
          secure: credentials.smtpSecure,
          user: credentials.smtpUser,
          password: credentials.smtpPassword,
          from: credentials.smtpFrom,
        },
        job: {
          mode: credentials.jobMode,
          intervalMs: credentials.jobIntervalMs,
        },
        features: {
          enableAnalytics: credentials.enableAnalytics,
          enableAutoProducts: credentials.enableAutoProducts,
          enableEmailMarketing: credentials.enableEmailMarketing,
        },
        reddit: {
          clientId: credentials.redditClientId,
          clientSecret: credentials.redditClientSecret,
        },
        ml: {
          enabled: credentials.mlEnabled,
          productRecommendations: credentials.mlProductRecommendations,
          trendForecasting: credentials.mlTrendForecasting,
          dynamicPricing: credentials.mlDynamicPricing,
          emailOptimization: credentials.mlEmailOptimization,
          churnPrediction: credentials.mlChurnPrediction,
          sentimentAnalysis: credentials.mlSentimentAnalysis,
          fraudDetection: credentials.mlFraudDetection,
          productRecMinConfidence: credentials.mlProductRecMinConfidence,
          productRecFallback: credentials.mlProductRecFallback,
          trendMinConfidence: credentials.mlTrendMinConfidence,
          trendFallback: credentials.mlTrendFallback,
          emailMinConfidence: credentials.mlEmailMinConfidence,
          emailFallback: credentials.mlEmailFallback,
          emailDefaultTime: credentials.mlEmailDefaultTime,
          maxInferenceTime: credentials.mlMaxInferenceTime,
          cacheResults: credentials.mlCacheResults,
          cacheTtl: credentials.mlCacheTtl,
        }
      };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Speichern fehlgeschlagen');
      const data = await response.json();
      if (data.success) {
        setConnectionStatus('success');
        setConnectionMessage('✅ Konfiguration erfolgreich gespeichert!');
        console.log('✅ Konfiguration gespeichert');
        setTimeout(() => {
          setConnectionMessage('');
          setConnectionStatus('idle');
        }, 3000);
      } else {
        throw new Error('Speichern fehlgeschlagen');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('❌ Fehler beim Speichern der Konfiguration');
      console.error('❌ Fehler beim Speichern:', error);
    } finally {
      setSaving(false);
    }
  }

  const activateLicense = async () => {
    if (!licenseKey) {
      alert('❌ Bitte gib einen Lizenzschlüssel ein');
      return;
    }

    setActivatingLicense(true);
    
    try {
      // Simuliere Lizenz-Aktivierung
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('🔑 Lizenz aktiviert:', licenseKey);
      alert('✅ Lizenz erfolgreich aktiviert!');
    } catch (error) {
      console.error('❌ Lizenz-Aktivierung fehlgeschlagen:', error);
      alert('❌ Ungültiger Lizenzschlüssel');
    } finally {
      setActivatingLicense(false);
    }
  };

  const purchaseSpecialization = (spec: Specialization) => {
    console.log('🛒 Kaufe Spezialisierung:', spec.name);
    alert(`🛒 Weiterleitung zum Kauf: ${spec.name} (${spec.price}€)`);
  };

  return (
    <div className="analytics-page">
      {/* Floating Back Button */}
      <button className="back-button floating-back" onClick={handleBack}>
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>⚙️ Konfiguration & Einstellungen</h1>
        <p>Shop-Verbindung, Spezialisierung und Lizenz-Verwaltung</p>
      </div>

      {/* Tab Navigation */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <div className="tab-navigation" style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '30px',
            borderBottom: '2px solid rgba(255,255,255,0.1)',
            paddingBottom: '10px'
          }}>
            <button
              onClick={() => setActiveTab('connection')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'connection' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                border: activeTab === 'connection' ? '2px solid #3b82f6' : '2px solid transparent',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'connection' ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              🔌 Shop-Verbindung
            </button>
            <button
              onClick={() => setActiveTab('specialization')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'specialization' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                border: activeTab === 'specialization' ? '2px solid #3b82f6' : '2px solid transparent',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'specialization' ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              🎯 Spezialisierung
            </button>
            <button
              onClick={() => setActiveTab('license')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'license' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                border: activeTab === 'license' ? '2px solid #3b82f6' : '2px solid transparent',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'license' ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              🔑 Lizenz
            </button>
            <button
              onClick={() => setActiveTab('social')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'social' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                border: activeTab === 'social' ? '2px solid #3b82f6' : '2px solid transparent',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'social' ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              📱 Social Media
            </button>
            <button
              onClick={() => navigate('/settings/ml')}
              style={{
                padding: '12px 24px',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '2px solid #8b5cf6',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              🧠 Machine Learning
            </button>
          </div>

          {/* TAB 1: Shop-Verbindung */}
          {activeTab === 'connection' && (
            <div>
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <h3>Lade Einstellungen...</h3>
                </div>
              )}

              {!loading && (
                <>
                  <h3>🔌 Shop-Verbindung einrichten</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px' }}>
                    Verbinde dein WooCommerce/WordPress Shop mit dem AI-Agent
                  </p>

                  {/* Import-Konfiguration: Button wird unten platziert */}

                  {/* Status Message */}
                  {connectionMessage && (
                    <div style={{
                      padding: '15px',
                      marginBottom: '20px',
                      background: connectionStatus === 'success' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : connectionStatus === 'error'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(59, 130, 246, 0.2)',
                      border: `2px solid ${
                        connectionStatus === 'success' 
                          ? '#22c55e' 
                          : connectionStatus === 'error'
                          ? '#ef4444'
                          : '#3b82f6'
                      }`,
                      borderRadius: '8px',
                      whiteSpace: 'pre-line'
                    }}>
                      {connectionMessage}
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
                {/* WordPress Credentials */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>📝 WordPress Zugangsdaten</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      WordPress URL:
                    </label>
                    <input
                      type="text"
                      placeholder="https://meinshop.de"
                      value={credentials.wpUrl || ''}
                      onChange={(e) => handleCredentialChange('wpUrl', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Username/Email:
                    </label>
                    <input
                      type="text"
                      placeholder="admin@meinshop.de"
                      value={credentials.wpUsername || ''}
                      onChange={(e) => handleCredentialChange('wpUsername', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Application Password:
                    </label>
                    <input
                      type="password"
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={credentials.wpAppPassword || ''}
                      onChange={(e) => handleCredentialChange('wpAppPassword', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      💡 Erstelle ein Application Password in WordPress unter Benutzer → Profil
                    </small>
                  </div>
                </div>

                {/* WooCommerce Credentials */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>🛒 WooCommerce API Keys</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      WooCommerce API URL:
                    </label>
                    <input
                      type="text"
                      placeholder="https://meinshop.de"
                      value={credentials.wcApiUrl || ''}
                      onChange={(e) => handleCredentialChange('wcApiUrl', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Consumer Key:
                    </label>
                    <input
                      type="text"
                      placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={credentials.wcConsumerKey || ''}
                      onChange={(e) => handleCredentialChange('wcConsumerKey', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Consumer Secret:
                    </label>
                    <input
                      type="password"
                      placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={credentials.wcConsumerSecret || ''}
                      onChange={(e) => handleCredentialChange('wcConsumerSecret', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      💡 Erstelle API-Keys in WooCommerce → Einstellungen → Erweitert → REST API
                    </small>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                        Auth Mode:
                      </label>
                      <select
                        value={credentials.wooAuthMode || 'basic'}
                        onChange={(e) => handleCredentialChange('wooAuthMode', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        <option value="basic">Basic Auth</option>
                        <option value="oauth">OAuth</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                        Timeout (ms):
                      </label>
                      <input
                        type="number"
                        value={credentials.wooTimeoutMs ?? 0}
                        onChange={(e) => handleCredentialChange('wooTimeoutMs', parseInt(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reddit Credentials */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>👽 Reddit API</h4>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Reddit Client ID:
                    </label>
                    <input
                      type="text"
                      placeholder="Reddit Client ID"
                      value={credentials.redditClientId || ''}
                      onChange={(e) => handleCredentialChange('redditClientId', e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Reddit Client Secret:
                    </label>
                    <input
                      type="password"
                      placeholder="Reddit Client Secret"
                      value={credentials.redditClientSecret || ''}
                      onChange={(e) => handleCredentialChange('redditClientSecret', e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* E-Mail Konfiguration */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>📧 E-Mail Konfiguration</h4>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      SMTP Host:
                    </label>
                    <input
                      type="text"
                      placeholder="SMTP Host"
                      value={credentials.smtpHost || ''}
                      onChange={(e) => handleCredentialChange('smtpHost', e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      SMTP Port:
                    </label>
                    <input
                      type="number"
                      placeholder="465"
                      value={credentials.smtpPort ?? 0}
                      onChange={(e) => handleCredentialChange('smtpPort', Number(e.target.value) || 0)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      SMTP Secure:
                    </label>
                    <select
                      value={credentials.smtpSecure ? 'true' : 'false'}
                      onChange={(e) => handleCredentialChange('smtpSecure', e.target.value === 'true')}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      SMTP User:
                    </label>
                    <input
                      type="text"
                      placeholder="info@kaufe-es.eu"
                      value={credentials.smtpUser || ''}
                      onChange={(e) => handleCredentialChange('smtpUser', e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      SMTP Password:
                    </label>
                    <input
                      type="password"
                      placeholder="SMTP Passwort"
                      value={credentials.smtpPassword || ''}
                      onChange={(e) => handleCredentialChange('smtpPassword', e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      SMTP From:
                    </label>
                    <input
                      type="text"
                      placeholder="info@kaufe-es.eu"
                      value={credentials.smtpFrom || ''}
                      onChange={(e) => handleCredentialChange('smtpFrom', e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* AI & Services Configuration */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>🤖 AI & Services</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      OpenAI API Key:
                    </label>
                    <input
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={credentials.openaiApiKey || ''}
                      onChange={(e) => handleCredentialChange('openaiApiKey', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      💡 Benötigt für AI-Features (Content-Generierung, Optimierung, etc.)
                    </small>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      OpenAI Model:
                    </label>
                    <select
                      value={credentials.openaiModel || 'gpt-4o-mini'}
                      onChange={(e) => handleCredentialChange('openaiModel', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    >
                      <option value="gpt-4o">GPT-4o (Empfohlen)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Schneller)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Günstig)</option>
                    </select>
                  </div>

                </div>

                {/* Job Configuration */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>⚙️ Job-Konfiguration</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Job Mode:
                    </label>
                    <select
                      value={credentials.jobMode || 'once'}
                      onChange={(e) => handleCredentialChange('jobMode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    >
                      <option value="once">Einmalig (Once)</option>
                      <option value="interval">Intervall (Wiederkehrend)</option>
                    </select>
                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      💡 Legt fest, ob Jobs einmalig oder wiederkehrend ausgeführt werden
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                      Job Intervall (ms):
                    </label>
                    <input
                      type="number"
                      value={credentials.jobIntervalMs ?? 0}
                      onChange={(e) => handleCredentialChange('jobIntervalMs', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      💡 Standard: 900000ms (15 Minuten) - Nur relevant bei "Intervall"-Modus
                    </small>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>🎛️ Feature-Aktivierung</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!credentials.enableAnalytics}
                        onChange={(e) => handleCredentialChange('enableAnalytics', e.target.checked)}
                        style={{ 
                          marginRight: '10px', 
                          width: '20px', 
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                        📊 Analytics & Reporting aktivieren
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!credentials.enableAutoProducts}
                        onChange={(e) => handleCredentialChange('enableAutoProducts', e.target.checked)}
                        style={{ 
                          marginRight: '10px', 
                          width: '20px', 
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                        🤖 Auto-Product-Creation aktivieren
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!credentials.enableEmailMarketing}
                        onChange={(e) => handleCredentialChange('enableEmailMarketing', e.target.checked)}
                        style={{ 
                          marginRight: '10px', 
                          width: '20px', 
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                        📧 Email-Marketing aktivieren
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              {connectionStatus !== 'idle' && (
                <div style={{
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  background: connectionStatus === 'success' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${connectionStatus === 'success' ? '#22c55e' : '#ef4444'}`
                }}>
                  {connectionStatus === 'success' ? (
                    <span style={{ color: '#22c55e' }}>✅ Verbindung erfolgreich getestet!</span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>❌ Verbindung fehlgeschlagen. Prüfe deine Zugangsdaten.</span>
                  )}
                </div>
              )}

              {/* Action Buttons inkl. Import-Konfiguration */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px', alignItems: 'center' }}>
                <button
                  onClick={testConnection}
                  disabled={testingConnection}
                  style={{
                    padding: '12px 24px',
                    background: testingConnection ? 'rgba(100,100,100,0.3)' : 'rgba(59, 130, 246, 0.3)',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: testingConnection ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {testingConnection ? '🔄 Teste Verbindung...' : '🧪 Verbindung testen'}
                </button>

                <button
                  onClick={saveConfiguration}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: saving ? 'rgba(100,100,100,0.3)' : 'rgba(34, 197, 94, 0.3)',
                    border: '2px solid #22c55e',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {saving ? '💾 Speichert...' : '💾 Konfiguration speichern'}
                </button>

                {/* Import-Konfiguration Button */}
                <label htmlFor="import-config" style={{
                  display: 'inline-block',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  border: '2px solid #3b82f6',
                  fontSize: '16px',
                  marginLeft: '10px'
                }}>
                  📂 Konfiguration laden
                  <input
                    id="import-config"
                    type="file"
                    accept="application/json"
                    style={{ display: 'none' }}
                    onChange={handleImportConfig}
                  />
                </label>
              </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Spezialisierung */}
          {activeTab === 'specialization' && (
            <div>
              <h3>🎯 Agent-Spezialisierung wählen</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px' }}>
                Wähle eine Branche, um den AI-Agent optimal auf deine Produkte zu trainieren
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {specializations.map((spec) => (
                  <div
                    key={spec.id}
                    style={{
                      background: spec.isActive 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))'
                        : 'rgba(255,255,255,0.05)',
                      border: spec.isActive ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '24px',
                      position: 'relative',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {spec.isActive && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#22c55e',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✓ AKTIV
                      </div>
                    )}

                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>{spec.icon}</div>
                    <h4 style={{ marginBottom: '10px', fontSize: '20px' }}>{spec.name}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '20px' }}>
                      {spec.description}
                    </p>

                    <div style={{ marginBottom: '20px' }}>
                      <strong style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Features:</strong>
                      <ul style={{ 
                        marginTop: '10px', 
                        paddingLeft: '20px', 
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.7)'
                      }}>
                        {spec.features.map((feature, idx) => (
                          <li key={idx} style={{ marginBottom: '5px' }}>✓ {feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: 'auto'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                        {spec.price}€
                      </div>
                      {!spec.isActive && (
                        <button
                          onClick={() => purchaseSpecialization(spec)}
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          🛒 Jetzt kaufen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Lizenz */}
          {activeTab === 'license' && (
            <div>
              <h3>🔑 Lizenz-Verwaltung</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px' }}>
                Aktiviere deine gekaufte Spezialisierung mit einem Lizenzschlüssel
              </p>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '12px', maxWidth: '600px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                    Lizenzschlüssel eingeben:
                  </label>
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '18px',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      letterSpacing: '2px'
                    }}
                  />
                  <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                    💡 Du findest deinen Lizenzschlüssel in der Kaufbestätigung per Email
                  </small>
                </div>

                <button
                  onClick={activateLicense}
                  disabled={activatingLicense || !licenseKey}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: activatingLicense || !licenseKey 
                      ? 'rgba(100,100,100,0.3)' 
                      : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: activatingLicense || !licenseKey ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {activatingLicense ? '⏳ Aktiviere Lizenz...' : '🔓 Lizenz aktivieren'}
                </button>
              </div>

              {/* Aktive Lizenzen */}
              <div style={{ marginTop: '40px' }}>
                <h4 style={{ marginBottom: '20px' }}>📋 Aktive Lizenzen</h4>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                        🔒 DSGVO Digitale Produkte
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                        Lizenz: DSGVO-2024-XXXX-XXXX
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>
                        Aktiviert am: 31.10.2025 | Läuft ab: 31.10.2026
                      </div>
                    </div>
                    <div style={{
                      background: '#22c55e',
                      color: 'white',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      ✓ AKTIV
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Social Media */}
          {activeTab === 'social' && (
            <div>
              <h3>📱 Social Media Konten verbinden</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px' }}>
                Verbinde deine Social-Media-Konten, um KI-generierte Posts direkt zu veröffentlichen
              </p>

              {/* Social Media Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
              }}>
                {/* LinkedIn */}
                <div style={{
                  background: 'rgba(0, 119, 181, 0.1)',
                  border: '2px solid rgba(0, 119, 181, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '32px', marginRight: '15px' }}>💼</span>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>LinkedIn</h4>
                      <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {credentials.linkedinEnabled ? '✅ Verbunden' : '⏸️ Nicht verbunden'}
                      </small>
                    </div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Access Token:
                    </label>
                    <input
                      type="password"
                      placeholder="LinkedIn Access Token"
                      value={credentials.linkedinAccessToken}
                      onChange={(e) => handleCredentialChange('linkedinAccessToken', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={credentials.linkedinEnabled}
                      onChange={(e) => handleCredentialChange('linkedinEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Aktiviert</span>
                  </label>
                </div>

                {/* Facebook */}
                <div style={{
                  background: 'rgba(59, 89, 152, 0.1)',
                  border: '2px solid rgba(59, 89, 152, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '32px', marginRight: '15px' }}>👍</span>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>Facebook</h4>
                      <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {credentials.facebookEnabled ? '✅ Verbunden' : '⏸️ Nicht verbunden'}
                      </small>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Access Token:
                    </label>
                    <input
                      type="password"
                      placeholder="Facebook Access Token"
                      value={credentials.facebookAccessToken}
                      onChange={(e) => handleCredentialChange('facebookAccessToken', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        marginBottom: '10px'
                      }}
                    />
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Page ID:
                    </label>
                    <input
                      type="text"
                      placeholder="Facebook Page ID"
                      value={credentials.facebookPageId}
                      onChange={(e) => handleCredentialChange('facebookPageId', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={credentials.facebookEnabled}
                      onChange={(e) => handleCredentialChange('facebookEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Aktiviert</span>
                  </label>
                </div>

                {/* Instagram */}
                <div style={{
                  background: 'rgba(217, 45, 143, 0.1)',
                  border: '2px solid rgba(217, 45, 143, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '32px', marginRight: '15px' }}>📸</span>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>Instagram</h4>
                      <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {credentials.instagramEnabled ? '✅ Verbunden' : '⏸️ Nicht verbunden'}
                      </small>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Access Token:
                    </label>
                    <input
                      type="password"
                      placeholder="Instagram Access Token"
                      value={credentials.instagramAccessToken}
                      onChange={(e) => handleCredentialChange('instagramAccessToken', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        marginBottom: '10px'
                      }}
                    />
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Business Account ID:
                    </label>
                    <input
                      type="text"
                      placeholder="Instagram Business Account ID"
                      value={credentials.instagramBusinessAccountId}
                      onChange={(e) => handleCredentialChange('instagramBusinessAccountId', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={credentials.instagramEnabled}
                      onChange={(e) => handleCredentialChange('instagramEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Aktiviert</span>
                  </label>
                </div>

                {/* Twitter */}
                <div style={{
                  background: 'rgba(29, 155, 240, 0.1)',
                  border: '2px solid rgba(29, 155, 240, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '32px', marginRight: '15px' }}>🐦</span>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>Twitter/X</h4>
                      <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {credentials.twitterEnabled ? '✅ Verbunden' : '⏸️ Nicht verbunden'}
                      </small>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      API Key:
                    </label>
                    <input
                      type="password"
                      placeholder="Twitter API Key"
                      value={credentials.twitterApiKey}
                      onChange={(e) => handleCredentialChange('twitterApiKey', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        marginBottom: '10px'
                      }}
                    />
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      API Secret:
                    </label>
                    <input
                      type="password"
                      placeholder="Twitter API Secret"
                      value={credentials.twitterApiSecret}
                      onChange={(e) => handleCredentialChange('twitterApiSecret', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={credentials.twitterEnabled}
                      onChange={(e) => handleCredentialChange('twitterEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Aktiviert</span>
                  </label>
                </div>

                {/* TikTok */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '32px', marginRight: '15px' }}>🎵</span>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>TikTok</h4>
                      <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {credentials.tiktokEnabled ? '✅ Verbunden' : '⏸️ Nicht verbunden'}
                      </small>
                    </div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Access Token:
                    </label>
                    <input
                      type="password"
                      placeholder="TikTok Access Token"
                      value={credentials.tiktokAccessToken}
                      onChange={(e) => handleCredentialChange('tiktokAccessToken', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={credentials.tiktokEnabled}
                      onChange={(e) => handleCredentialChange('tiktokEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Aktiviert</span>
                  </label>
                </div>

                {/* YouTube */}
                <div style={{
                  background: 'rgba(255, 0, 0, 0.1)',
                  border: '2px solid rgba(255, 0, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '32px', marginRight: '15px' }}>📺</span>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>YouTube</h4>
                      <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {credentials.youtubeEnabled ? '✅ Verbunden' : '⏸️ Nicht verbunden'}
                      </small>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Access Token:
                    </label>
                    <input
                      type="password"
                      placeholder="YouTube Access Token"
                      value={credentials.youtubeAccessToken}
                      onChange={(e) => handleCredentialChange('youtubeAccessToken', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        marginBottom: '10px'
                      }}
                    />
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Channel ID:
                    </label>
                    <input
                      type="text"
                      placeholder="YouTube Channel ID"
                      value={credentials.youtubeChannelId}
                      onChange={(e) => handleCredentialChange('youtubeChannelId', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={credentials.youtubeEnabled}
                      onChange={(e) => handleCredentialChange('youtubeEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Aktiviert</span>
                  </label>
                </div>
              </div>

              {/* Info Box */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>ℹ️ Anleitung zum Verbinden</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.6' }}>
                  <li>Rufe die Entwicklerportal deiner Plattform auf (z.B. developer.linkedin.com)</li>
                  <li>Erstelle eine neue App/Integration für A.r.I.</li>
                  <li>Kopiere die Access Tokens und IDs in die entsprechenden Felder</li>
                  <li>Aktiviere die Plattform mit dem Checkbox</li>
                  <li>Speichere die Konfiguration</li>
                </ul>
              </div>

              {/* Save Button */}
              <button
                onClick={saveConfiguration}
                disabled={saving}
                style={{
                  padding: '15px 40px',
                  background: saving 
                    ? 'rgba(100,100,100,0.3)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {saving ? '⏳ Speichern...' : '💾 Speichern'}
              </button>

              {connectionMessage && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: connectionStatus === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                  border: `2px solid ${connectionStatus === 'success' ? '#22c55e' : '#dc3545'}`,
                  borderRadius: '8px',
                  color: connectionStatus === 'success' ? '#86efac' : '#f87171'
                }}>
                  {connectionMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
