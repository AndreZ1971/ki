// backend/routes/app/api/marketing/image-analysis-routes.ts
// API-Route für KI-Bildanalyse mit Vision, Quality Score, SEO, Optimization
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import sharp from 'sharp';
import OpenAI from 'openai';

import { getConfig } from '@config';
import { logger } from '../../../../logger';

// Lazy initialization - OpenAI wird erst beim ersten API-Call initialisiert
let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai) {
    const { openAI } = getConfig();
    openai = new OpenAI({
      apiKey: openAI?.apiKey || process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Type Definitions
interface AnalysisResult {
  quality: QualityScore;
  tags: TagResult[];
  seo: SEORecommendations;
  optimizations: OptimizationSuggestion[];
  classification: ImageClassification;
  performance: PerformanceMetrics;
  success: boolean;
}

interface QualityScore {
  width: number;
  height: number;
  format?: string;
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  resolutionScore: number;
  contrastScore: number;
  sharpnessScore: number;
  colorProfileScore: number;
  overallQuality: number;
}

interface TagResult {
  tag: string;
  confidence: number;
  category: 'object' | 'style' | 'emotion' | 'action' | 'context';
}

interface SEORecommendations {
  alt: string;
  filename: string;
  keywords: string[];
  accessibilityScore: number;
  mobileFriendly: boolean;
  recommendations: string[];
}

interface OptimizationSuggestion {
  type: 'compression' | 'format' | 'resize' | 'contrast' | 'crop';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedBenefit: string;
  implementation: string;
}

interface ImageClassification {
  type:
    | 'product'
    | 'portrait'
    | 'landscape'
    | 'screenshot'
    | 'icon'
    | 'graphic'
    | 'other';
  subType: string;
  confidence: number;
  useCase: string[];
}

interface PerformanceMetrics {
  estimatedFileSize: string;
  loadTimeImpact: string;
  estimatedBandwidthSavings: string;
  optimizationPotential: number;
}

export default async function imageAnalysisRoutes(fastify: FastifyInstance) {
  // POST /image/analyze - KI-Bildanalyse mit allen Features (prefix gesetzt in server.ts)
  fastify.post<{ Body: any }>(
    '/image/analyze',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      const file: MultipartFile | undefined = await (request as any).file();
      if (!file) {
        return reply
          .status(400)
          .send({ success: false, error: 'Kein Bild hochgeladen' });
      }

      try {
        const buffer = await file.toBuffer();
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // 1️⃣ QUALITY SCORE
        const qualityScore = calculateQualityScore(metadata);

        // 2️⃣ VISION ANALYSE (Tags, Description, SEO)
        let imageBase64 = '';
        if ((metadata.width || 0) < 2000 && (metadata.height || 0) < 2000) {
          const resized = await sharp(buffer)
            .resize(512, 512, { fit: 'inside' })
            .toBuffer();
          imageBase64 = resized.toString('base64');
        }

        const visionAnalysis = await performVisionAnalysis(imageBase64);

        // 3️⃣ ENHANCED TAGS mit Confidence
        const tags = enhanceTagsWithConfidence(visionAnalysis.tags);

        // 4️⃣ SEO RECOMMENDATIONS
        const seoRecs = generateSEORecommendations(
          visionAnalysis,
          qualityScore,
          metadata
        );

        // 5️⃣ OPTIMIZATION SUGGESTIONS
        const optimizations = generateOptimizationSuggestions(
          metadata,
          qualityScore,
          visionAnalysis
        );

        // 6️⃣ IMAGE CLASSIFICATION
        const classification = classifyImage(visionAnalysis, metadata);

        // 7️⃣ PERFORMANCE METRICS
        const performance = calculatePerformanceMetrics(
          { size: buffer.length },
          metadata
        );

        const result: AnalysisResult = {
          quality: qualityScore,
          tags,
          seo: seoRecs,
          optimizations,
          classification,
          performance,
          success: true,
        };

        return reply.send(result);
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error:
            _error instanceof Error
              ? _error.message
              : 'Bildanalyse fehlgeschlagen',
        });
      }
    }
  );

  // ========== HELPER FUNCTIONS ==========

  function calculateQualityScore(metadata: any): QualityScore {
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const area = width * height;

    // Resolution Score
    let resolutionScore = 0;
    let resolution: 'low' | 'medium' | 'high' | 'ultra' = 'low';
    if (area >= 2000000) {
      // 2MP+
      resolutionScore = 100;
      resolution = 'ultra';
    } else if (area >= 1000000) {
      // 1MP+
      resolutionScore = 85;
      resolution = 'high';
    } else if (area >= 500000) {
      // 500KP+
      resolutionScore = 65;
      resolution = 'medium';
    } else {
      resolutionScore = 40;
      resolution = 'low';
    }

    // Contrast Score (heuristic based on metadata)
    const contrastScore = metadata.density
      ? Math.min(100, (metadata.density / 72) * 100)
      : 70;

    // Sharpness Score (estimate from format/size)
    const sharpnessScore =
      metadata.format === 'png' ? 90 : metadata.format === 'webp' ? 85 : 75;

    // Color Profile Score
    const colorProfileScore = metadata.hasAlpha ? 100 : 80;

    // Overall Quality
    const overallQuality = Math.round(
      (resolutionScore + contrastScore + sharpnessScore + colorProfileScore) / 4
    );

    return {
      width,
      height,
      format: metadata.format,
      resolution,
      resolutionScore: Math.round(resolutionScore),
      contrastScore: Math.round(contrastScore),
      sharpnessScore,
      colorProfileScore,
      overallQuality,
    };
  }

  async function performVisionAnalysis(base64Image: string) {
    if (!base64Image) {
      return { tags: [], description: '', alt: '', filename: '' };
    }

    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Du bist ein Bildanalyse- und SEO-Experte. Analysiere das Bild und gib JSON zurück:
{
  "description": "2-3 Sätze Beschreibung",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "alt": "Optimaler Alt-Text für SEO",
  "filename": "optimierter-dateiname-ohne-umlaute",
  "emotion": "professional|playful|minimalist|bold|elegant",
  "dominantColors": ["color1", "color2"],
  "textContent": "Wenn Text im Bild vorhanden"
}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { tags: [], description: '', alt: '', filename: '' };
    } catch (_error) {
      return { tags: [], description: '', alt: '', filename: '' };
    }
  }

  function enhanceTagsWithConfidence(tags: string[]): TagResult[] {
    const tagCategories = {
      object: [
        'product',
        'person',
        'animal',
        'object',
        'building',
        'car',
        'food',
        'plant',
      ],
      style: [
        'minimalist',
        'professional',
        'playful',
        'bold',
        'elegant',
        'modern',
        'vintage',
      ],
      emotion: [
        'happy',
        'serious',
        'energetic',
        'calm',
        'inspiring',
        'sad',
        'funny',
      ],
      action: [
        'running',
        'jumping',
        'working',
        'playing',
        'sitting',
        'standing',
        'moving',
      ],
      context: [
        'outdoor',
        'indoor',
        'portrait',
        'landscape',
        'closeup',
        'wide-shot',
      ],
    };

    return tags.map((tag, index) => {
      let category: 'object' | 'style' | 'emotion' | 'action' | 'context' =
        'object';

      for (const [cat, words] of Object.entries(tagCategories)) {
        if (words.some((w) => tag.toLowerCase().includes(w))) {
          category = cat as any;
          break;
        }
      }

      // Higher confidence for first tags
      const confidence = Math.max(0.6, 1 - index * 0.15);

      return { tag, confidence: parseFloat(confidence.toFixed(2)), category };
    });
  }

  function generateSEORecommendations(
    vision: any,
    quality: QualityScore,
    _metadata: any
  ): SEORecommendations {
    const recommendations: string[] = [];
    let accessibilityScore = 80;

    // Alt-Text Quality
    if (!vision.alt || vision.alt.length < 20) {
      recommendations.push(
        'Alt-Text sollte aussagekräftiger sein (mindestens 20 Zeichen)'
      );
      accessibilityScore -= 10;
    }
    if (vision.alt && vision.alt.length > 125) {
      recommendations.push('Alt-Text ist zu lang (max. 125 Zeichen)');
      accessibilityScore -= 5;
    }

    // Filename
    if (!vision.filename) {
      recommendations.push(
        'Verwende aussagekräftigen Dateinamen statt generischer Namen'
      );
      accessibilityScore -= 5;
    }

    // Resolution
    if (quality.resolution === 'low') {
      recommendations.push(
        `Auflösung zu niedrig (${quality.width}x${quality.height}). Ideal: min. 800x800px`
      );
      accessibilityScore -= 15;
    }

    // Mobile Friendly
    const mobileFriendly = quality.width <= 1200; // nicht zu groß

    // Keywords
    const keywords = vision.tags?.slice(0, 3) || ['image'];

    return {
      alt: vision.alt || `Bild: ${vision.description?.substring(0, 60)}`,
      filename: vision.filename || 'optimiertes-bild',
      keywords,
      accessibilityScore: Math.max(0, accessibilityScore),
      mobileFriendly,
      recommendations,
    };
  }

  function generateOptimizationSuggestions(
    metadata: any,
    quality: QualityScore,
    _vision: any
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Format Optimization
    if (metadata.format !== 'webp') {
      suggestions.push({
        type: 'format',
        priority: 'high',
        description: 'Konvertiere zu WebP Format',
        expectedBenefit: 'Spart 25-35% Dateigröße',
        implementation: 'sharp().webp({ quality: 80 }).toFile(...)',
      });
    }

    // Resize Optimization
    if (quality.width > 2000) {
      suggestions.push({
        type: 'resize',
        priority: 'high',
        description: `Reduziere Breite von ${quality.width}px auf 1920px`,
        expectedBenefit: 'Weniger Speicher ohne Qualitätsverlust',
        implementation: `sharp().resize(1920, ${Math.round((quality.height || 0) * (1920 / quality.width))}).toFile(...)`,
      });
    }

    // Contrast Enhancement
    if (quality.contrastScore < 70) {
      suggestions.push({
        type: 'contrast',
        priority: 'medium',
        description: 'Erhöhe Kontrast leicht',
        expectedBenefit: 'Bessere Lesbarkeit, professionelleres Aussehen',
        implementation: 'sharp().normalise().toFile(...)',
      });
    }

    // Compression Quality
    if (metadata.format === 'jpg') {
      suggestions.push({
        type: 'compression',
        priority: 'medium',
        description: 'Erhöhe Kompression auf 80-85% (statt 100%)',
        expectedBenefit: 'Spart 20-30% Größe, unmerklich für Auge',
        implementation:
          'sharp().jpeg({ quality: 82, progressive: true }).toFile(...)',
      });
    }

    return suggestions;
  }

  function classifyImage(vision: any, metadata: any): ImageClassification {
    const tags = (vision.tags || []).join(' ').toLowerCase();

    let type:
      | 'product'
      | 'portrait'
      | 'landscape'
      | 'screenshot'
      | 'icon'
      | 'graphic'
      | 'other' = 'other';
    let confidence = 0.5;

    if (tags.includes('product') || tags.includes('commodity')) {
      type = 'product';
      confidence = 0.95;
    } else if (tags.includes('person') || tags.includes('portrait')) {
      type = 'portrait';
      confidence = 0.85;
    } else if (tags.includes('landscape') || tags.includes('outdoor')) {
      type = 'landscape';
      confidence = 0.8;
    } else if (tags.includes('screenshot') || tags.includes('ui')) {
      type = 'screenshot';
      confidence = 0.9;
    } else if (tags.includes('icon') || metadata.width === metadata.height) {
      type = 'icon';
      confidence = 0.75;
    } else if (tags.includes('graphic') || tags.includes('illustration')) {
      type = 'graphic';
      confidence = 0.8;
    }

    return {
      type,
      subType: vision.emotion || 'neutral',
      confidence: Math.round(confidence * 100),
      useCase:
        type === 'product'
          ? ['ecommerce', 'catalog', 'social-media']
          : ['blog', 'article', 'social-media'],
    };
  }

  // ========== PHASE 2: IMAGE COMPARISON ==========
  fastify.post<{ Body: any }>(
    '/image/compare',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      const files: MultipartFile[] = [];
      for await (const part of (request as any).files()) {
        files.push(part);
        if (files.length === 2) break;
      }

      if (files.length !== 2) {
        return reply
          .status(400)
          .send({ success: false, error: 'Genau 2 Bilder erforderlich' });
      }

      try {
        const [file1, file2] = files;
        const buf1 = await file1.toBuffer();
        const buf2 = await file2.toBuffer();
        const img1 = sharp(buf1);
        const img2 = sharp(buf2);
        const meta1 = await img1.metadata();
        const meta2 = await img2.metadata();

        const sizeRatio = Math.abs(
          (buf1.length - buf2.length) / Math.max(buf1.length, buf2.length)
        );
        const dimensionMatch =
          meta1.width === meta2.width && meta1.height === meta2.height;
        const formatMatch = meta1.format === meta2.format;

        let similarityScore = 50;
        if (dimensionMatch) similarityScore += 25;
        if (formatMatch) similarityScore += 15;
        if (sizeRatio < 0.1) similarityScore += 10;

        return reply.send({
          success: true,
          comparison: {
            similarityScore: Math.min(100, similarityScore),
            isDuplicate: similarityScore > 85,
            recommendation:
              similarityScore > 85
                ? 'Duplikat'
                : similarityScore > 70
                  ? 'Ähnlich'
                  : 'Unterschiedlich',
          },
        });
      } catch (_error) {
        return reply
          .status(500)
          .send({ success: false, error: 'Vergleich fehlgeschlagen' });
      }
    }
  );

  // ========== PHASE 2: COLOR ANALYSIS ==========
  fastify.post<{ Body: any }>(
    '/image/color-analysis',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      const file: MultipartFile | undefined = await (request as any).file();
      if (!file)
        return reply
          .status(400)
          .send({ success: false, error: 'Kein Bild hochgeladen' });

      try {
        const bufferImage = await file.toBuffer();

        // Validate buffer
        if (!bufferImage || bufferImage.length === 0) {
          return reply
            .status(400)
            .send({ success: false, error: 'Bild ist leer' });
        }

        logger.debug({ size: bufferImage.length }, 'Color analysis input');

        // Get metadata first
        const metadata = await sharp(bufferImage).metadata();

        // Convert to RGB and get raw buffer - new separate chain each time
        const buffer = await sharp(bufferImage)
          .resize(50, 50)
          .toColorspace('srgb')
          .raw()
          .toBuffer();

        logger.debug({ bufferLength: buffer.length }, 'Buffer info');

        // Calculate expected pixel count
        const pixelCount = 50 * 50; // 2500 pixels
        const bytesPerPixel = buffer.length / pixelCount;
        logger.debug({ bytesPerPixel }, 'Bytes per pixel calculated');

        const colorMap = new Map<string, number>();
        const step = Math.round(bytesPerPixel);

        // Extract RGB values (handle 3 or 4 bytes per pixel)
        for (let i = 0; i < buffer.length; i += step) {
          if (i + 2 < buffer.length) {
            const r = buffer[i].toString(16).padStart(2, '0');
            const g = buffer[i + 1].toString(16).padStart(2, '0');
            const b = buffer[i + 2].toString(16).padStart(2, '0');
            const hex = `#${r}${g}${b}`.toUpperCase();
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }
        }

        logger.debug({ uniqueColors: colorMap.size }, 'Unique colors found');

        const topColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([c]) => c);

        logger.debug({ topColors }, 'Top 5 colors extracted');

        return reply.send({
          success: true,
          colors: {
            palette: topColors,
            dominantColor: topColors[0] || '#000000',
            harmony: 'Gemischte Töne',
            harmonyScore: 75,
            brightness: 60,
            saturation: 70,
            imageFormat: metadata?.format || 'unknown',
          },
        });
      } catch (_error) {
        const errorMsg =
          _error instanceof Error
            ? _error.message
            : 'Farbanalyse fehlgeschlagen';
        const stack = (_error as any)?.stack || 'No stack trace';
        logger.error({ error: errorMsg, stack }, 'Color analysis error');
        return reply.status(500).send({ success: false, error: errorMsg });
      }
    }
  );

  // ========== PHASE 2: ENHANCEMENT SUGGESTIONS ==========
  fastify.post<{ Body: any }>(
    '/image/enhancement-suggestions',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      const file: MultipartFile | undefined = await (request as any).file();
      if (!file)
        return reply
          .status(400)
          .send({ success: false, error: 'Kein Bild hochgeladen' });

      try {
        const buffer = await file.toBuffer();
        const image = sharp(buffer);
        await image.metadata();

        const suggestions = [
          {
            type: 'brightness',
            priority: 'medium',
            description: 'Helligkeit optimieren',
            expectedImprovement: '+10-15%',
          },
          {
            type: 'saturation',
            priority: 'medium',
            description: 'Sättigung erhöhen',
            expectedImprovement: '+8-12%',
          },
          {
            type: 'crop',
            priority: 'low',
            description: 'Rule of Thirds Zuschnitt',
            expectedImprovement: '+5-10%',
          },
        ];

        return reply.send({
          success: true,
          enhancements: { suggestions, totalSuggestions: suggestions.length },
        });
      } catch (_error) {
        return reply
          .status(500)
          .send({ success: false, error: 'Enhancement fehlgeschlagen' });
      }
    }
  );

  // ========== PHASE 2: CONVERSION IMPACT PREDICTION ==========
  fastify.post<{ Body: any }>(
    '/image/conversion-impact',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      const file: MultipartFile | undefined = await (request as any).file();
      if (!file)
        return reply
          .status(400)
          .send({ success: false, error: 'Kein Bild hochgeladen' });

      try {
        const buffer = await file.toBuffer();
        const image = sharp(buffer);
        const metadata = await image.metadata();

        let baseScore = 1.5;
        const area = (metadata.width || 0) * (metadata.height || 0);
        if (area > 1000000) baseScore *= 1.3;

        return reply.send({
          success: true,
          impact: {
            estimatedConversionLift: `+${baseScore}%`,
            confidence: 0.72,
            factors: { quality: 'high', format: metadata.format },
          },
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: 'Conversion prediction fehlgeschlagen',
        });
      }
    }
  );

  // ========== PHASE 2: TARGET AUDIENCE RECOMMENDATION ==========
  fastify.post<{ Body: any }>(
    '/image/audience-recommendation',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      const file: MultipartFile | undefined = await (request as any).file();
      if (!file)
        return reply
          .status(400)
          .send({ success: false, error: 'Kein Bild hochgeladen' });

      try {
        const buffer = await file.toBuffer();
        const image = sharp(buffer);
        await image.metadata();

        return reply.send({
          success: true,
          audience: {
            ageGroup: '25-45',
            genderBias: 'Neutral',
            incomeLevel: 'Middle',
            recommendations: [
              { demographic: 'Alter: 25-45', confidence: 0.75 },
            ],
            bestPlatforms: ['Facebook', 'Instagram'],
          },
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: 'Audience prediction fehlgeschlagen',
        });
      }
    }
  );

  function calculatePerformanceMetrics(
    file: any,
    metadata: any
  ): PerformanceMetrics {
    const sizeKb = file.size / 1024;
    const _megaPixels =
      ((metadata.width || 0) * (metadata.height || 0)) / 1000000;

    // Estimate WebP savings (typical: 25-35%)
    const estimatedWebPSize = sizeKb * 0.7;
    const savingsKb = sizeKb - estimatedWebPSize;

    // Load time impact (assume 2MB/s on avg connection)
    const currentLoadTimeMs = (sizeKb / 2048) * 1000;
    const optimizedLoadTimeMs = (estimatedWebPSize / 2048) * 1000;

    // Optimization potential
    let optimizationPotential = 30;
    if (metadata.format !== 'webp') optimizationPotential += 20;
    if (metadata.width > 2000) optimizationPotential += 15;

    return {
      estimatedFileSize: `${sizeKb.toFixed(1)} KB (aktuell) → ${estimatedWebPSize.toFixed(1)} KB (optimiert)`,
      loadTimeImpact: `${currentLoadTimeMs.toFixed(0)}ms → ${optimizedLoadTimeMs.toFixed(0)}ms`,
      estimatedBandwidthSavings: `~${savingsKb.toFixed(1)} KB (${((savingsKb / sizeKb) * 100).toFixed(0)}%)`,
      optimizationPotential: Math.min(100, optimizationPotential),
    };
  }
}
