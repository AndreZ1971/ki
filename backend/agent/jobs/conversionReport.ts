// agent/jobs/conversionReport.ts
import { ConversionAnalysis, ConversionProblem } from './conversionAnalysis';
import { RealWooCommerceAnalytics } from './realWooCommerceAnalytics';
import { WordPressAnalyticsService } from './wordpressAnalyticsService';
import * as dotenv from 'dotenv';

dotenv.config();

class ConversionReport {
  static async run() {
    console.log('🎯 Starte Conversion-Optimierung Report...\n');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dateRange = {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString()
      };

      const [conversionProblems, salesData, contentPerformance] = await Promise.all([
        ConversionAnalysis.analyzeConversionProblems(),
        RealWooCommerceAnalytics.getSalesData(dateRange),
        WordPressAnalyticsService.getContentPerformance()
      ]);

      await this.generateConversionReport({
        problems: conversionProblems,
        sales: salesData,
        content: contentPerformance
      });

    } catch (error: any) {
      console.error('❌ Fehler im Conversion Report:', error.message);
    }
  }

  private static async generateConversionReport(data: any) {
    console.log('='.repeat(80));
    console.log('🚨 CONVERSION OPTIMIERUNGS-REPORT - KAUFE-ES.EU');
    console.log('='.repeat(80));
    console.log('📅 Analyse: ', new Date().toLocaleDateString('de-DE'));
    
    // Kritische Probleme anzeigen
    console.log('\n🔴 KRITISCHE PROBLEME:');
    const highPriorityProblems = data.problems.filter((p: ConversionProblem) => p.priority === 'high');
    
    if (highPriorityProblems.length === 0) {
      console.log('   ✅ Keine kritischen Probleme erkannt');
    } else {
      highPriorityProblems.forEach((problem: ConversionProblem, index: number) => {
        console.log(`\n   ${index + 1}. ${problem.description}`);
        console.log('      💡 LÖSUNGSVORSCHLÄGE:');
        problem.solution.forEach((solution, solIndex) => {
          console.log(`        ${solIndex + 1}. ${solution}`);
        });
      });
    }

    // Conversion Metrics
    console.log('\n📊 CONVERSION-METRIKEN:');
    console.log(`   🛒 Gesamtbestellungen: ${data.sales.orderCount}`);
    console.log(`   💵 Bezahlte Bestellungen: ${data.sales.paidOrderCount}`);
    console.log(`   🎁 Kostenlose Downloads: ${data.sales.freeOrders}`);
    console.log(`   📈 Conversion Rate: ${((data.sales.paidOrderCount / data.sales.orderCount) * 100).toFixed(1)}%`);
    console.log(`   👥 Unique Kunden: ${data.sales.customerCount}`);

    // Content-to-Sales Analysis
    console.log('\n📝 CONTENT TO SALES ANALYSIS:');
    const topContent = data.content.sort((a: any, b: any) => b.pageViews - a.pageViews)[0];
    if (topContent) {
      console.log(`   🏆 Top Content: "${topContent.title.substring(0, 40)}..."`);
      console.log(`      👁️  ${topContent.pageViews} Aufrufe | 💬 ${topContent.engagement} Interaktionen`);
      console.log(`      🎯 Potenzial: ${topContent.pageViews > 800 ? 'SEHR HOCH' : 'HOCH'} für Conversion`);
    }

    // Sofort umsetzbare Aktionen
    await this.generateQuickWins(data);
    
    // 30-Tage Conversion-Plan
    await this.generateConversionPlan(data);
  }

  private static async generateQuickWins(data: any) {
    console.log('\n⚡ SOFORT UMSETZBARE AKTIONEN (Diese Woche):');
    
    const quickWins = [];

    // Quick Win 1: Free-to-Paid Conversion
    if (data.sales.freeOrders > 0) {
      quickWins.push('🎁 **FREEBIE UPSEL STRATEGIE:**');
      quickWins.push('   • Nach Free-Download: "Möchtest du die Premium-Version?"');
      quickWins.push('   • Special Offer: 50% Rabatt für Freebie-Kunden');
      quickWins.push('   • Email-Autoresponder für Free-Downloader einrichten');
    }

    // Quick Win 2: Payment Issues
    const hasPaymentProblems = data.problems.some((p: ConversionProblem) => p.type === 'payment_failed');
    if (hasPaymentProblems) {
      quickWins.push('💳 **PAYMENT FIXES:**');
      quickWins.push('   • Test-Kauf mit verschiedenen Payment Methods');
      quickWins.push('   • PayPal als Alternative aktivieren');
      quickWins.push('   • Checkout ohne Account-Registrierung ermöglichen');
    }

    // Quick Win 3: Content Conversion
    const topContent = data.content.sort((a: any, b: any) => b.pageViews - a.pageViews)[0];
    if (topContent && topContent.pageViews > 500) {
      quickWins.push('📝 **CONTENT CONVERSION:**');
      quickWins.push(`   • Pop-up auf "${topContent.title.substring(0, 30)}..."`);
      quickWins.push('   • "Kostenlose Beratung" Call-to-Action einbauen');
      quickWins.push('   • Related Products Widget implementieren');
    }

    if (quickWins.length === 0) {
      quickWins.push('✅ **SHOP OPTIMIERUNG:**');
      quickWins.push('   • Produkt-Bilder in höherer Qualität');
      quickWins.push('   • Kunden-Reviews Sammeln');
      quickWins.push('   • Trust-Badges im Checkout');
    }

    quickWins.forEach(win => console.log(`   ${win}`));
  }

  private static async generateConversionPlan(data: any) {
    console.log('\n🎯 30-TAGE CONVERSION-PLAN:');
    
    console.log('   WOCHE 1-2: 🎁 FREE-TO-PAID CONVERSION');
    console.log('   • Email-Sequenz für Freebie-Downloader');
    console.log('   • Premium-Versionen der Top-Freebies');
    console.log('   • Special Offers für bestehende Downloader');
    
    console.log('\n   WOCHE 2-3: 💳 PAYMENT & CHECKOUT');
    console.log('   • Payment Provider optimieren');
    console.log('   • Alternative Zahlungsmethoden');
    console.log('   • Checkout ohne Account');
    
    console.log('\n   WOCHE 3-4: 📈 CONTENT MONETIZATION');
    console.log('   • Product Placements in Top-Content');
    console.log('   • Newsletter-Anmeldung optimieren');
    console.log('   • Retargeting Kampagnen');
    
    console.log('\n   🎯 ZIEL FÜR NÄCHSTE 30 TAGE:');
    console.log('   • 5 bezahlte Bestellungen');
    console.log('   • €250 Umsatz');
    console.log('   • 10% Conversion Rate von Free zu Paid');
    console.log('   • 20 neue Newsletter-Abonnenten');
  }
}

if (require.main === module) {
  ConversionReport.run().catch(console.error);
}

export { ConversionReport };