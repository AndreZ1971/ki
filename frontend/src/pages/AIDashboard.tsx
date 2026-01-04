// src/pages/AIDashboard.tsx
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import { MLDashboardWidget } from "../components/ML/MLDashboardWidget";
import { FloatingChatbot } from "../components/FloatingChatbot";
import "./AIDashboard.css";
import DashboardLanguageSwitcher from "../components/DashboardLanguageSwitcher";
import { formatCurrency, formatNumber } from "../lib/i18n-utils";

const AIDashboard: React.FC = () => {
  const { t } = useTranslation("common");
  const [metrics, setMetrics] = useState({
    sales: 0,
    orders: 0,
    conversion: 0,
    customers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false); // Neuer State für sanfte Updates

  const navigate = useNavigate();

  // ECHTE DATEN VON DER API LADEN - NUR DATEN, KEIN RELOAD
  useEffect(() => {
    const fetchRealMetrics = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        let base = (import.meta.env.VITE_API_URL || "").trim();
        if (base.endsWith("/")) base = base.slice(0, -1);
        const fullUrl = base
          ? `${base}/api/analytics/metrics/dashboard`
          : `/api/analytics/metrics/dashboard`;
        if (fullUrl.includes(":3000")) {
          console.warn(
            "Warnung: API-URL enthält Port 3000. Bei HTTPS/Proxy sollte die URL ohne Port sein!"
          );
        }
        console.log("AIDashboard API-URL:", fullUrl);
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "x-woocommerce-key":
              import.meta.env.VITE_WOOCOMMERCE_CONSUMER_KEY || "",
            "x-woocommerce-secret":
              import.meta.env.VITE_WOOCOMMERCE_CONSUMER_SECRET || "",
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const realData = await response.json();

        if (realData.success && realData.data) {
          // Sanft die Metriken aktualisieren ohne Loading-Spinner
          setMetrics({
            sales: realData.data.totalSales || realData.data.sales || 0,
            orders: realData.data.totalOrders || realData.data.orders || 0,
            conversion:
              realData.data.conversionRate || realData.data.conversion || 0,
            customers:
              realData.data.totalCustomers || realData.data.customers || 0,
          });

          if (realData.data.salesData || realData.data.chartData) {
            setChartData(realData.data.salesData || realData.data.chartData);
          } else {
            setChartData([
              { day: "Mo", sales: 1200 },
              { day: "Di", sales: 1900 },
              { day: "Mi", sales: 1500 },
              { day: "Do", sales: 2100 },
              { day: "Fr", sales: 1800 },
              { day: "Sa", sales: 2400 },
              { day: "So", sales: 1700 },
            ]);
          }
        } else {
          setChartData([
            { day: "Mo", sales: 1200 },
            { day: "Di", sales: 1900 },
            { day: "Mi", sales: 1500 },
            { day: "Do", sales: 2100 },
            { day: "Fr", sales: 1800 },
            { day: "Sa", sales: 2400 },
            { day: "So", sales: 1700 },
          ]);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Shop-Daten:", err);
        // Bei Background-Updates keinen Error anzeigen
        if (isInitialLoad) {
          setError("Konnte Shop-Daten nicht laden. Bitte API überprüfen.");
        }
        setChartData([
          { day: "Mo", sales: 1200 },
          { day: "Di", sales: 1900 },
          { day: "Mi", sales: 1500 },
          { day: "Do", sales: 2100 },
          { day: "Fr", sales: 1800 },
          { day: "Sa", sales: 2400 },
          { day: "So", sales: 1700 },
        ]);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          // Refresh-Indikator nach kurzer Zeit ausblenden
          setTimeout(() => setIsRefreshing(false), 500);
        }
      }
    };

    // Erstes Laden mit Loading-Spinner
    fetchRealMetrics(true);

    // Danach nur noch Daten-Updates im Hintergrund (keine Spinner)
    const interval = setInterval(() => fetchRealMetrics(false), 30000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 NEUE FUNKTION: Navigation zu Seiten
  const navigateToPage = (pageUrl: string) => {
    navigate(pageUrl);
  };

  // FUNKTION ZUM STARTEN VON JOBS MIT KORREKTEN ENDPOINTS
  const startAITool = async (
    toolId: string,
    endpoint: string,
    pageUrl?: string
  ) => {
    // 🔥 NEU: Wenn pageUrl existiert, navigiere zur Seite
    if (pageUrl) {
      navigateToPage(pageUrl);
      return;
    }

    // Alte Logik für API-Aufrufe beibehalten
    try {
      setActiveTool(toolId);

      if (!import.meta.env.VITE_API_URL) {
        throw new Error("VITE_API_URL is not set!");
      }
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: "POST",
        headers: {
          "x-woocommerce-key":
            import.meta.env.VITE_WOOCOMMERCE_CONSUMER_KEY || "",
          "x-woocommerce-secret":
            import.meta.env.VITE_WOOCOMMERCE_CONSUMER_SECRET || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          tool: toolId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Job failed: ${response.status}`);
      }

      const result = await response.json();
      alert(
        `✅ ${toolId} gestartet! ${result.message || "Job erfolgreich ausgeführt"}`
      );
    } catch (err) {
      console.error(`Fehler bei ${toolId}:`, err);
      alert(
        `❌ ${toolId} fehlgeschlagen: ${err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten"}`
      );
    } finally {
      setActiveTool(null);
    }
  };

  // 🔥 ALLE TOOLS MIT SEITEN-VERLINKUNGEN FÜR ANALYTICS
  const toolCategories = [
    {
      id: "analytics",
      name: t("dashboard.categories.analytics"),
      color: "#3b82f6",
      tools: [
        {
          id: "shop-metrics",
          title: t("dashboard.tools.shopMetrics.title"),
          description: t("dashboard.tools.shopMetrics.description"),
          endpoint: "analytics/metrics/dashboard",
          icon: "📊",
          pageUrl: "/analytics/shop-metrics",
        },
        {
          id: "conversion-analysis",
          title: t("dashboard.tools.conversionAnalysis.title"),
          description: t("dashboard.tools.conversionAnalysis.description"),
          endpoint: "analytics/conversion/analyze",
          icon: "📈",
          pageUrl: "/analytics/conversion-analysis",
        },
        {
          id: "feedback-analysis",
          title: t("dashboard.tools.feedbackAnalysis.title"),
          description: t("dashboard.tools.feedbackAnalysis.description"),
          endpoint: "analytics/feedback/analyze",
          icon: "💬",
          pageUrl: "/analytics/feedback-analysis",
        },
        {
          id: "conversion-reported",
          title: t("dashboard.tools.conversionReported.title"),
          description: t("dashboard.tools.conversionReported.description"),
          endpoint: "analytics/conversion/report",
          icon: "📋",
          pageUrl: "/analytics/conversion-reported",
        },
        {
          id: "trend-analysis",
          title: t("dashboard.tools.trendAnalysis.title"),
          description: t("dashboard.tools.trendAnalysis.description"),
          endpoint: "analytics/trends/analyze",
          icon: "📊",
          pageUrl: "/analytics/trend-analysis",
        },
        {
          id: "run-trend-analysis",
          title: t("dashboard.tools.runTrendAnalysis.title"),
          description: t("dashboard.tools.runTrendAnalysis.description"),
          endpoint: "analytics/trends/run",
          icon: "🚀",
          pageUrl: "/analytics/run-trend-analysis",
        },
        {
          id: "real-analytics",
          title: t("dashboard.tools.realAnalytics.title"),
          description: t("dashboard.tools.realAnalytics.description"),
          endpoint: "analytics/real-time",
          icon: "🔍",
          pageUrl: "/analytics/real-analytics",
        },
        {
          id: "real-web-analytics",
          title: t("dashboard.tools.realWebAnalytics.title"),
          description: t("dashboard.tools.realWebAnalytics.description"),
          endpoint: "analytics/web",
          icon: "🌐",
          pageUrl: "/analytics/real-web-analytics",
        },
        {
          id: "analytic-regioning",
          title: t("dashboard.tools.analyticRegioning.title"),
          description: t("dashboard.tools.analyticRegioning.description"),
          endpoint: "analytics/regions",
          icon: "🗺️",
          pageUrl: "/analytics/analytic-regioning",
        },
        {
          id: "shop-health-report",
          title: t("dashboard.tools.shopHealthReport.title"),
          description: t("dashboard.tools.shopHealthReport.description"),
          endpoint: "analytics/health",
          icon: "🏪",
          pageUrl: "/analytics/shop-health-report",
        },
        {
          id: "premium-audit",
          title: t("dashboard.tools.premiumAudit.title"),
          description: t("dashboard.tools.premiumAudit.description"),
          endpoint: "analytics/audit/premium",
          icon: "⭐",
          pageUrl: "/analytics/premium-audit",
        },
        {
          id: "standard-audit",
          title: t("dashboard.tools.standardAudit.title"),
          description: t("dashboard.tools.standardAudit.description"),
          endpoint: "analytics/audit/standard",
          icon: "🔧",
          pageUrl: "/analytics/standard-audit",
        },
        {
          id: "mini-audit",
          title: t("dashboard.tools.miniAudit.title"),
          description: t("dashboard.tools.miniAudit.description"),
          endpoint: "analytics/audit/mini",
          icon: "🔎",
          pageUrl: "/analytics/mini-audit",
        },
      ],
    },
    {
      id: "products",
      name: t("dashboard.categories.products"),
      color: "#10b981",
      tools: [
        {
          id: "auto-product-creator",
          title: t("dashboard.tools.autoProductCreator.title"),
          description: t("dashboard.tools.autoProductCreator.description"),
          endpoint: "products/creator/auto",
          icon: "🤖",
          pageUrl: "/products/auto-creator",
        },
        {
          id: "run-auto-product-creator",
          title: t("dashboard.tools.runAutoProductCreator.title"),
          description: t("dashboard.tools.runAutoProductCreator.description"),
          endpoint: "products/creator/run",
          icon: "🚀",
          pageUrl: "/products/run-auto-creator",
        },
        {
          id: "woo-product-create",
          title: t("dashboard.tools.wooProductCreate.title"),
          description: t("dashboard.tools.wooProductCreate.description"),
          endpoint: "woocommerce/products/create",
          icon: "🛒",
          pageUrl: "/products/woo-create",
        },
        {
          id: "woo-product-update",
          title: t("dashboard.tools.wooProductUpdate.title"),
          description: t("dashboard.tools.wooProductUpdate.description"),
          endpoint: "woocommerce/products/update",
          icon: "✏️",
          pageUrl: "/products/woo-update",
        },
        {
          id: "product-analysis",
          title: t("dashboard.tools.productAnalysis.title"),
          description: t("dashboard.tools.productAnalysis.description"),
          endpoint: "products/analyzer",
          icon: "🔍",
          pageUrl: "/products/analyzer",
        },
        {
          id: "categories-manager",
          title: t("dashboard.tools.categoriesManager.title"),
          description: t("dashboard.tools.categoriesManager.description"),
          endpoint: "woocommerce/categories",
          icon: "📑",
          pageUrl: "/products/categories-manager",
        },
        {
          id: "create-freebies",
          title: t("dashboard.tools.createFreebies.title"),
          description: t("dashboard.tools.createFreebies.description"),
          endpoint: "products/freebies/create",
          icon: "🎁",
          pageUrl: "/products/create-freebies",
        },
        {
          id: "run-create-freebies",
          title: t("dashboard.tools.runCreateFreebies.title"),
          description: t("dashboard.tools.runCreateFreebies.description"),
          endpoint: "products/freebies/run",
          icon: "🚀",
          pageUrl: "/products/run-create-freebies",
        },
        {
          id: "product-bundles",
          title: t("dashboard.tools.productBundles.title"),
          description: t("dashboard.tools.productBundles.description"),
          endpoint: "products/bundles",
          icon: "📦",
          pageUrl: "/products/bundles",
        },
      ],
    },
    {
      id: "payments",
      name: t("dashboard.categories.payments"),
      color: "#f59e0b",
      tools: [
        {
          id: "payment-fast",
          title: t("dashboard.tools.paymentFast.title"),
          description: t("dashboard.tools.paymentFast.description"),
          endpoint: "payments/process",
          icon: "⚡",
          pageUrl: "/payments/fast",
        },
        {
          id: "payment-simplified",
          title: t("dashboard.tools.paymentSimplified.title"),
          description: t("dashboard.tools.paymentSimplified.description"),
          endpoint: "payments/simplify",
          icon: "🎯",
          pageUrl: "/payments/simplified",
        },
        {
          id: "payment-tester",
          title: t("dashboard.tools.paymentTester.title"),
          description: t("dashboard.tools.paymentTester.description"),
          endpoint: "payments/test",
          icon: "🧪",
          pageUrl: "/payments/tester",
        },
        {
          id: "payment-verifier",
          title: t("dashboard.tools.paymentVerifier.title"),
          description: t("dashboard.tools.paymentVerifier.description"),
          endpoint: "payments/verify",
          icon: "✅",
          pageUrl: "/payments/verifier",
        },
        {
          id: "payment-success",
          title: t("dashboard.tools.paymentSuccess.title"),
          description: t("dashboard.tools.paymentSuccess.description"),
          endpoint: "payments/success",
          icon: "🎉",
          pageUrl: "/payments/success",
        },
        {
          id: "payment-validation",
          title: t("dashboard.tools.paymentValidation.title"),
          description: t("dashboard.tools.paymentValidation.description"),
          endpoint: "payments/validate",
          icon: "🔐",
          pageUrl: "/payments/validation",
        },
        {
          id: "payment-issued-detector",
          title: t("dashboard.tools.paymentIssuedDetector.title"),
          description: t("dashboard.tools.paymentIssuedDetector.description"),
          endpoint: "payments/issues",
          icon: "📋",
          pageUrl: "/payments/issued-detector",
        },
        {
          id: "payment-user-favor",
          title: t("dashboard.tools.paymentUserFavor.title"),
          description: t("dashboard.tools.paymentUserFavor.description"),
          endpoint: "payments/experience",
          icon: "❤️",
          pageUrl: "/payments/user-favor",
        },
        {
          id: "payment-delisoger",
          title: t("dashboard.tools.paymentDelisoger.title"),
          description: t("dashboard.tools.paymentDelisoger.description"),
          endpoint: "payments/delivery",
          icon: "📦",
          pageUrl: "/payments/delivery",
        },
        {
          id: "payment-energency",
          title: t("dashboard.tools.paymentEnergency.title"),
          description: t("dashboard.tools.paymentEnergency.description"),
          endpoint: "payments/emergency",
          icon: "🚨",
          pageUrl: "/payments/emergency",
        },
        {
          id: "payment-frompansion",
          title: t("dashboard.tools.paymentFrompansion.title"),
          description: t("dashboard.tools.paymentFrompansion.description"),
          endpoint: "payments/expand",
          icon: "📈",
          pageUrl: "/payments/expansion",
        },
        {
          id: "payment-quickcheck",
          title: t("dashboard.tools.paymentQuickcheck.title"),
          description: t("dashboard.tools.paymentQuickcheck.description"),
          endpoint: "payments/quickcheck",
          icon: "⚡",
          pageUrl: "/payments/quick-check",
        },
      ],
    },
    {
      id: "marketing",
      name: t("dashboard.categories.marketing"),
      color: "#ec4899",
      tools: [
        {
          id: "ai-email-generator",
          title: t("dashboard.tools.aiEmailGenerator.title"),
          description: t("dashboard.tools.aiEmailGenerator.description"),
          endpoint: "ai/email/email-draft",
          icon: "📧",
          pageUrl: "/marketing/ai-email-generator",
        },
        {
          id: "german-content-generator",
          title: t("dashboard.tools.germanContentGenerator.title"),
          description: t("dashboard.tools.germanContentGenerator.description"),
          endpoint: "marketing/content/german",
          icon: "📝",
          pageUrl: "/marketing/german-content",
        },
        {
          id: "email-marketing-automation",
          title: t("dashboard.tools.emailMarketingAutomation.title"),
          description: t("dashboard.tools.emailMarketingAutomation.description"),
          endpoint: "marketing/email/automate",
          icon: "✉️",
          pageUrl: "/marketing/email-automation",
        },
        {
          id: "social-media-audio",
          title: t("dashboard.tools.socialMediaAudio.title"),
          description: t("dashboard.tools.socialMediaAudio.description"),
          endpoint: "marketing/social/audio",
          icon: "🎵",
          pageUrl: "/marketing/social-audio",
        },
        {
          id: "social-media-poster",
          title: t("dashboard.tools.socialMediaPoster.title"),
          description: t("dashboard.tools.socialMediaPoster.description"),
          endpoint: "marketing/social/poster",
          icon: "📱",
          pageUrl: "/marketing/social-poster",
        },
        {
          id: "free-to-post-converter",
          title: t("dashboard.tools.freeToPostConverter.title"),
          description: t("dashboard.tools.freeToPostConverter.description"),
          endpoint: "marketing/conversion/free-to-paid",
          icon: "🆓",
          pageUrl: "/marketing/free-to-post",
        },
        {
          id: "content-monetized",
          title: t("dashboard.tools.contentMonetized.title"),
          description: t("dashboard.tools.contentMonetized.description"),
          endpoint: "marketing/content/monetize",
          icon: "💸",
          pageUrl: "/marketing/content-monetized",
        },
        {
          id: "kite-templates",
          title: t("dashboard.tools.kiteTemplates.title"),
          description: t("dashboard.tools.kiteTemplates.description"),
          endpoint: "marketing/templates",
          icon: "🎨",
          pageUrl: "/marketing/kite-templates",
        },
        {
          id: "blogpost-generator",
          title: t("dashboard.tools.blogpostGenerator.title"),
          description: t("dashboard.tools.blogpostGenerator.description"),
          endpoint: "marketing/blogpost/generate",
          icon: "📝",
          pageUrl: "/marketing/BlogPostGenerator",
        },
        {
          id: "image-analyzer",
          title: t("dashboard.tools.imageAnalyzer.title"),
          description: t("dashboard.tools.imageAnalyzer.description"),
          endpoint: "marketing/image/analyze",
          icon: "🖼️",
          pageUrl: "/marketing/image-analyzer",
        },
      ],
    },
    {
      id: "advanced",
      name: t("dashboard.categories.advanced"),
      color: "#8b5cf6",
      tools: [
        {
          id: "context-generator",
          title: t("dashboard.tools.contextGenerator.title"),
          description: t("dashboard.tools.contextGenerator.description"),
          endpoint: "ai/context/generate",
          icon: "🧠",
          pageUrl: "/advanced/context-generator",
        },
        {
          id: "string-generator",
          title: t("dashboard.tools.stringGenerator.title"),
          description: t("dashboard.tools.stringGenerator.description"),
          endpoint: "ai/string/generate",
          icon: "🔤",
          pageUrl: "/advanced/string-generator",
        },
        {
          id: "auto-framplementator",
          title: t("dashboard.tools.autoFramplementator.title"),
          description: t("dashboard.tools.autoFramplementator.description"),
          endpoint: "ai/framework/implement",
          icon: "🔄",
          pageUrl: "/advanced/auto-framplementator",
        },
        {
          id: "woocommerce-sync",
          title: t("dashboard.tools.woocommerceSync.title"),
          description: t("dashboard.tools.woocommerceSync.description"),
          endpoint: "woocommerce/sync",
          icon: "🔄",
          pageUrl: "/advanced/woocommerce-sync",
        },
        {
          id: "memory-system",
          title: t("dashboard.tools.memorySystem.title"),
          description: t("dashboard.tools.memorySystem.description"),
          endpoint: "ai/memory",
          icon: "💾",
          pageUrl: "/advanced/memory-system",
        },
        {
          id: "system-health",
          title: t("dashboard.tools.systemHealth.title"),
          description: t("dashboard.tools.systemHealth.description"),
          endpoint: "system/health",
          icon: "⚙️",
          pageUrl: "/advanced/system-health",
        },
        {
          id: "user-management",
          title: t("dashboard.tools.userManagement.title"),
          description: t("dashboard.tools.userManagement.description"),
          endpoint: "users",
          icon: "👤",
          pageUrl: "/users",
        },
      ],
    },
  ];

  // ALLE TOOLS FÜR "ALLE" KATEGORIE
  const allTools = toolCategories.flatMap((category) => category.tools);

  const filteredTools =
    activeCategory === "all"
      ? allTools
      : toolCategories.find((cat) => cat.id === activeCategory)?.tools || [];

  // LOADING COMPONENT
  if (loading) {
    return (
      <div className="dashboard light-theme">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            color: "white",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: "50px",
              height: "50px",
              border: "3px solid rgba(255,255,255,0.3)",
              borderTop: "3px solid #3b82f6",
              borderRadius: "50%",
              marginBottom: "20px",
            }}
          />
          <h3>{t("loading.title")}</h3>
          <p style={{ opacity: 0.7 }}>{t("loading.subtitle")}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="dashboard light-theme">
      <motion.header
        className="App-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div>
            <h1>{t("header.title")}</h1>
            <p>{t("header.subtitle")}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {error && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "5px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {t("error.apiLabel")}
              </motion.span>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/settings")}
              className="theme-toggle"
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {t("header.settings")}
            </motion.button>
            <DashboardLanguageSwitcher />
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
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              padding: "15px",
              margin: "20px 0",
              color: "#ef4444",
            }}
          >
            <strong>{t("error.apiLabel")} </strong>
            {error}
            <br />
            <small>
              {t("error.apiDetails", {
                url: import.meta.env.VITE_API_URL || "VITE_API_URL",
              })}
            </small>
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
        <motion.div
          className="glass-card metric-card metric-glow"
          animate={{ scale: isRefreshing ? 1.02 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#10b981", margin: 0 }}>
              {t("metrics.sales.title")}
            </h3>
            <span
              className="live-pulse"
              style={{ color: "#ef4444", fontSize: "12px" }}
            >
              {t("metrics.sales.live")}
            </span>
          </div>
          <motion.p
            className="metric-value"
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#10b981",
              margin: "10px 0",
            }}
            key={metrics.sales}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(metrics.sales || 0)}
          </motion.p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            {metrics.sales > 0
              ? t("metrics.sales.hasData")
              : t("metrics.sales.noData")}
          </p>
        </motion.div>

        <motion.div
          className="glass-card metric-card metric-glow"
          animate={{ scale: isRefreshing ? 1.02 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#3b82f6", margin: 0 }}>
              {t("metrics.orders.title")}
            </h3>
            <span
              className="live-pulse"
              style={{ color: "#ef4444", fontSize: "12px" }}
            >
              {t("metrics.orders.live")}
            </span>
          </div>
          <motion.p
            className="metric-value"
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#3b82f6",
              margin: "10px 0",
            }}
            key={metrics.orders}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatNumber(metrics.orders)}
          </motion.p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            {metrics.orders > 0
              ? t("metrics.orders.hasData")
              : t("metrics.orders.noData")}
          </p>
        </motion.div>

        <motion.div
          className="glass-card metric-card metric-glow"
          animate={{ scale: isRefreshing ? 1.02 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#8b5cf6", margin: 0 }}>
              {t("metrics.conversion.title")}
            </h3>
            <span
              className="live-pulse"
              style={{ color: "#ef4444", fontSize: "12px" }}
            >
              {t("metrics.conversion.live")}
            </span>
          </div>
          <motion.p
            className="metric-value"
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#8b5cf6",
              margin: "10px 0",
            }}
            key={metrics.conversion}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatNumber(metrics.conversion, { maximumFractionDigits: 2 })}%
          </motion.p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            {metrics.conversion > 0
              ? t("metrics.conversion.hasData")
              : t("metrics.conversion.noData")}
          </p>
        </motion.div>

        <motion.div
          className="glass-card metric-card metric-glow"
          animate={{ scale: isRefreshing ? 1.02 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#f59e0b", margin: 0 }}>
              {t("metrics.customers.title")}
            </h3>
            <span
              className="live-pulse"
              style={{ color: "#ef4444", fontSize: "12px" }}
            >
              {t("metrics.customers.live")}
            </span>
          </div>
          <motion.p
            className="metric-value"
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#f59e0b",
              margin: "10px 0",
            }}
            key={metrics.customers}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatNumber(metrics.customers)}
          </motion.p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            {metrics.customers > 0
              ? t("metrics.customers.hasData")
              : t("metrics.customers.noData")}
          </p>
        </motion.div>
      </motion.div>

      {/* ML WIDGET */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <MLDashboardWidget />
      </motion.div>

      {/* INTERACTIVE CHART */}
      <motion.div className="glass-card">
        <h2 style={{ color: "white", marginBottom: "20px" }}>
          {t("chart.salesTitle")}{" "}
          {chartData.some((item) => item.sales > 0) ? "" : t("chart.demo")}
        </h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.8)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#8884d8"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* TOOLS KATEGORIE FILTER */}
      <motion.div className="glass-card" style={{ marginTop: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "white", margin: 0 }}>
            🤖 AI Tools & Automations
          </h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory("all")}
              style={{
                padding: "8px 16px",
                background:
                  activeCategory === "all"
                    ? "#3b82f6"
                    : "rgba(255,255,255,0.1)",
                color: "white",
                border: "none",
                borderRadius: "20px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              🔥 {t("dashboard.categories.all")} ({allTools.length})
            </motion.button>
            {toolCategories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  padding: "8px 16px",
                  background:
                    activeCategory === category.id
                      ? category.color
                      : "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {category.name} ({category.tools.length})
              </motion.button>
            ))}
          </div>
        </div>

        {/* TOOLS GRID */}
        <div
          className="ai-tools-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            padding: "10px",
          }}
        >
          {filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              className="ai-tool-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.03 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                cursor: "pointer",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: activeTool === tool.id ? 0.7 : 1,
              }}
              onClick={() => startAITool(tool.id, tool.endpoint, tool.pageUrl)}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{tool.icon}</span>
                  <h3
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    {tool.title}
                    {activeTool === tool.id && " 🔄"}
                  </h3>
                </div>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    marginBottom: "20px",
                  }}
                >
                  {tool.description}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={activeTool === tool.id}
                style={{
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: activeTool === tool.id ? "not-allowed" : "pointer",
                  opacity: activeTool === tool.id ? 0.6 : 1,
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  width: "100%",
                }}
              >
                {activeTool === tool.id
                  ? t("tools.running")
                  : tool.pageUrl
                    ? t("tools.openPage")
                    : t("tools.startTool")}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <FloatingChatbot
        userRole="admin"
        botName="Ari"
        greetings={[t("chatbot.greeting")]}
      />
    </div>
  );
};

export default AIDashboard;
