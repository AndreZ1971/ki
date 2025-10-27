// utils/openai.ts
import OpenAI from "openai";

let openAIClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openAIClient) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OpenAI API Key nicht konfiguriert');
    }
    openAIClient = new OpenAI({ apiKey });
  }
  return openAIClient;
}

// Verwendung:
try {
  const openai = getOpenAIClient();
  // ... AI-Funktionen nutzen
} catch (error) {
  if (error instanceof Error) {
    console.log('⚠️ OpenAI nicht verfügbar:', error.message);
  } else {
    console.log('⚠️ OpenAI nicht verfügbar:', String(error));
  }
}