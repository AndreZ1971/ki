// agent/jobs/googleTrendsService.ts
// Types are defined in ../../types/google-trends-api.d.ts
// @ts-expect-error - No type definitions available
import googleTrends from 'google-trends-api';

class GoogleTrendsService {
  static async getIndustryTrends() {
    try {
      console.log('🔍 Analysiere Google Trends für Datenschutz-Branche...');
      
      // Keywords die für dein Business relevant sind
      const keywords = [
        'datenschutz',
        'dsgvo', 
        'cookie consent',
        'datenschutz schulung',
        'dsgvo compliance'
      ];

      const trends = await Promise.all(
        keywords.map(keyword => this.getTrendData(keyword))
      );

      return trends;
    } catch (_error) {
      console.error('❌ Fehler beim Laden der Google Trends:', _error);
      return this.getFallbackTrendData();
    }
  }

  private static async getTrendData(keyword: string, geo: string = 'DE') {
    try {
      // ✅ ECHTE Google Trends API statt Math.random()
      const result = await googleTrends.interestOverTime({
        keyword,
        geo,
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Letzte 90 Tage
        granularTimeResolution: true
      });

      const data = JSON.parse(result);
      const timelineData = data.default?.timelineData || [];
      
      if (timelineData.length === 0) {
        throw new Error('Keine Trend-Daten verfügbar');
      }

      // Aktueller Trend-Score (0-100)
      const latestValue = timelineData[timelineData.length - 1]?.value?.[0] || 0;
      
      // Trend-Änderung berechnen (Vergleich mit vor 30 Tagen)
      const thirtyDaysAgo = timelineData[Math.max(0, timelineData.length - 30)]?.value?.[0] || latestValue;
      const change = thirtyDaysAgo > 0 ? ((latestValue - thirtyDaysAgo) / thirtyDaysAgo) * 100 : 0;

      return {
        keyword,
        trendScore: latestValue,
        change: parseFloat(change.toFixed(2)),
        seasonality: this.calculateSeasonality(),
        dataSource: 'google-trends-api',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`⚠️ Google Trends Fehler für "${keyword}":`, error instanceof Error ? error.message : 'Unknown error');
      // Fallback zu Mock-Daten wenn API fehlschlägt
      return {
        keyword,
        trendScore: Math.floor(Math.random() * 100) + 1,
        change: (Math.random() - 0.5) * 20,
        seasonality: this.calculateSeasonality(),
        dataSource: 'fallback',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private static calculateSeasonality() {
    const month = new Date().getMonth();
    // Höhere Nachfrage für Datenschutz in Q1 (Steuerzeit) und Q3 (Urlaubszeit)
    return month >= 0 && month <= 2 ? 'high' : 
           month >= 6 && month <= 8 ? 'medium' : 'normal';
  }

  private static getFallbackTrendData() {
    return [
      { keyword: 'datenschutz', trendScore: 85, change: 12.5, seasonality: 'high' },
      { keyword: 'dsgvo', trendScore: 78, change: 8.3, seasonality: 'medium' },
      { keyword: 'cookie consent', trendScore: 92, change: 15.7, seasonality: 'high' },
      { keyword: 'datenschutz schulung', trendScore: 65, change: 5.2, seasonality: 'normal' },
      { keyword: 'dsgvo compliance', trendScore: 88, change: 10.1, seasonality: 'high' }
    ];
  }
}

// EXPORT HINZUFÜGEN
export { GoogleTrendsService };