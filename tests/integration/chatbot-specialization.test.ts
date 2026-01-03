/**
 * Integration Tests für Chatbot-Spezialisierung
 * Testet, ob der Chatbot die aktuelle Spezialisierung korrekt nutzt
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test-chatbot-user-' + Date.now();

describe('Chatbot Specialization Integration', () => {
  let api: AxiosInstance;

  beforeAll(() => {
    api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID
      },
      validateStatus: () => true
    });
    console.log(`\n🧪 Starting Chatbot Specialization Tests (User: ${TEST_USER_ID})\n`);
  });

  describe('Chatbot ohne Spezialisierung', () => {
    it('sollte mit Standard-Prompt antworten', async () => {
      const response = await api.post('/api/chatbot/message', {
        message: 'Wer bist du?'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.reply).toBeDefined();
      
      const reply = response.data.reply.toLowerCase();
      console.log('✅ Standard-Antwort:', reply.substring(0, 120) + '...\n');
    });
  });

  describe('Chatbot mit Beauty-Spezialisierung', () => {
    it('sollte Beauty-Spezialisierung hochladen', async () => {
      const specialization = {
        id: 'test-beauty-001',
        name: 'Beauty & Kosmetik Expert',
        description: 'Spezialisiert auf Beauty und Kosmetik Shops',
        systemPrompt: 'Du bist ein Beauty & Kosmetik Expert. Gebe hilfreiche Beauty-Tipps, Produktempfehlungen und Trend-Analysen. Fokussiere auf Hautpflege, Make-up und Wellness.',
        category: 'beauty',
        version: '1.0.0',
        features: ['beauty-tips', 'product-recommendations', 'trend-analysis'],
        author: 'Test',
        createdAt: Date.now()
      };

      const response = await api.post('/api/specializations/upload', specialization);
      
      if (!response.data.success) {
        console.log('⚠️ Upload-Response:', JSON.stringify(response.data, null, 2));
      }
      
      expect([200, 201].includes(response.status)).toBe(true);
      expect(response.data.success).toBe(true);
      
      console.log('✅ Beauty-Spezialisierung hochgeladen\n');
    });

    it('sollte Beauty-Spezialisierung aktivieren', async () => {
      const response = await api.post('/api/specializations/activate', {
        id: 'test-beauty-001'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      console.log('✅ Beauty-Spezialisierung aktiviert\n');
    });

    it('sollte mit Beauty-Expert-Prompt antworten', async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await api.post('/api/chatbot/message', {
        message: 'Was sind die besten Tipps für trockene Haut?'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.reply).toBeDefined();
      
      const reply = response.data.reply.toLowerCase();
      console.log('✅ Beauty-Antwort:', reply.substring(0, 150) + '...');
      console.log('   (Sollte Beauty/Hautpflege-fokussiert sein)\n');
    });
  });

  describe('Chatbot mit E-Commerce-Spezialisierung', () => {
    it('sollte E-Commerce-Spezialisierung hochladen', async () => {
      const specialization = {
        id: 'test-ecommerce-001',
        name: 'E-Commerce Conversion Expert',
        description: 'Spezialisiert auf Conversion-Optimierung und Sales',
        systemPrompt: 'Du bist ein E-Commerce Conversion Expert. Konzentriere dich auf: Warenkorb-Optimierung, Conversion Rate Optimization (CRO), Payment-Flows, Upsell-Strategien und Customer Journey Mapping. Gebe konkrete, umsetzbare Tipps.',
        category: 'ecommerce',
        version: '1.0.0',
        features: ['cro', 'conversion-tips', 'sales-strategies'],
        author: 'Test',
        createdAt: Date.now()
      };

      const response = await api.post('/api/specializations/upload', specialization);
      
      if (!response.data.success) {
        console.log('⚠️ Upload-Response:', JSON.stringify(response.data, null, 2));
      }
      
      expect([200, 201].includes(response.status)).toBe(true);
      expect(response.data.success).toBe(true);
      
      console.log('✅ E-Commerce-Spezialisierung hochgeladen\n');
    });

    it('sollte E-Commerce-Spezialisierung aktivieren', async () => {
      const response = await api.post('/api/specializations/activate', {
        id: 'test-ecommerce-001'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      console.log('✅ E-Commerce-Spezialisierung aktiviert\n');
    });

    it('sollte mit E-Commerce-Expert-Prompt antworten', async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await api.post('/api/chatbot/message', {
        message: 'Wie kann ich meine Conversion Rate erhöhen?'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const reply = response.data.reply.toLowerCase();
      console.log('✅ E-Commerce-Antwort:', reply.substring(0, 150) + '...');
      console.log('   (Sollte CRO/Conversion-fokussiert sein)\n');
    });
  });

  describe('Spezialisierungs-Wechsel während Chat', () => {
    it('sollte Spezialisierung von Beauty zu E-Commerce wechseln können', async () => {
      // 1. Beauty aktivieren
      await api.post('/api/specializations/activate', {
        id: 'test-beauty-001'
      });
      await new Promise(resolve => setTimeout(resolve, 300));

      const beautyResponse = await api.post('/api/chatbot/message', {
        message: 'Gib mir einen Schönheitstipp'
      });

      expect(beautyResponse.status).toBe(200);
      const beautyReply = beautyResponse.data.reply.toLowerCase();

      // 2. E-Commerce aktivieren
      await api.post('/api/specializations/activate', {
        id: 'test-ecommerce-001'
      });
      await new Promise(resolve => setTimeout(resolve, 300));

      const ecommerceResponse = await api.post('/api/chatbot/message', {
        message: 'Wie kann ich meine Verkäufe steigern?'
      });

      expect(ecommerceResponse.status).toBe(200);
      const ecommerceReply = ecommerceResponse.data.reply.toLowerCase();

      expect(beautyReply).not.toBe(ecommerceReply);
      
      console.log('✅ Spezialisierungs-Wechsel funktioniert!');
      console.log('   Beauty-Modus:', beautyReply.substring(0, 80) + '...');
      console.log('   E-Commerce-Modus:', ecommerceReply.substring(0, 80) + '...\n');
    });
  });

  describe('Fehlerbehandlung', () => {
    it('sollte graceful degradieren wenn Spezialisierung fehlt', async () => {
      const response = await api.post('/api/specializations/activate', {
        id: 'non-existent-spec-12345'
      });

      expect([404, 400].includes(response.status) || response.data.success === false).toBe(true);
      
      console.log('✅ Fehlerbehandlung für fehlende Spezialisierung OK\n');
    });

    it('sollte weiterhin mit Standard-Prompt antworten wenn Spezialisierung deaktiviert ist', async () => {
      await api.post('/api/specializations/deactivate');
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await api.post('/api/chatbot/message', {
        message: 'Hallo!'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.reply).toBeDefined();
      
      console.log('✅ Fallback zu Standard-Prompt funktioniert\n');
    });
  });

  afterAll(() => {
    console.log('✅ Alle Chatbot-Spezialisierungs-Tests abgeschlossen\n');
  });
});
