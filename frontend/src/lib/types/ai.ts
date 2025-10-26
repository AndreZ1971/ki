// AI Request/Response Types für alle Endpoints
export interface EmailDraftRequest {
  emailType: string;
  context: Record<string, any>;
  tone?: string;
  language?: string;
  customerName?: string;
  brandVoice?: string;
}

export interface EmailDraftResponse {
  success: boolean;
  subject: string;
  body: string;
  keyPoints: string[];
  personalizationTips: string[];
  error?: string;
}

export interface ChatResponseRequest {
  message: string;
  context: Record<string, any>;
  tone?: string;
  language?: string;
  customerName?: string;
  responseLength?: string;
}

export interface ChatResponseResponse {
  success: boolean;
  response: string;
  suggestedFollowUp: string;
  keyPoints: string[];
  error?: string;
}