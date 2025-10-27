// backend/agent/jobs/runTrendAnalysis.ts
import minimist from 'minimist';

import { trendAnalysisJob } from './trendAnalysis';

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['keyword', 'geo', 'output'],
    boolean: ['include-reddit', 'help'],
    alias: {
      k: 'keyword',
      g: 'geo', 
      r: 'include-reddit',
      o: 'output',
      h: 'help'
    },
    default: {
      keyword: 'digitale produkte',
      geo: 'DE',
      'include-reddit': false,
      output: null
    }
  });

  // Parameter kombinieren: CLI args + flags
  const keyword = argv._[0] || argv.keyword;
  const geo = argv._[1] || argv.geo;

  if (argv.help) {
    console.log(`
📈 Trend Analysis CLI

Usage:
  npm run trend-analysis -- [keyword] [geo] [options]

Examples:
  npm run trend-analysis -- "online courses"
  npm run trend-analysis -- "software tools" US
  npm run trend-analysis -- --keyword "online courses" --geo DE --include-reddit
  npm run trend-analysis -- -o "trends.json"
    `);
    process.exit(0);
  }

  try {
    console.log('🚀 Starte Trend-Analyse...\n');
    
    const result = await trendAnalysisJob({
      keyword: keyword,
      geo: geo,
      includeReddit: argv['include-reddit']
    });

    // Ergebnisse anzeigen
    console.log('📊 TREND-ANALYSE ERGEBNISSE');
    console.log('='.repeat(50));
    console.log(`📅 Analyse-Datum: ${new Date(result.analysisDate).toLocaleString('de-DE')}`);
    console.log(`🔍 Suchbegriff: "${argv.keyword}"`);
    console.log(`🌍 Region: ${argv.geo}`);
    console.log(`📡 Quelle: ${result.source}`);
    console.log('');

    if (result.trendingProducts.length === 0) {
      console.log('❌ Keine Trends gefunden');
      process.exit(1);
    }

    // Top Trends anzeigen
    console.log('🏆 TOP TRENDING PRODUKTE:');
    console.log('-'.repeat(50));
    
    result.trendingProducts.forEach((trend, index) => {
      console.log(`\n${index + 1}. ${trend.niche}`);
      console.log(`   📈 Nachfrage-Score: ${trend.demandScore}/100`);
      console.log(`   ⚔️  Competition: ${trend.competition}/100`);
      console.log(`   💰 Preisrange: €${trend.priceRange.min} - €${trend.priceRange.max}`);
      console.log(`   🏷️  Keywords: ${trend.keywords.join(', ')}`);
      console.log(`   📅 Saison: ${trend.seasonality.join(', ')}`);
    });

    // Als JSON speichern falls gewünscht
    if (argv.output) {
      const fs = await import('fs');
      fs.writeFileSync(argv.output, JSON.stringify(result, null, 2));
      console.log(`\n💾 Ergebnisse gespeichert in: ${argv.output}`);
    }

    // Quick Tips anzeigen
    console.log('\n💡 QUICK TIPS:');
    console.log('-'.repeat(50));
    
    const bestTrend = result.trendingProducts[0];
    if (bestTrend.demandScore > 70 && bestTrend.competition < 40) {
      console.log(`✅ EXZELLENT: "${bestTrend.niche}" hat hohe Nachfrage und niedrige Competition!`);
    } else if (bestTrend.demandScore > 50) {
      console.log(`⚠️  GUT: "${bestTrend.niche}" - solide Nachfrage, aber Competition beachten`);
    } else {
      console.log(`🔍 WEITERSUCHEN: Keine starken Trends gefunden - andere Keywords testen`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Fehler bei der Trend-Analyse:', error);
    process.exit(1);
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  main().catch(console.error);
}