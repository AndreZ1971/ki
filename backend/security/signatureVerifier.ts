/**
 * RSA-4096 Signature Verification for Specializations
 * 
 * Verifies that specialization files are signed by WooCommerce
 * and have not been tampered with. Uses RSA-4096 with SHA-256 hashing.
 * 
 * This ensures revenue protection - only officially signed specializations
 * from WooCommerce can be uploaded to the container.
 */

import { createVerify } from 'crypto';
import { SignatureVerificationResult } from './signatureTypes';

// RSA-4096 Public Key (SPKI format)
// This is used to verify signatures created with the corresponding private key
// The private key is stored securely in WooCommerce and must never be committed to this repo
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEApP3m+NQ8FOH81lmGT4Y2
7KuYhro+e7JFG8ZqAGWp6D0Qwuf2lw/juljS9FR1DVxPDWN7EtD09RK4ekoj+hYC
+JR+tfz4d9GeOXhCBDnUKeKbeUT/1DKBbr0RO7J47NVlBhJkBq+AFOxksE/UrpkC
xPR44Y6bmv78y8I/J6ukFU+r+QC5DCY3ackT7tM2I/uSm+trIZpgYZ1lMSP3jK/T
Mfbd1lwJ9QBzH3SzJY5DzaeV0p6Nhd/+vLQiwrGNlSSlTsBYoWgsDAA2v0d7t+ov
HqTaGAmqOUD/tm9KLZGhtyUDTl/tuOVpKPM5cauC+5ltV2mYsbJv9P7H8OwpYiqU
XcDo1wuV4n0Aa+VkuTBxfByMpQ2qomEdTNPJp0e/0234UvADZNqaRhE5BsdklHbW
pVtN+Tf4CEo4JY0Oxe41lKqgUhAv11rruBb+8IC3+3i+fLwKwanQewaC1gQlBqYz
RXQbFetaCK5fVxLzJeiNAAeiUSwujeWiLAjxe42l2yn/vFAMeQqnQgJlKt9ejWzu
0oQGKEm6hk9useAZMXanxOnv751xtMiUIYohQjFyKDkN06vxSQimb/tRTrdIlM4l
9qwqK69A+ZFH8yXqUJ3AUzXssjDhJ/nrdm2HyTzEz5uzKZUR2OZ/kzDsdB8y7F1P
Y+WWFCoeo/TB2px2lg2OYbECAwEAAQ==
-----END PUBLIC KEY-----`;

/**
 * Verify an RSA-4096 signature on specialization data
 * 
 * @param data - The data that was signed (typically stringified spec object)
 * @param signatureB64 - The signature in Base64 format
 * @returns SignatureVerificationResult with valid flag and optional error message
 * 
 * @example
 * const result = verifySignature(JSON.stringify(spec), signatureBase64);
 * if (!result.valid) {
 *   console.error('Signature invalid:', result.error);
 * }
 */
export function verifySignature(
  data: string,
  signatureB64: string
): SignatureVerificationResult {
  try {
    // Validate input
    if (!data || typeof data !== 'string') {
      return {
        valid: false,
        error: 'Data must be a non-empty string'
      };
    }

    if (!signatureB64 || typeof signatureB64 !== 'string') {
      return {
        valid: false,
        error: 'Signature must be a non-empty Base64 string'
      };
    }

    // Decode Base64 signature to Buffer
    let signatureBuffer: Buffer;
    try {
      signatureBuffer = Buffer.from(signatureB64, 'base64');
    } catch (_error) {
      return {
        valid: false,
        error: 'Signature is not valid Base64'
      };
    }

    // Verify signature using RSA-SHA256
    const verifier = createVerify('RSA-SHA256');
    verifier.update(data);
    const isValid = verifier.verify(PUBLIC_KEY, signatureBuffer);

    if (isValid) {
      return { valid: true };
    } else {
      return {
        valid: false,
        error: 'Signature verification failed - specialization may have been tampered with'
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      error: `Signature verification error: ${errorMessage}`
    };
  }
}

/**
 * Verify a complete signed specialization object
 * 
 * @param signedSpec - Object with spec, signature, timestamp, issuer
 * @returns SignatureVerificationResult
 * 
 * @example
 * const result = verifySignedSpecialization({
 *   spec: {...},
 *   signature: "...",
 *   timestamp: "2026-02-02T...",
 *   issuer: "woocommerce"
 * });
 */
export function verifySignedSpecialization(
  signedSpec: any
): SignatureVerificationResult {
  // Validate structure
  if (!signedSpec || typeof signedSpec !== 'object') {
    return {
      valid: false,
      error: 'Signed specialization must be an object'
    };
  }

  if (!signedSpec.spec) {
    return {
      valid: false,
      error: 'Signed specialization must contain a "spec" field'
    };
  }

  if (!signedSpec.signature) {
    return {
      valid: false,
      error: 'Signed specialization must contain a "signature" field'
    };
  }

  if (signedSpec.issuer && signedSpec.issuer !== 'woocommerce') {
    return {
      valid: false,
      error: 'Specialization issuer must be "woocommerce"'
    };
  }

  // Verify the signature on the spec data
  const specData = JSON.stringify(signedSpec.spec);
  return verifySignature(specData, signedSpec.signature);
}
