// config.ts

import fs from 'fs';
import path from 'path';

// connection.json IMMER aus dem Backend-Quellverzeichnis laden (unabhängig von dist oder src)
const configPath = path.resolve(__dirname, '../connection.json');
let configData: any = {};
if (fs.existsSync(configPath)) {
  configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
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
} else {
  console.warn(
    '⚠️ [config.ts] connection.json nicht gefunden! Bitte im aktuellen Arbeitsverzeichnis ablegen.'
  );
}

export interface Config {
  webhooks?: {
    linkedin?: string;
    facebook?: string;
    tiktok?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  openAI?: {
    apiKey?: string;
    model?: string;
  };
  woocommerce?: {
    url?: string;
    consumerKey?: string;
    consumerSecret?: string;
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
  // ...weitere Bereiche nach Bedarf
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
  // ...weitere Bereiche nach Bedarf
};

export default config;

// Beispiel: Verwende das config-Objekt in anderen Modulen.
// import { config } from './config';
// if (config.openAI.isAvailable()) {
//   console.log('✅ OpenAI verfügbar');
// } else {
//   console.log('⚠️ OpenAI nicht konfiguriert');
// }
