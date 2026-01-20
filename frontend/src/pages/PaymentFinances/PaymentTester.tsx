// src/pages/PaymentFinances/PaymentTester.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { MLPaymentAnalyzer } from './MLPaymentAnalyzer';
import { paymentApi } from '../../services/productApi';
import type { PaymentTestScenario, TestDiagnosis } from '../../types/product';
import './page.css';

interface TestResult { name: string; status: 'passed' | 'failed'; duration: string; }

const PaymentTester: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [testType, setTestType] = useState('full');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testTarget, setTestTarget] = useState('checkout-api');
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [scenarios, setScenarios] = useState<PaymentTestScenario[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [failureLogs, setFailureLogs] = useState('');
  const [diagnosis, setDiagnosis] = useState<TestDiagnosis | null>(null);
  const [loadingDiag, setLoadingDiag] = useState(false);

  const tests = [
    { value: 'full', label: 'Vollständig', icon: '🧪' },
    { value: 'smoke', label: 'Smoke Test', icon: '💨' },
    { value: 'integration', label: 'Integration', icon: '🔗' },
    { value: 'load', label: 'Last-Test', icon: '⚡' }
  ];

  const riskOptions = [
    { value: 'low', label: 'Niedrig', icon: '🟢' },
    { value: 'medium', label: 'Mittel', icon: '🟡' },
    { value: 'high', label: 'Hoch', icon: '🔴' },
  ];

  const handleRunTests = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);

    try {
      // Rufe echte Payment-Tests vom Backend ab
      const response = await paymentApi.runPaymentTests({
        testType,
        target: testTarget,
        riskTolerance,
      });

      if (response.success && response.data) {
        setTestResults(response.data);
        const failed = response.data.filter(t => t.status === 'failed').length;
        showToast(failed === 0 ? 'Alle Tests bestanden! ✅' : `${failed} Test(s) fehlgeschlagen`, failed === 0 ? 'success' : 'error');
      } else {
        throw new Error('Keine Test-Ergebnisse erhalten');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test-Fehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await paymentApi.generateTestPlan({
        testType,
        target: testTarget,
        riskTolerance,
      });
      if (res.success && res.data) {
        setScenarios(res.data);
        showToast(`✨ ${res.data.length} KI-Szenarien geladen`, 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Testplan-Generierung fehlgeschlagen';
      showToast(errorMessage, 'error');
    } finally {
      setLoadingPlan(false);
    }
  };

  const applyScenario = (scenario: PaymentTestScenario) => {
    // Simuliere Resultate basierend auf successProbability
    const successProb = scenario.successProbability ?? 0.8;
    const simulated: TestResult[] = scenario.steps.map((step, idx) => ({
      name: `${scenario.title} – Schritt ${idx + 1}`,
      status: Math.random() < successProb ? 'passed' : 'failed',
      duration: `${Math.floor(Math.random() * 800)}ms`
    }));
    setTestResults(simulated);
    const failed = simulated.filter(t => t.status === 'failed').length;
    showToast(failed === 0 ? 'Szenario erfolgreich simuliert' : `${failed} Schritte fehlgeschlagen`, failed === 0 ? 'success' : 'error');
  };

  const handleDiagnose = async () => {
    if (!failureLogs.trim()) {
      showToast('Bitte Log- oder Fehlermeldungen einfügen', 'error');
      return;
    }
    setLoadingDiag(true);
    try {
      const lines = failureLogs.split('\n').filter(l => l.trim()).slice(0, 50);
      const res = await paymentApi.diagnoseTests({
        failureLogs: lines,
        environment: 'staging',
        testType,
      });
      if (res.success && res.data) {
        setDiagnosis(res.data);
        showToast('🩺 Diagnose erstellt', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Diagnose fehlgeschlagen';
      showToast(errorMessage, 'error');
    } finally {
      setLoadingDiag(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🧪 Payment Tester</h1>
        <p>Automatisierte Payment-Tests und Qualitätssicherung</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Test-Konfiguration</h3>

          <div className="form-group">
            <label>Test-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {tests.map(test => (
                <motion.div key={test.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTestType(test.value)}
                  style={{ padding: '12px', background: testType === test.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: testType === test.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{test.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{test.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Ziel / Endpoint</label>
            <input type="text" value={testTarget} onChange={(e) => setTestTarget(e.target.value)} placeholder="checkout-api" className="form-input" />
          </div>

          <div className="form-group">
            <label>Risikotoleranz</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {riskOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRiskTolerance(opt.value as typeof riskTolerance)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: riskTolerance === opt.value ? '2px solid rgba(102,126,234,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    background: riskTolerance === opt.value ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleRunTests} loading={loading} loadingText="Teste...">🧪 Tests Ausführen</LoadingButton>
          </div>

          <div style={{ marginTop: '12px' }}>
            <LoadingButton onClick={handleGeneratePlan} loading={loadingPlan} loadingText="Generiere...">✨ KI Testplan</LoadingButton>
          </div>

          <div className="form-group" style={{ marginTop: '18px' }}>
            <label>Fehler-Logs (für Diagnose)</label>
            <textarea
              value={failureLogs}
              onChange={(e) => setFailureLogs(e.target.value)}
              placeholder="Stacktraces, HTTP 500, Gateway Errors..."
              rows={6}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
            <div style={{ marginTop: '10px' }}>
              <LoadingButton onClick={handleDiagnose} loading={loadingDiag} loadingText="Analysiere...">🩺 KI-Diagnose</LoadingButton>
            </div>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Test-Ergebnisse</h3>
          {testResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {testResults.map((test, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${test.status === 'passed' ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 59, 48, 0.5)'}`,
                  borderRadius: '10px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{test.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>{test.duration}</div>
                  </div>
                  <div style={{ fontSize: '24px' }}>{test.status === 'passed' ? '✅' : '❌'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧪</div>
              <p>Keine Test-Ergebnisse</p>
            </div>
          )}
        </motion.div>
      </div>

      {scenarios.length > 0 && (
        <div className="result-container" style={{ marginTop: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '12px' }}>✨ KI-generierte Szenarien</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {scenarios.map((scenario, idx) => (
              <div key={idx} style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '14px',
                display: 'grid',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{scenario.title}</div>
                  <div style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: scenario.riskLevel === 'high' ? 'rgba(255,59,48,0.15)' : scenario.riskLevel === 'medium' ? 'rgba(255,159,10,0.15)' : 'rgba(52,199,89,0.15)',
                    color: 'white'
                  }}>
                    {scenario.riskLevel.toUpperCase()} • {scenario.priority}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Focus: {scenario.focusArea}</div>

                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  Erfolgschance: {(scenario.successProbability * 100).toFixed(0)}%
                </div>

                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  Impact: {scenario.expectedImpact}
                </div>

                {scenario.steps?.length > 0 && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {scenario.steps.map((step, sidx) => (
                      <div key={sidx} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '6px'
                      }}>
                        • {step}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => applyScenario(scenario)}
                  style={{
                    marginTop: '6px',
                    padding: '10px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ▶️ Szenario simulieren
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {diagnosis && (
        <div className="result-container" style={{ marginTop: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '12px' }}>🩺 KI-Diagnose</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white'
            }}>
              <span style={{
                padding: '6px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: diagnosis.severity === 'critical' ? 'rgba(255,59,48,0.18)' : diagnosis.severity === 'high' ? 'rgba(255,99,71,0.18)' : diagnosis.severity === 'medium' ? 'rgba(255,159,10,0.18)' : 'rgba(52,199,89,0.18)',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                {diagnosis.severity.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Konfidenz: {(diagnosis.confidence * 100).toFixed(0)}%</span>
            </div>

            {diagnosis.rootCauses?.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>Ursachen</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                  {diagnosis.rootCauses.map((c, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '8px'
                    }}>
                      ⚠️ {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diagnosis.fixes?.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>Fix-Vorschläge</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                  {diagnosis.fixes.map((f, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(52,199,89,0.12)',
                      border: '1px solid rgba(52,199,89,0.3)',
                      borderRadius: '8px',
                      padding: '8px'
                    }}>
                      ✅ {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diagnosis.recommendedOwners?.length > 0 && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                Zuständig: {diagnosis.recommendedOwners.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="payment-ml-section">
        {/* Beispielhafte Payment-ID, kann dynamisch ersetzt werden */}
        <MLPaymentAnalyzer paymentId="demo-payment-123" />
      </div>
    </div>
  );
};

export default PaymentTester;