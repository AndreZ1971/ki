import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function miniAuditRoutes(fastify: FastifyInstance) {
  // GET /api/audit/mini
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        quickChecks: [
          {
            id: 'load-time',
            name: 'Ladezeit',
            icon: '⚡',
            status: 'good',
            value: '1.8s',
            trend: 12,
            description: 'Seiten-Geschwindigkeit',
            quickAction: 'Cache optimieren'
          },
          {
            id: 'mobile-score',
            name: 'Mobile',
            icon: '📱',
            status: 'warning',
            value: '72/100',
            trend: -5,
            description: 'Mobile Performance',
            quickAction: 'Responsive prüfen'
          },
          {
            id: 'seo-basic',
            name: 'SEO Basis',
            icon: '🔍',
            status: 'good',
            value: '85/100',
            trend: 3,
            description: 'Grundlegende SEO',
            quickAction: 'Meta-Tags prüfen'
          },
          {
            id: 'security',
            name: 'Sicherheit',
            icon: '🛡️',
            status: 'excellent',
            value: '95/100',
            trend: 2,
            description: 'Basic Security Check'
          },
          {
            id: 'uptime',
            name: 'Verfügbarkeit',
            icon: '📈',
            status: 'excellent',
            value: '99.9%',
            trend: 0,
            description: 'Uptime letzten 30 Tage'
          },
          {
            id: 'core-vitals',
            name: 'Core Vitals',
            icon: '🎯',
            status: 'warning',
            value: '68/100',
            trend: -8,
            description: 'Google Core Web Vitals',
            quickAction: 'CLS optimieren'
          }
        ],
        miniMetrics: [
          {
            id: 'conversion',
            name: 'Conversion Rate',
            value: 2.3,
            target: 3.0,
            unit: '%',
            status: 'warning'
          },
          {
            id: 'bounce-rate',
            name: 'Absprungrate',
            value: 42,
            target: 35,
            unit: '%',
            status: 'critical'
          },
          {
            id: 'page-views',
            name: 'Seitenaufrufe',
            value: 12450,
            target: 10000,
            unit: '',
            status: 'excellent'
          },
          {
            id: 'avg-session',
            name: 'Session-Dauer',
            value: 2.8,
            target: 3.0,
            unit: 'min',
            status: 'good'
          }
        ]
      },
      scanTime: 156,
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/audit/mini/scan
  fastify.post('/scan', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Startet einen neuen Mini-Scan
    return reply.send({
      success: true,
      message: 'Mini-Audit-Scan gestartet',
      data: {
        quickChecks: [
          {
            id: 'load-time',
            name: 'Ladezeit',
            icon: '⚡',
            status: 'good',
            value: '1.8s',
            trend: 12,
            description: 'Seiten-Geschwindigkeit',
            quickAction: 'Cache optimieren'
          },
          {
            id: 'mobile-score',
            name: 'Mobile',
            icon: '📱',
            status: 'warning',
            value: '72/100',
            trend: -5,
            description: 'Mobile Performance',
            quickAction: 'Responsive prüfen'
          },
          {
            id: 'seo-basic',
            name: 'SEO Basis',
            icon: '🔍',
            status: 'good',
            value: '85/100',
            trend: 3,
            description: 'Grundlegende SEO',
            quickAction: 'Meta-Tags prüfen'
          },
          {
            id: 'security',
            name: 'Sicherheit',
            icon: '🛡️',
            status: 'excellent',
            value: '95/100',
            trend: 2,
            description: 'Basic Security Check'
          },
          {
            id: 'uptime',
            name: 'Verfügbarkeit',
            icon: '📈',
            status: 'excellent',
            value: '99.9%',
            trend: 0,
            description: 'Uptime letzten 30 Tage'
          },
          {
            id: 'core-vitals',
            name: 'Core Vitals',
            icon: '🎯',
            status: 'warning',
            value: '68/100',
            trend: -8,
            description: 'Google Core Web Vitals',
            quickAction: 'CLS optimieren'
          }
        ],
        miniMetrics: [
          {
            id: 'conversion',
            name: 'Conversion Rate',
            value: 2.3,
            target: 3.0,
            unit: '%',
            status: 'warning'
          },
          {
            id: 'bounce-rate',
            name: 'Absprungrate',
            value: 42,
            target: 35,
            unit: '%',
            status: 'critical'
          },
          {
            id: 'page-views',
            name: 'Seitenaufrufe',
            value: 12450,
            target: 10000,
            unit: '',
            status: 'excellent'
          },
          {
            id: 'avg-session',
            name: 'Session-Dauer',
            value: 2.8,
            target: 3.0,
            unit: 'min',
            status: 'good'
          }
        ]
      },
      scanTime: 156,
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/audit/mini/summary
  fastify.get('/summary', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      summary: {
        totalChecks: 6,
        excellent: 2,
        good: 2,
        warning: 2,
        critical: 0,
        overallScore: 76,
        lastScan: new Date().toISOString(),
        recommendedActions: [
          'Mobile Performance optimieren',
          'Core Web Vitals verbessern',
          'Absprungrate reduzieren'
        ]
      }
    });
  });
}
