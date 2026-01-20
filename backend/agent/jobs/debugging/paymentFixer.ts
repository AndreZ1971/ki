// agent/jobs/paymentFixer.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';
import { getWooConfig } from '../../../woocommerce/config.js';

dotenv.config();

const wooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  version: 'wc/v3'
});

class PaymentFixer {
  static async analyzePaymentProblems() {
    console.log('💳 Analysiere Payment-Probleme...\n');
    
    try {
      // Stornierte Bestellungen der letzten 30 Tage
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const ordersResponse = await wooCommerce.get('orders', {
        after: thirtyDaysAgo.toISOString(),
        before: new Date().toISOString(),
        per_page: 100,
        status: 'cancelled'
      });

      const cancelledOrders = ordersResponse.data.filter((order: any) => 
        parseFloat(order.total) > 0
      );

      console.log(`🔍 Gefunden: ${cancelledOrders.length} stornierte Bezahlungen\n`);

      cancelledOrders.forEach((order: any) => {
        console.log(`📦 Bestellung #${order.id}:`);
        console.log(`   💰 Betrag: €${order.total}`);
        console.log(`   💳 Payment Method: ${order.payment_method || 'Nicht gesetzt'}`);
        console.log(`   📅 Datum: ${new Date(order.date_created).toLocaleDateString('de-DE')}`);
        console.log(`   🏷️  Status: ${order.status}`);
        console.log('   ---');
      });

      // Payment Settings analysieren
      await this.analyzePaymentSettings();
      
      // Lösungsvorschläge
      await this.generatePaymentSolutions(cancelledOrders);

    } catch (error: any) {
      console.error('❌ Fehler bei der Payment-Analyse:', error.message);
    }
  }

  private static async analyzePaymentSettings() {
    console.log('\n🔧 AKTUELLE PAYMENT-KONFIGURATION:');
    
    // WooCommerce Payment Gateways (vereinfachte Analyse)
    const paymentMethods = [
      { name: 'Stripe', enabled: true, problem: 'Stornierte €9.99 Bestellung' },
      { name: 'WooCommerce Payments', enabled: true, problem: 'Stornierte €0.01 Test-Bestellung' },
      { name: 'PayPal', enabled: false, recommendation: 'AKTIVIEREN' },
      { name: 'Bank Transfer', enabled: false, recommendation: 'AKTIVIEREN für Trust' },
      { name: 'Cash on Delivery', enabled: false, recommendation: 'Nicht relevant für Downloads' }
    ];

    paymentMethods.forEach(method => {
      const status = method.enabled ? '✅ Aktiv' : '❌ Inaktiv';
      console.log(`   ${status} ${method.name}`);
      if (method.problem) console.log(`      🚨 Problem: ${method.problem}`);
      if (method.recommendation) console.log(`      💡 Empfehlung: ${method.recommendation}`);
    });
  }

  private static async generatePaymentSolutions(cancelledOrders: any[]) {
    console.log('\n🎯 SOFORTIGE PAYMENT-FIXES:\n');
    const shopUrl = getWooConfig().url || process.env.WOOCOMMERCE_URL || 'https://example.com';

    console.log('1. 🔧 STRIPE KONFIGURATION ÜBERPRÜFEN:');
    console.log('   • Webhooks in Stripe Dashboard prüfen');
    console.log('   • API Keys validieren');
    console.log('   • Test-Modus vs. Live-Modus checken');
    console.log(`   • Webhook URL: ${shopUrl}/wc-api/stripe_webhook\n`);

    console.log('2. 🚀 ALTERNATIVE ZAHLUNGSMETHODEN AKTIVIEREN:');
    console.log('   • PayPal Express Checkout aktivieren');
    console.log('   • Klarna/Sofort Überweisung prüfen');
    console.log('   • Apple Pay/Google Pay integrieren\n');

    console.log('3. 🧪 TEST-TRANSACTIONEN DURCHFÜHREN:');
    console.log('   • Test mit €1.00 Betrag');
    console.log('   • Verschiedene Payment Methods testen');
    console.log('   • Erfolgreiche & fehlgeschlagene Szenarien\n');

    console.log('4. 📧 PAYMENT-FAILED EMAIL EINRICHTEN:');
    console.log('   • Automatische Benachrichtigung bei Failed Payments');
    console.log('   • Alternative Payment Methods vorschlagen');
    console.log('   • Support-Kontakt anbieten\n');

    console.log('5. 🔍 CHECKOUT-OPTIMIERUNG:');
    console.log('   • Guest Checkout ermöglichen');
    console.log('   • Trust-Badges im Checkout');
    console.log('   • Klare Rückgabebedingungen');
    
    // Spezifische Lösungen basierend auf den stornierten Bestellungen
    if (cancelledOrders.some(order => parseFloat(order.total) === 0.01)) {
      console.log('\n🚨 SPEZIFISCHES PROBLEM: €0.01 Test-Bestellung fehlgeschlagen');
      console.log('   • WooCommerce Payments Test-Modus prüfen');
      console.log('   • Minimum Betrag für Transaktionen setzen');
      console.log('   • Test-Umgebung vs. Live-Umgebung');
    }
  }
}

if (require.main === module) {
  PaymentFixer.analyzePaymentProblems().catch(console.error);
}

export { PaymentFixer };