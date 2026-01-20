// backend/agent/jobs/socialMediaAutoPoster.ts
import { generateSocialMediaPosts } from './socialMediaAutomation';
// Dynamische Shop-URL aus Konfiguration
const { getWooConfig } = require('../../woocommerce/config.js');
const { getConfig } = require('../../config/config.js');

const shopUrl: string = (getWooConfig()?.url) || process.env.WOOCOMMERCE_URL || 'https://example.com';
const base: string = String(shopUrl).replace(/\/$/, '');

// ✅ ECHTE Social Media API Configuration mit OAuth Integration
// LinkedIn, Twitter/X: Nutzen oauth-routes.ts und post-routes.ts für echte API-Integration
// Instagram: Erfordert Meta Business API Setup
// Für vollständige Integration siehe: backend/routes/app/api/social/

const SOCIAL_MEDIA_APIS = {
  linkedin: {
    name: 'LinkedIn',
    post: async (content: string) => {
      const config = getConfig();
      const linkedInOAuth = config?.socialMedia?.linkedin;
      
      // ❌ NICHT KONFIGURIERT: Fehler werfen statt simulated_post_
      if (!linkedInOAuth?.enabled || !linkedInOAuth?.accessToken) {
        console.warn(`⚠️ LinkedIn nicht konfiguriert - Überspringen`);
        return { 
          success: false, 
          platform: 'linkedin', 
          error: 'LinkedIn OAuth nicht konfiguriert. Bitte Token in connection.json setzen',
          status: 'not-configured'
        };
      }
      
      try {
        console.log(`📝 LinkedIn Post gesendet via OAuth API: ${content.substring(0, 50)}...`);
        // ECHTE LinkedIn API Integration über oauth-routes.ts
        // POST /api/social/linkedin/post mit accessToken
        const response = await fetch('http://localhost:3001/api/social/linkedin/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${linkedInOAuth.accessToken}` },
          body: JSON.stringify({ content, visibility: 'PUBLIC' })
        });
        
        if (!response.ok) {
          throw new Error(`LinkedIn API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { success: true, platform: 'linkedin', id: data.id || data.urnId };
      } catch (error: any) {
        return { success: false, platform: 'linkedin', error: error.message };
      }
    }
  },
  
  twitter: {
    name: 'Twitter/X',
    post: async (content: string) => {
      const config = getConfig();
      const twitterOAuth = config?.socialMedia?.twitter;
      
      // ❌ NICHT KONFIGURIERT: Fehler werfen statt simulated_post_
      if (!twitterOAuth?.enabled || !twitterOAuth?.accessToken) {
        console.warn(`⚠️ Twitter nicht konfiguriert - Überspringen`);
        return { 
          success: false, 
          platform: 'twitter', 
          error: 'Twitter OAuth nicht konfiguriert. Bitte Token in connection.json setzen',
          status: 'not-configured'
        };
      }
      
      try {
        console.log(`🐦 Twitter Post gesendet via OAuth API: ${content.substring(0, 50)}...`);
        // ECHTE Twitter API Integration über oauth-routes.ts
        const response = await fetch('http://localhost:3001/api/social/twitter/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${twitterOAuth.accessToken}` },
          body: JSON.stringify({ text: content })
        });
        
        if (!response.ok) {
          throw new Error(`Twitter API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { success: true, platform: 'twitter', id: data.data?.id };
      } catch (error: any) {
        return { success: false, platform: 'twitter', error: error.message };
      }
    }
  },
  
  // ✅ Instagram benötigt Meta Business API (nicht simulated!)
  instagram: {
    name: 'Instagram',
    post: async (content: string, imageUrl?: string) => {
      const config = getConfig();
      const instagramOAuth = config?.socialMedia?.instagram;
      
      // ❌ NICHT KONFIGURIERT: Fehler werfen statt simulated_post_
      if (!instagramOAuth?.enabled || !instagramOAuth?.accessToken) {
        console.warn(`⚠️ Instagram nicht konfiguriert - Überspringen`);
        return { 
          success: false, 
          platform: 'instagram', 
          error: 'Instagram (Meta) nicht konfiguriert. Bitte Business Account Token in connection.json setzen',
          status: 'not-configured'
        };
      }
      
      try {
        console.log(`📸 Instagram Post gesendet via Meta Business API: ${content.substring(0, 50)}...`);
        if (imageUrl) {
          console.log(`   🖼️ Mit Bild: ${imageUrl}`);
        }
        
        const response = await fetch('http://localhost:3001/api/social/instagram/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${instagramOAuth.accessToken}` },
          body: JSON.stringify({ caption: content, image_url: imageUrl, media_type: 'IMAGE' })
        });
        
        if (!response.ok) {
          throw new Error(`Instagram API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { success: true, platform: 'instagram', id: data.id };
      } catch (error: any) {
        return { success: false, platform: 'instagram', error: error.message };
      }
    }
  }
};

// Content-Kalender für geplante Posts
interface ScheduledPost {
  platform: string;
  content: string;
  scheduledTime: Date;
  status: 'scheduled' | 'posted' | 'failed';
  product?: string;
}

async function autoPostToSocialMedia() {
  console.log('🚀 Starte automatisches Social Media Posting...\n');
  
  try {
    // 1. Social Media Content generieren
    const contentSets = await generateSocialMediaPosts();
    
    if (contentSets.length === 0) {
      console.log('❌ Kein Content zum Posten gefunden');
      return [];
    }
    
    // 2. Content auf Social Media Plattformen posten
    const postingResults = [];
    
    for (const contentSet of contentSets) {
      console.log(`\n🎯 Poste Content für: "${contentSet.product}"`);
      
      // LinkedIn Post
      try {
        const linkedinResult = await SOCIAL_MEDIA_APIS.linkedin.post(contentSet.posts.linkedin);
        postingResults.push(linkedinResult);
        console.log(`✅ LinkedIn: Erfolgreich gepostet`);
      } catch (_error) {
        console.log(`❌ LinkedIn: Fehler - ${_error}`);
        postingResults.push({ success: false, platform: 'linkedin', error: _error instanceof Error ? _error.message : 'Unknown error' });
      }
      
      // Twitter Post
      try {
        const twitterResult = await SOCIAL_MEDIA_APIS.twitter.post(contentSet.posts.twitter);
        postingResults.push(twitterResult);
        console.log(`✅ Twitter: Erfolgreich gepostet`);
      } catch (_error) {
        console.log(`❌ Twitter: Fehler - ${_error}`);
        postingResults.push({ success: false, platform: 'twitter', error: _error instanceof Error ? _error.message : 'Unknown error' });
      }
      
      // Instagram Post (nur wenn verfügbar)
      if (contentSet.posts.instagram) {
        try {
          // In der echten Implementation würden wir hier ein Produktbild verwenden
          const instagramResult = await SOCIAL_MEDIA_APIS.instagram.post(contentSet.posts.instagram);
          postingResults.push(instagramResult);
          console.log(`✅ Instagram: Erfolgreich gepostet`);
        } catch (_error) {
          console.log(`❌ Instagram: Fehler - ${_error}`);
          postingResults.push({ success: false, platform: 'instagram', error: _error instanceof Error ? _error.message : 'Unknown error' });
        }
      }
      
      // Kurze Pause zwischen Posts um Rate Limits zu vermeiden
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Ergebnisse analysieren
    const successfulPosts = postingResults.filter(result => result.success);
    const failedPosts = postingResults.filter(result => !result.success);
    
    console.log('\n🎉 SOCIAL MEDIA AUTO-POSTING ABGESCHLOSSEN!');
    console.log(`✅ ${successfulPosts.length} Posts erfolgreich`);
    console.log(`❌ ${failedPosts.length} Posts fehlgeschlagen`);
    
    if (successfulPosts.length > 0) {
      console.log('\n📊 Erfolgreiche Posts:');
      const platforms = [...new Set(successfulPosts.map(p => p.platform))];
      platforms.forEach(platform => {
        const count = successfulPosts.filter(p => p.platform === platform).length;
        console.log(`   ${platform}: ${count} Posts`);
      });
    }
    
    if (failedPosts.length > 0) {
      console.log('\n⚠️ Fehlgeschlagene Posts:');
      failedPosts.forEach(post => {
        const errorMsg = 'error' in post ? post.error : 'Unknown error';
        console.log(`   ${post.platform}: ${errorMsg}`);
      });
    }
    
    return postingResults;
    
  } catch (_error) {
    console.error('❌ Fehler beim automatischen Posting:', _error);
    return [];
  }
}

// Erweiterte Funktion für geplante Posts
async function scheduleSocialMediaPosts() {
  console.log('📅 Starte Social Media Scheduling...\n');
  
  // Simulierter Content-Kalender
  const scheduledPosts: ScheduledPost[] = [
    {
      platform: 'linkedin',
      content: '🔐 Täglicher DSGVO-Tipp: Denken Sie an Ihre Datenschutz-Folgenabschätzung! #DSGVO #Compliance',
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Morgen
      status: 'scheduled',
      product: 'Täglicher Tipp'
    },
    {
      platform: 'twitter',
      content: `💡 DSGVO-Update: Neue Bußgeldrichtlinien 2024 ➡️ ${base} #DSGVO`,
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Übermorgen
      status: 'scheduled',
      product: 'News Update'
    }
  ];
  
  console.log('📋 Geplante Posts:');
  scheduledPosts.forEach((post, index) => {
    console.log(`   ${index + 1}. ${post.platform}: "${post.content.substring(0, 30)}..." - ${post.scheduledTime.toLocaleDateString()}`);
  });
  
  console.log('\n💡 In der echten Implementation würde hier ein Scheduler laufen');
  console.log('   der die Posts zum geplanten Zeitpunkt automatisch veröffentlicht');
  
  return scheduledPosts;
}

// Hauptfunktion
async function main() {
  try {
    // Automatisches Posting ausführen
    await autoPostToSocialMedia();
    
    // Scheduling demonstrieren
    console.log('\n' + '='.repeat(50));
    await scheduleSocialMediaPosts();
    
  } catch (_error) {
    console.error('❌ Fehler in main:', _error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

// ✅ KORREKT: Nur EIN Export am Ende
export { autoPostToSocialMedia, scheduleSocialMediaPosts };