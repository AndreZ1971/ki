import UserManagement from "./pages/app/UserManagement";
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Onboarding from "./pages/Onboarding/Onboarding";

// Pages
import AIDashboard from "./pages/AIDashboard";
import AIEmailGenerator from "./pages/MarketingContent/ai-email-generator";
import Settings from "./pages/Settings/Settings";
import MLSettings from "./pages/Settings/MLSettings";
import MLDashboard from "./pages/ML/MLDashboard";

// Product Management Pages
import AutoProductCreator from "./pages/ProductManagement/AutoProductCreator";
import CategoriesManager from "./pages/ProductManagement/CategoriesManager";
import CreateFreebies from "./pages/ProductManagement/CreateFreebies";
import ProductBundles from "./pages/ProductManagement/ProductBundles";
import ProductAnalyzer from "./pages/ProductManagement/ProductAnalyzer";
import RunAutoProductCreator from "./pages/ProductManagement/RunAutoProductCreator";
import RunCreateFreebies from "./pages/ProductManagement/RunCreateFreebies";
import WooProductCreate from "./pages/ProductManagement/WooProductCreate";
import WooProductUpdate from "./pages/ProductManagement/WooProductUpdate";

// Analytics Pages
import AnalyticRegioning from "./pages/AnalyseMetrics/AnalyticRegioning";
import ConversionAnalysis from "./pages/AnalyseMetrics/ConversionAnalysis";
import ConversionReported from "./pages/AnalyseMetrics/ConversionReported";
import MiniAudit from "./pages/AnalyseMetrics/MiniAudit";
import PremiumAudit from "./pages/AnalyseMetrics/PremiumAudit";
import RealAnalytics from "./pages/AnalyseMetrics/RealAnalytics";
import RealWebAnalytics from "./pages/AnalyseMetrics/RealWebAnalytics";
import RunTrendAnalysis from "./pages/AnalyseMetrics/RunTrendAnalysis";
import ShopHealthReport from "./pages/AnalyseMetrics/ShopHealthReport";
import ShopMetrics from "./pages/AnalyseMetrics/ShopMetrics";
import StandardAudit from "./pages/AnalyseMetrics/StandardAudit";
import TrendAnalysis from "./pages/AnalyseMetrics/TrendAnalysis";

// Advanced Tools Pages
import AutoFramplementator from "./pages/Advanced/AutoFramplementator";
import ContextGenerator from "./pages/Advanced/ContextGenerator";
import MemorySystem from "./pages/Advanced/MemorySystem";
import StringGenerator from "./pages/Advanced/StringGenerator";
import SystemHealth from "./pages/Advanced/SystemHealth";

// Feedback Analysis Page
import FeedbackAnalysis from "./pages/app/FeedbackAnalysis";
import LoopMonitoring from "./pages/app/LoopMonitoring";
import WooCommerceSync from "./pages/Advanced/WooCommerceSync";

// Marketing Content Pages
import ContentMonetized from "./pages/MarketingContent/ContentMonetized";
import EmailMarketingAutomation from "./pages/MarketingContent/EmailMarketingAutomation";
import FreeToPostConverter from "./pages/MarketingContent/FreeToPostConverter";
import GermanContentGenerator from "./pages/MarketingContent/GermanContentGenerator";
import KiteTemplates from "./pages/MarketingContent/KiteTemplates";
import SocialMediaAudio from "./pages/MarketingContent/SocialMediaAudio";
import SocialMediaPoster from "./pages/MarketingContent/SocialMediaPoster";
import BlogPostGenerator from "./pages/marketing/BlogPostGenerator";
import ImageAnalyzer from "./pages/marketing/ImageAnalyzer";

// Payment & Finances Pages
import PaymentDelivery from "./pages/PaymentFinances/PaymentDelivery";
import PaymentEmergency from "./pages/PaymentFinances/PaymentEmergency";
import PaymentExpansion from "./pages/PaymentFinances/PaymentExpansion";
import PaymentFast from "./pages/PaymentFinances/PaymentFast";
import PaymentIssuedDetector from "./pages/PaymentFinances/PaymentIssuedDetector";
import PaymentQuickCheck from "./pages/PaymentFinances/PaymentQuickCheck";
import PaymentSimplified from "./pages/PaymentFinances/PaymentSimplified";
import PaymentSuccess from "./pages/PaymentFinances/PaymentSuccess";
import PaymentTester from "./pages/PaymentFinances/PaymentTester";
import PaymentUserFavor from "./pages/PaymentFinances/PaymentUserFavor";
import PaymentValidation from "./pages/PaymentFinances/PaymentValidation";
import PaymentVerifier from "./pages/PaymentFinances/PaymentVerifier";

// Styles

import "./App.css";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes - Login & Onboarding */}
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><AIDashboard /></ProtectedRoute>} />

            {/* Analytics Routes */}

            <Route
              path="/analytics/analytic-regioning"
              element={<ProtectedRoute><AnalyticRegioning /></ProtectedRoute>}
            />
            <Route
              path="/analytics/conversion-analysis"
              element={<ProtectedRoute><ConversionAnalysis /></ProtectedRoute>}
            />
            <Route
              path="/analytics/conversion-reported"
              element={<ProtectedRoute><ConversionReported /></ProtectedRoute>}
            />
          <Route path="/analytics/mini-audit" element={<ProtectedRoute><MiniAudit /></ProtectedRoute>} />
          <Route path="/analytics/premium-audit" element={<ProtectedRoute><PremiumAudit /></ProtectedRoute>} />
          <Route path="/analytics/real-analytics" element={<ProtectedRoute><RealAnalytics /></ProtectedRoute>} />
          <Route
            path="/analytics/real-web-analytics"
            element={<ProtectedRoute><RealWebAnalytics /></ProtectedRoute>}
          />
          <Route
            path="/analytics/run-trend-analysis"
            element={<ProtectedRoute><RunTrendAnalysis /></ProtectedRoute>}
          />
          <Route
            path="/analytics/shop-health-report"
            element={<ProtectedRoute><ShopHealthReport /></ProtectedRoute>}
          />
          <Route path="/analytics/shop-metrics" element={<ProtectedRoute><ShopMetrics /></ProtectedRoute>} />
          <Route path="/analytics/standard-audit" element={<ProtectedRoute><StandardAudit /></ProtectedRoute>} />
          <Route path="/analytics/trend-analysis" element={<ProtectedRoute><TrendAnalysis /></ProtectedRoute>} />
          {/* Feedback Analysis Route */}
          <Route
            path="/analytics/feedback-analysis"
            element={<ProtectedRoute><FeedbackAnalysis /></ProtectedRoute>}
          />

          {/* Marketing Content Routes */}
          <Route
            path="/marketing/ai-email-generator"
            element={<ProtectedRoute><AIEmailGenerator /></ProtectedRoute>}
          />
          <Route
            path="/marketing/content-monetized"
            element={<ProtectedRoute><ContentMonetized /></ProtectedRoute>}
          />
          <Route
            path="/marketing/email-automation"
            element={<ProtectedRoute><EmailMarketingAutomation /></ProtectedRoute>}
          />
          <Route
            path="/marketing/free-to-post"
            element={<ProtectedRoute><FreeToPostConverter /></ProtectedRoute>}
          />
          <Route
            path="/marketing/german-content"
            element={<ProtectedRoute><GermanContentGenerator /></ProtectedRoute>}
          />
          <Route path="/marketing/kite-templates" element={<ProtectedRoute><KiteTemplates /></ProtectedRoute>} />
          <Route
            path="/marketing/social-audio"
            element={<ProtectedRoute><SocialMediaAudio /></ProtectedRoute>}
          />
          <Route
            path="/marketing/social-poster"
            element={<ProtectedRoute><SocialMediaPoster /></ProtectedRoute>}
          />
          <Route
            path="/marketing/BlogPostGenerator"
            element={<ProtectedRoute><BlogPostGenerator /></ProtectedRoute>}
          />
          <Route path="/marketing/image-analyzer" element={<ProtectedRoute><ImageAnalyzer /></ProtectedRoute>} />

          {/* Product Management Routes */}
          <Route
            path="/products/auto-creator"
            element={<ProtectedRoute><AutoProductCreator /></ProtectedRoute>}
          />
          <Route path="/products/analyzer" element={<ProtectedRoute><ProductAnalyzer /></ProtectedRoute>} />
          <Route
            path="/products/categories-manager"
            element={<ProtectedRoute><CategoriesManager /></ProtectedRoute>}
          />
          <Route
            path="/products/create-freebies"
            element={<ProtectedRoute><CreateFreebies /></ProtectedRoute>}
          />
          <Route path="/products/bundles" element={<ProtectedRoute><ProductBundles /></ProtectedRoute>} />
          <Route
            path="/products/run-auto-creator"
            element={<ProtectedRoute><RunAutoProductCreator /></ProtectedRoute>}
          />
          <Route
            path="/products/run-create-freebies"
            element={<ProtectedRoute><RunCreateFreebies /></ProtectedRoute>}
          />
          <Route path="/products/woo-create" element={<ProtectedRoute><WooProductCreate /></ProtectedRoute>} />
          <Route path="/products/woo-update" element={<ProtectedRoute><WooProductUpdate /></ProtectedRoute>} />

          {/* ML Routes */}
          <Route path="/ml/dashboard" element={<ProtectedRoute><MLDashboard /></ProtectedRoute>} />

          {/* Advanced Tools Routes */}
          <Route
            path="/advanced/auto-framplementator"
            element={<ProtectedRoute><AutoFramplementator /></ProtectedRoute>}
          />
          <Route
            path="/advanced/context-generator"
            element={<ProtectedRoute><ContextGenerator /></ProtectedRoute>}
          />
          <Route path="/advanced/memory-system" element={<ProtectedRoute><MemorySystem /></ProtectedRoute>} />
          <Route
            path="/advanced/string-generator"
            element={<ProtectedRoute><StringGenerator /></ProtectedRoute>}
          />
          <Route path="/advanced/system-health" element={<ProtectedRoute><SystemHealth /></ProtectedRoute>} />
          <Route
            path="/advanced/woocommerce-sync"
            element={<ProtectedRoute><WooCommerceSync /></ProtectedRoute>}
          />

          {/* Payment & Finances Routes */}
          <Route path="/payments/delivery" element={<ProtectedRoute><PaymentDelivery /></ProtectedRoute>} />
          <Route path="/payments/emergency" element={<ProtectedRoute><PaymentEmergency /></ProtectedRoute>} />
          <Route path="/payments/expansion" element={<ProtectedRoute><PaymentExpansion /></ProtectedRoute>} />
          <Route path="/payments/fast" element={<ProtectedRoute><PaymentFast /></ProtectedRoute>} />
          <Route
            path="/payments/issued-detector"
            element={<ProtectedRoute><PaymentIssuedDetector /></ProtectedRoute>}
          />
          <Route path="/payments/quick-check" element={<ProtectedRoute><PaymentQuickCheck /></ProtectedRoute>} />
          <Route path="/payments/simplified" element={<ProtectedRoute><PaymentSimplified /></ProtectedRoute>} />
          <Route path="/payments/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/payments/tester" element={<ProtectedRoute><PaymentTester /></ProtectedRoute>} />
          <Route path="/payments/user-favor" element={<ProtectedRoute><PaymentUserFavor /></ProtectedRoute>} />
          <Route path="/payments/validation" element={<ProtectedRoute><PaymentValidation /></ProtectedRoute>} />
          <Route path="/payments/verifier" element={<ProtectedRoute><PaymentVerifier /></ProtectedRoute>} />

          {/* Settings Seiten */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/ml" element={<ProtectedRoute><MLSettings /></ProtectedRoute>} />

          {/* Agentic Loop Monitoring */}
          <Route path="/app/loop-monitoring" element={<ProtectedRoute><LoopMonitoring /></ProtectedRoute>} />

          {/* User Management Route */}
          <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        </Routes>
      </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
