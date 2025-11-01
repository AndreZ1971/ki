// src/pages/Advanced/StringGenerator.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

const StringGenerator: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [stringType, setStringType] = useState('id');
  const [length, setLength] = useState('16');
  const [format, setFormat] = useState('alphanumeric');
  const [generatedString, setGeneratedString] = useState<string | null>(null);

  const stringTypes = [
    { value: 'id', label: 'Unique ID', icon: '🆔', description: 'UUID/GUID' },
    { value: 'password', label: 'Password', icon: '🔐', description: 'Sicheres Passwort' },
    { value: 'token', label: 'API Token', icon: '🔑', description: 'Auth Token' },
    { value: 'slug', label: 'URL Slug', icon: '🔗', description: 'SEO-freundlich' }
  ];

  const formats = [
    { value: 'alphanumeric', label: 'Alphanumerisch', icon: '🔤' },
    { value: 'numeric', label: 'Nur Zahlen', icon: '🔢' },
    { value: 'alphabetic', label: 'Nur Buchstaben', icon: '🔠' },
    { value: 'hexadecimal', label: 'Hexadezimal', icon: '⬡' }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let generated = '';
      const len = parseInt(length) || 16;
      
      if (format === 'numeric') {
        generated = Math.random().toString().slice(2, 2 + len);
      } else if (format === 'hexadecimal') {
        generated = Array.from({length: len}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      } else if (format === 'alphabetic') {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        generated = Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      } else {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        generated = Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      }

      if (stringType === 'id') {
        generated = `${generated.slice(0,8)}-${generated.slice(8,12)}-${generated.slice(12,16)}-${generated.slice(16)}`;
      } else if (stringType === 'slug') {
        generated = generated.toLowerCase().replace(/[^a-z0-9]/g, '-');
      }

      setGeneratedString(generated);
      showToast('String erfolgreich generiert!', 'success');
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

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1>🔤 String Generator</h1>
        <p>Intelligente String-Generierung für verschiedene Use-Cases</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>⚙️ Einstellungen</h3>

          <div className="form-group">
            <label>String-Typ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {stringTypes.map(type => (
                <motion.div key={type.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setStringType(type.value)}
                  style={{ padding: '14px', background: stringType === type.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: stringType === type.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>{type.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>{type.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Länge</label>
            <input type="number" value={length} onChange={(e) => setLength(e.target.value)} min="4" max="128" className="form-input" />
          </div>

          <div className="form-group">
            <label>Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {formats.map(fmt => (
                <motion.div key={fmt.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setFormat(fmt.value)}
                  style={{ padding: '12px', background: format === fmt.value ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                    border: format === fmt.value ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{fmt.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{fmt.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <LoadingButton onClick={handleGenerate} loading={loading} loadingText="Generiere...">🔤 String Generieren</LoadingButton>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>📋 Generierter String</h3>
          {generatedString ? (
            <div style={{ position: 'relative' }}>
              <motion.button onClick={() => copyToClipboard(generatedString)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={{ position: 'absolute', top: '10px', right: '10px', padding: '8px 16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', zIndex: 10 }}>📋 Kopieren</motion.button>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', color: 'white',
                fontFamily: 'monospace', fontSize: '16px', wordBreak: 'break-all' }}>{generatedString}</div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔤</div>
              <p>Hier erscheint der generierte String</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StringGenerator;