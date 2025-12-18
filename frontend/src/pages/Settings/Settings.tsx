import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

  // Support Configuration
  supportTicketsEndpoint: string;
  supportPerPage: number;
  supportProvider:
    | "auto"
    | "awesome-support"
    | "wp-cpt"
    | "woo-order-notes"
    | "none";
  supportCptSlug: string;

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

  // Support defaults
  supportTicketsEndpoint: "/wp-json/awesome-support/v1/tickets",
  supportPerPage: 20,
  supportProvider: "auto",
  supportCptSlug: "wpas_ticket",

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
  const { t } = useTranslation();
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
          // Support
          supportTicketsEndpoint:
            data.support?.ticketsEndpoint ||
            "/wp-json/awesome-support/v1/tickets",
          supportPerPage: data.support?.perPage || 20,
          supportProvider: data.support?.provider || "auto",
          supportCptSlug: data.support?.cptSlug || "wpas_ticket",
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

  const handleSpecializationUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["json", "csv"].includes(fileExtension || "")) {
      setConnectionMessage("❌ Nur .json oder .csv Dateien sind erlaubt");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setConnectionMessage("❌ Datei zu groß (Maximum: 5MB)");
      return;
    }

    setConnectionMessage(`⏳ ${file.name} wird hochgeladen und verarbeitet...`);
    setTestingConnection(true);

    try {
      // Read file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Parse and validate content
      let specialization: Record<string, unknown>;

      if (fileExtension === "json") {
        try {
          specialization = JSON.parse(fileContent);
        } catch (_error) {
          setConnectionMessage(
            "❌ Ungültiges JSON-Format. Bitte überprüfe die Datei."
          );
          setTestingConnection(false);
          return;
        }
      } else if (fileExtension === "csv") {
        // Simple CSV parsing - convert to JSON
        const lines = fileContent.trim().split("\n");
        const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
        const values = lines[1]?.split(",").map((v) => v.trim()) || [];

        specialization = {};
        headers.forEach((header, index) => {
          specialization[header] = values[index] || "";
        });
      } else {
        setConnectionMessage("❌ Dateiformat nicht unterstützt");
        setTestingConnection(false);
        return;
      }

      // Validate required fields
      const requiredFields = ["id", "name", "systemPrompt", "description"];
      const missingFields = requiredFields.filter(
        (field) => !specialization[field]
      );

      if (missingFields.length > 0) {
        setConnectionMessage(
          `❌ Erforderliche Felder fehlen: ${missingFields.join(", ")}`
        );
        setTestingConnection(false);
        return;
      }

      // Upload to backend
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const uploadUrl = `${apiUrl}/api/settings/specialization/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("specialization", JSON.stringify(specialization));

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(
          errorData.message ||
            `Upload fehlgeschlagen (Status: ${response.status})`
        );
      }

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      setConnectionMessage(
        `✅ ${file.name} erfolgreich hochgeladen! Agent wird neu gestartet...`
      );
      setConnectionStatus("success");

      // Auto-reload agent after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      console.error("❌ Spezialisierungs-Upload Fehler:", errorMessage);
      setConnectionMessage(`❌ Fehler: ${errorMessage}`);
      setConnectionStatus("error");
    } finally {
      setTestingConnection(false);
    }
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
        support: {
          ticketsEndpoint: credentials.supportTicketsEndpoint,
          perPage: credentials.supportPerPage,
          provider: credentials.supportProvider,
          cptSlug: credentials.supportCptSlug,
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
        {t("common.back")}
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
            {t("settings.title")}
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.88)",
              margin: "0",
            }}
          >
            {t("settings.subtitle")}
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
            {
              id: "connection",
              label: t("settings.tabs.connection"),
              color: "#3b82f6",
            },
            {
              id: "specialization",
              label: t("settings.tabs.specialization"),
              color: "#8b5cf6",
            },
            {
              id: "license",
              label: t("settings.tabs.license"),
              color: "#10b981",
            },
            {
              id: "social",
              label: t("settings.tabs.social"),
              color: "#f59e0b",
            },
            {
              id: "agentic",
              label: t("settings.tabs.agentic"),
              color: "#06b6d4",
            },
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

        {/* TAB 2: Shop-Verbindung */}
        {activeTab === "connection" && (
          <div>
            {loading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <h3>{t("settings.connection.loading")}</h3>
              </div>
            )}

            {!loading && (
              <>
                <h3>{t("settings.connection.setupHeader")}</h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    marginBottom: "30px",
                  }}
                >
                  {t("settings.connection.setupDescription")}
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
                      {t("settings.connection.wpCredentials")}
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        {t("settings.connection.wpUrl")}:
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
                        {t("settings.connection.wpUsername")}:
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
                        {t("settings.connection.wpAppPassword")}:
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
                        {t("settings.connection.wpPasswordHint")}
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
                      {t("settings.connection.wcApiKeys")}
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#ffffff",
                        }}
                      >
                        {t("settings.connection.wcApiUrl")}:
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
                        {t("settings.connection.wcConsumerKey")}
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
                        {t("settings.connection.wcConsumerSecret")}
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
                        {t("settings.connection.wcApiHint")}
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
                          {t("settings.connection.wcAuthMode")}
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
                          <option value="basic">
                            {t("settings.connection.wcAuthModeBasic")}
                          </option>
                          <option value="oauth">
                            {t("settings.connection.wcAuthModeOAuth")}
                          </option>
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
                          {t("settings.connection.wcTimeout")}
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
                    <h4 style={{ marginBottom: "15px" }}>
                      {t("settings.connection.redditApi")}
                    </h4>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        {t("settings.connection.redditClientId")}
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
                        {t("settings.connection.redditClientSecret")}
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
                        {t("settings.connection.smtpHost")}
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
                        {t("settings.connection.smtpPort")}
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
                        {t("settings.connection.smtpSecure")}
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
                        {t("settings.connection.smtpUser")}
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
                        {t("settings.connection.smtpPassword")}
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
                        {t("settings.connection.smtpFrom")}
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
                        {t("settings.connection.openaiApiKey")}
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
                        {t("settings.connection.openaiHint")}
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
                        {t("settings.connection.openaiModel")}
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
                        <option value="gpt-4o">
                          {t("settings.connection.modelGpt4o")}
                        </option>
                        <option value="gpt-4o-mini">
                          {t("settings.connection.modelGpt4oMini")}
                        </option>
                        <option value="gpt-4-turbo">
                          {t("settings.connection.modelGpt4Turbo")}
                        </option>
                        <option value="gpt-3.5-turbo">
                          {t("settings.connection.modelGpt35Turbo")}
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
                        {t("settings.connection.jobMode")}
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
                        <option value="once">
                          {t("settings.connection.jobModeOnce")}
                        </option>
                        <option value="interval">
                          {t("settings.connection.jobModeInterval")}
                        </option>
                      </select>
                      <small
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "12px",
                        }}
                      >
                        {t("settings.connection.jobModeHint")}
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
                        {t("settings.connection.jobInterval")}
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
                        {t("settings.connection.jobIntervalHint")}
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
                          {t("settings.connection.enableAnalytics")}
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
                          {t("settings.connection.enableAutoProducts")}
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
                          {t("settings.connection.enableEmailMarketing")}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Support Configuration */}
                  <div
                    style={{
                      background: "rgba(236, 72, 153, 0.12)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid rgba(236, 72, 153, 0.35)",
                    }}
                  >
                    <h4 style={{ marginBottom: "15px" }}>
                      🎟️ Support-Konfiguration
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        {t("settings.connection.supportTicketsEndpoint")}
                      </label>
                      <input
                        type="text"
                        placeholder="/wp-json/awesome-support/v1/tickets"
                        value={credentials.supportTicketsEndpoint || ""}
                        onChange={(e) =>
                          handleCredentialChange(
                            "supportTicketsEndpoint",
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
                        {t("settings.connection.supportEndpointHint")}
                      </small>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                        marginBottom: "15px",
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
                          {t("settings.connection.supportPerPage")}
                        </label>
                        <input
                          type="number"
                          value={credentials.supportPerPage ?? 0}
                          onChange={(e) =>
                            handleCredentialChange(
                              "supportPerPage",
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

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            color: "rgba(255,255,255,0.94)",
                          }}
                        >
                          {t("settings.connection.supportProvider")}
                        </label>
                        <select
                          value={credentials.supportProvider || "auto"}
                          onChange={(e) =>
                            handleCredentialChange(
                              "supportProvider",
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
                          <option value="auto">
                            {t("settings.connection.supportProviderAuto")}
                          </option>
                          <option value="awesome-support">
                            {t("settings.connection.supportProviderAwesome")}
                          </option>
                          <option value="wp-cpt">
                            {t("settings.connection.supportProviderWpCpt")}
                          </option>
                          <option value="woo-order-notes">
                            {t("settings.connection.supportProviderWooNotes")}
                          </option>
                          <option value="none">
                            {t("settings.connection.supportProviderNone")}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        {t("settings.connection.supportCptSlug")}
                      </label>
                      <input
                        type="text"
                        placeholder="wpas_ticket"
                        value={credentials.supportCptSlug || ""}
                        onChange={(e) =>
                          handleCredentialChange(
                            "supportCptSlug",
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
                        {t("settings.connection.supportCptHint")}
                      </small>
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
                        {t("settings.connection.connectionSuccess")}
                      </span>
                    ) : (
                      <span style={{ color: "#ef4444" }}>
                        {t("settings.connection.connectionFailed")}
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
                      ? t("settings.connection.testingConnection")
                      : t("settings.connection.testConnection")}
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
                    {saving
                      ? t("settings.connection.saving")
                      : t("settings.connection.saveConfiguration")}
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
                    {t("settings.connection.importConfig")}
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
            <h3>{t("settings.specialization.title")}</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              {t("settings.specialization.subtitle")}
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
                        {t("settings.specialization.active")}
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
                            {t("settings.specialization.activate")}
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
                {t("settings.specialization.uploadSection")}
              </h4>
              <p
                style={{ margin: "0 0 12px 0", color: "rgba(255,255,255,0.8)" }}
              >
                {t("settings.specialization.uploadDescription")}
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
                {t("settings.specialization.uploadButton")}
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
            <h3>{t("settings.license.title")}</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              {t("settings.license.subtitle")}
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
                  {t("settings.license.enterKey")}
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
                  {t("settings.license.keyHint")}
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
                  ? t("settings.license.activating")
                  : t("settings.license.activateLicense")}
              </button>
            </div>

            {/* Aktive Lizenzen */}
            <div style={{ marginTop: "40px" }}>
              <h4 style={{ marginBottom: "20px" }}>
                {t("settings.license.activeLicenses")}
              </h4>
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
            <h3>{t("settings.social.title")}</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              {t("settings.social.subtitle")}
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
                        ? t("settings.social.connected")
                        : t("settings.social.notConnected")}
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
                    {t("settings.social.accessToken")}
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
                    {t("settings.social.enabled")}
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
                        ? t("settings.social.connected")
                        : t("settings.social.notConnected")}
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
                    {t("settings.social.accessToken")}
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
                    {t("settings.social.facebookPageId")}
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
                    {t("settings.social.enabled")}
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
                        ? t("settings.social.connected")
                        : t("settings.social.notConnected")}
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
                    {t("settings.social.accessToken")}
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
                    {t("settings.social.instagramBusinessId")}
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
                    {t("settings.social.enabled")}
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
                        ? t("settings.social.connected")
                        : t("settings.social.notConnected")}
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
                    {t("settings.social.twitterApiKey")}
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
                    {t("settings.social.twitterApiSecret")}
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
                    {t("settings.social.enabled")}
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
                        ? t("settings.social.connected")
                        : t("settings.social.notConnected")}
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
                    {t("settings.social.accessToken")}
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
                    {t("settings.social.enabled")}
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
                        ? t("settings.social.connected")
                        : t("settings.social.notConnected")}
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
                    {t("settings.social.accessToken")}
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
                    {t("settings.social.youtubeChannelId")}
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
                    {t("settings.social.enabled")}
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
                {t("settings.social.guideTitle")}
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
                <li>{t("settings.social.guideStep1")}</li>
                <li>{t("settings.social.guideStep2")}ß</li>
                <li>{t("settings.social.guideStep3")}</li>
                <li>{t("settings.social.guideStep4")}</li>
                <li>{t("settings.social.guideStep5")}</li>
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
              {saving ? t("settings.social.saving") : t("settings.social.save")}
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
            <h3>{t("settings.agentic.title")}</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              {t("settings.agentic.subtitle")}
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
                    {t("settings.agentic.dashboardTitle")}
                  </h4>
                  <p
                    style={{
                      margin: "0",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "14px",
                    }}
                  >
                    {t("settings.agentic.dashboardDescription")}
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
                  {t("settings.agentic.toDashboard")}
                </button>
              </div>
            </div>

            {/* Loop Types */}
            <div style={{ marginTop: "30px" }}>
              <h4 style={{ marginBottom: "20px", color: "#e5e7eb" }}>
                {t("settings.agentic.availableLoops")}
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
                    name: t("settings.agentic.loopAnomalyName"),
                    desc: t("settings.agentic.loopAnomalyDesc"),
                    schedule: t("settings.agentic.loopAnomalySchedule"),
                  },
                  {
                    icon: "📈",
                    name: t("settings.agentic.loopProductName"),
                    desc: t("settings.agentic.loopProductDesc"),
                    schedule: t("settings.agentic.loopProductSchedule"),
                  },
                  {
                    icon: "💳",
                    name: t("settings.agentic.loopPaymentName"),
                    desc: t("settings.agentic.loopPaymentDesc"),
                    schedule: t("settings.agentic.loopPaymentSchedule"),
                  },
                  {
                    icon: "📊",
                    name: t("settings.agentic.loopAnalyticsName"),
                    desc: t("settings.agentic.loopAnalyticsDesc"),
                    schedule: t("settings.agentic.loopAnalyticsSchedule"),
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

            {/* Documentation tiles removed (private repo, central docs planned) */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
