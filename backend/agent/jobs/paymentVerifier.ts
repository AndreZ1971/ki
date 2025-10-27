// agent/jobs/paymentVerifier.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';

dotenv.config();

const wooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  version: 'wc/v3'
});

class PaymentVerifier {
  static async verifyPaymentFix() {
    console.log('✅ PAYMENT FIX VERIFICATION - PRÜFE OB ALLES FUNKTIONIERT\n');
    
    try {
      // 1. Aktuellen Status prüfen
      await this.checkCurrentStatus();
      
      // 2. Test-Produkt erstellen (falls nicht vorhanden)
      await this.ensureTestProduct();
      
      // 3. Finale Empfehlungen
      await this.showFinalRecommendations();
      
      // 4. Success Tracking einrichten
      await this.setupSuccessTracking();
      
    } catch (error: any) {
      console.error('❌ Fehler in der Verifikation:', error.message);
    }
  }

  private static async checkCurrentStatus() {
    console.log('1. 🔍 AKTUELLER PAYMENT-STATUS:\n');
    
    // Letzte Bestellungen prüfen
    const ordersResponse = await wooCommerce.get('orders', {
      per_page: 10,
      orderby: 'date',
      order: 'desc'
    });

    const recentOrders = ordersResponse.data;
    const paidOrders = recentOrders.filter((order: any) => 
      parseFloat(order.total) > 0 && ['completed', 'processing'].includes(order.status)
    );

    const failedOrders = recentOrders.filter((order: any) => 
      parseFloat(order.total) > 0 && order.status === 'cancelled'
    );

    console.log(`   📊 Bestellungs-Statistik:`);
    console.log(`      • Gesamt: ${recentOrders.length} Bestellungen`);
    console.log(`      • ✅ Bezahlt: ${paidOrders.length}`);
    console.log(`      • ❌ Fehlgeschlagen: ${failedOrders.length}`);
    console.log(`      • 🎁 Kostenlos: ${recentOrders.length - paidOrders.length - failedOrders.length}\n`);

    // Payment Method Analyse
    console.log(`   💳 Payment Method Usage:`);
    const paymentMethods = new Map();
    
    recentOrders.forEach((order: any) => {
      const method = order.payment_method || 'unknown';
      paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1);
    });

    paymentMethods.forEach((count, method) => {
      const status = count > 0 ? '🟢' : '⚪';
      console.log(`      ${status} ${method}: ${count}x verwendet`);
    });
  }

  private static async ensureTestProduct() {
    console.log('\n2. 🧪 TEST-PRODUKT SICHERSTELLEN:\n');
    
    // Prüfen ob Test-Produkt existiert
    const productsResponse = await wooCommerce.get('products', {
      search: 'Payment Test Product',
      per_page: 5
    });

    const testProducts = productsResponse.data.filter((product: any) => 
      product.name.includes('Payment Test') || product.name.includes('TEST')
    );

    if (testProducts.length > 0) {
      console.log('   ✅ Test-Produkt bereits vorhanden:');
      testProducts.forEach((product: any) => {
        console.log(`      • ${product.name} - €${product.price}`);
      });
    } else {
      console.log('   📝 Test-Produkt erstellen:');
      console.log('      Name: "Payment Test Product - €1.00"');
      console.log('      Preis: 1.00');
      console.log('      Beschreibung: "NUR ZU TESTZWECKEN"');
      console.log('      💡 Tipp: In WooCommerce manuell erstellen\n');
    }

    console.log('   🔗 Direkt-Link zum Testen:');
    console.log('      https://kaufe-es.eu/');
    console.log('      ➡️ Suche nach "Payment Test Product"');
  }

  private static async showFinalRecommendations() {
    console.log('\n3. 🎯 FINALE EMPFEHLUNGEN NACH DEM FIX:\n');
    
    console.log('   🔧 TECHNISCHE OPTIMIERUNGEN:');
    console.log('      1. WooCommerce Caches leeren');
    console.log('      2. Browser Cache leeren (Ctrl+F5)');
    console.log('      3. CDN Cache invalidieren falls verwendet');
    console.log('      4. SSL Zertifikat erneuern falls bald ablaufend\n');
    
    console.log('   💰 GESCHÄFTS-OPTIMIERUNGEN:');
    console.log('      1. Trust-Badges im Checkout einbauen');
    console.log('      2. Geld-zurück-Garantie anbieten');
    console.log('      3. Kundenbewertungen sammeln');
    console.log('      4. Live-Chat für Support anbieten\n');
    
    console.log('   📈 MARKETING OPTIMIERUNGEN:');
    console.log('      1. Email-Marketing für Freebie-Kunden');
    console.log('      2. Retargeting Kampagnen einrichten');
    console.log('      3. Social Proof auf Landing Pages');
    console.log('      4. A/B Testing für Conversion Rate\n');
  }

  private static async setupSuccessTracking() {
    console.log('\n4. 📊 ERFOLGS-TRACKING EINRICHTEN:\n');
    
    console.log('   🎯 WICHTIGSTE KENNZAHLEN (KPIs):');
    console.log('      • Bezahlte Bestellungen pro Tag/Woche');
    console.log('      • Conversion Rate (%)');
    console.log('      • Durchschnittlicher Bestellwert (AOV)');
    console.log('      • Customer Lifetime Value (LTV)');
    console.log('      • Payment Method Distribution\n');
    
    console.log('   📈 TRACKING TOOLS EMPFOHLEN:');
    console.log('      • Google Analytics 4 → Conversion Goals');
    console.log('      • Google Search Console → Organic Traffic');
    console.log('      • Stripe Dashboard → Payment Analytics');
    console.log('      • WooCommerce Analytics → Shop Performance\n');
    
    console.log('   🔔 AUTOMATISCHE BENACHRICHTIGUNGEN:');
    console.log('      • Erfolgreiche Bestellungen → Email/Slack');
    console.log('      • Failed Payments → Sofort Alert');
    console.log('      • Täglicher Report → 8:00 Uhr');
    console.log('      • Wöchentlicher Report → Montag Morgen\n');
    
    console.log('   📅 REGELMÄSSIGE REVIEWS:');
    console.log('      • Täglich: Payment Success Rate');
    console.log('      • Wöchentlich: Conversion Metrics');
    console.log('      • Monatlich: Business Growth');
    console.log('      • Quartalsweise: Strategy Adjustment');
  }
}

if (require.main === module) {
  PaymentVerifier.verifyPaymentFix().catch(console.error);
}

export { PaymentVerifier };