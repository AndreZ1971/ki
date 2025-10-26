// backend/agent/jobs/runAutoProductCreator.ts
import { autoProductCreatorJob } from './autoProductCreator';
import minimist from 'minimist';

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['keyword', 'geo'],
    boolean: ['auto-publish', 'help'],
    alias: {
      k: 'keyword',
      g: 'geo',
      m: 'max-products',
      s: 'min-score',
      c: 'max-competition',
      p: 'auto-publish',
      h: 'help'
    },
    default: {
      keyword: 'digitale produkte',
      geo: 'DE',
      'max-products': '3',
      'min-score': '70',
      'max-competition': '40',
      'auto-publish': false,
      help: false
    }
  });

  // Manuell in Zahlen konvertieren
  const maxProducts = parseInt(argv['max-products'] as string);
  const minScore = parseInt(argv['min-score'] as string);
  const maxCompetition = parseInt(argv['max-competition'] as string);

  if (argv.help) {
    console.log(`
🛒 Auto Product Creator CLI

Usage:
  npm run auto-product -- [options]

Options:
  --keyword, -k          Suchbegriff (default: "digitale produkte")
  --geo, -g              Region (default: "DE")
  --max-products, -m     Maximale Produkte (default: 3)
  --min-score, -s        Minimaler Demand Score (default: 70)
  --max-competition, -c  Maximale Competition (default: 40)
  --auto-publish, -p     Automatisch veröffentlichen (default: false)
  --help, -h             Hilfe anzeigen

Examples:
  npm run auto-product -- --keyword "online courses" --max-products 5
  npm run auto-product -- -k "software tools" -s 80 -c 30
  npm run auto-product -- --auto-publish
    `);
    process.exit(0);
  }

  try {
    const result = await autoProductCreatorJob({
      keyword: argv.keyword as string,
      geo: argv.geo as string,
      maxProducts,
      minDemandScore: minScore,
      maxCompetition: maxCompetition,
      autoPublish: argv['auto-publish'] as boolean
    });

    console.log('\n🎉 AUTOMATISCHE PRODUKT-KREATION ABGESCHLOSSEN!');
    
    if (result) {
      console.log(`📊 Analysierte Trends: ${result.analyzedTrends}`);
      console.log(`🎯 Geeignete Trends: ${result.eligibleTrends}`);
      console.log(`✅ Erstellte Produkte: ${result.createdProducts}`);
      
      if (result.products && result.products.length > 0) {
        console.log('\n📦 Erstellte Produkte:');
        result.products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} - €${product.price} (${product.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler bei automatischer Produkt-Kreation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}