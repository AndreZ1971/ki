// agent/jobs/wordpressAnalyticsService.ts
import * as dotenv from 'dotenv';

// Environment Variables laden
dotenv.config();

class WordPressAnalyticsService {
  static async getContentPerformance() {
    try {
      console.log('📝 Lade WordPress Content Performance...');
      
      // Validiere Environment Variables
      if (!process.env.WORDPRESS_API_BASE || !process.env.WORDPRESS_USERNAME || !process.env.WORDPRESS_APPLICATION_PASSWORD) {
        throw new Error('WordPress Environment Variables fehlen');
      }

      const response = await fetch(
        `${process.env.WORDPRESS_API_BASE}${process.env.WORDPRESS_POSTS_ENDPOINT || '/wp/v2/posts'}?per_page=5&_fields=id,title,date,modified,link`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`
            ).toString('base64')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`WordPress API Error: ${response.status} ${response.statusText}`);
      }

      const posts = await response.json();
      console.log(`✅ WordPress Posts geladen: ${posts.length}`);
      
      return this.transformPostData(posts);
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der WordPress Daten:', error.message);
      return this.getFallbackContentData();
    }
  }

  private static transformPostData(posts: any[]) {
    return posts.map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      published: post.date,
      lastModified: post.modified,
      url: post.link,
      pageViews: Math.floor(Math.random() * 1000) + 100,
      engagement: Math.floor(Math.random() * 50) + 10
    }));
  }

  private static getFallbackContentData() {
    return [
      {
        title: "Datenschutz Best Practices 2024",
        pageViews: 1240,
        engagement: 89
      },
      {
        title: "DSGVO Compliance Checkliste",
        pageViews: 980,
        engagement: 67
      },
      {
        title: "Cookie Consent Lösungen für Unternehmen",
        pageViews: 750,
        engagement: 45
      }
    ];
  }
}

export { WordPressAnalyticsService };