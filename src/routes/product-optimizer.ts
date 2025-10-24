import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

import { wooCommerceService } from '../woocommerce/woocommerce.service';

// 🔥 KORRIGIERTE OPENAI INITIALISIERUNG
let openai: OpenAI;

try {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // 🔥 KORRIGIERTE PRÜFUNG mit Debug-Info
  console.log(`[Product Optimizer] OpenAI Key Check - Vorhanden: ${!!apiKey}, Länge: ${apiKey?.length || 0}`);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
    console.warn('⚠️  OpenAI API Key nicht korrekt konfiguriert. Product Optimizer wird nicht verfügbar sein.');
    openai = null as any;
  } else {
    openai = new OpenAI({
      apiKey: apiKey
    });
    console.log('✅ Product Optimizer OpenAI Client erfolgreich initialisiert');
  }
} catch (error) {
  console.error('❌ Fehler bei Product Optimizer Initialisierung:', error);
  openai = null as any;
}

// ✅ Analyse-Funktion
async function analyzeProduct(productId: number, server: FastifyInstance) {
  // 1. Produkt von WooCommerce abrufen
  const product = await wooCommerceService.getProduct(productId, server);
  
  // 2. OpenAI für Analyse nutzen (falls verfügbar)
  let aiAnalysis = null;
  if (openai) {
    try {
      aiAnalysis = await openAIAnalyzeProduct(product, server);
    } catch (error: any) {
      server.log.error('OpenAI Analyse fehlgeschlagen:', error.message);
      // Fallback: Metriken ohne AI
    }
  }
  
  // 3. Metriken berechnen
  const metrics = calculateProductMetrics(product);
  
  // 4. Empfehlungen generieren
  const recommendations = generateRecommendations(aiAnalysis, metrics);
  
  return {
    productId,
    basicInfo: {
      title: product.name,
      price: product.price,
      stock: product.stock_status,
      categories: product.categories?.map((c: any) => c.name) || []
    },
    aiAnalysis,
    metrics,
    recommendations,
    score: calculateOverallScore(aiAnalysis, metrics),
    timestamp: new Date().toISOString()
  };
}

// ✅ OpenAI Analyse-Funktion
async function openAIAnalyzeProduct(product: any, server: FastifyInstance) {
  const prompt = `
Analysiere das folgende Produkt für einen WooCommerce Shop:

PRODUKT:
Titel: ${product.name}
Beschreibung: ${product.description || 'Keine Beschreibung'}
Preis: ${product.price} €
Kategorien: ${product.categories?.map((c: any) => c.name).join(', ') || 'Keine Kategorien'}

ANALYSE-ASPEKTE:
1. SEO-Potential (Titel, Beschreibung)
2. Content-Qualität (Vollständigkeit, Überzeugungskraft)  
3. Preiseinschätzung (Fair, zu hoch/niedrig?)
4. Verbesserungsvorschläge

Antworte im JSON-Format:
{
  "seoScore": 0-100,
  "contentScore": 0-100,
  "pricingScore": 0-100,
  "seoIssues": string[],
  "contentIssues": string[],
  "pricingIssues": string[],
  "improvementSuggestions": string[]
}
`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Du bist ein E-Commerce Experte für WooCommerce Shops. Analysiere Produkte und gib konstruktive Verbesserungsvorschläge."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ✅ Metriken-Berechnung
function calculateProductMetrics(product: any) {
  const description = product.description || '';
  const cleanDescription = description.replace(/<[^>]*>/g, ''); // HTML Tags entfernen
  
  return {
    titleLength: product.name?.length || 0,
    descriptionLength: cleanDescription.length,
    hasImages: (product.images?.length || 0) > 0,
    imageCount: product.images?.length || 0,
    categoryCount: product.categories?.length || 0,
    tagCount: product.tags?.length || 0,
    price: parseFloat(product.price) || 0,
    onSale: !!product.sale_price,
    stockStatus: product.stock_status,
    hasDescription: cleanDescription.length > 0,
    descriptionWordCount: cleanDescription.split(/\s+/).length
  };
}

// ✅ Empfehlungen generieren
function generateRecommendations(aiAnalysis: any, metrics: any) {
  const recommendations = [];
  
  // Basis-Empfehlungen basierend auf Metriken
  if (metrics.titleLength < 10) {
    recommendations.push("Produkttitel ist zu kurz - mindestens 10 Zeichen empfohlen");
  }
  
  if (metrics.titleLength > 70) {
    recommendations.push("Produkttitel ist zu lang - maximal 70 Zeichen für SEO");
  }
  
  if (!metrics.hasDescription) {
    recommendations.push("Produktbeschreibung fehlt - wichtig für SEO und Conversion");
  } else if (metrics.descriptionWordCount < 50) {
    recommendations.push("Produktbeschreibung ist zu kurz - mindestens 50 Wörter für SEO");
  }
  
  if (!metrics.hasImages) {
    recommendations.push("Produktbilder fehlen - essentiel für Conversions");
  }
  
  if (metrics.categoryCount === 0) {
    recommendations.push("Keine Kategorien zugewiesen - wichtig für Navigation und SEO");
  }
  
  // AI-basierte Empfehlungen hinzufügen
  if (aiAnalysis?.improvementSuggestions) {
    recommendations.push(...aiAnalysis.improvementSuggestions);
  }
  
  return recommendations;
}

// ✅ Gesamt-Score berechnen
function calculateOverallScore(aiAnalysis: any, metrics: any) {
  let score = 0;
  let totalWeight = 0;
  
  // Basis-Score aus Metriken (50%)
  if (metrics.hasImages) score += 25;
  if (metrics.hasDescription) score += 15;
  if (metrics.titleLength >= 10 && metrics.titleLength <= 70) score += 10;
  
  totalWeight += 50;
  
  // AI-Score hinzufügen (50%)
  if (aiAnalysis) {
    const aiScore = (
      (aiAnalysis.seoScore || 0) + 
      (aiAnalysis.contentScore || 0) + 
      (aiAnalysis.pricingScore || 0)
    ) / 3;
    
    score += aiScore * 0.5;
    totalWeight += 50;
  }
  
  return Math.round((score / totalWeight) * 100);
}

export default async function productOptimizerRoutes(server: FastifyInstance) {
  
  // 🔥 NEUE ANALYSE-ROUTE mit korrekter Pfad-Struktur
  server.post('/analyze/:id', {
    schema: {
      tags: ['product-optimizer'],
      summary: 'Analyze product using AI',
      description: 'Analyze product data and provide optimization suggestions',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            analysis: { type: 'object' },
            suggestions: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        503: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params;
    const productId = parseInt(id);
    
    // 🔥 KORRIGIERTE PRÜFUNG mit Debug-Info
    console.log(`[Product Optimizer] Starte Produkt-Analyse für ID: ${productId}`);
    console.log(`[Product Optimizer] OpenAI verfügbar: ${!!openai}`);
    
    // Prüfe ob WooCommerce verfügbar ist
    if (!wooCommerceService.isReady()) {
      return reply.status(503).send({ 
        error: 'WooCommerce Service nicht verfügbar',
        message: 'Bitte WooCommerce Konfiguration prüfen'
      });
    }
    
    try {
      server.log.info(`Starte Produkt-Analyse für ID: ${productId}`);
      const analysis = await analyzeProduct(productId, server);
      server.log.info(`✅ Produkt-Analyse abgeschlossen für ID: ${productId}`);
      return analysis;
    } catch (error: any) {
      server.log.error('Analyse fehlgeschlagen:', error.message);
      return reply.status(500).send({ 
        error: 'Analyse fehlgeschlagen',
        message: error.message 
      });
    }
  });

  // 🔥 STATUS ENDPOINT hinzugefügt
  server.get('/status', {
    schema: {
      tags: ['product-optimizer'],
      summary: 'Get optimizer status',
      description: 'Check if product optimizer is available'
    }
  }, async () => {
    return {
      available: !!openai,
      service: 'product-optimizer',
      openaiConfigured: !!openai,
      timestamp: new Date().toISOString()
    };
  });

  // 🔍 SEO OPTIMIZER (bestehend)
  server.post('/woo/products/:id/seo-optimize', {
    schema: {
      tags: ['product-optimizer'],
      summary: 'AI SEO Optimization for products',
      description: 'Automatically optimize product titles, descriptions and metadata for better SEO',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['currentTitle', 'currentDescription'],
        properties: {
          currentTitle: { type: 'string' },
          currentDescription: { type: 'string' },
          targetKeywords: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          },
          brand: { type: 'string' },
          productCategory: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            optimizedTitle: { type: 'string' },
            optimizedDescription: { type: 'string' },
            metaDescription: { type: 'string' },
            slugSuggestion: { type: 'string' },
            keywordDensity: { type: 'object' },
            seoScore: { type: 'number' },
            improvements: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { id } = request.params;
    const { 
      currentTitle, 
      currentDescription, 
      targetKeywords, 
      brand, 
      productCategory 
    } = request.body;

    // 🔥 KORRIGIERTE PRÜFUNG
    if (!openai) {
      server.log.warn('OpenAI nicht verfügbar - verwende Fallback für SEO Optimierung');
      return {
        success: false,
        optimizedTitle: currentTitle,
        optimizedDescription: currentDescription,
        metaDescription: currentDescription.substring(0, 155),
        slugSuggestion: currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        keywordDensity: {},
        seoScore: 50,
        improvements: [
          "Add more relevant keywords",
          "Improve meta description",
          "Optimize title length"
        ],
        error: 'OpenAI service not configured - using fallback SEO optimization'
      };
    }

    try {
      const prompt = `
SEO OPTIMIZATION FOR: "${currentTitle}"

CURRENT DESCRIPTION: ${currentDescription}
${targetKeywords.length > 0 ? `TARGET KEYWORDS: ${targetKeywords.join(', ')}` : ''}
${brand ? `BRAND: ${brand}` : ''}
${productCategory ? `CATEGORY: ${productCategory}` : ''}

OPTIMIZE FOR:
1. SEO-optimized title (max 60 characters)
2. Engaging product description (300-500 words)
3. Compelling meta description (max 155 characters)
4. SEO-friendly slug
5. Keyword density analysis
6. SEO score (0-100)
7. 3-5 specific improvements

RESPONSE IN JSON FORMAT:
{
  "optimizedTitle": "Optimized Product Title",
  "optimizedDescription": "Full optimized description...",
  "metaDescription": "Compelling meta description...",
  "slugSuggestion": "optimized-product-title",
  "keywordDensity": {
    "primary": 2.5,
    "secondary": 1.2
  },
  "seoScore": 85,
  "improvements": [
    "Add more primary keywords",
    "Improve meta description length",
    "Optimize title for click-through"
  ]
}
`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "Du bist ein SEO-Experte für E-Commerce. Optimiere Produkttitel, Beschreibungen und Metadaten für bessere Suchmaschinenrankings und höhere Conversion Rates. Berücksichtige Keywords, Lesbarkeit und UX. Antworte immer in JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        const seoOptimization = JSON.parse(aiResponse);
        
        // Log the optimization
        server.log.info(`SEO optimization for product ${id}: Score ${seoOptimization.seoScore}/100`);
        
        return {
          success: true,
          productId: id,
          ...seoOptimization
        };
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('SEO Optimization error:', error.message);
      
      return {
        success: false,
        optimizedTitle: currentTitle,
        optimizedDescription: currentDescription,
        metaDescription: currentDescription.substring(0, 155),
        slugSuggestion: currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        keywordDensity: {},
        seoScore: 50,
        improvements: [
          "Add more relevant keywords",
          "Improve meta description",
          "Optimize title length"
        ],
        error: error.message
      };
    }
  });

  // 🔄 AUTO-UPDATE WOOCOMMERCE MIT SEO OPTIMIERUNGEN
  server.post('/woo/products/:id/seo-apply', {
    schema: {
      tags: ['product-optimizer'],
      summary: 'Apply SEO optimizations directly to WooCommerce',
      description: 'Automatically update product title, description and SEO metadata in WooCommerce',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['currentTitle', 'currentDescription'],
        properties: {
          currentTitle: { type: 'string' },
          currentDescription: { type: 'string' },
          targetKeywords: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          },
          brand: { type: 'string' },
          productCategory: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            productId: { type: 'integer' },
            changes: { type: 'object' },
            product: { type: 'object' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    const { id } = request.params;
    const { 
      currentTitle, 
      currentDescription, 
      targetKeywords, 
      brand, 
      productCategory 
    } = request.body;

    try {
      server.log.info(`Starting SEO apply for product ${id}`);

      // 1. Erst SEO Optimierung durchführen
      const seoResponse = await server.inject({
        method: 'POST',
        url: `/woo/products/${id}/seo-optimize`,
        payload: {
          currentTitle,
          currentDescription,
          targetKeywords,
          brand,
          productCategory
        }
      });

      const seoData = JSON.parse(seoResponse.payload);
      
      if (!seoData.success) {
        server.log.error(`SEO optimization failed for product ${id}:`, seoData.error);
        return {
          success: false,
          error: 'SEO optimization failed: ' + seoData.error
        };
      }

      server.log.info(`SEO optimization successful for product ${id}, score: ${seoData.seoScore}`);

      // 2. WooCommerce Update vorbereiten
      const wcUpdate = {
        name: seoData.optimizedTitle,
        description: seoData.optimizedDescription,
        short_description: seoData.metaDescription,
        slug: seoData.slugSuggestion,
        meta_data: [
          {
            key: '_yoast_wpseo_title',
            value: seoData.optimizedTitle
          },
          {
            key: '_yoast_wpseo_metadesc',
            value: seoData.metaDescription
          },
          {
            key: '_yoast_wpseo_focuskw', 
            value: targetKeywords?.slice(0, 3).join(', ') || ''
          }
        ]
      };

      // 3. WooCommerce aktualisieren
      const updatedProduct = await wooCommerceService.updateProduct(id, wcUpdate, server);

      // 4. Erfolgsresponse
      return {
        success: true,
        message: 'SEO optimizations applied successfully to WooCommerce',
        productId: parseInt(id),
        changes: {
          title: {
            from: currentTitle,
            to: seoData.optimizedTitle
          },
          description: 'updated',
          metaDescription: seoData.metaDescription,
          slug: seoData.slugSuggestion,
          seoScore: seoData.seoScore
        },
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          slug: updatedProduct.slug,
          permalink: updatedProduct.permalink
        }
      };

    } catch (error: any) {
      server.log.error(`SEO apply error for product ${id}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        message: 'SEO optimization completed but WooCommerce update failed'
      };
    }
  });

  // 💰 PRICE INTELLIGENCE - NEU!
  server.post('/woo/products/:id/price-analysis', {
    schema: {
      tags: ['product-optimizer'],
      summary: 'AI-powered price analysis and recommendations',
      description: 'Analyze market prices and recommend optimal pricing strategy with competitive intelligence',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['currentPrice', 'productName'],
        properties: {
          currentPrice: { type: 'number', minimum: 0 },
          productName: { type: 'string' },
          productCategory: { type: 'string' },
          costPrice: { type: 'number' },
          competitorPrices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                competitor: { type: 'string' },
                price: { type: 'number' },
                url: { type: 'string' }
              }
            },
            default: []
          },
          marketConditions: {
            type: 'object',
            properties: {
              demand: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
              seasonality: { type: 'string' },
              economicTrend: { type: 'string', enum: ['recession', 'stable', 'growth'] }
            }
          },
          targetMargin: { type: 'number', minimum: 0, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            priceRecommendation: { type: 'number' },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            pricingStrategy: { type: 'string' },
            competitorAnalysis: { type: 'object' },
            marketPosition: { type: 'string' },
            projectedSalesImpact: { type: 'string' },
            profitMargin: { type: 'string' },
            riskAssessment: { type: 'string' },
            dynamicPricingSuggestions: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { id } = request.params;
    const { 
      currentPrice, 
      productName, 
      productCategory, 
      costPrice, 
      competitorPrices, 
      marketConditions,
      targetMargin 
    } = request.body;

    // 🔥 KORRIGIERTE PRÜFUNG
    if (!openai) {
      server.log.warn('OpenAI nicht verfügbar - verwende Fallback für Price Intelligence');
      
      // Fallback price analysis
      const averageCompetitorPrice = competitorPrices.length > 0 
        ? competitorPrices.reduce((sum: number, comp: any) => sum + comp.price, 0) / competitorPrices.length
        : currentPrice * 1.1;
      
      const recommendedPrice = costPrice 
        ? costPrice * 1.4 // 40% margin fallback
        : averageCompetitorPrice * 0.95; // 5% under competitors
      
      return {
        success: false,
        priceRecommendation: Math.round(recommendedPrice * 100) / 100,
        confidence: 60,
        pricingStrategy: "competitive_fallback",
        competitorAnalysis: {
          averagePrice: Math.round(averageCompetitorPrice * 100) / 100,
          lowestPrice: competitorPrices.length > 0 ? Math.min(...competitorPrices.map((c: any) => c.price)) : currentPrice,
          competitorCount: competitorPrices.length
        },
        marketPosition: "mid_range",
        projectedSalesImpact: "10-15% increase potential",
        profitMargin: costPrice ? `${Math.round(((recommendedPrice - costPrice) / recommendedPrice) * 100)}%` : "unknown",
        riskAssessment: "medium",
        dynamicPricingSuggestions: [
          "Consider seasonal discounts",
          "Monitor competitor price changes",
          "Test different price points"
        ],
        error: 'OpenAI service not configured - using fallback price analysis'
      };
    }

    try {
      const prompt = `
PRICE INTELLIGENCE ANALYSIS FOR: "${productName}"

CURRENT PRICE: €${currentPrice}
${productCategory ? `PRODUCT CATEGORY: ${productCategory}` : ''}
${costPrice ? `COST PRICE: €${costPrice}` : ''}
${targetMargin ? `TARGET MARGIN: ${targetMargin}%` : ''}

${competitorPrices.length > 0 ? `COMPETITOR PRICES:\n${competitorPrices.map((comp: any) => `- ${comp.competitor}: €${comp.price}${comp.url ? ` (${comp.url})` : ''}`).join('\n')}` : 'No competitor prices provided'}

${marketConditions ? `MARKET CONDITIONS:\n- Demand: ${marketConditions.demand || 'unknown'}\n- Seasonality: ${marketConditions.seasonality || 'unknown'}\n- Economic Trend: ${marketConditions.economicTrend || 'stable'}` : ''}

ANALYZE AND PROVIDE:
1. PRICE RECOMMENDATION (optimal price point)
2. CONFIDENCE SCORE (0-100%)
3. PRICING STRATEGY (premium, competitive, penetration, etc.)
4. COMPETITOR ANALYSIS (summary of competitor pricing)
5. MARKET POSITION (where this price positions the product)
6. PROJECTED SALES IMPACT (expected sales change)
7. PROFIT MARGIN (calculated margin)
8. RISK ASSESSMENT (low, medium, high)
9. 3-5 DYNAMIC PRICING SUGGESTIONS

RESPONSE IN JSON FORMAT:
{
  "priceRecommendation": 129.99,
  "confidence": 85,
  "pricingStrategy": "competitive_aggressive",
  "competitorAnalysis": {
    "averagePrice": 135.50,
    "lowestPrice": 119.99,
    "highestPrice": 149.99,
    "recommendation": "price_leader"
  },
  "marketPosition": "value_leader",
  "projectedSalesImpact": "15-25% increase expected",
  "profitMargin": "42%",
  "riskAssessment": "low",
  "dynamicPricingSuggestions": []
}
`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "Du bist ein Pricing-Experte für E-Commerce. Analysiere Marktpreise, Wettbewerb und liefer datenbasierte Preisempfehlungen die Umsatz und Gewinn maximieren. Berücksichtige Kosten, Wettbewerb und Marktbedingungen. Antworte immer in JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5, // Niedriger für konsistente Preisempfehlungen
        max_tokens: 1200,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        const priceAnalysis = JSON.parse(aiResponse);
        
        // Log the analysis
        server.log.info(`Price analysis for product ${id}: Recommended €${priceAnalysis.priceRecommendation} (Confidence: ${priceAnalysis.confidence}%)`);
        
        return {
          success: true,
          productId: id,
          productName,
          currentPrice,
          ...priceAnalysis
        };
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('Price Intelligence error:', error.message);
      
      // Fallback price analysis
      const averageCompetitorPrice = competitorPrices.length > 0 
        ? competitorPrices.reduce((sum: number, comp: any) => sum + comp.price, 0) / competitorPrices.length
        : currentPrice * 1.1;
      
      const recommendedPrice = costPrice 
        ? costPrice * 1.4
        : averageCompetitorPrice * 0.95;
      
      return {
        success: false,
        priceRecommendation: Math.round(recommendedPrice * 100) / 100,
        confidence: 50,
        pricingStrategy: "competitive_fallback",
        competitorAnalysis: {
          averagePrice: Math.round(averageCompetitorPrice * 100) / 100,
          lowestPrice: competitorPrices.length > 0 ? Math.min(...competitorPrices.map((c: any) => c.price)) : currentPrice,
          competitorCount: competitorPrices.length
        },
        marketPosition: "mid_range",
        projectedSalesImpact: "5-10% increase potential",
        profitMargin: costPrice ? `${Math.round(((recommendedPrice - costPrice) / recommendedPrice) * 100)}%` : "unknown",
        riskAssessment: "medium",
        dynamicPricingSuggestions: [
          "Monitor competitor pricing weekly",
          "Consider A/B testing different price points",
          "Implement seasonal pricing strategy"
        ],
        error: error.message
      };
    }
  });

  // 🎁 BUNDLE SUGGESTIONS (Placeholder)
  server.post('/woo/products/:id/bundle-suggestions', {
    schema: {
      tags: ['product-optimizer'],
      summary: 'AI-generated product bundle recommendations',
      description: 'Suggest smart product bundles for increased average order value'
    }
  }, async (request: any) => {
    return {
      success: false,
      message: 'Bundle suggestions module coming soon!',
      error: 'Not implemented yet'
    };
  });

  // ✅ OPTIMIZE ROUTE KORRIGIERT - INNERHALB DER FUNKTION
  server.post('/optimize/:id', async (request, reply) => {
    // Deine bestehende Optimize-Logik
    return { message: 'Optimize route - to be implemented' };
  });
}