// config.ts

import fs from 'fs';
import path from 'path';

// connection.json IMMER aus dem Backend-Quellverzeichnis laden (unabhängig von dist oder src)
const configPath = path.resolve(__dirname, '../connection.json');
let configData: any = {};
if (fs.existsSync(configPath)) {
  configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log(`✅ [config.ts] connection.json geladen von: ${configPath}`);
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
  // ...weitere Bereiche nach Bedarf
}


const config: Config = {
  openAI: configData.openAI || {},
  woocommerce: configData.woocommerce || {},
  wordpress: configData.wordpress || {},
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