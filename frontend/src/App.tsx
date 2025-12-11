import UserManagement from './pages/app/UserManagement';
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
import ProductAnalyzer from './pages/ProductManagement/ProductAnalyzer';
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

// Advanced Tools Pages
import AutoFramplementator from './pages/Advanced/AutoFramplementator';
import ContextGenerator from './pages/Advanced/ContextGenerator';
import MemorySystem from './pages/Advanced/MemorySystem';
import StringGenerator from './pages/Advanced/StringGenerator';
import SystemHealth from './pages/Advanced/SystemHealth';

// Feedback Analysis Page
import FeedbackAnalysis from './pages/app/FeedbackAnalysis';
import WooCommerceSync from './pages/Advanced/WooCommerceSync';

// Marketing Content Pages
import ContentMonetized from './pages/MarketingContent/ContentMonetized';
import EmailMarketingAutomation from './pages/MarketingContent/EmailMarketingAutomation';
import FreeToPostConverter from './pages/MarketingContent/FreeToPostConverter';
import GermanContentGenerator from './pages/MarketingContent/GermanContentGenerator';
import KiteTemplates from './pages/MarketingContent/KiteTemplates';
import SocialMediaAudio from './pages/MarketingContent/SocialMediaAudio';
import SocialMediaPoster from './pages/MarketingContent/SocialMediaPoster';
import BlogPostGenerator from './pages/marketing/BlogPostGenerator';
import ImageAnalyzer from './pages/marketing/ImageAnalyzer';

// Payment & Finances Pages
import PaymentDelivery from './pages/PaymentFinances/PaymentDelivery';
import PaymentEmergency from './pages/PaymentFinances/PaymentEmergency';
import PaymentExpansion from './pages/PaymentFinances/PaymentExpansion';
import PaymentFast from './pages/PaymentFinances/PaymentFast';
import PaymentIssuedDetector from './pages/PaymentFinances/PaymentIssuedDetector';
import PaymentQuickCheck from './pages/PaymentFinances/PaymentQuickCheck';
import PaymentSimplified from './pages/PaymentFinances/PaymentSimplified';
import PaymentSuccess from './pages/PaymentFinances/PaymentSuccess';
import PaymentTester from './pages/PaymentFinances/PaymentTester';
import PaymentUserFavor from './pages/PaymentFinances/PaymentUserFavor';
import PaymentValidation from './pages/PaymentFinances/PaymentValidation';
import PaymentVerifier from './pages/PaymentFinances/PaymentVerifier';

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
          {/* Feedback Analysis Route */}
          <Route path="/analytics/feedback-analysis" element={<FeedbackAnalysis />} />
          
          {/* Marketing Content Routes */}
          <Route path="/marketing/ai-email-generator" element={<AIEmailGenerator />} />
          <Route path="/marketing/content-monetized" element={<ContentMonetized />} />
          <Route path="/marketing/email-automation" element={<EmailMarketingAutomation />} />
          <Route path="/marketing/free-to-post" element={<FreeToPostConverter />} />
          <Route path="/marketing/german-content" element={<GermanContentGenerator />} />
          <Route path="/marketing/kite-templates" element={<KiteTemplates />} />
          <Route path="/marketing/social-audio" element={<SocialMediaAudio />} />
          <Route path="/marketing/social-poster" element={<SocialMediaPoster />} />
          <Route path="/marketing/BlogPostGenerator" element={<BlogPostGenerator />} />
          <Route path="/marketing/image-analyzer" element={<ImageAnalyzer />} />
          
          {/* Product Management Routes */}
          <Route path="/products/auto-creator" element={<AutoProductCreator />} />
          <Route path="/products/analyzer" element={<ProductAnalyzer />} />
          <Route path="/products/categories-manager" element={<CategoriesManager />} />
          <Route path="/products/create-freebies" element={<CreateFreebies />} />
          <Route path="/products/bundles" element={<ProductBundles />} />
          <Route path="/products/run-auto-creator" element={<RunAutoProductCreator />} />
          <Route path="/products/run-create-freebies" element={<RunCreateFreebies />} />
          <Route path="/products/woo-create" element={<WooProductCreate />} />
          <Route path="/products/woo-update" element={<WooProductUpdate />} />
          
          {/* ML Routes */}
          <Route path="/ml/dashboard" element={<MLDashboard />} />
          
          {/* Advanced Tools Routes */}
          <Route path="/advanced/auto-framplementator" element={<AutoFramplementator />} />
          <Route path="/advanced/context-generator" element={<ContextGenerator />} />
          <Route path="/advanced/memory-system" element={<MemorySystem />} />
          <Route path="/advanced/string-generator" element={<StringGenerator />} />
          <Route path="/advanced/system-health" element={<SystemHealth />} />
          <Route path="/advanced/woocommerce-sync" element={<WooCommerceSync />} />
          
          {/* Payment & Finances Routes */}
          <Route path="/payments/delivery" element={<PaymentDelivery />} />
          <Route path="/payments/emergency" element={<PaymentEmergency />} />
          <Route path="/payments/expansion" element={<PaymentExpansion />} />
          <Route path="/payments/fast" element={<PaymentFast />} />
          <Route path="/payments/issued-detector" element={<PaymentIssuedDetector />} />
          <Route path="/payments/quick-check" element={<PaymentQuickCheck />} />
          <Route path="/payments/simplified" element={<PaymentSimplified />} />
          <Route path="/payments/success" element={<PaymentSuccess />} />
          <Route path="/payments/tester" element={<PaymentTester />} />
          <Route path="/payments/user-favor" element={<PaymentUserFavor />} />
          <Route path="/payments/validation" element={<PaymentValidation />} />
          <Route path="/payments/verifier" element={<PaymentVerifier />} />
          
          {/* Settings Seiten */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/ml" element={<MLSettings />} />
          {/* User Management Route */}
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;