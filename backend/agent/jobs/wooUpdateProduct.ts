import { logger } from '../../logger.js';
import { wooPost } from '../../tools/woo.js';

export interface UpdateProductConfig {
  productId: number;
  updates: {
    name?: string;
    regular_price?: string;
    sale_price?: string;
    description?: string;
    short_description?: string;
    stock_status?: 'instock' | 'outofstock' | 'onbackorder';
    stock_quantity?: number;
    categories?: Array<{ id: number }>;
    images?: Array<{ src: string }>;
    [key: string]: unknown;
  };
}

/**
 * Aktualisiert ein bestehendes Produkt in WooCommerce
 */
export async function run(config: UpdateProductConfig): Promise<any> {
  try {
    const { productId, updates } = config;
    
    logger.info({ productId, updates: Object.keys(updates) }, 'Starte wooUpdateProduct Job');
    
    if (!productId || Number.isNaN(Number(productId))) {
      throw new Error('Gültige productId ist erforderlich');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Keine Updates angegeben');
    }

    const result = await wooPost(`products/${productId}`, updates, {});
    
    logger.info({ productId, updatedFields: Object.keys(updates) }, 'wooUpdateProduct erfolgreich abgeschlossen');
    return result;
  } catch (error: any) {
    logger.error({ error: error.message, config }, 'Fehler in wooUpdateProduct');
    throw error;
  }
}

export default run;