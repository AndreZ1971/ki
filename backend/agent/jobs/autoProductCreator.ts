// backend/agent/jobs/autoProductCreator.ts
import { trendAnalysisJob } from './trendAnalysis';
//import { createFreebieJob } from './createFreebie';
import { TrendData } from './trendAnalysis';

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
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : (typeof err === 'string' ? err : JSON.stringify(err));
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
  // Produkt-Daten aus Trend generieren
  const productData = {
    name: generateProductName(trend.niche),
    description: generateProductDescription(trend),
    shortDescription: generateShortDescription(trend),
    price: calculateOptimalPrice(trend.priceRange),
    categories: determineCategories(trend),
    tags: trend.keywords,
    // ... weitere WooCommerce Felder
  };

  // Hier würden wir createFreebieJob anpassen für bezahlte Produkte
  // Für jetzt: Platzhalter
  console.log(`📦 Würde erstellen: "${productData.name}" für €${productData.price}`);
  
  return {
    name: productData.name,
    price: productData.price,
    trend: trend.niche,
    status: 'simulated' // Später: 'published' oder 'draft'
  };
}

/**
 * Generiert einen Produktnamen aus dem Trend
 */
function generateProductName(trendNiche: string): string {
  // Später: OpenAI für kreative Namen nutzen
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
 Optimalen Preis berechnen
 */
function calculateOptimalPrice(priceRange: { min: number; max: number }): number {
  // Strategie: Mittlerer bis oberer Bereich für bessere Margen
  return Math.round((priceRange.min + priceRange.max) / 2 / 5) * 5; // Auf 5er-Stufen runden
}

/**
 Kategorien bestimmen
 */
function determineCategories(trend: TrendData): number[] {
  // Hier Kategorie-IDs basierend auf Trend-Inhalt
  // Für jetzt: Standard-Kategorie
  return [15]; // Beispiel-Kategorie-ID
}