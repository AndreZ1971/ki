import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Echte Checks für Standard-Audit
const initialAudit = {
  checks: [
    {
      id: 'perf-1',
      category: 'performance',
      name: 'Ladezeit unter 2 Sekunden',
      description: 'Die Startseite sollte in unter 2 Sekunden laden.',
      status: 'passed',
      importance: 'critical',
      fixSuggestion: 'Bilder optimieren, Caching aktivieren',
      quickFix: true
    },
    {
      id: 'seo-1',
      category: 'seo',
      name: 'Meta-Tags vorhanden',
      description: 'Alle Seiten sollten Meta-Tags für SEO besitzen.',
      status: 'warning',
      importance: 'important',
      fixSuggestion: 'Meta-Tags ergänzen',
      quickFix: true
    },
    {
      id: 'sec-1',
      category: 'security',
      name: 'SSL aktiv',
      description: 'Die Seite sollte über HTTPS erreichbar sein.',
      status: 'passed',
      importance: 'critical',
      fixSuggestion: 'SSL-Zertifikat einrichten',
      quickFix: false
    },
    {
      id: 'ux-1',
      category: 'ux',
      name: 'Mobile Optimierung',
      description: 'Die Seite sollte mobil optimiert sein.',
      status: 'failed',
      importance: 'important',
      fixSuggestion: 'Responsive Design prüfen',
      quickFix: false
    },
    {
      id: 'content-1',
      category: 'content',
      name: 'Produktbeschreibungen vorhanden',
      description: 'Alle Produkte sollten eine Beschreibung haben.',
      status: 'passed',
      importance: 'recommended',
      fixSuggestion: 'Fehlende Beschreibungen ergänzen',
      quickFix: true
    }
  ],
  summary: {
    totalChecks: 5,
    passed: 3,
    warnings: 1,
    failed: 1,
    overallScore: 60,
    criticalIssues: 1
  }
};

export default async function standardAuditRoutes(fastify: FastifyInstance) {
  // GET /api/audit/standard
  fastify.get('/api/audit/standard', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Liefert die aktuellen Audit-Checks und Summary (noch leer)
    return reply.send(initialAudit);
  });

  // POST /api/audit/standard/scan
  fastify.post('/api/audit/standard/scan', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Startet einen neuen Audit-Scan (Dummy-Response)
    // Später: Echte Checks einbauen
    return reply.send({ success: true, message: 'Standard-Audit Scan gestartet (Dummy)' });
  });
}
