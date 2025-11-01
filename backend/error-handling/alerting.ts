// backend/error-handling/alerting.ts
/**
 * Alerting System für kritische Fehler
 * Unterstützt: Console, E-Mail, Webhooks, Slack
 */

import nodemailer from 'nodemailer';

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;              // Service/Component Name
  timestamp: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface AlertingOptions {
  channels: AlertChannel[];
  minSeverity?: AlertSeverity;  // Minimale Severity für Alerts
  rateLimit?: number;           // Max Alerts pro Minute
  aggregateWindow?: number;     // Zeit in ms für Alert-Aggregation
}

export interface AlertChannel {
  type: 'console' | 'email' | 'webhook' | 'slack';
  enabled: boolean;
  config?: any;
}

export class AlertingService {
  private readonly options: Required<AlertingOptions>;
  private alertCount = 0;
  private lastAlertTime = 0;
  private recentAlerts = new Map<string, Alert>();
  private emailTransporter?: nodemailer.Transporter;

  constructor(options: AlertingOptions) {
    this.options = {
      channels: options.channels,
      minSeverity: options.minSeverity || AlertSeverity.WARNING,
      rateLimit: options.rateLimit || 10,
      aggregateWindow: options.aggregateWindow || 60000 // 1 Minute
    };

    this.initializeChannels();
  }

  private initializeChannels(): void {
    const emailChannel = this.options.channels.find(c => c.type === 'email' && c.enabled);
    
    if (emailChannel?.config) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          host: emailChannel.config.host || process.env.SMTP_HOST,
          port: emailChannel.config.port || parseInt(process.env.SMTP_PORT || '587'),
          secure: emailChannel.config.secure || false,
          auth: {
            user: emailChannel.config.user || process.env.SMTP_USER,
            pass: emailChannel.config.pass || process.env.SMTP_PASS
          }
        });
      } catch (error) {
        console.error('[Alerting] Failed to initialize email transport:', error);
      }
    }
  }

  /**
   * Sendet Alert über konfigurierte Channels
   */
  async alert(
    severity: AlertSeverity,
    title: string,
    message: string,
    source: string,
    metadata?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    // Prüfe Severity-Filter
    if (!this.shouldAlert(severity)) {
      return;
    }

    // Rate Limiting
    if (!this.checkRateLimit()) {
      console.warn('[Alerting] Rate limit exceeded, alert suppressed');
      return;
    }

    const alert: Alert = {
      id: this.generateId(),
      severity,
      title,
      message,
      source,
      timestamp: new Date().toISOString(),
      metadata,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    };

    // Aggregation prüfen
    const aggregated = this.tryAggregate(alert);
    if (aggregated) {
      return;
    }

    // Sende über alle aktivierten Channels
    await Promise.allSettled(
      this.options.channels
        .filter(channel => channel.enabled)
        .map(channel => this.sendToChannel(channel, alert))
    );

    // Speichere für Aggregation
    this.recentAlerts.set(alert.id, alert);
    setTimeout(() => {
      this.recentAlerts.delete(alert.id);
    }, this.options.aggregateWindow);
  }

  /**
   * Convenience Methods
   */
  async info(title: string, message: string, source: string, metadata?: Record<string, any>): Promise<void> {
    await this.alert(AlertSeverity.INFO, title, message, source, metadata);
  }

  async warning(title: string, message: string, source: string, metadata?: Record<string, any>): Promise<void> {
    await this.alert(AlertSeverity.WARNING, title, message, source, metadata);
  }

  async error(title: string, message: string, source: string, error?: Error, metadata?: Record<string, any>): Promise<void> {
    await this.alert(AlertSeverity.ERROR, title, message, source, metadata, error);
  }

  async critical(title: string, message: string, source: string, error?: Error, metadata?: Record<string, any>): Promise<void> {
    await this.alert(AlertSeverity.CRITICAL, title, message, source, metadata, error);
  }

  private shouldAlert(severity: AlertSeverity): boolean {
    const severityOrder = {
      [AlertSeverity.INFO]: 0,
      [AlertSeverity.WARNING]: 1,
      [AlertSeverity.ERROR]: 2,
      [AlertSeverity.CRITICAL]: 3
    };

    return severityOrder[severity] >= severityOrder[this.options.minSeverity];
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    if (now - this.lastAlertTime > 60000) {
      // Neue Minute
      this.alertCount = 1;
      this.lastAlertTime = now;
      return true;
    }

    if (this.alertCount < this.options.rateLimit) {
      this.alertCount++;
      return true;
    }

    return false;
  }

  private tryAggregate(alert: Alert): boolean {
    // Suche ähnliche Alerts im Zeitfenster
    for (const existingAlert of this.recentAlerts.values()) {
      if (
        existingAlert.source === alert.source &&
        existingAlert.title === alert.title &&
        existingAlert.severity === alert.severity
      ) {
        console.log(`[Alerting] Alert aggregated: ${alert.title}`);
        return true;
      }
    }
    return false;
  }

  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    try {
      switch (channel.type) {
        case 'console':
          this.sendToConsole(alert);
          break;
        case 'email':
          await this.sendToEmail(alert, channel.config);
          break;
        case 'webhook':
          await this.sendToWebhook(alert, channel.config);
          break;
        case 'slack':
          await this.sendToSlack(alert, channel.config);
          break;
      }
    } catch (error) {
      console.error(`[Alerting] Failed to send to ${channel.type}:`, error);
    }
  }

  private sendToConsole(alert: Alert): void {
    const emoji = {
      [AlertSeverity.INFO]: 'ℹ️',
      [AlertSeverity.WARNING]: '⚠️',
      [AlertSeverity.ERROR]: '❌',
      [AlertSeverity.CRITICAL]: '🚨'
    };

    console.log(`\n${emoji[alert.severity]} [${alert.severity}] ${alert.title}`);
    console.log(`Source: ${alert.source}`);
    console.log(`Time: ${alert.timestamp}`);
    console.log(`Message: ${alert.message}`);
    
    if (alert.error) {
      console.log(`Error: ${alert.error.message}`);
      if (alert.error.stack) {
        console.log(`Stack: ${alert.error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
    }
    
    if (alert.metadata) {
      console.log('Metadata:', JSON.stringify(alert.metadata, null, 2));
    }
    console.log('');
  }

  private async sendToEmail(alert: Alert, config: any): Promise<void> {
    if (!this.emailTransporter) {
      console.warn('[Alerting] Email transport not configured');
      return;
    }

    const to = config?.to || process.env.ALERT_EMAIL_TO;
    if (!to) {
      console.warn('[Alerting] No email recipient configured');
      return;
    }

    const subject = `[${alert.severity}] ${alert.title}`;
    const html = this.formatEmailHtml(alert);

    await this.emailTransporter.sendMail({
      from: config?.from || process.env.ALERT_EMAIL_FROM || 'alerts@example.com',
      to,
      subject,
      html
    });

    console.log(`[Alerting] Email sent to ${to}`);
  }

  private formatEmailHtml(alert: Alert): string {
    const color = {
      [AlertSeverity.INFO]: '#0088cc',
      [AlertSeverity.WARNING]: '#ff9500',
      [AlertSeverity.ERROR]: '#ff3b30',
      [AlertSeverity.CRITICAL]: '#dc143c'
    };

    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="border-left: 4px solid ${color[alert.severity]}; padding-left: 20px;">
            <h2 style="color: ${color[alert.severity]};">[${alert.severity}] ${alert.title}</h2>
            <p><strong>Source:</strong> ${alert.source}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            <p><strong>Message:</strong></p>
            <p>${alert.message}</p>
            ${alert.error ? `
              <p><strong>Error:</strong></p>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${alert.error.message}</pre>
              ${alert.error.stack ? `<details><summary>Stack Trace</summary><pre>${alert.error.stack}</pre></details>` : ''}
            ` : ''}
            ${alert.metadata ? `
              <p><strong>Metadata:</strong></p>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(alert.metadata, null, 2)}</pre>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }

  private async sendToWebhook(alert: Alert, config: any): Promise<void> {
    const url = config?.url || process.env.ALERT_WEBHOOK_URL;
    if (!url) {
      console.warn('[Alerting] No webhook URL configured');
      return;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      },
      body: JSON.stringify(alert)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log(`[Alerting] Webhook sent to ${url}`);
  }

  private async sendToSlack(alert: Alert, config: any): Promise<void> {
    const webhookUrl = config?.webhookUrl || process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[Alerting] No Slack webhook URL configured');
      return;
    }

    const color = {
      [AlertSeverity.INFO]: '#0088cc',
      [AlertSeverity.WARNING]: '#ff9500',
      [AlertSeverity.ERROR]: '#ff3b30',
      [AlertSeverity.CRITICAL]: '#dc143c'
    };

    const fields: Array<{ title: string; value: string; short: boolean }> = [
      { title: 'Source', value: alert.source, short: true },
      { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: true }
    ];

    if (alert.error) {
      fields.push({ title: 'Error', value: alert.error.message, short: false });
    }

    const payload = {
      attachments: [{
        color: color[alert.severity],
        title: `[${alert.severity}] ${alert.title}`,
        text: alert.message,
        fields
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }

    console.log('[Alerting] Slack notification sent');
  }

  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Globale Alerting-Instanz
export const alerting = new AlertingService({
  channels: [
    { type: 'console', enabled: true },
    { type: 'email', enabled: !!process.env.SMTP_HOST, config: {} }
  ],
  minSeverity: process.env.NODE_ENV === 'production' 
    ? AlertSeverity.WARNING 
    : AlertSeverity.INFO,
  rateLimit: 10
});

// Convenience Exports
export const alertInfo = (title: string, message: string, source: string, metadata?: Record<string, any>) =>
  alerting.info(title, message, source, metadata);

export const alertWarning = (title: string, message: string, source: string, metadata?: Record<string, any>) =>
  alerting.warning(title, message, source, metadata);

export const alertError = (title: string, message: string, source: string, error?: Error, metadata?: Record<string, any>) =>
  alerting.error(title, message, source, error, metadata);

export const alertCritical = (title: string, message: string, source: string, error?: Error, metadata?: Record<string, any>) =>
  alerting.critical(title, message, source, error, metadata);
