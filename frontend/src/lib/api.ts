import type { EmailDraftRequest, EmailDraftResponse } from './types/ai';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const AI_BASE = API_BASE + '/api/ai/email';
const EMAIL_BASE = API_BASE + '/api/email';

export const aiApi = {
  async generateEmail(data: EmailDraftRequest): Promise<EmailDraftResponse> {
    const response = await fetch(`${AI_BASE}/email-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  }
};

export const emailApi = {
  async sendEmail(payload: { customers: Array<{ id: string; name: string; email: string }>; subject: string; body: string; emailType: string }) {
    const response = await fetch(`${EMAIL_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  },
  async testSmtp() {
    const response = await fetch(`${EMAIL_BASE}/test-smtp`);
    return await response.json();
  }
};

// Weitere API Calls folgen...
