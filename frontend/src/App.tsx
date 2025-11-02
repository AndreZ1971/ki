// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import AIDashboard from './pages/AIDashboard';
import AIEmailGenerator from './pages/MarketingContent/ai-email-generator';
import Settings from './pages/Settings/Settings';
import MLSettings from './pages/Settings/MLSettings';
import MLDashboard from './pages/ML/MLDashboard';

// Product Management Pages
import AutoProductCreator from './pages/ProductManagement/AutoProductCreator';
import CategoriesManager from './pages/ProductManagement/CategoriesManager';
import CreateFreebies from './pages/ProductManagement/CreateFreebies';
import ProductBundles from './pages/ProductManagement/ProductBundles';
import RunAutoProductCreator from './pages/ProductManagement/RunAutoProductCreator';
import RunCreateFreebies from './pages/ProductManagement/RunCreateFreebies';
import WooProductCreate from './pages/ProductManagement/WooProductCreate';
import WooProductUpdate from './pages/ProductManagement/WooProductUpdate';

// Analytics Pages
import AnalyticRegioning from './pages/AnalyseMetrics/AnalyticRegioning';
import ConversionAnalysis from './pages/AnalyseMetrics/ConversionAnalysis';
import ConversionReported from './pages/AnalyseMetrics/ConversionReported';
import MiniAudit from './pages/AnalyseMetrics/MiniAudit';
import PremiumAudit from './pages/AnalyseMetrics/PremiumAudit';
import RealAnalytics from './pages/AnalyseMetrics/RealAnalytics';
import RealWebAnalytics from './pages/AnalyseMetrics/RealWebAnalytics';
import RunTrendAnalysis from './pages/AnalyseMetrics/RunTrendAnalysis';
import ShopHealthReport from './pages/AnalyseMetrics/ShopHealthReport';
import ShopMetrics from './pages/AnalyseMetrics/ShopMetrics';
import StandardAudit from './pages/AnalyseMetrics/StandardAudit';
import TrendAnalysis from './pages/AnalyseMetrics/TrendAnalysis';

// Styles
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Haupt-Dashboard als Startseite */}
          <Route path="/" element={<AIDashboard />} />
          
          {/* Analytics Routes */}
          <Route path="/analytics/analytic-regioning" element={<AnalyticRegioning />} />
          <Route path="/analytics/conversion-analysis" element={<ConversionAnalysis />} />
          <Route path="/analytics/conversion-reported" element={<ConversionReported />} />
          <Route path="/analytics/mini-audit" element={<MiniAudit />} />
          <Route path="/analytics/premium-audit" element={<PremiumAudit />} />
          <Route path="/analytics/real-analytics" element={<RealAnalytics />} />
          <Route path="/analytics/real-web-analytics" element={<RealWebAnalytics />} />
          <Route path="/analytics/run-trend-analysis" element={<RunTrendAnalysis />} />
          <Route path="/analytics/shop-health-report" element={<ShopHealthReport />} />
          <Route path="/analytics/shop-metrics" element={<ShopMetrics />} />
          <Route path="/analytics/standard-audit" element={<StandardAudit />} />
          <Route path="/analytics/trend-analysis" element={<TrendAnalysis />} />
          
          {/* AI Email Generator Seite */}
          <Route path="/marketing/ai-email-generator" element={<AIEmailGenerator />} />
          
          {/* Product Management Routes */}
          <Route path="/products/auto-creator" element={<AutoProductCreator />} />
          <Route path="/products/categories-manager" element={<CategoriesManager />} />
          <Route path="/products/create-freebies" element={<CreateFreebies />} />
          <Route path="/products/bundles" element={<ProductBundles />} />
          <Route path="/products/run-auto-creator" element={<RunAutoProductCreator />} />
          <Route path="/products/run-create-freebies" element={<RunCreateFreebies />} />
          <Route path="/products/woo-create" element={<WooProductCreate />} />
          <Route path="/products/woo-update" element={<WooProductUpdate />} />
          
          {/* ML Routes */}
          <Route path="/ml/dashboard" element={<MLDashboard />} />
          
          {/* Settings Seiten */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/ml" element={<MLSettings />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;