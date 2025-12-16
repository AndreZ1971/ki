import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../AnalyseMetrics/page.css";

interface ShopCredentials {
  // Reddit
  redditClientId: string;
  redditClientSecret: string;

  // E-Mail
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;

  // Machine Learning
  mlEnabled: boolean;
  mlProductRecommendations: boolean;
  mlTrendForecasting: boolean;
  mlDynamicPricing: boolean;
  mlEmailOptimization: boolean;
  mlChurnPrediction: boolean;
  mlSentimentAnalysis: boolean;
  mlFraudDetection: boolean;
  mlProductRecMinConfidence: number;
  mlProductRecFallback: boolean;
  mlTrendMinConfidence: number;
  mlTrendFallback: boolean;
  mlEmailMinConfidence: number;
  mlEmailFallback: boolean;
  mlEmailDefaultTime: string;
  mlMaxInferenceTime: number;
  mlCacheResults: boolean;
  mlCacheTtl: number;
  // WordPress
  wpUrl: string;
  wpUsername: string;
  wpAppPassword: string;

  // WooCommerce
  wcApiUrl: string;
  wcConsumerKey: string;
  wcConsumerSecret: string;
  wooAuthMode: "basic" | "oauth";
  wooTimeoutMs: number;

  // AI & Services
  openaiApiKey: string;
  openaiModel: string;

  // Job Configuration
  jobMode: "once" | "interval";
  jobIntervalMs: number;

  // Optional Services
  enableAnalytics: boolean;
  enableAutoProducts: boolean;
  enableEmailMarketing: boolean;

  // Social Media Accounts
  linkedinEnabled: boolean;
  linkedinAccessToken: string;
  linkedinRefreshToken: string;

  facebookEnabled: boolean;
  facebookAccessToken: string;
  facebookPageId: string;

  instagramEnabled: boolean;
  instagramAccessToken: string;
  instagramBusinessAccountId: string;

  twitterEnabled: boolean;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessTokenSecret: string;

  tiktokEnabled: boolean;
  tiktokAccessToken: string;
  tiktokRefreshToken: string;

  youtubeEnabled: boolean;
  youtubeAccessToken: string;
  youtubeRefreshToken: string;
  youtubeChannelId: string;
}

interface Specialization {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  isActive: boolean;
  image: string;
  features: string[];
}

const defaultCredentials: ShopCredentials = {
  wpUrl: "",
  wpUsername: "",
  wpAppPassword: "",
  wcApiUrl: "",
  wcConsumerKey: "",
  wcConsumerSecret: "",
  wooAuthMode: "basic",
  wooTimeoutMs: 30000,
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  jobMode: "once",
  jobIntervalMs: 900000,
  enableAnalytics: true,
  enableAutoProducts: true,
  enableEmailMarketing: true,
  redditClientId: "",
  redditClientSecret: "",
  smtpHost: "",
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: "",
  smtpPassword: "",
  smtpFrom: "",
  mlEnabled: true,
  mlProductRecommendations: true,
  mlTrendForecasting: true,
  mlDynamicPricing: false,
  mlEmailOptimization: true,
  mlChurnPrediction: false,
  mlSentimentAnalysis: false,
  mlFraudDetection: false,
  mlProductRecMinConfidence: 0.7,
  mlProductRecFallback: true,
  mlTrendMinConfidence: 0.6,
  mlTrendFallback: true,
  mlEmailMinConfidence: 0.65,
  mlEmailFallback: true,
  mlEmailDefaultTime: "09:00",
  mlMaxInferenceTime: 5000,
  mlCacheResults: true,
  mlCacheTtl: 3600,

  // Social Media Defaults
  linkedinEnabled: false,
  linkedinAccessToken: "",
  linkedinRefreshToken: "",
  facebookEnabled: false,
  facebookAccessToken: "",
  facebookPageId: "",
  instagramEnabled: false,
  instagramAccessToken: "",
  instagramBusinessAccountId: "",
  twitterEnabled: false,
  twitterApiKey: "",
  twitterApiSecret: "",
  twitterAccessToken: "",
  twitterAccessTokenSecret: "",
  tiktokEnabled: false,
  tiktokAccessToken: "",
  tiktokRefreshToken: "",
  youtubeEnabled: false,
  youtubeAccessToken: "",
  youtubeRefreshToken: "",
  youtubeChannelId: "",
};

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "connection" | "specialization" | "license" | "social" | "agentic"
  >("connection");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Shop-Verbindungsdaten
  const [credentials, setCredentials] = useState<ShopCredentials>({
    ...defaultCredentials,
  });

  // Load credentials on mount
  React.useEffect(() => {
    loadCredentials();
  }, []);

  // Import-Konfiguration (connection.json) laden
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        // Mapping von verschachtelter Struktur zu flachem ShopCredentials-Objekt
        const mapped: ShopCredentials = {
          // WordPress
          wpUrl: data.wordpress?.url || "",
          wpUsername: data.wordpress?.username || "",
          wpAppPassword: data.wordpress?.appPassword || "",
          // WooCommerce
          wcApiUrl: data.woocommerce?.url || "",
          wcConsumerKey: data.woocommerce?.consumerKey || "",
          wcConsumerSecret: data.woocommerce?.consumerSecret || "",
          wooAuthMode: data.woocommerce?.authMode || "basic",
          wooTimeoutMs: data.woocommerce?.timeoutMs || 30000,
          // AI & Services
          openaiApiKey: data.openAI?.apiKey || "",
          openaiModel: data.openAI?.model || "gpt-4o-mini",
          // Job Configuration
          jobMode: data.job?.mode || "once",
          jobIntervalMs: data.job?.intervalMs || 900000,
          // Optional Services
          enableAnalytics: data.features?.enableAnalytics ?? true,
          enableAutoProducts: data.features?.enableAutoProducts ?? true,
          enableEmailMarketing: data.features?.enableEmailMarketing ?? true,
          // Reddit
          redditClientId: data.reddit?.clientId || "",
          redditClientSecret: data.reddit?.clientSecret || "",
          // E-Mail
          smtpHost: data.smtp?.host || "",
          smtpPort: data.smtp?.port || 465,
          smtpSecure: data.smtp?.secure ?? true,
          smtpUser: data.smtp?.user || "",
          smtpPassword: data.smtp?.password || "",
          smtpFrom: data.smtp?.from || "",
          // Machine Learning
          mlEnabled: data.ml?.enabled ?? true,
          mlProductRecommendations: data.ml?.productRecommendations ?? true,
          mlTrendForecasting: data.ml?.trendForecasting ?? true,
          mlDynamicPricing: data.ml?.dynamicPricing ?? false,
          mlEmailOptimization: data.ml?.emailOptimization ?? true,
          mlChurnPrediction: data.ml?.churnPrediction ?? false,
          mlSentimentAnalysis: data.ml?.sentimentAnalysis ?? false,
          mlFraudDetection: data.ml?.fraudDetection ?? false,
          mlProductRecMinConfidence: data.ml?.productRecMinConfidence ?? 0.7,
          mlProductRecFallback: data.ml?.productRecFallback ?? true,
          mlTrendMinConfidence: data.ml?.trendMinConfidence ?? 0.6,
          mlTrendFallback: data.ml?.trendFallback ?? true,
          mlEmailMinConfidence: data.ml?.emailMinConfidence ?? 0.65,
          mlEmailFallback: data.ml?.emailFallback ?? true,
          mlEmailDefaultTime: data.ml?.emailDefaultTime || "09:00",
          mlMaxInferenceTime: data.ml?.maxInferenceTime ?? 5000,
          mlCacheResults: data.ml?.cacheResults ?? true,
          mlCacheTtl: data.ml?.cacheTtl ?? 3600,
          // Social Media
          linkedinEnabled: data.socialMedia?.linkedin?.enabled ?? false,
          linkedinAccessToken: data.socialMedia?.linkedin?.accessToken || "",
          linkedinRefreshToken: data.socialMedia?.linkedin?.refreshToken || "",
          facebookEnabled: data.socialMedia?.facebook?.enabled ?? false,
          facebookAccessToken: data.socialMedia?.facebook?.accessToken || "",
          facebookPageId: data.socialMedia?.facebook?.pageId || "",
          instagramEnabled: data.socialMedia?.instagram?.enabled ?? false,
          instagramAccessToken: data.socialMedia?.instagram?.accessToken || "",
          instagramBusinessAccountId:
            data.socialMedia?.instagram?.businessAccountId || "",
          twitterEnabled: data.socialMedia?.twitter?.enabled ?? false,
          twitterApiKey: data.socialMedia?.twitter?.apiKey || "",
          twitterApiSecret: data.socialMedia?.twitter?.apiSecret || "",
          twitterAccessToken: data.socialMedia?.twitter?.accessToken || "",
          twitterAccessTokenSecret:
            data.socialMedia?.twitter?.accessTokenSecret || "",
          tiktokEnabled: data.socialMedia?.tiktok?.enabled ?? false,
          tiktokAccessToken: data.socialMedia?.tiktok?.accessToken || "",
          tiktokRefreshToken: data.socialMedia?.tiktok?.refreshToken || "",
          youtubeEnabled: data.socialMedia?.youtube?.enabled ?? false,
          youtubeAccessToken: data.socialMedia?.youtube?.accessToken || "",
          youtubeRefreshToken: data.socialMedia?.youtube?.refreshToken || "",
          youtubeChannelId: data.socialMedia?.youtube?.channelId || "",
        };
        setCredentials({ ...defaultCredentials, ...mapped });
        setConnectionMessage(
          "✅ Konfiguration geladen. Jetzt speichern, um sie zu übernehmen."
        );
      } catch (_err) {
        setConnectionMessage(
          "❌ Fehler beim Laden der Datei. Bitte gültige connection.json wählen."
        );
      }
    };
    reader.readAsText(file);
  };

  // Lizenz-Daten
  const [licenseKey, setLicenseKey] = useState("");
  const [activatingLicense, setActivatingLicense] = useState(false);

  // Verfügbare Spezialisierungen
  const [specializations] = useState<Specialization[]>([
    {
      id: "dsgvo-digital",
      name: "DSGVO Digitale Produkte",
      description:
        "Spezialisiert auf datenschutzkonforme digitale Inhalte für EU-Markt",
      price: 99,
      icon: "🔒",
      isActive: true,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%233b82f6"/%3E%3Cstop offset="100%25" stop-color="%2310b981"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g1)"/%3E%3Ccircle cx="120" cy="110" r="80" fill="rgba(255,255,255,0.16)"/%3E%3Ccircle cx="420" cy="260" r="120" fill="rgba(255,255,255,0.12)"/%3E%3C/svg%3E',
      features: [
        "DSGVO-konforme Produkttexte",
        "EU-rechtskonforme Beschreibungen",
        "Cookie-Consent Templates",
        "Impressum & AGB Generator",
        "Datenschutz-Optimierung",
      ],
    },
    {
      id: "reisebuero",
      name: "Reisebüro",
      description: "Optimiert für Reise- und Tourismusbranche",
      price: 149,
      icon: "✈️",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g2" x1="0%25" y1="0%25" x2="100%25" y2="0%25"%3E%3Cstop offset="0%25" stop-color="%238b5cf6"/%3E%3Cstop offset="100%25" stop-color="%233b82f6"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g2)"/%3E%3Cpath d="M0 280 Q150 200 300 280 T600 280 V400 H0 Z" fill="rgba(255,255,255,0.12)"/%3E%3C/svg%3E',
      features: [
        "Reisebeschreibungen",
        "Hotel & Unterkunft Marketing",
        "Destination Content",
        "Buchungsoptimierung",
        "Review-Management",
      ],
    },
    {
      id: "3d-druck",
      name: "3D-Druck Objekte",
      description: "Spezialisiert auf 3D-Druck E-Commerce",
      price: 129,
      icon: "🖨️",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g3" x1="0%25" y1="100%25" x2="100%25" y2="0%25"%3E%3Cstop offset="0%25" stop-color="%23256f9c"/%3E%3Cstop offset="100%25" stop-color="%233b82f6"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g3)"/%3E%3Crect x="80" y="60" width="140" height="220" rx="24" fill="rgba(255,255,255,0.14)"/%3E%3Crect x="260" y="120" width="240" height="160" rx="30" fill="rgba(255,255,255,0.12)"/%3E%3C/svg%3E',
      features: [
        "Technische Spezifikationen",
        "Material-Beschreibungen",
        "STL-File Handling",
        "Custom-Order Workflows",
        "Drucker-Kompatibilität",
      ],
    },
    {
      id: "fashion",
      name: "Fashion & Bekleidung",
      description: "Mode und Bekleidungshandel",
      price: 119,
      icon: "👗",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g4" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23ec4899"/%3E%3Cstop offset="100%25" stop-color="%238b5cf6"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g4)"/%3E%3Ccircle cx="180" cy="160" r="90" fill="rgba(255,255,255,0.13)"/%3E%3Ccircle cx="400" cy="260" r="130" fill="rgba(255,255,255,0.1)"/%3E%3C/svg%3E',
      features: [
        "Produkt-Styling Texte",
        "Größentabellen",
        "Material & Pflege",
        "Trend-Analysen",
        "Lookbook-Content",
      ],
    },
    {
      id: "beauty",
      name: "Beauty & Kosmetik",
      description: "Pflege, Make-up und Wellness-Produkte",
      price: 109,
      icon: "💄",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g5" x1="100%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23f59e0b"/%3E%3Cstop offset="100%25" stop-color="%23ef4444"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g5)"/%3E%3Cpath d="M0 220 Q140 140 280 210 T600 230 V400 H0 Z" fill="rgba(255,255,255,0.12)"/%3E%3C/svg%3E',
      features: [
        "INCI-konforme Beschreibungen",
        "Hauttyp-Empfehlungen",
        "Routine-Vorschläge",
        "Social Media Hooks",
        "Gift Guide Texte",
      ],
    },
    {
      id: "sport-fitness",
      name: "Sport & Fitness",
      description: "Equipment, Wearables und Supplements",
      price: 119,
      icon: "🏋️",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g6" x1="0%25" y1="50%25" x2="100%25" y2="50%25"%3E%3Cstop offset="0%25" stop-color="%2322c55e"/%3E%3Cstop offset="100%25" stop-color="%2310b981"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g6)"/%3E%3Crect x="60" y="90" width="480" height="220" rx="48" fill="rgba(255,255,255,0.1)"/%3E%3C/svg%3E',
      features: [
        "Workout-Beschreibungen",
        "Material- und Größenberatung",
        "Zielgruppen-Tonality",
        "PDP-SEO Optimierung",
        "Upsell Bundles",
      ],
    },
    {
      id: "electronics",
      name: "Elektronik & Gadgets",
      description: "Smartphones, Smart-Home und Zubehör",
      price: 139,
      icon: "📱",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g7" x1="0%25" y1="0%25" x2="100%25" y2="0%25"%3E%3Cstop offset="0%25" stop-color="%231f2937"/%3E%3Cstop offset="100%25" stop-color="%233b82f6"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g7)"/%3E%3Ccircle cx="480" cy="130" r="90" fill="rgba(255,255,255,0.1)"/%3E%3Ccircle cx="200" cy="260" r="130" fill="rgba(255,255,255,0.08)"/%3E%3C/svg%3E',
      features: [
        "Technische Specs",
        "Vergleichstabellen",
        "Warranty-Hinweise",
        "Accessory Cross-Sell",
        "Setup-Guides",
      ],
    },
    {
      id: "pet-supplies",
      name: "Haustierbedarf",
      description: "Futter, Pflege und Zubehör für Haustiere",
      price: 89,
      icon: "🐾",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g8" x1="0%25" y1="100%25" x2="100%25" y2="0%25"%3E%3Cstop offset="0%25" stop-color="%23f472b6"/%3E%3Cstop offset="100%25" stop-color="%23fb7185"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g8)"/%3E%3Cpath d="M-20 260 Q180 200 320 260 T640 260 V420 H-20 Z" fill="rgba(255,255,255,0.14)"/%3E%3C/svg%3E',
      features: [
        "Fütterungsempfehlungen",
        "Rasse-spezifische Hinweise",
        "Pflege-Tipps",
        "Abo-Modelle",
        "Safety-Hinweise",
      ],
    },
    {
      id: "gourmet",
      name: "Lebensmittel & Feinkost",
      description: "Delikatessen, Getränke und Meal Kits",
      price: 99,
      icon: "🍷",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g9" x1="100%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23f97316"/%3E%3Cstop offset="100%25" stop-color="%23ea580c"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g9)"/%3E%3Ccircle cx="180" cy="220" r="120" fill="rgba(255,255,255,0.1)"/%3E%3Ccircle cx="420" cy="150" r="80" fill="rgba(255,255,255,0.12)"/%3E%3C/svg%3E',
      features: [
        "Geschmacksprofile",
        "Pairing-Empfehlungen",
        "Lagerhinweise",
        "Rezept-Ideen",
        "Abo/Bundle Vorschläge",
      ],
    },
    {
      id: "home-living",
      name: "Home & Living",
      description: "Möbel, Deko und Haushaltswaren",
      price: 119,
      icon: "🏠",
      isActive: false,
      image:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"%3E%3Cdefs%3E%3ClinearGradient id="g10" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%236b7280"/%3E%3Cstop offset="100%25" stop-color="%239ca3af"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23g10)"/%3E%3Crect x="80" y="110" width="440" height="180" rx="32" fill="rgba(255,255,255,0.12)"/%3E%3C/svg%3E',
      features: [
        "Stilwelten & Looks",
        "Material- & Pflegehinweise",
        "Maßangaben sauber erklärt",
        "Roomset Storytelling",
        "Cross-Selling Sets",
      ],
    },
  ]);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleBack = () => {
    navigate("/");
  };

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/connection`
      );
      if (!response.ok) throw new Error("Fehler beim Laden");
      const data = await response.json();

      // Backend sends masked credentials, keep them for display
      if (data.success && data.credentials) {
        // Merge mit defaults um fehlende neue Properties zu füllen
        setCredentials((_prev) => ({
          ...defaultCredentials,
          ...data.credentials,
        }));
      }
    } catch (error) {
      console.warn("Hinweis: Einstellungen noch nicht ausgefüllt.", error);
      setConnectionMessage(
        "ℹ️ Ihr Agent ist noch nicht konfiguriert. Bitte füllen Sie alle Pflichtfelder aus, um die Verbindung herzustellen."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = (
    field: keyof ShopCredentials,
    value: string | number | boolean
  ) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleSpecializationUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // TODO: Implement real upload/parse logic
    console.log("📤 Spezialisierungs-Upload gestartet:", file.name);
    setConnectionMessage(`📂 Upload gestartet: ${file.name}`);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus("idle");
    setConnectionMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/connection/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) throw new Error("Test fehlgeschlagen");

      const data = await response.json();

      if (data.success) {
        setConnectionStatus("success");
        setConnectionMessage(
          `${data.results.wordpress.message}\n${data.results.woocommerce.message}`
        );
      } else {
        setConnectionStatus("error");
        setConnectionMessage(data.message || "Verbindungstest fehlgeschlagen");
      }

      console.log("🔍 Verbindungstest:", data);
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage("❌ Verbindungsfehler - Backend nicht erreichbar");
      console.error("❌ Verbindungsfehler:", error);
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      // Mapping: flach -> verschachtelt
      const payload = {
        wordpress: {
          url: credentials.wpUrl,
          username: credentials.wpUsername,
          appPassword: credentials.wpAppPassword,
        },
        woocommerce: {
          url: credentials.wcApiUrl,
          consumerKey: credentials.wcConsumerKey,
          consumerSecret: credentials.wcConsumerSecret,
          authMode: credentials.wooAuthMode,
          timeoutMs: credentials.wooTimeoutMs,
        },
        openAI: {
          apiKey: credentials.openaiApiKey,
          model: credentials.openaiModel,
        },
        smtp: {
          host: credentials.smtpHost,
          port: credentials.smtpPort,
          secure: credentials.smtpSecure,
          user: credentials.smtpUser,
          password: credentials.smtpPassword,
          from: credentials.smtpFrom,
        },
        job: {
          mode: credentials.jobMode,
          intervalMs: credentials.jobIntervalMs,
        },
        features: {
          enableAnalytics: credentials.enableAnalytics,
          enableAutoProducts: credentials.enableAutoProducts,
          enableEmailMarketing: credentials.enableEmailMarketing,
        },
        reddit: {
          clientId: credentials.redditClientId,
          clientSecret: credentials.redditClientSecret,
        },
        ml: {
          enabled: credentials.mlEnabled,
          productRecommendations: credentials.mlProductRecommendations,
          trendForecasting: credentials.mlTrendForecasting,
          dynamicPricing: credentials.mlDynamicPricing,
          emailOptimization: credentials.mlEmailOptimization,
          churnPrediction: credentials.mlChurnPrediction,
          sentimentAnalysis: credentials.mlSentimentAnalysis,
          fraudDetection: credentials.mlFraudDetection,
          productRecMinConfidence: credentials.mlProductRecMinConfidence,
          productRecFallback: credentials.mlProductRecFallback,
          trendMinConfidence: credentials.mlTrendMinConfidence,
          trendFallback: credentials.mlTrendFallback,
          emailMinConfidence: credentials.mlEmailMinConfidence,
          emailFallback: credentials.mlEmailFallback,
          emailDefaultTime: credentials.mlEmailDefaultTime,
          maxInferenceTime: credentials.mlMaxInferenceTime,
          cacheResults: credentials.mlCacheResults,
          cacheTtl: credentials.mlCacheTtl,
        },
      };
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/connection`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Speichern fehlgeschlagen");
      const data = await response.json();
      if (data.success) {
        setConnectionStatus("success");
        setConnectionMessage("✅ Konfiguration erfolgreich gespeichert!");
        console.log("✅ Konfiguration gespeichert");
        setTimeout(() => {
          setConnectionMessage("");
          setConnectionStatus("idle");
        }, 3000);
      } else {
        throw new Error("Speichern fehlgeschlagen");
      }
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage("❌ Fehler beim Speichern der Konfiguration");
      console.error("❌ Fehler beim Speichern:", error);
    } finally {
      setSaving(false);
    }
  };

  const activateLicense = async () => {
    if (!licenseKey) {
      alert("❌ Bitte gib einen Lizenzschlüssel ein");
      return;
    }

    setActivatingLicense(true);

    try {
      // Simuliere Lizenz-Aktivierung
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("🔑 Lizenz aktiviert:", licenseKey);
      alert("✅ Lizenz erfolgreich aktiviert!");
    } catch (error) {
      console.error("❌ Lizenz-Aktivierung fehlgeschlagen:", error);
      alert("❌ Ungültiger Lizenzschlüssel");
    } finally {
      setActivatingLicense(false);
    }
  };

  const purchaseSpecialization = (spec: Specialization) => {
    console.log("🛒 Kaufe Spezialisierung:", spec.name);
    alert(`🛒 Weiterleitung zum Kauf: ${spec.name} (${spec.price}€)`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1a1f36 50%, #0f172a 100%)",
        paddingBottom: "40px",
        color: "#e5e7eb",
      }}
    >
      {/* Floating Back Button (global style for consistency) */}
      <button className="back-button floating-back" onClick={handleBack}>
        ← Zurück
      </button>

      {/* Hero Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "60px 40px 40px",
          backdropFilter: "blur(10px)",
          marginTop: "0",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "42px",
              fontWeight: "700",
              margin: "0 0 10px",
              background: "linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ⚙️ Einstellungen & Konfiguration
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.88)",
              margin: "0",
            }}
          >
            Verwalte deine Shop-Verbindung, Spezialisierungen und Integrationen
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "40px",
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "connection", label: "🔌 Shop-Verbindung", color: "#3b82f6" },
            {
              id: "specialization",
              label: "🎯 Spezialisierung",
              color: "#8b5cf6",
            },
            { id: "license", label: "🔑 Lizenz", color: "#10b981" },
            { id: "social", label: "📱 Social Media", color: "#f59e0b" },
            { id: "agentic", label: "🤖 Agentic Loops", color: "#06b6d4" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "12px 24px",
                background:
                  activeTab === tab.id ? `${tab.color}20` : "transparent",
                border:
                  activeTab === tab.id
                    ? `2px solid ${tab.color}`
                    : "2px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                color:
                  activeTab === tab.id ? tab.color : "rgba(255,255,255,0.7)",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: activeTab === tab.id ? "600" : "500",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
              }}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => navigate("/settings/ml")}
            style={{
              padding: "12px 24px",
              background: "#8b5cf620",
              border: "2px solid #8b5cf6",
              borderRadius: "20px",
              color: "#8b5cf6",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              marginLeft: "auto",
            }}
          >
            🧠 Machine Learning
          </button>
        </div>

        {/* TAB 1: Shop-Verbindung */}
        {activeTab === "connection" && (
          <div>
            {loading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <h3>Lade Einstellungen...</h3>
              </div>
            )}

            {!loading && (
              <>
                <h3>🔌 Shop-Verbindung einrichten</h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    marginBottom: "30px",
                  }}
                >
                  Verbinde dein WooCommerce/WordPress Shop mit dem AI-Agent
                </p>

                {/* Import-Konfiguration: Button wird unten platziert */}

                {/* Status Message */}
                {connectionMessage && (
                  <div
                    style={{
                      padding: "15px",
                      marginBottom: "20px",
                      background:
                        connectionStatus === "success"
                          ? "rgba(34, 197, 94, 0.2)"
                          : connectionStatus === "error"
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(59, 130, 246, 0.2)",
                      border: `2px solid ${
                        connectionStatus === "success"
                          ? "#22c55e"
                          : connectionStatus === "error"
                            ? "#ef4444"
                            : "#3b82f6"
                      }`,
                      borderRadius: "8px",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {connectionMessage}
                  </div>
                )}

                <div
                  style={{ display: "grid", gap: "20px", marginBottom: "30px" }}
                >
                  {/* WordPress Credentials */}
                  <div
                    style={{
                      background: "rgba(59, 130, 246, 0.12)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid rgba(59, 130, 246, 0.35)",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>
                      📝 WordPress Zugangsdaten
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        WordPress URL:
                      </label>
                      <input
                        type="text"
                        placeholder="https://meinshop.de"
                        value={credentials.wpUrl || ""}
                        onChange={(e) =>
                          handleCredentialChange("wpUrl", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        Username/Email:
                      </label>
                      <input
                        type="text"
                        placeholder="admin@meinshop.de"
                        value={credentials.wpUsername || ""}
                        onChange={(e) =>
                          handleCredentialChange("wpUsername", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        Application Password:
                      </label>
                      <input
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={credentials.wpAppPassword || ""}
                        onChange={(e) =>
                          handleCredentialChange(
                            "wpAppPassword",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                      <small
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "12px",
                        }}
                      >
                        💡 Erstelle ein Application Password in WordPress unter
                        Benutzer → Profil
                      </small>
                    </div>
                  </div>

                  {/* WooCommerce Credentials */}
                  <div
                    style={{
                      background: "rgba(139, 92, 246, 0.12)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid rgba(139, 92, 246, 0.35)",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>
                      🛒 WooCommerce API Keys
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        WooCommerce API URL:
                      </label>
                      <input
                        type="text"
                        placeholder="https://meinshop.de"
                        value={credentials.wcApiUrl || ""}
                        onChange={(e) =>
                          handleCredentialChange("wcApiUrl", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        Consumer Key:
                      </label>
                      <input
                        type="text"
                        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={credentials.wcConsumerKey || ""}
                        onChange={(e) =>
                          handleCredentialChange(
                            "wcConsumerKey",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        Consumer Secret:
                      </label>
                      <input
                        type="password"
                        placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={credentials.wcConsumerSecret || ""}
                        onChange={(e) =>
                          handleCredentialChange(
                            "wcConsumerSecret",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                      <small
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "12px",
                        }}
                      >
                        💡 Erstelle API-Keys in WooCommerce → Einstellungen →
                        Erweitert → REST API
                      </small>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            color: "rgba(255,255,255,0.94)",
                          }}
                        >
                          Auth Mode:
                        </label>
                        <select
                          value={credentials.wooAuthMode || "basic"}
                          onChange={(e) =>
                            handleCredentialChange(
                              "wooAuthMode",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.35)",
                            borderRadius: "8px",
                            color: "#f8fafc",
                            fontSize: "14px",
                          }}
                        >
                          <option value="basic">Basic Auth</option>
                          <option value="oauth">OAuth</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            color: "rgba(255,255,255,0.94)",
                          }}
                        >
                          Timeout (ms):
                        </label>
                        <input
                          type="number"
                          value={credentials.wooTimeoutMs ?? 0}
                          onChange={(e) =>
                            handleCredentialChange(
                              "wooTimeoutMs",
                              parseInt(e.target.value) || 0
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.35)",
                            borderRadius: "8px",
                            color: "#f8fafc",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reddit Credentials */}
                  <div
                    style={{
                      background: "rgba(234, 88, 12, 0.12)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid rgba(234, 88, 12, 0.35)",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>👽 Reddit API</h4>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        Reddit Client ID:
                      </label>
                      <input
                        type="text"
                        placeholder="Reddit Client ID"
                        value={credentials.redditClientId || ""}
                        onChange={(e) =>
                          handleCredentialChange(
                            "redditClientId",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        Reddit Client Secret:
                      </label>
                      <input
                        type="password"
                        placeholder="Reddit Client Secret"
                        value={credentials.redditClientSecret || ""}
                        onChange={(e) =>
                          handleCredentialChange(
                            "redditClientSecret",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>

                  {/* E-Mail Konfiguration */}
                  <div
                    style={{
                      background: "rgba(13, 148, 136, 0.12)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid rgba(13, 148, 136, 0.35)",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>
                      📧 E-Mail Konfiguration
                    </h4>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        SMTP Host:
                      </label>
                      <input
                        type="text"
                        placeholder="SMTP Host"
                        value={credentials.smtpHost || ""}
                        onChange={(e) =>
                          handleCredentialChange("smtpHost", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        SMTP Port:
                      </label>
                      <input
                        type="number"
                        placeholder="465"
                        value={credentials.smtpPort ?? 0}
                        onChange={(e) =>
                          handleCredentialChange(
                            "smtpPort",
                            Number(e.target.value) || 0
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        SMTP Secure:
                      </label>
                      <select
                        value={credentials.smtpSecure ? "true" : "false"}
                        onChange={(e) =>
                          handleCredentialChange(
                            "smtpSecure",
                            e.target.value === "true"
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        SMTP User:
                      </label>
                      <input
                        type="text"
                        placeholder="info@kaufe-es.eu"
                        value={credentials.smtpUser || ""}
                        onChange={(e) =>
                          handleCredentialChange("smtpUser", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        SMTP Password:
                      </label>
                      <input
                        type="password"
                        placeholder="SMTP Passwort"
                        value={credentials.smtpPassword || ""}
                        onChange={(e) =>
                          handleCredentialChange("smtpPassword", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        SMTP From:
                      </label>
                      <input
                        type="text"
                        placeholder="info@kaufe-es.eu"
                        value={credentials.smtpFrom || ""}
                        onChange={(e) =>
                          handleCredentialChange("smtpFrom", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>

                  {/* AI & Services Configuration */}
                  <div
                    style={{
                      background: "rgba(99, 102, 241, 0.12)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid rgba(99, 102, 241, 0.35)",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>🤖 AI & Services</h4>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        OpenAI API Key:
                      </label>
                      <input
                        type="password"
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={credentials.openaiApiKey || ""}
                        onChange={(e) =>
                          handleCredentialChange("openaiApiKey", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                      <small
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "12px",
                        }}
                      >
                        💡 Benötigt für AI-Features (Content-Generierung,
                        Optimierung, etc.)
                      </small>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        OpenAI Model:
                      </label>
                      <select
                        value={credentials.openaiModel || "gpt-4o-mini"}
                        onChange={(e) =>
                          handleCredentialChange("openaiModel", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      >
                        <option value="gpt-4o">GPT-4o (Empfohlen)</option>
                        <option value="gpt-4o-mini">
                          GPT-4o Mini (Schneller)
                        </option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">
                          GPT-3.5 Turbo (Günstig)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Job Configuration */}
                  <div
                    style={{
                      background: "rgba(34, 197, 94, 0.12)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid rgba(34, 197, 94, 0.35)",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>
                      ⚙️ Job-Konfiguration
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        Job Mode:
                      </label>
                      <select
                        value={credentials.jobMode || "once"}
                        onChange={(e) =>
                          handleCredentialChange("jobMode", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      >
                        <option value="once">Einmalig (Once)</option>
                        <option value="interval">
                          Intervall (Wiederkehrend)
                        </option>
                      </select>
                      <small
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "12px",
                        }}
                      >
                        💡 Legt fest, ob Jobs einmalig oder wiederkehrend
                        ausgeführt werden
                      </small>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        Job Intervall (ms):
                      </label>
                      <input
                        type="number"
                        value={credentials.jobIntervalMs ?? 0}
                        onChange={(e) =>
                          handleCredentialChange(
                            "jobIntervalMs",
                            parseInt(e.target.value) || 0
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "14px",
                        }}
                      />
                      <small
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "12px",
                        }}
                      >
                        💡 Standard: 900000ms (15 Minuten) - Nur relevant bei
                        "Intervall"-Modus
                      </small>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      padding: "20px",
                      borderRadius: "8px",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>
                      🎛️ Feature-Aktivierung
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!credentials.enableAnalytics}
                          onChange={(e) =>
                            handleCredentialChange(
                              "enableAnalytics",
                              e.target.checked
                            )
                          }
                          style={{
                            marginRight: "10px",
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.9)" }}>
                          📊 Analytics & Reporting aktivieren
                        </span>
                      </label>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!credentials.enableAutoProducts}
                          onChange={(e) =>
                            handleCredentialChange(
                              "enableAutoProducts",
                              e.target.checked
                            )
                          }
                          style={{
                            marginRight: "10px",
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.9)" }}>
                          🤖 Auto-Product-Creation aktivieren
                        </span>
                      </label>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!credentials.enableEmailMarketing}
                          onChange={(e) =>
                            handleCredentialChange(
                              "enableEmailMarketing",
                              e.target.checked
                            )
                          }
                          style={{
                            marginRight: "10px",
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.9)" }}>
                          📧 Email-Marketing aktivieren
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                {connectionStatus !== "idle" && (
                  <div
                    style={{
                      padding: "15px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                      background:
                        connectionStatus === "success"
                          ? "rgba(34, 197, 94, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                      border: `1px solid ${connectionStatus === "success" ? "#22c55e" : "#ef4444"}`,
                    }}
                  >
                    {connectionStatus === "success" ? (
                      <span style={{ color: "#22c55e" }}>
                        ✅ Verbindung erfolgreich getestet!
                      </span>
                    ) : (
                      <span style={{ color: "#ef4444" }}>
                        ❌ Verbindung fehlgeschlagen. Prüfe deine Zugangsdaten.
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons inkl. Import-Konfiguration */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "30px",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={testConnection}
                    disabled={testingConnection}
                    style={{
                      padding: "12px 24px",
                      background: testingConnection
                        ? "rgba(100,100,100,0.3)"
                        : "rgba(59, 130, 246, 0.3)",
                      border: "2px solid #3b82f6",
                      borderRadius: "8px",
                      color: "white",
                      cursor: testingConnection ? "not-allowed" : "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {testingConnection
                      ? "🔄 Teste Verbindung..."
                      : "🧪 Verbindung testen"}
                  </button>

                  <button
                    onClick={saveConfiguration}
                    disabled={saving}
                    style={{
                      padding: "12px 24px",
                      background: saving
                        ? "rgba(100,100,100,0.3)"
                        : "rgba(34, 197, 94, 0.3)",
                      border: "2px solid #22c55e",
                      borderRadius: "8px",
                      color: "white",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {saving ? "💾 Speichert..." : "💾 Konfiguration speichern"}
                  </button>

                  {/* Import-Konfiguration Button */}
                  <label
                    htmlFor="import-config"
                    style={{
                      display: "inline-block",
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#3b82f6",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                      border: "2px solid #3b82f6",
                      fontSize: "16px",
                      marginLeft: "10px",
                    }}
                  >
                    📂 Konfiguration laden
                    <input
                      id="import-config"
                      type="file"
                      accept="application/json"
                      style={{ display: "none" }}
                      onChange={handleImportConfig}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: Spezialisierung */}
        {activeTab === "specialization" && (
          <div>
            <h3>🎯 Agent-Spezialisierung wählen</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              Wähle eine Branche, um den AI-Agent optimal auf deine Produkte zu
              trainieren
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              {specializations.map((spec) => (
                <div
                  key={spec.id}
                  style={{ perspective: "1200px", height: "280px" }}
                  onMouseEnter={() => setHoveredCard(spec.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: "14px",
                      transformStyle: "preserve-3d",
                      transition: "transform 0.6s ease",
                      boxShadow:
                        hoveredCard === spec.id
                          ? "0 18px 40px rgba(0,0,0,0.45)"
                          : "0 10px 25px rgba(0,0,0,0.2)",
                      transform:
                        hoveredCard === spec.id
                          ? "rotateY(180deg)"
                          : "rotateY(0deg)",
                    }}
                  >
                    {spec.isActive && (
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: "#22c55e",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          zIndex: 3,
                        }}
                      >
                        ✓ AKTIV
                      </div>
                    )}

                    {/* Front */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        borderRadius: "14px",
                        overflow: "hidden",
                        backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05)), url(${spec.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        display: "flex",
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          padding: "18px",
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
                        }}
                      >
                        <div style={{ fontSize: "36px", marginBottom: "6px" }}>
                          {spec.icon}
                        </div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            color: "white",
                          }}
                        >
                          {spec.name}
                        </h4>
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderRadius: "14px",
                        background: "rgba(15, 23, 42, 0.92)",
                        border: spec.isActive
                          ? "2px solid #22c55e"
                          : "1px solid rgba(255,255,255,0.12)",
                        padding: "18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <h4
                        style={{ margin: 0, fontSize: "18px", color: "white" }}
                      >
                        {spec.name}
                      </h4>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.82)",
                          fontSize: "14px",
                          margin: 0,
                        }}
                      >
                        {spec.description}
                      </p>
                      <ul
                        style={{
                          margin: "0",
                          paddingLeft: "18px",
                          color: "rgba(255,255,255,0.75)",
                          fontSize: "13px",
                          lineHeight: 1.5,
                        }}
                      >
                        {spec.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx}>✓ {feature}</li>
                        ))}
                      </ul>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "auto",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#3b82f6",
                          }}
                        >
                          {spec.price}€
                        </span>
                        {!spec.isActive && (
                          <button
                            onClick={() => purchaseSpecialization(spec)}
                            style={{
                              padding: "10px 16px",
                              background:
                                "linear-gradient(135deg, #3b82f6, #2563eb)",
                              border: "none",
                              borderRadius: "8px",
                              color: "white",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            🛒 Aktivieren
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Routine unter den Kacheln */}
            <div
              style={{
                marginTop: "28px",
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.08)",
                border: "1px dashed rgba(255,255,255,0.2)",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0" }}>
                📂 Upload für Trainingsdaten
              </h4>
              <p
                style={{ margin: "0 0 12px 0", color: "rgba(255,255,255,0.8)" }}
              >
                Lade Produkt- oder Content-Daten hoch, damit die gewählte
                Spezialisierung schneller trainiert wird.
              </p>
              <label
                style={{
                  display: "inline-block",
                  padding: "12px 20px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 700,
                  border: "none",
                }}
              >
                Datei wählen (CSV/JSON)
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleSpecializationUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: Lizenz */}
        {activeTab === "license" && (
          <div>
            <h3>🔑 Lizenz-Verwaltung</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              Aktiviere deine gekaufte Spezialisierung mit einem Lizenzschlüssel
            </p>

            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                padding: "30px",
                borderRadius: "12px",
                maxWidth: "600px",
              }}
            >
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "16px",
                  }}
                >
                  Lizenzschlüssel eingeben:
                </label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: "rgba(0,0,0,0.3)",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "18px",
                    fontFamily: "monospace",
                    textAlign: "center",
                    letterSpacing: "2px",
                  }}
                />
                <small
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "12px",
                    marginTop: "8px",
                    display: "block",
                  }}
                >
                  💡 Du findest deinen Lizenzschlüssel in der Kaufbestätigung
                  per Email
                </small>
              </div>

              <button
                onClick={activateLicense}
                disabled={activatingLicense || !licenseKey}
                style={{
                  width: "100%",
                  padding: "15px",
                  background:
                    activatingLicense || !licenseKey
                      ? "rgba(100,100,100,0.3)"
                      : "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  cursor:
                    activatingLicense || !licenseKey
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {activatingLicense
                  ? "⏳ Aktiviere Lizenz..."
                  : "🔓 Lizenz aktivieren"}
              </button>
            </div>

            {/* Aktive Lizenzen */}
            <div style={{ marginTop: "40px" }}>
              <h4 style={{ marginBottom: "20px" }}>📋 Aktive Lizenzen</h4>
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid #22c55e",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                      }}
                    >
                      🔒 DSGVO Digitale Produkte
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      Lizenz: DSGVO-2024-XXXX-XXXX
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.5)",
                        marginTop: "5px",
                      }}
                    >
                      Aktiviert am: 31.10.2025 | Läuft ab: 31.10.2026
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#22c55e",
                      color: "white",
                      padding: "6px 16px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓ AKTIV
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Social Media */}
        {activeTab === "social" && (
          <div>
            <h3>📱 Social Media Konten verbinden</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              Verbinde deine Social-Media-Konten, um KI-generierte Posts direkt
              zu veröffentlichen
            </p>

            {/* Social Media Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginBottom: "40px",
              }}
            >
              {/* LinkedIn */}
              <div
                style={{
                  background: "rgba(0, 119, 181, 0.1)",
                  border: "2px solid rgba(0, 119, 181, 0.3)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "32px", marginRight: "15px" }}>
                    💼
                  </span>
                  <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "white" }}>
                      LinkedIn
                    </h4>
                    <small style={{ color: "rgba(255,255,255,0.6)" }}>
                      {credentials.linkedinEnabled
                        ? "✅ Verbunden"
                        : "⏸️ Nicht verbunden"}
                    </small>
                  </div>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Access Token:
                  </label>
                  <input
                    type="password"
                    placeholder="LinkedIn Access Token"
                    value={credentials.linkedinAccessToken}
                    onChange={(e) =>
                      handleCredentialChange(
                        "linkedinAccessToken",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={credentials.linkedinEnabled}
                    onChange={(e) =>
                      handleCredentialChange(
                        "linkedinEnabled",
                        e.target.checked
                      )
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Aktiviert
                  </span>
                </label>
              </div>

              {/* Facebook */}
              <div
                style={{
                  background: "rgba(59, 89, 152, 0.1)",
                  border: "2px solid rgba(59, 89, 152, 0.3)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "32px", marginRight: "15px" }}>
                    👍
                  </span>
                  <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "white" }}>
                      Facebook
                    </h4>
                    <small style={{ color: "rgba(255,255,255,0.6)" }}>
                      {credentials.facebookEnabled
                        ? "✅ Verbunden"
                        : "⏸️ Nicht verbunden"}
                    </small>
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Access Token:
                  </label>
                  <input
                    type="password"
                    placeholder="Facebook Access Token"
                    value={credentials.facebookAccessToken}
                    onChange={(e) =>
                      handleCredentialChange(
                        "facebookAccessToken",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  />
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Page ID:
                  </label>
                  <input
                    type="text"
                    placeholder="Facebook Page ID"
                    value={credentials.facebookPageId}
                    onChange={(e) =>
                      handleCredentialChange("facebookPageId", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={credentials.facebookEnabled}
                    onChange={(e) =>
                      handleCredentialChange(
                        "facebookEnabled",
                        e.target.checked
                      )
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Aktiviert
                  </span>
                </label>
              </div>

              {/* Instagram */}
              <div
                style={{
                  background: "rgba(217, 45, 143, 0.1)",
                  border: "2px solid rgba(217, 45, 143, 0.3)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "32px", marginRight: "15px" }}>
                    📸
                  </span>
                  <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "white" }}>
                      Instagram
                    </h4>
                    <small style={{ color: "rgba(255,255,255,0.6)" }}>
                      {credentials.instagramEnabled
                        ? "✅ Verbunden"
                        : "⏸️ Nicht verbunden"}
                    </small>
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Access Token:
                  </label>
                  <input
                    type="password"
                    placeholder="Instagram Access Token"
                    value={credentials.instagramAccessToken}
                    onChange={(e) =>
                      handleCredentialChange(
                        "instagramAccessToken",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  />
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Business Account ID:
                  </label>
                  <input
                    type="text"
                    placeholder="Instagram Business Account ID"
                    value={credentials.instagramBusinessAccountId}
                    onChange={(e) =>
                      handleCredentialChange(
                        "instagramBusinessAccountId",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={credentials.instagramEnabled}
                    onChange={(e) =>
                      handleCredentialChange(
                        "instagramEnabled",
                        e.target.checked
                      )
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Aktiviert
                  </span>
                </label>
              </div>

              {/* Twitter */}
              <div
                style={{
                  background: "rgba(29, 155, 240, 0.1)",
                  border: "2px solid rgba(29, 155, 240, 0.3)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "32px", marginRight: "15px" }}>
                    🐦
                  </span>
                  <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "white" }}>
                      Twitter/X
                    </h4>
                    <small style={{ color: "rgba(255,255,255,0.6)" }}>
                      {credentials.twitterEnabled
                        ? "✅ Verbunden"
                        : "⏸️ Nicht verbunden"}
                    </small>
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    API Key:
                  </label>
                  <input
                    type="password"
                    placeholder="Twitter API Key"
                    value={credentials.twitterApiKey}
                    onChange={(e) =>
                      handleCredentialChange("twitterApiKey", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  />
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    API Secret:
                  </label>
                  <input
                    type="password"
                    placeholder="Twitter API Secret"
                    value={credentials.twitterApiSecret}
                    onChange={(e) =>
                      handleCredentialChange("twitterApiSecret", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={credentials.twitterEnabled}
                    onChange={(e) =>
                      handleCredentialChange("twitterEnabled", e.target.checked)
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Aktiviert
                  </span>
                </label>
              </div>

              {/* TikTok */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "32px", marginRight: "15px" }}>
                    🎵
                  </span>
                  <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "white" }}>
                      TikTok
                    </h4>
                    <small style={{ color: "rgba(255,255,255,0.6)" }}>
                      {credentials.tiktokEnabled
                        ? "✅ Verbunden"
                        : "⏸️ Nicht verbunden"}
                    </small>
                  </div>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Access Token:
                  </label>
                  <input
                    type="password"
                    placeholder="TikTok Access Token"
                    value={credentials.tiktokAccessToken}
                    onChange={(e) =>
                      handleCredentialChange(
                        "tiktokAccessToken",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={credentials.tiktokEnabled}
                    onChange={(e) =>
                      handleCredentialChange("tiktokEnabled", e.target.checked)
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Aktiviert
                  </span>
                </label>
              </div>

              {/* YouTube */}
              <div
                style={{
                  background: "rgba(255, 0, 0, 0.1)",
                  border: "2px solid rgba(255, 0, 0, 0.3)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "32px", marginRight: "15px" }}>
                    📺
                  </span>
                  <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "white" }}>
                      YouTube
                    </h4>
                    <small style={{ color: "rgba(255,255,255,0.6)" }}>
                      {credentials.youtubeEnabled
                        ? "✅ Verbunden"
                        : "⏸️ Nicht verbunden"}
                    </small>
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Access Token:
                  </label>
                  <input
                    type="password"
                    placeholder="YouTube Access Token"
                    value={credentials.youtubeAccessToken}
                    onChange={(e) =>
                      handleCredentialChange(
                        "youtubeAccessToken",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  />
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                    }}
                  >
                    Channel ID:
                  </label>
                  <input
                    type="text"
                    placeholder="YouTube Channel ID"
                    value={credentials.youtubeChannelId}
                    onChange={(e) =>
                      handleCredentialChange("youtubeChannelId", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={credentials.youtubeEnabled}
                    onChange={(e) =>
                      handleCredentialChange("youtubeEnabled", e.target.checked)
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Aktiviert
                  </span>
                </label>
              </div>
            </div>

            {/* Info Box */}
            <div
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "2px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", color: "#60a5fa" }}>
                ℹ️ Anleitung zum Verbinden
              </h4>
              <ul
                style={{
                  margin: "0",
                  paddingLeft: "20px",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                <li>
                  Rufe die Entwicklerportal deiner Plattform auf (z.B.
                  developer.linkedin.com)
                </li>
                <li>Erstelle eine neue App/Integration für A.r.I.</li>
                <li>
                  Kopiere die Access Tokens und IDs in die entsprechenden Felder
                </li>
                <li>Aktiviere die Plattform mit dem Checkbox</li>
                <li>Speichere die Konfiguration</li>
              </ul>
            </div>

            {/* Save Button */}
            <button
              onClick={saveConfiguration}
              disabled={saving}
              style={{
                padding: "15px 40px",
                background: saving
                  ? "rgba(100,100,100,0.3)"
                  : "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {saving ? "⏳ Speichern..." : "💾 Speichern"}
            </button>

            {connectionMessage && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background:
                    connectionStatus === "success"
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(220, 53, 69, 0.1)",
                  border: `2px solid ${connectionStatus === "success" ? "#22c55e" : "#dc3545"}`,
                  borderRadius: "8px",
                  color: connectionStatus === "success" ? "#86efac" : "#f87171",
                }}
              >
                {connectionMessage}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Agentic Loops */}
        {activeTab === "agentic" && (
          <div>
            <h3>🤖 Agentic Loop Monitoring</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              Überwache und steuere deine autonomen AI-Agenten
            </p>

            <div
              style={{
                background: "rgba(6, 182, 212, 0.05)",
                border: "2px solid rgba(6, 182, 212, 0.2)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "rgba(6, 182, 212, 0.1)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                  }}
                >
                  📊
                </div>
                <div>
                  <h4 style={{ margin: "0 0 8px 0", color: "#06b6d4" }}>
                    Agentic Loop Dashboard
                  </h4>
                  <p
                    style={{
                      margin: "0",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "14px",
                    }}
                  >
                    Detailliertes Monitoring aller 4 Loop-Typen mit Stats,
                    Trends und Learnings
                  </p>
                </div>
                <button
                  onClick={() => navigate("/app/loop-monitoring")}
                  style={{
                    marginLeft: "auto",
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  → Zum Dashboard
                </button>
              </div>
            </div>

            {/* Loop Types */}
            <div style={{ marginTop: "30px" }}>
              <h4 style={{ marginBottom: "20px", color: "#e5e7eb" }}>
                📌 Available Loops
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "16px",
                }}
              >
                {[
                  {
                    icon: "🚨",
                    name: "Anomaly Detection",
                    desc: "Payment-Anomalien automatisch erkennen",
                    schedule: "Täglich 09:00",
                  },
                  {
                    icon: "📈",
                    name: "Product Optimization",
                    desc: "A/B Testing für Produkte",
                    schedule: "Mo/Do 10:00",
                  },
                  {
                    icon: "💳",
                    name: "Payment Recovery",
                    desc: "Failed Orders mit Strategien retten",
                    schedule: "Alle 30 Min",
                  },
                  {
                    icon: "📊",
                    name: "Analytics Insights",
                    desc: "Automatische Business-Reports",
                    schedule: "Täglich 20:00",
                  },
                ].map((loop, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "16px",
                      color: "#e5e7eb",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                      {loop.icon}
                    </div>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {loop.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.7)",
                        marginBottom: "8px",
                      }}
                    >
                      {loop.desc}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#06b6d4",
                        fontWeight: "500",
                      }}
                    >
                      ⏱️ {loop.schedule}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documentation */}
            <div
              style={{
                marginTop: "30px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "20px",
              }}
            >
              <h4
                style={{
                  marginTop: "0",
                  marginBottom: "16px",
                  color: "#e5e7eb",
                }}
              >
                📖 Documentation
              </h4>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href="https://github.com/andreZ1971/ki/blob/master/docs/AGENTIC_LOOP_ARCHITECTURE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 16px",
                    background: "rgba(6, 182, 212, 0.1)",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                    borderRadius: "6px",
                    color: "#06b6d4",
                    textDecoration: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  📄 Architecture Docs
                </a>
                <a
                  href="https://github.com/andreZ1971/ki/blob/master/README.md#-agentic-loop-framework"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 16px",
                    background: "rgba(6, 182, 212, 0.1)",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                    borderRadius: "6px",
                    color: "#06b6d4",
                    textDecoration: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  📚 README
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
