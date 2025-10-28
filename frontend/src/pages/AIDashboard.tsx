// src/pages/AIDashboard.tsx
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AIDashboard.css';

const AIDashboard: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [metrics, setMetrics] = useState({
    sales: 0,
    orders: 0,
    conversion: 0,
    customers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // ECHTE DATEN VON DER API LADEN
  useEffect(() => {
    const fetchRealMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:3000/api/shop-metrics');
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const realData = await response.json();
        
        setMetrics({
          sales: realData.totalSales || realData.sales || 0,
          orders: realData.totalOrders || realData.orders || 0,
          conversion: realData.conversionRate || realData.conversion || 0,
          customers: realData.totalCustomers || realData.customers || 0
        });

        if (realData.salesData || realData.chartData) {
          setChartData(realData.salesData || realData.chartData);
        } else {
          setChartData([
            { day: 'Mo', sales: 0 }, { day: 'Di', sales: 0 }, { day: 'Mi', sales: 0 },
            { day: 'Do', sales: 0 }, { day: 'Fr', sales: 0 }, { day: 'Sa', sales: 0 }, { day: 'So', sales: 0 },
          ]);
        }
        
      } catch (err) {
        console.error('Fehler beim Laden der Shop-Daten:', err);
        setError('Konnte Shop-Daten nicht laden. Bitte API überprüfen.');
        setChartData([
          { day: 'Mo', sales: 0 }, { day: 'Di', sales: 0 }, { day: 'Mi', sales: 0 },
          { day: 'Do', sales: 0 }, { day: 'Fr', sales: 0 }, { day: 'Sa', sales: 0 }, { day: 'So', sales: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealMetrics();
    const interval = setInterval(fetchRealMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // FUNKTION ZUM STARTEN VON JOBS MIT KORREKTEN ENDPOINTS
  const startAITool = async (toolId: string, endpoint: string) => {
    try {
      setActiveTool(toolId);
      
      const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'start',
          tool: toolId 
        })
      });

      if (!response.ok) {
        throw new Error(`Job failed: ${response.status}`);
      }

      const result = await response.json();
      alert(`✅ ${toolId} gestartet! ${result.message || 'Job erfolgreich ausgeführt'}`);
      
    } catch (err) {
      console.error(`Fehler bei ${toolId}:`, err);
      alert(`❌ ${toolId} fehlgeschlagen: ${err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten'}`);
    } finally {
      setActiveTool(null);
    }
  };

  // ALLE 38 TOOLS MIT EXISTIERENDEN API-ENDPOINTS
  const toolCategories = [
    {
      id: 'analytics',
      name: '📊 Analytics & Metrics',
      color: '#3b82f6',
      tools: [
        {
          id: 'shop-metrics',
          title: '📊 Live Shop Metrics',
          description: 'Echtzeit-Kennzahlen deines Shops - Umsatz, Conversion, Kunden',
          endpoint: 'shop-metrics',
          icon: '📊'
        },
        {
          id: 'conversion-analysis',
          title: '📈 Conversion Analysis',
          description: 'Detaillierte Analyse der Conversion-Raten und Optimierung',
          endpoint: 'shop-metrics',
          icon: '📈'
        },
        {
          id: 'conversion-reported',
          title: '📋 Conversion Reported',
          description: 'Automatische Conversion-Reports und Export',
          endpoint: 'shop-metrics',
          icon: '📋'
        },
        {
          id: 'trend-analysis',
          title: '📊 Trend Analysis',
          description: 'Erkenne Markt- und Verkaufstrends automatisch',
          endpoint: 'shop-metrics',
          icon: '📊'
        },
        {
          id: 'run-trend-analysis',
          title: '🚀 Run Trend Analysis',
          description: 'Führe Trend-Analyse sofort aus',
          endpoint: 'shop-metrics',
          icon: '🚀'
        },
        {
          id: 'real-analytics',
          title: '🔍 Real Analytics',
          description: 'Echtzeit-Analytics mit tiefgehenden Insights',
          endpoint: 'shop-metrics',
          icon: '🔍'
        },
        {
          id: 'real-web-analytics',
          title: '🌐 Real Web Analytics',
          description: 'Web-Commerce Analytics und Tracking',
          endpoint: 'shop-metrics',
          icon: '🌐'
        },
        {
          id: 'analytic-regioning',
          title: '🗺️ Analytic Regioning',
          description: 'Regionale Analytics und Geo-Targeting',
          endpoint: 'shop-metrics',
          icon: '🗺️'
        },
        {
          id: 'shop-health-report',
          title: '🏪 Shop Health Report',
          description: 'Kompletter Gesundheits-Check deines Shops',
          endpoint: 'shop-metrics',
          icon: '🏪'
        },
        {
          id: 'premium-audit',
          title: '⭐ Premium Audit',
          description: 'Premium-Shop-Audit mit Optimierungsempfehlungen',
          endpoint: 'shop-metrics',
          icon: '⭐'
        },
        {
          id: 'standard-audit',
          title: '🔧 Standard Audit',
          description: 'Basis-Audit für schnelle Shop-Optimierung',
          endpoint: 'shop-metrics',
          icon: '🔧'
        },
        {
          id: 'mini-audit',
          title: '🔎 Mini Audit',
          description: 'Schneller Check der wichtigsten Shop-Kennzahlen',
          endpoint: 'shop-metrics',
          icon: '🔎'
        }
      ]
    },
    {
      id: 'products', 
      name: '🛍️ Product Management',
      color: '#10b981',
      tools: [
        {
          id: 'auto-product-creator',
          title: '🤖 Auto Product Creator',
          description: 'Automatische Erstellung und Optimierung von Produkten',
          endpoint: 'product-optimizer',
          icon: '🤖'
        },
        {
          id: 'run-auto-product-creator',
          title: '🚀 Run Product Creator',
          description: 'Starte automatische Produkterstellung sofort',
          endpoint: 'product-optimizer',
          icon: '🚀'
        },
        {
          id: 'woo-product-create',
          title: '🛒 Woo Product Creator',
          description: 'Direkte Produkterstellung in WooCommerce',
          endpoint: 'woecommerce',
          icon: '🛒'
        },
        {
          id: 'woo-product-update',
          title: '✏️ Woo Product Updater',
          description: 'Automatische Produkt-Updates und Synchronisation',
          endpoint: 'woecommerce',
          icon: '✏️'
        },
        {
          id: 'categories-manager',
          title: '📑 Categories Manager',
          description: 'Automatische Kategorie-Verwaltung und Optimierung',
          endpoint: 'woecommerce',
          icon: '📑'
        },
        {
          id: 'create-freebies',
          title: '🎁 Freebies Creator',
          description: 'Erstelle automatisch Gratis-Produkte',
          endpoint: 'product-optimizer',
          icon: '🎁'
        },
        {
          id: 'run-create-freebies',
          title: '🚀 Run Freebies Creator',
          description: 'Starte Freebies-Erstellung sofort',
          endpoint: 'product-optimizer',
          icon: '🚀'
        },
        {
          id: 'product-bundles',
          title: '📦 Product Bundles',
          description: 'Erstelle und verwalte Produkt-Bundles automatisch',
          endpoint: 'product-optimizer',
          icon: '📦'
        }
      ]
    },
    {
      id: 'payments',
      name: '💰 Payment & Finances',
      color: '#f59e0b',
      tools: [
        {
          id: 'payment-fast',
          title: '⚡ Payment Fast',
          description: 'Schnelle Payment-Verarbeitung und Bestätigung',
          endpoint: 'woecommerce',
          icon: '⚡'
        },
        {
          id: 'payment-simplified',
          title: '🎯 Payment Simplified',
          description: 'Vereinfachte Payment-Abläufe für bessere Conversion',
          endpoint: 'woecommerce',
          icon: '🎯'
        },
        {
          id: 'payment-tester',
          title: '🧪 Payment Tester',
          description: 'Teste Payment-Prozesse automatisch',
          endpoint: 'woecommerce',
          icon: '🧪'
        },
        {
          id: 'payment-verifier',
          title: '✅ Payment Verifier',
          description: 'Automatische Payment-Verifikation und Validierung',
          endpoint: 'woecommerce',
          icon: '✅'
        },
        {
          id: 'payment-success',
          title: '🎉 Payment Success',
          description: 'Erfolgreiche Payment-Abschlüsse verwalten',
          endpoint: 'woecommerce',
          icon: '🎉'
        },
        {
          id: 'payment-validation',
          title: '🔐 Payment Validation',
          description: 'Sichere Payment-Validierung und Fraud-Check',
          endpoint: 'woecommerce',
          icon: '🔐'
        },
        {
          id: 'payment-issued-detector',
          title: '📋 Payment Issued Detector',
          description: 'Erkenne und behandle Payment-Probleme automatisch',
          endpoint: 'woecommerce',
          icon: '📋'
        },
        {
          id: 'payment-user-favor',
          title: '❤️ Payment User Favor',
          description: 'Personalized Payment-Erfahrungen für Kunden',
          endpoint: 'woecommerce',
          icon: '❤️'
        },
        {
          id: 'payment-delisoger',
          title: '📦 Payment Delivery',
          description: 'Payment-Delivery und Versandabwicklung',
          endpoint: 'woecommerce',
          icon: '📦'
        },
        {
          id: 'payment-energency',
          title: '🚨 Payment Emergency',
          description: 'Notfall-System für Payment-Probleme',
          endpoint: 'woecommerce',
          icon: '🚨'
        },
        {
          id: 'payment-frompansion',
          title: '📈 Payment Expansion',
          description: 'Payment-System Erweiterung und Skalierung',
          endpoint: 'woecommerce',
          icon: '📈'
        },
        {
          id: 'payment-quickcheck',
          title: '⚡ Payment Quick Check',
          description: 'Schneller Payment-Status Check',
          endpoint: 'woecommerce',
          icon: '⚡'
        }
      ]
    },
    {
      id: 'marketing',
      name: '📢 Marketing & Content', 
      color: '#ec4899',
      tools: [
        {
          id: 'ai-email-generator',
          title: '📧 AI Email Generator',
          description: 'Erstelle professionelle Marketing-E-Mails in Sekunden',
          endpoint: 'ai-email',
          icon: '📧'
        },
        {
          id: 'german-content-generator',
          title: '🇩🇪 German Content Generator',
          description: 'Deutsche Content-Erstellung für lokales Marketing',
          endpoint: 'ai-email',
          icon: '🇩🇪'
        },
        {
          id: 'email-marketing-automation',
          title: '✉️ Email Marketing Automation',
          description: 'Komplette Email-Marketing Automatisierung',
          endpoint: 'ai-email',
          icon: '✉️'
        },
        {
          id: 'social-media-audio',
          title: '🎵 Social Media Audio',
          description: 'Audio-Beiträge für Social Media automatisch erstellen',
          endpoint: 'ai-email',
          icon: '🎵'
        },
        {
          id: 'social-media-poster',
          title: '📱 Social Media Poster',
          description: 'Automatisches Posting auf Social Media Kanäle',
          endpoint: 'ai-email',
          icon: '📱'
        },
        {
          id: 'free-to-post-converter',
          title: '🆓 Free to Post Converter',
          description: 'Konvertiere Free-User zu aktiven Postern',
          endpoint: 'ai-email',
          icon: '🆓'
        },
        {
          id: 'content-monetized',
          title: '💸 Content Monetized',
          description: 'Automatische Content-Monetarisierung',
          endpoint: 'ai-email',
          icon: '💸'
        },
        {
          id: 'kite-templates',
          title: '🎨 Kite Templates',
          description: 'Professionelle Templates für alle Marketing-Kanäle',
          endpoint: 'ai-email',
          icon: '🎨'
        }
      ]
    },
    {
      id: 'advanced',
      name: '⚡ Advanced AI',
      color: '#8b5cf6', 
      tools: [
        {
          id: 'context-generator',
          title: '🧠 Context Generator',
          description: 'Generiere KI-Kontexte für bessere Ergebnisse',
          endpoint: 'memory',
          icon: '🧠'
        },
        {
          id: 'string-generator',
          title: '🔤 String Generator',
          description: 'Intelligente String-Generierung für verschiedene Use-Cases',
          endpoint: 'memory',
          icon: '🔤'
        },
        {
          id: 'auto-framplementator',
          title: '🔄 Auto Framplementator',
          description: 'Automatische Framework-Implementierung',
          endpoint: 'system',
          icon: '🔄'
        },
        {
          id: 'woocommerce-sync',
          title: '🔄 WooCommerce Sync',
          description: 'Automatische Synchronisation mit WooCommerce',
          endpoint: 'woecommerce',
          icon: '🔄'
        },
        {
          id: 'memory-system',
          title: '💾 Memory System',
          description: 'KI-Gedächtnis für personalisierte Ergebnisse',
          endpoint: 'memory',
          icon: '💾'
        },
        {
          id: 'system-health',
          title: '⚙️ System Health',
          description: 'System-Status und Performance-Monitoring',
          endpoint: 'system',
          icon: '⚙️'
        }
      ]
    }
  ];

  // ALLE TOOLS FÜR "ALLE" KATEGORIE
  const allTools = toolCategories.flatMap(category => category.tools);

  const filteredTools = activeCategory === 'all' 
    ? allTools 
    : toolCategories.find(cat => cat.id === activeCategory)?.tools || [];

  // LOADING COMPONENT
  if (loading) {
    return (
      <div className={`dashboard ${isDark ? 'dark-theme' : 'light-theme'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            color: 'white'
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              marginBottom: '20px'
            }}
          />
          <h3>📊 Lade Echtzeit-Daten...</h3>
          <p style={{ opacity: 0.7 }}>Verbinde mit WooCommerce API</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${isDark ? 'dark-theme' : 'light-theme'}`}>
      {/* HEADER */}
      <motion.header 
        className="App-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h1>🚀 AI Powerpack Pro</h1>
            <p>Real-time Analytics & AI Content Generation</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {error && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ⚠️ API Error
              </motion.span>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDark(!isDark)}
              className="theme-toggle"
            >
              {isDark ? '🌙 Dark' : '☀️ Light'}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ERROR MESSAGE */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '15px',
              margin: '20px 0',
              color: '#ef4444'
            }}
          >
            <strong>⚠️ Fehler: </strong>{error}
            <br />
            <small>Stelle sicher, dass die API unter http://localhost:3000 erreichbar ist</small>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE METRICS GRID */}
      <motion.div 
        className="metric-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <motion.div className="glass-card metric-card metric-glow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#10b981', margin: 0 }}>💰 Umsatz</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p className="metric-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
            € {metrics.sales.toFixed(2)}
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {metrics.sales > 0 ? 'Echtzeit-Daten' : 'Keine Daten verfügbar'}
          </p>
        </motion.div>

        <motion.div className="glass-card metric-card metric-glow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#3b82f6', margin: 0 }}>📦 Bestellungen</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p className="metric-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: '10px 0' }}>
            {metrics.orders}
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {metrics.orders > 0 ? 'Aktuelle Bestellungen' : 'Keine Bestellungen'}
          </p>
        </motion.div>

        <motion.div className="glass-card metric-card metric-glow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#8b5cf6', margin: 0 }}>📊 Conversion</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p className="metric-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', margin: '10px 0' }}>
            {metrics.conversion}%
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {metrics.conversion > 0 ? 'Aktuelle Rate' : 'Keine Conversion-Daten'}
          </p>
        </motion.div>

        <motion.div className="glass-card metric-card metric-glow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#f59e0b', margin: 0 }}>👥 Kunden</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p className="metric-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: '10px 0' }}>
            {metrics.customers}
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {metrics.customers > 0 ? 'Registrierte Kunden' : 'Keine Kundendaten'}
          </p>
        </motion.div>
      </motion.div>

      {/* INTERACTIVE CHART */}
      <motion.div className="glass-card">
        <h2 style={{ color: 'white', marginBottom: '20px' }}>
          📈 Umsatzentwicklung {chartData.some(item => item.sales > 0) ? '' : '(Demo-Daten)'}
        </h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px', color: 'white' }} />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* TOOLS KATEGORIE FILTER */}
      <motion.div className="glass-card" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', margin: 0 }}>🤖 AI Tools & Automations</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '8px 16px',
                background: activeCategory === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              🔥 Alle Tools ({allTools.length})
            </motion.button>
            {toolCategories.map(category => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  padding: '8px 16px',
                  background: activeCategory === category.id ? category.color : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {category.name} ({category.tools.length})
              </motion.button>
            ))}
          </div>
        </div>

        {/* TOOLS GRID */}
        <div className="ai-tools-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          padding: '10px'
        }}>
          {filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              className="ai-tool-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (index * 0.03) }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: activeTool === tool.id ? 0.7 : 1
              }}
              onClick={() => startAITool(tool.id, tool.endpoint)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{tool.icon}</span>
                  <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                    {tool.title}
                    {activeTool === tool.id && ' 🔄'}
                  </h3>
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '20px' }}>
                  {tool.description}
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={activeTool === tool.id}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: activeTool === tool.id ? 'not-allowed' : 'pointer',
                  opacity: activeTool === tool.id ? 0.6 : 1,
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  width: '100%'
                }}
              >
                {activeTool === tool.id ? 'Wird ausgeführt...' : 'Tool starten'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AIDashboard;