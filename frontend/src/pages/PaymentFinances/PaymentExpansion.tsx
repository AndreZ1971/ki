// src/pages/PaymentFinances/PaymentExpansion.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { paymentApi } from '../../services/productApi';
import type { ExpansionStrategyResult } from '../../types/product';
import './page.css';

const PaymentExpansion: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [targetRegion, setTargetRegion] = useState<'eu' | 'us' | 'asia' | 'global'>('eu');
  const [currentRevenue, setCurrentRevenue] = useState(500000);
  const [currentMarkets, setCurrentMarkets] = useState(3);
  const [priority, setPriority] = useState<'speed' | 'balanced' | 'compliance-first'>('balanced');
  const [plan, setPlan] = useState<ExpansionStrategyResult | null>(null);

  const regions = [
    { value: 'eu', label: 'Europa', icon: '🇪🇺' },
    { value: 'us', label: 'USA', icon: '🇺🇸' },
    { value: 'asia', label: 'Asien', icon: '🌏' },
    { value: 'global', label: 'Global', icon: '🌍' }
  ];

  const handlePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.expansionStrategy({
        targetRegion,
        currentRevenue,
        currentMarkets,
        priority
      });

      if (response.success && response.data) {
        setPlan(response.data);
        showToast('✅ KI-Expansionsplan erstellt!', 'success');
      } else {
        throw new Error(response.error || 'Planung fehlgeschlagen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Planungsfehler');
      showToast('Planung fehlgeschlagen', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🤖 Payment Expansion (KI-Powered)</h1>
        <p>GPT-4o-mini gestützte Markt- und PSP-Strategie</p>
      </motion.div>

      {/* Datenschutz-Hinweis */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(102,126,234,0.12)',
          border: '2px solid rgba(102,126,234,0.35)',
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
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#aeb8ff', marginBottom: '4px' }}>
            Datenschutz-Hinweis
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
            KI-Analyse erfolgt in Echtzeit via GPT-4o-mini. Keine dauerhafte Speicherung; Daten werden nur im RAM verarbeitet. 
            OpenAI-API verarbeitet Daten gemäß deren Datenschutzrichtlinien.
          </div>
        </div>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Zielmarkt & Annahmen</h3>

          <div className="form-group">
            <label>Region</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {regions.map(region => (
                <motion.div key={region.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTargetRegion(region.value as any)}
                  style={{ padding: '14px', background: targetRegion === region.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: targetRegion === region.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{region.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{region.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Aktueller Umsatz (EUR)</label>
            <input type="number" value={currentRevenue} onChange={(e) => setCurrentRevenue(Number(e.target.value))} className="form-input" placeholder="500000" />
          </div>

          <div className="form-group">
            <label>Aktive Märkte</label>
            <input type="number" value={currentMarkets} onChange={(e) => setCurrentMarkets(Number(e.target.value))} className="form-input" placeholder="3" />
          </div>

          <div className="form-group">
            <label>Priorität</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="form-input">
              <option value="speed">⚡ Geschwindigkeit</option>
              <option value="balanced">⚖️ Balanced</option>
              <option value="compliance-first">🔒 Compliance First</option>
            </select>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handlePlan} loading={loading} loadingText="KI plant...">🤖 KI-Plan erstellen</LoadingButton>
          </div>
        </motion.div>

        {plan && (
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>🎯 KI Confidence & Projection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: 'rgba(102,126,234,0.12)', border: '1px solid rgba(102,126,234,0.4)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Confidence</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#aeb8ff' }}>{(plan.confidence * 100).toFixed(0)}%</div>
              </div>
              <div style={{ background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.5)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Likely Umsatz</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#34c759' }}>€{plan.revenueProjection.likely.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.5)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Best Case</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff9500' }}>€{plan.revenueProjection.best.toLocaleString()}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {plan ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {/* Markets to Enter */}
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>🌍 Zielmärkte</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.marketsToEnter.map((m, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{m.country}</span>
                    {m.expectedLift !== undefined && (
                      <span style={{ fontSize: '12px', color: '#34c759' }}>+{m.expectedLift}%</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{m.reason}</div>
                </div>
              ))}
              {plan.marketsToEnter.length === 0 && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Keine Empfehlungen</div>}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>⏱️ Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.timeline.map((p, idx) => (
                <div key={idx} style={{ background: 'rgba(102,126,234,0.12)', border: '1px solid rgba(102,126,234,0.4)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'white' }}>
                    <span style={{ fontWeight: 700 }}>{p.phase}</span>
                    <span style={{ fontSize: '13px', color: '#aeb8ff' }}>{p.durationWeeks} Wochen</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{p.milestones.join(' • ')}</div>
                </div>
              ))}
              {plan.timeline.length === 0 && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Keine Timeline definiert</div>}
            </div>
          </motion.div>

          {/* Payment Stack */}
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>💳 Payment Stack</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>PSP</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{plan.paymentStack.psp.join(', ') || 'N/A'}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Zahlmethoden</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{plan.paymentStack.paymentMethods.join(', ') || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Fraud</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{plan.paymentStack.fraud || 'Nicht angegeben'}</div>
              </div>
            </div>
          </motion.div>

          {/* Localization */}
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>🌐 Lokalisierung</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.5)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Währungen</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{plan.localization.currencies.join(', ') || 'N/A'}</div>
              </div>
              <div style={{ background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.5)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Sprachen</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{plan.localization.languages.join(', ') || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'white', marginBottom: '6px' }}>Steuern</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{plan.localization.tax || 'Nicht angegeben'}</div>
              </div>
            </div>
          </motion.div>

          {/* Compliance */}
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>🔒 Compliance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plan.complianceChecklist.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.5)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>✅</span>
                  <span style={{ fontSize: '13px', color: 'white' }}>{item}</span>
                </div>
              ))}
              {plan.complianceChecklist.length === 0 && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Keine Compliance-Punkte</div>}
            </div>
          </motion.div>

          {/* Risks */}
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>⚠️ Risiken & Maßnahmen</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.riskMitigation.map((risk, idx) => {
                const color = risk.probability === 'high' ? '#ff3b30' : risk.probability === 'medium' ? '#ff9500' : '#34c759';
                return (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}50`, borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{risk.risk}</span>
                      <span style={{ fontSize: '12px', color }}>{risk.probability}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{risk.action}</div>
                  </div>
                );
              })}
              {plan.riskMitigation.length === 0 && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Keine Risiken erkannt</div>}
            </div>
          </motion.div>

          {/* Logistics */}
          <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>🚚 Logistik / Ops</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plan.logisticsNotes.map((note, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>📌</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{note}</span>
                </div>
              ))}
              {plan.logisticsNotes.length === 0 && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Keine Hinweise</div>}
            </div>
          </motion.div>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <p>Kein Plan erstellt</p>
        </div>
      )}
    </div>
  );
};

export default PaymentExpansion;