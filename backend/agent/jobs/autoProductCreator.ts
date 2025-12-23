// backend/agent/jobs/autoProductCreator.ts
import { trendAnalysisJob } from './trendAnalysis';
import { TrendData } from './trendAnalysis';
import { wooPost } from '../../tools/woo';
import { getOpenAIClient, executeOpenAI } from '../../utils/openaiHelper';
import { analyzeImage } from './image-analysis';
import axios from 'axios';

export interface AutoProductConfig {
  keyword: string;
  geo: string;
  maxProducts: number;
  minDemandScore: number;
  maxCompetition: number;
  autoPublish: boolean;
}

/**
 * Hauptfunktion: Trend-Analyse + Automatische Produkterstellung
 */
export async function autoProductCreatorJob(config?: Partial<AutoProductConfig>) {
  const {
    keyword = 'digitale produkte',
    geo = 'DE',
    maxProducts = 3,
    minDemandScore = 70,
    maxCompetition = 40,
    autoPublish = false
  } = config || {};

  console.log('🚀 Starte automatische Produkt-Kreation...');
  console.log(`🔍 Suche Trends für: "${keyword}" in ${geo}`);
  console.log(`🎯 Kriterien: Score ≥ ${minDemandScore}, Competition ≤ ${maxCompetition}`);

  // 1. Trend-Analyse durchführen
  const trendResult = await trendAnalysisJob({ keyword, geo });
  
  // 2. Trends nach Kriterien filtern
  const eligibleTrends = trendResult.trendingProducts.filter(trend =>
    trend.demandScore >= minDemandScore && 
    trend.competition <= maxCompetition
  ).slice(0, maxProducts);

  if (eligibleTrends.length === 0) {
    console.log('❌ Keine geeigneten Trends gefunden, die den Kriterien entsprechen');
    return;
  }

  console.log(`✅ ${eligibleTrends.length} geeignete Trends gefunden:`);
  
  // 3. Produkte automatisch erstellen
  const createdProducts = [];
  
  for (const [index, trend] of eligibleTrends.entries()) {
    console.log(`\n🛒 Erstelle Produkt ${index + 1}/${eligibleTrends.length}: "${trend.niche}"`);
    
    try {
      const product = await createProductFromTrend(trend, autoPublish);
      createdProducts.push(product);
      console.log(`✅ Produkt erfolgreich erstellt: ${product.name}`);
    } catch (_err) {
      const errorMessage = _err instanceof Error
        ? _err.message
        : (typeof _err === 'string' ? _err : JSON.stringify(_err));
      console.error(`❌ Fehler beim Erstellen von "${trend.niche}": ${errorMessage}`);
    }
  }

  // 4. Zusammenfassung
  console.log('\n📊 ZUSAMMENFASSUNG:');
  console.log('=' .repeat(50));
  console.log(`✅ ${createdProducts.length}/${eligibleTrends.length} Produkte erfolgreich erstellt`);
  console.log(`🔍 Ursprüngliche Trends: ${trendResult.trendingProducts.length}`);
  console.log(`🎯 Geeignete Trends: ${eligibleTrends.length}`);
  
  return {
    analyzedTrends: trendResult.trendingProducts.length,
    eligibleTrends: eligibleTrends.length,
    createdProducts: createdProducts.length,
    products: createdProducts
  };
}

/**
 * Erstellt ein WooCommerce-Produkt aus einem Trend
 */
async function createProductFromTrend(trend: TrendData, autoPublish: boolean = false) {
  const productPrice = calculateOptimalPrice(trend.priceRange);
  
  // ✅ KORREKTE VIRTUELLE PRODUKT-KONFIGURATION
  const productData = {
    name: generateProductName(trend.niche),
    description: generateProductDescription(trend),
    short_description: generateShortDescription(trend),
    regular_price: productPrice.toString(),
    categories: determineCategories(trend, productPrice),
    tags: trend.keywords.map(keyword => ({ name: keyword })),
    type: 'simple',
    status: autoPublish ? 'publish' : 'draft',
    
    // 🔥 WICHTIG: VIRTUELLE PRODUKTE KONFIGURIEREN
    virtual: true,
    downloadable: true,
    manage_stock: false,
    stock_status: 'instock',
    sold_individually: false,
    
    // 🚫 VERSAND DEAKTIVIEREN
    shipping_class: '',
    shipping_class_id: 0
  };

  try {
    console.log(`🔐 Versuche SICHERE WooCommerce-Integration...`);
    console.log(`🛒 Erstelle: "${productData.name}" für €${productData.regular_price}`);
    console.log(`📁 Kategorie: ${JSON.stringify(productData.categories)}`);
    console.log(`⚡ Virtual: ${productData.virtual}, Downloadable: ${productData.downloadable}`);
    
    // 1. WOCOMMERCE VERSUCH
    const createdProduct = await wooPost('/products', productData);
    const productId = (createdProduct as any).id;
    
    console.log(`✅ WOOCOMMERCE ERFOLG! Produkt #${productId} erstellt`);

    // 2. KI-Bild generieren und zuweisen
    try {
      const imageUrl = await generateAIImageForProduct(trend);
      if (imageUrl) {
        // SEO-Analyse: Bild herunterladen und analysieren
        let alt = productData.name;
        let filename = '';
        try {
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');
          const seo = await analyzeImageBuffer(buffer);
          if (seo?.seo?.alt) alt = seo.seo.alt;
          if (seo?.seo?.filename) filename = seo.seo.filename;
        } catch (seoErr) {
          console.warn('⚠️ SEO-Analyse für Bild fehlgeschlagen:', seoErr);
        }
        await wooPost(`/products/${productId}`, {
          images: [{ src: imageUrl, alt, name: filename || productData.name }]
        });
        console.log(`🖼️ KI-Bild zugewiesen: ${imageUrl} (Alt: ${alt}, Name: ${filename || productData.name})`);
      } else {
        console.warn('⚠️ Kein KI-Bild generiert.');
      }
    } catch (imgErr) {
      console.error('❌ Fehler bei KI-Bildgenerierung/Zuweisung:', imgErr);
    }
    /**
     * Analysiert ein Bild aus Buffer für SEO (Alt-Text, Dateiname, Tags)
     */
    async function analyzeImageBuffer(buffer: Buffer) {
      // Temporäre Datei für sharp-kompatible Analyse
      const tmp = require('os').tmpdir();
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(tmp, `img_${Date.now()}.png`);
      fs.writeFileSync(tmpFile, buffer);
      try {
        const result = await analyzeImage(tmpFile);
        fs.unlinkSync(tmpFile);
        return result;
      } catch (err) {
        fs.unlinkSync(tmpFile);
        throw err;
      }
    }
    
    return {
      name: productData.name,
      price: productPrice,
      trend: trend.niche,
      status: autoPublish ? 'published' : 'draft',
      wooCommerceId: productId,
      source: 'woocommerce',
      categories: productData.categories
    };
    /**
     * Generiert ein KI-Bild (DALL·E) für das Produkt und gibt die Bild-URL zurück
     */
    async function generateAIImageForProduct(trend: TrendData): Promise<string | null> {
      const openai = getOpenAIClient();
      const prompt = `Erzeuge ein hochwertiges Produktbild für ein digitales Produkt im Bereich "${trend.niche}". Stil: modern, klar, ansprechend, ohne Text, geeignet für einen Onlineshop. Keywords: ${trend.keywords.join(", ")}`;
      try {
        const response = await executeOpenAI(
          () => openai.images.generate({
            prompt,
            n: 1,
            size: "1024x1024",
            response_format: "url"
          }),
          'dalle-image-generation',
          { trend: trend.niche }
        );
        const url = response?.data?.[0]?.url;
        return typeof url === 'string' ? url : null;
      } catch (err) {
        console.error('❌ Fehler bei DALL·E-Generierung:', err);
        return null;
      }
    }
    
  } catch (_error) {
    // 2. SICHERER FALLBACK
    console.warn(`⚠️ WooCommerce fehlgeschlagen, verwende Simulation`);
    console.log(`📦 Simuliertes Produkt: "${productData.name}"`);
    
    return {
      name: productData.name,
      price: productPrice,
      trend: trend.niche,
      status: 'simulated',
      source: 'simulation',
      categories: productData.categories,
      error: _error instanceof Error ? _error.message : 'Unknown error'
    };
  }
}

/**
 * Generiert einen Produktnamen aus dem Trend
 */
function generateProductName(trendNiche: string): string {
  const prefixes = ['Premium', 'Ultimate', 'Pro', 'Expert', 'Complete'];
  const suffix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${suffix} ${trendNiche}`;
}

/**
 * Generiert Produktbeschreibung
 */
function generateProductDescription(trend: TrendData): string {
  return `
    <h2>${trend.niche} - Das ultimative Guide</h2>
    <p>Basierend auf aktuellen Markttrends mit hoher Nachfrage (Score: ${trend.demandScore}/100) und niedriger Competition.</p>
    <p><strong>Keywords:</strong> ${trend.keywords.join(', ')}</p>
    <p><strong>Saisonale Stärke:</strong> ${trend.seasonality.join(', ')}</p>
  `;
}

/**
 * Kurzbeschreibung
 */
function generateShortDescription(trend: TrendData): string {
  return `Trend-basiertes Produkt mit hoher Nachfrage (${trend.demandScore}/100) und niedriger Competition.`;
}

/**
 * Optimalen Preis berechnen
 */
function calculateOptimalPrice(priceRange: { min: number; max: number }): number {
  return Math.round((priceRange.min + priceRange.max) / 2 / 5) * 5;
}

/**
 * INTELLIGENTE Kategorien für VIRTUELLE PRODUKTE
 */
function determineCategories(trend: TrendData, price: number): { id: number }[] {
  const niche = trend.niche.toLowerCase();
  const keywords = trend.keywords.join(' ').toLowerCase();
  
  console.log(`🔍 Analysiere Kategorie für: "${trend.niche}"`);
  console.log(`💰 Preis: €${price} | Keywords: ${trend.keywords.join(', ')}`);

  // 1. FREEBIES (0€ Produkte)
  if (price === 0) {
    console.log(`🎯 Zuordnung: Freebies (ID: 15) - Kostenloses Produkt`);
    return [{ id: 15 }]; // Freebies
  }

  // 2. BITCOIN/KRYPTO
  if (niche.includes('bitcoin') || niche.includes('krypto') || 
      niche.includes('blockchain') || keywords.includes('crypto')) {
    console.log(`🎯 Zuordnung: Online-Kurse (ID: 145) - Krypto/Blockchain`);
    return [{ id: 145 }]; // Online-Kurse
  }
  
  // 3. AUDITS & SERVICES
  else if (niche.includes('audit') || niche.includes('analyse') || 
           niche.includes('review') || keywords.includes('service')) {
    console.log(`🎯 Zuordnung: Audits (ID: 51) - Service/Consulting`);
    return [{ id: 51 }]; // Audits
  }
  
  // 4. BUNDLES & PAKETE
  else if (niche.includes('bundle') || niche.includes('paket') || 
           niche.includes('complete') || keywords.includes('package')) {
    console.log(`🎯 Zuordnung: Bundles (ID: 52) - Produkt-Paket`);
    return [{ id: 52 }]; // Bundles
  }
  
  // 5. KITS & TEMPLATES (DevStarter etc.)
  else if (niche.includes('kit') || niche.includes('template') || 
           niche.includes('starter') || niche.includes('setup') ||
           keywords.includes('development') || keywords.includes('code')) {
    console.log(`🎯 Zuordnung: Kits & Templates (ID: 53) - Development`);
    return [{ id: 53 }]; // Kits & Templates
  }
  
  // 6. ONLINE-KURSE (Fallback für bezahlte Inhalte)
  else if (price > 0) {
    console.log(`🎯 Zuordnung: Online-Kurse (ID: 145) - Bezahltes Produkt`);
    return [{ id: 145 }]; // Online-Kurse
  }

  // 7. FALLBACK: Freebies
  console.log(`⚠️ Keine spezifische Kategorie, verwende Freebies (ID: 15)`);
  return [{ id: 15 }];
}