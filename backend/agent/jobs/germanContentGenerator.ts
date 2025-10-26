// backend/agent/jobs/germanContentGenerator.ts
import { wooPost } from '../../tools/woo';

// Deutsche DSGVO-Produkte MANUELL vordefinieren
const GERMAN_DSGVO_PRODUCTS = [
  {
    name: "DSGVO Checkliste für Websites",
    description: "Umfassende Checkliste für DSGVO-konforme Websites - inklusive Impressum, Datenschutzerklärung und Cookie-Consent.",
    price: 19.99,
    category: 53, // Kits & Templates
    keywords: ["dsgvo", "checkliste", "website", "datenschutz"]
  },
  {
    name: "Datenschutz-Generator für Online-Shops", 
    description: "Automatischer Generator für rechtssichere Datenschutzerklärungen speziell für E-Commerce Shops.",
    price: 29.99,
    category: 53, // Kits & Templates
    keywords: ["datenschutz", "generator", "onlineshop", "dsgvo"]
  },
  {
    name: "Cookie-Consent Manager deutsch",
    description: "DSGVO-konformer Cookie-Consent Manager mit deutscher Rechtssprechung und einfacher Integration.",
    price: 39.99,
    category: 53, // Kits & Templates  
    keywords: ["cookie", "consent", "dsgvo", "manager"]
  },
  {
    name: "AVV Vertrag Vorlage",
    description: "Mustervertrag für Auftragsverarbeitung (AVV) gemäß DSGVO - anpassbar für verschiedene Dienstleister.",
    price: 24.99,
    category: 53, // Kits & Templates
    keywords: ["avv", "vertrag", "vorlage", "auftragsverarbeitung"]
  },
  {
    name: "Impressum Generator DSGVO konform",
    description: "Automatischer Impressum-Generator der alle deutschen gesetzlichen Anforderungen erfüllt.",
    price: 14.99,
    category: 53, // Kits & Templates
    keywords: ["impressum", "generator", "dsgvo", "rechtssicher"]
  }
];

async function createGermanDSGVOProducts() {
  console.log('🇩🇪 Starte deutsche DSGVO-Produkt-Erstellung...\n');
  
  const createdProducts = [];
  
  for (const [index, product] of GERMAN_DSGVO_PRODUCTS.entries()) {
    console.log(`🛒 Erstelle Produkt ${index + 1}/${GERMAN_DSGVO_PRODUCTS.length}: "${product.name}"`);
    
    try {
      const productData = {
        name: product.name,
        description: generateGermanDescription(product),
        short_description: product.description,
        regular_price: product.price.toString(),
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

      console.log(`📦 Sende an WooCommerce: ${product.name}`);
      const createdProduct = await wooPost('/products', productData);
      const productId = (createdProduct as any).id;
      
      console.log(`✅ Produkt #${productId} erstellt: ${product.name} - €${product.price}`);
      createdProducts.push({
        id: productId,
        name: product.name,
        price: product.price,
        status: 'draft'
      });
      
    } catch (error) {
      console.error(`❌ Fehler bei "${product.name}":`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log('\n🎉 DEUTSCHE DSGVO-PRODUKTE ERSTELLT!');
  console.log(`✅ ${createdProducts.length}/${GERMAN_DSGVO_PRODUCTS.length} Produkte erfolgreich`);
  
  if (createdProducts.length > 0) {
    console.log('\n📦 Erstellte Produkte:');
    createdProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (ID: ${product.id}) - €${product.price}`);
    });
  }
  
  return createdProducts;
}

function generateGermanDescription(product: any): string {
  return `
<h2>${product.name}</h2>
<p><strong>DSGVO-konforme Lösung made in Germany</strong></p>
<p>${product.description}</p>

<h3>🏆 Vorteile:</h3>
<ul>
  <li>✅ 100% DSGVO-konform</li>
  <li>✅ Deutsche Rechtssicherheit</li>
  <li>✅ Einfache Integration</li>
  <li>✅ Regelmäßige Updates</li>
</ul>

<h3>🛡️ Für wen geeignet?</h3>
<ul>
  <li>Deutsche Unternehmen</li>
  <li>Online-Shop Betreiber</li>
  <li>Webseiten mit Kundenkontakt</li>
  <li>Selbstständige & Freelancer</li>
</ul>

<p><em>⚠️ Wichtiger Hinweis: Dieses Produkt ersetzt keine individuelle Rechtsberatung.</em></p>
  `;
}

// Hauptfunktion
async function main() {
  try {
    await createGermanDSGVOProducts();
  } catch (error) {
    console.error('❌ Fehler in main:', error);
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  main().catch(console.error);
}

export { createGermanDSGVOProducts };