// backend/agent/jobs/getCategories.ts
import { wooGet } from '../../tools/woo';

async function listCategories() {
  try {
    console.log('📋 Lade WooCommerce Kategorien...');
    const categories = await wooGet('/products/categories');
    console.log('✅ Verfügbare Kategorien:');
    
    (categories as any[]).forEach((cat: any) => {
      console.log(`   📁 ${cat.name} (ID: ${cat.id})`);
    });
    
    return categories;
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

listCategories();