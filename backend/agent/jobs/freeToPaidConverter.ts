// agent/jobs/freeToPaidConverter.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';

dotenv.config();

const wooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  version: 'wc/v3'
});

class FreeToPaidConverter {
  static async analyzeFreeToPaidPotential() {
    console.log('🎁 Analysiere Free-to-Paid Conversion Potential...\n');
    
    try {
      // Freebie Bestellungen analysieren
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const ordersResponse = await wooCommerce.get('orders', {
        after: thirtyDaysAgo.toISOString(),
        before: new Date().toISOString(),
        per_page: 100,
        status: 'completed'
      });

      const freeOrders = ordersResponse.data.filter((order: any) => 
        parseFloat(order.total) === 0
      );

      console.log(`📥 ${freeOrders.length} kostenlose Downloads in den letzten 30 Tagen\n`);

      // Beliebte Freebies identifizieren
      const freebieAnalysis = this.analyzeFreebies(freeOrders);
      
      // Premium Upsell Opportunities
      await this.generateUpsellStrategies(freebieAnalysis);
      
      // Email Marketing Setup
      await this.generateEmailSequence(freeOrders.length);

    } catch (error: any) {
      console.error('❌ Fehler bei der Free-to-Paid Analyse:', error.message);
    }
  }

  private static analyzeFreebies(freeOrders: any[]) {
    console.log('🏆 BELIEBTESTE FREEBIES:');
    
    const freebieMap = new Map();
    
    freeOrders.forEach(order => {
      order.line_items?.forEach((item: any) => {
        const productName = item.name;
        if (freebieMap.has(productName)) {
          freebieMap.set(productName, freebieMap.get(productName) + item.quantity);
        } else {
          freebieMap.set(productName, item.quantity);
        }
      });
    });

    const popularFreebies = Array.from(freebieMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (popularFreebies.length === 0) {
      console.log('   Keine Freebie-Daten gefunden');
      return [];
    }

    popularFreebies.forEach(([name, downloads], index) => {
      console.log(`   ${index + 1}. ${name}`);
      console.log(`      📥 ${downloads}x heruntergeladen`);
      console.log(`      💡 Upsell-Potential: ${downloads > 2 ? 'HOCH' : 'MEDIUM'}`);
    });

    return popularFreebies;
  }

  private static async generateUpsellStrategies(popularFreebies: any[]) {
    console.log('\n🎯 FREE-TO-PAID UPSELL STRATEGIEN:\n');

    console.log('1. 🚀 PREMIUM-VERSIONEN ERSTELLEN:');
    popularFreebies.forEach(([freebieName, downloads], index) => {
      console.log(`   ${index + 1}. "${freebieName}" → Premium Version`);
      console.log(`      • Erweiterte Features`);
      console.log(`      • Persönliche Anpassung`);
      console.log(`      • Priority Support`);
      console.log(`      • 💰 Preis: €19-€49\n`);
    });

    console.log('2. 🎁 BUNDLE-ANGEBOTE:');
    console.log('   • "Freebie + Premium Upgrade" Bundle');
    console.log('   • "Mehrere Freebies + Bonus" Package');
    console.log('   • "Jahreszugang + Updates" Subscription\n');

    console.log('3. ⏰ LIMITED-TIME OFFERS:');
    console.log('   • "48h Special" nach Free-Download');
    console.log('   • "Early Bird" Pricing');
    console.log('   • "First 100 Customers" Discount\n');

    console.log('4. 📧 POST-DOWNLOAD UPSELL FLOW:');
    console.log('   • Danke-Seite mit Special Offer');
    console.log('   • Pop-up mit Limited Discount');
    console.log('   • Email Sequence nach Download\n');
  }

  private static async generateEmailSequence(freeDownloadCount: number) {
    console.log('5. 📧 EMAIL-MARKETING SEQUENZ:');
    
    console.log('\n   📋 EMAIL #1 (Sofort nach Download):');
    console.log('   Betreff: "Dein Download ist bereit + Special Offer"');
    console.log('   Inhalt:');
    console.log('   • Download-Link bestätigen');
    console.log('   • Premium-Version vorstellen');
    console.log('   • 24h Special: 40% Rabatt');
    console.log('   • CTA: "Jetzt upgraden"\n');

    console.log('   📋 EMAIL #2 (3 Tage später):');
    console.log('   Betreff: "Brauchst du Hilfe bei der Umsetzung?"');
    console.log('   Inhalt:');
    console.log('   • Hilfreiche Tipps zum Freebie');
    console.log('   • Case Study/Erfolgsstory');
    console.log('   • Consulting Offer');
    console.log('   • CTA: "Kostenlose Beratung buchen"\n');

    console.log('   📋 EMAIL #3 (7 Tage später):');
    console.log('   Betreff: "Last Chance: Dein Special Offer endet bald"');
    console.log('   Inhalt:');
    console.log('   • FOMO (Fear Of Missing Out)');
    console.log('   • Limited Time Reminder');
    console.log('   • Social Proof/Testimonials');
    console.log('   • CTA: "Jetzt sichern bevor es weg ist"\n');

    console.log(`   📊 Geschätztes Potential: ${freeDownloadCount} Freebie-Kunden → Ziel: 10-20% Conversion`);
  }
}

if (require.main === module) {
  FreeToPaidConverter.analyzeFreeToPaidPotential().catch(console.error);
}

export { FreeToPaidConverter };