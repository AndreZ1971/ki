//backend/jobs/trendAnalysis.ts
// Entfernt: axios Import, da nicht verwendet

const googleTrends = require('google-trends-api');

export interface TrendData {
  niche: string;
  demandScore: number; // 1-100
  competition: number; // 1-100 (niedrig = besser)
  seasonality: string[]; // ["Q1", "Q4"]
  priceRange: { min: number; max: number };
  keywords: string[];
}

export interface TrendAnalysisResult {
  trendingProducts: TrendData[];
  analysisDate: string;
  source: 'google-trends' | 'reddit';
}

/**
 * Hauptfunktion für Trend-Analyse
 */
export async function trendAnalysisJob(options?: { 
  keyword?: string;
  geo?: string;
  includeReddit?: boolean;
}): Promise<TrendAnalysisResult> {
  // ...existing code...
  const geo = options?.geo || 'DE';
  const keyword = options?.keyword || '';
  
  console.log(`🔍 Starte Trend-Analyse für: "${keyword}" in ${geo}`);

  // 1. Google Trends Daten abrufen
  const googleData = await analyzeGoogleTrends(keyword, geo);
  
  // 2. Reddit Daten (optional)
  let redditData: TrendData[] = [];
  if (options?.includeReddit && process.env.REDDIT_CLIENT_ID) {
    redditData = await analyzeRedditTrends(keyword);
  }

  // 3. Daten kombinieren und bewerten
  const allTrends = [...googleData, ...redditData];
  const scoredTrends = scoreTrends(allTrends);

  return {
    trendingProducts: scoredTrends.slice(0, 10), // Top 10
    analysisDate: new Date().toISOString(),
    source: options?.includeReddit ? 'reddit' : 'google-trends'
  };
}

/**
 * Google Trends Analyse
 */
async function analyzeGoogleTrends(keyword: string, geo: string): Promise<TrendData[]> {
  try {
    console.log('📊 Analysiere Google Trends...');
    
    // Related Queries
    const relatedQueries = await googleTrends.relatedQueries({
      keyword,
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 Tage
      endTime: new Date(),
      geo
    });

    // Interest Over Time
    const interestOverTime = await googleTrends.interestOverTime({
      keyword,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 Tage
      endTime: new Date(),
      geo
    });

    const parsedQueries = JSON.parse(relatedQueries);
    const parsedInterest = JSON.parse(interestOverTime);

    // Trends aus Google Daten extrahieren
    const trends: TrendData[] = [];
    
    // Top related queries als Trends nutzen
    if (parsedQueries?.default?.rankedList?.[0]?.rankedKeyword) {
      parsedQueries.default.rankedList[0].rankedKeyword.forEach((item: any, index: number) => {
        if (index < 15) { // Top 15
          trends.push({
            niche: item.query,
            demandScore: Math.min(100, Math.max(20, 100 - index * 5)), // Höher = besserer Rank
            competition: Math.min(100, Math.max(10, index * 6)), // Niedriger = weniger Competition
            seasonality: analyzeSeasonality(),
            priceRange: estimatePriceRange(item.query),
            keywords: extractKeywords(item.query)
          });
        }
      });
    }

    console.log(`✅ Google Trends: ${trends.length} Trends gefunden`);
    return trends;

  } catch (_error) {
    console.error('❌ Google Trends Fehler:', _error);
    return [];
  }
}

/**
 * Reddit Trends Analyse
 */
async function analyzeRedditTrends(_keyword: string): Promise<TrendData[]> {
  // Für später - erstmal Platzhalter
  console.log('📝 Reddit Analysis coming soon...');
  return [];
}

/**
 * Trend Scoring
 */
function scoreTrends(trends: TrendData[]): TrendData[] {
  return trends
    .map(trend => ({
      ...trend,
      demandScore: calculateDemandScore(trend)
    }))
    .sort((a, b) => b.demandScore - a.demandScore);
}

/**
 * Demand Score berechnen
 */
function calculateDemandScore(trend: TrendData): number {
  let score = trend.demandScore;
  
  // Competition abziehen (hohe Competition = schlechter)
  score -= (trend.competition / 2);
  
  // Saison-Bonus/Malus
  const currentQuarter = getCurrentQuarter();
  if (trend.seasonality.includes(currentQuarter)) {
    score += 15;
  }
  
  return Math.max(10, Math.min(100, score));
}

/**
 * Preisrange schätzen basierend auf Nische
 */
function estimatePriceRange(niche: string): { min: number; max: number } {
  const nicheLower = niche.toLowerCase();
  
  if (nicheLower.includes('template') || nicheLower.includes('vorlage')) {
    return { min: 9.99, max: 29.99 };
  } else if (nicheLower.includes('course') || nicheLower.includes('kurs')) {
    return { min: 49.99, max: 199.99 };
  } else if (nicheLower.includes('ebook') || nicheLower.includes('buch')) {
    return { min: 4.99, max: 19.99 };
  } else if (nicheLower.includes('software') || nicheLower.includes('tool')) {
    return { min: 19.99, max: 99.99 };
  } else {
    return { min: 9.99, max: 49.99 };
  }
}

/**
 * Keywords extrahieren
 */
function extractKeywords(niche: string): string[] {
  const words = niche.toLowerCase().split(/[\s\-,]+/);
  return words.filter(word => word.length > 3).slice(0, 5);
}

/**
 * Saisonality analysieren
 */
function analyzeSeasonality(): string[] {
  // Vereinfachte Implementation
  return ['Q1', 'Q4']; // Meistens Anfang und Ende des Jahres stark
}

/**
 * Aktuelles Quartal
 */
function getCurrentQuarter(): string {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}