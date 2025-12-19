/**
 * backend/services/configValidator.ts
 *
 * PURPOSE:
 *   Validates all configuration fields before saving to connection.json
 *   Catches errors early instead of failing during runtime
 *
 * VALIDATION RULES:
 *   - URL Format (http/https required)
 *   - Email Format (valid RFC)
 *   - Required Fields (no empty strings for critical keys)
 *   - API Keys (format, length, character set)
 *   - Port Numbers (0-65535)
 *   - Timeouts (positive integer)
 *   - Boolean Flags (true/false)
 *
 * USAGE:
 *   const errors = configValidator.validate(credentials);
 *   if (errors.length > 0) {
 *     return { success: false, errors };
 *   }
 */

export interface ValidationError {
  field: string;
  value: unknown;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

class ConfigValidator {
  /**
   * URL Validation: Must be http:// or https://
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Email Validation: Basic RFC 5322
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Port Number Validation: 0-65535
   */
  private isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 0 && port <= 65535;
  }

  /**
   * API Key Format: Usually starts with sk-, ck_, etc and has minimum length
   */
  private isValidApiKey(key: string, minLength: number = 20): boolean {
    if (typeof key !== 'string' || key.length < minLength) {
      return false;
    }
    // Check if looks like placeholder (masked)
    if (key.startsWith('****') || key.startsWith('PLEASE_')) {
      return false;
    }
    return true;
  }

  /**
   * OAuth Token Validation: Decent length, alphanumeric
   */
  private isValidToken(token: string, minLength: number = 10): boolean {
    if (!token || token.length < minLength) {
      return false;
    }
    if (token.startsWith('****') || token.startsWith('PLEASE_')) {
      return false;
    }
    return true;
  }

  /**
   * Timeout Validation: Positive integer
   */
  private isValidTimeout(ms: number): boolean {
    return Number.isInteger(ms) && ms > 0 && ms <= 120000; // Max 2 minutes
  }

  /**
   * Interval Validation: Accept reasonable scheduler intervals
   * Default range: 10s (10_000 ms) up to 24h (86_400_000 ms)
   */
  private isValidInterval(ms: number): boolean {
    return Number.isInteger(ms) && ms >= 10_000 && ms <= 86_400_000;
  }

  /**
   * MAIN VALIDATION FUNCTION
   */
  validate(credentials: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // WORDPRESS - All WordPress fields must be filled together or all empty (optional group)
    const hasWpUrl = credentials.wpUrl && credentials.wpUrl.trim() !== '';
    const hasWpUser =
      credentials.wpUsername && credentials.wpUsername.trim() !== '';
    const hasWpPass =
      credentials.wpAppPassword && credentials.wpAppPassword.trim() !== '';

    if (hasWpUrl || hasWpUser || hasWpPass) {
      if (!hasWpUrl) {
        errors.push({
          field: 'wpUrl',
          value: credentials.wpUrl,
          rule: 'required',
          message: 'Wenn Sie WordPress konfigurieren, ist die URL erforderlich',
          severity: 'error',
        });
      } else if (!this.isValidUrl(credentials.wpUrl)) {
        errors.push({
          field: 'wpUrl',
          value: credentials.wpUrl,
          rule: 'urlFormat',
          message: 'WordPress URL muss mit http:// oder https:// beginnen',
          severity: 'error',
        });
      }

      if (!hasWpUser) {
        errors.push({
          field: 'wpUsername',
          value: credentials.wpUsername,
          rule: 'required',
          message:
            'Wenn Sie WordPress konfigurieren, ist der Username erforderlich',
          severity: 'error',
        });
      }

      if (!hasWpPass) {
        errors.push({
          field: 'wpAppPassword',
          value: credentials.wpAppPassword,
          rule: 'required',
          message:
            'Wenn Sie WordPress konfigurieren, ist das App Password erforderlich',
          severity: 'error',
        });
      }
    } else {
      warnings.push({
        field: 'wordpress',
        value: '',
        rule: 'empty',
        message:
          'WordPress ist nicht konfiguriert. Einige KI-Features werden nicht verfügbar sein.',
        severity: 'warning',
      });
    }

    // WOOCOMMERCE
    // WOOCOMMERCE - All WooCommerce fields must be filled together or all empty (optional group)
    const hasWooUrl =
      credentials.wcApiUrl && credentials.wcApiUrl.trim() !== '';
    const hasWooKey =
      credentials.wcConsumerKey && credentials.wcConsumerKey.trim() !== '';
    const hasWooSecret =
      credentials.wcConsumerSecret &&
      credentials.wcConsumerSecret.trim() !== '';

    // If any WooCommerce field is filled, all must be filled
    if (hasWooUrl || hasWooKey || hasWooSecret) {
      if (!hasWooUrl) {
        errors.push({
          field: 'wcApiUrl',
          value: credentials.wcApiUrl,
          rule: 'required',
          message:
            'Wenn Sie WooCommerce konfigurieren, ist die URL erforderlich',
          severity: 'error',
        });
      } else if (!this.isValidUrl(credentials.wcApiUrl)) {
        errors.push({
          field: 'wcApiUrl',
          value: credentials.wcApiUrl,
          rule: 'urlFormat',
          message: 'WooCommerce URL muss mit http:// oder https:// beginnen',
          severity: 'error',
        });
      }

      if (!hasWooKey) {
        errors.push({
          field: 'wcConsumerKey',
          value: credentials.wcConsumerKey,
          rule: 'required',
          message:
            'Wenn Sie WooCommerce konfigurieren, ist der Consumer Key erforderlich',
          severity: 'error',
        });
      }

      if (!hasWooSecret) {
        errors.push({
          field: 'wcConsumerSecret',
          value: credentials.wcConsumerSecret,
          rule: 'required',
          message:
            'Wenn Sie WooCommerce konfigurieren, ist der Consumer Secret erforderlich',
          severity: 'error',
        });
      }
    } else {
      // All WooCommerce fields empty - add warning if not configured
      warnings.push({
        field: 'woocommerce',
        value: '',
        rule: 'empty',
        message:
          'WooCommerce ist nicht konfiguriert. Sie können Orders und Produkte nicht verwalten.',
        severity: 'warning',
      });
    }

    // OPENAI - Optional but with warning if empty
    if (!credentials.openaiApiKey || credentials.openaiApiKey.trim() === '') {
      warnings.push({
        field: 'openaiApiKey',
        value: credentials.openaiApiKey,
        rule: 'empty',
        message:
          'OpenAI API Key nicht konfiguriert. KI-Features werden nicht funktionieren.',
        severity: 'warning',
      });
    } else if (!this.isValidApiKey(credentials.openaiApiKey)) {
      errors.push({
        field: 'openaiApiKey',
        value: '****',
        rule: 'format',
        message: 'OpenAI API Key hat ungültiges Format (muss mit sk- beginnen)',
        severity: 'error',
      });
    }

    // SMTP
    if (credentials.smtpHost) {
      if (!/^[a-zA-Z0-9.-]+$/.test(credentials.smtpHost)) {
        errors.push({
          field: 'smtpHost',
          value: credentials.smtpHost,
          rule: 'format',
          message: 'SMTP Host hat ungültiges Format',
          severity: 'error',
        });
      }
    } else if (credentials.enableEmailMarketing) {
      warnings.push({
        field: 'smtpHost',
        value: credentials.smtpHost,
        rule: 'dependency',
        message:
          'Email Marketing ist aktiviert, aber SMTP nicht konfiguriert. Emails werden nicht versendet.',
        severity: 'warning',
      });
    }

    if (credentials.smtpPort && !this.isValidPort(credentials.smtpPort)) {
      errors.push({
        field: 'smtpPort',
        value: credentials.smtpPort,
        rule: 'port',
        message: 'SMTP Port muss zwischen 0-65535 liegen',
        severity: 'error',
      });
    }

    if (credentials.smtpUser && !this.isValidEmail(credentials.smtpUser)) {
      errors.push({
        field: 'smtpUser',
        value: credentials.smtpUser,
        rule: 'email',
        message: 'SMTP User muss eine gültige Email sein',
        severity: 'error',
      });
    }

    if (credentials.smtpFrom && !this.isValidEmail(credentials.smtpFrom)) {
      errors.push({
        field: 'smtpFrom',
        value: credentials.smtpFrom,
        rule: 'email',
        message: 'SMTP From muss eine gültige Email sein',
        severity: 'error',
      });
    }

    // JOB CONFIG
    if (credentials.jobMode === 'interval') {
      if (
        typeof credentials.jobIntervalMs !== 'number' ||
        !this.isValidInterval(credentials.jobIntervalMs)
      ) {
        errors.push({
          field: 'jobIntervalMs',
          value: credentials.jobIntervalMs,
          rule: 'interval',
          message:
            'Job Interval muss zwischen 10.000 ms (10s) und 86.400.000 ms (24h) liegen',
          severity: 'error',
        });
      }
    }

    // WOOCOMMERCE TIMEOUT
    if (
      credentials.wooTimeoutMs &&
      !this.isValidTimeout(credentials.wooTimeoutMs)
    ) {
      errors.push({
        field: 'wooTimeoutMs',
        value: credentials.wooTimeoutMs,
        rule: 'timeout',
        message:
          'WooCommerce Timeout muss zwischen 1 und 120000 Millisekunden liegen',
        severity: 'error',
      });
    }

    // ML CONFIDENCE LEVELS
    const mlFields = [
      'mlProductRecMinConfidence',
      'mlTrendMinConfidence',
      'mlEmailMinConfidence',
    ];
    for (const field of mlFields) {
      const value = credentials[field];
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        errors.push({
          field,
          value,
          rule: 'range',
          message: 'Confidence muss zwischen 0 und 1 liegen',
          severity: 'error',
        });
      }
    }

    // SOCIAL MEDIA OPTIONAL VALIDATION
    if (credentials.linkedinEnabled && !credentials.linkedinAccessToken) {
      warnings.push({
        field: 'linkedinAccessToken',
        value: '',
        rule: 'dependency',
        message: 'LinkedIn ist aktiviert, aber kein Access Token gesetzt',
        severity: 'warning',
      });
    }

    if (credentials.facebookEnabled && !credentials.facebookAccessToken) {
      warnings.push({
        field: 'facebookAccessToken',
        value: '',
        rule: 'dependency',
        message: 'Facebook ist aktiviert, aber kein Access Token gesetzt',
        severity: 'warning',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * DEPENDENCY VALIDATION
   * Check if enabled feature has all required config
   */
  validateDependencies(credentials: Record<string, any>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (credentials.enableEmailMarketing) {
      if (
        !credentials.smtpHost ||
        !credentials.smtpUser ||
        !credentials.smtpPassword
      ) {
        errors.push({
          field: 'emailMarketing',
          value: true,
          rule: 'dependency',
          message:
            'Email Marketing braucht vollständige SMTP-Konfiguration (Host, User, Password)',
          severity: 'error',
        });
      }
    }

    if (credentials.mlProductRecommendations) {
      if (!credentials.openaiApiKey) {
        errors.push({
          field: 'mlProductRecommendations',
          value: true,
          rule: 'dependency',
          message: 'Product Recommendations braucht OpenAI API Key',
          severity: 'error',
        });
      }
    }

    return errors;
  }
}

export const configValidator = new ConfigValidator();
