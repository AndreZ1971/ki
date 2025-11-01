// backend/agent/jobs/aiImageGenerator.ts - OPTIMIERTE VERSION
import { wooGet, wooPost } from '../../tools/woo';

// EXISTIERENDE Bilder von deiner Website
const EXISTING_IMAGES = [
  "https://kaufe-es.eu/wp-content/uploads/2025/10/DevStarter.png",
  "https://kaufe-es.eu/wp-content/uploads/2025/10/DevStarter-Bundles.png", 
  "https://kaufe-es.eu/wp-content/uploads/2025/10/cover01-3.png",
  "https://kaufe-es.eu/wp-content/uploads/2025/10/cover02.png"
];

async function generateProductImages() {
  console.log('🖼️ Starte Bild-Zuweisung für Produkte...\n');
  
  try {
    // 1. Produkte ohne Bilder finden
    const products = await wooGet('/products') as any[];
    const productsWithoutImages = products.filter(product => 
      !product.images || product.images.length === 0
    );
    
    console.log(`📊 Gefunden: ${products.length} Produkte total`);
    console.log(`🎯 ${productsWithoutImages.length} Produkte benötigen Bilder`);
    
    if (productsWithoutImages.length === 0) {
      console.log('✅ Alle Produkte haben bereits Bilder!');
      return [];
    }
    
    // 2. OPTIMIERT: Weniger Requests, bessere Error-Handling
    const updatedProducts = [];
    const failedProducts = [];
    
    for (const [index, product] of productsWithoutImages.entries()) {
      console.log(`\n🎨 [${index + 1}/${productsWithoutImages.length}] Weise Bild zu für: "${product.name}"`);
      
      try {
        const imageUrl = getExistingImage(product);
        
        // OPTIMIERT: Timeout vermeiden mit schnellerem Request
        const updatedProduct = await wooPost(`/products/${product.id}`, {
          images: [{
            src: imageUrl,
            alt: `Bild für ${product.name}`,
            name: product.name
          }]
        }, { timeout: 15000 }); // 👈 Kürzeres Timeout
        
        console.log(`✅ Bild zugewiesen zu Produkt #${product.id}`);
        updatedProducts.push({
          id: product.id,
          name: product.name,
          image: imageUrl
        });
        
        // OPTIMIERT: Kurze Pause zwischen Requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (_error) {
        console.error(`❌ Fehler bei Produkt #${product.id}:`, _error instanceof Error ? _error.message : 'Timeout/Server Error');
        failedProducts.push(product.id);
        
        // OPTIMIERT: Längere Pause nach Fehlern
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 BILDER-ZUWEISUNG ABGESCHLOSSEN!');
    console.log(`✅ ${updatedProducts.length}/${productsWithoutImages.length} Produkte mit Bildern aktualisiert`);
    console.log(`❌ ${failedProducts.length} Produkte fehlgeschlagen`);
    
    if (updatedProducts.length > 0) {
      console.log('\n📸 Erfolgreich aktualisierte Produkte:');
      updatedProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (ID: ${product.id})`);
      });
    }
    
    // 3. FALLBACK: Erneuter Versuch für fehlgeschlagene Produkte
    if (failedProducts.length > 0) {
      console.log(`\n🔄 Starte erneuten Versuch für ${failedProducts.length} fehlgeschlagene Produkte...`);
      
      for (const productId of failedProducts.slice(0, 3)) { // Nur 3 retry
        try {
          const retryImage = EXISTING_IMAGES[0]; // Einfaches Bild für Retry
          await wooPost(`/products/${productId}`, {
            images: [{ src: retryImage, alt: "Produkt Bild" }]
          }, { timeout: 20000 });
          
          console.log(`✅ Retry erfolgreich für Produkt #${productId}`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (_retryError) {
          console.log(`❌ Retry fehlgeschlagen für #${productId}`);
        }
      }
    }
    
    return updatedProducts;
    
  } catch (_error) {
    console.error('❌ Fehler bei der Bild-Zuweisung:', _error);
    return [];
  }
}

function getExistingImage(product: any): string {
  const index = product.id % EXISTING_IMAGES.length;
  return EXISTING_IMAGES[index];
}

// Hauptfunktion
async function main() {
  try {
    await generateProductImages();
  } catch (_error) {
    console.error('❌ Fehler in main:', _error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { generateProductImages };