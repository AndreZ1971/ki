cat > lib/ai-email-generator.js << 'EOF'
/**
 * AI Email Generator - Business Logic
 * Generiert professionelle Marketing-E-Mails mit KI
 */

export async function generateEmail(options) {
  const {
    type = 'marketing',
    subject,
    tone = 'professional',
    targetAudience = 'customers',
    language = 'german',
    customPrompt
  } = options;

  // Simuliere KI-Verarbeitungszeit
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 800));

  // Basis-Prompt basierend auf Type
  let basePrompt = '';
  switch (type) {
    case 'marketing':
      basePrompt = `Erstelle eine professionelle Marketing-E-Mail zum Thema "${subject}". `;
      break;
    case 'newsletter':
      basePrompt = `Erstelle einen ansprechenden Newsletter für unsere Kunden. `;
      break;
    case 'promotional':
      basePrompt = `Erstelle eine verkaufsfördernde Promo-E-Mail mit speziellen Angeboten. `;
      break;
    case 'german-content':
      basePrompt = `Erstelle eine deutsche Marketing-E-Mail für den deutschsprachigen Raum. `;
      break;
  }

  // Tone anpassen
  const toneMap = {
    professional: 'Professionell und seriös',
    friendly: 'Freundlich und persönlich',
    enthusiastic: 'Begeisternd und motivierend',
    urgent: 'Dringlich und handlungsorientiert'
  };

  // Target Audience anpassen
  const audienceMap = {
    customers: 'für bestehende Kunden',
    prospects: 'für potenzielle Neukunden', 
    'german-customers': 'für deutschsprachige Kunden'
  };

  // Finalen Prompt erstellen
  const finalPrompt = customPrompt || 
    `${basePrompt}Ton: ${toneMap[tone]}. Zielgruppe: ${audienceMap[targetAudience]}. Sprache: ${language}.`;

  // Hier würde die echte KI-Integration stattfinden
  // Für jetzt: Simulierte Response
  const generatedEmail = simulateAIEmailGeneration(finalPrompt, type, tone);

  const processingTime = Date.now() - startTime;

  return {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    subject: generatedEmail.subject,
    body: generatedEmail.body,
    tone,
    language,
    targetAudience,
    type,
    wordCount: generatedEmail.body.split(/\s+/).length,
    processingTime: `${processingTime}ms`,
    prompt: finalPrompt
  };
}

function simulateAIEmailGeneration(prompt, type, tone) {
  // Simulierte KI-Antworten basierend auf Type und Tone
  const templates = {
    marketing: {
      professional: {
        subject: `Ihr exklusives Angebot: ${prompt.includes('"') ? prompt.split('"')[1] : 'Spezialaktion'}`,
        body: `Sehr geehrte Damen und Herren,

wir freuen uns, Ihnen heute ein besonderes Angebot unterbreiten zu können. 

${prompt.includes('"') ? `Basierend auf Ihrem Interesse an "${prompt.split('"')[1]}" haben wir speziell für Sie vorteilhafte Konditionen vorbereitet.` : 'Als geschätzter Kunde möchten wir Ihnen diese exklusive Gelegenheit nicht vorenthalten.'}

Nutzen Sie die Chance und profitieren Sie von diesem limitierten Angebot.

Mit freundlichen Grüßen
Ihr Team`
      },
      friendly: {
        subject: `Hallo! Etwas Besonderes für Sie: ${prompt.includes('"') ? prompt.split('"')[1] : 'Unser Angebot'}`,
        body: `Hallo liebe Kundin, hallo lieber Kunde!

wir haben da etwas ganz Besonderes für Sie – etwas, von dem wir denken, dass es perfekt zu Ihnen passt.

${prompt.includes('"') ? `Weil Sie sich für "${prompt.split('"')[1]}" interessieren, wollten wir Sie direkt informieren.` : 'Als treue Begleiter möchten wir Ihnen diese freudige Nachricht persönlich mitteilen.'}

Schauen Sie gleich mal rein – es lohnt sich!

Herzliche Grüße
Dein Team`
      }
    },
    newsletter: {
      professional: {
        subject: 'Ihr monatlicher Update & News',
        body: `Sehr geehrte Abonnentin, sehr geehrter Abonnent,

hier sind die wichtigsten Updates und Neuigkeiten des Monats für Sie:

• Neue Produkte im Sortiment
• Spezielle Aktionen nur für Newsletter-Abonnenten
• Tipps und Insights aus unserer Branche

Wir wünschen Ihnen viel Freude beim Lesen!

Beste Grüße
Ihr Newsletter-Team`
      }
    },
    promotional: {
      enthusiastic: {
        subject: '🚀 SPEZIALAKTION: Nur für kurze Zeit!',
        body: `HALLO! 😊

DIESE NACHRICHT WIRD SIE FREUEN!

Wir haben eine UNGLAUBLICHE Promotion für Sie – aber ACHTUNG: Sie ist nur für begrenzte Zeit verfügbar!

⚡ JETZT ZUGREIFEN und SPAREN!
🎁 Exklusive Vorteile nur für Sie!
⭐ Limitiertes Angebot!

Sichern Sie sich jetzt Ihren Vorteil, bevor es zu spät ist!

Voll begeisterte Grüße
Dein Promotion-Team`
      }
    }
  };

  // Fallback Template
  const defaultEmail = {
    subject: 'Ihre KI-generierte E-Mail',
    body: `Sehr geehrte Damen und Herren,

hier ist Ihre individuell generierte E-Mail, erstellt mit modernster KI-Technologie.

Mit freundlichen Grüßen
Ihr KI-Assistent`
  };

  return templates[type]?.[tone] || defaultEmail;
}
EOF