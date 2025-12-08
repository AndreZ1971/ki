import React, { useState } from 'react';

interface ProductAnalysisProps {
  productId: number;
}

interface AnalysisResult {
  score: number;
  basicInfo: {
    title: string;
    price: string;
    stock: string;
    categories: string[];
  };
  aiAnalysis?: {
    seoScore?: number;
    contentScore?: number;
    pricingScore?: number;
    seoIssues?: string[];
    contentIssues?: string[];
    pricingIssues?: string[];
    improvementSuggestions?: string[];
  };
  metrics?: Record<string, any>;
  recommendations: string[];
  timestamp: string;
}

export const ProductAnalysis: React.FC<ProductAnalysisProps> = ({ productId }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/optimizer/analyze/${productId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.analysis);
      } else {
        setError(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Analyse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-analysis">
      <button onClick={fetchAnalysis} disabled={loading}>
        Produkt mit KI analysieren
      </button>
      {loading && <div>Analyse läuft...</div>}
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="analysis-result">
          <h3>KI-Produktanalyse</h3>
          <div><strong>Score:</strong> {result.score} / 100</div>
          <div><strong>Titel:</strong> {result.basicInfo.title}</div>
          <div><strong>Preis:</strong> {result.basicInfo.price} €</div>
          <div><strong>Lager:</strong> {result.basicInfo.stock}</div>
          <div><strong>Kategorien:</strong> {result.basicInfo.categories.join(', ')}</div>
          {result.aiAnalysis && (
            <div className="ai-section">
              <h4>AI-Analyse</h4>
              <div>SEO-Score: {result.aiAnalysis.seoScore}</div>
              <div>Content-Score: {result.aiAnalysis.contentScore}</div>
              <div>Pricing-Score: {result.aiAnalysis.pricingScore}</div>
              <div>
                <strong>Verbesserungsvorschläge:</strong>
                <ul>
                  {result.aiAnalysis.improvementSuggestions?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div>
            <strong>Empfehlungen:</strong>
            <ul>
              {result.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
