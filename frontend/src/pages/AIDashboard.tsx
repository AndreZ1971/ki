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

  // Mock data animation - später durch WooCommerce API ersetzen
  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        sales: 1247.50,
        orders: 23,
        conversion: 4.2,
        customers: 18
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const chartData = [
    { day: 'Mo', sales: 400 },
    { day: 'Di', sales: 600 },
    { day: 'Mi', sales: 800 },
    { day: 'Do', sales: 1200 },
    { day: 'Fr', sales: 900 },
    { day: 'Sa', sales: 1500 },
    { day: 'So', sales: 1100 },
  ];

  const aiTools = [
    {
      id: 1,
      title: '📧 AI Email Generator',
      description: 'Erstelle professionelle Marketing-E-Mails in Sekunden',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      onClick: () => alert('Email Generator gestartet! 📧')
    },
    {
      id: 2,
      title: '📝 Produktbeschreibungen',
      description: 'Automatisch optimierte Produktbeschreibungen generieren',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #047857)',
      onClick: () => alert('Produktbeschreibungs-Generator gestartet! 📝')
    },
    {
      id: 3,
      title: '🔍 SEO Optimizer',
      description: 'Optimiere deine Inhalte für bessere Suchmaschinen-Rankings',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      onClick: () => alert('SEO Optimizer gestartet! 🔍')
    },
    {
      id: 4,
      title: '📱 Social Media Posts',
      description: 'Erstelle ansprechende Social Media Beiträge automatisch',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
      onClick: () => alert('Social Media Generator gestartet! 📱')
    },
    {
      id: 5,
      title: '🛒 WooCommerce Sync',
      description: 'Automatische Synchronisation mit deinem WooCommerce Shop',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      onClick: () => alert('WooCommerce Sync gestartet! 🛒')
    },
    {
      id: 6,
      title: '📊 Analytics Report',
      description: 'Detaillierte Analysen und Performance-Reports',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      onClick: () => alert('Analytics Report generiert! 📊')
    },
    {
      id: 7,
      title: '🎯 Ad Copy Generator',
      description: 'Wirkungsvolle Werbetexte für Google & Social Media Ads',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
      onClick: () => alert('Ad Copy Generator gestartet! 🎯')
    },
    {
      id: 8,
      title: '📸 Bildbeschreibungen',
      description: 'SEO-optimierte Alt-Texte und Bildbeschreibungen',
      color: '#84cc16',
      gradient: 'linear-gradient(135deg, #84cc16, #65a30d)',
      onClick: () => alert('Bildbeschreibungs-Generator gestartet! 📸')
    },
    {
      id: 9,
      title: '📋 Content Kalender',
      description: 'Automatische Content-Planung und Terminierung',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      onClick: () => alert('Content Kalender geöffnet! 📋')
    },
    {
      id: 10,
      title: '🔔 Benachrichtigungen',
      description: 'Intelligente Alerts für wichtige Shop-Ereignisse',
      color: '#6b7280',
      gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
      onClick: () => alert('Benachrichtigungen konfiguriert! 🔔')
    },
    {
      id: 11,
      title: '📈 KPI Dashboard',
      description: 'Echtzeit-Kennzahlen und Performance-Metriken',
      color: '#14b8a6',
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      onClick: () => alert('KPI Dashboard geöffnet! 📈')
    },
    {
      id: 12,
      title: '⚙️ Automatisierungen',
      description: 'Workflows für wiederkehrende Aufgaben einrichten',
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
      onClick: () => alert('Automatisierungen konfiguriert! ⚙️')
    }
  ];

  return (
    <div className={`dashboard ${isDark ? 'dark-theme' : 'light-theme'}`}>
      {/* EPIC HEADER */}
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
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsDark(!isDark)}
            className="theme-toggle"
          >
            {isDark ? '🌙 Dark' : '☀️ Light'}
          </motion.button>
        </div>
      </motion.header>

      {/* LIVE METRICS GRID */}
      <motion.div 
        className="metric-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* SALES METRIC */}
        <motion.div 
          className="glass-card metric-card metric-glow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#10b981', margin: 0 }}>💰 Umsatz</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p 
            className="metric-value"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}
          >
            € {metrics.sales.toFixed(2)}
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>+12% seit gestern</p>
        </motion.div>

        {/* ORDERS METRIC */}
        <motion.div 
          className="glass-card metric-card metric-glow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#3b82f6', margin: 0 }}>📦 Bestellungen</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p 
            className="metric-value"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: '10px 0' }}
          >
            {metrics.orders}
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>+8% diese Woche</p>
        </motion.div>

        {/* CONVERSION METRIC */}
        <motion.div 
          className="glass-card metric-card metric-glow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#8b5cf6', margin: 0 }}>📊 Conversion</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p 
            className="metric-value"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', margin: '10px 0' }}
          >
            {metrics.conversion}%
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>+0.8% vs. Vormonat</p>
        </motion.div>

        {/* CUSTOMERS METRIC */}
        <motion.div 
          className="glass-card metric-card metric-glow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#f59e0b', margin: 0 }}>👥 Kunden</h3>
            <span className="live-pulse" style={{ color: '#ef4444', fontSize: '12px' }}>● LIVE</span>
          </div>
          <motion.p 
            className="metric-value"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: '10px 0' }}
          >
            {metrics.customers}
          </motion.p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>+5 neue heute</p>
        </motion.div>
      </motion.div>

      {/* INTERACTIVE CHART */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 style={{ color: 'white', marginBottom: '20px' }}>📈 Umsatzentwicklung</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: 'none', 
                  borderRadius: '10px',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#ff6b6b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* AI TOOLS GRID SECTION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="glass-card"
        style={{ marginTop: '30px' }}
      >
        <h2 style={{ color: 'white', marginBottom: '30px' }}>🤖 AI Content Tools</h2>
        
        {/* 3x4 Grid Layout */}
        <div className="ai-tools-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          padding: '10px'
        }}>
          {aiTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              className="ai-tool-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + (index * 0.05) }}
              whileHover={{ 
                scale: 1.03,
                transition: { type: "spring", stiffness: 300 }
              }}
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
                justifyContent: 'space-between'
              }}
              onClick={tool.onClick}
            >
              <div>
                <h3 style={{ 
                  color: tool.color, 
                  marginBottom: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  {tool.title}
                </h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  marginBottom: '20px'
                }}>
                  {tool.description}
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '10px 16px',
                  background: tool.gradient,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  width: '100%'
                }}
              >
                Tool starten
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AIDashboard;