#!/usr/bin/env node

/**
 * Test Signature Verification - PSS Padding
 * 
 * Tests if signatures were created with RSA_PKCS1_PSS_PADDING
 * (as documented in SECURITY.md)
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

function testWithPSSPadding() {
  try {
    const specFile = path.join(__dirname, '../docs/Spezialisierungen/fitness-ernaehrung.ari-spec');
    const fileContent = fs.readFileSync(specFile, 'utf-8');
    const specialization = JSON.parse(fileContent);

    console.log('🔬 TESTING WITH PSS PADDING (from SECURITY.md)\n');
    console.log('File:', path.basename(specFile));
    console.log('---\n');

    const sigBuffer = Buffer.from(specialization.signature, 'base64');

    // Test 1: crypto.verify() with PSS padding
    console.log('Method 1: crypto.verify() with RSA_PKCS1_PSS_PADDING\n');
    
    const dataStr = JSON.stringify(specialization.data);
    const isValid1 = crypto.verify(
      'sha256',
      Buffer.from(dataStr),
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      },
      sigBuffer
    );
    console.log(`  Compact JSON: ${isValid1 ? '✅ SUCCESS!' : '❌ Failed'}`);

    // Test 2: Try with indented JSON
    const dataIndent = JSON.stringify(specialization.data, null, 2);
    const isValid2 = crypto.verify(
      'sha256',
      Buffer.from(dataIndent),
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      },
      sigBuffer
    );
    console.log(`  Indented JSON: ${isValid2 ? '✅ SUCCESS!' : '❌ Failed'}`);

    // Test 3: Try with entire object
    const fullObj = JSON.stringify(specialization);
    const isValid3 = crypto.verify(
      'sha256',
      Buffer.from(fullObj),
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      },
      sigBuffer
    );
    console.log(`  Full object: ${isValid3 ? '✅ SUCCESS!' : '❌ Failed'}`);

    if (isValid1 || isValid2 || isValid3) {
      console.log('\n✅ FOUND! PSS Padding is the method!');
      process.exit(0);
    }

    // Test 4: Maybe data was pre-processed? Try Base64
    console.log('\nMethod 2: Testing if data was Base64 encoded before signing\n');
    
    const dataBase64 = Buffer.from(dataStr).toString('base64');
    const isValid4 = crypto.verify(
      'sha256',
      Buffer.from(dataBase64),
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      },
      sigBuffer
    );
    console.log(`  Base64-encoded data: ${isValid4 ? '✅ SUCCESS!' : '❌ Failed'}`);

    // Test 5: Test with SHA-1 PSS
    console.log('\nMethod 3: Testing with SHA1 PSS\n');
    
    const isValid5 = crypto.verify(
      'sha1',
      Buffer.from(dataStr),
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      },
      sigBuffer
    );
    console.log(`  SHA1 + PSS: ${isValid5 ? '✅ SUCCESS!' : '❌ Failed'}`);

    // Test 6: Test with SHA-512 PSS
    console.log('\nMethod 4: Testing with SHA512 PSS\n');
    
    const isValid6 = crypto.verify(
      'sha512',
      Buffer.from(dataStr),
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      },
      sigBuffer
    );
    console.log(`  SHA512 + PSS: ${isValid6 ? '✅ SUCCESS!' : '❌ Failed'}`);

    console.log('\n❌ PSS Padding also not working. Trying other padding...\n');

    // Test 7: Standard PKCS1 V1.5 (maybe doc was wrong?)
    console.log('Method 5: Standard PKCS1 V1.5 (default)\n');
    
    const isValid7 = crypto.verify(
      'sha256',
      Buffer.from(dataStr),
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
      },
      sigBuffer
    );
    console.log(`  OAEP Padding: ${isValid7 ? '✅ SUCCESS!' : '❌ Failed'}`);

    console.log('\n⚠️ None of the padding methods work either.');
    console.log('\nℹ️ The signatures might have been created with a different tool or service.');
    process.exit(1);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWithPSSPadding();
