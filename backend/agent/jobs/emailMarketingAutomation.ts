// backend/agent/jobs/emailMarketingAutomation.ts
import { wooGet } from '../../tools/woo';
// Dynamische Shop-URL und Host-Label
import { getWooConfig } from '../../woocommerce/config';
const shopUrl: string = (getWooConfig()?.url) || process.env.WOOCOMMERCE_URL || 'https://example.com';
const base: string = String(shopUrl).replace(/\/$/, '');
const hostLabel: string = (() => { try { return new URL(shopUrl).host.replace(/^www\./,''); } catch { return 'example.com'; } })();

// Deutsche Email-Templates für DSGVO-Marketing
const GERMAN_EMAIL_TEMPLATES = {
  welcome: {
    subject: `🎉 Willkommen bei ${hostLabel} - Ihre DSGVO-Compliance Lösung`,
    template: `
<h1>Herzlich Willkommen!</h1>

<p>Vielen Dank für Ihr Interesse an unseren DSGVO-Lösungen!</p>

<p>Bei <strong>${hostLabel}</strong> helfen wir deutschen Unternehmen, <strong>einfach und rechtssicher DSGVO-compliant</strong> zu werden.</p>

<h2>🏆 Unsere Top-Produkte für Sie:</h2>
<ul>
  <li>✅ <strong>DSGVO Checklisten</strong> - Schritt-für-Schritt zur Compliance</li>
  <li>✅ <strong>Dokumentenvorlagen</strong> - Rechtssichere Musterverträge</li>
  <li>✅ <strong>Cookie-Consent Lösungen</strong> - Einfache Integration</li>
  <li>✅ <strong>Audit Services</strong> - Professionelle Analyse</li>
</ul>

<h2>🔐 Kostenloser DSGVO-Tipp:</h2>
<p>{tip}</p>

<p><strong>Starten Sie jetzt durch:</strong><br>
<a href="${base}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Zu unseren Produkten</a></p>

<p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung!</p>

<p>Beste Grüße<br>
Ihr Team von <strong>${hostLabel}</strong></p>

<hr>
<small>Sie erhalten diese Email, weil Sie sich für DSGVO-Lösungen interessieren. <a href="{unsubscribeLink}">Hier abbestellen</a>.</small>
    `
  },

  newsletter: {
    subject: "🔐 DSGVO-Newsletter: {month} Updates & Tipps",
    template: `
<h1>DSGVO-Newsletter {month}</h1>

<p>Hier sind Ihre monatlichen DSGVO-Updates und Expertentipps!</p>

<h2>📰 Aktuelle DSGVO-News:</h2>
<p>{newsUpdate}</p>

<h2>💡 Praxistipp des Monats:</h2>
<p>{monthlyTip}</p>

<h2>🚀 Neue Produkte für Sie:</h2>
{newProducts}

<h2>📊 Studie des Monats:</h2>
<p>{statistic}</p>

<p><strong>Alle Produkte entdecken:</strong><br>
<a href="${base}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Zum Shop</a></p>

<hr>
<small>Dieser Newsletter informiert Sie über DSGVO-Themen. <a href="{unsubscribeLink}">Hier abbestellen</a>.</small>
    `
  },

  productRecommendation: {
    subject: "🎯 Passende DSGVO-Lösung für Sie: {productName}",
    template: `
<h1>Wir haben die perfekte DSGVO-Lösung für Sie!</h1>

<p>Basierend auf Ihren Interessen möchten wir Ihnen dieses Produkt empfehlen:</p>

<div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h2>{productName}</h2>
  <p>{productDescription}</p>
  <p><strong>Preis: €{productPrice}</strong></p>
  <a href="{productLink}" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Jetzt entdecken</a>
</div>

<h2>💡 Warum dieses Produkt zu Ihnen passt:</h2>
<ul>
  <li>✅ {benefit1}</li>
  <li>✅ {benefit2}</li>
  <li>✅ {benefit3}</li>
</ul>

<p><strong>Limited Time Offer:</strong> Speziell für Newsletter-Abonnenten!</p>

<hr>
<small>Produktempfehlung basierend auf Ihren Interessen. <a href="{unsubscribeLink}">Keine Empfehlungen mehr erhalten</a>.</small>
    `
  }
};

// Deutsche DSGVO-Inhalte für Emails
const GERMAN_EMAIL_CONTENT = {
  tips: [
    "Führen Sie regelmäßig Datenschutz-Folgenabschätzungen durch - besonders bei neuen Verarbeitungstätigkeiten.",
    "Dokumentieren Sie alle Verarbeitungstätigkeiten lückenlos. Das ist Ihre beste Verteidigung bei Kontrollen.",
    "Schulen Sie Ihre Mitarbeiter mindestens einmal jährlich im Datenschutz - das senkt das Risiko von Verstößen.",
    "Setzen Sie auf Privacy by Design - bauen Sie Datenschutz von Anfang an in Ihre Prozesse ein."
  ],
  
  newsUpdates: [
    "Neue Bußgeldrichtlinien: Die Aufsichtsbehörden verschärfen die Kontrollen für 2024.",
    "EU-Datenschutzausschuss veröffentlicht neue Leitlinien zur KI-Verordnung und DSGVO.",
    "Bundesregierung plant Erweiterung des Kataloges meldepflichtiger Datenschutzverletzungen.",
    "OLG-Urteil: Cookie-Einwilligungen müssen aktiv erteilt werden - kein Pre-Ticking mehr erlaubt."
  ],
  
  monthlyTips: [
    "Überprüfen Sie Ihre AV-Verträge: Sind alle Dienstleister aktuell dokumentiert?",
    "Cookie-Consent-Check: Ist Ihre Einwilligungslösung noch aktuell und DSGVO-konform?",
    "Datenminimierung: Löschen Sie regelmäßig nicht mehr benötigte personenbezogene Daten.",
    "Notfallplan: Haben Sie einen Prozess für Datenschutzverletzungen etabliert?"
  ],
  
  statistics: [
    "Laut aktueller Studie haben nur 15% der KMU ihre DSGVO-Compliance vollständig umgesetzt.",
    "Die durchschnittlichen Bußgelder sind im letzten Jahr um 40% gestiegen.",
    "72% der Verbraucher achten beim Online-Shopping auf Datenschutz-Compliance.",
    "Unternehmen mit vollständiger DSGVO-Umsetzung haben 30% weniger Datenschutzvorfälle."
  ]
};

// ✅ ECHTE Email-Sender-Funktion via SMTP (connection.json)
import nodemailer from 'nodemailer';
import { getConfig } from '../../config';

const EMAIL_SERVICE = {
  send: async (to: string, subject: string, html: string) => {
    try {
      const config = getConfig();
      const smtpConfig = config.smtp;
      
      if (!smtpConfig?.host || !smtpConfig?.user) {
        console.warn('⚠️ SMTP nicht konfiguriert - Email wird nicht versendet');
        return { 
          success: false, 
          error: 'SMTP configuration missing',
          messageId: null
        };
      }

      // Erstelle SMTP-Transporter mit echten Credentials
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 465,
        secure: smtpConfig.secure !== false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password
        }
      });

      // Sende echte Email
      const info = await transporter.sendMail({
        from: smtpConfig.from || smtpConfig.user,
        to: to,
        subject: subject,
        html: html,
        replyTo: smtpConfig.from || smtpConfig.user
      });

      console.log(`✅ Email versendet an: ${to}`);
      console.log(`   Betreff: ${subject}`);
      console.log(`   Message-ID: ${info.messageId}`);
      
      return { 
        success: true, 
        messageId: info.messageId,
        to: to
      };
    } catch (error: any) {
      console.error(`❌ Fehler beim Email-Versand an ${to}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        messageId: null
      };
    }
  }
};

// Type Definitionen
// Entfernt: EmailCampaign Interface, da nicht verwendet

interface EmailResult {
  campaign: string;
  sent: number;
  failed: number;
  results: any[];
}

async function runWelcomeEmailCampaign() {
  console.log('👋 Starte Welcome Email Kampagne...\n');
  
  try {
    // Abrufen echte Abonnenten/Kunden aus WooCommerce
    const customersResponse = await wooGet('/customers', { per_page: 100 });
    const newSubscribers = Array.isArray(customersResponse) 
      ? customersResponse.map((c: any) => c.email).filter(Boolean)
      : [];
    
    if (newSubscribers.length === 0) {
      console.warn('⚠️ Keine Abonnenten in WooCommerce gefunden');
      return {
        campaign: 'welcome',
        sent: 0,
        failed: 0,
        results: []
      };
    }
    
    const tip = getRandomItem(GERMAN_EMAIL_CONTENT.tips);
    
    const emailResults = [];
    
    for (const subscriber of newSubscribers) {
      const emailHtml = GERMAN_EMAIL_TEMPLATES.welcome.template
        .replace('{tip}', tip)
        .replace('{unsubscribeLink}', `${base}/unsubscribe?email=${encodeURIComponent(subscriber)}`);
      
      try {
        const result = await EMAIL_SERVICE.send(
          subscriber,
          GERMAN_EMAIL_TEMPLATES.welcome.subject,
          emailHtml
        );
        
        emailResults.push(result);
        console.log(`✅ Welcome Email an ${subscriber} gesendet`);
        
      } catch (_error) {
        console.log(`❌ Fehler bei ${subscriber}: ${_error}`);
        emailResults.push({ success: false, to: subscriber, error: _error instanceof Error ? _error.message : 'Unknown error' });
      }
      
      // Kurze Pause zwischen Emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successful = emailResults.filter(r => r.success).length;
    
    console.log(`\n🎉 WELCOME EMAIL KAMPAGNE ABGESCHLOSSEN!`);
    console.log(`✅ ${successful}/${newSubscribers.length} Emails erfolgreich versendet`);
    
    return {
      campaign: 'welcome',
      sent: successful,
      failed: emailResults.length - successful,
      results: emailResults
    };
    
  } catch (_error) {
    console.error('❌ Fehler in Welcome Kampagne:', _error);
    return { campaign: 'welcome', sent: 0, failed: 0, results: [] };
  }
}

async function runNewsletterCampaign() {
  console.log('\n📰 Starte Newsletter Kampagne...\n');
  
  try {
    // Abrufen echte Abonnenten aus WooCommerce
    const customersResponse = await wooGet('/customers', { per_page: 100 });
    const subscribers = Array.isArray(customersResponse) 
      ? customersResponse.map((c: any) => c.email).filter(Boolean)
      : [];
    
    if (subscribers.length === 0) {
      console.warn('⚠️ Keine Abonnenten für Newsletter gefunden');
      return { campaign: 'newsletter', sent: 0, failed: 0, results: [] };
    }
    
    const currentMonth = new Date().toLocaleString('de-DE', { month: 'long' });
    const newsUpdate = getRandomItem(GERMAN_EMAIL_CONTENT.newsUpdates);
    const monthlyTip = getRandomItem(GERMAN_EMAIL_CONTENT.monthlyTips);
    const statistic = getRandomItem(GERMAN_EMAIL_CONTENT.statistics);
    
    // Neue Produkte für Newsletter aus WooCommerce
    const products = await wooGet('/products', { per_page: 10 }) as any[];
    const newProducts = Array.isArray(products) && products.length > 0
      ? products.slice(0, 2).map(p => 
          `<li><strong>${p.name}</strong> - ${p.short_description || p.description?.replace(/<[^>]*>/g, '').substring(0, 80) || 'Neues Produkt'}...</li>`
        ).join('')
      : '';
    
    const emailResults = [];
    
    for (const subscriber of subscribers) {
      const emailHtml = GERMAN_EMAIL_TEMPLATES.newsletter.template
        .replace('{month}', currentMonth)
        .replace('{newsUpdate}', newsUpdate)
        .replace('{monthlyTip}', monthlyTip)
        .replace('{newProducts}', newProducts ? `<ul>${newProducts}</ul>` : '<p>Keine neuen Produkte diesen Monat.</p>')
        .replace('{statistic}', statistic)
        .replace('{unsubscribeLink}', `${base}/unsubscribe?email=${encodeURIComponent(subscriber)}`);
      
      const subject = GERMAN_EMAIL_TEMPLATES.newsletter.subject.replace('{month}', currentMonth);
      
      try {
        const result = await EMAIL_SERVICE.send(subscriber, subject, emailHtml);
        emailResults.push(result);
        console.log(`✅ Newsletter an ${subscriber} gesendet`);
        
      } catch (_error) {
        console.log(`❌ Fehler bei ${subscriber}: ${_error}`);
        emailResults.push({ success: false, to: subscriber, error: _error instanceof Error ? _error.message : 'Unknown error' });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successful = emailResults.filter(r => r.success).length;
    
    console.log(`\n🎉 NEWSLETTER KAMPAGNE ABGESCHLOSSEN!`);
    console.log(`✅ ${successful}/${subscribers.length} Newsletter erfolgreich versendet`);
    
    return {
      campaign: 'newsletter',
      sent: successful,
      failed: emailResults.length - successful,
      results: emailResults
    };
    
  } catch (_error) {
    console.error('❌ Fehler in Newsletter Kampagne:', _error);
    return { campaign: 'newsletter', sent: 0, failed: 0, results: [] };
  }
}

async function runProductRecommendationCampaign() {
  console.log('\n🎯 Starte Produkt-Empfehlungs Kampagne...\n');
  
  try {
    // Abrufen echte Kunden und Produkte aus WooCommerce
    const customersResponse = await wooGet('/customers', { per_page: 100 });
    const targetedCustomers = Array.isArray(customersResponse)
      ? customersResponse.map((c: any) => c.email).filter(Boolean)
      : [];
    
    if (targetedCustomers.length === 0) {
      console.warn('⚠️ Keine Kunden für Empfehlungen gefunden');
      return { campaign: 'product_recommendation', sent: 0, failed: 0, results: [] };
    }
    
    const productsResponse = await wooGet('/products', { per_page: 10 });
    const products = Array.isArray(productsResponse) ? productsResponse : [];
    
    if (products.length === 0) {
      console.log('❌ Kein Produkt für Empfehlungen gefunden');
      return { campaign: 'product_recommendation', sent: 0, failed: 0, results: [] };
    }
    
    const targetProduct = products[0]; // Erstes Produkt als Empfehlung
    
    const benefits = [
      'Einfache Integration in bestehende Prozesse',
      '100% DSGVO-konform und rechtssicher',
      'Deutsche Rechtssprechung berücksichtigt'
    ];
    
    const emailResults = [];
    
    for (const customer of targetedCustomers) {
      const description = targetProduct.short_description 
        ? targetProduct.short_description 
        : (targetProduct.description ? targetProduct.description.replace(/<[^>]*>/g, '') : 'Neues Produkt');
      
      const emailHtml = GERMAN_EMAIL_TEMPLATES.productRecommendation.template
        .replace('{productName}', targetProduct.name)
        .replace('{productDescription}', description)
        .replace('{productPrice}', targetProduct.price || '49,99')
        .replace('{productLink}', `${base}/produkt/${targetProduct.slug}`)
        .replace('{benefit1}', benefits[0])
        .replace('{benefit2}', benefits[1])
        .replace('{benefit3}', benefits[2])
        .replace('{unsubscribeLink}', `${base}/unsubscribe?email=${encodeURIComponent(customer)}`);
      
      const subject = GERMAN_EMAIL_TEMPLATES.productRecommendation.subject
        .replace('{productName}', targetProduct.name);
      
      try {
        const result = await EMAIL_SERVICE.send(customer, subject, emailHtml);
        emailResults.push(result);
        console.log(`✅ Produkt-Empfehlung an ${customer} gesendet`);
        
      } catch (_error) {
        console.log(`❌ Fehler bei ${customer}: ${_error}`);
        emailResults.push({ success: false, to: customer, error: _error instanceof Error ? _error.message : 'Unknown error' });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successful = emailResults.filter(r => r.success).length;
    
    console.log(`\n🎯 PRODUKT-EMPFEHLUNGS KAMPAGNE ABGESCHLOSSEN!`);
    console.log(`✅ ${successful}/${targetedCustomers.length} Empfehlungen erfolgreich versendet`);
    console.log(`📦 Empfohlenes Produkt: "${targetProduct.name}"`);
    
    return {
      campaign: 'product_recommendation',
      sent: successful,
      failed: emailResults.length - successful,
      results: emailResults
    };
    
  } catch (_error) {
    console.error('❌ Fehler in Produkt-Empfehlungs Kampagne:', _error);
    return { campaign: 'product_recommendation', sent: 0, failed: 0, results: [] };
  }
}

function getRandomItem(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

// Hauptfunktion - Führt alle Email-Kampagnen aus
async function runEmailMarketingAutomation() {
  console.log('🚀 Starte Email-Marketing Automation...\n');
  
  const results: EmailResult[] = [];
  
  // 1. Welcome Emails
  results.push(await runWelcomeEmailCampaign());
  
  // 2. Newsletter
  results.push(await runNewsletterCampaign());
  
  // 3. Produkt-Empfehlungen
  results.push(await runProductRecommendationCampaign());
  
  // Gesamt-Ergebnis
  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 EMAIL-MARKETING AUTOMATION ABGESCHLOSSEN!');
  console.log(`📊 GESAMTERGEBNIS:`);
  console.log(`   ✅ ${totalSent} Emails erfolgreich versendet`);
  console.log(`   ❌ ${totalFailed} Emails fehlgeschlagen`);
  console.log(`   📧 ${results.length} Kampagnen durchgeführt`);
  
  results.forEach(result => {
    console.log(`   📋 ${result.campaign}: ${result.sent} erfolgreich`);
  });
  
  console.log('\n💡 In der echten Implementation:');
  console.log('   - Echte Email-Service Integration (SendGrid, Mailchimp)');
  console.log('   - WooCommerce Kunden-Datenbank');
  console.log('   - A/B Testing für Subject Lines');
  console.log('   - Performance Tracking & Analytics');
  
  return results;
}

// Hauptfunktion
async function main() {
  try {
    await runEmailMarketingAutomation();
  } catch (_error) {
    console.error('❌ Fehler in main:', _error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runEmailMarketingAutomation };