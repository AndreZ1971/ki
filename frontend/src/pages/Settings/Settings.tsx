import React, { useState } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Settings.css";
import { LoopScheduleEditor } from "../../components/LoopScheduleEditor";

type ScheduleConfig = Record<string, unknown>;

type LoopSchedules = Record<string, ScheduleConfig>;

type Specialization = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  isActive: boolean;
  image: string;
  features: string[];
  shopUrl?: string;
};

type ShopCredentials = {
  wpUrl: string;
  wpUsername: string;
  wpAppPassword: string;
  wcApiUrl: string;
  wcConsumerKey: string;
  wcConsumerSecret: string;
  wooAuthMode: string;
  wooTimeoutMs: number;
  openaiApiKey: string;
  openaiModel: string;
  jobMode: string;
  jobIntervalMs: number;
  enableAnalytics: boolean;
  enableAutoProducts: boolean;
  enableEmailMarketing: boolean;
  redditClientId: string;
  redditClientSecret: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
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
  supportTicketsEndpoint: string;
  supportPerPage: number;
  supportProvider: string;
  supportCptSlug: string;
  linkedinEnabled: boolean;
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinAccessToken: string;
  linkedinUrn: string;
  linkedinRefreshToken: string;
  facebookEnabled: boolean;
  facebookAccessToken: string;
  facebookPageId: string;
  twitterEnabled: boolean;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessTokenSecret: string;
  youtubeEnabled: boolean;
  youtubeClientId: string;
  youtubeClientSecret: string;
  youtubeRedirectUri: string;
  youtubeAccessToken: string;
  youtubeRefreshToken: string;
  youtubeChannelId: string;
};

const brandIcons: Record<string, JSX.Element> = {
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#instagram-gradient-settings)">
      <defs>
        <linearGradient id="instagram-gradient-settings" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FD5" />
          <stop offset="50%" stopColor="#FF543E" />
          <stop offset="100%" stopColor="#C837AB" />
        </linearGradient>
      </defs>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
    </svg>
  ),
  twitter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  ),
  youtube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
};

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
  supportTicketsEndpoint: "/wp-json/awesome-support/v1/tickets",
  supportPerPage: 20,
  supportProvider: "auto",
  supportCptSlug: "wpas_ticket",
  linkedinEnabled: false,
  linkedinClientId: "",
  linkedinClientSecret: "",
  linkedinAccessToken: "",
  linkedinUrn: "",
  linkedinRefreshToken: "",
  facebookEnabled: false,
  facebookAccessToken: "",
  facebookPageId: "",
  twitterEnabled: false,
  twitterApiKey: "",
  twitterApiSecret: "",
  twitterAccessToken: "",
  twitterAccessTokenSecret: "",
  youtubeEnabled: false,
  youtubeClientId: "",
  youtubeClientSecret: "",
  youtubeRedirectUri: "",
  youtubeAccessToken: "",
  youtubeRefreshToken: "",
  youtubeChannelId: "",
};

// Default Loop Schedules (Fallback falls API noch nicht geladen)
const defaultLoopSchedules: LoopSchedules = {
  "anomaly-detection": { enabled: true, type: "daily", time: "08:00" },
  "payment-recovery": { enabled: true, type: "interval", minutes: 30 },
  "product-performance": {
    enabled: true,
    type: "weekly",
    time: "10:00",
    weekdays: ["Monday", "Wednesday", "Friday"],
  },
  "analytics-insights": { enabled: true, type: "daily", time: "22:00" },
};

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "connection" | "specialization" | "subscription" | "social" | "agentic"
  >("connection");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Loop Schedule State
  const [loopSchedules, setLoopSchedules] = useState<LoopSchedules | null>(
    null
  );

  const handleDownloadConfig = async () => {
    setConnectionStatus("idle");
    setConnectionMessage("");

    try {
      const response = await fetch('/api/settings/connection/download');
      if (!response.ok) {
        throw new Error('Download fehlgeschlagen');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ari-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setConnectionStatus("success");
      setConnectionMessage(t("settings.connection.downloadSuccess"));
      setTimeout(() => {
        setConnectionMessage("");
        setConnectionStatus("idle");
      }, 3000);
    } catch {
      setConnectionStatus("error");
      setConnectionMessage(t("settings.connection.downloadError"));
    }
  };
  const [editingLoop, setEditingLoop] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const effectiveSchedules = loopSchedules || defaultLoopSchedules;

  const formatScheduleLabel = (loopType: string): string => {
    const config = effectiveSchedules[loopType];
    if (!config) return "—";

    if (config.type === "interval") {
      return t("settings.schedule.intervalLabel", { minutes: config.minutes });
    }

    if (config.type === "daily") {
      return t("settings.schedule.dailyLabel", { time: config.time });
    }

    if (config.type === "weekly") {
      const days = Array.isArray(config.weekdays) ? config.weekdays.join(", ") : "";
      return t("settings.schedule.weeklyLabel", {
        weekdays: days,
        time: config.time,
      });
    }

    return "—";
  };

  const handleOpenSchedule = async (loopType: string) => {
    // Wenn noch keine Schedules geladen wurden, lade sie jetzt
    if (!loopSchedules) {
      await loadLoopSchedules();
    }

    // Fallback auf Default, falls API fehlschlägt
    setLoopSchedules((prev) => prev || defaultLoopSchedules);
    setEditingLoop(loopType);
  };

  // Shop-Verbindungsdaten
  const [credentials, setCredentials] = useState<ShopCredentials>({
    ...defaultCredentials,
  });

  // Load credentials on mount
  React.useEffect(() => {
    loadCredentials();
    loadLoopSchedules();
    loadPurchasedSpecializations();
  }, []);

  const loadLoopSchedules = async () => {
    try {
      const response = await fetch(
        '/api/agent/monitoring/schedules'
      );
      if (!response.ok) throw new Error("Failed to load schedules");
      const data = await response.json();
      if (data.success) {
        setLoopSchedules(data.schedules);
      }
        } catch {
      // Silent failure
    }
  };

  const handleScheduleChange = (config: ScheduleConfig) => {
    if (!editingLoop || !loopSchedules) return;
    setLoopSchedules({
      ...loopSchedules,
      [editingLoop]: config,
    });
  };

  const handleSaveSchedule = async () => {
    if (!editingLoop || !loopSchedules) return;

    setSavingSchedule(true);
    try {
      const response = await fetch(
        `/api/agent/monitoring/schedules/${editingLoop}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loopSchedules[editingLoop]),
        }
      );

      if (!response.ok) throw new Error("Failed to save schedule");

      const data = await response.json();
      if (data.success) {
        setConnectionMessage(`✅ ${data.message}`);
        setConnectionStatus("success");
        setEditingLoop(null);
      }
    } catch {
      setConnectionMessage(t("settings.schedule.saveError"));
      setConnectionStatus("error");
    } finally {
      setSavingSchedule(false);
    }
  };

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
          linkedinClientId: data.socialMedia?.linkedin?.clientId || '',
          linkedinClientSecret: data.socialMedia?.linkedin?.clientSecret || '',
          linkedinAccessToken: data.socialMedia?.linkedin?.accessToken || "",
          linkedinUrn: data.socialMedia?.linkedin?.urn || '',
          linkedinRefreshToken: data.socialMedia?.linkedin?.refreshToken || "",
          facebookEnabled: data.socialMedia?.facebook?.enabled ?? false,
          facebookAccessToken: data.socialMedia?.facebook?.accessToken || "",
          facebookPageId: data.socialMedia?.facebook?.pageId || "",
          twitterEnabled: data.socialMedia?.twitter?.enabled ?? false,
          twitterApiKey: data.socialMedia?.twitter?.apiKey || "",
          twitterApiSecret: data.socialMedia?.twitter?.apiSecret || "",
          twitterAccessToken: data.socialMedia?.twitter?.accessToken || "",
          twitterAccessTokenSecret:
            data.socialMedia?.twitter?.accessTokenSecret || "",
          youtubeEnabled: data.socialMedia?.youtube?.enabled ?? false,
          youtubeClientId: data.socialMedia?.youtube?.clientId || '',
          youtubeClientSecret: data.socialMedia?.youtube?.clientSecret || '',
          youtubeRedirectUri: data.socialMedia?.youtube?.redirectUri || '',
          youtubeAccessToken: data.socialMedia?.youtube?.accessToken || "",
          youtubeRefreshToken: data.socialMedia?.youtube?.refreshToken || "",
          youtubeChannelId: data.socialMedia?.youtube?.channelId || "",
        };
        setCredentials({ ...defaultCredentials, ...mapped });
        setConnectionMessage(t("settings.connection.importSuccess"));
      } catch {
        setConnectionMessage(t("settings.connection.importError"));
      }
    };
    reader.readAsText(file);
  };

  // Verfügbare Spezialisierungen
  const [specializations] = useState<Specialization[]>([
    {
      id: "109026",
      name: "Digitale Produkte & Kurse - Der Mentor",
      description:
        "Digitale Produkte & Kurse",
      price: 99,
      icon: "",
      isActive: false,
      image:
        '/images/dermentor.png',
      shopUrl:
        "https://kaufe-es.eu/index.php/product/digitale-produkte-kurse-der-mentor/",
      features: [
        "DSGVO-konforme Produkttexte",
        "EU-rechtskonforme Beschreibungen",
        "Cookie-Consent Templates",
        "Impressum & AGB Generator",
        "Datenschutz-Optimierung",
      ],
    },
    {
      id: "109078",
      name: "Reisebüro - Der Globetrotter",
      description: "Optimiert für Reise- und Tourismusbranche",
      price: 149,
      icon: "",
      isActive: false,
      image:
        '/images/Globetrotter.png',
      features: [
        "Reisebeschreibungen",
        "Hotel & Unterkunft Marketing",
        "Destination Content",
        "Buchungsoptimierung",
        "Review-Management",
      ],
    },
    {
      id: "109091",
      name: "Immobilien - Der Makler",
      description: "Spezialisiert auf Immobilien",
      price: 129,
      icon: "",
      isActive: false,
      image:
        '/images/Makler.png',
      features: [
        "Technische Spezifikationen",
        "Material-Beschreibungen",
        "STL-File Handling",
        "Custom-Order Workflows",
        "Drucker-Kompatibilität",
      ],
    },
    {
      id: "109038",
      name: "Fashion & Mode - Der Stylist",
      description: "Mode und Bekleidungshandel",
      price: 119,
      icon: "",
      isActive: false,
      image:
        '/images/Stylist.png',
      features: [
        "Produkt-Styling Texte",
        "Größentabellen",
        "Material & Pflege",
        "Trend-Analysen",
        "Lookbook-Content",
      ],
    },
    {
      id: "109008",
      name: "Beauty & Kosmetik - Der Haut-Experte",
      description: "Pflege, Make-up und Wellness-Produkte",
      price: 109,
      icon: "",
      isActive: false,
      image:
        '/images/Experte.png',
      features: [
        "INCI-konforme Beschreibungen",
        "Hauttyp-Empfehlungen",
        "Routine-Vorschläge",
        "Social Media Hooks",
        "Gift Guide Texte",
      ],
    },
    {
      id: "109052",
      name: "Nahrungsergänzung & Fitness - Der Coach",
      description: "Equipment, Wearables und Supplements",
      price: 119,
      icon: "",
      isActive: false,
      image:
        '/images/Der%20Coach.png',
      features: [
        "Workout-Beschreibungen",
        "Material- und Größenberatung",
        "Zielgruppen-Tonality",
        "PDP-SEO Optimierung",
        "Upsell Bundles",
      ],
    },
    {
      id: "109104",
      name: "Technik & Elektronik - Der Tech-Guide",
      description: "Smartphones, Smart-Home und Zubehör",
      price: 139,
      icon: "",
      isActive: false,
      image:
        '/images/Guide.png',
      features: [
        "Technische Specs",
        "Vergleichstabellen",
        "Warranty-Hinweise",
        "Accessory Cross-Sell",
        "Setup-Guides",
      ],
    },
    {
      id: "109117",
      name: "Tierbedarf - Der Tierfreund",
      description: "Futter, Pflege und Zubehör für Haustiere",
      price: 99,
      icon: "",
      isActive: false,
      image:
        '/images/Tierfreund.png',
      features: [
        "Fütterungsempfehlungen",
        "Rasse-spezifische Hinweise",
        "Pflege-Tipps",
        "Abo-Modelle",
        "Safety-Hinweise",
      ],
    },
    {
      id: "109130",
      name: "Wein & Feinkost - Der Sommelier",
      description: "Delikatessen, Getränke und Meal Kits",
      price: 99,
      icon: "",
      isActive: false,
      image:
        '/images/Der%20Sommelier.png',
      features: [
        "Geschmacksprofile",
        "Pairing-Empfehlungen",
        "Lagerhinweise",
        "Rezept-Ideen",
        "Abo/Bundle Vorschläge",
      ],
    },
    {
      id: "109065",
      name: "Home & Living - Der Innenarchitekt",
      description: "Möbel, Deko und Haushaltswaren",
      price: 119,
      icon: "",
      isActive: false,
      image:
        '/images/Der%20Innenarchitekt.png',
      features: [
        "Stilwelten & Looks",
        "Material- & Pflegehinweise",
        "Maßangaben sauber erklärt",
        "Roomset Storytelling",
        "Cross-Selling Sets",
      ],
    },
    {
      id: "01",
      name: "",
      description: "",
      price: 0,
      icon: "",
      isActive: false,
      image:
        '/images/spaeter.png',
      features: [      
      ],
    },
    {
      id: "02",
      name: "",
      description: "",
      price: 0,
      icon: "",
      isActive: false,
      image:
        '/images/spaeter.png',
      features: [
      ],
    },    
  ]);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [purchasedSpecializations, setPurchasedSpecializations] = useState<Specialization[]>([]);

  const handleBack = () => {
    navigate("/");
  };

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        '/api/settings/connection'
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
    } catch {
      setConnectionMessage(
        "ℹ️ Ihr Agent ist noch nicht konfiguriert. Bitte füllen Sie alle Pflichtfelder aus, um die Verbindung herzustellen."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPurchasedSpecializations = async () => {
    try {
      const response = await fetch(
        '/api/specializations/list'
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.specializations) {
        setPurchasedSpecializations(data.specializations);
      }
        } catch {
      // Silent failure
    }
  };

  const handleSpecializationActivate = async (specId: string) => {
    try {
      const response = await fetch(
        '/api/specializations/activate',
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ specId }),
        }
      );
      
      if (!response.ok) {
        return;
      }

      // Reload list to update active state
      await loadPurchasedSpecializations();
        } catch {
      // Silent failure
    }
  };

  const handleSpecializationDelete = async (specId: string) => {
    if (!confirm(t("settings.subscription.confirmDelete"))) {
      return;
    }

    try {
      const response = await fetch(
        `/api/specializations/${specId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (!response.ok) {
        const data = await response.json();
        setConnectionMessage(data.error || t("error.deletionFailed"));
        return;
      }

      // Reload list
      await loadPurchasedSpecializations();
    } catch {
      setConnectionMessage(t("error.deletionFailed"));
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

    // Validate file type - only .ari-spec or .json (which must be .ari-spec format)
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["ari-spec", "json"].includes(fileExtension || "")) {
      setConnectionMessage(t("error.specializationFileInvalid"));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setConnectionMessage(t("error.specializationFileTooLarge"));
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

      try {
        specialization = JSON.parse(fileContent);
      } catch {
        setConnectionMessage(t("error.specializationFormatInvalid"));
        setTestingConnection(false);
        return;
      }

      // Validate ARI format (must have: format, version, issuer, data)
      if (
        !specialization.format ||
        !specialization.version ||
        !specialization.issuer ||
        !specialization.data
      ) {
        setConnectionMessage(t("error.specializationAriFormatInvalid"));
        setTestingConnection(false);
        return;
      }

      // Upload to backend
      const uploadUrl = '/api/specializations/upload';

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const responseData = (await response.json()) as { 
        success?: boolean;
        message?: string;
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        const errorDetails = responseData.error || responseData.message || `Status: ${response.status}`;
        throw new Error(
          `Upload fehlgeschlagen: ${errorDetails}`
        );
      }

      if (!responseData.success) {
        throw new Error(responseData.message || responseData.error || "Upload fehlgeschlagen");
      }

      setConnectionMessage(
        `✅ ${file.name} erfolgreich hochgeladen! Spezialisierung wird geladen...`
      );
      setConnectionStatus("success");

      // Reload specializations list instead of full page reload
      // This preserves the session and avoids redirect to password screen
      setTimeout(async () => {
        try {
          // Refresh specializations list
          const listResponse = await fetch('/api/specializations/list');
          if (listResponse.ok) {
            const listData = await listResponse.json();
            // Update UI with new specializations (trigger re-render)
            if (listData.success && listData.specializations) {
              setPurchasedSpecializations(listData.specializations);
            }
            setConnectionMessage(`✅ ${file.name} erfolgreich aktiviert!`);
            
            // Optional: Navigate to specializations tab or refresh that section
            // For now, just clear the upload state after a moment
            setTimeout(() => {
              setConnectionMessage("");
              setConnectionStatus("idle");
            }, 3000);
          } else {
            // If list fetch fails, fall back to page reload
            window.location.reload();
          }
        } catch (_err) {
          // On error, fall back to page reload
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Fehler";
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
        '/api/settings/connection/test',
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
    } catch {
      setConnectionStatus("error");
      setConnectionMessage(t("error.connectionBackendError"));
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
        socialMedia: {
          linkedin: {
            enabled: credentials.linkedinEnabled,
            clientId: credentials.linkedinClientId,
            clientSecret: credentials.linkedinClientSecret,
            accessToken: credentials.linkedinAccessToken,
            urn: credentials.linkedinUrn,
            refreshToken: credentials.linkedinRefreshToken,
          },
          facebook: {
            enabled: credentials.facebookEnabled,
            accessToken: credentials.facebookAccessToken,
            pageId: credentials.facebookPageId,
          },
          twitter: {
            enabled: credentials.twitterEnabled,
            apiKey: credentials.twitterApiKey,
            apiSecret: credentials.twitterApiSecret,
            accessToken: credentials.twitterAccessToken,
            accessTokenSecret: credentials.twitterAccessTokenSecret,
          },
          youtube: {
            enabled: credentials.youtubeEnabled,
            clientId: credentials.youtubeClientId,
            clientSecret: credentials.youtubeClientSecret,
            redirectUri: credentials.youtubeRedirectUri,
            accessToken: credentials.youtubeAccessToken,
            refreshToken: credentials.youtubeRefreshToken,
            channelId: credentials.youtubeChannelId,
          },
        },
      };
      const response = await fetch(
        '/api/settings/connection',
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
        setTimeout(() => {
          setConnectionMessage("");
          setConnectionStatus("idle");
        }, 3000);
      } else {
        throw new Error("Speichern fehlgeschlagen");
      }
    } catch {
      setConnectionStatus("error");
      setConnectionMessage("❌ Fehler beim Speichern der Konfiguration");
    } finally {
      setSaving(false);
    }
  };

  const _purchaseSpecialization = (spec: Specialization) => {
    alert(`🛒 Weiterleitung zum Kauf: ${spec.name} (${spec.price}€)`);
  };

  const getShopProductUrl = (spec: Specialization) =>
    `https://kaufe-es.eu/?post_type=product&p=${encodeURIComponent(spec.id)}`;

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
              id: "subscription",
              label: t("settings.tabs.subscription") || "Subscription",
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
                        placeholder="admin@example.com"
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
                        placeholder="noreply@example.com"
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

                  <button
                    onClick={handleDownloadConfig}
                    style={{
                      display: "inline-block",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                      border: "2px solid #10b981",
                      fontSize: "16px",
                    }}
                  >
                    {t("settings.connection.downloadConfig")}
                  </button>
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
                      cursor: "pointer",
                      boxShadow:
                        hoveredCard === spec.id
                          ? "0 18px 40px rgba(0,0,0,0.45)"
                          : "0 10px 25px rgba(0,0,0,0.2)",
                      transform:
                        hoveredCard === spec.id
                          ? "rotateY(180deg)"
                          : "rotateY(0deg)",
                    }}
                    onClick={() =>
                      window.open(
                        getShopProductUrl(spec),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
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
                        {spec.features.slice(0, 3).map((feature: string, idx: number) => (
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
                          <a
                            href={getShopProductUrl(spec)}
                            target="_blank"
                            rel="noopener noreferrer"
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
                              textDecoration: "none",
                              display: "inline-block",
                            }}
                          >
                            zum Shop
                          </a>
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
                  accept=".ari-spec,.json"
                  onChange={handleSpecializationUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: Subscription (Laufzeit) */}
        {activeTab === "subscription" && (
          <div>
            <h3>⏱️ {t("settings.subscription.title") || "Subscription & Laufzeit"}</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "30px" }}>
              {t("settings.subscription.subtitle") ||
                "Verwalte deine Container-Laufzeit und Spezialisierungen"}
            </p>

            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                padding: "30px",
                borderRadius: "12px",
                maxWidth: "600px",
              }}
            >
              {/* Profile Link */}
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", marginBottom: "20px" }}>
                {t("settings.subscription.profileLink") || "Verwalte deine Subscription in deinem Kundenprofil"}
              </p>
              <a
                href="https://kaufe-es.eu/index.php/mein-konto/wps_subscriptions/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  width: "100%",
                  padding: "15px",
                  textAlign: "center",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                {t("settings.subscription.openProfile") || "Profil öffnen"}
              </a>
              <small
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "12px",
                  display: "block",
                  textAlign: "center",
                }}
              >
                {t("settings.subscription.profileInfo") || "Dort siehst du alle deine Subscriptions und deren Laufzeit"}
              </small>
            </div>

            {/* Gekaufte Spezialisierungen */}
            {purchasedSpecializations.length > 0 && (
              <div style={{ marginTop: "40px" }}>
                <h4 style={{ marginBottom: "20px" }}>
                  {t("settings.subscription.purchasedTitle")}
                </h4>
                {purchasedSpecializations.map((spec) => (
                    <div
                      key={spec.id}
                      style={{
                        background: spec.isActive
                          ? "rgba(34, 197, 94, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                        border: spec.isActive
                          ? "2px solid #22c55e"
                          : "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "15px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "24px",
                              marginBottom: "8px",
                            }}
                          >
                            {spec.icon}
                          </div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              marginBottom: "5px",
                            }}
                          >
                            {spec.name}
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "rgba(255,255,255,0.7)",
                            }}
                          >
                            {spec.description}
                          </div>
                          {spec.features && spec.features.length > 0 && (
                            <div
                              style={{
                                marginTop: "12px",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                              }}
                            >
                              {spec.features.slice(0, 3).map((feature: string, i: number) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    background: spec.isActive
                                      ? "rgba(34, 197, 94, 0.2)"
                                      : "rgba(255, 255, 255, 0.1)",
                                    borderRadius: "12px",
                                    color: spec.isActive
                                      ? "#22c55e"
                                      : "rgba(255,255,255,0.6)",
                                  }}
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            alignItems: "flex-end",
                          }}
                        >
                          {spec.isActive ? (
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
                              {t("settings.subscription.active")}
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSpecializationActivate(spec.id)}
                                style={{
                                  background: "rgba(59, 130, 246, 0.8)",
                                  color: "white",
                                  border: "none",
                                  padding: "8px 20px",
                                  borderRadius: "20px",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(59, 130, 246, 1)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(59, 130, 246, 0.8)")
                                }
                              >
                                {t("settings.subscription.activate")}
                              </button>
                              <button
                                onClick={() => handleSpecializationDelete(spec.id)}
                                style={{
                                  background: "rgba(239, 68, 68, 0.8)",
                                  color: "white",
                                  border: "none",
                                  padding: "8px 20px",
                                  borderRadius: "20px",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 1)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 0.8)")
                                }
                              >
                                {t("settings.subscription.delete")}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
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
                  <span style={{ marginRight: "15px", color: "#0077B5" }}>
                    {brandIcons.linkedin}
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
                    {t("settings.social.clientId")}
                  </label>
                  <input
                    type="text"
                    placeholder="LinkedIn Client ID"
                    value={credentials.linkedinClientId}
                    onChange={(e) =>
                      handleCredentialChange(
                        "linkedinClientId",
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
                    {t("settings.social.clientSecret")}
                  </label>
                  <input
                    type="password"
                    placeholder="LinkedIn Client Secret"
                    value={credentials.linkedinClientSecret}
                    onChange={(e) =>
                      handleCredentialChange(
                        "linkedinClientSecret",
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
                    {t("settings.social.linkedinUrn")}
                  </label>
                  <input
                    type="text"
                    placeholder="urn:li:organization:..."
                    value={credentials.linkedinUrn}
                    onChange={(e) =>
                      handleCredentialChange("linkedinUrn", e.target.value)
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
                  <span style={{ marginRight: "15px", color: "#1877F2" }}>
                    {brandIcons.facebook}
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
                    {t("settings.social.youtubeClientId")}
                  </label>
                  <input
                    type="text"
                    placeholder="YouTube Client ID"
                    value={credentials.youtubeClientId}
                    onChange={(e) =>
                      handleCredentialChange("youtubeClientId", e.target.value)
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
                    {t("settings.social.youtubeClientSecret")}
                  </label>
                  <input
                    type="password"
                    placeholder="YouTube Client Secret"
                    value={credentials.youtubeClientSecret}
                    onChange={(e) =>
                      handleCredentialChange(
                        "youtubeClientSecret",
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
                    {t("settings.social.youtubeClientId")}
                  </label>
                  <input
                    type="text"
                    placeholder="YouTube Client ID"
                    value={credentials.youtubeClientId}
                    onChange={(e) =>
                      handleCredentialChange("youtubeClientId", e.target.value)
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
                    {t("settings.social.youtubeClientSecret")}
                  </label>
                  <input
                    type="password"
                    placeholder="YouTube Client Secret"
                    value={credentials.youtubeClientSecret}
                    onChange={(e) =>
                      handleCredentialChange("youtubeClientSecret", e.target.value)
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
                    {t("settings.social.youtubeClientId")}
                  </label>
                  <input
                    type="text"
                    placeholder="YouTube Client ID"
                    value={credentials.youtubeClientId}
                    onChange={(e) =>
                      handleCredentialChange("youtubeClientId", e.target.value)
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
                  <span style={{ marginRight: "15px", color: "#000000" }}>
                    {brandIcons.twitter}
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
                    {t("settings.social.twitterAccessToken")}
                  </label>
                  <input
                    type="password"
                    placeholder="Twitter Access Token"
                    value={credentials.twitterAccessToken}
                    onChange={(e) =>
                      handleCredentialChange("twitterAccessToken", e.target.value)
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
                    {t("settings.social.twitterAccessTokenSecret")}
                  </label>
                  <input
                    type="password"
                    placeholder="Twitter Access Token Secret"
                    value={credentials.twitterAccessTokenSecret}
                    onChange={(e) =>
                      handleCredentialChange("twitterAccessTokenSecret", e.target.value)
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
                  <span style={{ marginRight: "15px", color: "#FF0000" }}>
                    {brandIcons.youtube}
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
                    {t("settings.social.youtubeClientId")}
                  </label>
                  <input
                    type="text"
                    placeholder="YouTube Client ID"
                    value={credentials.youtubeClientId}
                    onChange={(e) =>
                      handleCredentialChange("youtubeClientId", e.target.value)
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
                    {t("settings.social.youtubeClientSecret")}
                  </label>
                  <input
                    type="password"
                    placeholder="YouTube Client Secret"
                    value={credentials.youtubeClientSecret}
                    onChange={(e) =>
                      handleCredentialChange(
                        "youtubeClientSecret",
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
                    Redirect URI
                  </label>
                  <input
                    type="text"
                    placeholder="http://localhost:3000 oder https://deine-domain.de"
                    value={credentials.youtubeRedirectUri}
                    onChange={(e) =>
                      handleCredentialChange(
                        "youtubeRedirectUri",
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
                    {t("settings.social.youtubeRefreshToken")}
                  </label>
                  <input
                    type="password"
                    placeholder="YouTube Refresh Token"
                    value={credentials.youtubeRefreshToken}
                    onChange={(e) =>
                      handleCredentialChange(
                        "youtubeRefreshToken",
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
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        '/api/auth/youtube',
                        "_blank",
                        "noopener"
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "10px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    YouTube verbinden
                  </button>
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
                    loopType: "anomaly-detection" as const,
                  },
                  {
                    icon: "📈",
                    name: t("settings.agentic.loopProductName"),
                    desc: t("settings.agentic.loopProductDesc"),
                    loopType: "product-performance" as const,
                  },
                  {
                    icon: "💳",
                    name: t("settings.agentic.loopPaymentName"),
                    desc: t("settings.agentic.loopPaymentDesc"),
                    loopType: "payment-recovery" as const,
                  },
                  {
                    icon: "📊",
                    name: t("settings.agentic.loopAnalyticsName"),
                    desc: t("settings.agentic.loopAnalyticsDesc"),
                    loopType: "analytics-insights" as const,
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
                        marginBottom: "12px",
                      }}
                    >
                      ⏱️ {formatScheduleLabel(loop.loopType)}
                      <button
                        onClick={() => handleOpenSchedule(loop.loopType)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background:
                            "linear-gradient(135deg, #06b6d4, #0891b2)",
                          border: "none",
                          borderRadius: "6px",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        ⚙️ Schedule anpassen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Schedule Editor Modal */}
              {editingLoop && loopSchedules && (
                <LoopScheduleEditor
                  loopType={editingLoop as any}
                  config={loopSchedules[editingLoop] as any}
                  onChange={(cfg: any) => handleScheduleChange(cfg)}
                  onClose={() => setEditingLoop(null)}
                  onSave={handleSaveSchedule}
                  saving={savingSchedule}
                />
              )}
            </div>

            {/* Documentation tiles removed (private repo, central docs planned) */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
