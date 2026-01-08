/**
 * Multi-Source Trend Aggregator Service
 * Aggregiert Trend-Daten aus verschiedenen Quellen für ML und Agent
 */

import axios from 'axios';
// ...existing code...
import googleTrends from 'google-trends-api';
import { logger } from '../logger';
// ...existing code...
import Parser from 'rss-parser';
import { getConfig } from '@config';

// ============================================================================
// Types
// ============================================================================

export interface TrendSource {
  name: string;
  type: 'search' | 'social' | 'media' | 'tech' | 'news';
  available: boolean;
  requiresAuth: boolean;
}

export interface TrendDataPoint {
  source: string;
  keyword: string;
  score: number; // 0-100
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AggregatedTrend {
  keyword: string;
  overallScore: number;
  sources: TrendDataPoint[];
  category?: string;
  confidence: number;
}

// ============================================================================
// Configuration
// ============================================================================

const SOURCES: Record<string, TrendSource> = {
  googleTrends: {
    name: 'Google Trends',
    type: 'search',
    available: true,
    requiresAuth: false
  },
  youtube: {
    name: 'YouTube Trending',
    type: 'media',
    available: !!process.env.YOUTUBE_API_KEY,
    requiresAuth: true
  },
  reddit: {
    name: 'Reddit',
    type: 'social',
    available: true, // Check credentials at runtime via getConfig()
    requiresAuth: true
  },
  wikipedia: {
    name: 'Wikipedia Pageviews',
    type: 'search',
    available: true,
    requiresAuth: false
  },
  googleNews: {
    name: 'Google News RSS',
    type: 'news',
    available: true,
    requiresAuth: false
  },
  github: {
    name: 'GitHub Trending',
    type: 'tech',
    available: true,
    requiresAuth: false
  },
  stackoverflow: {
    name: 'Stack Overflow',
    type: 'tech',
    available: true,
    requiresAuth: false
  }
};

// ============================================================================
// Service Class
// ============================================================================

export class TrendAggregatorService {
  private rssParser: Parser;

  constructor() {
    this.rssParser = new Parser();
  }

  /**
   * Get available sources
   */
  getAvailableSources(): TrendSource[] {
    return Object.values(SOURCES).filter(s => s.available);
  }

  /**
   * Aggregate trends from multiple sources
   */
  async aggregateTrends(
    keyword: string,
    sources?: string[]
  ): Promise<AggregatedTrend> {
    const activeSources = sources || Object.keys(SOURCES).filter(k => SOURCES[k].available);
    const results: TrendDataPoint[] = [];

    // Parallel fetching from all sources
    const promises = activeSources.map(async (source) => {
      try {
        const data = await this.fetchFromSource(source, keyword);
        if (data) results.push(data);
      } catch (error) {
        logger.warn({ source, keyword, error }, 'Failed to fetch from source');
      }
    });

    await Promise.allSettled(promises);

    // Calculate overall score
    const overallScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;

    // Calculate confidence based on number of sources
    const confidence = Math.min(results.length / activeSources.length, 1) * 100;

    return {
      keyword,
      overallScore,
      sources: results,
      confidence
    };
  }

  /**
   * Fetch data from specific source
   */
  private async fetchFromSource(
    source: string,
    keyword: string
  ): Promise<TrendDataPoint | null> {
    switch (source) {
      case 'googleTrends':
        return this.fetchGoogleTrends(keyword);
      case 'youtube':
        return this.fetchYouTubeTrending(keyword);
      case 'wikipedia':
        return this.fetchWikipediaPageviews(keyword);
      case 'googleNews':
        return this.fetchGoogleNews(keyword);
      case 'github':
        return this.fetchGitHubTrending(keyword);
      case 'stackoverflow':
        return this.fetchStackOverflow(keyword);
      case 'reddit':
        return this.fetchReddit(keyword);
      default:
        logger.warn({ source }, 'Unknown source');
        return null;
    }
  }

  // ============================================================================
  // Source-specific implementations
  // ============================================================================

  /**
   * Google Trends API
   */
  private async fetchGoogleTrends(keyword: string): Promise<TrendDataPoint | null> {
    try {
      const result = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        geo: 'DE'
      });

      const data = JSON.parse(result);
      const timeline = data.default?.timelineData || [];
      
      if (timeline.length === 0) return null;

      // Calculate average interest
      const avgScore = timeline.reduce((sum: number, item: any) => 
        sum + (item.value?.[0] || 0), 0) / timeline.length;

      return {
        source: 'googleTrends',
        keyword,
        score: avgScore,
        timestamp: new Date().toISOString(),
        metadata: {
          dataPoints: timeline.length,
          peak: Math.max(...timeline.map((t: any) => t.value?.[0] || 0))
        }
      };
    } catch (error) {
      logger.error({ keyword, error }, 'Google Trends fetch failed');
      return null;
    }
  }

  /**
   * YouTube Data API v3
   */
  private async fetchYouTubeTrending(keyword: string): Promise<TrendDataPoint | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: keyword,
          type: 'video',
          order: 'viewCount',
          maxResults: 10,
          regionCode: 'DE',
          key: apiKey
        }
      });

      const videos = response.data.items || [];
      
      // Score based on number of relevant videos found
      const score = Math.min((videos.length / 10) * 100, 100);

      return {
        source: 'youtube',
        keyword,
        score,
        timestamp: new Date().toISOString(),
        metadata: {
          videoCount: videos.length,
          recentVideos: videos.length
        }
      };
    } catch (error) {
      logger.error({ keyword, error }, 'YouTube fetch failed');
      return null;
    }
  }

  /**
   * Reddit (OAuth API via connection.json)
   */
  private async fetchReddit(keyword: string): Promise<TrendDataPoint | null> {
    const config = getConfig();
    const clientId = config.reddit?.clientId;
    const clientSecret = config.reddit?.clientSecret;

    if (!clientId || !clientSecret) {
      logger.warn('Reddit OAuth credentials missing in connection.json, skipping');
      return null;
    }

    try {
      // Step 1: Get OAuth token (application-only, no user context)
      const authResponse = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          auth: {
            username: clientId,
            password: clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ari-trend-aggregator/1.0'
          },
          timeout: 8000
        }
      );

      const accessToken = authResponse.data.access_token;
      if (!accessToken) {
        logger.warn('Reddit OAuth token not received');
        return null;
      }

      // Step 2: Search with OAuth token
      const searchResponse = await axios.get('https://oauth.reddit.com/search', {
        params: {
          q: keyword,
          sort: 'relevance',
          limit: 25,
          restrict_sr: false,
          t: 'week'
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'ari-trend-aggregator/1.0'
        },
        timeout: 8000
      });

      const posts = searchResponse.data?.data?.children || [];
      if (!posts.length) return null;

      const upvotes = posts.map((p: any) => p.data?.score || 0);
      const comments = posts.map((p: any) => p.data?.num_comments || 0);
      const avgScore = upvotes.reduce((a: number, b: number) => a + b, 0) / posts.length;
      const avgComments = comments.reduce((a: number, b: number) => a + b, 0) / posts.length;

      // Score heuristic: blend volume and engagement
      const volumeScore = Math.min((posts.length / 25) * 100, 100);
      const engagementScore = Math.min((avgScore + avgComments) * 2, 100);
      const score = Math.min((volumeScore * 0.6 + engagementScore * 0.4), 100);

      return {
        source: 'reddit',
        keyword,
        score,
        timestamp: new Date().toISOString(),
        metadata: {
          posts: posts.length,
          avgUpvotes: avgScore,
          avgComments,
          authenticated: true
        }
      };
    } catch (error) {
      logger.warn({ keyword, error }, 'Reddit OAuth fetch failed');
      return null;
    }
  }

  /**
   * Wikipedia Pageviews API
   */
  private async fetchWikipediaPageviews(keyword: string): Promise<TrendDataPoint | null> {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');
      
      const response = await axios.get(
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/de.wikipedia/all-access/all-agents/${encodeURIComponent(keyword)}/daily/${dateStr}/${dateStr}`,
        {
          headers: {
            'User-Agent': 'KI-TrendAnalyzer/1.0'
          }
        }
      );

      const views = response.data.items?.[0]?.views || 0;
      
      // Normalize views to 0-100 scale (10k views = 100%)
      const score = Math.min((views / 10000) * 100, 100);

      return {
        source: 'wikipedia',
        keyword,
        score,
        timestamp: new Date().toISOString(),
        metadata: {
          views,
          date: dateStr
        }
      };
    } catch (error) {
      // 404 is normal for non-existent articles
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error({ keyword, error }, 'Wikipedia fetch failed');
      return null;
    }
  }

  /**
   * Google News RSS Feed
   */
  private async fetchGoogleNews(keyword: string): Promise<TrendDataPoint | null> {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=de&gl=DE&ceid=DE:de`;
      
      const feed = await this.rssParser.parseURL(rssUrl);
      
      const recentArticles = feed.items.filter((item: any) => {
        const pubDate = new Date(item.pubDate || '');
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return pubDate.getTime() > dayAgo;
      });

      // Score based on number of articles in last 24h
      const score = Math.min((recentArticles.length / 10) * 100, 100);

      return {
        source: 'googleNews',
        keyword,
        score,
        timestamp: new Date().toISOString(),
        metadata: {
          totalArticles: feed.items.length,
          recentArticles: recentArticles.length,
          latestTitle: feed.items[0]?.title
        }
      };
    } catch (error) {
      logger.error({ keyword, error }, 'Google News fetch failed');
      return null;
    }
  }

  /**
   * GitHub Trending (via API)
   */
  private async fetchGitHubTrending(keyword: string): Promise<TrendDataPoint | null> {
    try {
      const response = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q: keyword,
          sort: 'stars',
          order: 'desc',
          per_page: 10
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'KI-TrendAnalyzer/1.0'
        }
      });

      const repos = response.data.items || [];
      
      // Score based on total stars and recent activity
      const totalStars = repos.reduce((sum: number, repo: any) => sum + (repo.stargazers_count || 0), 0);
      const score = Math.min((totalStars / 1000) * 100, 100);

      return {
        source: 'github',
        keyword,
        score,
        timestamp: new Date().toISOString(),
        metadata: {
          repoCount: repos.length,
          totalStars,
          topRepo: repos[0]?.full_name
        }
      };
    } catch (error) {
      logger.error({ keyword, error }, 'GitHub fetch failed');
      return null;
    }
  }

  /**
   * Stack Overflow Tags API
   */
  private async fetchStackOverflow(keyword: string): Promise<TrendDataPoint | null> {
    try {
      const response = await axios.get('https://api.stackexchange.com/2.3/tags', {
        params: {
          order: 'desc',
          sort: 'popular',
          inname: keyword,
          site: 'stackoverflow'
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      const tags = response.data.items || [];
      
      if (tags.length === 0) return null;

      // Score based on question count
      const topTag = tags[0];
      const score = Math.min((topTag.count / 10000) * 100, 100);

      return {
        source: 'stackoverflow',
        keyword,
        score,
        timestamp: new Date().toISOString(),
        metadata: {
          tagCount: tags.length,
          questionCount: topTag.count,
          tagName: topTag.name
        }
      };
    } catch (error) {
      logger.error({ keyword, error }, 'Stack Overflow fetch failed');
      return null;
    }
  }

  /**
   * Batch analyze multiple keywords
   */
  async batchAnalyze(keywords: string[]): Promise<AggregatedTrend[]> {
    const results = await Promise.allSettled(
      keywords.map(keyword => this.aggregateTrends(keyword))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<AggregatedTrend> => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => b.overallScore - a.overallScore);
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const trendAggregator = new TrendAggregatorService();
