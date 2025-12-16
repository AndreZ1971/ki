import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

// ✅ NEU (richtig - lazy Initialisierung)
let openai: OpenAI | null = null;

function initializeOpenAI() {
  if (openai !== null) return openai;
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
      console.warn('⚠️ OpenAI API Key nicht konfiguriert');
      openai = null;
    } else {
      openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI Client erfolgreich initialisiert');
    }
  } catch (_error) {
    console.error('❌ Fehler bei OpenAI Initialisierung:', _error);
    openai = null;
  }
  
  return openai;
}

export default async function aiEmailRoutes(server: FastifyInstance) {
  
  // 📧 Email-Vorlage generieren
  server.post('/email-draft', {
    schema: {
      tags: ['ai'],
      summary: 'Generate professional email templates',
      description: 'AI-powered email template generation for digital products and customer service',
      body: {
        type: 'object',
        required: ['emailType', 'context'],
        properties: {
          emailType: { 
            type: 'string', 
            enum: [
              'order-confirmation',
              'download-ready',
              'support-response',
              'welcome-email',
              'newsletter',
              'abandoned-cart',
              'review-request',
              'customer-feedback',
              'account-update',
              'digital-delivery'
            ]
          },
          context: { type: 'object' },
          tone: { 
            type: 'string', 
            enum: ['professional', 'friendly', 'formal', 'enthusiastic'],
            default: 'professional'
          },
          language: { type: 'string', default: 'de' },
          customerName: { type: 'string' },
          brandVoice: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            subject: { type: 'string' },
            body: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'string' } },
            personalizationTips: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { 
      emailType, 
      context, 
      tone = 'professional', 
      language = 'de',
      customerName,
      brandVoice 
    } = request.body;

    const openAIClient = initializeOpenAI();
    if (!openAIClient) {
      // 🔥 FALLBACK: Verwende vordefinierte Templates statt OpenAI
      const fallbackTemplates: Record<string, any> = {
        'welcome-email': {
          subject: `Herzlich Willkommen ${customerName ? customerName : ''}!`,
          body: `Hallo ${customerName ? customerName : ''},\n\nschön, dass Sie bei uns sind! Wir freuen uns, Sie als neuen Kunden begrüßen zu dürfen.\n\n${context.productName ? `Ihr digitales Produkt "${context.productName}" steht für Sie bereit. Sie erhalten in Kürze eine separate Email mit dem Download-Link.` : 'Ihre digitalen Produkte stehen für Sie bereit.'}\n\nBei Fragen stehen wir Ihnen jederzeit zur Verfügung.\n\nMit freundlichen Grüßen\nIhr Team`,
          keyPoints: ['Persönliche Begrüßung', 'Hinweis auf digitale Verfügbarkeit', 'Support-Angebot'],
          personalizationTips: ['Name verwenden', 'Produktnamen erwähnen']
        },
        'order-confirmation': {
          subject: 'Bestellbestätigung - Ihre digitalen Produkte',
          body: `Hallo ${customerName ? customerName : ''},\n\nvielen Dank für Ihre Bestellung!\n\n${context.productName ? `Produkt: ${context.productName}\n` : ''}Ihre digitalen Produkte werden in Kürze per Email zugestellt.\n\nBestelldetails:\n- Sofortiger digitaler Zugang\n- Keine Versandkosten\n- Lebenslanger Download-Zugriff\n\nBei Fragen kontaktieren Sie uns gerne.\n\nMit freundlichen Grüßen`,
          keyPoints: ['Bestellung bestätigen', 'Digitaler Zugang hervorheben', 'Support bereitstellen'],
          personalizationTips: ['Bestellnummer einfügen', 'Produktliste aufführen']
        },
        'download-ready': {
          subject: '🎉 Ihr Download ist bereit!',
          body: `Hallo ${customerName ? customerName : ''},\n\n${context.productName ? `Ihr digitales Produkt "${context.productName}" steht jetzt zum Download bereit!\n\n` : 'Ihre digitalen Produkte stehen zum Download bereit!\n\n'}So geht's weiter:\n1. Klicken Sie auf den Download-Link in dieser Email\n2. Speichern Sie die Datei auf Ihrem Gerät\n3. Starten Sie direkt mit der Nutzung\n\nDer Download-Link ist dauerhaft verfügbar - Sie können jederzeit erneut herunterladen.\n\nViel Erfolg damit!\nIhr Team`,
          keyPoints: ['Download-Verfügbarkeit', 'Einfache Anleitung', 'Dauerhafter Zugriff'],
          personalizationTips: ['Download-Link prominent platzieren', 'Systemanforderungen erwähnen']
        },
        'support-response': {
          subject: 'Re: Ihre Anfrage - Wir sind für Sie da',
          body: `Hallo ${customerName ? customerName : ''},\n\nvielen Dank für Ihre Nachricht.\n\nWir haben Ihre Anfrage erhalten und kümmern uns umgehend darum. ${context.productName ? `Bezüglich "${context.productName}": ` : ''}Unser Support-Team wird sich innerhalb von 24 Stunden bei Ihnen melden.\n\nIn der Zwischenzeit können Sie auch unsere FAQ-Seite besuchen.\n\nMit freundlichen Grüßen\nIhr Support-Team`,
          keyPoints: ['Anfrage bestätigen', 'Bearbeitungszeit kommunizieren', 'Selbsthilfe anbieten'],
          personalizationTips: ['Ticket-Nummer angeben', 'Spezifisches Problem erwähnen']
        },
        'newsletter': {
          subject: '📰 Neue digitale Produkte & Updates',
          body: `Hallo ${customerName ? customerName : ''},\n\nentdecken Sie unsere neuesten digitalen Produkte!\n\n${context.productName ? `🆕 NEU: ${context.productName}\n` : ''}Diese Woche im Fokus:\n• Sofortiger Download-Zugriff\n• Exklusive Angebote für Bestandskunden\n• Neue Features und Updates\n\nVerpassen Sie nicht unsere aktuellen Highlights.\n\nBis bald!`,
          keyPoints: ['Neue Produkte vorstellen', 'Mehrwert bieten', 'Call-to-Action'],
          personalizationTips: ['Kaufhistorie berücksichtigen', 'Relevante Kategorien betonen']
        },
        'abandoned-cart': {
          subject: '🛒 Ihr Warenkorb wartet auf Sie',
          body: `Hallo ${customerName ? customerName : ''},\n\nwir haben bemerkt, dass Sie ${context.productName ? `"${context.productName}"` : 'Produkte'} in Ihrem Warenkorb haben.\n\n✨ Ihre Vorteile:\n• Sofortiger Download nach Zahlung\n• Keine Versandkosten\n• Lebenslanger Zugriff\n\nSchließen Sie Ihre Bestellung jetzt ab und starten Sie in wenigen Minuten!\n\nIhr Team`,
          keyPoints: ['Warenkorb erinnern', 'Vorteile betonen', 'Dringlichkeit erzeugen'],
          personalizationTips: ['Produktbilder zeigen', 'Zeitlimitiertes Angebot']
        },
        'review-request': {
          subject: '⭐ Wie gefällt Ihnen Ihr digitales Produkt?',
          body: `Hallo ${customerName ? customerName : ''},\n\nwir hoffen, Sie sind zufrieden mit ${context.productName ? `"${context.productName}"` : 'Ihrem Kauf'}!\n\nIhre Meinung ist uns wichtig. Würden Sie uns mit einer kurzen Bewertung helfen?\n\n👍 Bewertung abgeben (dauert nur 1 Minute)\n\nAls Dankeschön erhalten Sie 10% Rabatt auf Ihren nächsten Kauf.\n\nVielen Dank!\nIhr Team`,
          keyPoints: ['Bewertung anfragen', 'Anreiz bieten', 'Einfacher Prozess'],
          personalizationTips: ['Kaufdatum erwähnen', 'Spezifische Produktfragen']
        },
        'product-update': {
          subject: '🆕 Update verfügbar für Ihr digitales Produkt',
          body: `Hallo ${customerName ? customerName : ''},\n\ngute Neuigkeiten! ${context.productName ? `"${context.productName}" wurde aktualisiert` : 'Es gibt ein Update'}.\n\n✨ Neu in dieser Version:\n• Verbesserte Features\n• Bug-Fixes\n• Optimierte Performance\n\nLaden Sie die neueste Version jetzt herunter - kostenlos für Bestandskunden!\n\nViel Spaß mit den neuen Features!`,
          keyPoints: ['Update ankündigen', 'Verbesserungen auflisten', 'Kostenloser Download'],
          personalizationTips: ['Versionsnummer angeben', 'Changelog verlinken']
        },
        'special-offer': {
          subject: '🎁 Exklusives Angebot nur für Sie!',
          body: `Hallo ${customerName ? customerName : ''},\n\nals geschätzter Kunde erhalten Sie exklusiven Zugang zu unserem Sonderangebot!\n\n${context.productName ? `🔥 ${context.productName} - Jetzt 25% günstiger\n` : ''}• Sofortiger Download\n• Zeitlich limitiert\n• Nur für Bestandskunden\n\nSichern Sie sich jetzt Ihr digitales Produkt zum Sonderpreis!\n\nAngebot gültig bis: [Datum]\n\nIhr Team`,
          keyPoints: ['Exklusivität betonen', 'Zeitlimit setzen', 'Klarer Call-to-Action'],
          personalizationTips: ['Kundenhistorie einbeziehen', 'Countdown anzeigen']
        }
      };

      const template = fallbackTemplates[emailType] || fallbackTemplates['welcome-email'];
      return {
        success: true,
        ...template
      };
    }

    try {
      const toneMap: Record<string, string> = {
        professional: "professionell und sachlich",
        friendly: "freundlich und zuvorkommend", 
        formal: "formell und distanziert",
        enthusiastic: "begeistert und energisch"
      };

      const emailTypeMap: Record<string, string> = {
        'order-confirmation': 'Bestellbestätigung für digitale Produkte',
        'download-ready': 'Download bereit - Ihr digitales Produkt',
        'support-response': 'Kundensupport-Antwort',
        'welcome-email': 'Willkommens-Email für neuen Kunden',
        'newsletter': 'Newsletter mit digitalen Angeboten',
        'abandoned-cart': 'Warenkorb-Erinnerung für digitale Produkte',
        'review-request': 'Bewertungsanfrage für digitale Produkte',
        'customer-feedback': 'Kundenfeedback-Anfrage',
        'account-update': 'Konto-Update Benachrichtigung',
        'digital-delivery': 'Digitale Lieferung Bestätigung'
      };

      const prompt = `
Erstelle eine Email-Vorlage für: ${emailTypeMap[emailType] || emailType}

KONTEXT:
${JSON.stringify(context, null, 2)}
${customerName ? `KUNDENNAME: ${customerName}` : ''}
${brandVoice ? `MARKENSTIMME: ${brandVoice}` : ''}

WICHTIG: Alle Produkte sind digitale Downloads - KEIN physischer Versand!
Konzentriere dich auf: Sofortiger Zugang, Download-Links, digitale Nutzung, keine Versandkosten.

TON: ${toneMap[tone] || toneMap.professional}
SPRACHE: ${language}

Erstelle:
1. Einen ansprechenden Betreff (Subject) für digitale Produkte
2. Den Email-Text (Body) mit Fokus auf sofortige Verfügbarkeit
3. 3-5 Kernpunkte die in der Email enthalten sein sollten
4. 2-3 Personalisierungs-Tipps für diese Email

Verwende NEUTRALE Formulierungen ohne Carrier-Namen.
Fokus auf: "Download", "sofort verfügbar", "digitaler Zugang", "kein Versand".

Antworte im JSON Format:
{
  "subject": "Ihr Betreff hier",
  "body": "Kompletter Email-Text hier...",
  "keyPoints": ["Punkt 1", "Punkt 2", "Punkt 3"],
  "personalizationTips": ["Tipp 1", "Tipp 2"]
}
`;

      const completion = await openAIClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein professioneller Email-Marketing Experte für DIGITALE PRODUKTE. 
                      Erstelle überzeugende Email-Vorlagen für digitale Downloads und Services. 
                      KEINE Versand- oder Lieferinformationen - alles ist sofort digital verfügbar.
                      Sprache: ${language}`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        try {
          const emailTemplate = JSON.parse(aiResponse);
          return {
            success: true,
            ...emailTemplate
          };
        } catch (__parseError) {
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('Email generation error:', error);
      return {
        success: false,
        subject: '',
        body: 'Email generation failed',
        keyPoints: [],
        personalizationTips: [],
        error: error.message
      };
    }
  });

  // 💬 Chat Response Generator
  server.post('/chat-response', {
    schema: {
      tags: ['ai'],
      summary: 'Generate professional chat responses',
      description: 'AI-powered chat response generation for customer service inquiries',
      body: {
        type: 'object',
        required: ['message', 'context'],
        properties: {
          message: { type: 'string' },
          context: { type: 'object' },
          tone: { 
            type: 'string', 
            enum: ['professional', 'friendly', 'empathetic', 'solution-oriented'],
            default: 'friendly'
          },
          language: { type: 'string', default: 'de' },
          customerName: { type: 'string' },
          responseLength: { 
            type: 'string', 
            enum: ['short', 'medium', 'detailed'],
            default: 'medium'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            response: { type: 'string' },
            suggestedFollowUp: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { 
      message, 
      context, 
      tone = 'friendly', 
      language = 'de',
      customerName,
      responseLength = 'medium'
    } = request.body;

    const openAIClient = initializeOpenAI();
    if (!openAIClient) {
      return {
        success: false,
        response: 'AI service not available',
        suggestedFollowUp: '',
        keyPoints: [],
        error: 'OpenAI not configured'
      };
    }

    try {
      const toneMap: Record<string, string> = {
        professional: "professionell und kompetent",
        friendly: "freundlich und hilfsbereit", 
        empathetic: "einfühlsam und verständnisvoll",
        'solution-oriented': "lösungsorientiert und pragmatisch"
      };

      const lengthMap: Record<string, string> = {
        short: "1-2 Sätze, prägnant",
        medium: "3-5 Sätze, ausführlich aber präzise", 
        detailed: "detaillierte Erklärung mit allen Informationen"
      };

      const prompt = `
KUNDENANFRAGE: "${message}"

KONTEXT:
${JSON.stringify(context, null, 2)}
${customerName ? `KUNDENNAME: ${customerName}` : ''}

Erstelle eine Chat-Antwort für den Kundensupport:
- TON: ${toneMap[tone]}
- LÄNGE: ${lengthMap[responseLength]}
- SPRACHE: ${language}

WICHTIG: Alle Produkte sind digitale Downloads - KEIN physischer Versand!
Fokus auf: Sofortiger Zugang, Download-Probleme, Account-Support, digitale Produkte.

Antworte im JSON Format:
{
  "response": "Deine vollständige Chat-Antwort hier...",
  "suggestedFollowUp": "Vorschlag für nächste Frage oder Aktion",
  "keyPoints": ["Wichtiger Punkt 1", "Wichtiger Punkt 2"]
}
`;

      const completion = await openAIClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein erfahrener Kundensupport-Mitarbeiter für einen Shop mit DIGITALEN PRODUKTEN.
                      Deine Antworten sind hilfreich, präzise und kundenorientiert.
                      KEINE Versand-Themen - alles ist digital und sofort verfügbar.
                      Sprache: ${language}`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        try {
          const chatResponse = JSON.parse(aiResponse);
          return {
            success: true,
            ...chatResponse
          };
        } catch (__parseError) {
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('Chat response generation error:', error);
      return {
        success: false,
        response: 'Chat response generation failed',
        suggestedFollowUp: '',
        keyPoints: [],
        error: error.message
      };
    }
  });

  // 📱 Social Media Content
  server.post('/social-media', {
    schema: {
      tags: ['ai'],
      summary: 'Generate engaging social media content',
      description: 'AI-powered social media post generation for various platforms',
      body: {
        type: 'object',
        required: ['platform', 'topic'],
        properties: {
          platform: { 
            type: 'string', 
            enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'],
            default: 'instagram'
          },
          topic: { type: 'string' },
          tone: { 
            type: 'string', 
            enum: ['professional', 'casual', 'enthusiastic', 'humorous', 'inspirational'],
            default: 'casual'
          },
          language: { type: 'string', default: 'de' },
          targetAudience: { type: 'string' },
          callToAction: { type: 'string' },
          hashtags: { type: 'boolean', default: true }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            post: { type: 'string' },
            caption: { type: 'string' },
            hashtags: { type: 'array', items: { type: 'string' } },
            engagementTips: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { 
      platform, 
      topic, 
      tone = 'casual', 
      language = 'de',
      targetAudience,
      callToAction,
      hashtags = true
    } = request.body;

    const openAIClient = initializeOpenAI();
    if (!openAIClient) {
      return {
        success: false,
        post: '',
        caption: 'AI service not available',
        hashtags: [],
        engagementTips: [],
        error: 'OpenAI not configured'
      };
    }

    try {
      const platformMap: Record<string, string> = {
        instagram: "Instagram Post (visuell, emotional, mit Hashtags)",
        facebook: "Facebook Beitrag (informativ, teilbar, community-orientiert)",
        twitter: "Twitter Tweet (prägnant, aktuell, mit Trends)",
        linkedin: "LinkedIn Post (professionell, wertvoll, network-orientiert)",
        tiktok: "TikTok Content (unterhaltsam, trendig, authentisch)"
      };

      const toneMap: Record<string, string> = {
        professional: "professionell und seriös",
        casual: "locker und ungezwungen", 
        enthusiastic: "begeisternd und energisch",
        humorous: "humorvoll und unterhaltsam",
        inspirational: "inspirierend und motivierend"
      };

      const prompt = `
Erstelle Social Media Content für:
- PLATTFORM: ${platformMap[platform]}
- THEMA: ${topic}
- TON: ${toneMap[tone]}
- SPRACHE: ${language}
${targetAudience ? `- ZIELGRUPPE: ${targetAudience}` : ''}
${callToAction ? `- CALL-TO-ACTION: ${callToAction}` : ''}
${hashtags ? '- MIT relevanten Hashtags' : '- OHNE Hashtags'}

WICHTIG: Der Shop verkauft ausschließlich DIGITALE PRODUKTE (Downloads, Software, etc.)
Fokus auf: Sofortiger Zugang, digitale Lösungen, keine physischen Produkte.

Erstelle:
1. Den Haupt-Text des Posts
2. Einen ansprechenden Caption/Untertitel
3. 5-8 relevante Hashtags (wenn gewünscht)
4. 2-3 Tipps zur Engagement-Steigerung

Antworte im JSON Format:
{
  "post": "Haupt-Text des Social Media Posts",
  "caption": "Ergänzender Caption oder Untertitel",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "engagementTips": ["Tipp 1", "Tipp 2"]
}
`;

      const completion = await openAIClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein Social Media Experte mit Spezialisierung auf DIGITALE PRODUKTE.
                      Erstelle ansprechende, platform-optimierte Content.
                      Fokus auf digitale Downloads, Software, und sofort verfügbare Produkte.
                      Sprache: ${language}`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        try {
          const socialContent = JSON.parse(aiResponse);
          return {
            success: true,
            ...socialContent
          };
        } catch (__parseError) {
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('Social media generation error:', error);
      return {
        success: false,
        post: '',
        caption: 'Social media generation failed',
        hashtags: [],
        engagementTips: [],
        error: error.message
      };
    }
  });

  // 🆕 PRODUCT DESCRIPTIONS
  server.post('/product-descriptions', {
    schema: {
      tags: ['ai'],
      summary: 'Generate compelling product descriptions',
      description: 'AI-powered product description generation for digital products',
      body: {
        type: 'object',
        required: ['productName', 'productType'],
        properties: {
          productName: { type: 'string' },
          productType: { type: 'string' },
          keyFeatures: { type: 'array', items: { type: 'string' } },
          targetAudience: { type: 'string' },
          tone: { 
            type: 'string', 
            enum: ['professional', 'enthusiastic', 'benefit-focused', 'simple'],
            default: 'benefit-focused'
          },
          language: { type: 'string', default: 'de' },
          length: { 
            type: 'string', 
            enum: ['short', 'medium', 'detailed'],
            default: 'medium'
          },
          seoKeywords: { type: 'array', items: { type: 'string' } }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            title: { type: 'string' },
            description: { type: 'string' },
            shortDescription: { type: 'string' },
            keyBenefits: { type: 'array', items: { type: 'string' } },
            seoOptimization: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { 
      productName, 
      productType, 
      keyFeatures = [], 
      targetAudience,
      tone = 'benefit-focused',
      language = 'de',
      length = 'medium',
      seoKeywords = []
    } = request.body;

    const openAIClient = initializeOpenAI();
    if (!openAIClient) {
      return {
        success: false,
        title: '',
        description: 'AI service not available',
        shortDescription: '',
        keyBenefits: [],
        seoOptimization: [],
        error: 'OpenAI not configured'
      };
    }

    try {
      const toneMap: Record<string, string> = {
        professional: "professionell und faktenbasiert",
        enthusiastic: "begeisternd und emotional", 
        'benefit-focused': "nutzenorientiert und kundenfokussiert",
        simple: "einfach und verständlich"
      };

      const lengthMap: Record<string, string> = {
        short: "kurz und prägnant (50-100 Wörter)",
        medium: "ausführlich aber fokussiert (150-250 Wörter)", 
        detailed: "detailliert und umfassend (300-400 Wörter)"
      };

      const prompt = `
Erstelle eine Produktbeschreibung für:
- PRODUKTNAME: ${productName}
- PRODUKTTYP: ${productType} (DIGITALES PRODUKT)
- TON: ${toneMap[tone]}
- LÄNGE: ${lengthMap[length]}
- SPRACHE: ${language}
${targetAudience ? `- ZIELGRUPPE: ${targetAudience}` : ''}
${keyFeatures.length > 0 ? `- HAUTFUNKTIONEN: ${keyFeatures.join(', ')}` : ''}
${seoKeywords.length > 0 ? `- SEO-KEYWORDS: ${seoKeywords.join(', ')}` : ''}

WICHTIG: Es handelt sich um ein DIGITALES PRODUKT - sofort nach Kauf verfügbar!
Kein Versand, keine Lieferzeit - sofortiger Download.

Erstelle:
1. Einen ansprechenden Produkttitel
2. Die Haupt-Beschreibung in gewünschter Länge
3. Eine kurze Zusammenfassung (1-2 Sätze)
4. 3-5 Hauptvorteile für den Kunden
5. SEO-Optimierungstipps

Antworte im JSON Format:
{
  "title": "Ansprechender Produkttitel",
  "description": "Vollständige Produktbeschreibung",
  "shortDescription": "Kurze Zusammenfassung",
  "keyBenefits": ["Vorteil 1", "Vorteil 2", "Vorteil 3"],
  "seoOptimization": ["SEO Tipp 1", "SEO Tipp 2"]
}
`;

      const completion = await openAIClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein erfahrener E-Commerce Copywriter für DIGITALE PRODUKTE.
                      Erstelle überzeugende, verkaufsorientierte Produktbeschreibungen.
                      Fokus auf sofortige Verfügbarkeit, digitale Nutzung und Kundennutzen.
                      KEINE physischen Produkte - alles ist Download-basiert.
                      Sprache: ${language}`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        try {
          const productDescription = JSON.parse(aiResponse);
          return {
            success: true,
            ...productDescription
          };
        } catch (__parseError) {
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('Product description generation error:', error);
      return {
        success: false,
        title: '',
        description: 'Product description generation failed',
        shortDescription: '',
        keyBenefits: [],
        seoOptimization: [],
        error: error.message
      };
    }
  });

  // 🆕 SEO CONTENT
  server.post('/seo-content', {
    schema: {
      tags: ['ai'],
      summary: 'Generate SEO-optimized content',
      description: 'AI-powered SEO content generation for blogs and websites',
      body: {
        type: 'object',
        required: ['topic', 'keywords'],
        properties: {
          topic: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          contentType: { 
            type: 'string', 
            enum: ['blog-post', 'landing-page', 'meta-description', 'faq'],
            default: 'blog-post'
          },
          targetAudience: { type: 'string' },
          language: { type: 'string', default: 'de' },
          wordCount: { type: 'number', default: 500 },
          focusKeyword: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            title: { type: 'string' },
            content: { type: 'string' },
            metaDescription: { type: 'string' },
            seoScore: { type: 'number' },
            improvementTips: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { 
      topic, 
      keywords, 
      contentType = 'blog-post',
      targetAudience,
      language = 'de',
      wordCount = 500,
      focusKeyword
    } = request.body;

    const openAIClient = initializeOpenAI();
    if (!openAIClient) {
      return {
        success: false,
        title: '',
        content: 'AI service not available',
        metaDescription: '',
        seoScore: 0,
        improvementTips: [],
        error: 'OpenAI not configured'
      };
    }

    try {
      const contentTypeMap: Record<string, string> = {
        'blog-post': "Blog-Beitrag (informativ, wertvoll, teilbar)",
        'landing-page': "Landingpage-Text (verkaufsorientiert, konvertierend)",
        'meta-description': "Meta-Beschreibung (prägnant, klickanregend)",
        'faq': "FAQ-Bereich (hilfreich, problemlösend)"
      };

      const prompt = `
Erstelle SEO-optimierten Content für:
- CONTENT-TYP: ${contentTypeMap[contentType]}
- THEMA: ${topic}
- KEYWORDS: ${keywords.join(', ')}
- SPRACHE: ${language}
- WORTRANZAHL: ${wordCount}
${targetAudience ? `- ZIELGRUPPE: ${targetAudience}` : ''}
${focusKeyword ? `- FOCUS-KEYWORD: ${focusKeyword}` : ''}

WICHTIG: Der Content sollte sich auf DIGITALE PRODUKTE beziehen.
Fokus auf: Sofortiger Zugang, digitale Lösungen, Download-basierte Angebote.

Erstelle:
1. Einen SEO-optimierten Titel
2. Den Haupt-Content in gewünschter Länge
3. Eine Meta-Beschreibung
4. Einen SEO-Score (1-100) mit Begründung
5. 3-5 Verbesserungstipps

Antworte im JSON Format:
{
  "title": "SEO-optimierter Titel",
  "content": "Vollständiger Content-Text",
  "metaDescription": "Meta-Beschreibung für SEO",
  "seoScore": 85,
  "improvementTips": ["Tipp 1", "Tipp 2", "Tipp 3"]
}
`;

      const completion = await openAIClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein SEO-Experte und Content-Spezialist für DIGITALE PRODUKTE.
                      Erstelle suchmaschinenoptimierte, wertvolle Inhalte.
                      Fokus auf digitale Downloads, Software und sofortige Verfügbarkeit.
                      Sprache: ${language}`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        try {
          const seoContent = JSON.parse(aiResponse);
          return {
            success: true,
            ...seoContent
          };
        } catch (__parseError) {
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('SEO content generation error:', error);
      return {
        success: false,
        title: '',
        content: 'SEO content generation failed',
        metaDescription: '',
        seoScore: 0,
        improvementTips: [],
        error: error.message
      };
    }
  });
}