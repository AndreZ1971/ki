import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../logger';

interface Translations {
  [key: string]: string | Translations;
}

interface LocaleCache {
  [locale: string]: Translations;
}

/**
 * Simple i18n Service for backend error messages
 * Uses the same locale files as the frontend
 */
class I18nService {
  private cache: LocaleCache = {};
  private defaultLocale = 'english';
  private localesPath = join(__dirname, '../../frontend/src/locales');

  /**
   * Load translations for a specific locale
   */
  private loadLocale(locale: string): Translations {
    if (this.cache[locale]) {
      return this.cache[locale];
    }

    try {
      const filePath = join(this.localesPath, `${locale}.json`);
      const content = readFileSync(filePath, 'utf-8');
      this.cache[locale] = JSON.parse(content);
      return this.cache[locale];
    } catch (error) {
      logger.warn(
        { locale, error },
        `Failed to load locale ${locale}, falling back to ${this.defaultLocale}`
      );
      
      // Fallback to default locale
      if (locale !== this.defaultLocale) {
        return this.loadLocale(this.defaultLocale);
      }
      
      return {};
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Translations, path: string): string | undefined {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Translate a key to the specified locale
   * @param key - Translation key in dot notation (e.g., 'error.noFileProvided')
   * @param locale - Target locale (default: 'english')
   * @param params - Parameters for string interpolation
   */
  translate(
    key: string,
    locale: string = this.defaultLocale,
    params?: Record<string, string | number>
  ): string {
    const translations = this.loadLocale(locale);
    let text = this.getNestedValue(translations, key);

    // Fallback to default locale if translation not found
    if (!text && locale !== this.defaultLocale) {
      const defaultTranslations = this.loadLocale(this.defaultLocale);
      text = this.getNestedValue(defaultTranslations, key);
    }

    // If still no translation, return the key
    if (!text) {
      logger.warn({ key, locale }, 'Translation key not found');
      return key;
    }

    // Replace parameters (simple {{param}} syntax)
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }
    }

    return text;
  }

  /**
   * Get locale from request headers
   * Supports: Accept-Language, X-Language, or defaults to english
   */
  getLocaleFromHeaders(headers: Record<string, unknown>): string {
    // Check X-Language header first
    const xLanguage = headers['x-language'];
    if (typeof xLanguage === 'string') {
      return this.normalizeLocale(xLanguage);
    }

    // Check Accept-Language header
    const acceptLanguage = headers['accept-language'];
    if (typeof acceptLanguage === 'string') {
      // Parse Accept-Language (e.g., "de-DE,de;q=0.9,en;q=0.8")
      const primaryLocale = acceptLanguage.split(',')[0].split('-')[0].trim();
      return this.normalizeLocale(primaryLocale);
    }

    return this.defaultLocale;
  }

  /**
   * Normalize locale code to our locale file names
   * en -> english, de -> german, es -> spanish, etc.
   */
  private normalizeLocale(locale: string): string {
    const localeMap: Record<string, string> = {
      en: 'english',
      de: 'german',
      es: 'spanish',
      fr: 'french',
      it: 'italian',
      pt: 'portuguese',
    };

    const normalized = locale.toLowerCase();
    return localeMap[normalized] || this.defaultLocale;
  }

  /**
   * Create a translator function bound to a specific locale
   */
  createTranslator(locale: string) {
    return (key: string, params?: Record<string, string | number>) => 
      this.translate(key, locale, params);
  }
}

// Export singleton instance
export const i18nService = new I18nService();
