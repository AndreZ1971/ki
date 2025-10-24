// src/server.ts
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import underPressure from '@fastify/under-pressure';
import fastify from 'fastify';
import { WooCommerceClient } from './woocommerce/client.js';

import { Memory } from './agent/memory.js';

// ChatMessage lokal definieren
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

// Server erstellen
const server = fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Global Memory Instance
const agentMemory = new Memory();

// FIX: Helper functions für Memory-Operationen
const getMemorySize = (): number => {
  return agentMemory.all().length;
};

const clearMemory = (): number => {
  const previousSize = getMemorySize();
  (agentMemory as any).messages = [];
  return previousSize;
};

// Swagger Configuration
const swaggerConfig = {
  swagger: {
    info: {
      title: 'AI Agent API',
      description: 'API for AI Agent with Memory Management',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  },
};

const swaggerUIConfig = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list' as const,
    deepLinking: true
  },
  staticCSP: true
};

// Register Plugins
await server.register(helmet);
await server.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
});
await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
await server.register(underPressure, {
  maxEventLoopDelay: 1000,
  maxHeapUsedBytes: 1000000000,
  maxRssBytes: 1000000000,
  message: 'Under pressure!',
  retryAfter: 50,
});
await server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
await server.register(swagger, swaggerConfig);
await server.register(swaggerUI, swaggerUIConfig);

// Health Check Route
server.get(
  '/health',
  {
    schema: {
      description: 'Health check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            memorySize: { type: 'number' },
            uptime: { type: 'number' },
          },
          required: ['status', 'timestamp', 'memorySize', 'uptime']
        },
      },
    },
  },
  async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      memorySize: getMemorySize(),
      uptime: process.uptime(),
    };
  }
);

// Get all messages
server.get(
  '/memory',
  {
    schema: {
      description: 'Get all messages from memory',
      tags: ['Memory'],
      response: {
        200: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['system', 'user', 'assistant', 'tool'] },
                  content: { type: 'string' }
                },
                required: ['role', 'content']
              }
            },
            total: { type: 'number' }
          },
          required: ['messages', 'total']
        },
      },
    },
  },
  async () => {
    const messages = agentMemory.all();
    return {
      messages,
      total: messages.length,
    };
  }
);

// Push single message
server.post(
  '/memory',
  {
    schema: {
      description: 'Push a single message to memory',
      tags: ['Memory'],
      body: {
        type: 'object',
        properties: {
          message: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['system', 'user', 'assistant', 'tool'] },
              content: { type: 'string' }
            },
            required: ['role', 'content']
          }
        },
        required: ['message']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            currentSize: { type: 'number' }
          },
          required: ['success', 'message', 'currentSize']
        },
      },
    },
  },
  async (request, reply) => {
    const { message } = request.body as any;
    agentMemory.push(message);
    
    reply.code(201);
    return {
      success: true,
      message: 'Message added to memory',
      currentSize: getMemorySize(),
    };
  }
);

// Push multiple messages - FIXED
server.post(
  '/memory/bulk',
  {
    schema: {
      description: 'Push multiple messages to memory',
      tags: ['Memory'],
      body: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['system', 'user', 'assistant', 'tool'] },
                content: { type: 'string' }
              },
              required: ['role', 'content']
            }
          }
        },
        required: ['messages']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            added: { type: 'number' },
            currentSize: { type: 'number' }
          },
          required: ['success', 'message', 'added', 'currentSize']
        },
      },
    },
  },
  async (request, reply) => {
    const { messages } = request.body as any;
    const initialSize = getMemorySize();

    messages.forEach((message: ChatMessage) => agentMemory.push(message));

    reply.code(201);
    return {
      success: true,
      message: 'Messages added to memory',
      added: getMemorySize() - initialSize,
      currentSize: getMemorySize(),
    };
  }
);

// Clear memory - FIXED
server.delete(
  '/memory',
  {
    schema: {
      description: 'Clear all messages from memory',
      tags: ['Memory'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            cleared: { type: 'number' }
          },
          required: ['success', 'message', 'cleared']
        },
      },
    },
  },
  async () => {
    const cleared = clearMemory();

    return {
      success: true,
      message: 'Memory cleared',
      cleared,
    };
  }
);

// Get memory stats - FIXED
server.get(
  '/memory/stats',
  {
    schema: {
      description: 'Get memory statistics',
      tags: ['Memory'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalMessages: { type: 'number' },
            maxCapacity: { type: 'number' },
            usagePercentage: { type: 'number' }
          },
          required: ['totalMessages', 'maxCapacity', 'usagePercentage']
        },
      },
    },
  },
  async () => {
    const currentSize = getMemorySize();
    const maxCapacity = 200;

    return {
      totalMessages: currentSize,
      maxCapacity,
      usagePercentage: (currentSize / maxCapacity) * 100,
    };
  }
);

// Get WooCommerce Products
server.get(
  '/woo/products',
  {
    schema: {
      description: 'Get products from WooCommerce',
      tags: ['WooCommerce'],
      querystring: {
        type: 'object',
        properties: {
          per_page: { type: 'number', default: 10 },
          page: { type: 'number', default: 1 },
          search: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            products: { type: 'array' },
            total: { type: 'number' }
          },
          required: ['success', 'products', 'total']
        }
      }
    }
  },
  async (request) => {
    const { per_page = 10, page = 1, search } = request.query as any;
    const wooClient = new WooCommerceClient();
    
    let endpoint = `products?per_page=${per_page}&page=${page}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }

    const products = await wooClient.get<any[]>(endpoint);
    
    return {
      success: true,
      products,
      total: products.length
    };
  }
);

// Get WooCommerce Categories
server.get(
  '/woo/categories',
  {
    schema: {
      description: 'Get categories from WooCommerce',
      tags: ['WooCommerce'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            categories: { type: 'array' },
            total: { type: 'number' }
          },
          required: ['success', 'categories', 'total']
        }
      }
    }
  },
  async () => {
    const wooClient = new WooCommerceClient();
    const categories = await wooClient.get<any[]>('products/categories?per_page=100');
    
    return {
      success: true,
      categories,
      total: categories.length
    };
  }
);

// Create WooCommerce Product
server.post(
  '/woo/products',
  {
    schema: {
      description: 'Create a new product in WooCommerce',
      tags: ['WooCommerce'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['simple', 'variable', 'grouped', 'external'], default: 'simple' },
          status: { type: 'string', enum: ['draft', 'publish', 'pending', 'private'], default: 'publish' },
          regular_price: { type: 'string' },
          description: { type: 'string' },
          short_description: { type: 'string' },
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' }
              }
            }
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                src: { type: 'string' },
                name: { type: 'string' },
                alt: { type: 'string' }
              }
            }
          },
          virtual: { type: 'boolean', default: false },
          downloadable: { type: 'boolean', default: false },
          downloads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                file: { type: 'string' }
              }
            }
          }
        },
        required: ['name']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            product: { type: 'object' },
            message: { type: 'string' }
          },
          required: ['success', 'product']
        }
      }
    }
  },
  async (request, reply) => {
    const productData = request.body as any;
    const wooClient = new WooCommerceClient();

    try {
      const product = await wooClient.post<any>('products', productData);
      
      reply.code(201);
      return {
        success: true,
        product,
        message: 'Product created successfully'
      };
    } catch (error) {
      console.error('Error creating product:', error);
      reply.code(500);
      return {
        success: false,
        product: null,
        message: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
);

// Error Handler
server.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    reply.code(400).send({
      success: false,
      error: 'Validation Error',
      details: error.validation,
    });
    return;
  }

  reply.code(500).send({
    success: false,
    error: 'Internal Server Error',
  });
});

// Not Found Handler
server.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    success: false,
    error: 'Route not found',
    path: request.url,
  });
});

// Start Server
const start = async () => {
  try {
    const address = await server.listen({
      port: 3000,
      host: '0.0.0.0',
    });
    console.log(`🚀 Server listening on ${address}`);
    console.log(`📚 API Documentation available at ${address}/documentation`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Server starten
start().catch(console.error);

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

export { server, agentMemory };
export default start;