import React, { useState, useMemo, useCallback } from 'react';

// ✅ Typen für Produktanalyse
interface ProductAnalysisProps {
  productId: number;
}

interface ScoreBreakdown {
  seo?: number;
  content?: number;
  pricing?: number;
  images?: number;
  descriptions?: number;
  overall: number;
}

interface AnalysisIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'seo' | 'content' | 'pricing' | 'inventory' | 'images';
  title: string;
  description: string;
  suggestion: string;
}

interface AnalysisResult {
  productId: number;
  score: ScoreBreakdown;
  basicInfo: {
    id: number;
    title: string;
    price: string;
    stock: number;
    status: string;
    categories: string[];
    images: string[];
  };
  issues: AnalysisIssue[];
  aiInsights?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
  analyzedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  analysis?: T;
  error?: string;
}

export const ProductAnalysis: React.FC<ProductAnalysisProps> = ({ productId }) => {
  const apiBase = useMemo(() => {
    const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
    return raw || '';
  }, []);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  // 🔗 Normalisierte API-URL
  const buildUrl = useCallback((path: string) => {
    const base = apiBase.endsWith('/api') && path.startsWith('/api')
      ? apiBase.replace(/\/api$/, '')
      : apiBase;
    if (!path.startsWith('/')) {
      return `${base}/${path}`;
    }
    return `${base}${path}`;
  }, [apiBase]);

  // 🎯 Analyse starten
  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(buildUrl(`/api/products/optimizer/analyze/${productId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Fehler ${res.status}: ${res.statusText}`);
      }

      const data: ApiResponse<AnalysisResult> = await res.json();

      if (data.success && (data.analysis || data.data)) {
        const analysisData = data.analysis || data.data;
        setResult(analysisData as AnalysisResult);
      } else {
        throw new Error(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Produkt konnte nicht analysiert werden: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [productId, buildUrl]);

  // 🎨 Score-Farbe basierend auf Wert
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34c759'; // Grün
    if (score >= 60) return '#ff9500'; // Orange
    return '#ff3b30'; // Rot
  };

  // 🔴 Issue-Farbe basierend auf Severity
  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'rgba(255, 59, 48, 0.15)';
      case 'warning': return 'rgba(255, 149, 0, 0.15)';
      case 'info': return 'rgba(0, 122, 255, 0.15)';
    }
  };

  const getSeverityBorderColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'rgba(255, 59, 48, 0.5)';
      case 'warning': return 'rgba(255, 149, 0, 0.5)';
      case 'info': return 'rgba(0, 122, 255, 0.5)';
    }
  };

  // 🏆 Kategorie-Icons
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      seo: '🔍',
      content: '📝',
      pricing: '💰',
      inventory: '📦',
      images: '🖼️'
    };
    return icons[category] || '⚠️';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          🔍 Produktanalyse & KI-Optimierung
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
          Detaillierte Analyse Ihres Produkts mit intelligenten Verbesserungsvorschlägen
        </p>
      </div>

      {/* Analyse Button */}
      <button
        onClick={fetchAnalysis}
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: loading ? 'rgba(0, 122, 255, 0.3)' : 'linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(52, 199, 89, 0.2))',
          border: loading ? '1px solid rgba(0, 122, 255, 0.5)' : '1px solid rgba(0, 122, 255, 0.5)',
          borderRadius: '8px',
          color: '#007aff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.2s',
          marginBottom: '24px'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 122, 255, 0.4), rgba(52, 199, 89, 0.3))';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 122, 255, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(52, 199, 89, 0.2))';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {loading ? '⏳ Analyse läuft...' : '🤖 Mit KI analysieren'}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(255, 59, 48, 0.1)',
          border: '1px solid rgba(255, 59, 48, 0.5)',
          borderRadius: '12px',
          padding: '16px',
          color: '#ff3b30',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔄</div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>Analysiere Ihr Produkt...</div>
        </div>
      )}

      {/* Analyse-Ergebnis */}
      {result && !loading && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Score Übersicht */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(52, 199, 89, 0.05))',
            border: '1px solid rgba(52, 199, 89, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>
              📊 Gesamtbewertung
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(${getScoreColor(result.score.overall)} ${result.score.overall * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <div style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'rgba(10, 10, 20, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: getScoreColor(result.score.overall) }}>
                    {result.score.overall}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>/ 100</div>
                </div>
              </div>
              <div>
                {result.score.seo && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>🔍 SEO</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{result.score.seo} / 100</div>
                  </div>
                )}
                {result.score.content && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>📝 Content</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{result.score.content} / 100</div>
                  </div>
                )}
                {result.score.pricing && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>💰 Pricing</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{result.score.pricing} / 100</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Produktinfo */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase' }}>
              ℹ️ Produktinformationen
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Titel</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{result.basicInfo.title}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>💰 Preis</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#34c759' }}>{result.basicInfo.price} €</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>📦 Lager</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{result.basicInfo.stock} Stück</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>🏷️ Status</div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'rgba(52, 199, 89, 0.2)',
                  borderRadius: '6px',
                  color: '#34c759'
                }}>
                  {result.basicInfo.status || 'Aktiv'}
                </div>
              </div>
            </div>
            {result.basicInfo.categories && result.basicInfo.categories.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>📂 Kategorien</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {result.basicInfo.categories.map((cat, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(0, 122, 255, 0.2)',
                        border: '1px solid rgba(0, 122, 255, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Issues/Probleme */}
          {result.issues && result.issues.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase' }}>
                ⚠️ Gefundene Probleme ({result.issues.length})
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {result.issues.map((issue, i) => (
                  <div
                    key={i}
                    style={{
                      background: getSeverityColor(issue.severity),
                      border: `1px solid ${getSeverityBorderColor(issue.severity)}`,
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = getSeverityColor(issue.severity).replace('0.15', '0.2');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = getSeverityColor(issue.severity);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                        <div style={{ fontSize: '18px' }}>{getCategoryIcon(issue.category)}</div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                            {issue.title}
                          </div>
                          {expandedIssue === i && (
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                              <div style={{ marginBottom: '8px' }}>{issue.description}</div>
                              <div style={{
                                background: 'rgba(52, 199, 89, 0.1)',
                                border: '1px solid rgba(52, 199, 89, 0.3)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                color: '#34c759'
                              }}>
                                💡 {issue.suggestion}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟠' : '🔵'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {result.aiInsights && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(175, 82, 222, 0.1), rgba(175, 82, 222, 0.05))',
              border: '1px solid rgba(175, 82, 222, 0.3)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase' }}>
                🤖 KI-Insights
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                {result.aiInsights.strengths && result.aiInsights.strengths.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#34c759', marginBottom: '8px' }}>
                      ✅ Stärken
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                      {result.aiInsights.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.aiInsights.weaknesses && result.aiInsights.weaknesses.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ff3b30', marginBottom: '8px' }}>
                      ❌ Schwächen
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                      {result.aiInsights.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.aiInsights.opportunities && result.aiInsights.opportunities.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ff9500', marginBottom: '8px' }}>
                      💡 Chancen
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                      {result.aiInsights.opportunities.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.aiInsights.recommendations && result.aiInsights.recommendations.length > 0 && (
                  <div style={{
                    background: 'rgba(0, 122, 255, 0.1)',
                    border: '1px solid rgba(0, 122, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '8px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#007aff', marginBottom: '8px' }}>
                      🎯 Top-Empfehlungen
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                      {result.aiInsights.recommendations.slice(0, 5).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingTop: '16px' }}>
            ⏱️ Analysiert am {new Date(result.analyzedAt).toLocaleString('de-DE')}
          </div>
        </div>
      )}

      {/* Keine Analyse */}
      {!result && !loading && !error && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          Klicken Sie oben auf „Mit KI analysieren", um eine detaillierte Produktanalyse zu starten
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
