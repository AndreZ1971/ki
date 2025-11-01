// backend/agent/jobs/runAutoProductCreator.ts
import minimist from 'minimist';

import { autoProductCreatorJob } from './autoProductCreator';

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
  keyword: 'datenschutz lösungen',  // 👈 Direkt ändern
  geo: 'DE',
  'max-products': '2',
  'min-score': '40',    // 👈 Stark reduzieren
  'max-competition': '70', // 👈 Stark erhöhen
  'auto-publish': false,
  help: false
}
  });

  // 🔍 DEBUG: Parameter-Überprüfung
  console.log('\n🔧 CLI PARAMETER-ANALYSE:');
  console.log('Empfangene Argumente:', process.argv.slice(2));
  console.log('Parsed argv:', argv);
  console.log(`Suchbegriff: "${argv.keyword}"`);
  console.log(`Region: ${argv.geo}`);
  console.log(`Max Produkte: ${argv['max-products']}`);
  console.log(`Auto-Publish: ${argv['auto-publish']}`);
  console.log('=' .repeat(50));

  // Manuell in Zahlen konvertieren
  const maxProducts = parseInt(argv['max-products'] as string);
  const minScore = parseInt(argv['min-score'] as string);
  const maxCompetition = parseInt(argv['max-competition'] as string);

  if (argv.help) {
    console.log(`
🛒 Auto Product Creator CLI - DEUTSCHER FOKUS

Usage:
  npm run auto-product -- [options]

Options:
  --keyword, -k          Suchbegriff (default: "dsgvo konforme software")
  --geo, -g              Region (default: "DE")
  --max-products, -m     Maximale Produkte (default: 3)
  --min-score, -s        Minimaler Demand Score (default: 70)
  --max-competition, -c  Maximale Competition (default: 40)
  --auto-publish, -p     Automatisch veröffentlichen (default: false)
  --help, -h             Hilfe anzeigen

Beispiele:
  npm run auto-product -- --keyword "datenschutz lösungen" --max-products 5
  npm run auto-product -- -k "deutsche software" -s 80 -c 30
  npm run auto-product -- --auto-publish
    `);
    process.exit(0);
  }

  try {
    console.log('🚀 Starte deutsche Produkt-Kreation...');
    
    const result = await autoProductCreatorJob({
      keyword: argv.keyword as string,
      geo: argv.geo as string,
      maxProducts,
      minDemandScore: minScore,
      maxCompetition: maxCompetition,
      autoPublish: argv['auto-publish'] as boolean
    });

    console.log('\n🎉 DEUTSCHE PRODUKT-KREATION ABGESCHLOSSEN!');
    
    if (result) {
      console.log(`📊 Analysierte Trends: ${result.analyzedTrends}`);
      console.log(`🎯 Geeignete Trends: ${result.eligibleTrends}`);
      console.log(`✅ Erstellte Produkte: ${result.createdProducts}`);
      
      if (result.products && result.products.length > 0) {
        console.log('\n📦 Erstellte Produkte:');
        result.products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} - €${product.price} (${product.status})`);
          if (product.categories) {
            console.log(`     📁 Kategorien: ${JSON.stringify(product.categories)}`);
          }
        });
      }
    }
    
  } catch (_error) {
    console.error('❌ Fehler bei deutscher Produkt-Kreation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}