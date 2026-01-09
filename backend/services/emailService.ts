// services/emailService.ts - Neutral & konfigurierbar
import nodemailer from 'nodemailer';
import { getConfig } from '@config';

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
    socketTimeout: 15000
  };
};

const emailConfig = buildEmailConfig();

console.log('🔧 Email Konfiguration geladen:', {
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user
});

const transporter = nodemailer.createTransport(emailConfig);

// Verbindung testen mit besserem Error Handling
transporter.verify(function(error, _success) {
  if (error) {
    console.log('❌ SMTP Verbindung fehlgeschlagen:', error.message);
    console.log('🔍 Details:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure
    });
  } else {
    console.log('✅ SMTP Server ist bereit');
    console.log('🔍 Verbunden zu:', emailConfig.host + ':' + emailConfig.port);
  }
});

export default transporter;