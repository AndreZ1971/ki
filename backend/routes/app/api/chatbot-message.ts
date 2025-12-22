import { FastifyInstance } from 'fastify';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';

import { getConfig } from '@config';
import { getShopStats, getSystemHealth } from '../../../services/shopData';
import { getOpenAIClient, executeOpenAI } from '../../../utils/openai';

dotenv.config();

// Dynamischer Import für node-fetch (ESM in CommonJS)
const fetch = async (url: string, options?: any) => (await import('node-fetch')).default(url, options);


// WooCommerce-Client aus dynamischer Config
const getWooConfig = () => {
  const config = getConfig();
  const woo = config.woocommerce || {};
  return {
    url: woo.url || '',
    consumerKey: woo.consumerKey || '',
    consumerSecret: woo.consumerSecret || '',
    version: 'wc/v3' as const
  };
};

const wooCommerce = new WooCommerceRestApi(getWooConfig());
const apiBase = getConfig().apiBaseUrl || 'http://localhost:3000';

if (!getWooConfig().url || !getWooConfig().consumerKey || !getWooConfig().consumerSecret) {
  console.error('❌ WooCommerce Config fehlt: Bitte URL / ConsumerKey / ConsumerSecret setzen.');
}

export default async function chatbotMessageRoute(server: FastifyInstance) {
  server.post('/message', async (request, _reply) => {
    try {
      type ChatbotRequestBody = { message: string; context?: any; history?: { role: string; content: string }[]; userRole?: string };
      const body = request.body as ChatbotRequestBody;
      const { message, context, history, userRole } = body;
      // INTENT-KEYWORDS & Routing für interne Tools und Standard-Intents
      const emailKeywords = ['email', 'mail', 'nachricht', 'schreiben', 'senden', 'kontakt', 'kontaktieren', 'support'];
      const campaignKeywords = ['kampagne', 'newsletter', 'email kampagne', 'email marketing', 'automation', 'mailing', 'newsletter erstellen'];
      const dbKeywords = ['datenbank', 'database', 'sql', 'db', 'shopdatenbank'];
      const exportKeywords = ['export', 'daten exportieren', 'csv', 'excel', 'daten herunterladen'];
      const monitoringKeywords = ['monitoring', 'systemstatus', 'system health', 'überwachung', 'status', 'uptime'];
      const productKeywords = ['produkt', 'produkte', 'artikel', 'bestseller', 'sortiment', 'product', 'verkaufen sich nicht'];
      const orderKeywords = ['bestellung', 'order', 'verkauf', 'kauf', 'transaktion'];
      const customerKeywords = ['kunde', 'kunden', 'user', 'benutzer', 'account'];
      const automationKeywords = ['automation', 'automatisierung', 'workflow', 'prozess', 'regel'];
      const newsKeywords = [
        'was gibt es neues',
        'news',
        'status',
        'update',
        'aktuell',
        'dashboard',
        'kennzahlen',
        'shop',
        'bericht',
        'report',
        'zahlen',
        'umsatz',
        'orders',
        'kunden',
        'produkte'
      ];
      const lowerMsg = (message || '').toLowerCase();
      if (emailKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Nutze das interne E-Mail-Modul im Menü "Kommunikation", um E-Mails direkt aus dem System zu schreiben oder Vorlagen zu nutzen. Für E-Mail-Kampagnen steht dir das Modul "E-Mail Marketing Automation" zur Verfügung.' };
      }
      if (campaignKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Für E-Mail-Kampagnen und Newsletter nutze bitte das Modul "E-Mail Marketing Automation" im Shop. Dort kannst du Kampagnen planen, Vorlagen nutzen und automatisierte Abläufe einrichten.' };
      }
      if (dbKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Alle Shop- und Kundendaten werden sicher in der internen Shop-Datenbank verwaltet. Ein direkter SQL-Zugriff ist nicht nötig – nutze die Shop-Module für Auswertungen und Exporte.' };
      }
      if (exportKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Du kannst Daten (z.B. Bestellungen, Produkte, Kunden) jederzeit über die Export-Funktion im jeweiligen Modul als CSV oder Excel-Datei herunterladen.' };
      }
      if (monitoringKeywords.some(k => lowerMsg.includes(k))) {
        const analysis = await summarizeMonitoring();
        return { success: true, reply: analysis };
      }
      if (productKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Produktverwaltung, Bestseller-Analysen und Sortimentsoptimierung findest du im Modul "Produkte". Dort kannst du neue Artikel anlegen, bearbeiten und auswerten.' };
      }
      if (orderKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Alle Bestellungen und Transaktionen findest du im Modul "Bestellungen". Dort kannst du Aufträge verwalten, exportieren und analysieren.' };
      }
      if (customerKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Kundenverwaltung, Segmentierung und CRM-Funktionen findest du im Modul "Kunden". Dort kannst du Kundendaten einsehen, bearbeiten und exportieren.' };
      }
      if (automationKeywords.some(k => lowerMsg.includes(k))) {
        return { success: true, reply: 'Automatisierungen und Workflows kannst du im Modul "Automation" einrichten. Damit lassen sich wiederkehrende Aufgaben und Prozesse effizient steuern.' };
      }
      const isNewsRequest = newsKeywords.some(k => lowerMsg.includes(k));

      // 🔍 A.R.I. SYSTEM-ANALYSE - Ari kann das gesamte System diagnostizieren
      
      // Payment-Probleme
      const paymentKeywords = ['payment', 'zahlung', 'bezahlung', 'storniert', 'cancelled', 'fehlgeschlagen', 'failed', 'stripe', 'paypal'];
      const isPaymentIssue = paymentKeywords.some(k => lowerMsg.includes(k));
      
      // Conversion-Probleme
      const conversionKeywords = ['conversion', 'verkauf', 'kunden kaufen nicht', 'niemand kauft', 'umsatz', 'sales'];
      const isConversionIssue = conversionKeywords.some(k => lowerMsg.includes(k));
      
      // Shop-Gesundheit
      const healthKeywords = ['gesundheit', 'health', 'check', 'analyse', 'system', 'status', 'probleme', 'fehler', 'was ist los'];
      const isHealthCheck = healthKeywords.some(k => lowerMsg.includes(k));

      // Generelle Fehlersuche / Selbstdiagnose
      const diagnosticKeywords = ['wo habe ich fehler', 'fehler finden', 'errors', 'diagnose', 'selbstcheck'];
      const isDiagnosticRequest = diagnosticKeywords.some(k => lowerMsg.includes(k));
      
      // Content/SEO Probleme
      const contentKeywords = ['content', 'inhalt', 'seo', 'traffic', 'besucher', 'ranking', 'google'];
      const isContentIssue = contentKeywords.some(k => lowerMsg.includes(k));
      
      // Produkt-Analyse
      const isProductIssue = productKeywords.some(k => lowerMsg.includes(k));

      // INTELLIGENTE ROUTING
      if (isPaymentIssue) {
        const analysis = await analyzePaymentIssues();
        return { success: true, reply: analysis };
      }
      
      if (isConversionIssue) {
        const analysis = await analyzeConversionIssues();
        return { success: true, reply: analysis };
      }
      
      if (isHealthCheck || (context && context.page === 'system-health')) {
        const analysis = await summarizeMonitoring();
        return { success: true, reply: analysis };
      }
      
      if (isContentIssue) {
        const analysis = await analyzeContentPerformance();
        return { success: true, reply: analysis };
      }
      
      if (isProductIssue) {
        const analysis = await analyzeProductPerformance();
        return { success: true, reply: analysis };
      }

      if (isDiagnosticRequest || (context && context.page === 'system-health')) {
        const analysis = await runQuickDiagnostics();
        return { success: true, reply: analysis };
      }

      if (isNewsRequest) {
        // Fetch shop metrics from dashboard endpoint
        const res = await fetch('http://localhost:3000/api/analytics/metrics/dashboard');
        const data = await res.json() as { success: boolean; data?: any; error?: string };
        if (data.success && data.data) {
          const m = data.data;
          // Motivierende, lebendige Antwort generieren
          const reply = `Hier sind die neuesten Shop-Kennzahlen für dich! 🚀\n\n` +
            `Umsatz heute: ${m.todaySales} €\n` +
            `Bestellungen heute: ${m.todayOrders}\n` +
            `Neue Kunden heute: ${m.todayCustomers}\n` +
            `Gesamtumsatz: ${m.totalSales} €\n` +
            `Gesamtbestellungen: ${m.totalOrders}\n` +
            `Gesamtkunden: ${m.totalCustomers}\n` +
            `Produkte im Shop: ${m.totalProducts}\n` +
            `Conversion Rate: ${m.conversionRate}%\n\n` +
            `Weiter so! Jeder Tag bringt neue Chancen. 💡`;
          return { success: true, reply };
        } else {
          return { success: false, error: 'Shop-Kennzahlen konnten nicht abgerufen werden.' };
        }
      }

      // OpenAI-Integration: Generative Antwort mit Shop- und Systemdaten
      try {
        const stats = await getShopStats();
        const health = await getSystemHealth();
        const systemPrompt = `Du bist ein KI-Shopassistent für das System A.R.I. Antworte immer bevorzugt mit Hinweisen auf interne Shop- und Systemfunktionen. Verweise NIEMALS auf externe Tools wie Gmail, Outlook, Thunderbird, Google Sheets, SQL-Clients oder Webmail. Nutze stattdessen folgende interne Tools:

      - E-Mails: Über das interne E-Mail-Modul im Menü "Kommunikation" (inkl. Vorlagen, Versand, Kampagnen)
      - E-Mail-Kampagnen: Im Modul "E-Mail Marketing Automation" (Planung, Versand, Automatisierung)
      - Datenbank: Alle Shopdaten sind intern, kein externer Zugriff nötig
      - Monitoring: Systemstatus und Fehler im Bereich "System-Health"
      - Produktverwaltung: Im Modul "Produkte"
      - Bestellungen: Im Modul "Bestellungen"
      - Kundenverwaltung: Im Modul "Kunden"
      - Automatisierungen: Im Modul "Automation"

      Shopname: ${stats.shopName}. Umsatz heute: ${stats.salesToday} EUR. Bestellungen: ${stats.ordersToday}. Produkte: ${stats.products}. Systemstatus: ${health.status}. CPU: ${health.cpu}%. RAM: ${health.memory}%. Antworte freundlich, präzise und auf Basis dieser Shopdaten.`;
        const userPrompt = `Frage: ${message}`;
        const openai = getOpenAIClient();
        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 400,
            temperature: 0.2
          }),
          'chatbot-gpt4o',
          { userRole, context }
        );
        const reply = completion.choices?.[0]?.message?.content || 'Entschuldigung, ich konnte dazu nichts finden.';
        return { success: true, reply };
      } catch (_err: any) {
        return {
          success: true,
          reply: 'Ich bin Ari, dein motivierender KI-Chatbot! Stelle mir Fragen zu deinem Shop, und ich liefere dir aktuelle News, Kennzahlen und Tipps.'
        };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
    }
  });
}

// 🔍 A.R.I. PAYMENT FEHLERANALYSE FUNKTION
async function analyzePaymentIssues(): Promise<string> {
  try {
    console.log('🔧 A.R.I. startet Payment-Fehleranalyse...');

    // 1. Stornierte Bestellungen der letzten 7 Tage abrufen
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ordersResponse = await wooCommerce.get('orders', {
      after: sevenDaysAgo.toISOString(),
      per_page: 50,
      status: 'cancelled'
    });

    const cancelledOrders = ordersResponse.data.filter((order: any) => 
      parseFloat(order.total) > 0
    );

    // 2. Fehlerdiagnose erstellen
    let diagnosis = '🔍 **A.R.I. PAYMENT-FEHLERANALYSE**\n\n';
    
    if (cancelledOrders.length === 0) {
      diagnosis += '✅ **GUTE NACHRICHTEN!**\n';
      diagnosis += 'Keine fehlgeschlagenen Zahlungen in den letzten 7 Tagen gefunden.\n\n';
      diagnosis += '💡 **EMPFEHLUNG:**\n';
      diagnosis += '• Backup-Zahlungsmethoden aktivieren (PayPal, Bank Transfer)\n';
      diagnosis += '• Regelmäßige Test-Transaktionen durchführen\n';
      diagnosis += '• Trust-Badges im Checkout platzieren\n';
      return diagnosis;
    }

    // 3. Problematische Bestellungen analysieren
    diagnosis += `🚨 **GEFUNDEN:** ${cancelledOrders.length} fehlgeschlagene Zahlungen\n\n`;

    // Payment Methods gruppieren
    const paymentMethods: { [key: string]: number } = {};
    const problemOrders: any[] = [];

    cancelledOrders.forEach((order: any) => {
      const method = order.payment_method || 'unbekannt';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
      
      if (problemOrders.length < 3) {
        problemOrders.push(order);
      }
    });

    diagnosis += '📊 **BETROFFENE ZAHLUNGSMETHODEN:**\n';
    Object.entries(paymentMethods).forEach(([method, count]) => {
      const icon = method === 'stripe' ? '💳' : method === 'woocommerce_payments' ? '🏦' : '❓';
      diagnosis += `${icon} ${method}: ${count} Fehler\n`;
    });

    diagnosis += '\n📦 **BEISPIEL-BESTELLUNGEN:**\n';
    problemOrders.forEach((order: any) => {
      diagnosis += `• Bestellung #${order.id}: €${order.total} via ${order.payment_method || 'unbekannt'}\n`;
      diagnosis += `  📅 ${new Date(order.date_created).toLocaleDateString('de-DE')} | 👤 ${order.billing?.email || 'Gast'}\n`;
    });

    // 4. Intelligente Diagnose & Lösungsvorschläge
    diagnosis += '\n\n🛠️ **SOFORT-FIXES:**\n\n';

    // Stripe-spezifische Probleme
    if (paymentMethods['stripe'] > 0) {
      diagnosis += '**🔴 STRIPE PROBLEM ERKANNT**\n';
      diagnosis += '1. Webhook-URL prüfen: `https://kaufe-es.eu/wc-api/stripe_webhook`\n';
      diagnosis += '2. Stripe Dashboard → Developers → Webhooks\n';
      diagnosis += '3. Events aktivieren: `payment_intent.succeeded`, `payment_intent.payment_failed`\n';
      diagnosis += '4. API Keys validieren (Test vs. Live Mode)\n';
      diagnosis += '5. Webhook Signing Secret in WooCommerce eintragen\n\n';
    }

    // WooCommerce Payments Probleme
    if (paymentMethods['woocommerce_payments'] > 0) {
      diagnosis += '**🔴 WOOCOMMERCE PAYMENTS PROBLEM**\n';
      diagnosis += '1. WordPress Admin → WooCommerce → Payments öffnen\n';
      diagnosis += '2. Konto-Status prüfen (Setup vollständig?)\n';
      diagnosis += '3. Bankkonto verifiziert?\n';
      diagnosis += '4. Test-Modus deaktivieren\n';
      diagnosis += '5. Mindestbetrag für Transaktionen checken\n\n';
    }

    // Allgemeine Empfehlungen
    diagnosis += '**🟡 ZUSÄTZLICHE EMPFEHLUNGEN:**\n';
    diagnosis += '• PayPal als Backup aktivieren (höhere Erfolgsquote)\n';
    diagnosis += '• Guest Checkout ermöglichen\n';
    diagnosis += '• Trust-Badges im Checkout (SSL, Käuferschutz)\n';
    diagnosis += '• Failed Payment Recovery Email einrichten\n';
    diagnosis += '• Test-Transaktion mit €1.00 durchführen\n\n';

    // 5. Kritikalität bewerten
    const failureRate = cancelledOrders.length;
    if (failureRate > 5) {
      diagnosis += '🚨 **KRITISCH:** Mehr als 5 Fehler in 7 Tagen!\n';
      diagnosis += '➡️ Sofortiges Handeln erforderlich. Umsatzverlust droht.\n';
    } else if (failureRate > 2) {
      diagnosis += '⚠️ **WARNUNG:** Regelmäßige Payment-Fehler erkannt.\n';
      diagnosis += '➡️ Konfiguration zeitnah überprüfen.\n';
    } else {
      diagnosis += '💡 **INFO:** Vereinzelte Fehler, aber beobachten.\n';
      diagnosis += '➡️ Präventive Maßnahmen empfohlen.\n';
    }

    diagnosis += '\n📞 **HILFE BENÖTIGT?**\n';
    diagnosis += '• Stripe Support: https://support.stripe.com\n';
    diagnosis += '• WooCommerce Support: https://woocommerce.com/contact-us/\n';
    diagnosis += '• A.R.I. kann detailliertere Logs analysieren (frag nach "debug logs")\n';

    return diagnosis;

  } catch (error: any) {
    console.error('❌ Fehler bei Payment-Analyse:', error.message);
    return '❌ Fehler bei der Payment-Analyse. Bitte prüfe die WooCommerce-Verbindung und versuche es erneut.';
  }
}

// 📊 CONVERSION-ANALYSE
async function analyzeConversionIssues(): Promise<string> {
  try {
    console.log('📊 Ari analysiert Conversion-Probleme...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [ordersResponse, productsResponse] = await Promise.all([
      wooCommerce.get('orders', { after: thirtyDaysAgo.toISOString(), per_page: 100, status: 'any' }),
      wooCommerce.get('products', { per_page: 100, status: 'publish' })
    ]);
    
    const orders = ordersResponse.data;
    const products = productsResponse.data;
    
    const freeDownloads = orders.filter((o: any) => parseFloat(o.total) === 0);
    const paidOrders = orders.filter((o: any) => parseFloat(o.total) > 0 && o.status === 'completed');
    
    let report = '📊 **ARI CONVERSION-ANALYSE**\n\n';
    
    report += `📈 **30-TAGE ÜBERSICHT:**\n`;
    report += `• Gesamt-Bestellungen: ${orders.length}\n`;
    report += `• Bezahlte Käufe: ${paidOrders.length}\n`;
    report += `• Kostenlose Downloads: ${freeDownloads.length}\n`;
    report += `• Conversion Rate: ${orders.length > 0 ? ((paidOrders.length / orders.length) * 100).toFixed(1) : 0}%\n\n`;
    
    // PROBLEME IDENTIFIZIEREN
    report += '🔴 **ERKANNTE PROBLEME:**\n\n';
    
    if (freeDownloads.length > paidOrders.length) {
      report += '**1. FREE-TO-PAID CONVERSION ZU NIEDRIG**\n';
      report += `   • ${freeDownloads.length} kostenlose Downloads\n`;
      report += `   • Nur ${paidOrders.length} bezahlte Käufe\n`;
      report += `   • 💡 Empfehlung: Upsell-Flow nach Freebie-Download\n\n`;
    }
    
    const productsWithoutSales = products.filter((p: any) => {
      const productOrders = orders.filter((o: any) => 
        o.line_items?.some((item: any) => item.product_id === p.id)
      );
      return productOrders.length === 0 && parseFloat(p.price) > 0;
    });
    
    if (productsWithoutSales.length > 0) {
      report += `**2. ${productsWithoutSales.length} PRODUKTE OHNE VERKÄUFE**\n`;
      productsWithoutSales.slice(0, 3).forEach((p: any) => {
        report += `   • ${p.name} (€${p.price})\n`;
      });
      report += `   • 💡 Empfehlung: Preise überprüfen, Beschreibungen optimieren\n\n`;
    }
    
    // LÖSUNGEN
    report += '🛠️ **SOFORT-MASSNAHMEN:**\n';
    report += '1. Post-Download Email mit Premium-Angebot einrichten\n';
    report += '2. Related Products im Checkout anzeigen\n';
    report += '3. Limited-Time Rabatt-Codes für Freebie-Downloader\n';
    report += '4. Exit-Intent Popup mit Special Offer\n';
    report += '5. Produktbeschreibungen mit Benefits statt Features\n\n';
    
    report += '📈 **ZIEL:** Conversion Rate von aktuell ' + 
      `${orders.length > 0 ? ((paidOrders.length / orders.length) * 100).toFixed(1) : 0}% auf mindestens 10% steigern!`;
    
    return report;
    
  } catch (error: any) {
    console.error('❌ Fehler bei Conversion-Analyse:', error.message);
    return '❌ Fehler bei der Conversion-Analyse.';
  }
}

// 🏥 SYSTEM HEALTH CHECK
async function performSystemHealthCheck(): Promise<string> {
  try {
    console.log('🏥 Ari führt System-Gesundheitscheck durch...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [ordersResponse, productsResponse, customersResponse] = await Promise.all([
      wooCommerce.get('orders', { after: sevenDaysAgo.toISOString(), per_page: 100, status: 'any' }),
      wooCommerce.get('products', { per_page: 100, status: 'publish' }),
      wooCommerce.get('customers', { per_page: 100 })
    ]);
    
    const orders = ordersResponse.data;
    const products = productsResponse.data;
    const customers = customersResponse.data;
    
    let report = '🏥 **A.R.I. SYSTEM-GESUNDHEITSCHECK**\n\n';
    
    // SYSTEM-STATUS
    report += '✅ **SYSTEM-STATUS:**\n';
    report += `• WooCommerce API: ✅ Verbunden\n`;
    report += `• Produkte im Shop: ${products.length}\n`;
    report += `• Aktive Kunden: ${customers.length}\n`;
    report += `• Bestellungen (7 Tage): ${orders.length}\n\n`;
    
    // KRITISCHE CHECKS
    const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled' && parseFloat(o.total) > 0);
    const failedOrders = orders.filter((o: any) => o.status === 'failed');
    const lowStockProducts = products.filter((p: any) => p.manage_stock && p.stock_quantity < 5);
    
    report += '🔍 **KRITISCHE CHECKS:**\n\n';
    
    if (cancelledOrders.length > 0) {
      report += `🔴 Payment-Probleme: ${cancelledOrders.length} stornierte Bestellungen\n`;
    } else {
      report += `✅ Payments: Keine Probleme erkannt\n`;
    }
    
    if (failedOrders.length > 0) {
      report += `🔴 Failed Orders: ${failedOrders.length}\n`;
    } else {
      report += `✅ Failed Orders: Keine\n`;
    }
    
    if (lowStockProducts.length > 0) {
      report += `⚠️ Niedriger Lagerbestand: ${lowStockProducts.length} Produkte\n`;
    } else {
      report += `✅ Lagerbestand: OK\n`;
    }
    
    // PERFORMANCE-SCORE
    let score = 100;
    if (cancelledOrders.length > 0) score -= 30;
    if (failedOrders.length > 0) score -= 20;
    if (lowStockProducts.length > 0) score -= 10;
    if (orders.length === 0) score -= 20;
    
    report += `\n🎯 **GESUNDHEITS-SCORE:** ${score}/100\n\n`;
    
    if (score >= 80) {
      report += '✅ System läuft gut! Weiter so.\n';
    } else if (score >= 60) {
      report += '⚠️ Einige Probleme erkannt. Bitte prüfen.\n';
    } else {
      report += '🚨 Kritische Probleme! Sofortiges Handeln erforderlich.\n';
    }
    
    report += '\n💡 Frage mich nach spezifischen Bereichen:\n';
    report += '• "Conversion Probleme"\n';
    report += '• "Payment Fehler"\n';
    report += '• "Produkt Performance"\n';
    report += '• "Content Analyse"\n';
    
    return report;
    
  } catch (error: any) {
    console.error('❌ Fehler bei Health Check:', error.message);
    return '❌ Fehler beim System-Gesundheitscheck.';
  }
}

// 📝 CONTENT PERFORMANCE ANALYSE
async function analyzeContentPerformance(): Promise<string> {
  try {
    console.log('📝 Ari analysiert Content-Performance...');
    
    const productsResponse = await wooCommerce.get('products', { per_page: 100, status: 'publish' });
    const products = productsResponse.data;
    
    let report = '📝 **ARI CONTENT-ANALYSE**\n\n';
    
    // Produkte ohne Beschreibung
    const noDescription = products.filter((p: any) => !p.description || p.description.length < 100);
    const noShortDesc = products.filter((p: any) => !p.short_description || p.short_description.length < 50);
    const noImages = products.filter((p: any) => !p.images || p.images.length === 0);
    
    report += '🔍 **CONTENT-QUALITÄT CHECK:**\n\n';
    
    if (noDescription.length > 0) {
      report += `⚠️ ${noDescription.length} Produkte ohne ausreichende Beschreibung\n`;
      noDescription.slice(0, 3).forEach((p: any) => {
        report += `   • ${p.name}\n`;
      });
      report += '\n';
    }
    
    if (noShortDesc.length > 0) {
      report += `⚠️ ${noShortDesc.length} Produkte ohne Kurzbeschreibung\n\n`;
    }
    
    if (noImages.length > 0) {
      report += `⚠️ ${noImages.length} Produkte ohne Bilder\n\n`;
    }
    
    if (noDescription.length === 0 && noShortDesc.length === 0 && noImages.length === 0) {
      report += '✅ Alle Produkte haben vollständige Beschreibungen und Bilder!\n\n';
    }
    
    report += '🛠️ **CONTENT-OPTIMIERUNG:**\n';
    report += '1. Verwende emotionale Benefits statt Features\n';
    report += '2. Füge Social Proof hinzu (Testimonials, Bewertungen)\n';
    report += '3. Optimiere für SEO (Keywords, Meta-Beschreibungen)\n';
    report += '4. Nutze hochwertige Produktbilder (min. 3 pro Produkt)\n';
    report += '5. Erstelle Video-Demos für Premium-Produkte\n';
    
    return report;
    
  } catch (error: any) {
    console.error('❌ Fehler bei Content-Analyse:', error.message);
    return '❌ Fehler bei der Content-Analyse.';
  }
}

// 🎯 PRODUKT-PERFORMANCE ANALYSE
async function analyzeProductPerformance(): Promise<string> {
  try {
    console.log('🎯 Ari analysiert Produkt-Performance...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [ordersResponse, productsResponse] = await Promise.all([
      wooCommerce.get('orders', { after: thirtyDaysAgo.toISOString(), per_page: 100, status: 'completed' }),
      wooCommerce.get('products', { per_page: 100, status: 'publish' })
    ]);
    
    const orders = ordersResponse.data;
    const products = productsResponse.data;
    
    // Sales pro Produkt berechnen
    const productSales: { [key: number]: { name: string; sales: number; revenue: number } } = {};
    
    products.forEach((p: any) => {
      productSales[p.id] = { name: p.name, sales: 0, revenue: 0 };
    });
    
    orders.forEach((order: any) => {
      order.line_items?.forEach((item: any) => {
        if (productSales[item.product_id]) {
          productSales[item.product_id].sales += item.quantity;
          productSales[item.product_id].revenue += parseFloat(item.total);
        }
      });
    });
    
    let report = '🎯 **ARI PRODUKT-PERFORMANCE (30 TAGE)**\n\n';
    
    // Top Seller
    const topSellers = Object.entries(productSales)
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 5)
      .filter(([_, data]) => data.sales > 0);
    
    if (topSellers.length > 0) {
      report += '🏆 **TOP SELLER:**\n';
      topSellers.forEach(([_, data], index) => {
        report += `${index + 1}. ${data.name}: ${data.sales} Verkäufe (€${data.revenue.toFixed(2)})\n`;
      });
      report += '\n';
    }
    
    // Produkte ohne Verkäufe
    const noSales = Object.entries(productSales)
      .filter(([_, data]) => data.sales === 0)
      .slice(0, 5);
    
    if (noSales.length > 0) {
      report += '❌ **PRODUKTE OHNE VERKÄUFE:**\n';
      noSales.forEach(([_, data]) => {
        const product = products.find((p: any) => p.name === data.name);
        report += `• ${data.name} (€${product?.price || '?'})\n`;
      });
      report += '\n';
    }
    
    report += '💡 **OPTIMIERUNGS-TIPPS:**\n';
    report += '1. Analysiere warum Top-Seller gut laufen\n';
    report += '2. Nutze gleiche Strategien für schwache Produkte\n';
    report += '3. Erwäge Preisanpassungen bei 0-Sales-Produkten\n';
    report += '4. Erstelle Bundles mit Top-Sellern\n';
    report += '5. A/B-Teste verschiedene Produktbilder\n';
    
    return report;
    
  } catch (error: any) {
    console.error('❌ Fehler bei Produkt-Analyse:', error.message);
    return '❌ Fehler bei der Produkt-Analyse.';
  }
}

// 🩺 SCHNELL-DIAGNOSE (kombiniert wichtigste Checks) – jetzt mit Monitoring-Summary zuerst
async function runQuickDiagnostics(): Promise<string> {
  const [monitoring, health, payment, conversion] = await Promise.all([
    summarizeMonitoring(),
    performSystemHealthCheck(),
    analyzePaymentIssues(),
    analyzeConversionIssues()
  ]);

  return [
    '🩺 **A.R.I. SCHNELL-DIAGNOSE**',
    '',
    '— MONITORING —',
    monitoring,
    '',
    '— SYSTEM HEALTH —',
    health,
    '',
    '— PAYMENT —',
    payment,
    '',
    '— CONVERSION —',
    conversion
  ].join('\n');
}

// 🧭 MONITORING-SUMMARY (System Health API)
async function summarizeMonitoring(): Promise<string> {
  try {
    const res = await fetch(`${apiBase}/api/monitoring/health/summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();
    if (!data.success) throw new Error(data.error || 'Monitoring summary failed');

    const metrics = data.metrics;
    const services = data.services || [];

    // Kompatibel zu /health/summary und /system/metrics
    const cpu = metrics?.cpu?.usage ?? metrics?.cpu ?? '–';
    const mem = metrics?.memory?.usagePercent ?? metrics?.memory ?? '–';
    const disk = metrics?.disk?.usagePercent ?? metrics?.disk ?? '–';
    const net = metrics?.network?.status ?? 'unknown';
    const uptime = metrics?.uptime?.formatted ?? metrics?.uptime ?? '–';
    const overall = data.overall || metrics?.status || 'unknown';

    const healthyServices = services.filter((s: any) => s.status === 'healthy').length;
    const warningServices = services.filter((s: any) => s.status === 'warning').length;
    const criticalServices = services.filter((s: any) => s.status === 'critical').length;

    let report = '🩺 **SYSTEM HEALTH (Monitoring)**\n\n';
    report += `Status: ${overall === 'healthy' ? '✅ Gesund' : overall === 'warning' ? '⚠️ Warnung' : '🚨 Kritisch'}\n`;
    report += `CPU: ${cpu}% | RAM: ${mem}% | Disk: ${disk}% | Network: ${net}\n`;
    report += `Uptime: ${uptime}\n`;
    report += `Services: ✅ ${healthyServices} | ⚠️ ${warningServices} | 🚨 ${criticalServices}\n`;

    if (criticalServices > 0 || overall === 'critical') {
      report += '\n🚨 Kritische Services:\n';
      services.filter((s: any) => s.status === 'critical').forEach((s: any) => {
        report += `• ${s.name}: ${s.message || 'Keine Details'}\n`;
      });
    }

    if (warningServices > 0) {
      report += '\n⚠️ Warnungen:\n';
      services.filter((s: any) => s.status === 'warning').forEach((s: any) => {
        report += `• ${s.name}: ${s.message || 'Keine Details'}\n`;
      });
    }

    if ((criticalServices === 0 && warningServices === 0) || services.length === 0) {
      report += '\n✅ Alle kritischen Services sind OK.';
    }

    return report;
  } catch (error: any) {
    console.error('Monitoring summary error:', error.message);
    return '❌ Konnte System-Health-Summary nicht laden.';
  }
}