// services/emailService.ts - Neutral & konfigurierbar
import nodemailer from 'nodemailer';
import { getConfig } from '@config';
import { logger } from '../logger';

// Baut die SMTP-Konfiguration aus connection.json (Fallback ENV für Rückwärtskompatibilität)
const buildEmailConfig = () => {
  const cfg = getConfig();
  const smtp = cfg.smtp || {};

  return {
    host: smtp.host || process.env.SMTP_HOST || 'smtp.example.com',
    port: smtp.port ?? Number(process.env.SMTP_PORT || 465),
    secure: smtp.secure ?? (process.env.SMTP_SECURE !== 'false'),
    auth: {
      user: smtp.user || process.env.SMTP_USER || 'noreply@example.com',
      pass: smtp.password || process.env.SMTP_PASS || ''
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  };
};

// Erstelle Transporter-Factory für dynamisches Neuladen
let transporterInstance: nodemailer.Transporter | null = null;

export const getTransporter = () => {
  if (!transporterInstance) {
    const emailConfig = buildEmailConfig();
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      logger.info({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: emailConfig.auth.user
      }, 'Email Konfiguration geladen');
    } else {
      logger.info({ host: emailConfig.host, port: emailConfig.port }, 'Email Konfiguration geladen');
    }

    transporterInstance = nodemailer.createTransport(emailConfig);

    // Verbindung testen mit besserem Error Handling
    transporterInstance.verify(function(error, _success) {
      if (error) {
        if (isDev) {
          logger.error({
            error: error.message,
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure
          }, 'SMTP Verbindung fehlgeschlagen');
        } else {
          logger.error({ error: error.message }, 'SMTP Verbindung fehlgeschlagen');
        }
      } else {
        logger.info('SMTP Server ist bereit');
        if (isDev) {
          logger.info({ host: emailConfig.host, port: emailConfig.port }, 'SMTP verbunden');
        }
      }
    });
  }
  return transporterInstance;
};

// Reload-Funktion für config-updates
export const reloadTransporter = () => {
  if (transporterInstance) {
    transporterInstance.close();
  }
  transporterInstance = null;
  return getTransporter();
};

// Verify-Funktion mit Timeout
export const verify = async (timeoutMs = 10000): Promise<boolean> => {
  const transporter = getTransporter();
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, timeoutMs);

    transporter.verify((error, _success) => {
      clearTimeout(timer);
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
};

// Default export für Rückwärtskompatibilität
const transporter = getTransporter();
export default transporter;