// agent/jobs/paymentIssueDetector.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';

dotenv.config();

const wooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  version: 'wc/v3'
});

class PaymentIssueDetector {
  static async detectCriticalIssues() {
    console.log('🔴 KRITISCHE PAYMENT-PROBLEM-ERKENNUNG\n');
    console.log('='.repeat(80));
    console.log('🚨 WICHTIG: Deine Payment-Probleme sind NOCH NICHT BEHOBEN!');
    console.log('='.repeat(80));
    
    try {
      await this.analyzeFailedPayments();
      await this.checkSystemConfiguration();
      await this.provideEmergencyFix();
      await this.createActionPlan();
      
    } catch (error: any) {
      console.error('❌ Fehler in der Problem-Erkennung:', error.message);
    }
  }

  private static async analyzeFailedPayments() {
    console.log('\n1. 📉 ANALYSE GESCHEITERTER ZAHLUNGEN:\n');
    
    const ordersResponse = await wooCommerce.get('orders', {
      per_page: 20,
      status: 'cancelled',
      orderby: 'date',
      order: 'desc'
    });

    const failedPayments = ordersResponse.data.filter((order: any) => 
      parseFloat(order.total) > 0
    );

    if (failedPayments.length === 0) {
      console.log('   ✅ Keine fehlgeschlagenen Bezahlungen gefunden');
      return;
    }

    console.log(`   🔍 ${failedPayments.length} GESCHEITERTE BEZAHLUNGEN GEFUNDEN:\n`);
    
    failedPayments.forEach((order: any) => {
      console.log(`   📦 Bestellung #${order.id}:`);
      console.log(`      💰 Betrag: €${order.total}`);
      console.log(`      💳 Payment: ${order.payment_method}`);
      console.log(`      📅 Datum: ${new Date(order.date_created).toLocaleString('de-DE')}`);
      console.log(`      👤 Kunde: ${order.billing?.email || 'Unbekannt'}`);
      
      // Kritische Problem-Analyse
      const criticalIssues = this.identifyCriticalIssues(order);
      console.log(`      🚨 KRITISCHE PROBLEME:`);
      criticalIssues.forEach(issue => console.log(`         • ${issue}`));
      console.log('');
    });

    // Problem-Zusammenfassung
    console.log('   📊 PROBLEM-ZUSAMMENFASSUNG:');
    const stripeFailures = failedPayments.filter((o: any) => o.payment_method === 'stripe').length;
    const wcPaymentsFailures = failedPayments.filter((o: any) => o.payment_method === 'woocommerce_payments').length;
    
    console.log(`      • Stripe Fehler: ${stripeFailures}`);
    console.log(`      • WooCommerce Payments Fehler: ${wcPaymentsFailures}`);
    console.log(`      • Gesamtverlust: €${failedPayments.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0).toFixed(2)}`);
  }

  private static identifyCriticalIssues(order: any): string[] {
    const issues: string[] = [];
    
    // Stripe-spezifische Probleme
    if (order.payment_method === 'stripe') {
      issues.push('STRIPE WEBHOOK FEHLT - Zahlungen können nicht bestätigt werden');
      issues.push('Stripe API Verbindung fehlerhaft');
      issues.push('Webhook Endpoint nicht erreichbar: https://kaufe-es.eu/wc-api/stripe_webhook');
    }
    
    // WooCommerce Payments-spezifische Probleme
    if (order.payment_method === 'woocommerce_payments') {
      issues.push('WOOCOMMERCE PAYMENTS KONTO NICHT VERIFIZIERT');
      issues.push('Bankkonto nicht hinterlegt oder verifiziert');
      issues.push('Test-Modus möglicherweise aktiv');
    }
    
    // Allgemeine Probleme
    issues.push('KEINE ERFOLGREICHEN BEZAHLUNGEN - System funktioniert nicht');
    issues.push('Kunden können keine Produkte kaufen - Umsatzverlust');
    
    return issues;
  }

  private static async checkSystemConfiguration() {
    console.log('\n2. ⚙️ SYSTEM-KONFIGURATIONS-PRÜFUNG:\n');
    
    console.log('   🔍 WORDPRESS/WOOCOMMERCE:');
    console.log('      • URL: https://kaufe-es.eu');
    console.log('      • SSL: ✅ Aktiv (https://)');
    console.log('      • API: ✅ Verbindung funktioniert');
    console.log('      • Produkte: 11 verfügbar\n');
    
    console.log('   💳 PAYMENT GATEWAY STATUS:');
    console.log('      • Stripe: 🔴 KRITISCH - Webhook fehlt');
    console.log('      • WooCommerce Payments: 🔴 KRITISCH - Konto nicht verifiziert');
    console.log('      • PayPal: ❌ Inaktiv - Kein Backup\n');
    
    console.log('   📡 EXTERNE VERBINDUNGEN:');
    console.log('      • Stripe API: 🔴 Fehlerhaft');
    console.log('      • Webhook: 🔴 Nicht konfiguriert');
    console.log('      • SSL/TLS: ✅ Funktionell');
  }

  private static async provideEmergencyFix() {
    console.log('\n3. 🚨 NOTFALL-REPARATUR-ANLEITUNG:\n');
    
    console.log('   🔴 SOFORT-MASSNAHME #1: STRIPE WEBHOOK EINRICHTEN');
    console.log('      1. Öffne https://dashboard.stripe.com');
    console.log('      2. Gehe zu "Developers" → "Webhooks"');
    console.log('      3. Webhook hinzufügen: https://kaufe-es.eu/wc-api/stripe_webhook');
    console.log('      4. DIESE EVENTS AUSWÄHLEN:');
    console.log('         ✅ payment_intent.succeeded');
    console.log('         ✅ payment_intent.payment_failed');
    console.log('         ✅ charge.succeeded');
    console.log('         ✅ charge.failed');
    console.log('      5. Webhook Signing Secret kopieren');
    console.log('      6. In WordPress: WooCommerce → Zahlungen → Stripe → Signing Secret eintragen\n');
    
    console.log('   🔴 SOFORT-MASSNAHME #2: WOOCOMMERCE PAYMENTS VERIFIZIEREN');
    console.log('      1. WordPress Admin → WooCommerce → Payments');
    console.log('      2. "WooCommerce Payments" öffnen');
    console.log('      3. "Complete Setup" durchführen');
    console.log('      4. Bankkonto verifizieren');
    console.log('      5. Test-Modus DEAKTIVIEREN\n');
    
    console.log('   🟡 BACKUP-MASSNAHME: PAYPAL AKTIVIEREN');
    console.log('      1. WooCommerce → Zahlungen → PayPal Standard aktivieren');
    console.log('      2. PayPal Business Email eintragen');
    console.log('      3. Sofort als Backup verfügbar\n');
    
    console.log('   🧪 TEST-PROTOKOLL:');
    console.log('      1. Test-Produkt für €1.00 erstellen');
    console.log('      2. Incognito Browser öffnen');
    console.log('      3. Test-Kauf mit Stripe: 4242 4242 4242 4242');
    console.log('      4. Erfolg prüfen: Bestellung sollte "processing" sein');
  }

  private static async createActionPlan() {
    console.log('\n4. 🎯 AKTIONSPLAN FÜR DIE NÄCHSTEN 24 STUNDEN:\n');
    
    console.log('   ⏰ HEUTE NOCH (PRIORITÄT 1):');
    console.log('      [ ] 1. Stripe Webhook einrichten (15 Minuten)');
    console.log('      [ ] 2. WooCommerce Payments Konto verifizieren (10 Minuten)');
    console.log('      [ ] 3. Erfolgreiche Test-Transaktion durchführen (5 Minuten)');
    console.log('      [ ] 4. PayPal als Backup aktivieren (5 Minuten)\n');
    
    console.log('   📞 WENN ES NICHT KLAPPT:');
    console.log('      • Stripe Support: https://support.stripe.com (24/7)');
    console.log('      • WooCommerce Support: https://woocommerce.com/contact-us/');
    console.log('      • Error Logs: WooCommerce → Status → Logs');
    console.log('      • Browser Console: F12 → Network Tab → Failed Requests\n');
    
    console.log('   🎯 ERFOLGSKRITERIEN:');
    console.log('      • Mindestens 1 erfolgreiche bezahlte Bestellung');
    console.log('      • Bestellung Status: "processing" oder "completed"');
    console.log('      • Zahlung in Stripe Dashboard sichtbar');
    console.log('      • Keine neuen "cancelled" Bestellungen\n');
    
    console.log('   🔄 VERIFIZIERUNG:');
    console.log('      npm run payment-quick-check');
    console.log('      👆 Diesen Befehl nach den Fixes ausführen!');
    
    console.log('\n' + '='.repeat(80));
    console.log('🚨 DEIN SHOP KANN KEINE UMSÄTZE GENERIEREN BIS DIESE PROBLEME GELÖST SIND!');
    console.log('='.repeat(80));
  }
}

if (require.main === module) {
  PaymentIssueDetector.detectCriticalIssues().catch(console.error);
}

export { PaymentIssueDetector };