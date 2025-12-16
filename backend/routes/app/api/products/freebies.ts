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
        const wooConfig = config.woocommerce;

        // Validiere WooCommerce-Konfiguration BEFORE fetch
        if (!wooConfig?.url || !wooConfig?.consumerKey || !wooConfig?.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt (connection.json unvollständig)');
        }

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

        // ✅ ECHTE WooCommerce Freebie-Erstellung - Nutze bereits geladene Config
        const wooConfig = config.woocommerce;
        
        if (!wooConfig?.url || !wooConfig?.consumerKey || !wooConfig?.consumerSecret) {
          console.error('❌ WooCommerce Config ungültig:', {
            url: !!wooConfig?.url,
            consumerKey: !!wooConfig?.consumerKey,
            consumerSecret: !!wooConfig?.consumerSecret,
            fullConfig: wooConfig
          });
          throw new Error(`WooCommerce-Konfiguration fehlt: ${JSON.stringify({ url: !!wooConfig?.url, key: !!wooConfig?.consumerKey, secret: !!wooConfig?.consumerSecret })}`);
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
        description: 'Generiert AI-basierte oder Fallback Freebie-Ideen mit Conversion-Score'
      }
    },
    async (request: FastifyRequest<{ Querystring: MLGenerateQuery }>, reply: FastifyReply) => {
      try {
        const { type } = request.query;
        console.log('🎁 Generating freebie ideas for type:', type);

        // Fallback-Ideen pro Typ (verwende diese sofort ohne OpenAI-Call für Stabilität)
        const fallbackIdeasByType: Record<string, FreebieIdea[]> = {
          'ebook': [
            { title: 'Ultimate Anfänger E-Book', description: 'Komplett E-Book für Anfänger mit Schritt-für-Schritt Anleitung', conversionScore: 0.82, reason: 'Ebooks führen zu massiven Lead-Captures' },
            { title: 'Geheimnisse der Top-Performer', description: 'E-Book mit bewährten Strategien von Branchenexperten', conversionScore: 0.78, reason: 'Insider-Tipps konvertieren besser' },
            { title: 'Quick Start Guide', description: 'Schneller Einstieg mit Checklisten und Templates', conversionScore: 0.75, reason: 'Sofortige Ergebnisse führen zu Vertrauen' },
            { title: 'Häufigste Fehler & wie man sie vermeidet', description: 'E-Book über die 20 häufigsten Anfängerfehler', conversionScore: 0.80, reason: 'Fehler-Vermeidung motiviert zum Handeln' }
          ],
          'checklist': [
            { title: 'Tägliche Produktivitäts-Checkliste', description: 'Einfache tägliche Checkliste für maximale Effizienz', conversionScore: 0.88, reason: 'Checklisten sind super praktisch und addictive' },
            { title: 'Perfektions-Checkliste für Anfänger', description: 'Schritt-für-Schritt Checkliste zum perfekten Setup', conversionScore: 0.85, reason: 'Struktur reduziert Widerstand' },
            { title: 'Vor-Launch-Checkliste', description: 'Alle wichtigen Punkte vor dem großen Start', conversionScore: 0.90, reason: 'Vermittelt Sicherheit und Kontrolle' },
            { title: 'Wöchentliche Überprüfungs-Checkliste', description: 'Checkliste für regelmäßige Review & Optimierung', conversionScore: 0.82, reason: 'Kontinuierliche Verbesserung im Fokus' }
          ],
          'templates': [
            { title: 'Email-Vorlagen-Sammlung', description: '30 hochkonvertierende Email-Templates', conversionScore: 0.84, reason: 'Ready-to-use Templates sparen Zeit' },
            { title: 'Landing-Page-Vorlage Kit', description: '5 responsive Landing-Page Templates', conversionScore: 0.81, reason: 'Professionelle Designs ohne Design-Skills' },
            { title: 'Präsentations-Vorlage Sammlung', description: 'PowerPoint & Google Slides Templates für Profis', conversionScore: 0.76, reason: 'Professionelle Optik steigert Credibility' },
            { title: 'Soziale-Medien-Post-Templates', description: 'Content-Vorlagen für alle großen Plattformen', conversionScore: 0.79, reason: 'Zeitersparnis führt zu konsistenterem Output' }
          ],
          'guide': [
            { title: 'Kompletter Anfänger-Leitfaden', description: 'Ultimativer Schritt-für-Schritt Leitfaden zum Start', conversionScore: 0.85, reason: 'Anfänger brauchen klare Richtung' },
            { title: 'Video-Training Textversion', description: 'Kostenloser Leitfaden + Video-Links', conversionScore: 0.83, reason: 'Multimedia-Inhalte sind am effektivsten' },
            { title: 'Häufig gestellte Fragen Leitfaden', description: 'FAQ-Leitfaden mit Profi-Antworten', conversionScore: 0.77, reason: 'Beantwortet Objektionen präventiv' },
            { title: '30-Tage Schnell-Start Guide', description: 'Tägliche Aufgaben für 30 Tage intensives Learning', conversionScore: 0.87, reason: 'Begrenzte Zeit schafft Dringlichkeit' }
          ]
        };

        // Verwende Fallback-Ideen für den Typ oder Standard-Fallback
        const typeKey = (type as string) || 'ebook';
        const ideas = fallbackIdeasByType[typeKey] || fallbackIdeasByType['ebook'];

        const normalized = ideas.map(idea => ({
          title: idea.title || 'Untitled',
          description: idea.description || '',
          conversionScore: Math.min(Math.max(idea.conversionScore ?? 0.7, 0), 1),
          reason: idea.reason || 'Bewährte Freebie-Strategie'
        })).slice(0, 5);

        console.log(`✅ Returning ${normalized.length} freebie ideas`);

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
