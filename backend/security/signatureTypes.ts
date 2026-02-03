/**
 * Signature verification types for specializations
 * Ensures specializations are signed by WooCommerce and cannot be tampered with
 */

export interface SignedSpecialization {
  spec: Record<string, unknown>;
  signature: string; // Base64-encoded RSA signature
  timestamp: string; // ISO 8601 timestamp
  issuer: string; // Should be "woocommerce"
}

export interface SpecializationUploadPayload {
  spec?: Record<string, unknown>;
  signature?: string;
  timestamp?: string;
  issuer?: string;
}

export interface SignatureVerificationResult {
  valid: boolean;
  error?: string;
}
