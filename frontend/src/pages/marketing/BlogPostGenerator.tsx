import React, { useState } from 'react';
import './BlogPostGenerator.css';
// Entfernt: useNavigate (ungenuzt)
import { BackButton } from '../../components/shared/BackButton';
import { useProductManagement } from '../../hooks/useProductManagement';

const BlogPostGenerator: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  // Entfernt: navigate (ungenuzt)
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [seo, setSeo] = useState(true);
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [language, setLanguage] = useState('de');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('/api/marketing/blogpost/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          seo,
          length,
          language
        })
      });
      const data = await response.json();
      if (data.success) setResult(data.content);
      else setResult('Fehler: ' + (data.error || 'Unbekannt'));
    } catch (_e) {
      setResult('Fehler beim Generieren.');
    }
    setLoading(false);
  };

  return (
    <div className="blogpost-generator-container">
      <BackButton onClick={handleBackToDashboard} />
      <h2>KI-Blogpost Generator</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Thema:&nbsp;
          <input value={topic} onChange={e => setTopic(e.target.value)} style={{ width: 300 }} />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Keywords (kommagetrennt):&nbsp;
          <input value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: 300 }} />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>SEO-Optimierung:&nbsp;
          <input type="checkbox" checked={seo} onChange={e => setSeo(e.target.checked)} />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Länge:&nbsp;
          <select value={length} onChange={e => setLength(e.target.value as any)}>
            <option value="short">Kurz</option>
            <option value="medium">Mittel</option>
            <option value="long">Lang</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Sprache:&nbsp;
          <input value={language} onChange={e => setLanguage(e.target.value)} style={{ width: 100 }} />
        </label>
      </div>
      <button onClick={handleGenerate} disabled={loading || !topic}>
        {loading ? 'Generiere...' : 'Blogpost generieren'}
      </button>
      <div style={{ marginTop: 24 }}>
        <h3>Ergebnis</h3>
        <textarea value={result} readOnly rows={16} style={{ width: '100%' }} />
      </div>
    </div>
  );
};

export default BlogPostGenerator;
