// openaiHelper.ts

import OpenAI from "openai";
import { openAIBreaker, openAIRetry, alertError } from '../error-handling';
import { getConfig } from '@config';

let openAIClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openAIClient) {
    const config = getConfig();
    const apiKey = config.openAI?.apiKey?.trim();
    if (!apiKey) {
      console.error('❌ [OpenAI] API Key fehlt in connection.json!');
      throw new Error('OpenAI API Key nicht in connection.json konfiguriert');
    }
    console.log('✅ [OpenAI] Client initialisiert mit Key:', apiKey.substring(0, 8) + '...');
    openAIClient = new OpenAI({ apiKey, timeout: 120000 }); // 2 Minuten Timeout für GPT-4/DALL-E
  }
  return openAIClient;
}

/**
 * Wrapper für OpenAI API Calls mit Circuit Breaker & Retry Protection
 * Automatisches Retry bei Rate Limits (429) und Netzwerkfehlern
 */
export async function executeOpenAI<T>(
  operation: () => Promise<T>,
  operationName: string,
  metadata?: Record<string, unknown>
): Promise<T> {
  console.log(`🔄 [OpenAI] Starte Operation: ${operationName}`);
  try {
    const result = await openAIRetry.execute(() =>
      openAIBreaker.execute(operation)
    );
    console.log(`✅ [OpenAI] Operation erfolgreich: ${operationName}`);
    return result;
  } catch (_error) {
    console.error(`❌ [OpenAI] Operation fehlgeschlagen: ${operationName}`, {
      error: _error instanceof Error ? _error.message : String(_error),
      metadata
    });
    await alertError(
      'OpenAI API Failed',
      `Operation ${operationName} failed after retries`,
      'OpenAI',
      _error instanceof Error ? _error : new Error(String(_error)),
      metadata
    );
    throw _error;
  }
}
