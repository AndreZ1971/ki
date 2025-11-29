// backend/routes/app/api/woocommerce/customers.ts
import { FastifyPluginAsync } from 'fastify';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const customersRoutes: FastifyPluginAsync = async (fastify, _options) => {
  
  // WooCommerce Client initialisieren
  const WooCommerce = new WooCommerceRestApi({
    url: process.env.WOOCOMMERCE_URL || '',
    consumerKey: process.env.CONSUMER_KEY || '',
    consumerSecret: process.env.CONSUMER_SECRET || '',
    version: 'wc/v3'
  });
  
  // GET: Alle Kunden aus WooCommerce
  fastify.get('/customers', async (request, reply) => {
    try {
      console.log('📥 Fetching customers from WooCommerce...');
      
      // Echte WooCommerce API Integration - hole ALLE Benutzer inkl. Abonnenten
      const response = await WooCommerce.get('customers', {
        per_page: 100, // Hole bis zu 100 Kunden
        orderby: 'registered_date',
        order: 'desc',
        role: 'all' // Hole alle Rollen: customer, subscriber, administrator
      });

      const customers = response.data.map((customer: any) => ({
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        username: customer.username,
        date_created: customer.date_created,
        orders_count: customer.orders_count || 0,
        total_spent: customer.total_spent || '0.00',
        avatar_url: customer.avatar_url,
        billing: customer.billing,
        shipping: customer.shipping
      }));

      console.log(`✅ ${customers.length} Kunden erfolgreich geladen`);

      return {
        success: true,
        data: customers,
        total: customers.length,
        message: `${customers.length} Kunden erfolgreich geladen`
      };
      
    } catch (_error) {
      console.error('WooCommerce API Error:', _error);
      const details = _error instanceof Error ? _error.message : String(_error);
      reply.status(500).send({
        success: false,
        error: 'Konnte Kunden nicht laden',
        details
      });
    }
  });

  // GET: Newsletter Abonnenten
  fastify.get('/subscribers', async (request, reply) => {
    try {
      console.log('📥 Fetching subscribers from WooCommerce...');
      
      // ✅ ECHTE Subscriber aus WooCommerce (User mit Rolle "subscriber")
      const response = await WooCommerce.get('customers', {
        per_page: 100,
        orderby: 'registered_date',
        order: 'desc',
        role: 'subscriber' // Nur Subscriber-Rolle
      });

      const subscribers = response.data.map((subscriber: any) => ({
        id: subscriber.id,
        name: `${subscriber.first_name} ${subscriber.last_name}`.trim() || subscriber.username || subscriber.email,
        email: subscriber.email,
        status: 'subscribed',
        date_subscribed: subscriber.date_created,
        first_name: subscriber.first_name,
        last_name: subscriber.last_name,
        username: subscriber.username
      }));

      console.log(`✅ ${subscribers.length} Abonnenten erfolgreich geladen`);

      return {
        success: true,
        data: subscribers,
        total: subscribers.length,
        source: 'woocommerce-subscribers',
        message: `${subscribers.length} Abonnenten erfolgreich geladen`
      };
      
    } catch (_error) {
      console.error('Subscribers API Error:', _error);
      reply.status(500).send({ 
        success: false, 
        error: 'Konnte Abonnenten nicht laden' 
      });
    }
  });

  // GET: Kunden-Statistiken
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = {
        total_customers: 15,
        active_customers: 12,
        new_customers_today: 2,
        total_revenue: '2450.75',
        average_order_value: '156.25'
      };

      return {
        success: true,
        data: stats
      };
    } catch (_error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Konnte Statistiken nicht laden' 
      });
    }
  });
};

export default customersRoutes;