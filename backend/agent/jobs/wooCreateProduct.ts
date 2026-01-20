import { logger } from '../../logger.js';
import { wooPost } from '../../tools/woo.js';

export interface CreateProductConfig {
  name: string;
  type?: 'simple' | 'virtual' | 'downloadable' | 'variable';
  regular_price?: string;
  description?: string;
  short_description?: string;
  categories?: Array<{ id: number }>;
  images?: Array<{ src: string }>;
  manage_stock?: boolean;
  stock_quantity?: number;
  virtual?: boolean;
  downloadable?: boolean;
  [key: string]: unknown;
}

/**
 * Erstellt ein neues Produkt in WooCommerce
 */
export async function run(config: CreateProductConfig): Promise<any> {
  try {
    logger.info({ productName: config.name, type: config.type }, 'Starte wooCreateProduct Job');
    
    if (!config.name) {
      throw new Error('Produktname ist erforderlich');
    }

    const productData: CreateProductConfig = {
      type: 'simple',
      status: 'publish',
      ...config
    };

    const result = await wooPost('products', productData, {}) as any;
    
    logger.info({ productId: result.id, name: result.name }, 'wooCreateProduct erfolgreich abgeschlossen');
    return result;
  } catch (error: any) {
    logger.error({ error: error.message, config }, 'Fehler in wooCreateProduct');
    throw error;
  }
}

export default run;