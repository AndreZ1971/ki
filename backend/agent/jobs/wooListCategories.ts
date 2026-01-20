import { logger } from '../../logger.js';
import { wooGet } from '../../tools/woo.js';

export interface ListCategoriesConfig {
  per_page?: number;
  orderby?: 'id' | 'name' | 'slug' | 'count';
  order?: 'asc' | 'desc';
  hide_empty?: boolean;
}

/**
 * Listet alle WooCommerce Produktkategorien
 */
export async function run(config: ListCategoriesConfig = {}): Promise<any[]> {
  try {
    logger.info({ config }, 'Starte wooListCategories Job');
    
    const params = {
      per_page: config.per_page || 100,
      orderby: config.orderby || 'name',
      order: config.order || 'asc',
      hide_empty: config.hide_empty !== undefined ? config.hide_empty : false
    };

    const categories = await wooGet('products/categories', params) as any[];
    
    logger.info({ count: categories.length }, 'wooListCategories erfolgreich abgeschlossen');
    return categories;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Fehler in wooListCategories');
    throw error;
  }
}

export default run;