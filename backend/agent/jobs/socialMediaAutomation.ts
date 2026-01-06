// backend/agent/jobs/socialMediaAutomation.ts - KORRIGIERTE VERSION
import { wooGet } from '../../tools/woo';
// Dynamische Shop-URL für Links
const { getWooConfig } = require('../../woocommerce/config.js');
const __shopUrl: string = (getWooConfig()?.url) || process.env.WOOCOMMERCE_URL || 'https://example.com';
const base: string = String(__shopUrl).replace(/\/$/, '');

// Deutsche DSGVO-spezifische Social Media Content-Templates
const GERMAN_SOCIAL_TEMPLATES = {
  linkedin: [
    "🔐 DSGVO-Tipp: {tip}\n\n{product} hilft dir bei der Umsetzung! ➡️ {link}\n\n#DSGVO #Datenschutz #Compliance",
    "🚀 Neues Produkt: {product}\n\n{description}\n\nJetzt entdecken: {link}\n\n#Datenschutz #OnlineBusiness #DSGVO",
    "📊 Studie zeigt: {statistic}\n\nMit {product} bleibst du compliant! ➡️ {link}\n\n#Compliance #Sicherheit #DSGVO"
  ],
  
  twitter: [
    "🔐 DSGVO-Tipp: {tip} ➡️ {link} #DSGVO #Datenschutz",
    "🚀 Neu: {product} - {shortDescription} ➡️ {link} #Compliance", 
    "💡 Wusstest du? {fact} Mehr unter: {link} #DSGVO"
  ],
  
  instagram: [
    "🔐 DSGVO-Compliance leicht gemacht! 💪\n\n{product} hilft dir bei der Umsetzung.\n\n➡️ Link in Bio für mehr Infos!\n\n#DSGVO #Datenschutz #Compliance #Sicherheit",
    "🚀 Neues Tool für dein Business! 🎯\n\n{product} - {description}\n\nJetzt entdecken! 🔗\n\n#OnlineBusiness #DSGVO #Datenschutz"
  ]
};

// Deutsche DSGVO-Fakten und Tipps
const GERMAN_DSGVO_CONTENT = {
  tips: [
    "Regelmäßige Datenschutz-Folgenabschätzungen durchführen",
    "Cookie-Consent korrekt implementieren - kein 'Dark Pattern'",
    "Auftragsverarbeitungsverträge (AVV) mit allen Dienstleistern abschließen",
    "Datenminimierung praktizieren - nur erforderliche Daten erheben",
    "Betroffenenrechte schnell und korrekt bearbeiten",
    "Technische und organisatorische Maßnahmen dokumentieren",
    "Datenschutz durch Technikgestaltung umsetzen"
  ],
  
  statistics: [
    "85% der Unternehmen haben noch Lücken in ihrer DSGVO-Compliance",
    "Durchschnittliche Bußgelder sind 2024 um 40% gestiegen",
    "72% der Kunden achten auf Datenschutz bei Online-Käufen",
    "Compliant Unternehmen haben 30% weniger Datenschutz-Vorfälle"
  ],
  
  facts: [
    "Die DSGVO gilt seit Mai 2018 in der gesamten EU",
    "Bußgelder können bis zu 4% des weltweiten Jahresumsatzes betragen",
    "Jedes Unternehmen muss einen Datenschutzbeauftragten benennen, sofern bestimmte Kriterien erfüllt sind",
    "Die Datenschutz-Grundverordnung gibt Betroffenen umfangreiche Rechte"
  ]
};

// Type Definitionen
interface SocialMediaPosts {
  linkedin: string;
  twitter: string;
  instagram?: string;
}

interface GeneratedContent {
  product: string;
  posts: SocialMediaPosts;
}

async function generateSocialMediaPosts() {
  console.log('📱 Starte Social Media Content-Generierung...\n');
  
  try {
    // 1. ALLE Produkte von WooCommerce abrufen (auch drafts!)
    const products = await wooGet('/products') as any[];
    
    // Verwende ALLE Produkte, nicht nur veröffentlichte
    const availableProducts = products.slice(0, 3); // Erste 3 Produkte
    
    console.log(`📦 Gefunden: ${products.length} Produkte total`);
    console.log(`🎯 Verwende: ${availableProducts.length} Produkte für Marketing`);
    
    if (availableProducts.length === 0) {
      console.log('❌ Keine Produkte für Marketing gefunden');
      return [];
    }
    
    // 2. Social Media Posts für jedes Produkt generieren
    const generatedPosts: GeneratedContent[] = [];
    
    for (const product of availableProducts) {
      console.log(`\n🎯 Generiere Posts für: "${product.name}"`);
      
      const posts = generateProductPosts(product);
      generatedPosts.push({
        product: product.name,
        posts: posts
      });
      
      // Posts anzeigen
      console.log('📝 LinkedIn:');
      console.log(`   ${posts.linkedin}`);
      console.log('🐦 Twitter:');
      console.log(`   ${posts.twitter}`);
      console.log('📸 Instagram:');
      console.log(`   ${posts.instagram}`);
    }
    
    // 3. Allgemeine DSGVO-Posts (ohne Produkt-Bezug)
    console.log('\n🔐 Generiere allgemeine DSGVO-Posts:');
    const generalPosts = generateGeneralPosts();
    generatedPosts.push({
      product: 'Allgemeine DSGVO-Tipps',
      posts: generalPosts
    });
    
    console.log('📝 LinkedIn (Allgemein):');
    console.log(`   ${generalPosts.linkedin}`);
    console.log('🐦 Twitter (Allgemein):');
    console.log(`   ${generalPosts.twitter}`);
    
    console.log('\n🎉 SOCIAL MEDIA CONTENT GENERIERT!');
    console.log(`✅ ${generatedPosts.length} Content-Sets erstellt`);
    
    // 4. Export für manuelle Nutzung
    console.log('\n📋 COPY-PASTE FÜR SOZIALE MEDIEN:');
    console.log('=' .repeat(50));
    
    generatedPosts.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.product}:`);
      console.log(`   LinkedIn: ${item.posts.linkedin}`);
      console.log(`   Twitter:  ${item.posts.twitter}`);
      if (item.posts.instagram) {
        console.log(`   Instagram: ${item.posts.instagram}`);
      }
    });
    
    return generatedPosts;
    
  } catch (_error) {
    console.error('❌ Fehler bei Social Media Generierung:', _error);
    return [];
  }
}

// Generiert Social Media Posts für ein spezifisches Produkt
function generateProductPosts(product: any): SocialMediaPosts {
  const tip = getRandomItem(GERMAN_DSGVO_CONTENT.tips);
  const stat = getRandomItem(GERMAN_DSGVO_CONTENT.statistics);
  
  // ✅ KORRIGIERT: HTML-Tags entfernen für saubere Texte
  const cleanDescription = (product.short_description || product.description || 'DSGVO-konforme Lösung')
    .replace(/<[^>]*>/g, '') // HTML-Tags entfernen
    .substring(0, 100) + '...';
  
  const productUrl = product.slug 
    ? `${base}/produkt/${product.slug}`
    : base;
  
  // Platzhalter ersetzen
  const linkedin = getRandomItem(GERMAN_SOCIAL_TEMPLATES.linkedin)
    .replace('{tip}', tip)
    .replace('{product}', product.name)
    .replace('{description}', cleanDescription)
    .replace('{statistic}', stat)
    .replace('{link}', productUrl);
  
  const twitter = getRandomItem(GERMAN_SOCIAL_TEMPLATES.twitter)
    .replace('{tip}', tip.substring(0, 80))
    .replace('{product}', product.name)
    .replace('{shortDescription}', cleanDescription.substring(0, 60))
    .replace('{link}', productUrl);
  
  const instagram = getRandomItem(GERMAN_SOCIAL_TEMPLATES.instagram)
    .replace('{product}', product.name)
    .replace('{description}', cleanDescription);
  
  return { linkedin, twitter, instagram };
}

// Generiert allgemeine DSGTO-Posts
function generateGeneralPosts(): SocialMediaPosts {
  const tip = getRandomItem(GERMAN_DSGVO_CONTENT.tips);
  const fact = getRandomItem(GERMAN_DSGVO_CONTENT.facts);
  
  const linkedin = `🔐 DSGVO-Wissen: ${fact}\n\n💡 Praxistipp: ${tip}\n\nMehr DSGVO-Tipps: ${base}\n\n#DSGVO #Datenschutz #Compliance`;
  
  const twitter = `💡 DSGTO-Fakt: ${fact}\n\nTipp: ${tip}\n\nMehr: ${base} #DSGVO`;
  
  return { linkedin, twitter };
}

function getRandomItem(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

// Hauptfunktion
async function main() {
  try {
    await generateSocialMediaPosts();
  } catch (_error) {
    console.error('❌ Fehler in main:', _error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { generateSocialMediaPosts };