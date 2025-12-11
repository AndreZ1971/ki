// src/pages/PaymentFinances/PaymentSimplified.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { paymentApi } from '../../services/productApi';
import type { AmountSuggestion, UxAuditResult } from '../../types/product';
import './page.css';

const PaymentSimplified: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [productName, setProductName] = useState('');
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [predictionFactors, setPredictionFactors] = useState<string[]>([]);
  const [predictionRecommendation, setPredictionRecommendation] = useState<string>('');
  const [suggestedAmounts, setSuggestedAmounts] = useState<AmountSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [uxAudit, setUxAudit] = useState<UxAuditResult | null>(null);
  const [loadingUx, setLoadingUx] = useState(false);

  const handleSimplify = async () => {
    if (!amount || !productName) {
      showToast('Bitte fülle alle Felder aus', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prediction = await paymentApi.predictSuccess({
        amount: parseFloat(amount),
        currency,
        customerEmail: 'noreply@example.com'
      });

      if (prediction.success && prediction.data) {
        const rate = Math.round(prediction.data.successProbability * 100);
        setConversionRate(rate);
        setPredictionFactors(prediction.data.factors || []);
        setPredictionRecommendation(prediction.data.recommendation || '');
        showToast(`🚀 Prognose aktualisiert: ${rate}%`, 'success');
      } else {
        showToast('Keine Prognosedaten erhalten', 'warning');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimierungsfehler';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await paymentApi.suggestAmounts({ currency });
      if (response.success && response.data) {
        setSuggestedAmounts(response.data);
        showToast(`✨ ${response.data.length} Betragsempfehlungen geladen`, 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Empfehlungen fehlgeschlagen';
      showToast(errorMessage, 'error');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AmountSuggestion) => {
    setAmount(suggestion.amount.toString());
    showToast(`✅ ${suggestion.amount} ${currency} übernommen`, 'success');
    // Optional: direkt neue Prognose anstoßen
    setTimeout(() => handleSimplify(), 200);
  };

  const handleUxCheck = async () => {
    if (!amount || !productName) {
      showToast('Bitte Produktname und Preis angeben', 'error');
      return;
    }

    setLoadingUx(true);
    try {
      const response = await paymentApi.uxCheck({
        productName,
        amount: parseFloat(amount),
        currency,
        flowType: 'one-page'
      });
      if (response.success && response.data) {
        setUxAudit(response.data);
        showToast('🧠 UX Quick Wins geladen', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'UX-Check fehlgeschlagen';
      showToast(errorMessage, 'error');
    } finally {
      setLoadingUx(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🎯 Payment Simplified</h1>
        <p>Vereinfachte Payment-Prozesse für höhere Conversion</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Produkt-Details</h3>

          <div className="form-group">
            <label>Produktname *</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="z.B. Premium Paket" className="form-input" />
          </div>

          <div className="form-group" style={{ display: 'grid', gap: '10px' }}>
            <div>
              <label>Preis *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="99.99" step="0.01" className="form-input" />
            </div>
            <div>
              <label>Währung</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="form-input">
                {['EUR', 'USD', 'GBP', 'CHF'].map(curr => <option key={curr} value={curr}>{curr}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={handleLoadSuggestions}
              disabled={loadingSuggestions}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: loadingSuggestions ? 'not-allowed' : 'pointer',
                opacity: loadingSuggestions ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loadingSuggestions ? '⏳ Lade Empfehlungen...' : '✨ Smarte Betragsempfehlungen'}
            </button>
          </div>

          {suggestedAmounts.length > 0 && (
            <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestedAmounts.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  style={{
                    background: 'rgba(102, 126, 234, 0.12)',
                    border: '1px solid rgba(102, 126, 234, 0.5)',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {suggestion.amount} {currency}
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    opacity: 0.8,
                    background: 'rgba(52, 199, 89, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}>
                    📊 {suggestion.conversionScore}%
                  </span>
                </button>
              ))}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', marginTop: '15px' }}>
            <h4 style={{ color: 'white', fontSize: '13px', marginBottom: '10px' }}>🎯 Optimierungen</h4>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>✓ 1-Click Checkout</div>
              <div>✓ Autofill-Optimierung</div>
              <div>✓ Mobile-First Design</div>
              <div>✓ Trust-Badges</div>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button
              onClick={handleUxCheck}
              disabled={loadingUx}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: loadingUx ? 'not-allowed' : 'pointer',
                opacity: loadingUx ? 0.75 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loadingUx ? '🔎 Analysiere UX...' : '🧠 UX Quick Wins'}
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleSimplify} loading={loading} loadingText="Optimiere...">🎯 Prozess Vereinfachen</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Conversion-Analyse</h3>
          {conversionRate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.5)', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '15px' }}>📈</div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>{conversionRate}%</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Erwartete Conversion Rate (KI)</div>
              </div>

              {predictionFactors.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Einflussfaktoren:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'white' }}>
                    {predictionFactors.map((factor, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '8px 10px'
                      }}>
                        • {factor}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {predictionRecommendation && (
                <div style={{ background: 'rgba(102, 126, 234, 0.12)', border: '1px solid rgba(102, 126, 234, 0.4)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>KI-Empfehlung</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>💡 {predictionRecommendation}</div>
                </div>
              )}

              {uxAudit && (
                <div style={{ background: 'rgba(11, 163, 96, 0.08)', border: '1px solid rgba(11, 163, 96, 0.3)', borderRadius: '12px', padding: '18px', display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>UX Quick Wins</div>
                    <div style={{
                      background: 'rgba(52, 199, 89, 0.15)',
                      border: '1px solid rgba(52, 199, 89, 0.4)',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      🚀 Lift ~{Math.round((uxAudit.expectedLift ?? 0) * 100)}%
                    </div>
                  </div>

                  {uxAudit.quickWins?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Quick Wins</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                        {uxAudit.quickWins.map((w, idx) => (
                          <div key={idx} style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            padding: '8px'
                          }}>
                            ✅ {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uxAudit.issues?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Risiken</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                        {uxAudit.issues.map((i, idx) => (
                          <div key={idx} style={{
                            background: 'rgba(255, 159, 10, 0.12)',
                            border: '1px solid rgba(255, 159, 10, 0.4)',
                            borderRadius: '8px',
                            padding: '8px'
                          }}>
                            ⚠️ {i}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uxAudit.recommendedFlow && (
                    <div style={{
                      background: 'rgba(11, 163, 96, 0.12)',
                      border: '1px solid rgba(11, 163, 96, 0.35)',
                      borderRadius: '10px',
                      padding: '10px',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '12px'
                    }}>
                      🧭 Empfohlener Flow: {uxAudit.recommendedFlow}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <p>Keine Analyse verfügbar</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSimplified;