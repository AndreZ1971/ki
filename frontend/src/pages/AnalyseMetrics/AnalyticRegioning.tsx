import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface RegionData {
  totalRegions: number;
  activeCountries: number;
  topRegion: string;
  europeTraffic: number;
  northAmericaTraffic: number;
  asiaTraffic: number;
  otherRegions: number;
  regionalConversion: number;
  lastUpdated: string;
}

interface CountryData {
  country: string;
  visitors: number;
  conversion: number;
  revenue: number;
  trend: number;
}

const AnalyticRegioning = () => {
  const navigate = useNavigate();
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('global');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchRegionData = async () => {
      setLoading(true);
      
      // Simuliere API-Aufruf
      setTimeout(() => {
        // Realistische Mock-Daten für regionale Analytics
        const mockRegionData: RegionData = {
          totalRegions: 8,
          activeCountries: 24,
          topRegion: 'Deutschland',
          europeTraffic: 65,
          northAmericaTraffic: 20,
          asiaTraffic: 10,
          otherRegions: 5,
          regionalConversion: 3.2,
          lastUpdated: new Date().toISOString()
        };

        const mockCountryData: CountryData[] = [
          { country: 'Deutschland', visitors: 15420, conversion: 4.1, revenue: 45280, trend: 12 },
          { country: 'Österreich', visitors: 8420, conversion: 3.8, revenue: 21850, trend: 8 },
          { country: 'Schweiz', visitors: 7210, conversion: 3.5, revenue: 19540, trend: 5 },
          { country: 'Frankreich', visitors: 6320, conversion: 2.9, revenue: 15420, trend: 15 },
          { country: 'Italien', visitors: 5210, conversion: 2.4, revenue: 11250, trend: -2 },
          { country: 'USA', visitors: 4850, conversion: 2.1, revenue: 14210, trend: 22 },
          { country: 'UK', visitors: 3980, conversion: 2.8, revenue: 9850, trend: 7 },
          { country: 'Spanien', visitors: 3540, conversion: 2.2, revenue: 7650, trend: -5 }
        ];

        setRegionData(mockRegionData);
        setCountryData(mockCountryData);
        setLastUpdate(new Date());
        setLoading(false);
      }, 1000);
    };

    fetchRegionData();
  }, [selectedRegion]);

  const handleBack = () => {
    navigate('/');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? '#27ae60' : '#e74c3c';
  };

  const getTrendIndicator = (value: number) => {
    return value >= 0 ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <button className="back-button floating-back" onClick={handleBack}>
          ← Zurück
        </button>
        <div className="analytics-header">
          <h1>🗺️ Analytic Regioning</h1>
          <p>Lade regionale Analytics-Daten...</p>
        </div>
        <div className="loading-spinner">🌍 Lade Geo-Daten...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Floating Back Button */}
      <button className="back-button floating-back" onClick={handleBack}>
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>🗺️ Analytic Regioning</h1>
        <p>Regionale Analytics und Geo-Targeting</p>
        
        <div className="time-range-selector">
          <button 
            className={selectedRegion === 'global' ? 'active' : ''}
            onClick={() => setSelectedRegion('global')}
          >
            🌍 Global
          </button>
          <button 
            className={selectedRegion === 'europe' ? 'active' : ''}
            onClick={() => setSelectedRegion('europe')}
          >
            🇪🇺 Europa
          </button>
          <button 
            className={selectedRegion === 'america' ? 'active' : ''}
            onClick={() => setSelectedRegion('america')}
          >
            🇺🇸 Nordamerika
          </button>
          <button 
            className={selectedRegion === 'asia' ? 'active' : ''}
            onClick={() => setSelectedRegion('asia')}
          >
            🇦🇸 Asien
          </button>
        </div>
      </div>

      {/* Region Overview Grid */}
      <div className="analytics-grid-2x4">
        <div className="metric-card">
          <div className="metric-icon">🌍</div>
          <div className="metric-label">Aktive Regionen</div>
          <div className="metric-value">{regionData?.totalRegions || 0}</div>
          <div className="trend-indicator positive">↗️ +2 dieses Jahr</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇩🇪</div>
          <div className="metric-label">Top Region</div>
          <div className="metric-value-small">{regionData?.topRegion || 'N/A'}</div>
          <div className="trend-indicator">🏆 Führend</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-label">Aktive Länder</div>
          <div className="metric-value">{regionData?.activeCountries || 0}</div>
          <div className="trend-indicator positive">↗️ +5 vs. Vorjahr</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-label">Regionale Conversion</div>
          <div className="metric-value">{regionData?.regionalConversion || 0}%</div>
          <div className="trend-indicator positive">↑ +0.4%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇪🇺</div>
          <div className="metric-label">Europa Traffic</div>
          <div className="metric-value">{regionData?.europeTraffic || 0}%</div>
          <div className="trend-indicator positive">↑ Hauptmarkt</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇺🇸</div>
          <div className="metric-label">Nordamerika</div>
          <div className="metric-value">{regionData?.northAmericaTraffic || 0}%</div>
          <div className="trend-indicator positive">↑ Wachsend</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🇦🇸</div>
          <div className="metric-label">Asien Traffic</div>
          <div className="metric-value">{regionData?.asiaTraffic || 0}%</div>
          <div className="trend-indicator warning">→ Stabil</div>
        </div>

        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {lastUpdate.toLocaleTimeString('de-DE')}
          </div>
        </div>
      </div>

      {/* Regional Traffic Distribution */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🌐 Regionale Traffic-Verteilung</h3>
          <div className="traffic-sources">
            <div className="traffic-source">
              <span className="source-name">🇪🇺 Europa</span>
              <div className="source-bar">
                <div 
                  className="source-fill direct" 
                  style={{ width: `${regionData?.europeTraffic || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">{regionData?.europeTraffic || 0}%</span>
            </div>
            
            <div className="traffic-source">
              <span className="source-name">🇺🇸 Nordamerika</span>
              <div className="source-bar">
                <div 
                  className="source-fill search" 
                  style={{ width: `${regionData?.northAmericaTraffic || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">{regionData?.northAmericaTraffic || 0}%</span>
            </div>
            
            <div className="traffic-source">
              <span className="source-name">🇦🇸 Asien</span>
              <div className="source-bar">
                <div 
                  className="source-fill social" 
                  style={{ width: `${regionData?.asiaTraffic || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">{regionData?.asiaTraffic || 0}%</span>
            </div>
            
            <div className="traffic-source">
              <span className="source-name">🌍 Andere</span>
              <div className="source-bar">
                <div 
                  className="source-fill email" 
                  style={{ width: `${regionData?.otherRegions || 0}%` }}
                ></div>
              </div>
              <span className="source-percentage">{regionData?.otherRegions || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Countries Performance */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🏆 Top Länder nach Performance</h3>
          <div className="products-list">
            {countryData.map((country, index) => (
              <div key={country.country} className="product-item">
                <span className="product-rank">#{index + 1}</span>
                <span className="product-name">{country.country}</span>
                <span className="product-sales">{formatNumber(country.visitors)} Besucher</span>
                <span className="product-sales">{country.conversion}% Conversion</span>
                <span className="product-sales">{formatCurrency(country.revenue)}</span>
                <span 
                  className="product-sales"
                  style={{ color: getTrendColor(country.trend) }}
                >
                  {getTrendIndicator(country.trend)} {Math.abs(country.trend)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Insights */}
      <div className="analysis-section">
        <div className="metric-card full-width info">
          <h3>💡 Regionale Insights</h3>
          <div className="insights-grid">
            <div className="insight-item positive">
              <span className="insight-label">Top-Performer:</span>
              <span className="insight-value">Deutschland (+12% Wachstum)</span>
            </div>
            <div className="insight-item positive">
              <span className="insight-label">Aufstrebend:</span>
              <span className="insight-value">USA (+22% Wachstum)</span>
            </div>
            <div className="insight-item warning">
              <span className="insight-label">Optimierungsbedarf:</span>
              <span className="insight-value">Italien & Spanien</span>
            </div>
            <div className="insight-item info">
              <span className="insight-label">Empfehlung:</span>
              <span className="insight-value">Asien-Markt weiter ausbauen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticRegioning;