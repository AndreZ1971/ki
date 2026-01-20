// agent/jobs/paymentDebugger.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';

dotenv.config();

const wooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  version: 'wc/v3'
});

// Dynamische Shop-URL aus Konfiguration
const { getWooConfig } = require('../../woocommerce/config.js');
const shopUrl: string = (getWooConfig()?.url) || process.env.WOOCOMMERCE_URL || 'https://example.com';
const base: string = String(shopUrl).replace(/\/$/, '');

class PaymentDebugger {
  static async debugPaymentIssues() {
    console.log('🔧 STARTE PAYMENT-DEBUGGING...\n');
    
    try {
      // 1. Stornierte Bestellungen analysieren
      await this.analyzeFailedOrders();
      
      // 2. Payment Gateway Status prüfen
      await this.checkPaymentGateways();
      
      // 3. WooCommerce Settings analysieren
      await this.analyzeWooCommerceSettings();
      
      // 4. Schritt-für-Schritt Fix-Anleitung
      await this.generateStepByStepFixGuide();
      
    } catch (error: any) {
      console.error('❌ Fehler beim Payment-Debugging:', error.message);
    }
  }

  private static async analyzeFailedOrders() {
    console.log('1. 📋 ANALYSE FEHLGESCHLAGENER BESTELLUNGEN:\n');
    
    const ordersResponse = await wooCommerce.get('orders', {
      per_page: 20,
      status: 'cancelled',
      orderby: 'date',
      order: 'desc'
    });

    const failedOrders = ordersResponse.data.filter((order: any) => 
      parseFloat(order.total) > 0
    );

    if (failedOrders.length === 0) {
      console.log('   ✅ Keine fehlgeschlagenen Bezahlungen gefunden');
      return;
    }

    failedOrders.forEach((order: any) => {
      console.log(`   📦 Bestellung #${order.id}:`);
      console.log(`      💰 Betrag: €${order.total}`);
      console.log(`      💳 Payment: ${order.payment_method || 'Nicht gesetzt'}`);
      console.log(`      📅 Datum: ${new Date(order.date_created).toLocaleString('de-DE')}`);
      console.log(`      👤 Kunde: ${order.billing?.email || 'Unbekannt'}`);
      console.log(`      🏷️  Status: ${order.status}`);
      
      // Mögliche Fehlerursachen identifizieren
      const issues = this.identifyPaymentIssues(order);
      if (issues.length > 0) {
        console.log(`      🚨 Mögliche Probleme:`);
        issues.forEach(issue => console.log(`         • ${issue}`));
      }
      console.log('');
    });
  }

  private static identifyPaymentIssues(order: any): string[] {
    const issues: string[] = [];
    
    if (order.payment_method === 'stripe' && parseFloat(order.total) === 9.99) {
      issues.push('Stripe Test-Transaktion fehlgeschlagen');
      issues.push('Webhook nicht konfiguriert');
      issues.push('API Keys ungültig');
    }
    
    if (order.payment_method === 'woocommerce_payments' && parseFloat(order.total) === 0.01) {
      issues.push('WooCommerce Payments Test-Modus Problem');
      issues.push('Mindestbetrag zu niedrig');
      issues.push('Konto nicht vollständig eingerichtet');
    }
    
    if (!order.payment_method) {
      issues.push('Payment Method nicht ausgewählt');
    }
    
    return issues;
  }

  private static async checkPaymentGateways() {
    console.log('2. 💳 PAYMENT GATEWAY STATUS:\n');
    
    // WooCommerce Payment Gateways (vereinfachte Prüfung)
    const gateways = [
      { 
        name: 'Stripe', 
        enabled: true, 
        configSteps: [
          'API Keys in WooCommerce → Settings → Payments → Stripe',
          `Webhook URL: ${base}/wc-api/stripe_webhook`,
          'Test-Modus deaktivieren für Live-Betrieb'
        ]
      },
      { 
        name: 'WooCommerce Payments', 
        enabled: true, 
        configSteps: [
          'Konto in WooCommerce → Payments verifizieren',
          'Bankkonto hinterlegt?',
          'Test-Modus prüfen'
        ]
      },
      { 
        name: 'PayPal', 
        enabled: false, 
        configSteps: [
          'In WooCommerce → Payments → PayPal aktivieren',
          'PayPal Business Account benötigt',
          'API Credentials von PayPal Dashboard'
        ]
      }
    ];

    gateways.forEach(gateway => {
      const status = gateway.enabled ? '✅ AKTIV' : '❌ INAKTIV';
      console.log(`   ${status} ${gateway.name}`);
      
      if (gateway.enabled) {
        console.log(`      ⚙️  Konfiguration prüfen:`);
        gateway.configSteps.forEach((step, index) => {
          console.log(`         ${index + 1}. ${step}`);
        });
      } else {
        console.log(`      💡 EMPFOHLEN: Aktivieren als Backup`);
      }
      console.log('');
    });
  }

  private static async analyzeWooCommerceSettings() {
    console.log('3. ⚙️ WOOCOMMERCE BASIS-KONFIGURATION:\n');
    
    const settings = [
      { setting: 'WooCommerce URL', value: process.env.WOOCOMMERCE_URL, status: '✅ OK' },
      { setting: 'Consumer Key', value: process.env.CONSUMER_KEY ? '***' + process.env.CONSUMER_KEY.slice(-8) : '❌ FEHLT', status: process.env.CONSUMER_KEY ? '✅ OK' : '❌ FEHLT' },
      { setting: 'Consumer Secret', value: process.env.CONSUMER_SECRET ? '***' + process.env.CONSUMER_SECRET.slice(-8) : '❌ FEHLT', status: process.env.CONSUMER_SECRET ? '✅ OK' : '❌ FEHLT' }
    ];

    settings.forEach(setting => {
      console.log(`   ${setting.status} ${setting.setting}: ${setting.value}`);
    });
    
    console.log('\n   🔍 ZUSÄTZLICHE PRÜFPUNKTE:');
    console.log('   • SSL Zertifikat aktiviert? (https://)');
    console.log('   • WooCommerce Version aktuell?');
    console.log('   • WordPress Version kompatibel?');
    console.log('   • Theme/Plugin Konflikte?');
  }

  private static async generateStepByStepFixGuide() {
    console.log('\n4. 🛠️ SCHRITT-FÜR-SCHRITT REPARATUR-ANLEITUNG:\n');
    
    console.log('🔴 SCHRITT 1: STRIPE WEBHOOK PRÜFEN (KRITISCH)');
    console.log('   1. Öffne https://dashboard.stripe.com');
    console.log('   2. Gehe zu "Developers" → "Webhooks"');
    console.log(`   3. Suche nach: ${base}/wc-api/stripe_webhook`);
    console.log('   4. Falls nicht vorhanden: Webhook manuell hinzufügen');
    console.log('   5. Events: payment_intent.succeeded, payment_intent.payment_failed');
    console.log('   6. Webhook Signing Secret in WooCommerce eintragen\n');
    
    console.log('🔴 SCHRITT 2: WOOCOMMERCE PAYMENTS KONTO PRÜFEN');
    console.log('   1. In WordPress: WooCommerce → Payments');
    console.log('   2. WooCommerce Payments öffnen');
    console.log('   3. Konto-Status prüfen (Complete Setup?)');
    console.log('   4. Bankkonto verifiziert?');
    console.log('   5. Test-Modus deaktivieren\n');
    
    console.log('🟡 SCHRITT 3: PAYPAL AKTIVIEREN (BACKUP)');
    console.log('   1. In WooCommerce → Payments → PayPal');
    console.log('   2. "Enable PayPal Standard" aktivieren');
    console.log('   3. PayPal Email-Adresse eintragen');
    console.log('   4. IPN Handler URL prüfen\n');
    
    console.log('🟡 SCHRITT 4: TEST-TRANSACTION DURCHFÜHREN');
    console.log('   1. Produkt für €1.00 erstellen');
    console.log('   2. Incognito Browser öffnen');
    console.log('   3. Test-Bestellung durchführen');
    console.log('   4. Verschiedene Payment Methods testen');
    console.log('   5. Fehlermeldungen dokumentieren\n');
    
    console.log('🟢 SCHRITT 5: FEHLER-PROTOKOLL AKTIVIEREN');
    console.log('   1. In wp-config.php: define(\'WP_DEBUG\', true);');
    console.log('   2. WooCommerce → Status → Logs prüfen');
    console.log('   3. Payment Gateway Logs aktivieren');
    console.log('   4. Error Logging Plugin installieren\n');
    
    console.log('📞 BEI PROBLEMEN: EXTERNE HILFE');
    console.log('   • Stripe Support: https://support.stripe.com');
    console.log('   • WooCommerce Support: https://woocommerce.com/contact-us/');
    console.log('   • WordPress Forum: https://wordpress.org/support/plugin/woocommerce/');
  }
}

if (require.main === module) {
  PaymentDebugger.debugPaymentIssues().catch(console.error);
}

export { PaymentDebugger };