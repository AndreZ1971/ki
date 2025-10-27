// agent/jobs/conversionAnalysis.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';

dotenv.config();

const wooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL!,
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  version: 'wc/v3'
});

interface ConversionProblem {
  type: 'payment_failed' | 'cart_abandoned' | 'free_only' | 'price_issue';
  description: string;
  solution: string[];
  priority: 'high' | 'medium' | 'low';
}

class ConversionAnalysis {
  static async analyzeConversionProblems(): Promise<ConversionProblem[]> {
    const problems: ConversionProblem[] = [];
    
    try {
      // Letzte 30 Tage Bestellungen analysieren
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const ordersResponse = await wooCommerce.get('orders', {
        after: thirtyDaysAgo.toISOString(),
        before: new Date().toISOString(),
        per_page: 100,
        status: 'any'
      });

      const orders = ordersResponse.data;
      
      console.log('🔍 Analysiere Conversion-Probleme...');
      
      // Problem 1: Stornierte Bezahlungen
      const cancelledPaidOrders = orders.filter((order: any) => 
        order.status === 'cancelled' && parseFloat(order.total) > 0
      );
      
      if (cancelledPaidOrders.length > 0) {
        problems.push({
          type: 'payment_failed',
          description: `${cancelledPaidOrders.length} bezahlte Bestellungen wurden storniert (Payment Issues)`,
          solution: [
            'Payment Provider überprüfen (Stripe/WooCommerce Payments)',
            'Test-Transaktionen durchführen',
            'Zahlungsmethoden erweitern (PayPal, Sofort)',
            'Fehler-Logging implementieren'
          ],
          priority: 'high'
        });
      }

      // Problem 2: Nur kostenlose Downloads
      const freeOrders = orders.filter((order: any) => parseFloat(order.total) === 0);
      const paidOrders = orders.filter((order: any) => 
        ['completed', 'processing'].includes(order.status) && parseFloat(order.total) > 0
      );

      if (freeOrders.length > 0 && paidOrders.length === 0) {
        problems.push({
          type: 'free_only',
          description: `${freeOrders.length} kostenlose Downloads, aber 0 bezahlte Verkäufe`,
          solution: [
            'Upsell-Strategie nach Free-Downloads',
            'Premium-Versionen der Freebies erstellen',
            'Email-Marketing für Freebie-Kunden',
            'Limited-Time Angebote für Freebie-Downloader'
          ],
          priority: 'high'
        });
      }

      // Problem 3: Preis-Strategie analysieren
      const productsResponse = await wooCommerce.get('products', {
        per_page: 50,
        status: 'publish'
      });

      const products = productsResponse.data;
      const paidProducts = products.filter((p: any) => parseFloat(p.price) > 0);
      const freeProducts = products.filter((p: any) => parseFloat(p.price) === 0);

      if (freeProducts.length > paidProducts.length) {
        problems.push({
          type: 'price_issue',
          description: `Mehr Freebies (${freeProducts.length}) als bezahlte Produkte (${paidProducts.length})`,
          solution: [
            'Preis-Strategie überarbeiten',
            'Mid-Range Produkte (€10-€30) hinzufügen',
            'Bundle-Angebote erstellen',
            'Kostenlose Testversionen für Premium-Produkte'
          ],
          priority: 'medium'
        });
      }

      return problems;

    } catch (error: any) {
      console.error('❌ Fehler bei der Conversion-Analyse:', error.message);
      return this.getDefaultProblems();
    }
  }

  private static getDefaultProblems(): ConversionProblem[] {
    return [
      {
        type: 'free_only',
        description: 'Viele kostenlose Downloads, aber keine bezahlten Verkäufe',
        solution: [
          'Upsell nach Free-Download implementieren',
          'Premium-Versionen der beliebtesten Freebies',
          'Email-Sequenz für Freebie-Kunden'
        ],
        priority: 'high'
      },
      {
        type: 'payment_failed',
        description: 'Bezahlte Bestellungen werden storniert',
        solution: [
          'Payment Provider Konfiguration überprüfen',
          'Alternative Zahlungsmethoden anbieten',
          'Checkout-Prozess vereinfachen'
        ],
        priority: 'high'
      }
    ];
  }
}

export { ConversionAnalysis, ConversionProblem };