// src/pages/PaymentFinances/PaymentTester.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { MLPaymentAnalyzer } from './MLPaymentAnalyzer';
import './page.css';

interface TestResult { name: string; status: 'passed' | 'failed'; duration: string; }

const PaymentTester: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [testType, setTestType] = useState('full');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const tests = [
    { value: 'full', label: 'Vollständig', icon: '🧪' },
    { value: 'smoke', label: 'Smoke Test', icon: '💨' },
    { value: 'integration', label: 'Integration', icon: '🔗' },
    { value: 'load', label: 'Last-Test', icon: '⚡' }
  ];

  const handleRunTests = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTests: TestResult[] = [
        { name: 'Payment Gateway Connection', status: Math.random() > 0.1 ? 'passed' : 'failed', duration: `${Math.floor(Math.random() * 500)}ms` },
        { name: 'Transaction Processing', status: Math.random() > 0.1 ? 'passed' : 'failed', duration: `${Math.floor(Math.random() * 1000)}ms` },
        { name: 'Refund Handling', status: Math.random() > 0.1 ? 'passed' : 'failed', duration: `${Math.floor(Math.random() * 800)}ms` },
        { name: 'Webhook Delivery', status: Math.random() > 0.1 ? 'passed' : 'failed', duration: `${Math.floor(Math.random() * 300)}ms` },
        { name: 'Error Recovery', status: Math.random() > 0.1 ? 'passed' : 'failed', duration: `${Math.floor(Math.random() * 600)}ms` }
      ];
      
      setTestResults(mockTests);
      const failed = mockTests.filter(t => t.status === 'failed').length;
      showToast(failed === 0 ? 'Alle Tests bestanden! ✅' : `${failed} Test(s) fehlgeschlagen`, failed === 0 ? 'success' : 'error');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test-Fehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
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

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleRunTests} loading={loading} loadingText="Teste...">🧪 Tests Ausführen</LoadingButton>
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

      <div className="payment-ml-section">
        <h3>KI-Payment-Analyse</h3>
        {/* Beispielhafte Payment-ID, kann dynamisch ersetzt werden */}
        <MLPaymentAnalyzer paymentId="demo-payment-123" />
      </div>
    </div>
  );
};

export default PaymentTester;