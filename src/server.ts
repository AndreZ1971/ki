// src/server.ts
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import underPressure from '@fastify/under-pressure';
import fastify from 'fastify';
import { z } from 'zod';

import { ChatMessage, Memory } from './agent/memory.js';


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
const agentMemory = new Memory(200);

// Zod Schemas für Validation
const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().min(1).max(5000),
});

const pushMessageSchema = z.object({
  message: chatMessageSchema,
});

const bulkMessagesSchema = z.object({
  messages: z.array(chatMessageSchema).max(200),
});

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
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
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
        200: z.object({
          status: z.string(),
          timestamp: z.string(),
          memorySize: z.number(),
          uptime: z.number(),
        }),
      },
    },
  },
  async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      memorySize: agentMemory.size(),
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
        200: z.object({
          messages: z.array(chatMessageSchema),
          total: z.number(),
        }),
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
server.post<{ Body: { message: ChatMessage } }>(
  '/memory',
  {
    schema: {
      description: 'Push a single message to memory',
      tags: ['Memory'],
      body: pushMessageSchema,
      response: {
        201: z.object({
          success: z.boolean(),
          message: z.string(),
          currentSize: z.number(),
        }),
      },
    },
  },
  async (request, reply) => {
    const { message } = request.body;

    agentMemory.push(message);

    reply.code(201);
    return {
      success: true,
      message: 'Message added to memory',
      currentSize: agentMemory.size(),
    };
  }
);

// Push multiple messages
server.post<{ Body: { messages: ChatMessage[] } }>(
  '/memory/bulk',
  {
    schema: {
      description: 'Push multiple messages to memory',
      tags: ['Memory'],
      body: bulkMessagesSchema,
      response: {
        201: z.object({
          success: z.boolean(),
          message: z.string(),
          added: z.number(),
          currentSize: z.number(),
        }),
      },
    },
  },
  async (request, reply) => {
    const { messages } = request.body;
    const initialSize = agentMemory.size();

    messages.forEach((message) => agentMemory.push(message));

    reply.code(201);
    return {
      success: true,
      message: 'Messages added to memory',
      added: agentMemory.size() - initialSize,
      currentSize: agentMemory.size(),
    };
  }
);

// Clear memory
server.delete(
  '/memory',
  {
    schema: {
      description: 'Clear all messages from memory',
      tags: ['Memory'],
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
          cleared: z.number(),
        }),
      },
    },
  },
  async () => {
    const previousSize = agentMemory.size();
    agentMemory.clear();

    return {
      success: true,
      message: 'Memory cleared',
      cleared: previousSize,
    };
  }
);

// Get memory stats
server.get(
  '/memory/stats',
  {
    schema: {
      description: 'Get memory statistics',
      tags: ['Memory'],
      response: {
        200: z.object({
          totalMessages: z.number(),
          maxCapacity: z.number(),
          usagePercentage: z.number(),
        }),
      },
    },
  },
  async () => {
    const currentSize = agentMemory.size();
    const maxCapacity = 200; // From Memory constructor

    return {
      totalMessages: currentSize,
      maxCapacity,
      usagePercentage: (currentSize / maxCapacity) * 100,
    };
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
    console.log(`📚 API Documentation available at ${address}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

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
