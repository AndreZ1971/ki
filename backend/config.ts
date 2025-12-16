// config.ts

import fs from 'fs';
import path from 'path';

// connection.json IMMER aus dem Backend-Quellverzeichnis laden (unabhängig von dist oder src)
const configPath = path.resolve(__dirname, '../connection.json');
let configData: any = {};
if (fs.existsSync(configPath)) {
  configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log(`✅ [config.ts] connection.json geladen von: ${configPath}`);
  console.log('[config.ts] Geladene WooCommerce-Daten:', configData.woocommerce);
  console.log('[config.ts] Geladene WordPress-Daten:', configData.wordpress);
  console.log('[config.ts] Geladene OpenAI-Daten:', configData.openAI);
  // Debug: Zeige OpenAI API-Key
  if (configData.openAI && configData.openAI.apiKey) {
    console.log(`[config.ts] OpenAI API-Key gefunden: ${configData.openAI.apiKey.substring(0, 8)}...`);
  } else {
    console.warn('[config.ts] OpenAI API-Key NICHT gefunden!');
  }
} else {
  console.warn('⚠️ [config.ts] connection.json nicht gefunden! Bitte im aktuellen Arbeitsverzeichnis ablegen.');
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
    provider?: 'auto' | 'awesome-support' | 'wp-cpt' | 'woo-order-notes' | 'none';
    // Für wp-cpt: Slug des Ticket-CPT (z.B. 'wpas_ticket')
    cptSlug?: string;
    // Optional: Fallback auf Woo-Bestellnotizen als "Tickets" erlauben (default: false)
    allowOrderNotesFallback?: boolean;
  };
  // ...weitere Bereiche nach Bedarf
}


const config: Config = {
  webhooks: (configData.webhooks || configData.social?.webhooks || {}),
  openAI: configData.openAI || {},
  woocommerce: configData.woocommerce || {},
  wordpress: configData.wordpress || {},
  support: configData.support || {},
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