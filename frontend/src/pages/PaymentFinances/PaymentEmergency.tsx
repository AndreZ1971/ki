// src/pages/PaymentFinances/PaymentEmergency.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { paymentApi } from '../../services/productApi';
import type { EmergencyAnalysisResult } from '../../types/product';
import './page.css';

const PaymentEmergency: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [issueType, setIssueType] = useState('gateway-down');
  const [description, setDescription] = useState('');
  const [affectedCustomers, setAffectedCustomers] = useState(0);
  const [financialImpact, setFinancialImpact] = useState(0);
  const [analysis, setAnalysis] = useState<EmergencyAnalysisResult | null>(null);

  const issues = [
    { value: 'gateway-down', label: 'Gateway Ausfall', icon: '🚨' },
    { value: 'fraud-alert', label: 'Fraud Alert', icon: '⚠️' },
    { value: 'refund-issue', label: 'Rückerstattung', icon: '💸' },
    { value: 'other', label: 'Sonstiges', icon: '❓' }
  ];

  const handleReport = async () => {
    if (!description) {
      showToast('Bitte Beschreibung eingeben', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const systemsAffected = issueType === 'gateway-down' 
        ? ['Payment Gateway', 'Checkout', 'Order Processing']
        : issueType === 'fraud-alert'
        ? ['Fraud Detection', 'Risk Engine', 'Transaction Monitoring']
        : issueType === 'refund-issue'
        ? ['Refund System', 'Accounting', 'Customer Service']
        : ['Payment System'];

      const response = await paymentApi.analyzeEmergency({
        issueType,
        description,
        affectedCustomers,
        financialImpact,
        systemsAffected
      });

      if (response.success && response.data) {
        setAnalysis(response.data);
        showToast('✅ KI-Notfall-Analyse abgeschlossen!', 'success');
      } else {
        throw new Error(response.error || 'Analyse fehlgeschlagen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
      showToast('Analyse fehlgeschlagen', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🤖 Payment Emergency (KI-Powered)</h1>
        <p>GPT-4o-mini gestütztes Incident Management & Eskalation</p>
      </motion.div>

      {/* Datenschutz-Hinweis */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'rgba(255,59,48,0.1)', 
          border: '2px solid rgba(255,59,48,0.3)', 
          borderRadius: '12px', 
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{ fontSize: '24px' }}>🔒</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ff3b30', marginBottom: '4px' }}>
            Datenschutz-Hinweis
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
            KI-Notfall-Analyse erfolgt in Echtzeit via GPT-4o-mini. Keine dauerhafte Speicherung von Incident-Daten. 
            Analysedaten werden nur temporär im RAM verarbeitet. OpenAI-API verarbeitet Daten gemäß deren Datenschutzrichtlinien.
          </div>
        </div>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      {/* Alerting-Konfiguration Info */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'rgba(0,122,255,0.1)', 
          border: '2px solid rgba(0,122,255,0.3)', 
          borderRadius: '12px', 
          padding: '16px',
          marginBottom: '20px'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#007aff', marginBottom: '8px' }}>
          📡 Alerting-Kanäle (via .env konfigurierbar)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            <span>💬</span>
            <span><strong>Slack:</strong> SLACK_EMERGENCY_WEBHOOK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            <span>📧</span>
            <span><strong>Email:</strong> EMERGENCY_ALERT_EMAIL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            <span>📟</span>
            <span><strong>PagerDuty:</strong> PAGERDUTY_INTEGRATION_KEY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            <span>📋</span>
            <span><strong>Console:</strong> Immer aktiv</span>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
          Hinweis: Notfälle werden automatisch an alle konfigurierten Kanäle gemeldet. P0/P1 Incidents lösen PagerDuty-Alarm aus.
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Notfall Melden</h3>

          <div className="form-group">
            <label>Problem-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {issues.map(issue => (
                <motion.div key={issue.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIssueType(issue.value)}
                  style={{ padding: '12px', background: issueType === issue.value ? 'linear-gradient(135deg, #ff3b30 0%, #ff9500 100%)' : 'rgba(255,255,255,0.05)',
                    border: issueType === issue.value ? '2px solid rgba(255, 59, 48, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{issue.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>{issue.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Beschreibung *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibe das Problem detailliert..." className="form-input" rows={4} />
          </div>

          <div className="form-group">
            <label>Betroffene Kunden (geschätzt)</label>
            <input type="number" value={affectedCustomers} onChange={(e) => setAffectedCustomers(Number(e.target.value))} placeholder="z.B. 1000" className="form-input" />
          </div>

          <div className="form-group">
            <label>Finanzieller Impact (€)</label>
            <input type="number" value={financialImpact} onChange={(e) => setFinancialImpact(Number(e.target.value))} placeholder="z.B. 50000" className="form-input" />
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleReport} loading={loading} loadingText="KI analysiert...">🤖 KI-Notfall-Analyse starten</LoadingButton>
          </div>
        </motion.div>

        {analysis && (
          <>
            {/* Severity & Priority Dashboard */}
            <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>🎯 Schweregrad & Priorität</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ 
                  background: analysis.severity === 'P0' ? 'linear-gradient(135deg, rgba(255,59,48,0.2), rgba(255,149,0,0.2))' : 
                              analysis.severity === 'P1' ? 'rgba(255,149,0,0.15)' : 
                              'rgba(0,122,255,0.1)', 
                  border: `2px solid ${analysis.severity === 'P0' ? '#ff3b30' : analysis.severity === 'P1' ? '#ff9500' : '#007aff'}`, 
                  borderRadius: '16px', 
                  padding: '24px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ fontSize: '56px', marginBottom: '12px' }}>
                    {analysis.severity === 'P0' ? '🚨' : analysis.severity === 'P1' ? '⚠️' : analysis.severity === 'P2' ? '🟡' : '🟢'}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8, color: 'white', marginBottom: '8px' }}>Severity</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>{analysis.severity}</div>
                  <div style={{ fontSize: '14px', opacity: 0.8, color: 'white', marginBottom: '8px' }}>Priority</div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: analysis.priority === 'CRITICAL' ? '#ff3b30' : 
                           analysis.priority === 'HIGH' ? '#ff9500' : 
                           analysis.priority === 'MEDIUM' ? '#007aff' : '#34c759' 
                  }}>{analysis.priority}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Ticket-ID</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', fontFamily: 'monospace' }}>{analysis.ticketId}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>KI Confidence</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#34c759' }}>{(analysis.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            </motion.div>

            {/* Estimated Impact */}
            <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Impact Assessment</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.5)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Kunden betroffen</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff3b30' }}>{analysis.estimatedImpact.customersFacing.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.5)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Revenue Risk</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9500' }}>€{analysis.estimatedImpact.revenueAtRisk.toLocaleString()}</div>
                </div>
                <div style={{ background: analysis.estimatedImpact.slaViolation ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)', border: `1px solid ${analysis.estimatedImpact.slaViolation ? 'rgba(255,59,48,0.5)' : 'rgba(52,199,89,0.5)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>SLA Status</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: analysis.estimatedImpact.slaViolation ? '#ff3b30' : '#34c759' }}>
                    {analysis.estimatedImpact.slaViolation ? '❌ Verletzt' : '✅ OK'}
                  </div>
                </div>
                <div style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.5)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '8px' }}>Uptime Impact</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007aff' }}>{analysis.estimatedImpact.uptimeImpact}</div>
                </div>
              </div>
            </motion.div>

            {/* Root Cause Hypothesis */}
            {analysis.rootCauseHypothesis.length > 0 && (
              <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ color: 'white', marginBottom: '20px' }}>🔍 Root Cause Hypothesen</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.rootCauseHypothesis.map((cause, idx) => (
                    <div key={idx} style={{ background: 'rgba(175,82,222,0.1)', border: '1px solid rgba(175,82,222,0.5)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🔎</span>
                      <span style={{ fontSize: '14px', color: 'white' }}>{cause}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Immediate Actions */}
            {analysis.immediateActions.length > 0 && (
              <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ color: 'white', marginBottom: '20px' }}>⚡ Sofortmaßnahmen</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analysis.immediateActions.map((action, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,149,0,0.3)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{action.action}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '8px' }}>
                        <div>
                          <div style={{ fontSize: '11px', opacity: 0.6, color: 'white' }}>Owner</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#007aff' }}>{action.owner}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', opacity: 0.6, color: 'white' }}>ETA</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ff9500' }}>{action.eta}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Escalation Path */}
            {analysis.escalationPath.length > 0 && (
              <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ color: 'white', marginBottom: '20px' }}>📞 Eskalationspfad</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.escalationPath.map((level, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.5)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        background: 'rgba(0,122,255,0.3)', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>{idx + 1}</div>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{level}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Communication Templates */}
            <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>💬 Communication Templates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#007aff', marginBottom: '8px' }}>📧 Internal</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{analysis.communicationTemplate.internal}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34c759', marginBottom: '8px' }}>👤 Customer</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{analysis.communicationTemplate.customer}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff9500', marginBottom: '8px' }}>👔 Stakeholder</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{analysis.communicationTemplate.stakeholder}</div>
                </div>
              </div>
            </motion.div>

            {/* Mitigation Steps */}
            {analysis.mitigationSteps.length > 0 && (
              <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ color: 'white', marginBottom: '20px' }}>🛠️ Mitigation Steps</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.mitigationSteps.map((step, idx) => (
                    <div key={idx} style={{ background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.5)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>✅</span>
                      <span style={{ fontSize: '14px', color: 'white' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Prevention Recommendations */}
            {analysis.preventionRecommendations.length > 0 && (
              <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ color: 'white', marginBottom: '20px' }}>🔒 Prevention Recommendations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.preventionRecommendations.map((rec, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.5)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🛡️</span>
                      <span style={{ fontSize: '14px', color: 'white' }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SLA & Runbook */}
            <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>📚 SLA & Resources</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysis.slaDeadline && (
                  <div style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.5)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>SLA Deadline</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff9500' }}>{new Date(analysis.slaDeadline).toLocaleString('de-DE')}</div>
                  </div>
                )}
                {analysis.runbookUrl && (
                  <div style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.5)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Runbook</div>
                    <a href={analysis.runbookUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: '600', color: '#007aff', textDecoration: 'none' }}>
                      📖 {analysis.runbookUrl}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentEmergency;