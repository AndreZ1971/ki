/**
 * Trend Aggregator API Routes
 * Multi-source trend analysis endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import { trendAggregator } from '../../../../services/trendAggregatorService';
import { logger } from '../../../../logger';

export const trendAggregatorRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * POST /api/trends/ai-report
     * KI-basierte Zusammenfassung und Interpretation der Trenddaten
     */
    fastify.post<{
      Body: { keywords: string[]; sources?: string[] };
    }>('/ai-report', {
      schema: {
        description: 'KI-gestützte Trend-Auswertung und Report mit OpenAI',
        tags: ['Trends', 'AI'],
        body: {
          type: 'object',
          required: ['keywords'],
          properties: {
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array von Keywords für die Trendanalyse'
            },
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optionale Quellen für die Analyse'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              report: { type: 'string' },
              summary: { type: 'object' },
              raw: { type: 'array' }
            }
          }
        }
      },
      async handler(_request, _reply) {
        try {
          const { keywords, sources } = _request.body;
          if (!keywords || keywords.length === 0) {
            _reply.code(400);
            return { error: 'Keywords array is required' };
          }
          const results = await trendAggregator.batchAnalyze(keywords);
          // Prompt für OpenAI generieren
          const prompt = `Erstelle eine verständliche, datenbasierte Zusammenfassung und KI-Interpretation der folgenden Trenddaten. Gib Empfehlungen, Insights und erkennbare Muster. Daten:
  ${JSON.stringify(results, null, 2)}`;
          // OpenAI-Client holen
          const { getOpenAIClient, executeOpenAI } = await import('../../../../utils/openai.js');
          const openai = getOpenAIClient();
          // GPT-4o-Completion holen
          const completion = await executeOpenAI(
            () => openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: 'Du bist ein datengetriebener Trend-Analyst.' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 800,
              temperature: 0.7
            }),
            'trend-ai-report',
            { keywords, sources }
          );
          const report = completion.choices?.[0]?.message?.content || '';
          return {
            report,
            summary: {
              total: results.length,
              topTrend: results[0]?.keyword || '',
              avgScore: results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
            },
            raw: results
          };
        } catch (error) {
          logger.error({ error }, 'AI Trend Report failed');
          _reply.code(500);
          return { error: 'AI Trend Report failed' };
        }
      }
    });
  
  /**
   * GET /api/trends/sources
   * List all available trend sources
   */
  fastify.get('/sources', {
    schema: {
      description: 'Get all available trend data sources',
      tags: ['Trends'],
      response: {
        200: {
          type: 'object',
          properties: {
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  available: { type: 'boolean' },
                  requiresAuth: { type: 'boolean' }
                }
              }
            },
            total: { type: 'number' },
            available: { type: 'number' }
          }
        }
      }
    }
    }, async (_request, _reply) => {
    try {
      const sources = trendAggregator.getAvailableSources();
      
      return {
        sources,
        total: sources.length,
        available: sources.filter(s => s.available).length
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get trend sources');
      throw error;
    }
  });

  /**
   * GET /api/trends/analyze/:keyword
   * Analyze trends for a single keyword from all sources
   */
  fastify.get<{
    Params: { keyword: string };
    Querystring: { sources?: string };
  }>('/analyze/:keyword', {
    schema: {
      description: 'Analyze trends for a keyword across multiple sources',
      tags: ['Trends'],
      params: {
        type: 'object',
        required: ['keyword'],
        properties: {
          keyword: { type: 'string', description: 'Keyword to analyze' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          sources: { 
            type: 'string', 
            description: 'Comma-separated list of sources (googleTrends,youtube,wikipedia,etc.)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            keyword: { type: 'string' },
            overallScore: { type: 'number' },
            confidence: { type: 'number' },
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  keyword: { type: 'string' },
                  score: { type: 'number' },
                  timestamp: { type: 'string' },
                  metadata: { type: 'object' }
                }
              }
            }
          }
        }
      }
    }
    }, async (_request, _reply) => {
    try {
      const { keyword } = _request.params;
      const sources = _request.query.sources?.split(',');

      logger.info({ keyword, sources }, 'Analyzing trends');

      const result = await trendAggregator.aggregateTrends(keyword, sources);

      return result;
    } catch (error) {
      logger.error({ error, keyword: _request.params.keyword }, 'Trend analysis failed');
      _reply.code(500);
      return { error: 'Trend analysis failed' };
    }
  });

  /**
   * POST /api/trends/batch
   * Batch analyze multiple keywords
   */
  fastify.post<{
    Body: { keywords: string[]; sources?: string[] };
  }>('/batch', {
    schema: {
      description: 'Batch analyze multiple keywords',
      tags: ['Trends'],
      body: {
        type: 'object',
        required: ['keywords'],
        properties: {
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of keywords to analyze'
          },
          sources: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: specific sources to use'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  overallScore: { type: 'number' },
                  confidence: { type: 'number' },
                  sources: { type: 'array' }
                }
              }
            },
            summary: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                topTrend: { type: 'string' },
                avgScore: { type: 'number' }
              }
            }
          }
        }
      }
    }
    }, async (_request, _reply) => {
    try {
      const { keywords } = _request.body;

      if (!keywords || keywords.length === 0) {
        _reply.code(400);
        return { error: 'Keywords array is required' };
      }

      logger.info({ count: keywords.length }, 'Batch analyzing trends');

      const results = await trendAggregator.batchAnalyze(keywords);

      const topTrend = results[0];
      const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;

      return {
        results,
        summary: {
          total: results.length,
          topTrend: topTrend?.keyword || '',
          avgScore
        }
      };
    } catch (error) {
      logger.error({ error }, 'Batch trend analysis failed');
      _reply.code(500);
      return { error: 'Batch trend analysis failed' };
    }
  });

  /**
   * GET /api/trends/compare
   * Compare multiple keywords
   */
  fastify.get<{
    Querystring: { keywords: string };
  }>('/compare', {
    schema: {
      description: 'Compare trends for multiple keywords',
      tags: ['Trends'],
      querystring: {
        type: 'object',
        required: ['keywords'],
        properties: {
          keywords: { 
            type: 'string', 
            description: 'Comma-separated keywords to compare' 
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            comparison: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  rank: { type: 'number' },
                  score: { type: 'number' },
                  confidence: { type: 'number' }
                }
              }
            },
            winner: { type: 'string' }
          }
        }
      }
    }
    }, async (_request, _reply) => {
    try {
      const keywords = _request.query.keywords.split(',').map((k: string) => k.trim());

      if (keywords.length < 2) {
        _reply.code(400);
        return { error: 'At least 2 keywords required for comparison' };
      }

      logger.info({ keywords }, 'Comparing trends');

      const results = await trendAggregator.batchAnalyze(keywords);

      const comparison = results.map((result, index) => ({
        keyword: result.keyword,
        rank: index + 1,
        score: result.overallScore,
        confidence: result.confidence
      }));

      return {
        comparison,
        winner: comparison[0]?.keyword || ''
      };
    } catch (error) {
      logger.error({ error }, 'Trend comparison failed');
      _reply.code(500);
      return { error: 'Trend comparison failed' };
    }
  });

  logger.info('✅ Trend Aggregator Routes registered');
};
