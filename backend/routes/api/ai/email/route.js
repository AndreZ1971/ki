cat > routes/api/ai/email/route.js << 'EOF'
import { generateEmail } from '../../../../lib/ai-email-generator';

export async function POST(request) {
  try {
    const { 
      action = 'generate-marketing',
      subject,
      tone = 'professional',
      targetAudience = 'customers',
      language = 'german',
      customPrompt 
    } = await request.json();

    console.log(`📧 AI Email Generator gestartet: ${action}`);

    // Validiere Input
    if (!subject && !customPrompt) {
      return Response.json({
        success: false,
        error: 'Subject oder customPrompt ist required'
      }, { status: 400 });
    }

    // Business-Logik basierend auf Action-Type
    let emailResult;
    switch (action) {
      case 'generate-marketing':
        emailResult = await generateEmail({
          type: 'marketing',
          subject,
          tone,
          targetAudience,
          language,
          customPrompt
        });
        break;

      case 'generate-newsletter':
        emailResult = await generateEmail({
          type: 'newsletter', 
          subject: subject || 'Ihr monatlicher Update',
          tone,
          targetAudience,
          language,
          customPrompt
        });
        break;

      case 'generate-promotional':
        emailResult = await generateEmail({
          type: 'promotional',
          subject: subject || 'Spezialangebot für Sie!',
          tone: 'enthusiastic',
          targetAudience,
          language,
          customPrompt
        });
        break;

      case 'generate-german':
        emailResult = await generateEmail({
          type: 'german-content',
          subject,
          tone,
          targetAudience: 'german-customers',
          language: 'german',
          customPrompt
        });
        break;

      default:
        return Response.json({
          success: false,
          error: `Unbekannte Action: ${action}`
        }, { status: 400 });
    }

    // Erfolgs-Response
    return Response.json({
      success: true,
      message: `AI Email (${action}) erfolgreich generiert`,
      data: {
        emailId: emailResult.id,
        subject: emailResult.subject,
        body: emailResult.body,
        tone: emailResult.tone,
        language: emailResult.language,
        wordCount: emailResult.wordCount,
        generatedAt: new Date().toISOString()
      },
      metadata: {
        action,
        targetAudience,
        processingTime: emailResult.processingTime || '1.2s'
      }
    });

  } catch (error) {
    console.error('❌ AI Email Generator Fehler:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Unbekannter Fehler beim Email-Generieren',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// OPTIONAL: GET für Status/Info
export async function GET(request) {
  return Response.json({
    service: 'AI Email Generator',
    version: '1.0',
    status: 'active',
    features: [
      'generate-marketing',
      'generate-newsletter', 
      'generate-promotional',
      'generate-german'
    ],
    supportedLanguages: ['german', 'english'],
    rateLimit: '100 requests/hour'
  });
}
EOF