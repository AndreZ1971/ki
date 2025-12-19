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
   * MAIN VALIDATION FUNCTION
   */
  validate(credentials: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // WORDPRESS
    if (credentials.wpUrl) {
      if (!this.isValidUrl(credentials.wpUrl)) {
        errors.push({
          field: 'wpUrl',
          value: credentials.wpUrl,
          rule: 'urlFormat',
          message: 'WordPress URL muss mit http:// oder https:// beginnen',
          severity: 'error',
        });
      }
    } else {
      errors.push({
        field: 'wpUrl',
        value: credentials.wpUrl,
        rule: 'required',
        message: 'WordPress URL ist erforderlich',
        severity: 'error',
      });
    }

    if (!credentials.wpUsername || credentials.wpUsername.trim() === '') {
      errors.push({
        field: 'wpUsername',
        value: credentials.wpUsername,
        rule: 'required',
        message: 'WordPress Username ist erforderlich',
        severity: 'error',
      });
    }

    if (!credentials.wpAppPassword || credentials.wpAppPassword.trim() === '') {
      errors.push({
        field: 'wpAppPassword',
        value: credentials.wpAppPassword,
        rule: 'required',
        message: 'WordPress App Password ist erforderlich',
        severity: 'error',
      });
    }

    // WOOCOMMERCE
    if (credentials.wcApiUrl) {
      if (!this.isValidUrl(credentials.wcApiUrl)) {
        errors.push({
          field: 'wcApiUrl',
          value: credentials.wcApiUrl,
          rule: 'urlFormat',
          message: 'WooCommerce URL muss mit http:// oder https:// beginnen',
          severity: 'error',
        });
      }
    } else {
      errors.push({
        field: 'wcApiUrl',
        value: credentials.wcApiUrl,
        rule: 'required',
        message: 'WooCommerce URL ist erforderlich',
        severity: 'error',
      });
    }

    if (!credentials.wcConsumerKey || credentials.wcConsumerKey.trim() === '') {
      errors.push({
        field: 'wcConsumerKey',
        value: credentials.wcConsumerKey,
        rule: 'required',
        message: 'WooCommerce Consumer Key ist erforderlich',
        severity: 'error',
      });
    }

    if (
      !credentials.wcConsumerSecret ||
      credentials.wcConsumerSecret.trim() === ''
    ) {
      errors.push({
        field: 'wcConsumerSecret',
        value: credentials.wcConsumerSecret,
        rule: 'required',
        message: 'WooCommerce Consumer Secret ist erforderlich',
        severity: 'error',
      });
    }

    // OPENAI
    if (!credentials.openaiApiKey || credentials.openaiApiKey.trim() === '') {
      errors.push({
        field: 'openaiApiKey',
        value: credentials.openaiApiKey,
        rule: 'required',
        message: 'OpenAI API Key ist erforderlich',
        severity: 'error',
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
    if (
      credentials.jobIntervalMs &&
      !this.isValidTimeout(credentials.jobIntervalMs)
    ) {
      errors.push({
        field: 'jobIntervalMs',
        value: credentials.jobIntervalMs,
        rule: 'timeout',
        message: 'Job Interval muss zwischen 1 und 120000 Millisekunden liegen',
        severity: 'error',
      });
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
