import { useState } from 'react';
import { aiApi } from '../../lib/api';

// TEMPORÄR: Kopiere das Interface hierher
interface EmailDraftRequest {
  emailType: string;
  context: Record<string, any>;
  tone?: string;
  language?: string;
  customerName?: string;
  brandVoice?: string;
}

export function EmailGenerator() {
  const [formData, setFormData] = useState<EmailDraftRequest>({
    emailType: 'order-confirmation',
    context: { product: '', orderId: '' },
    tone: 'professional',
    language: 'de'
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await aiApi.generateEmail(formData);
      setResult(response);
    } catch (error) {
      console.error('Error generating email:', error);
      setResult({ error: 'Failed to generate email' });
    } finally {
      setLoading(false);
    }
  };

  const updateContext = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      context: { ...prev.context, [key]: value }
    }));
  };

  return (
    <div className="email-generator">
      <h2>📧 AI Email Generator</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email Type:</label>
          <select 
            value={formData.emailType} 
            onChange={(e) => setFormData(prev => ({...prev, emailType: e.target.value}))}
          >
            <option value="order-confirmation">Order Confirmation</option>
            <option value="digital-delivery">Digital Delivery</option>
            <option value="welcome-email">Welcome Email</option>
          </select>
        </div>

        <div>
          <label>Tone:</label>
          <select 
            value={formData.tone} 
            onChange={(e) => setFormData(prev => ({...prev, tone: e.target.value}))}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="enthusiastic">Enthusiastic</option>
          </select>
        </div>

        <div>
          <label>Product:</label>
          <input 
            type="text" 
            value={formData.context.product || ''}
            onChange={(e) => updateContext('product', e.target.value)}
            placeholder="Product name"
          />
        </div>

        <div>
          <label>Order ID:</label>
          <input 
            type="text" 
            value={formData.context.orderId || ''}
            onChange={(e) => updateContext('orderId', e.target.value)}
            placeholder="Order ID"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? '🔄 Generating...' : '✨ Generate Email'}
        </button>
      </form>

      {result && (
        <div className="result">
          {result.error ? (
            <p style={{color: 'red'}}>Error: {result.error}</p>
          ) : (
            <>
              <h3>📨 {result.subject}</h3>
              <div style={{whiteSpace: 'pre-wrap'}}>{result.body}</div>
              <div>
                <h4>Key Points:</h4>
                <ul>
                  {result.keyPoints?.map((point: string, i: number) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}