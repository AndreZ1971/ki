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
  const { getConfig } = require('../../config');
  const config = getConfig();
  
  // ...existing code...
  const geo = options?.geo || 'DE';
  const keyword = options?.keyword || '';
  
  console.log(`🔍 Starte Trend-Analyse für: "${keyword}" in ${geo}`);

  // 1. Google Trends Daten abrufen
  const googleData = await analyzeGoogleTrends(keyword, geo);

  // 2. Reddit Daten (optional)
  let redditData: TrendData[] = [];
  if (options?.includeReddit && config.reddit?.clientId) {
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

    const parsedQueries = JSON.parse(relatedQueries);

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
async function analyzeRedditTrends(keyword: string): Promise<TrendData[]> {
  try {
    console.log('📝 Analysiere Reddit Trends...');
    
    const { getConfig } = require('../../config');
    const config = getConfig();
    const redditConfig = config.reddit;
    
    if (!redditConfig?.clientId || !redditConfig?.clientSecret) {
      console.warn('⚠️ Reddit credentials nicht konfiguriert');
      return [];
    }

    // Reddit OAuth Token abrufen
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${redditConfig.clientId}:${redditConfig.clientSecret}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'KI-TrendAnalyzer/1.0'
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      console.error('❌ Reddit OAuth Fehler:', authResponse.statusText);
      return [];
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Suche nach Trends mit diesem Keyword
    const searchResponse = await fetch(
      `https://oauth.reddit.com/r/all/search?q=${encodeURIComponent(keyword)}&sort=hot&limit=50&type=link`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'KI-TrendAnalyzer/1.0'
        }
      }
    );

    if (!searchResponse.ok) {
      console.error('❌ Reddit Search Fehler:', searchResponse.statusText);
      return [];
    }

    const searchData = await searchResponse.json();
    const trends: TrendData[] = [];

    // Reddit Posts in TrendData konvertieren
    if (searchData?.data?.children) {
      searchData.data.children.slice(0, 15).forEach((post: any, index: number) => {
        const postData = post.data;
        
        trends.push({
          niche: postData.title,
          demandScore: Math.min(100, Math.max(20, 100 - index * 5)),
          competition: Math.min(100, Math.max(10, index * 4)),
          seasonality: analyzeSeasonality(),
          priceRange: estimatePriceRange(postData.title),
          keywords: extractKeywords(postData.title)
        });
      });
    }

    console.log(`✅ Reddit Trends: ${trends.length} Posts gefunden für "${keyword}"`);
    return trends;

  } catch (error: any) {
    console.error('❌ Reddit Trends Fehler:', error.message);
    return [];
  }
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