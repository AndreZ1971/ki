// services/emailService.ts - VOLLSTÄNDIG KORRIGIERT
import nodemailer from 'nodemailer';

// 🔥 EXPLIZITE KONFIGURATION - KEINE Umgebungsvariablen
const emailConfig = {
  host: 'inn.bitpalast.net',
  port: 465,
  secure: true,
  auth: {
    user: 'info@kaufe-es.eu',
    pass: '010871Z71612' // 🔥 PASSWORT DIREKT EINGESETZT
  },
  tls: {
    rejectUnauthorized: false
  },
  // 🔥 TIMEOUT EINSTELLUNGEN
  connectionTimeout: 10000, // 10 Sekunden
  greetingTimeout: 10000,
  socketTimeout: 15000
};

console.log('🔧 Email Konfiguration geladen:', {
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user,
  pass: '***' + emailConfig.auth.pass.slice(-3) // Nur letzte 3 Zeichen zeigen
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