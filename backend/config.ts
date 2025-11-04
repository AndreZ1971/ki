// config.ts
import dotenv from 'dotenv';
import path from 'path';

// .env laden BEVOR wir config erstellen
// __dirname ist in CommonJS verfügbar (TypeScript kompiliert zu CommonJS)
const envPaths = [
  path.resolve(__dirname, '.env'),           // backend/.env (local dev)
  path.resolve(__dirname, '../.env'),        // root/.env (docker)
  path.resolve(__dirname, '../.env.production')  // root/.env.production (prod)
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ [config.ts] .env geladen von: ${envPath}`);
    break;
  }
}

export interface Config {
  openAI: {
    apiKey: string | null;
    isAvailable: () => boolean;
  };
  woocommerce: {
    url: string | undefined;
    consumerKey: string | undefined;
    consumerSecret: string | undefined;
    isAvailable: () => boolean;
  };
}

// Config als Getter-Funktionen, damit sie zur Laufzeit ausgewertet werden
export const config: Config = {
  openAI: {
    get apiKey() {
      return process.env.OPENAI_API_KEY?.trim() || null;
    },
    isAvailable: () => !!process.env.OPENAI_API_KEY?.trim()
  },
  woocommerce: {
    get url() {
      return process.env.WOOCOMMERCE_URL;
    },
    get consumerKey() {
      return process.env.WOOCOMMERCE_CONSUMER_KEY;
    },
    get consumerSecret() {
      return process.env.WOOCOMMERCE_CONSUMER_SECRET;
    },
    isAvailable: () => !!(process.env.WOOCOMMERCE_URL && 
                         process.env.WOOCOMMERCE_CONSUMER_KEY && 
                         process.env.WOOCOMMERCE_CONSUMER_SECRET)
  }
};

// Beispiel: Verwende das config-Objekt in anderen Modulen.
// import { config } from './config';
// if (config.openAI.isAvailable()) {
//   console.log('✅ OpenAI verfügbar');
// } else {
//   console.log('⚠️ OpenAI nicht konfiguriert');
// }