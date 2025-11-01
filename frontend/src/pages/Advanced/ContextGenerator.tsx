// src/pages/Advanced/ContextGenerator.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const ContextGenerator: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [contextType, setContextType] = useState('technical');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [generatedContext, setGeneratedContext] = useState<string | null>(null);

  const contextTypes = [
    { value: 'technical', label: 'Technisch', icon: '⚙️', description: 'Code & Dokumentation' },
    { value: 'marketing', label: 'Marketing', icon: '📢', description: 'Verkauf & Werbung' },
    { value: 'educational', label: 'Bildung', icon: '📚', description: 'Lerninhalte' },
    { value: 'creative', label: 'Kreativ', icon: '🎨', description: 'Content & Storytelling' }
  ];

  const detailLevels = [
    { value: 'basic', label: 'Basis', icon: '📝', description: 'Kurz & prägnant' },
    { value: 'medium', label: 'Mittel', icon: '📄', description: 'Ausgewogen' },
    { value: 'detailed', label: 'Detailliert', icon: '📋', description: 'Umfassend' },
    { value: 'expert', label: 'Experte', icon: '🎓', description: 'Tiefgehend' }
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast('Bitte gib ein Thema ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simuliere API-Call (später durch echten Endpoint ersetzen)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockContext = `# KI-Kontext für: ${topic}\n\n## Kontext-Typ: ${contextType}\n## Zielgruppe: ${targetAudience || 'Allgemein'}\n## Detail-Level: ${detailLevel}\n\n### Generierter Kontext:\n\nDieser Kontext wurde speziell für "${topic}" erstellt und optimiert die KI-Antworten für eine ${targetAudience ? targetAudience + '-Zielgruppe' : 'allgemeine Zielgruppe'}.\n\n**Wichtige Aspekte:**\n- Fokus auf ${contextType}-Inhalte\n- Optimiert für ${detailLevel}-Detailgrad\n- Strukturierte Informationsaufbereitung\n- Kontextrelevante Beispiele\n\n**Empfohlene Nutzung:**\nVerwende diesen Kontext als Basis für KI-Prompts, um konsistente und präzise Ergebnisse zu erzielen.`;

      setGeneratedContext(mockContext);
      showToast('Kontext erfolgreich generiert!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('In Zwischenablage kopiert!', 'success');
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>🧠 Context Generator</h1>
        <p>Generiere optimierte KI-Kontexte für bessere Ergebnisse</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {/* Linke Spalte: Eingabe-Formular */}
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            ⚙️ Einstellungen
          </h3>

          {/* Kontext-Typ Auswahl */}
          <div className="form-group">
            <label>Kontext-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {contextTypes.map(type => (
                <motion.div
                  key={type.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setContextType(type.value)}
                  style={{
                    padding: '14px',
                    background: contextType === type.value 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: contextType === type.value 
                      ? '2px solid rgba(102, 126, 234, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                    {type.label}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>
                    {type.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Thema */}
          <div className="form-group">
            <label>Thema / Projekt *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. E-Commerce Chatbot"
              className="form-input"
            />
          </div>

          {/* Zielgruppe */}
          <div className="form-group">
            <label>Zielgruppe</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="z.B. Entwickler, Marketing-Teams"
              className="form-input"
            />
          </div>

          {/* Detail-Level */}
          <div className="form-group">
            <label>Detail-Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {detailLevels.map(level => (
                <motion.div
                  key={level.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDetailLevel(level.value)}
                  style={{
                    padding: '12px',
                    background: detailLevel === level.value 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: detailLevel === level.value 
                      ? '2px solid rgba(102, 126, 234, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{level.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'white', marginBottom: '3px' }}>
                    {level.label}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.7, color: 'white' }}>
                    {level.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton
              onClick={handleGenerate}
              loading={loading}
              loadingText="Generiere Kontext..."
            >
              🧠 Kontext Generieren
            </LoadingButton>
          </div>
        </motion.div>

        {/* Rechte Spalte: Generierter Kontext */}
        <motion.div
          className="result-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📋 Generierter Kontext
          </h3>

          {generatedContext ? (
            <div style={{ position: 'relative' }}>
              <motion.button
                onClick={() => copyToClipboard(generatedContext)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  zIndex: 10
                }}
              >
                📋 Kopieren
              </motion.button>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '20px',
                color: 'white',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.6',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                {generatedContext}
              </div>
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
              <p>Hier erscheint der generierte KI-Kontext</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Fülle das Formular aus und klicke auf "Kontext Generieren"
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ContextGenerator;