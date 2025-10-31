// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import AIDashboard from './pages/AIDashboard';
import AIEmailGenerator from './pages/MarketingContent/ai-email-generator';

// Analytics Pages
import AnalyticRegioning from './pages/analytics/AnalyticRegioning';
import ConversionReported from './pages/analytics/ConversionReported';
import MiniAudit from './pages/analytics/MiniAudit';
import PremiumAudit from './pages/analytics/PremiumAudit';
import RealAnalytics from './pages/analytics/RealAnalytics';
import RealWebAnalytics from './pages/analytics/RealWebAnalytics';
import RunTrendAnalysis from './pages/analytics/RunTrendAnalysis';
import ShopHealthReport from './pages/analytics/ShopHealthReport';
import ShopMetrics from './pages/analytics/ShopMetrics';
import StandardAudit from './pages/analytics/StandardAudit';
import TrendAnalysis from './pages/analytics/TrendAnalysis';

// Styles
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Haupt-Dashboard als Startseite */}
          <Route path="/" element={<AIDashboard />} />
          
          {/* 🔥 ANALYTICS ROUTES */}
          {/* 🔥 ANALYTICS ROUTES */}
          <Route path="/analytics/shop-metrics" element={<ShopMetrics />} />
          <Route path="/analytics/conversion-reported" element={<ConversionReported />} />
          <Route path="/analytics/run-trend-analysis" element={<RunTrendAnalysis />} />
          <Route path="/analytics/real-analytics" element={<RealAnalytics />} />
          <Route path="/analytics/real-web-analytics" element={<RealWebAnalytics />} />
          <Route path="/analytics/analytic-regioning" element={<AnalyticRegioning />} />
          <Route path="/analytics/shop-health-report" element={<ShopHealthReport />} />
          <Route path="/analytics/premium-audit" element={<PremiumAudit />} />
          <Route path="/analytics/standard-audit" element={<StandardAudit />} />
          <Route path="/analytics/mini-audit" element={<MiniAudit />} />
          
          {/* AI Email Generator Seite */}
          <Route path="/marketing/ai-email-generator" element={<AIEmailGenerator />} />
          
          {/* Weitere Seiten können hier hinzugefügt werden */}
          {/* <Route path="/products/auto-creator" element={<AutoProductCreator />} /> */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;