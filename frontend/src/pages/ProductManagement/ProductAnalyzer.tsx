// ProductAnalyzer.tsx - Standalone Product Analysis Tool
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { ProductAnalysis } from '../app/ProductAnalysis';
import './page.css';

const ProductAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const { handleBackToDashboard } = useProductManagement();
  const { toasts } = useToast();
  
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [productIdInput, setProductIdInput] = useState<string>('1');
  const [toastList, setToastList] = useState<any[]>([]);

  const handleAnalyzeProduct = useCallback(() => {
    const id = parseInt(productIdInput, 10);
    if (id && id > 0) {
      setSelectedProductId(id);
    }
  }, [productIdInput]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyzeProduct();
    }
  };

  return (
    <div className="app-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <button className="back-button floating-back" onClick={handleBackToDashboard}>← Zurück</button>
          <h1 style={{ marginTop: '16px' }}>🔍 Product Analyzer & Optimizer</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>
            Analysiere deine Produkte mit KI und erhalte detaillierte Optimierungsvorschläge
          </p>
        </div>
      </div>

      {/* Product ID Input */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase' }}>
          🎯 Produkt auswählen
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>
              Produkt-ID
            </label>
            <input
              type="number"
              value={productIdInput}
              onChange={(e) => setProductIdInput(e.target.value)}
              onKeyPress={handleKeyPress}
              min="1"
              placeholder="z.B. 123"
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={handleAnalyzeProduct}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(52, 199, 89, 0.2))',
              border: '1px solid rgba(0, 122, 255, 0.5)',
              borderRadius: '8px',
              color: '#007aff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 122, 255, 0.4), rgba(52, 199, 89, 0.3))';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 122, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(52, 199, 89, 0.2))';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔍 Analysieren
          </button>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>
          💡 Geben Sie die WooCommerce Produkt-ID ein, um eine detaillierte KI-Analyse zu starten
        </div>
      </div>

      {/* Product Analysis Component */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <ProductAnalysis productId={selectedProductId} />
      </div>

      {/* Toast Container */}
      <ToastContainer 
        toasts={toastList}
        onRemove={(id: string) => setToastList(toastList.filter(t => t.id !== id))}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default ProductAnalyzer;
