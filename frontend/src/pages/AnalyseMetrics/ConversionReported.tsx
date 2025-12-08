
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

interface ReportData {
  totalReports?: number;
  automatedReports?: number;
  manualReports?: number;
  exportSuccess?: number;
  scheduledReports?: number;
  realTimeReports?: number;
  avgReportTime?: string;
  lastUpdated?: string;
}

interface Insight {
  type: string;
  title?: string;
  value?: string;
  detail?: string;
  score?: number;
}

interface NextStep {
  title?: string;
  description?: string;
  criticality?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

const ConversionReported = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [realTimeInterval, setRealTimeInterval] = useState('5min');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simuliere Daten-Fetch
    setTimeout(() => {
      setReportData({
        totalReports: 156,
        automatedReports: 128,
        manualReports: 28,
        exportSuccess: 94,
        scheduledReports: 45,
        realTimeReports: 23,
        avgReportTime: "2.3min",
        lastUpdated: new Date().toISOString()
      });
      setLoading(false);
    }, 1000);
  }, []);

  // KI/ML-Analyse: API-Call
  const handleAnalyzeAI = async () => {
    setInsightLoading(true);
    setInsightError(null);
    setInsights([]);
    setNextSteps([]);
    setSummary(null);
    try {
      // Beispiel-Endpunkt, Backend muss /api/analytics/ml/report-insights bereitstellen
      const res = await fetch(`${API_URL}/api/analytics/ml/report-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData })
      });
      const data = await res.json();
      setInsights(data.insights || []);
      setNextSteps(data.nextSteps || []);
      setSummary(data.summary || null);
    } catch (_err: any) {
      setInsightError('Fehler bei der KI-Analyse');
    } finally {
      setInsightLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  // ECHTER Datei-Download
  const handleExport = (format: string) => {
    setActiveAction('exporting');
    
    // Simuliere Daten für den Report
    const reportData = {
      title: "Conversion Report",
      date: new Date().toLocaleDateString('de-DE'),
      metrics: {
        totalSales: 12500,
        conversionRate: 2.8,
        totalOrders: 156,
        successfulConversions: 42
      }
    };

    setTimeout(() => {
      let content, mimeType, filename;
      
      switch (format) {
        case 'pdf':
          // Für echte PDFs bräuchten wir eine Library wie jsPDF
          content = `Conversion Report\nDatum: ${reportData.date}\nUmsatz: $${reportData.metrics.totalSales}\nConversion Rate: ${reportData.metrics.conversionRate}%`;
          mimeType = 'application/pdf';
          filename = `conversion-report-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'excel':
          // Einfache CSV für Excel
          content = `Datum,Umsatz,Conversion Rate,Bestellungen\n${reportData.date},${reportData.metrics.totalSales},${reportData.metrics.conversionRate},${reportData.metrics.totalOrders}`;
          mimeType = 'application/vnd.ms-excel';
          filename = `conversion-report-${new Date().toISOString().split('T')[0]}.xls`;
          break;
        case 'csv':
          content = `Datum,Umsatz,Conversion Rate,Bestellungen\n${reportData.date},${reportData.metrics.totalSales},${reportData.metrics.conversionRate},${reportData.metrics.totalOrders}`;
          mimeType = 'text/csv';
          filename = `conversion-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'json':
          content = JSON.stringify(reportData, null, 2);
          mimeType = 'application/json';
          filename = `conversion-report-${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          content = 'Report data';
          mimeType = 'text/plain';
          filename = `report-${new Date().toISOString().split('T')[0]}.txt`;
      }

      // Erstelle einen Download-Link
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setActiveAction(null);
    }, 1000);
  };

  const handleScheduleReport = () => {
    setActiveAction('scheduling');
    setTimeout(() => {
      // Simuliere Backend-Call
      console.log(`Report scheduled for ${scheduleTime}`);
      setActiveAction(null);
      alert(`✅ Report wurde für ${scheduleTime} Uhr täglich geplant!`);
    }, 1500);
  };

  const handleEmailReport = () => {
    if (!emailRecipient) {
      alert('Bitte E-Mail Adresse eingeben!');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(emailRecipient)) {
      alert('Bitte gültige E-Mail Adresse eingeben!');
      return;
    }

    setActiveAction('emailing');
    setTimeout(() => {
      // Simuliere Backend-Call
      console.log(`Report sent to ${emailRecipient}`);
      setActiveAction(null);
      setEmailRecipient('');
      alert(`✅ Report wurde an ${emailRecipient} gesendet!`);
    }, 1500);
  };

  const handleGenerateRealTime = () => {
    setActiveAction('generating');
    setTimeout(() => {
      // Simuliere Backend-Call
      console.log(`Real-time report generated with interval ${realTimeInterval}`);
      setActiveAction(null);
      alert(`✅ Echtzeit-Report wurde generiert (Intervall: ${realTimeInterval})!`);
    }, 1500);
  };

  if (loading) return <div className="loading-spinner">📋 Loading Reports...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="analytics-page">
      {/* Absolut positionierter Back-Button */}
      <button 
        className="back-button floating-back" 
        onClick={handleBackToDashboard}
      >
        ← Zurück
      </button>

      <div className="analytics-header">
        <h1>📋 Conversion Reported</h1>
        <p>Automatische Conversion-Reports, Export und jetzt KI-gestützte Analyse!</p>
      </div>

      {/* 2x4 Grid Layout */}
      <div className="analytics-grid-2x4">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-label">Total Reports</div>
          <div className="metric-value">{reportData?.totalReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🤖</div>
          <div className="metric-label">Automated Reports</div>
          <div className="metric-value">{reportData?.automatedReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">👨‍💼</div>
          <div className="metric-label">Manual Reports</div>
          <div className="metric-value">{reportData?.manualReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📤</div>
          <div className="metric-label">Export Success</div>
          <div className="metric-value">{reportData?.exportSuccess || 0}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏰</div>
          <div className="metric-label">Scheduled Reports</div>
          <div className="metric-value">{reportData?.scheduledReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-label">Real-time Reports</div>
          <div className="metric-value">{reportData?.realTimeReports || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-label">Avg Report Time</div>
          <div className="metric-value">{reportData?.avgReportTime || '0min'}</div>
        </div>
        <div className="metric-card last-updated">
          <div className="metric-icon">🕒</div>
          <div className="metric-label">Last Updated</div>
          <div className="metric-value-small">
            {reportData?.lastUpdated ? new Date(reportData.lastUpdated).toLocaleDateString('de-DE') : 'N/A'}
          </div>
        </div>
      </div>

      {/* KI/ML-Analyse Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🧠 KI-gestützte Report-Analyse</h3>
          <p style={{marginBottom: 18, color: '#2563eb', fontWeight: 500}}>
            Nutze KI/ML, um Conversion-Reports automatisch zu analysieren, Trends zu erkennen und Optimierungspotenziale zu entdecken.
          </p>
          <button 
            className="action-button primary"
            onClick={handleAnalyzeAI}
            disabled={insightLoading}
            style={{marginBottom: 18}}
          >
            {insightLoading ? '⏳ KI-Analyse läuft...' : '🧠 KI-Analyse starten'}
          </button>
          {insightError && <div className="error-message">{insightError}</div>}

          {/* Zusammenfassung */}
          {summary && (
            <div className="metric-card" style={{margin: '24px 0'}}>
              <h4>📝 KI-Zusammenfassung</h4>
              <div style={{fontSize: '1.1rem', color: '#2c3e50', marginBottom: 12}}>{summary}</div>
            </div>
          )}

          {/* Insights Grid */}
          {Array.isArray(insights) && insights.length > 0 && (
            <div className="analytics-grid-2x4" style={{marginBottom: 32}}>
              {insights.map((insight, i) => (
                <div className="metric-card" key={i}>
                  <div className="metric-icon" style={{fontSize: '2.2rem'}}>
                    {insight.type === 'trend' && '📈'}
                    {insight.type === 'segment' && '🧩'}
                    {insight.type === 'forecast' && '🔮'}
                    {insight.type === 'anomaly' && '⚠️'}
                    {insight.type === 'conversion' && '🎯'}
                    {insight.type === 'other' && '🔎'}
                  </div>
                  <div className="metric-label">{insight.title || insight.type}</div>
                  <div className="metric-value" style={{fontSize: '1.3rem'}}>{insight.value}</div>
                  {insight.detail && <div style={{color: '#6c757d', fontSize: '0.95rem', marginTop: 8}}>{insight.detail}</div>}
                  {insight.score !== undefined && (
                    <div style={{fontWeight: 700, color: '#2563eb', marginTop: 8}}>KI-Score: {Math.round(insight.score * 100)}%</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Next Steps / Empfehlungen */}
          {Array.isArray(nextSteps) && nextSteps.length > 0 && (
            <div className="next-steps" style={{marginBottom: 32}}>
              <h4>🚀 Empfohlene Next Steps</h4>
              {nextSteps.map((step, i) => (
                <div className={`next-step ${step.criticality || 'good'}`} key={i}>
                  <span className="step-icon">
                    {step.criticality === 'critical' && '❗'}
                    {step.criticality === 'warning' && '⚠️'}
                    {step.criticality === 'good' && '✅'}
                    {!step.criticality && '➡️'}
                  </span>
                  <div className="step-content">
                    <strong>{step.title || 'Empfehlung'}</strong>
                    <p>{step.description || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Actions Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>🚀 Report Actions</h3>
          <div className="actions-grid">
            {/* Export Current Report */}
            <div className="action-group">
              <h4>📥 Export Current Report</h4>
              <div className="format-selector">
                {['pdf', 'excel', 'csv', 'json'].map(format => (
                  <button
                    key={format}
                    className={`format-button ${exportFormat === format ? 'active' : ''}`}
                    onClick={() => setExportFormat(format)}
                    disabled={activeAction !== null}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              <button 
                className="action-button primary"
                onClick={() => handleExport(exportFormat)}
                disabled={activeAction !== null}
              >
                {activeAction === 'exporting' ? '⏳ Exporting...' : `📥 Export as ${exportFormat.toUpperCase()}`}
              </button>
            </div>
            {/* Schedule New Report */}
            <div className="action-group">
              <h4>⏰ Schedule New Report</h4>
              <div className="input-group">
                <label>Uhrzeit:</label>
                <input 
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={activeAction !== null}
                />
              </div>
              <button 
                className="action-button secondary"
                onClick={handleScheduleReport}
                disabled={activeAction !== null}
              >
                {activeAction === 'scheduling' ? '⏳ Scheduling...' : '⏰ Schedule Report'}
              </button>
            </div>
            {/* Email Report */}
            <div className="action-group">
              <h4>📧 Email Report</h4>
              <div className="input-group">
                <label>Empfänger:</label>
                <input 
                  type="email" 
                  placeholder="email@beispiel.de"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  disabled={activeAction !== null}
                />
              </div>
              <button 
                className="action-button secondary"
                onClick={handleEmailReport}
                disabled={activeAction !== null}
              >
                {activeAction === 'emailing' ? '⏳ Sending...' : '📧 Send Report'}
              </button>
            </div>
            {/* Generate Real-time */}
            <div className="action-group">
              <h4>🔄 Generate Real-time</h4>
              <div className="input-group">
                <label>Intervall:</label>
                <select 
                  value={realTimeInterval}
                  onChange={(e) => setRealTimeInterval(e.target.value)}
                  disabled={activeAction !== null}
                >
                  <option value="1min">1 Minute</option>
                  <option value="5min">5 Minuten</option>
                  <option value="15min">15 Minuten</option>
                  <option value="30min">30 Minuten</option>
                </select>
              </div>
              <button 
                className="action-button secondary"
                onClick={handleGenerateRealTime}
                disabled={activeAction !== null}
              >
                {activeAction === 'generating' ? '⏳ Generating...' : '🔄 Generate Real-time'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports Sektion */}
      <div className="analysis-section">
        <div className="metric-card full-width">
          <h3>📈 Recent Reports</h3>
          <div className="reports-list">
            <div className="report-item">
              <span className="report-name">Monthly Conversion Summary</span>
              <span className="report-date">01.11.2025</span>
              <span className="report-status completed">✅ Completed</span>
            </div>
            <div className="report-item">
              <span className="report-name">Weekly Performance</span>
              <span className="report-date">25.10.2025</span>
              <span className="report-status completed">✅ Completed</span>
            </div>
            <div className="report-item">
              <span className="report-name">Real-time Dashboard</span>
              <span className="report-date">Live</span>
              <span className="report-status live">🟢 Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionReported;