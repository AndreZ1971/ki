// agent/jobs/realAnalyticsReporting.ts
import * as dotenv from 'dotenv';
import { getWooConfig } from '../../woocommerce/config.js';

import { GoogleTrendsService } from './googleTrendsService';
import { RealWooCommerceAnalytics } from './realWooCommerceAnalytics';
import { WordPressAnalyticsService } from './wordpressAnalyticsService';

dotenv.config();

class RealAnalyticsReporting {
  static async run() {
    console.log('📈 Starte Analytics & Reporting mit echten Daten...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dateRange = {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString()
      };

      console.log('🕐 Lade Daten für letzten Monat...');

      const [salesData, contentPerformance, industryTrends] = await Promise.all([
        RealWooCommerceAnalytics.getSalesData(dateRange),
        WordPressAnalyticsService.getContentPerformance(),
        GoogleTrendsService.getIndustryTrends()
      ]);

      await this.generateBusinessReport({
        sales: salesData,
        content: contentPerformance,
        trends: industryTrends,
        dateRange
      });

    } catch (error: any) {
      console.error('❌ Kritischer Fehler im Analytics Reporting:', error.message);
    }
  }

  private static async generateBusinessReport(data: any) {
    const reportDate = new Date().toLocaleDateString('de-DE');
    const shopUrl = getWooConfig().url || process.env.WOOCOMMERCE_URL || 'https://example.com';
    let hostLabel = 'SHOP';
    try { hostLabel = new URL(shopUrl).host.toUpperCase(); } catch { hostLabel = 'SHOP'; }
    
    console.log('\n' + '='.repeat(70));
    console.log(`💼 GESCHÄFTSBERICHT - ${hostLabel}`);
    console.log('='.repeat(70));
    console.log(`📅 Monatlicher Report - ${reportDate}`);
    
    // Business Metrics
    console.log(`\n📈 BUSINESS KENNZAHLEN:`);
    console.log(`   💰 Bezahlter Umsatz: €${data.sales.paidSales.toFixed(2)}`);
    console.log(`   🛒 Bezahlte Bestellungen: ${data.sales.paidOrderCount}`);
    console.log(`   🎁 Kostenlose Downloads: ${data.sales.freeOrders}`);
    console.log(`   📦 Gesamtbestellungen: ${data.sales.orderCount}`);
    console.log(`   📊 ⌀ Bestellwert: €${data.sales.averageOrderValue.toFixed(2)}`);
    console.log(`   👥 Kunden: ${data.sales.customerCount}`);
    
    // Produkt Performance mit Fokus auf Umsatz
    console.log(`\n🏆 UMSATZ-TRÄGER:`);
    const paidProducts = data.sales.products.filter((p: any) => p.revenue > 0);
    const freeProducts = data.sales.products.filter((p: any) => p.revenue === 0 && p.quantity > 0);
    
    if (paidProducts.length > 0) {
      paidProducts.forEach((_index: number) => {
        // ...existing code...
      });
    } else {
      console.log(`   💡 Noch keine bezahlten Verkäufe - Fokus auf Conversion`);
    }

    if (freeProducts.length > 0) {
      console.log(`\n🎁 POPULÄRE FREEBIES:`);
        freeProducts.slice(0, 3).forEach((product: any, _index: number) => {
          console.log(`   ${_index + 1}. ${product.name}`);
          console.log(`      📥 ${product.quantity}x heruntergeladen`);
        });
    }

    // Content Performance mit Conversion-Potential
    console.log(`\n📝 CONTENT-MARKETING PERFORMANCE:`);
    const sortedContent = data.content.sort((a: any, b: any) => b.pageViews - a.pageViews);
    sortedContent.slice(0, 3).forEach((post: any, index: number) => {
      const conversionPotential = post.pageViews > 800 ? '🚀 Hoch' : post.pageViews > 400 ? '📈 Mittel' : '📊 Gut';
      console.log(`   ${index + 1}. ${post.title.substring(0, 40)}...`);
      console.log(`      👁️  ${post.pageViews} Aufrufe | 💬 ${post.engagement} Interaktionen`);
      console.log(`      🎯 Conversion-Potential: ${conversionPotential}`);
    });

    // Marktchancen basierend auf Trends
    console.log(`\n🔍 MARKTCHANCEN 2025:`);
    const highTrends = data.trends.filter((t: any) => t.trendScore > 60);
    highTrends.forEach((trend: any) => {
      const opportunity = trend.trendScore > 80 ? '🌟 Groß' : trend.trendScore > 65 ? '💼 Mittel' : '📈 Gut';
      console.log(`   ${trend.keyword}: ${opportunity} (${trend.trendScore}/100)`);
    });

    // Konkrete Aktionsempfehlungen
    await this.generateActionPlan(data);
  }

  private static async generateActionPlan(data: any) {
    console.log(`\n🎯 AKTIONSPLAN FÜR NÄCHSTE 30 TAGE:`);
    
    const actions = [];

    // Umsatz-generierende Aktionen
    if (data.sales.paidSales === 0) {
      actions.push('💰 **ERSTE VERKÄUFE GENERIEREN**:');
      actions.push('   • "Starter-Paket" für €19-€29 erstellen');
      actions.push('   • Limited-Time 50% Rabatt für erste Kunden');
      actions.push('   • Kostenlose Beratung als Lead-Magnet');
    }

    // Freebie zu Paid Conversion
    if (data.sales.freeOrders > 0) {
      actions.push('🔄 **FREE-TO-PAID CONVERSION**:');
      actions.push('   • Email-Sequenz für Freebie-Downloader');
      actions.push('   • Spezialangebot für Freebie-Kunden');
      actions.push('   • Upsell nach Freebie-Download');
    }

    // Content-basierte Aktionen
    const topContent = data.content.sort((a: any, b: any) => b.pageViews - a.pageViews)[0];
    if (topContent && topContent.pageViews > 500) {
      actions.push('📝 **CONTENT-NUTZUNG OPTIMIEREN**:');
      actions.push(`   • Pop-up auf "${topContent.title.substring(0, 30)}..."`);
      actions.push('   • Newsletter-Anmeldung promoten');
      actions.push('   • Related Products einbinden');
    }

    // Trend-basierte Aktionen
    const topTrend = data.trends.find((t: any) => t.trendScore > 70);
    if (topTrend) {
      actions.push(`🔥 **TREND-MARKETING FÜR "${topTrend.keyword.toUpperCase()}":**`);
      actions.push('   • Blog-Serie zum Trend starten');
      actions.push('   • Social Media Kampagne');
      actions.push('   • Produkt-Bundle erstellen');
    }

    // Basis-Aktionen immer anzeigen
    actions.push('🏗️ **SHOP-OPTIMIERUNG**:');
    actions.push('   • Produkt-Beschreibungen verbessern');
    actions.push('   • Trust-Elemente (Reviews, Garantien)');
    actions.push('   • Checkout-Prozess optimieren');

    actions.forEach((action, _index) => {
      console.log(`   ${action}`);
    });

    // Metriken für nächsten Report
    console.log(`\n🎯 ZIELE FÜR NÄCHSTEN MONAT:`);
    console.log(`   1. 💵 Erste €500 Umsatz generieren`);
    console.log(`   2. 👥 10 neue Newsletter-Abonnenten`);
    console.log(`   3. 🛒 5 bezahlte Bestellungen`);
    console.log(`   4. 📈 2.000 Website-Besucher`);
    console.log(`   5. ⭐ Erste 5 Kundenbewertungen`);
  }
}

if (require.main === module) {
  RealAnalyticsReporting.run().catch(console.error);
}

export { RealAnalyticsReporting };