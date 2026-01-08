// config.ts

import fs from 'fs';
import path from 'path';

// connection.json laden - Mehrere Pfade versuchen
let configPath = '';
let configData: any = {};

// Debug: Zeige wo wir sind
console.log('[config.ts] __dirname:', __dirname);
console.log('[config.ts] process.cwd():', process.cwd());

// 1. Versuche: backend/connection.json (Entwicklung - im Backend Dir selbst)
const localPath = path.resolve(__dirname, './connection.json');
// 2. Versuche: ../connection.json (aus dist/)
const parentPath = path.resolve(__dirname, '../connection.json');
// 3. Versuche: CWD/connection.json
const cwdPath = path.resolve(process.cwd(), 'connection.json');
// 4. Versuche: CWD/backend/connection.json
const cwdBackendPath = path.resolve(process.cwd(), 'backend', 'connection.json');

const pathsToTry = [localPath, parentPath, cwdPath, cwdBackendPath];

console.log('[config.ts] Versuche folgende Pfade:');
pathsToTry.forEach(p => console.log(`  - ${p}`));

for (const tryPath of pathsToTry) {
  if (fs.existsSync(tryPath)) {
    configPath = tryPath;
    try {
      configData = JSON.parse(fs.readFileSync(tryPath, 'utf-8'));
      console.log(`✅ [config.ts] connection.json geladen von: ${configPath}`);
      console.log(
        '[config.ts] Geladene WooCommerce-Daten:',
        configData.woocommerce
      );
      console.log('[config.ts] Geladene WordPress-Daten:', configData.wordpress);
      console.log('[config.ts] Geladene OpenAI-Daten:', configData.openAI);
      // Debug: Zeige OpenAI API-Key
      if (configData.openAI && configData.openAI.apiKey) {
        console.log(
          `[config.ts] OpenAI API-Key gefunden: ${configData.openAI.apiKey.substring(0, 8)}...`
        );
      } else {
        console.warn('[config.ts] OpenAI API-Key NICHT gefunden!');
      }
      if (configData.reddit?.clientId) {
        console.log(
          `[config.ts] Reddit ClientID gefunden: ${configData.reddit.clientId.substring(0, 8)}...`
        );
      } else {
        console.warn('[config.ts] Reddit ClientID NICHT gefunden!');
      }
      break;
    } catch (error) {
      console.error(`❌ [config.ts] Fehler beim Parsing von ${tryPath}:`, error);
    }
  }
}

if (!configPath || Object.keys(configData).length === 0) {
  console.warn(
    '⚠️ [config.ts] connection.json nicht gefunden! Folgende Pfade wurden versucht:'
  );
  pathsToTry.forEach(p => console.warn(`   - ${p}`));
  console.warn('[config.ts] Fallback wird verwendet - viele Features funktionieren nicht!');
}

export interface Config {
  webhooks?: {
    linkedin?: string;
    facebook?: string;
    tiktok?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    // Erweiterte Social Properties für dynamische Konfiguration
    buffer?: string;
    facebookRedirect?: string;
    facebookSecret?: string;
    facebookPageAccessToken?: string;
    facebookPageId?: string;
    instagramBusinessAccountId?: string;
    tiktokAccessToken?: string;
    tiktokSecret?: string;
    tiktokRedirect?: string;
  };
  openAI?: {
    apiKey?: string;
    model?: string;
  };
  woocommerce?: {
    url?: string;
    consumerKey?: string;
    consumerSecret?: string;
    authMode?: 'basic' | 'query';
  };
  wordpress?: {
    url?: string;
    username?: string;
    appPassword?: string;
  };
  support?: {
    // Bevorzugter REST-Endpunkt für Support-Tickets. Kann relativ ("/wp-json/.../tickets") oder absolut sein.
    ticketsEndpoint?: string;
    // Anzahl Tickets pro Seite für REST-Aufruf
    perPage?: number;
    // Ticket-Provider: auto | awesome-support | wp-cpt | woo-order-notes | none
    provider?:
      | 'auto'
      | 'awesome-support'
      | 'wp-cpt'
      | 'woo-order-notes'
      | 'none';
    // Für wp-cpt: Slug des Ticket-CPT (z.B. 'wpas_ticket')
    cptSlug?: string;
    // Optional: Fallback auf Woo-Bestellnotizen als "Tickets" erlauben (default: false)
    allowOrderNotesFallback?: boolean;
  };
  job?: {
    // Ausführungsmodus: 'once' (einmalig) oder 'interval' (periodisch)
    mode?: 'once' | 'interval';
    // Intervall in Millisekunden (z.B. 900000 = 15 Minuten)
    intervalMs?: number;
  };
  features?: {
    // Produktanalytics aktivieren
    enableAnalytics?: boolean;
    // Automatische Produkterstellung aktivieren
    enableAutoProducts?: boolean;
    // E-Mail-Marketing aktivieren
    enableEmailMarketing?: boolean;
  };
  reddit?: {
    // Reddit OAuth Client ID
    clientId?: string;
    // Reddit OAuth Client Secret
    clientSecret?: string;
  };
  ml?: {
    // Machine Learning aktivieren
    enabled?: boolean;
    // Produktempfehlungen aktivieren
    productRecommendations?: boolean;
    // Trend-Forecast aktivieren
    trendForecasting?: boolean;
    // Dynamische Preisgestaltung aktivieren
    dynamicPricing?: boolean;
    // E-Mail-Optimierung aktivieren
    emailOptimization?: boolean;
    // Abwanderungsprognose aktivieren
    churnPrediction?: boolean;
    // Sentiment-Analyse aktivieren
    sentimentAnalysis?: boolean;
    // Betrugserkennung aktivieren
    fraudDetection?: boolean;
    // Minimum Confidence für Produktempfehlungen (0-1)
    productRecMinConfidence?: number;
    // Fallback auf nicht-KI Empfehlungen bei niedriger Confidence
    productRecFallback?: boolean;
    // Minimum Confidence für Trend-Forecast (0-1)
    trendMinConfidence?: number;
    // Fallback bei niedriger Trend-Confidence
    trendFallback?: boolean;
    // Minimum Confidence für E-Mail-Optimierung (0-1)
    emailMinConfidence?: number;
    // Fallback bei niedriger E-Mail-Confidence
    emailFallback?: boolean;
    // Standard-Versendzeit für optimierte E-Mails
    emailDefaultTime?: string;
    // Maximum Inferenz-Zeit in Millisekunden
    maxInferenceTime?: number;
    // ML-Ergebnisse cachen
    cacheResults?: boolean;
    // Cache TTL in Sekunden
    cacheTtl?: number;
  };
  regioning?: {
    regions?: Record<string, any>;
  };
  // ...weitere Bereiche nach Bedarf
  /**
   * SMTP-Konfiguration für E-Mail-Versand
   */
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
    from?: string;
  };
  /**
   * Webhook-URL für Slack-Notfallbenachrichtigungen
   */
  slackEmergencyWebhook?: string;
  /**
   * E-Mail-Adresse für Notfall-Alerts
   */
  emergencyAlertEmail?: string;
  /**
   * PagerDuty Integration Key
   */
  pagerDutyIntegrationKey?: string;
  /**
   * Basis-URL für interne API-Aufrufe (z.B. http://localhost:3000)
   */
  apiBaseUrl?: string;
}

const config: Config = {
  webhooks: configData.webhooks || configData.social?.webhooks || {},
  openAI: configData.openAI || {},
  woocommerce: configData.woocommerce || {},
  wordpress: configData.wordpress || {},
  support: configData.support || {},
  job: configData.job || {},
  features: configData.features || {},
  reddit: configData.reddit || {},
  ml: configData.ml || {},
  regioning: configData.regioning || {},
  smtp: configData.smtp || {},
  // ...weitere Bereiche nach Bedarf
  slackEmergencyWebhook: configData.slackEmergencyWebhook,
  emergencyAlertEmail: configData.emergencyAlertEmail,
  pagerDutyIntegrationKey: configData.pagerDutyIntegrationKey,
  apiBaseUrl: configData.apiBaseUrl,
};

/**
 * Lädt connection.json dynamisch neu (für Endpunkte, die aktuelle Konfiguration benötigen).
 * @returns Aktuelles Config-Objekt
 */
export function getConfig(): Config {
  try {
    const freshConfigPath = path.resolve(__dirname, '../connection.json');
    if (fs.existsSync(freshConfigPath)) {
      const freshData = JSON.parse(fs.readFileSync(freshConfigPath, 'utf-8'));
      return {
        webhooks: freshData.webhooks || freshData.social?.webhooks || {},
        openAI: freshData.openAI || {},
        woocommerce: freshData.woocommerce || {},
        wordpress: freshData.wordpress || {},
        support: freshData.support || {},
        job: freshData.job || {},
        features: freshData.features || {},
        reddit: freshData.reddit || {},
        ml: freshData.ml || {},
        regioning: freshData.regioning || {},
        smtp: freshData.smtp || {},
        apiBaseUrl: freshData.apiBaseUrl,
        slackEmergencyWebhook: freshData.slackEmergencyWebhook,
        emergencyAlertEmail: freshData.emergencyAlertEmail,
        pagerDutyIntegrationKey: freshData.pagerDutyIntegrationKey,
      };
    }
    console.warn(
      '[getConfig] connection.json nicht gefunden, nutze statische Config'
    );
    return config;
  } catch (error) {
    console.error('[getConfig] Fehler beim Laden:', error);
    return config;
  }
}

export default config;

// Beispiel: Verwende das config-Objekt in anderen Modulen.
// import { config } from './config';
// if (config.openAI.isAvailable()) {
//   console.log('✅ OpenAI verfügbar');
// } else {
//   console.log('⚠️ OpenAI nicht konfiguriert');
// }
