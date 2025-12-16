import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import config from '../../../../config';

interface Freebie {
  id: number;
  name: string;
  type: 'ebook' | 'checklist' | 'templates' | 'guide';
  downloads: number;
  created: string;
  description?: string;
  fileUrl?: string;
}

interface CreateFreebieBody {
  name: string;
  type: 'ebook' | 'checklist' | 'templates' | 'guide';
  downloads: number;
  created: string;
  description?: string;
  fileUrl?: string;
}

interface AutoCreateBody {
  type: 'ebook' | 'checklist' | 'templates' | 'guide';
}

interface FreebieIdea {
  title: string;
  description: string;
  conversionScore: number;
  reason: string;
}

interface MLGenerateQuery {
  type: string;
  keywords?: string;
}

export default async function freebieRoutes(server: FastifyInstance) {
  
  // Get All Freebies
  server.get(
    '/',
    {
      schema: {
        tags: ['freebies'],
        description: 'Holt alle kostenlosen Produkte (Preis = 0) aus WooCommerce'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ✅ ECHTE Freebies aus WooCommerce (Produkte mit Preis = 0)
        // WooCommerce-Konfiguration aus zentraler connection.json
        const wooConfig = {
          url: config.woocommerce?.url,
          consumerKey: config.woocommerce?.consumerKey,
          consumerSecret: config.woocommerce?.consumerSecret,
        };

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
        
        // Lade alle Produkte und filtere kostenlose
        const productsResponse = await fetch(
          `${wooConfig.url}/wp-json/wc/v3/products?per_page=100`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt (connection.json unvollständig)');
        }
        if (!productsResponse.ok) {
          throw new Error(`WooCommerce API Error: ${productsResponse.status}`);
        }

        const products = await productsResponse.json() as any[];
        
        // Filtere Produkte mit Preis = 0 oder "0.00"
        const freeProducts = products.filter(p => 
          parseFloat(p.price) === 0 || p.price === '0' || p.price === '0.00'
        );
        
        // Typ-Erkennung basierend auf Kategorie oder Name
        const detectType = (product: any): Freebie['type'] => {
          const name = product.name.toLowerCase();
          const categories = product.categories?.map((c: any) => c.name.toLowerCase()) || [];
          
          if (name.includes('ebook') || name.includes('e-book') || categories.some((c: string) => c.includes('ebook'))) {
            return 'ebook';
          }
          if (name.includes('checklist') || categories.some((c: string) => c.includes('checklist'))) {
            return 'checklist';
          }
          if (name.includes('template') || categories.some((c: string) => c.includes('template'))) {
            return 'templates';
          }
          if (name.includes('guide') || name.includes('anleitung') || categories.some((c: string) => c.includes('guide'))) {
            return 'guide';
          }
          return 'guide'; // Default
        };
        
        // Transformiere zu Freebie-Format
        const freebies: Freebie[] = freeProducts.map(product => ({
          id: product.id,
          name: product.name,
          type: detectType(product),
          downloads: product.total_sales || 0, // Total Sales = Downloads bei kostenlosen Produkten
          created: product.date_created,
          description: product.short_description || product.description,
          fileUrl: product.downloads?.[0]?.file || product.permalink
        }));

        return reply.send({
          success: true,
          data: freebies,
          total: freebies.length,
          source: 'woocommerce-free-products',
          totalProducts: products.length
        });
      } catch (_error) {
        console.error('Freebies API Error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Create Freebie
  server.post<{ Body: CreateFreebieBody }>(
    '/',
    {
      schema: {
        tags: ['freebies'],
        description: 'Erstellt ein neues Freebie',
        body: {
          type: 'object',
          required: ['name', 'type', 'downloads', 'created'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['ebook', 'checklist', 'templates', 'guide'] },
            downloads: { type: 'number' },
            created: { type: 'string' },
            description: { type: 'string' },
            fileUrl: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateFreebieBody }>, reply: FastifyReply) => {
      try {
        const freebieData = request.body;
        console.log('🎁 Creating freebie:', freebieData);

        // ✅ ECHTE WooCommerce Freebie-Erstellung
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        // Freebies sind normalerweise downloadable/virtual products mit Preis 0
        const isDownloadable = freebieData.type === 'ebook' || freebieData.type === 'guide';
        
        const wooPayload: any = {
          name: freebieData.name,
          type: 'simple',
          regular_price: '0',
          sale_price: '0',
          price: '0',
          virtual: true,
          downloadable: isDownloadable,
          description: freebieData.description || `Kostenloses ${freebieData.type} - ${freebieData.name}`,
          status: 'publish',
          meta_data: [
            {
              key: '_freebie_type',
              value: freebieData.type
            }
          ]
        };

        // Wenn File URL vorhanden, füge Download hinzu
        if (freebieData.fileUrl && isDownloadable) {
          wooPayload.downloads = [
            {
              name: freebieData.name,
              file: freebieData.fileUrl
            }
          ];
        }

        console.log('📤 Sending to WooCommerce:', JSON.stringify(wooPayload, null, 2));

        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(wooPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ WooCommerce Error:', errorText);
          throw new Error(`WooCommerce API Error: ${response.status} - ${errorText}`);
        }

        const wooFreebie = await response.json();
        console.log('✅ Freebie created in WooCommerce:', wooFreebie.id);

        const newFreebie: Freebie = {
          id: wooFreebie.id,
          name: wooFreebie.name,
          type: freebieData.type,
          downloads: 0,
          created: wooFreebie.date_created,
          description: wooFreebie.description,
          fileUrl: wooFreebie.downloads?.[0]?.file || wooFreebie.permalink
        };

        return reply.send({
          success: true,
          data: newFreebie,
          message: `Freebie "${newFreebie.name}" erfolgreich in WooCommerce erstellt`,
          woocommerceId: wooFreebie.id,
          permalink: wooFreebie.permalink
        });
      } catch (_error) {
        console.error('❌ Freebie creation error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // ML Generate Freebie Ideas
  server.get<{ Querystring: MLGenerateQuery }>(
    '/ml/generate',
    {
      schema: {
        tags: ['freebies'],
        description: 'Generiert AI-basierte Freebie-Ideen mit Conversion-Score'
      }
    },
    async (request: FastifyRequest<{ Querystring: MLGenerateQuery }>, reply: FastifyReply) => {
      try {
        const { type, keywords } = request.query;
        console.log('🎁 Generating freebie ideas for type:', type);

        const { getOpenAIClient, executeOpenAI } = await import('../../../../utils/openai.js');
        const openai = getOpenAIClient();

        const typeNames: Record<string, string> = {
          'ebook': 'E-Book',
          'checklist': 'Checkliste',
          'templates': 'Vorlagen-Set',
          'guide': 'Schritt-für-Schritt Anleitung'
        };

        const keywordContext = keywords ? `\nSchwerpunkt-Keywords: ${keywords}` : '';

        // Fallback, falls ungültiger Typ übergeben wurde
        const resolvedTypeName = typeNames[type] || 'Lead-Magnet';

        const prompt = `Du bist ein Expert für Lead-Magnets und Freebie-Strategien. Generiere 4 kreative und hochkonvertierende Ideen für ein kostenloses ${resolvedTypeName}.${keywordContext}

Antworte mit JSON-Array im exakten Format:
[
  {
    "title": "Aussagekräftiger Titel",
    "description": "Kurze überzeugende Beschreibung mit Mehrwert",
    "conversionScore": 0.85,
    "reason": "Warum das hochkonvertieren wird"
  }
]

Achte auf Spezifität, emotionale Titel und realistische Scores 0.6-0.95.`;

        const completion = await executeOpenAI(
          async () => {
            return openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.8,
              response_format: { type: 'json_object' },
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ]
            });
          },
          'freebie-ml-generate',
          { type, keywords }
        );

        const rawContent = completion.choices[0]?.message?.content || '[]';
        let parsedIdeas: FreebieIdea[] = [];
        
        try {
          // Entferne evtl. Code-Fences und JSON-Präfixe
          const sanitized = rawContent
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

          const parsed = JSON.parse(sanitized);
          const ideasArr = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as any).ideas)
              ? (parsed as any).ideas
              : [];
          parsedIdeas = (ideasArr as FreebieIdea[]).slice(0, 5);
        } catch (_parseError) {
          console.warn('⚠️ JSON parse error', _parseError);
          // Letzter Versuch: Finde erstes JSON-Array im String
          try {
            const match = rawContent.match(/\[([\s\S]*?)\]/);
            if (match) {
              const arr = JSON.parse(match[0]);
              if (Array.isArray(arr)) {
                parsedIdeas = (arr as FreebieIdea[]).slice(0, 5);
              }
            }
          } catch { /* ignore */ }
          if (parsedIdeas.length === 0) {
            return reply.status(502).send({ success: false, error: 'Fehler beim Parsen der KI-Antwort' });
          }
        }

        if (parsedIdeas.length === 0) {
          return reply.status(502).send({ success: false, error: 'Keine gültigen Ideen erhalten' });
        }

        const normalized = parsedIdeas.map(idea => ({
          title: idea.title || 'Untitled',
          description: idea.description || '',
          conversionScore: Math.min(Math.max(idea.conversionScore ?? 0.7, 0), 1),
          reason: idea.reason || 'AI-generiert'
        }));

        // Antworte im konsistenten ApiResponse-Format mit "data"
        return reply.send({ success: true, data: normalized });
      } catch (_error) {
        console.error('Freebie ML Generate Error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Auto-Create Freebie with AI
  server.post<{ Body: AutoCreateBody }>(
    '/auto-create',
    {
      schema: {
        tags: ['freebies'],
        description: 'Erstellt automatisch ein optimiertes Freebie mit AI',
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['ebook', 'checklist', 'templates', 'guide'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: AutoCreateBody }>, reply: FastifyReply) => {
      try {
        const { type } = request.body;
        console.log('🤖 Auto-creating freebie:', type);

        // ✅ AI-basierte Freebie-Generierung mit OpenAI
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        // Generiere Freebie-Idee mit OpenAI
        const typeTranslations: Record<string, string> = {
          'ebook': 'E-Book',
          'checklist': 'Checkliste',
          'templates': 'Vorlagen-Set',
          'guide': 'Schritt-für-Schritt Anleitung'
        };

        const prompt = `Erstelle eine kreative Idee für ein kostenloses ${typeTranslations[type]} für einen E-Commerce Shop.

Das ${typeTranslations[type]} sollte:
- Einen attraktiven, professionellen Namen haben
- Eine überzeugende Beschreibung (150-200 Wörter) enthalten
- Mehrwert für potenzielle Kunden bieten
- Zum Download verfügbar sein

Antworte mit einem JSON Objekt im Format:
{
  "name": "Titel des ${typeTranslations[type]}",
  "description": "Detaillierte Beschreibung mit Mehrwert und Benefits"
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          response_format: { type: 'json_object' }
        });

        const responseContent = completion.choices[0].message.content || '{"name": "Freebie", "description": ""}';
        console.log('🤖 OpenAI Response:', responseContent);
        
        let freebieIdea: any;
        try {
          freebieIdea = JSON.parse(responseContent);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          throw new Error('Fehler beim Parsen der AI Antwort');
        }

        // Erstelle Freebie in WooCommerce
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        const isDownloadable = type === 'ebook' || type === 'guide';
        
        const wooPayload: any = {
          name: freebieIdea.name,
          type: 'simple',
          regular_price: '0',
          sale_price: '0',
          price: '0',
          virtual: true,
          downloadable: isDownloadable,
          description: freebieIdea.description,
          status: 'publish',
          meta_data: [
            {
              key: '_freebie_type',
              value: type
            },
            {
              key: '_ai_generated',
              value: 'true'
            }
          ]
        };

        console.log('📤 Sending to WooCommerce:', JSON.stringify(wooPayload, null, 2));

        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(wooPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ WooCommerce Error:', errorText);
          throw new Error(`WooCommerce API Error: ${response.status} - ${errorText}`);
        }

        const wooFreebie = await response.json();
        console.log('✅ Freebie created in WooCommerce:', wooFreebie.id);

        const newFreebie: Freebie = {
          id: wooFreebie.id,
          name: wooFreebie.name,
          type,
          downloads: 0,
          created: wooFreebie.date_created,
          description: wooFreebie.description,
          fileUrl: wooFreebie.permalink
        };

        return reply.send({
          success: true,
          data: newFreebie,
          message: `Freebie "${newFreebie.name}" erfolgreich mit AI erstellt und in WooCommerce veröffentlicht`,
          woocommerceId: wooFreebie.id,
          permalink: wooFreebie.permalink,
          timestamp: new Date().toISOString()
        });
      } catch (_error) {
        console.error('❌ Auto-create freebie error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
