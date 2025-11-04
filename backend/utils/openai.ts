// utils/openai.ts
import OpenAI from "openai";
import { openAIBreaker, openAIRetry, alertError } from '../error-handling';

let openAIClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openAIClient) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OpenAI API Key nicht konfiguriert');
    }
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
  try {
    return await openAIRetry.execute(() =>
      openAIBreaker.execute(operation)
    );
  } catch (_error) {
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