// openai-helper.ts

import OpenAI from "openai";
import { openAIBreaker, openAIRetry, alertError } from '../error-handling';
import { getConfig } from '@config';
import { logger } from '../logger';

let openAIClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openAIClient) {
    const config = getConfig();
    const apiKey = config.openAI?.apiKey?.trim();
    if (!apiKey) {
      logger.error('OpenAI API Key missing in connection.json');
      throw new Error('OpenAI API Key nicht in connection.json konfiguriert');
    }
    logger.info({ keyPreview: apiKey.substring(0, 8) + '...' }, 'OpenAI client initialized');
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
  logger.debug({ operationName }, 'Starting OpenAI operation');
  try {
    const result = await openAIRetry.execute(() =>
      openAIBreaker.execute(operation)
    );
    logger.info({ operationName }, 'OpenAI operation successful');
    return result;
  } catch (_error) {
    logger.error({
      operationName,
      error: _error instanceof Error ? _error.message : String(_error),
      metadata
    }, 'OpenAI operation failed');
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
