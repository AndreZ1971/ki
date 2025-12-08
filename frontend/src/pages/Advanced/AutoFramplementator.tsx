// src/pages/Advanced/AutoFramplementator.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { MLSupportGenerator } from './MLSupportGenerator';
import './page.css';

const AutoFramplementator: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [framework, setFramework] = useState('react');
  const [projectName, setProjectName] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const frameworks = [
    { value: 'react', label: 'React', icon: '⚛️', description: 'React 19 + TypeScript' },
    { value: 'vue', label: 'Vue.js', icon: '💚', description: 'Vue 3 Composition API' },
    { value: 'angular', label: 'Angular', icon: '🅰️', description: 'Angular 17+' },
    { value: 'svelte', label: 'Svelte', icon: '🔥', description: 'SvelteKit' }
  ];

  const availableFeatures = [
    { value: 'routing', label: 'Routing', icon: '🛣️' },
    { value: 'state', label: 'State Management', icon: '🗂️' },
    { value: 'api', label: 'API Integration', icon: '🔌' },
    { value: 'auth', label: 'Authentication', icon: '🔐' },
    { value: 'ui', label: 'UI Components', icon: '🎨' },
    { value: 'tests', label: 'Testing Setup', icon: '🧪' }
  ];

  const toggleFeature = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleGenerate = async () => {
    if (!projectName.trim()) {
      showToast('Bitte gib einen Projektnamen ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const code = `// ${projectName} - ${framework.toUpperCase()} Project Setup

// Package.json
{
  "name": "${projectName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "${framework}": "latest"${features.includes('routing') ? ',\n    "react-router-dom": "^6.0.0"' : ''}${features.includes('state') ? ',\n    "zustand": "^4.0.0"' : ''}${features.includes('api') ? ',\n    "axios": "^1.6.0"' : ''}
  }
}

// Main Component
${framework === 'react' ? `import React from 'react';
${features.includes('routing') ? "import { BrowserRouter, Routes, Route } from 'react-router-dom';" : ''}
${features.includes('state') ? "import { create } from 'zustand';" : ''}

function App() {
  return (
    <div className="app">
      <h1>Welcome to ${projectName}</h1>
      ${features.includes('routing') ? '<Routes><Route path="/" element={<Home />} /></Routes>' : ''}
    </div>
  );
}

export default App;` : `// ${framework.toUpperCase()} implementation`}

// Features: ${features.join(', ') || 'None'}
// Framework: ${framework}
// Ready to use! 🚀`;

      setGeneratedCode(code);
      showToast('Framework erfolgreich generiert!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
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
        <h1>🔄 Auto Framplementator</h1>
        <p>Automatische Framework-Implementierung für neue Projekte</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>⚙️ Projekt-Konfiguration</h3>

          <div className="form-group">
            <label>Framework wählen</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {frameworks.map(fw => (
                <motion.div key={fw.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setFramework(fw.value)}
                  style={{ padding: '14px', background: framework === fw.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: framework === fw.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{fw.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{fw.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{fw.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Projektname *</label>
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="z.B. my-awesome-app" className="form-input" />
          </div>

          <div className="form-group">
            <label>Features auswählen</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
              {availableFeatures.map(feat => (
                <motion.div key={feat.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => toggleFeature(feat.value)}
                  style={{ padding: '10px', background: features.includes(feat.value) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: features.includes(feat.value) ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{feat.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>{feat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleGenerate} loading={loading} loadingText="Generiere Setup...">🔄 Framework Generieren</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>� Generierter Code</h3>
          {generatedCode ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', color: 'white',
              fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '600px', overflowY: 'auto' }}>{generatedCode}</div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
              <p>Hier erscheint der generierte Framework-Code</p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="support-ml-section">
        <h3>KI-Support-Generator</h3>
        {/* Beispielhafter Ticket-Text, kann dynamisch ersetzt werden */}
        <MLSupportGenerator ticketText="Mein Produkt funktioniert nicht wie erwartet. Bitte helfen Sie mir!" />
      </div>
    </div>
  );
};

export default AutoFramplementator;