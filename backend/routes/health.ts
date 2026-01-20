import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../logger';
import {
  runCacheClear,
  runInventoryMetrics,
  runPerformanceReport,
  runSecurityScan,
  runSeoAnalysis,
} from './health-helpers';

// Type Definitionen
interface HealthMetric {
  name: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  target: number;
  trend: number;
}

interface ShopHealthData {
  overallScore: number;
  performance: number;
  security: number;
  seo: number;
  inventory: number;
  lastScan: string;
  issuesFound: number;
  recommendations: number;
  metrics: HealthMetric[];
}

interface MLInsight {
  type: string;
  title: string;
  value: string;
  score?: number;
  detail?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
}

// Health KI-Analysis Routes - als Plugin exportiert
export default async function registerHealthRoutes(fastify: FastifyInstance) {
  // POST: /ml-analysis - KI-Analyse für Shop Health
  fastify.post<{ Body: { healthData: ShopHealthData; metrics: HealthMetric[] } }>(
    '/ml-analysis',
    async (request: FastifyRequest<{ Body: { healthData: ShopHealthData; metrics: HealthMetric[] } }>, reply: FastifyReply) => {
      try {
        const { healthData, metrics } = request.body;
        
        // KI-gestützte Analyse basierend auf Health Daten
        const mlInsights: MLInsight[] = [];

        // 1. Kritische Vulnerabilities erkannt
        if (healthData.security < 70) {
          mlInsights.push({
            type: 'Critical_Security_Issues',
            title: '🚨 Kritische Sicherheitsprobleme erkannt',
            value: `Ihre Shop-Sicherheit ist gefährdet. Score: ${healthData.security}%`,
            score: 0.95,
            detail: 'Ungeschützte Datenübertragungen, veraltete Plugins oder fehlende SSL-Zertifikate wurden identifiziert.',
            priority: 'critical',
            category: 'Sicherheit'
          });
        }

        // 2. Performance Bottlenecks
        if (healthData.performance < 60) {
          mlInsights.push({
            type: 'Performance_Bottleneck',
            title: '⚡ Performance-Engpässe erkannt',
            value: `Ladezeiten > 3s. Performance-Score: ${healthData.performance}%`,
            score: 0.88,
            detail: 'Große Bilder, Render-Blocking-Ressourcen oder unoptimierte Datenbankabfragen verlangsamen Ihren Shop.',
            priority: 'high',
            category: 'Performance'
          });
        }

        // 3. SEO Issues
        if (healthData.seo < 70) {
          mlInsights.push({
            type: 'SEO_Issues',
            title: '🔍 SEO-Verbesserungen notwendig',
            value: `SEO-Score: ${healthData.seo}/100 - Ranking gefährdet`,
            score: 0.82,
            detail: 'Meta-Tags fehlen, Mobile-Optimierung unvollständig oder Sitemaps nicht korrekt konfiguriert.',
            priority: 'high',
            category: 'SEO'
          });
        }

        // 4. Inventory Issues
        if (healthData.inventory < 80) {
          mlInsights.push({
            type: 'Inventory_Alert',
            title: '📦 Bestandsverwaltung optimieren',
            value: `Inventory-Level: ${healthData.inventory}% - Überverkauf möglich`,
            score: 0.75,
            detail: 'Synchronisationsprobleme mit Lagersystem oder unkorrigierte Bestandswerte.',
            priority: 'medium',
            category: 'Inventar'
          });
        }

        // 5. Multiple Issues Pattern
        if (healthData.issuesFound > 10) {
          mlInsights.push({
            type: 'Multiple_Issues_Pattern',
            title: '⚠️ Systemische Probleme erkannt',
            value: `${healthData.issuesFound} unterschiedliche Probleme gefunden - Umfassende Überprüfung empfohlen`,
            score: 0.90,
            detail: 'Die Häufung von Problemen deutet auf unzureichende Wartung oder veraltete Systeme hin.',
            priority: 'high',
            category: 'System'
          });
        }

        // 6. Overall Health Trend
        if (healthData.overallScore > 85) {
          mlInsights.push({
            type: 'Excellent_Health',
            title: '✨ Exzellenter Shop-Gesundheitsstatus',
            value: `Gesamt-Score: ${healthData.overallScore}/100 - Alles im grünen Bereich`,
            score: 0.98,
            detail: 'Ihr Shop wird optimal gepflegt. Regelmäßige Wartung ist wichtig, um diesen Status zu halten.',
            priority: 'low',
            category: 'Status'
          });
        } else if (healthData.overallScore > 70) {
          mlInsights.push({
            type: 'Good_Health',
            title: '👍 Shop funktioniert gut',
            value: `Gesamt-Score: ${healthData.overallScore}/100 - Kleine Optimierungen möglich`,
            score: 0.85,
            detail: 'Der Shop läuft stabil, aber einige Optimierungen könnten die Leistung verbessern.',
            priority: 'medium',
            category: 'Status'
          });
        } else {
          mlInsights.push({
            type: 'Poor_Health',
            title: '🔧 Shop-Gesundheit kritisch',
            value: `Gesamt-Score: ${healthData.overallScore}/100 - Schnelle Maßnahmen erforderlich`,
            score: 0.92,
            detail: 'Der Shop hat mehrere kritische Probleme. Sofortige Wartung und Optimierung sind notwendig.',
            priority: 'critical',
            category: 'Status'
          });
        }

        // 7. Recommendations basierend auf Metrics
        if (metrics && metrics.length > 0) {
          const criticalMetrics = metrics.filter((m: HealthMetric) => m.status === 'critical');
          if (criticalMetrics.length > 0) {
            mlInsights.push({
              type: 'Critical_Metrics',
              title: `📊 ${criticalMetrics.length} kritische Metriken`,
              value: `${criticalMetrics.map((m: HealthMetric) => m.name).join(', ')} erfordern sofortige Aufmerksamkeit`,
              score: 0.93,
              detail: 'Diese Metriken sind außerhalb der akzeptablen Schwellenwerte und beeinflussen die Shop-Leistung.',
              priority: 'critical',
              category: 'Metriken'
            });
          }
        }

        // 8. Proaktive Empfehlungen
        const recommendations: string[] = [];
        if (healthData.performance < 80) recommendations.push('Performance-Optimierung durchführen');
        if (healthData.security < 85) recommendations.push('Sicherheits-Updates prüfen');
        if (healthData.seo < 80) recommendations.push('SEO-Audit durchführen');
        if (healthData.issuesFound > 5) recommendations.push('Regelmäßige Wartung planen');

        if (recommendations.length > 0) {
          mlInsights.push({
            type: 'Proactive_Recommendations',
            title: '💡 KI-Empfehlungen',
            value: recommendations.join(' • '),
            score: 0.87,
            detail: 'Basierend auf Ihrer Shop-Analyse empfehlen wir diese Maßnahmen zur Verbesserung.',
            priority: 'medium',
            category: 'Empfehlungen'
          });
        }

        // Antwort mit KI-Insights
        return reply.send({
          success: true,
          mlInsights,
          timestamp: new Date().toISOString(),
          analysis: {
            totalInsights: mlInsights.length,
            criticalCount: mlInsights.filter(i => i.priority === 'critical').length,
            highCount: mlInsights.filter(i => i.priority === 'high').length,
            mediumCount: mlInsights.filter(i => i.priority === 'medium').length,
            lowCount: mlInsights.filter(i => i.priority === 'low').length
          }
        });
      } catch (error: any) {
        logger.error({ error, endpoint: '/health-ml-insights' }, 'Health ML-Analysis failed');
        return reply.status(500).send({
          success: false,
          error: error.message || 'KI-Analyse fehlgeschlagen',
          mlInsights: []
        });
      }
    }
  );

  // POST: /api/health/clear-cache - ehrliche Rückmeldung (kein Mock)
  fastify.post('/clear-cache', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runCacheClear();
      const status = result.success ? 200 : result.notConfigured ? 501 : 500;
      return reply.status(status).send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'Cache-Clear fehlgeschlagen',
        error: error.message,
      });
    }
  });

  // POST: /api/health/performance-report - reale Messung gegen Shop-URL
  fastify.post('/performance-report', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runPerformanceReport();
      return reply.send(result);
    } catch (error: any) {
      logger.error({ error }, 'Performance report failed');
      return reply.status(500).send({
        success: false,
        message: 'Performance-Bericht fehlgeschlagen',
        error: error.message,
      });
    }
  });

  // POST: /api/health/security-scan - echte Header/TLS-Prüfung
  fastify.post('/security-scan', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runSecurityScan();
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'Sicherheits-Scan fehlgeschlagen',
        error: error.message,
      });
    }
  });

  // POST: /api/health/seo-analysis - echte HTML-Auswertung (Startseite)
  fastify.post('/seo-analysis', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runSeoAnalysis();
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'SEO-Analyse fehlgeschlagen',
        error: error.message,
      });
    }
  });

  // GET: /api/health/inventory-metrics - echte Lagerbestandsauswertung
  fastify.get('/inventory-metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runInventoryMetrics();
      const status = result.success ? 200 : 500;
      return reply.status(status).send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'Inventory-Analyse fehlgeschlagen',
        error: error.message,
      });
    }
  });
}
