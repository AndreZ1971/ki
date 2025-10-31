// backend/routes/app/api/woocommerce/customers.ts
import { FastifyPluginAsync } from 'fastify';

const customersRoutes: FastifyPluginAsync = async (fastify, options) => {
  
  // GET: Alle Kunden aus WooCommerce
  fastify.get('/customers', async (request, reply) => {
    try {
      // Für jetzt mocken wir die WooCommerce API Integration
      // Später ersetzen mit echter WooCommerce REST API
      
      const mockCustomers = [
        { 
          id: 1, 
          name: 'Max Mustermann', 
          email: 'max@mustermann.de',
          date_created: '2024-01-15T10:30:00',
          orders_count: 5,
          total_spent: '450.00'
        },
        { 
          id: 2, 
          name: 'Anna Schmidt', 
          email: 'anna@schmidt.com',
          date_created: '2024-02-20T14:22:00',
          orders_count: 3,
          total_spent: '210.50'
        },
        { 
          id: 3, 
          name: 'Thomas Weber', 
          email: 'jannro771@gmail.com',
          date_created: '2024-03-10T09:15:00',
          orders_count: 7,
          total_spent: '890.75'
        }
      ];

      return {
        success: true,
        data: mockCustomers,
        total: mockCustomers.length,
        message: 'Kunden erfolgreich geladen (Mock-Daten)'
      };
      
    } catch (error) {
      console.error('WooCommerce API Error:', error);
      const details = error instanceof Error ? error.message : String(error);
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
      // Mock-Daten für Abonnenten
      const mockSubscribers = [
        {
          id: 1,
          name: 'Max Mustermann',
          email: 'max@mustermann.de',
          status: 'subscribed',
          date_subscribed: '2024-01-20T08:00:00'
        },
        {
          id: 2, 
          name: 'Anna Schmidt',
          email: 'anna@schmidt.com',
          status: 'subscribed',
          date_subscribed: '2024-02-25T16:45:00'
        },
        {
          id: 3,
          name: 'Sarah Müller', 
          email: 'sarah@mueller.com',
          status: 'subscribed',
          date_subscribed: '2024-03-15T11:30:00'
        }
      ];

      return {
        success: true,
        data: mockSubscribers,
        total: mockSubscribers.length,
        message: 'Abonnenten erfolgreich geladen (Mock-Daten)'
      };
      
    } catch (error) {
      console.error('WooCommerce API Error:', error);
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
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Konnte Statistiken nicht laden' 
      });
    }
  });
};

export default customersRoutes;