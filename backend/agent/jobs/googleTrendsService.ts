// agent/jobs/googleTrendsService.ts
// Types are defined in ../../types/google-trends-api.d.ts
// ...existing code...
import googleTrends from 'google-trends-api';

class GoogleTrendsService {
  static async getIndustryTrends() {
    try {
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
      return [];
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        keyword,
        trendScore: 0,
        change: 0,
        seasonality: 'unknown',
        dataSource: 'unavailable',
        lastUpdated: new Date().toISOString(),
        error: message
      };
    }
  }

  private static calculateSeasonality() {
    const month = new Date().getMonth();
    // Höhere Nachfrage für Datenschutz in Q1 (Steuerzeit) und Q3 (Urlaubszeit)
    return month >= 0 && month <= 2 ? 'high' : 
           month >= 6 && month <= 8 ? 'medium' : 'normal';
  }
}

// EXPORT HINZUFÜGEN
export { GoogleTrendsService };