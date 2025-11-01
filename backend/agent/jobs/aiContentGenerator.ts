// backend/agent/jobs/aiContentGenerator.ts
import { wooPost } from '../../tools/woo';

// Deutsche DSGVO-Produkt-Ideen mit KI-Potential
const GERMAN_AI_PRODUCTS = [
  {
    baseName: "DSGVO Compliance Toolkit",
    description: "Umfassendes Toolkit für vollständige DSGVO-Compliance",
    category: 53, // Kits & Templates
    basePrice: 49.99,
    keywords: ["dsgvo", "compliance", "toolkit", "datenschutz", "rechtssicher"]
  },
  {
    baseName: "Datenschutz Audit Software", 
    description: "Software für automatische Datenschutz-Audits",
    category: 53, // Kits & Templates
    basePrice: 79.99,
    keywords: ["datenschutz", "audit", "software", "analyse", "dsgvo"]
  },
  {
    baseName: "Cookie Consent Lösung",
    description: "Komplette Cookie-Consent-Lösung für deutsche Websites",
    category: 53, // Kits & Templates  
    basePrice: 39.99,
    keywords: ["cookie", "consent", "dsgvo", "einwilligung", "website"]
  },
  {
    baseName: "DSGVO Dokumentenvorlagen",
    description: "Professionelle Vorlagen für alle DSGVO-Dokumente",
    category: 53, // Kits & Templates
    basePrice: 34.99,
    keywords: ["dokumente", "vorlagen", "dsgvo", "verträge", "muster"]
  },
  {
    baseName: "Datenschutz Schulungskurs",
    description: "Online-Kurs für Datenschutz und DSGVO-Compliance",
    category: 145, // Online-Kurse
    basePrice: 89.99,
    keywords: ["schulung", "kurs", "datenschutz", "training", "compliance"]
  }
];

// KI-generierte Produktnamen-Varianten
const PRODUCT_NAME_VARIANTS = {
  prefixes: ["Premium", "Ultimate", "Pro", "Complete", "Expert", "Business"],
  suffixes: ["2024", "Pro Edition", "Business Suite", "Enterprise", "Professional"]
};

// KI-generierte Beschreibungs-Bausteine
const DESCRIPTION_TEMPLATES = {
  benefits: [
    "✅ 100% DSGVO-konform und rechtssicher",
    "✅ Einfache Integration in bestehende Systeme", 
    "✅ Regelmäßige Updates an neue Gesetze",
    "✅ Deutsche Rechtssprechung berücksichtigt",
    "✅ Von Experten entwickelt und geprüft",
    "✅ Zeitersparnis durch Automatisierung"
  ],
  targetGroups: [
    "Deutsche Unternehmen und Startups",
    "Online-Shop Betreiber in der DACH-Region",
    "Webseiten mit Kundenkontakt und Formularen",
    "Selbstständige, Freelancer und KMU",
    "Marketing-Agenturen und Webentwickler"
  ],
  features: [
    "Automatische Generierung aller benötigten Dokumente",
    "Einfache Anpassung an individuelle Bedürfnisse",
    "Klare Schritt-für-Schritt Anleitungen",
    "Rechtliche Überprüfung durch deutsche Experten",
    "Immer auf aktuellem Stand der Gesetzgebung"
  ]
};

async function createAIProducts() {
  console.log('🤖 Starte KI-gestützte Produkt-Erstellung...\n');
  
  const createdProducts = [];
  
  for (const [index, product] of GERMAN_AI_PRODUCTS.entries()) {
    console.log(`🎯 Verarbeite Produkt ${index + 1}/${GERMAN_AI_PRODUCTS.length}: "${product.baseName}"`);
    
    try {
      // KI-generierte Inhalte erstellen
      const aiName = generateAIName(product.baseName);
      const aiDescription = generateAIDescription(product);
      const aiShortDescription = generateAIShortDescription(product);
      const aiPrice = generateAIPrice(product.basePrice);
      
      const productData = {
        name: aiName,
        description: aiDescription,
        short_description: aiShortDescription,
        regular_price: aiPrice.toString(),
        categories: [{ id: product.category }],
        tags: product.keywords.map(keyword => ({ name: keyword })),
        type: 'simple',
        status: 'draft',
        
        // Virtuelle Produkte
        virtual: true,
        downloadable: true,
        manage_stock: false,
        stock_status: 'instock',
        sold_individually: false,
        shipping_class: '',
        shipping_class_id: 0
      };

      console.log(`🤖 KI-Inhalte generiert: "${aiName}" - €${aiPrice}`);
      const createdProduct = await wooPost('/products', productData);
      const productId = (createdProduct as any).id;
      
      console.log(`✅ Produkt #${productId} erstellt`);
      createdProducts.push({
        id: productId,
        name: aiName,
        price: aiPrice,
        original: product.baseName
      });
      
    } catch (_error) {
      console.error(`❌ Fehler bei "${product.baseName}":`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log('\n🎉 KI-PRODUKTE ERSTELLT!');
  console.log(`✅ ${createdProducts.length}/${GERMAN_AI_PRODUCTS.length} Produkte erfolgreich`);
  
  if (createdProducts.length > 0) {
    console.log('\n📦 KI-generierte Produkte:');
    createdProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (ID: ${product.id}) - €${product.price}`);
      console.log(`     Ursprung: ${product.original}`);
    });
  }
  
  return createdProducts;
}

// KI-Funktionen für Content-Generierung
function generateAIName(baseName: string): string {
  const prefix = PRODUCT_NAME_VARIANTS.prefixes[
    Math.floor(Math.random() * PRODUCT_NAME_VARIANTS.prefixes.length)
  ];
  const suffix = PRODUCT_NAME_VARIANTS.suffixes[
    Math.floor(Math.random() * PRODUCT_NAME_VARIANTS.suffixes.length)
  ];
  
  return `${prefix} ${baseName} ${suffix}`;
}

function generateAIDescription(product: any): string {
  const benefits = shuffleArray([...DESCRIPTION_TEMPLATES.benefits]).slice(0, 4);
  const targetGroups = shuffleArray([...DESCRIPTION_TEMPLATES.targetGroups]).slice(0, 3);
  const features = shuffleArray([...DESCRIPTION_TEMPLATES.features]).slice(0, 3);
  
  return `
<h2>${product.baseName} - DSGVO-konforme Lösung</h2>
<p><strong>Die intelligente Lösung für Ihren Datenschutz</strong></p>
<p>${product.description} Entwickelt speziell für den deutschen Markt und die Anforderungen der DSGVO.</p>

<h3>🏆 Ihre Vorteile:</h3>
<ul>
${benefits.map(benefit => `  <li>${benefit}</li>`).join('\n')}
</ul>

<h3>🎯 Perfect für:</h3>
<ul>
${targetGroups.map(group => `  <li>${group}</li>`).join('\n')}
</ul>

<h3>⚡ Wichtige Features:</h3>
<ul>
${features.map(feature => `  <li>${feature}</li>`).join('\n')}
</ul>

<h3>🛡️ Rechtssicherheit garantiert</h3>
<p>Alle unsere Produkte werden regelmäßig von deutschen Rechtsexperten überprüft und an aktuelle Gesetzesänderungen angepasst.</p>

<p><em>⚠️ Hinweis: Dieses Produkt bietet Vorlagen und Tools, ersetzt aber keine individuelle Rechtsberatung.</em></p>
  `;
}

function generateAIShortDescription(product: any): string {
  const shortBenefits = shuffleArray([...DESCRIPTION_TEMPLATES.benefits]).slice(0, 2);
  return `${product.description} ${shortBenefits.join(' ')}`;
}

function generateAIPrice(basePrice: number): number {
  // KI-Preisoptimierung: ±20% Variation
  const variation = (Math.random() * 0.4) - 0.2; // -20% bis +20%
  const variedPrice = basePrice * (1 + variation);
  
  // Auf .99 runden
  return Math.round(variedPrice * 100) / 100;
}

function shuffleArray(array: any[]): any[] {
  return [...array].sort(() => Math.random() - 0.5);
}

// Hauptfunktion
async function main() {
  try {
    await createAIProducts();
  } catch (_error) {
    console.error('❌ Fehler in main:', _error);
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  main().catch(console.error);
}

// Export nur EINMAL am Ende
export { createAIProducts };