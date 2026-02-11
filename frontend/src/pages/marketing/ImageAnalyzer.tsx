
import React, { useState } from 'react';
import './ImageAnalyzer.css';
import { BackButton } from '../../components/shared/BackButton';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { motion } from 'framer-motion';
import { productApi } from '../../services/productApi';

interface AnalysisResult {
  quality: any;
  tags: any[];
  seo: any;
  optimizations: any[];
  classification: any;
  performance: any;
  success: boolean;
}

const ImageAnalyzer: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Orchestration Status
  const [orchestrationStatus, setOrchestrationStatus] = useState<{
    mode: 'real' | 'partial' | 'failed' | 'error';
    dataCompleteness: number;
    steps: Array<{ name: string; status: 'success' | 'failed' | 'pending'; mode: string }>;
  } | null>(null);

  // Full Analysis Results
  const [fullResults, setFullResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setError(null);
      
      // Preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      showToast(`📷 ${selectedFile.name} ausgewählt`, 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setFullResults(null);
    setOrchestrationStatus({
      mode: 'real',
      dataCompleteness: 0,
      steps: [
        { name: 'Basis-Analyse', status: 'pending', mode: 'real' },
        { name: 'Farbanalyse', status: 'pending', mode: 'real' },
        { name: 'Verbesserungsvorschläge', status: 'pending', mode: 'real' },
        { name: 'Conversion-Prognose', status: 'pending', mode: 'real' },
        { name: 'Zielgruppen-Analyse', status: 'pending', mode: 'real' }
      ]
    });
    
    try {
      const response = await productApi.fullImageAnalysis(file);
      
      if (response.success && response.data) {
        setOrchestrationStatus({
          mode: response.mode,
          dataCompleteness: response.completeness,
          steps: response.steps
        });
        setFullResults(response.data);
        
        // Legacy result für alte UI-Teile
        if (response.data.basicAnalysis) {
          setResult({ ...response.data.basicAnalysis, success: true });
        }
        
        const successCount = response.steps.filter((s: any) => s.status === 'success').length;
        showToast(`✅ Analyse abgeschlossen! ${successCount}/${response.steps.length} Schritte erfolgreich`, 'success');
      } else {
        throw new Error(response.error || 'Analyse fehlgeschlagen');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unbekannter Fehler';
      setError(errorMessage);
      setOrchestrationStatus({
        mode: 'error',
        dataCompleteness: 0,
        steps: [
          { name: 'Basis-Analyse', status: 'failed', mode: 'error' },
          { name: 'Farbanalyse', status: 'failed', mode: 'error' },
          { name: 'Verbesserungsvorschläge', status: 'failed', mode: 'error' },
          { name: 'Conversion-Prognose', status: 'failed', mode: 'error' },
          { name: 'Zielgruppen-Analyse', status: 'failed', mode: 'error' }
        ]
      });
      showToast(`❌ ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="image-analyzer-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <BackButton onClick={handleBackToDashboard} label="Zurück" />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="image-analyzer-header"
        style={{ marginBottom: '40px' }}
      >
        <h1>🎨 Image Analyzer - KI-Bildanalyse</h1>
        <p>Automatische Bildqualitäts-, SEO- und Performance-Analyse mit KI</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        {/* UPLOAD SECTION */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="image-analyzer-form"
          style={{ 
            padding: '30px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
            borderRadius: '12px',
            border: '2px dashed rgba(139, 92, 246, 0.3)'
          }}
        >
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', marginBottom: '20px', cursor: 'pointer' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{
                padding: '40px',
                textAlign: 'center',
                border: '2px dashed rgba(139, 92, 246, 0.5)',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
                <div style={{ color: 'white', fontWeight: '600', marginBottom: '5px' }}>Bild hochladen</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>oder Datei herziehen</div>
              </div>
            </label>

            {file && (
              <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                <div style={{ color: 'rgba(16, 185, 129, 0.8)', fontSize: '12px' }}>
                  ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={!file || loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '20px',
                background: !file || loading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: !file || loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {loading ? '🔄 Analysiere...' : '🚀 Jetzt analysieren'}
            </button>
          </form>

          {/* Orchestration Status */}
          {orchestrationStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '20px',
                padding: '16px',
                background: orchestrationStatus.mode === 'error' 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))'
                  : orchestrationStatus.mode === 'partial'
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                border: `1px solid ${orchestrationStatus.mode === 'error' ? '#ef4444' : orchestrationStatus.mode === 'partial' ? '#fbbf24' : '#10b981'}`,
                borderRadius: '8px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <strong style={{ color: 'white', fontSize: '14px' }}>
                  {orchestrationStatus.mode === 'error' ? '❌ Analyse fehlgeschlagen' 
                    : orchestrationStatus.mode === 'partial' ? '⚠️ Teilweise erfolgreich'
                    : '✅ Vollständig analysiert'}
                </strong>
                <span style={{ 
                  color: orchestrationStatus.mode === 'error' ? '#ef4444' : orchestrationStatus.mode === 'partial' ? '#fbbf24' : '#10b981',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {orchestrationStatus.dataCompleteness}%
                </span>
              </div>
              
              <div style={{ fontSize: '12px', display: 'grid', gap: '6px' }}>
                {orchestrationStatus.steps.map((step, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px'
                  }}>
                    <span style={{ fontSize: '14px' }}>
                      {step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⏳'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', flex: 1 }}>{step.name}</span>
                    <span style={{ 
                      fontSize: '10px', 
                      color: step.status === 'success' ? '#10b981' : step.status === 'failed' ? '#ef4444' : '#fbbf24',
                      fontWeight: 'bold'
                    }}>
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* PREVIEW */}
        {preview && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '12px' }}>📷 Vorschau</h3>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                borderRadius: '8px',
                maxHeight: '300px',
                objectFit: 'contain'
              }} 
            />
          </motion.div>
        )}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '30px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5'
          }}
        >
          ❌ {error}
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="result"
          style={{ marginTop: '40px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {/* QUALITY SCORE */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1))',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>📊 Bildqualität</h3>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: result.quality.overallQuality >= 80 ? '#10b981' : result.quality.overallQuality >= 60 ? '#f59e0b' : '#ef4444',
                marginBottom: '12px'
              }}>
                {result.quality.overallQuality}%
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'grid', gap: '6px' }}>
                <div>📐 Auflösung: {result.quality.width}×{result.quality.height} ({result.quality.resolution})</div>
                <div>🎨 Kontrast: {result.quality.contrastScore}%</div>
                <div>🔍 Schärfe: {result.quality.sharpnessScore}%</div>
                <div>🎯 Farbe: {result.quality.colorProfileScore}%</div>
              </div>
            </div>

            {/* CLASSIFICATION */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>🎯 Bildtyp</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px', textTransform: 'capitalize' }}>
                {result.classification.type}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'grid', gap: '4px' }}>
                <div>💡 Variante: {result.classification.subType}</div>
                <div>📊 Konfidenz: {result.classification.confidence}%</div>
                <div>✅ Einsatz: {result.classification.useCase.join(', ')}</div>
              </div>
            </div>

            {/* PERFORMANCE */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))',
              borderRadius: '12px',
              border: '1px solid rgba(249, 115, 22, 0.2)'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>⚡ Performance</h3>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'grid', gap: '6px' }}>
                <div>💾 Dateigröße: {result.performance.estimatedFileSize}</div>
                <div>⏱️ Ladezeit: {result.performance.loadTimeImpact}</div>
                <div>📉 Ersparnis: {result.performance.estimatedBandwidthSavings}</div>
                <div>🎯 Optimierungs-Potenzial: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{result.performance.optimizationPotential}%</span></div>
              </div>
            </div>

            {/* SEO */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              gridColumn: 'span 2'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>🔍 SEO & Accessibility</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '4px' }}>Alt-Text</div>
                  <div style={{ color: 'white', fontSize: '12px', wordBreak: 'break-word' }}>"{result.seo.alt}"</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '4px' }}>Dateiname</div>
                  <div style={{ color: '#fbbf24', fontSize: '12px' }}>/{result.seo.filename}.jpg</div>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '4px' }}>Keywords</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {result.seo.keywords.map((keyword: string, idx: number) => (
                    <span key={idx} style={{
                      padding: '4px 12px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '20px',
                      fontSize: '11px',
                      color: '#d8b4fe'
                    }}>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Accessibility Score</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: result.seo.accessibilityScore >= 80 ? '#10b981' : result.seo.accessibilityScore >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {result.seo.accessibilityScore}%
                </div>
              </div>
            </div>

            {/* TAGS */}
            <div style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              gridColumn: 'span 2'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>🏷️ KI-Tags mit Konfidenz</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {result.tags.map((tagItem: any, idx: number) => (
                  <div key={idx} style={{
                    padding: '10px',
                    background: `rgba(${
                      tagItem.category === 'object' ? '99,102,241' :
                      tagItem.category === 'style' ? '34,197,94' :
                      tagItem.category === 'emotion' ? '249,115,22' :
                      tagItem.category === 'action' ? '59,130,246' :
                      '139,92,246'
                    }, ${tagItem.confidence * 0.3})`,
                    border: `1px solid rgba(${
                      tagItem.category === 'object' ? '99,102,241' :
                      tagItem.category === 'style' ? '34,197,94' :
                      tagItem.category === 'emotion' ? '249,115,22' :
                      tagItem.category === 'action' ? '59,130,246' :
                      '139,92,246'
                    }, 0.5)`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white',
                    minWidth: '120px'
                  }}>
                    <span>{tagItem.tag}</span>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {(tagItem.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* OPTIMIZATIONS */}
            {result.optimizations && result.optimizations.length > 0 && (
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                gridColumn: 'span 2'
              }}>
                <h3 style={{ color: 'white', marginTop: 0 }}>💡 Optimierungsvorschläge</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {result.optimizations.map((opt: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${opt.priority === 'high' ? '#ef4444' : opt.priority === 'medium' ? '#f59e0b' : '#10b981'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                        <div style={{ fontWeight: '600', color: 'white', textTransform: 'capitalize' }}>{opt.type}</div>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          background: opt.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : opt.priority === 'medium' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: opt.priority === 'high' ? '#fca5a5' : opt.priority === 'medium' ? '#fed7aa' : '#86efac',
                          borderRadius: '3px'
                        }}>
                          {opt.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>{opt.description}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>💰 Nutzen: {opt.expectedBenefit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PHASE 2: EXTENDED ANALYSIS RESULTS */}
      {fullResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            marginTop: '30px'
          }}
        >
          <h2 style={{ color: 'white', marginTop: 0 }}>🚀 Erweiterte Analysen</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>Detaillierte Business-Intelligence für maximale Performance</p>
          
          {/* Color Analysis Results */}
          {fullResults.colors && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>🎨 Farbpalette & Harmonie</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                {fullResults.colors.palette?.map((color: string, idx: number) => (
                  <div key={idx} style={{
                    width: '60px',
                    height: '60px',
                    background: color,
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    padding: '5px'
                  }}>
                    <span style={{ fontSize: '9px', color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{color}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                <div><strong>Harmonie:</strong> {fullResults.colors.harmony}</div>
                <div><strong>Score:</strong> {fullResults.colors.harmonyScore}/100</div>
                <div><strong>Helligkeit:</strong> {fullResults.colors.brightness}%</div>
                <div><strong>Sättigung:</strong> {fullResults.colors.saturation}%</div>
              </div>
            </motion.div>
          )}

          {/* Enhancement Suggestions */}
          {fullResults.enhancements && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>✨ Auto-Enhancement Vorschläge ({fullResults.enhancements.totalSuggestions})</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {fullResults.enhancements.suggestions?.map((sug: any, idx: number) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${sug.priority === 'high' ? '#ef4444' : sug.priority === 'medium' ? '#f59e0b' : '#10b981'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div style={{ color: 'white', fontWeight: '600' }}>{sug.description}</div>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        background: sug.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                        color: sug.priority === 'high' ? '#fca5a5' : '#fed7aa',
                        borderRadius: '3px'
                      }}>{sug.priority}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>💰 {sug.expectedImprovement}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Conversion Impact */}
          {fullResults.conversionImpact && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>📊 Conversion-Impact Vorhersage</h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '15px'
              }}>
                <div style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  {fullResults.conversionImpact.estimatedConversionLift}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Geschätzte Conversion-Steigerung</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Confidence: {(fullResults.conversionImpact.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}><strong>Einflussfaktoren:</strong></div>
                {Object.entries(fullResults.conversionImpact.factors || {}).map(([key, value]) => (
                  <div key={key} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                    • {key}: {String(value)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Audience Recommendation */}
          {fullResults.audience && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ color: 'white', marginTop: 0 }}>👥 Zielgruppen-Empfehlung</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Altersgruppe</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>{fullResults.audience.ageGroup}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Gender-Bias</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#a78bfa' }}>{fullResults.audience.genderBias}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Einkommensklasse</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24' }}>{fullResults.audience.incomeLevel}</div>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}><strong>Empfohlene Plattformen:</strong></div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {fullResults.audience.bestPlatforms?.map((platform: string, idx: number) => (
                    <span key={idx} style={{
                      padding: '6px 14px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#93c5fd'
                    }}>
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              {fullResults.audience.recommendations && fullResults.audience.recommendations.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}><strong>Detaillierte Empfehlungen:</strong></div>
                  {fullResults.audience.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '6px'
                    }}>
                      {rec.demographic} <span style={{ color: '#10b981', fontWeight: 'bold' }}>({(rec.confidence * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ImageAnalyzer;