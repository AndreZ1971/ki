import { FastifyInstance, FastifyPluginOptions } from 'fastify';

interface MemoryMessage {
  role: string;
  content: string;
  timestamp: number;
}

interface AgentMemory {
  messages: MemoryMessage[];
  addMessage: (role: string, content: string) => void;
  addMessages: (messages: MemoryMessage[]) => void;
  getMessages: () => MemoryMessage[];
  clearMessages: () => void;
  getStats: () => { totalMessages: number; memorySize: number };
}

// Simple in-memory implementation of AgentMemory.
// Note: to keep the exported `messages` array reference stable for any consumers,
// we mutate the array in-place instead of reassigning it.
const agentMemory: AgentMemory = (() => {
  const messages: MemoryMessage[] = [];

  const addMessage = (role: string, content: string) => {
    messages.push({
      role,
      content,
      timestamp: Date.now()
    });
  };

  const addMessages = (msgs: MemoryMessage[]) => {
    const normalized = msgs.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || Date.now()
    }));
    messages.push(...normalized);
  };

  const getMessages = () => messages.slice();

  const clearMessages = () => {
    messages.length = 0;
  };

  const getStats = () => {
    const totalMessages = messages.length;
    const memorySize = Buffer.byteLength(JSON.stringify(messages), 'utf8');
    return { totalMessages, memorySize };
  };

  return { messages, addMessage, addMessages, getMessages, clearMessages, getStats };
})();

export default async function memoryRoutes(server: FastifyInstance, options: FastifyPluginOptions) {
  // Get memory
  server.get('/memory', {
    schema: {
      tags: ['memory'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request: any) => {
    try {
      const { limit, offset } = request.query;
      const allMessages = agentMemory.getMessages();
      const messages = allMessages.slice(offset, offset + limit);
      
      return {
        success: true,
        data: {
          messages,
          pagination: {
            total: allMessages.length,
            limit,
            offset,
            hasMore: offset + limit < allMessages.length
          }
        }
      };
    } catch (error: any) {
      server.log.error('Fehler beim Abrufen des Memory:', error);
      throw new Error(`Failed to fetch memory: ${error.message}`);
    }
  });

  // Push message
  server.post('/memory', {
    schema: {
      tags: ['memory'],
      body: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['user', 'assistant', 'system'] },
          content: { type: 'string' },
          timestamp: { type: 'number' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { role, content, timestamp } = request.body;
      agentMemory.addMessage(role, content);
      
      reply.code(201);
      return { 
        success: true, 
        message: 'Message added successfully',
        data: { role, content, timestamp: timestamp || Date.now() }
      };
    } catch (error: any) {
      server.log.error('Fehler beim Hinzufügen der Message:', error);
      throw new Error(`Failed to add message: ${error.message}`);
    }
  });

  // Bulk messages
  server.post('/memory/bulk', {
    schema: {
      tags: ['memory'],
      body: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                content: { type: 'string' },
                timestamp: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { messages } = request.body;
      agentMemory.addMessages(messages);
      
      reply.code(201);
      return { 
        success: true, 
        message: `${messages.length} messages added successfully`,
        data: { count: messages.length }
      };
    } catch (error: any) {
      server.log.error('Fehler beim Bulk-Add von Messages:', error);
      throw new Error(`Failed to add bulk messages: ${error.message}`);
    }
  });

  // Clear memory
  server.delete('/memory', {
    schema: {
      tags: ['memory']
    }
  }, async () => {
    try {
      agentMemory.clearMessages();
      return { 
        success: true, 
        message: 'Memory cleared successfully' 
      };
    } catch (error: any) {
      server.log.error('Fehler beim Löschen des Memory:', error);
      throw new Error(`Failed to clear memory: ${error.message}`);
    }
  });

  // Memory stats
  server.get('/memory/stats', {
    schema: {
      tags: ['memory']
    }
  }, async () => {
    try {
      const stats = agentMemory.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      server.log.error('Fehler beim Abrufen der Memory Stats:', error);
      throw new Error(`Failed to fetch memory stats: ${error.message}`);
    }
  });
}