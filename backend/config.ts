// config.ts
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

export const config: Config = {
  openAI: {
    apiKey: process.env.OPENAI_API_KEY?.trim() || null,
    isAvailable: () => !!process.env.OPENAI_API_KEY?.trim()
  },
  woocommerce: {
    url: process.env.WOOCOMMERCE_URL,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
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