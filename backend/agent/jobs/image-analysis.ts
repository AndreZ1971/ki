// backend/agent/jobs/image-analysis.ts
// KI-gestützte Bildanalyse, Tagging, Qualitätsprüfung, Bild-SEO
// Entfernt: fs, path (ungenuzt)
import sharp from 'sharp'; // Stelle sicher, dass sharp installiert ist
import OpenAI from 'openai';

// Konfiguration für OpenAI (API-Key aus ENV)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analysiert ein Bild und gibt Bewertung, Tags, Qualitätsmerkmale und SEO-Vorschläge zurück.
 * @param imagePath Pfad zum Bild
 */
export async function analyzeImage(imagePath: string) {
  // 1. Bild laden und Metadaten auslesen
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // 2. Qualitätsprüfung (Auflösung, Format, Schärfe)
  const quality = {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    hasAlpha: metadata.hasAlpha,
    // Schärfe-Analyse (optional, einfaches Beispiel)
    isLargeEnough: (metadata.width || 0) >= 800 && (metadata.height || 0) >= 800,
  };

  // 3. Bild als base64 für KI-Analyse (nur kleine Bilder, sonst skip)
  let base64Image = '';
  if ((metadata.width || 0) < 2000 && (metadata.height || 0) < 2000) {
    const buffer = await image.resize(512, 512, { fit: 'inside' }).toBuffer();
    base64Image = buffer.toString('base64');
  }

  // 4. KI-gestütztes Tagging & SEO (OpenAI Vision)
  let tags: string[] = [];
  let seo: { alt: string; filename: string } = { alt: '', filename: '' };
  let description = '';
  if (base64Image) {
    const prompt = `Du bist ein Bildanalyse- und SEO-Experte. Analysiere das Bild (base64, PNG) und gib zurück:
- Eine kurze Beschreibung
- 5 relevante Tags (Komma getrennt)
- Einen optimalen Alt-Text für SEO
- Einen Dateinamen-Vorschlag für SEO

Antworte im JSON-Format: { "description": "...", "tags": ["..."], "alt": "...", "filename": "..." }`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: base64Image }
      ],
      max_tokens: 400,
    });
    try {
      const json = JSON.parse(response.choices[0].message?.content || '{}');
      tags = json.tags || [];
      seo = { alt: json.alt || '', filename: json.filename || '' };
      description = json.description || '';
    } catch {
      // Fallback: Text extrahieren
      description = response.choices[0].message?.content || '';
    }
  }

  return {
    quality,
    tags,
    seo,
    description,
    metadata,
  };
}

// Beispiel-Aufruf (nur zu Testzwecken)
// analyzeImage('pfad/zum/bild.jpg').then(console.log).catch(console.error);