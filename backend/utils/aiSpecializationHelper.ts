import { SpecializationService } from '../services/specializationService';
import { SpecializationContext } from '../types/specialization';
import { logger } from '../logger';

/**
 * AI-Helper für Spezialisierungs-Integration
 * Erweitert OpenAI-Prompts mit aktivem Spezialisierungs-Kontext
 */
export class AISpecializationHelper {
  private static activeContext: SpecializationContext | null = null;
  private static lastLoadTime = 0;
  private static CACHE_TTL = 60000; // 1 Minute Cache

  /**
   * Lädt die aktive Spezialisierung (mit Caching)
   */
  private static async loadActiveContext(userId: string = 'default'): Promise<SpecializationContext | null> {
    const now = Date.now();
    
    // Cache prüfen
    if (this.activeContext && (now - this.lastLoadTime) < this.CACHE_TTL) {
      return this.activeContext;
    }

    // Neu laden
    try {
      this.activeContext = await SpecializationService.getActiveSpecialization(userId);
      this.lastLoadTime = now;
      return this.activeContext;
    } catch (error) {
      logger.error('❌ Fehler beim Laden der aktiven Spezialisierung: ' + String(error));
      return null;
    }
  }

  /**
   * Erstellt erweiterte System-Messages mit Spezialisierungs-Kontext
   * 
   * @param baseSystemPrompt - Der Standard-System-Prompt der Anwendung
   * @param userId - User ID (default: 'default')
   * @returns Array von System-Messages für OpenAI
   */
  static async buildSystemMessages(
    baseSystemPrompt: string,
    userId: string = 'default'
  ): Promise<Array<{ role: 'system'; content: string }>> {
    const context = await this.loadActiveContext(userId);
    
    if (!context) {
      // Keine Spezialisierung aktiv - nur Base-Prompt
      return [{ role: 'system', content: baseSystemPrompt }];
    }

    // Kombiniere Base + Spezialisierung
    const messages: Array<{ role: 'system'; content: string }> = [];
    
    // 1. Base System Prompt
    messages.push({ role: 'system', content: baseSystemPrompt });
    
    // 2. Spezialisierungs-System-Prompt
    messages.push({
      role: 'system',
      content: `## AKTIVE SPEZIALISIERUNG: ${context.name}\n\n${context.systemPrompt}`
    });
    
    // 3. Kontext-Anweisungen
    if (context.contextInstructions.length > 0) {
      messages.push({
        role: 'system',
        content: `### ZUSÄTZLICHE KONTEXT-ANWEISUNGEN:\n${context.contextInstructions.map((instr, i) => `${i + 1}. ${instr}`).join('\n')}`
      });
    }

    logger.info(`✅ AI-Prompt erweitert mit Spezialisierung: ${context.name}`);
    return messages;
  }

  /**
   * Erweitert einen User-Prompt mit Spezialisierungs-Kontext
   * 
   * @param userPrompt - Original User-Prompt
   * @param userId - User ID
   * @returns Erweiterter User-Prompt
   */
  static async enhanceUserPrompt(
    userPrompt: string,
    userId: string = 'default'
  ): Promise<string> {
    const context = await this.loadActiveContext(userId);
    
    if (!context) {
      return userPrompt;
    }

    // Füge Kontext-Hinweis hinzu
    return `[Kontext: Spezialisierung "${context.name}" aktiv]\n\n${userPrompt}`;
  }

  /**
   * Prüft, ob eine Spezialisierung aktiv ist
   */
  static async hasActiveSpecialization(userId: string = 'default'): Promise<boolean> {
    const context = await this.loadActiveContext(userId);
    return context !== null;
  }

  /**
   * Gibt den Namen der aktiven Spezialisierung zurück
   */
  static async getActiveSpecializationName(userId: string = 'default'): Promise<string | null> {
    const context = await this.loadActiveContext(userId);
    return context?.name || null;
  }

  /**
   * Cache invalidieren (z.B. nach Aktivierung einer neuen Spezialisierung)
   */
  static invalidateCache(): void {
    this.activeContext = null;
    this.lastLoadTime = 0;
    logger.info('🔄 Spezialisierungs-Cache invalidiert');
  }

  /**
   * Erstellt eine komplette Message-Array für OpenAI-Calls
   * 
   * @param systemPrompt - Base System Prompt
   * @param userPrompt - User-Anfrage
   * @param conversationHistory - Optional: Bisherige Konversation
   * @param userId - User ID
   */
  static async buildOpenAIMessages(
    systemPrompt: string,
    userPrompt: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    userId: string = 'default'
  ): Promise<Array<{ role: string; content: string }>> {
    const systemMessages = await this.buildSystemMessages(systemPrompt, userId);
    const enhancedUserPrompt = await this.enhanceUserPrompt(userPrompt, userId);

    return [
      ...systemMessages,
      ...conversationHistory,
      { role: 'user', content: enhancedUserPrompt }
    ];
  }
}
