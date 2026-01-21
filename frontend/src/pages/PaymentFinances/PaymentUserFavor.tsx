// src/pages/PaymentFinances/PaymentUserFavor.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { paymentApi } from '../../services/productApi';
import type { UserPaymentPreferences } from '../../types/product';
import './page.css';

const PaymentUserFavor: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [customerId, setCustomerId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [preferences, setPreferences] = useState<UserPaymentPreferences | null>(null);

  const handleAnalyze = async () => {
    if (!customerId) {
      showToast('Bitte Kunden-ID eingeben', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Hole echte Purchase History von WooCommerce API
      const response = await paymentApi.analyzeUserPreferences({
        customerId,
        customerEmail: customerEmail || undefined,
        // purchaseHistory wird vom Backend automatisch aus WooCommerce abgerufen
      });

      if (response.success && response.data) {
        setPreferences(response.data);
        showToast(`✅ Kundenpreferenzen analysiert - Zuverlässigkeit: ${Math.round(response.data.confidence * 100)}%`, 'success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysefehler');
      showToast('❌ Analyse fehlgeschlagen', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'low') return '#34c759';
    if (risk === 'medium') return '#ff9500';
    return '#ff3b30';
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>📊 Payment User Favor</h1>
        <p>Heuristische Kundenanalyse basierend auf WooCommerce Kaufverlauf</p>
      </motion.div>

      {/* Datenschutz-Hinweis */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'rgba(255,149,0,0.1)', 
          border: '2px solid rgba(255,149,0,0.3)', 
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
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ff9500', marginBottom: '4px' }}>
            Datenverarbeitung
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
            Analyse nutzt heuristische Algorithmen basierend auf WooCommerce-Kaufdaten (keine LLM-Modelle). 
            Daten werden nur während der Analyse im RAM verarbeitet. 
            Keine dauerhaften Kundenprofile. Kundendaten bleiben in WooCommerce und werden nicht extern übertragen.
          </div>
        </div>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      {/* Analyseergebnis & Zuverlässigkeit */}
      {preferences && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            background: 'rgba(0,122,255,0.1)', 
            border: '2px solid rgba(0,122,255,0.3)',
            borderRadius: '16px', 
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '15px'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>📈 Analyse-Zuverlässigkeit</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007aff' }}>
              {Math.round(preferences.confidence * 100)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>📊 Total Purchases</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
              {preferences.metadata.totalPurchases}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>💰 Lifetime Value</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34c759' }}>
              €{preferences.lifetimeValue.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>⚠️ Risk Profile</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: getRiskColor(preferences.riskProfile), textTransform: 'uppercase' }}>
              {preferences.riskProfile}
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Kunden-Analyse</h3>

          <div className="form-group">
            <label>Kunden-ID *</label>
            <input 
              type="text" 
              value={customerId} 
              onChange={(e) => setCustomerId(e.target.value)} 
              placeholder="CUST-123456" 
              className="form-input" 
            />
          </div>

          <div className="form-group">
            <label>Kunden-Email (Optional)</label>
            <input 
              type="email" 
              value={customerEmail} 
              onChange={(e) => setCustomerEmail(e.target.value)} 
              placeholder="kunde@example.com" 
              className="form-input" 
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '15px', marginTop: '15px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              📊 <strong>Analyse umfasst:</strong>
            </div>
            <ul style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Bevorzugte Zahlungsmethoden</li>
              <li>Währung & Sprache</li>
              <li>Checkout-Flow Präferenzen</li>
              <li>Personalisierungs-Optionen</li>
              <li>Conversion-Optimierungen</li>
              <li>Risk Profile & Lifetime Value</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleAnalyze} loading={loading} loadingText="📊 Analysiere...">
              📊 Kundenanalyse starten
            </LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📊 Kunden-Präferenzen</h3>
          {preferences ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Payment Methods */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ 
                  background: 'rgba(52,199,89,0.1)', 
                  border: '2px solid rgba(52,199,89,0.3)', 
                  borderRadius: '12px', 
                  padding: '18px' 
                }}
              >
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                  💳 Bevorzugte Zahlungsmethoden
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {preferences.preferredPaymentMethods.map((method, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        background: idx === 0 ? '#34c759' : 'rgba(52,199,89,0.2)',
                        color: 'white',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: idx === 0 ? '700' : '600',
                        border: idx === 0 ? '2px solid #34c759' : '1px solid rgba(52,199,89,0.4)'
                      }}
                    >
                      {idx === 0 && '⭐ '}{method}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Currency & Language */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ 
                    background: 'rgba(0,122,255,0.1)', 
                    border: '1px solid rgba(0,122,255,0.3)', 
                    borderRadius: '12px', 
                    padding: '16px' 
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                    💱 Währung
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    {preferences.preferredCurrency}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ 
                    background: 'rgba(175,82,222,0.1)', 
                    border: '1px solid rgba(175,82,222,0.3)', 
                    borderRadius: '12px', 
                    padding: '16px' 
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                    🌍 Sprache
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase' }}>
                    {preferences.preferredLanguage}
                  </div>
                </motion.div>
              </div>

              {/* Checkout Flow */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ 
                  background: 'rgba(255,149,0,0.1)', 
                  border: '2px solid rgba(255,149,0,0.3)', 
                  borderRadius: '12px', 
                  padding: '18px' 
                }}
              >
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                  🛒 Empfohlener Checkout-Flow
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9500', textTransform: 'uppercase' }}>
                  {preferences.checkoutFlowRecommendation === 'one-page' ? '⚡ One-Page Checkout' : '📋 Multi-Step Checkout'}
                </div>
              </motion.div>

              {/* Personalizations */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  padding: '18px' 
                }}
              >
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
                  ✨ Personalisierungs-Features
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {Object.entries(preferences.personalizations).map(([key, value]) => (
                    <div 
                      key={key}
                      style={{ 
                        background: value ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)',
                        borderLeft: `3px solid ${value ? '#34c759' : '#ff3b30'}`,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ fontSize: '16px' }}>{value ? '✅' : '❌'}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Next Best Action */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0,122,255,0.2), rgba(175,82,222,0.2))', 
                  border: '2px solid rgba(0,122,255,0.4)',
                  borderRadius: '12px', 
                  padding: '18px' 
                }}
              >
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                  🎯 Next Best Action
                </div>
                <div style={{ fontSize: '15px', color: 'white', fontWeight: '600', lineHeight: '1.5' }}>
                  {preferences.nextBestAction}
                </div>
              </motion.div>
            </div>
          ) : (
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '2px dashed rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              padding: '40px', 
              textAlign: 'center', 
              color: 'rgba(255,255,255,0.5)' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Keine Präferenzen geladen</div>
              <p style={{ fontSize: '13px', margin: 0 }}>Starte Kundenanalyse für Personalisierungsoptionen</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Conversion Optimizations */}
      {preferences && preferences.conversionOptimizations.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ 
            background: 'rgba(52,199,89,0.1)', 
            border: '2px solid rgba(52,199,89,0.3)',
            borderRadius: '16px', 
            padding: '20px',
            marginTop: '20px'
          }}
        >
          <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚀 Conversion-Optimierungen
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.8' }}>
            {preferences.conversionOptimizations.map((opt, idx) => (
              <li key={idx} style={{ fontSize: '14px', marginBottom: '8px' }}>{opt}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentUserFavor;