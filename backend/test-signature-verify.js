#!/usr/bin/env node

/**
 * Test Signature Verification
 * 
 * Verifies if a signed specialization file can be validated
 * with the given RSA-4096 public key
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// RSA-4096 Public Key (from signatureVerifier.ts)
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

function testSignatureVerification() {
  try {
    // Read one of the signed specialization files
    const specFile = path.join(__dirname, '../docs/Spezialisierungen/fitness-ernaehrung.ari-spec');
    const fileContent = fs.readFileSync(specFile, 'utf-8');
    const specialization = JSON.parse(fileContent);

    console.log('📋 Specialization loaded:', specialization.data.id);
    console.log('✓ Signature present:', !!specialization.signature);
    console.log('✓ Data present:', !!specialization.data);
    console.log('✓ Issuer:', specialization.issuer);
    console.log('✓ Timestamp:', specialization.timestamp);

    // Try different combinations: algorithms + serialization methods
    const algorithms = ['RSA-SHA256', 'RSA-SHA1', 'RSA-SHA512', 'sha256', 'sha1', 'sha512'];
    
    const serializations = [
      {
        name: 'Compact (no spaces)',
        data: JSON.stringify(specialization.data)
      },
      {
        name: 'With 2-space indent',
        data: JSON.stringify(specialization.data, null, 2)
      },
      {
        name: 'Sorted keys, compact',
        data: JSON.stringify(specialization.data, Object.keys(specialization.data).sort())
      },
      {
        name: 'Entire object (not just data)',
        data: JSON.stringify(specialization)
      },
      {
        name: 'Entire object with indent',
        data: JSON.stringify(specialization, null, 2)
      }
    ];

    console.log('\n🔐 Testing signature verification with different algorithms + serializations:\n');

    let successFound = false;
    for (const algo of algorithms) {
      console.log(`\n--- Testing with ${algo} ---`);
      for (const method of serializations) {
        try {
          const verify = crypto.createVerify(algo);
          verify.update(method.data, 'utf-8');
          
          const signatureBuffer = Buffer.from(specialization.signature, 'base64');
          const isValid = verify.verify(PUBLIC_KEY, signatureBuffer);

          if (isValid) {
            console.log(`✅ SUCCESS with ${algo} + ${method.name}`);
            console.log(`\n   🎯 FOUND IT!`);
            console.log(`   Algorithm: ${algo}`);
            console.log(`   Serialization: ${method.name}`);
            console.log(`   Data length: ${method.data.length} chars`);
            successFound = true;
            return { algo, method };
          }
        } catch (err) {
          // Silently skip
        }
      }
    }

    if (!successFound) {
      console.log('\n⚠️ No matching combination found with standard algorithms.');
      console.log('Trying alternative approaches...\n');
      
      // Maybe the signature was created with a different approach?
      // Let's try with the original bytes without JSON parsing
      console.log('ℹ️ Debugging info:');
      console.log('   Signature length:', specialization.signature.length, 'chars');
      console.log('   Signature (base64 decoded):', Buffer.from(specialization.signature, 'base64').length, 'bytes');
      console.log('   Data keys:', Object.keys(specialization.data));
      console.log('   Issuer:', specialization.issuer);
    }

    process.exit(1);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSignatureVerification();
