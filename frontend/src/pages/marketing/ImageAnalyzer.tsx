
import React, { useState } from 'react';
import './ImageAnalyzer.css';
import { BackButton } from '../../components/shared/BackButton';
import { useProductManagement } from '../../hooks/useProductManagement';

const API_URL = '/api/marketing/image/analyze';


const ImageAnalyzer: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Analyse fehlgeschlagen');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-analyzer-container">
      <BackButton onClick={handleBackToDashboard} label="Zurück" />
      <h2>ImageAnalyzer – KI-Bildanalyse & SEO</h2>
      <form onSubmit={handleSubmit} className="image-analyzer-form">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={!file || loading}>
          {loading ? 'Analysiere...' : 'Bild analysieren'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h3>Analyse-Ergebnis</h3>
          <ul>
            <li><b>Beschreibung:</b> {result.description}</li>
            <li><b>Tags:</b> {result.tags?.join(', ')}</li>
            <li><b>Alt-Text:</b> {result.seo?.alt}</li>
            <li><b>Dateiname-Vorschlag:</b> {result.seo?.filename}</li>
            <li><b>Qualität:</b> {result.quality?.width}x{result.quality?.height} ({result.quality?.format})</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;
