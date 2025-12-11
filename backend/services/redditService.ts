/**
 * Reddit API Service
 * Sentiment-Analyse und Community-Insights für Produkte
 */

import axios from 'axios';
import { logger } from '../logger';

// ============================================================================
// Types
// ============================================================================

export interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  url: string;
}

export interface RedditSentiment {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number; // -100 to +100
  confidence: number; // 0-100%
  keywords: string[];
}

export interface RedditAnalysis {
  keyword: string;
  posts: RedditPost[];
  overallSentiment: RedditSentiment;
  topSubreddits: { name: string; postCount: number }[];
  totalMentions: number;
  trendingScore: number; // 0-100
}

// ============================================================================
// Service Class
// ============================================================================

export class RedditService {
  private baseUrl = 'https://www.reddit.com';
  private userAgent = 'KI-TrendAnalyzer/1.0';

  /**
   * Sucht Reddit-Posts zu einem Keyword
   */
  async searchPosts(
    keyword: string,
    subreddit?: string,
    limit: number = 25
  ): Promise<RedditPost[]> {
    try {
      const searchUrl = subreddit
        ? `${this.baseUrl}/r/${subreddit}/search.json`
        : `${this.baseUrl}/search.json`;

      const response = await axios.get(searchUrl, {
        params: {
          q: keyword,
          limit,
          sort: 'relevance',
          t: 'week', // letzte Woche
          restrict_sr: subreddit ? 'true' : 'false'
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const posts = response.data?.data?.children || [];
      
      return posts.map((child: any) => ({
        title: child.data.title,
        selftext: child.data.selftext || '',
        score: child.data.score,
        num_comments: child.data.num_comments,
        created_utc: child.data.created_utc,
        subreddit: child.data.subreddit,
        permalink: `https://reddit.com${child.data.permalink}`,
        url: child.data.url
      }));

    } catch (error) {
      logger.error({ keyword, error }, 'Reddit search failed');
      return [];
    }
  }

  /**
   * Analysiert Sentiment von Reddit-Posts
   */
  analyzeSentiment(posts: RedditPost[]): RedditSentiment {
    if (posts.length === 0) {
      return {
        sentiment: 'NEUTRAL',
        score: 0,
        confidence: 0,
        keywords: []
      };
    }

    // Einfache Sentiment-Analyse basierend auf Score und Keywords
    let totalScore = 0;
    const allKeywords: string[] = [];

    // Positive/Negative Keywords
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'perfect', 'fantastic', 'good', 'toll', 'super', 'genial', 'empfehlenswert'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'disappointing', 'schlecht', 'mies', 'katastrophe', 'enttäuschend'];

    posts.forEach(post => {
      const text = `${post.title} ${post.selftext}`.toLowerCase();
      
      // Score-basiertes Sentiment
      const normalizedScore = Math.max(-10, Math.min(10, post.score / 10));
      totalScore += normalizedScore;

      // Keyword-basiertes Sentiment
      let sentimentBoost = 0;
      positiveWords.forEach(word => {
        if (text.includes(word)) sentimentBoost += 5;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) sentimentBoost -= 5;
      });

      totalScore += sentimentBoost;

      // Extrahiere häufige Wörter (vereinfacht)
      const words = text.match(/\b\w{5,}\b/g) || [];
      allKeywords.push(...words);
    });

    // Berechne durchschnittlichen Score
    const avgScore = totalScore / posts.length;
    const normalizedScore = Math.max(-100, Math.min(100, avgScore * 10));

    // Bestimme Sentiment
    let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    if (normalizedScore > 20) sentiment = 'POSITIVE';
    else if (normalizedScore < -20) sentiment = 'NEGATIVE';

    // Confidence basierend auf Anzahl der Posts
    const confidence = Math.min((posts.length / 25) * 100, 100);

    // Top Keywords (häufigste Wörter)
    const keywordCounts: Record<string, number> = {};
    allKeywords.forEach(word => {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    });
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return {
      sentiment,
      score: Math.round(normalizedScore),
      confidence: Math.round(confidence),
      keywords: topKeywords
    };
  }

  /**
   * Komplette Reddit-Analyse für ein Produkt
   */
  async analyzeProduct(
    productName: string,
    category?: string
  ): Promise<RedditAnalysis> {
    try {
      // Relevante Subreddits basierend auf Kategorie
      const subreddits = this.getRelevantSubreddits(category);

      // Sammle Posts aus allen relevanten Subreddits
      const allPosts: RedditPost[] = [];
      
      for (const subreddit of subreddits) {
        const posts = await this.searchPosts(productName, subreddit, 10);
        allPosts.push(...posts);
        
        // Rate-Limiting respektieren
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Allgemeine Suche (ohne Subreddit-Filter)
      const generalPosts = await this.searchPosts(productName, undefined, 25);
      allPosts.push(...generalPosts);

      // Deduplizieren
      const uniquePosts = Array.from(
        new Map(allPosts.map(p => [p.permalink, p])).values()
      );

      // Sentiment-Analyse
      const sentiment = this.analyzeSentiment(uniquePosts);

      // Top Subreddits
      const subredditCounts: Record<string, number> = {};
      uniquePosts.forEach(post => {
        subredditCounts[post.subreddit] = (subredditCounts[post.subreddit] || 0) + 1;
      });
      const topSubreddits = Object.entries(subredditCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, postCount]) => ({ name, postCount }));

      // Trending Score (basierend auf Aktivität)
      const recentPosts = uniquePosts.filter(p => {
        const dayAgo = Date.now() / 1000 - 24 * 60 * 60;
        return p.created_utc > dayAgo;
      });
      const trendingScore = Math.min((recentPosts.length / uniquePosts.length) * 100, 100);

      return {
        keyword: productName,
        posts: uniquePosts.slice(0, 10), // Top 10 Posts
        overallSentiment: sentiment,
        topSubreddits,
        totalMentions: uniquePosts.length,
        trendingScore: Math.round(trendingScore)
      };

    } catch (error) {
      logger.error({ productName, error }, 'Reddit analysis failed');
      
      // Fallback bei Fehler
      return {
        keyword: productName,
        posts: [],
        overallSentiment: {
          sentiment: 'NEUTRAL',
          score: 0,
          confidence: 0,
          keywords: []
        },
        topSubreddits: [],
        totalMentions: 0,
        trendingScore: 0
      };
    }
  }

  /**
   * Ermittelt relevante Subreddits basierend auf Kategorie
   */
  private getRelevantSubreddits(category?: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'electronics': ['gadgets', 'technology', 'electronics', 'buyitforlife'],
      'fashion': ['fashion', 'streetwear', 'malefashionadvice', 'femalefashionadvice'],
      'books': ['books', 'booksuggestions', 'reading'],
      'gaming': ['gaming', 'games', 'pcgaming', 'consoles'],
      'beauty': ['beauty', 'makeupaddiction', 'skincareaddiction'],
      'home': ['homeimprovement', 'interiordesign', 'homegym'],
      'sports': ['fitness', 'running', 'bodyweightfitness'],
      'food': ['cooking', 'food', 'recipes'],
      'music': ['music', 'musicproduction', 'audioengineering'],
      'default': ['products', 'buyitforlife', 'deals', 'shopping']
    };

    const lowerCategory = (category || 'default').toLowerCase();
    
    // Finde passende Kategorie
    for (const [key, subreddits] of Object.entries(categoryMap)) {
      if (lowerCategory.includes(key)) {
        return subreddits;
      }
    }

    return categoryMap.default;
  }

  /**
   * Quick Sentiment Check (nur Top-Posts)
   */
  async quickSentiment(productName: string): Promise<RedditSentiment> {
    const posts = await this.searchPosts(productName, undefined, 10);
    return this.analyzeSentiment(posts);
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const redditService = new RedditService();
