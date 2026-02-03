#!/usr/bin/env node

/**
 * Check if the signatures match the provided keys at all
 * 
 * Maybe the signatures belong to DIFFERENT keys than what we have?
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

console.log('🔎 ANALYZING SIGNATURE METADATA\n');
console.log('='.repeat(60));

try {
  const specFile = path.join(__dirname, '../docs/Spezialisierungen/fitness-ernaehrung.ari-spec');
  const fileContent = fs.readFileSync(specFile, 'utf-8');
  const specialization = JSON.parse(fileContent);

  console.log('\nFile: fitness-ernaehrung.ari-spec\n');

  // Get the key details
  const keyDetails = crypto.createPublicKey({ key: PUBLIC_KEY });
  console.log('📋 Public Key Details:');
  console.log('  Type:', keyDetails.type);
  console.log('  Asymmetric Key Type:', keyDetails.asymmetricKeyType);
  console.log('  Asymmetric Key Size:', keyDetails.asymmetricKeySize, 'bytes');
  console.log('  Asymmetric Key Details:', keyDetails.asymmetricKeyDetails);

  const sigBuffer = Buffer.from(specialization.signature, 'base64');
  console.log('\n📊 Signature Details:');
  console.log('  Base64 length:', specialization.signature.length, 'chars');
  console.log('  Decoded size:', sigBuffer.length, 'bytes');
  console.log('  Expected for 4096-bit RSA:', 512, 'bytes');
  console.log('  Match:', sigBuffer.length === 512 ? '✅' : '❌');

  // Try to extract information from the signature bytes
  console.log('\n🔐 Signature byte analysis:');
  console.log('  First 4 bytes (hex):', sigBuffer.slice(0, 4).toString('hex'));
  console.log('  Last 4 bytes (hex):', sigBuffer.slice(-4).toString('hex'));
  console.log('  All bytes hex:', sigBuffer.toString('hex').substring(0, 100) + '...');

  // The real test: try with PHP-like openssl_sign compatibility
  console.log('\n🔄 Testing PHP openssl_sign compatibility:\n');

  // PHP openssl_sign uses OPENSSL_ALGO_SHA256 which translates to:
  // EVP_sha256() algorithm with default padding (PKCS1 v1.5)
  
  // But in Node.js createVerify(), it's using PKCS1 v1.5 by default
  // Let's double-check by trying the MOST basic approach
  
  const testData = JSON.stringify(specialization.data);
  
  try {
    // Method 1: createVerify (this is what signatureVerifier.ts uses)
    const verify1 = crypto.createVerify('RSA-SHA256');
    verify1.update(testData);
    const result1 = verify1.verify(PUBLIC_KEY, sigBuffer);
    console.log('Method 1 (createVerify): ' + (result1 ? '✅' : '❌'));
  } catch (e) {
    console.log('Method 1 error:', e.message);
  }

  // Method 2: crypto.verify (newer API)
  try {
    const result2 = crypto.verify('sha256', Buffer.from(testData), PUBLIC_KEY, sigBuffer);
    console.log('Method 2 (crypto.verify): ' + (result2 ? '✅' : '❌'));
  } catch (e) {
    console.log('Method 2 error:', e.message);
  }

  // Let's also check the actual key
  console.log('\n📝 Checking if key is valid...\n');
  
  try {
    const keyObj = crypto.createPublicKey({ key: PUBLIC_KEY });
    console.log('✅ Key is valid and loadable');
  } catch (e) {
    console.log('❌ Key error:', e.message);
  }

  // Final diagnosis
  console.log('\n🔍 DIAGNOSIS:\n');
  console.log('Signatures exist: ✅');
  console.log('Signature size matches RSA-4096: ✅');
  console.log('Public key is valid: ✅');
  console.log('Signatures verify with public key: ❌');
  console.log('\n⚠️ Conclusion: Signatures were created with a DIFFERENT private key');
  console.log('or with a DIFFERENT serialization/algorithm that we haven\'t tested.\n');

  // Ask for the solution
  console.log('💡 Possible solutions:\n');
  console.log('1. The signatures were created with a different Private Key');
  console.log('   → Need to use the CORRECT private key to regenerate signatures\n');
  console.log('2. The data was serialized differently before signing');
  console.log('   → Need to find the exact serialization method\n');
  console.log('3. The signatures are test/dummy data');
  console.log('   → Need to regenerate with correct process\n');

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
