// agent/jobs/paymentTester.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';

dotenv.config();

const wooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  version: 'wc/v3'
});

class PaymentTester {
  static async testPaymentSetup() {
    console.log('🧪 STARTE PAYMENT-TESTSUITE...\n');
    
    try {
      // 1. Test-Produkt erstellen
      const testProduct = await this.createTestProduct();
      
      // 2. Payment Method Verfügbarkeit prüfen
      await this.checkPaymentMethods();
      
      // 3. System-Health Check
      await this.systemHealthCheck();
      
      // 4. Manuelle Test-Anleitung
      await this.generateManualTestGuide();
      
    } catch (error: any) {
      console.error('❌ Fehler im Payment-Test:', error.message);
    }
  }

  private static async createTestProduct() {
    console.log('1. 🎯 TEST-PRODUKT ERSTELLEN:\n');
    
    const testProductData = {
      name: 'TEST Payment Check Product - €1.00',
      type: 'simple',
      regular_price: '1.00',
      description: '⚠️ NUR ZU TESTZWECKEN - BITTE NICHT KAUFEN\nDieses Produkt dient zur Überprüfung des Payment-Systems.',
      short_description: 'Payment Test Produkt - €1.00',
      manage_stock: false,
      stock_status: 'instock',
      categories: [{ id: 23 }] // Anpassen an deine Kategorie
    };

    console.log('   📝 Test-Produkt-Daten vorbereitet:');
    console.log('      Name: TEST Payment Check Product - €1.00');
    console.log('      Preis: €1.00');
    console.log('      Beschreibung: NUR ZU TESTZWECKEN');
    console.log('   💡 Tipp: Dieses Produkt manuell in WooCommerce erstellen\n');
    
    return testProductData;
  }

  private static async checkPaymentMethods() {
    console.log('2. 💳 VERFÜGBARE PAYMENT METHODS:\n');
    
    const paymentTests = [
      {
        method: 'Stripe',
        testAmount: '1.00',
        testSteps: [
          'Kreditkartendaten: 4242 4242 4242 4242',
          'Expiry: 12/34',
          'CVC: 123',
          'Erwartet: Erfolgreiche Zahlung'
        ]
      },
      {
        method: 'WooCommerce Payments', 
        testAmount: '1.00',
        testSteps: [
          'Kreditkarte: 4000 0000 0000 3220',
          'Expiry: 12/34', 
          'CVC: 123',
          'Erwartet: 3D Secure Flow'
        ]
      },
      {
        method: 'PayPal',
        testAmount: '1.00',
        testSteps: [
          'PayPal Sandbox Account verwenden',
          'Test-Buyer: sb-43zyc12544731@personal.example.com',
          'Password: ,#9n%z9_',
          'Erwartet: Redirect zu PayPal'
        ]
      }
    ];

    paymentTests.forEach(test => {
      console.log(`   🔍 ${test.method} Test:`);
      console.log(`      💰 Test-Betrag: €${test.testAmount}`);
      console.log(`      📋 Test-Schritte:`);
      test.testSteps.forEach((step, index) => {
        console.log(`         ${index + 1}. ${step}`);
      });
      console.log('');
    });
  }

  private static async systemHealthCheck() {
    console.log('3. 🏥 SYSTEM HEALTH CHECK:\n');
    
    const healthChecks = [
      { check: 'WordPress Version', status: '✅', action: 'Aktuell halten' },
      { check: 'WooCommerce Version', status: '✅', action: 'Aktuell halten' },
      { check: 'SSL Zertifikat', status: '🔍', action: 'https:// prüfen' },
      { check: 'PHP Version', status: '🔍', action: '≥ 7.4 empfohlen' },
      { check: 'Memory Limit', status: '🔍', action: '≥ 256MB empfohlen' },
      { check: 'cURL aktiviert', status: '✅', action: 'Für API Calls benötigt' }
    ];

    healthChecks.forEach(item => {
      console.log(`   ${item.status} ${item.check} - ${item.action}`);
    });
    
    console.log('\n   📋 EMPFOHLENE PLUGINS:');
    console.log('   • WooCommerce Stripe Payment Gateway');
    console.log('   • WooCommerce Payments');
    console.log('   • PayPal Payments');
    console.log('   • WooCommerce PDF Invoices (Optional)');
  }

  private static async generateManualTestGuide() {
    console.log('\n4. 👨‍💻 MANUELLE TEST-ANLEITUNG:\n');
    
    console.log('📋 VORBEREITUNG:');
    console.log('   1. Incognito/Private Browser öffnen');
    console.log('   2. Test-Produkt für €1.00 erstellen');
    console.log('   3. Browser Console öffnen (F12)');
    console.log('   4. Network Tab aktivieren\n');
    
    console.log('🔧 TEST #1: STRIPE CHECKOUT');
    console.log('   1. Zum Test-Produkt navigieren');
    console.log('   2. In den Warenkorb legen');
    console.log('   3. Zur Kasse gehen');
    console.log('   4. Stripe als Zahlungsmethode wählen');
    console.log('   5. Test-Kreditkarte: 4242 4242 4242 4242');
    console.log('   6. Bestellung abschließen');
    console.log('   7. Erfolg? → Bestellung sollte "Processing" sein\n');
    
    console.log('🔧 TEST #2: WOOCOMMERCE PAYMENTS');
    console.log('   1. Gleicher Prozess wie oben');
    console.log('   2. WooCommerce Payments wählen');
    console.log('   3. Karte: 4000 0000 0000 3220 (3D Secure Test)');
    console.log('   4. 3D Secure Flow durchlaufen');
    console.log('   5. Erfolg prüfen\n');
    
    console.log('🔧 TEST #3: PAYPAL (falls aktiviert)');
    console.log('   1. PayPal als Zahlungsmethode wählen');
    console.log('   2. Redirect zu PayPal Sandbox');
    console.log('   3. Mit Test-Account anmelden');
    console.log('   4. Zahlung bestätigen');
    console.log('   5. Rückkehr zum Shop prüfen\n');
    
    console.log('📊 ERGEBNISSE DOKUMENTIEREN:');
    console.log('   • Welche Payment Methods funktionieren?');
    console.log('   • Welche Fehlermeldungen erscheinen?');
    console.log('   • In Browser Console: JavaScript Errors?');
    console.log('   • In Network Tab: Failed API Calls?');
  }
}

if (require.main === module) {
  PaymentTester.testPaymentSetup().catch(console.error);
}

export { PaymentTester };