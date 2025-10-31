// frontend/src/pages/analytics/ShopMetrics.jsx
import React, { useState, useEffect } from 'react';
import './page.css';

const ShopMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/analytics/metrics/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError('Failed to load metrics');
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">📊 Loading Metrics...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>📊 Live Shop Metrics</h1>
        <p>Echtzeit-Kennzahlen deines Shops</p>
      </div>

      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Sales</div>
          <div className="metric-value">${metrics?.totalSales || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Today's Sales</div>
          <div className="metric-value">${metrics?.todaySales || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">{metrics?.totalOrders || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Today's Orders</div>
          <div className="metric-value">{metrics?.todayOrders || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Customers</div>
          <div className="metric-value">{metrics?.totalCustomers || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Products</div>
          <div className="metric-value">{metrics?.totalProducts || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">{metrics?.conversionRate || 0}%</div>
        </div>
      </div>

      <div className="metric-card">
        <h3>Last Updated</h3>
        <p>{metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default ShopMetrics;