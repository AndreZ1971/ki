// src/pages/analytics/ShopMetrics.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface MetricsData {
  totalSales?: number;
  todaySales?: number;
  totalOrders?: number;
  todayOrders?: number;
  totalCustomers?: number;
  totalProducts?: number;
  conversionRate?: number;
  lastUpdated?: string;
}

const ShopMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      let base = (import.meta.env.VITE_API_URL || '').trim();
      // Entferne evtl. abschließenden Slash
      if (base.endsWith('/')) base = base.slice(0, -1);
      // Wenn leer, nutze nur den relativen Pfad
      const apiUrl = base ? `${base}/api/analytics/metrics/dashboard` : `/api/analytics/metrics/dashboard`;
      if (apiUrl.includes(':3000')) {
        console.warn('Warnung: API-URL enthält Port 3000. Bei HTTPS/Proxy sollte die URL ohne Port sein!');
      }
      console.log('ShopMetrics API-URL:', apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError('Failed to load metrics');
      }
    } catch (err) {
      setError('Connection error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (loading) return <div className="loading-spinner">📊 Loading Metrics...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="analytics-page">
      {/* Absolut positionierter Back-Button */}
      <button 
        className="back-button floating-back" 
        onClick={handleBackToDashboard}
      >
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>📊 Live Shop Metrics</h1>
        <p>Echtzeit-Kennzahlen deines Shops</p>
      </div>

      {/* KORRIGIERT: 2x4 Grid Layout - 2 Reihen, 4 Spalten */}
      <div className="analytics-grid-2x4">
        {/* Erste Reihe - 4 Karten nebeneinander */}
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-label">Total Sales</div>
          <div className="metric-value">${metrics?.totalSales || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-label">Today's Sales</div>
          <div className="metric-value">${metrics?.todaySales || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🛒</div>
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">{metrics?.totalOrders || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-label">Today's Orders</div>
          <div className="metric-value">{metrics?.todayOrders || 0}</div>
        </div>

        {/* Zweite Reihe - 4 Karten nebeneinander */}
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-label">Total Customers</div>
          <div className="metric-value">{metrics?.totalCustomers || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📱</div>
          <div className="metric-label">Total Products</div>
          <div className="metric-value">{metrics?.totalProducts || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">{metrics?.conversionRate || 0}%</div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleDateString('de-DE') : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopMetrics;