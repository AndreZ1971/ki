import type { EmailDraftRequest, EmailDraftResponse } from './types/ai';

const API_BASE = import.meta.env.VITE_API_URL + '/ai';

export const aiApi = {
  async generateEmail(data: EmailDraftRequest): Promise<EmailDraftResponse> {
    const response = await fetch(`${API_BASE}/email-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  }
};

  // Weitere API Calls folgen...
