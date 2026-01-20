import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface MLInsight {
  type: string;
  title: string;
  value?: string;
  score?: number;
  detail?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
}

interface ReportMetrics {
  totalReports?: number;
  automatedReports?: number;
  manualReports?: number;
  exportSuccess?: number;
  scheduledReports?: number;
  realTimeReports?: number;
  avgReportTime?: string;
}

interface NextStep {
  title: string;
  description: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
}

export async function registerConversionReportMLAnalysis(server: FastifyInstance) {
  server.post<{ Body: { reportData: ReportMetrics } }>(
    '/report-analysis',
    async (request: FastifyRequest<{ Body: { reportData: ReportMetrics } }>, reply: FastifyReply) => {
      try {
        const { reportData } = request.body;
        const mlInsights: MLInsight[] = [];
        const nextSteps: NextStep[] = [];
        let summary = '';

        // Analyse 1: Niedrige Automation
        if (reportData?.automatedReports && reportData?.totalReports && (reportData.automatedReports / reportData.totalReports) < 0.7) {
          mlInsights.push({
            type: 'Low_Automation_Rate',
            title: '🤖 Automatisierung kann verbessert werden',
            value: `${((reportData.automatedReports / reportData.totalReports) * 100).toFixed(1)}%`,
            priority: 'medium',
            detail: 'Nur 70% der Reports sind automatisiert',
            category: 'automation',
            score: (reportData.automatedReports / reportData.totalReports) * 100
          });
          nextSteps.push({
            title: 'Mehr Reports automatisieren',
            description: 'Implementieren Sie automatisierte Reporting-Workflows für regelmäßige Reports',
            criticality: 'medium'
          });
        }

        // Analyse 2: Export-Fehlerquote
        const exportRate = reportData?.exportSuccess || 0;
        if (exportRate < 90) {
          mlInsights.push({
            type: 'High_Export_Failure_Rate',
            title: '⚠️ Hohe Export-Fehlerquote erkannt',
            value: `${exportRate}% erfolgreich`,
            priority: 'high',
            detail: 'Exportfehler beeinträchtigen die Berichterstattung',
            category: 'export',
            score: exportRate
          });
          nextSteps.push({
            title: 'Export-Stabilitätstest durchführen',
            description: 'Überprüfen Sie die Export-Konfigurationen und Berechtigungen',
            criticality: 'high'
          });
        }

        // Analyse 3: Berichtsvolumen
        if (reportData?.totalReports && reportData.totalReports < 50) {
          mlInsights.push({
            type: 'Low_Report_Volume',
            title: '📊 Geringes Berichtsaufkommen',
            value: `${reportData.totalReports} Reports/Monat`,
            priority: 'low',
            detail: 'Das Berichtsvolumen ist unter dem empfohlenen Durchschnitt',
            category: 'usage',
            score: reportData.totalReports
          });
        }

        // Analyse 4: Echtzeit-Kapazität
        if (reportData?.realTimeReports && reportData?.scheduledReports) {
          const realTimeRatio = reportData.realTimeReports / reportData.scheduledReports;
          if (realTimeRatio > 0.5) {
            mlInsights.push({
              type: 'High_RealTime_Demand',
              title: '⚡ Starke Nachfrage nach Echtzeit-Reports',
              value: `${(realTimeRatio * 100).toFixed(1)}% des geplanten Volumens`,
              priority: 'medium',
              detail: 'Viele Nutzer nutzen Echtzeit-Reports - Performance optimieren',
              category: 'performance',
              score: realTimeRatio * 100
            });
          }
        }

        // Analyse 5: Report-Generierungszeit
        if (reportData?.avgReportTime) {
          const timeStr = reportData.avgReportTime.replace('min', '').trim();
          const avgTime = parseFloat(timeStr);
          if (avgTime > 5) {
            mlInsights.push({
              type: 'Slow_Report_Generation',
              title: '🐢 Langsame Report-Generierung',
              value: `${avgTime} Minuten durchschnittlich`,
              priority: 'high',
              detail: 'Reports dauern länger als ideal - Optimierung empfohlen',
              category: 'performance',
              score: avgTime
            });
            nextSteps.push({
              title: 'Report-Performance optimieren',
              description: 'Überprüfen Sie Datenbankindizes und Query-Performance',
              criticality: 'high'
            });
          }
        }

        // Fallback: Positive Analyse
        if (mlInsights.length === 0) {
          mlInsights.push({
            type: 'Solid_Reporting_Infrastructure',
            title: '✅ Stabiles Reporting-System',
            value: `${reportData?.totalReports || 100} Reports generiert`,
            priority: 'low',
            detail: 'Ihre Reporting-Infrastruktur funktioniert zuverlässig',
            category: 'positive',
            score: 85
          });
          summary = 'Ihr Reporting-System ist gesund und performant.';
        } else {
          summary = `${mlInsights.filter(i => i.priority === 'critical').length} kritische, ${mlInsights.filter(i => i.priority === 'high').length} hohe und ${mlInsights.filter(i => i.priority === 'medium').length} mittlere Erkenntnisse gefunden.`;
        }

        // Allgemeine Optimierungsstrategie
        nextSteps.push({
          title: 'Reporting-Dashboard aktualisieren',
          description: 'Implementieren Sie neue KI-basierte Dashboards für bessere Insights',
          criticality: 'low'
        });

        return reply.send({
          success: true,
          mlInsights: mlInsights.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return (priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']);
          }),
          nextSteps,
          summary,
          summaryDetails: {
            overallScore: (() => {
              const scores = mlInsights.map(i => typeof i.score === 'number' ? i.score : 70);
              if (scores.length === 0) return 70;
              const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
              const criticalCount = mlInsights.filter(i => i.priority === 'critical').length;
              const highCount = mlInsights.filter(i => i.priority === 'high').length;
              const penalty = criticalCount * 15 + highCount * 7;
              return Math.max(40, Math.min(95, Math.round(avg - penalty)));
            })(),
            trend: mlInsights.length < 2 ? 'Positive ✓' : 'Improvement needed ⚠️',
            recommendation: mlInsights.length < 2 ? 'Weiterhin wie bisher' : 'Schnelle Aktion erforderlich'
          }
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'ML-Analyse fehlgeschlagen',
          message: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
