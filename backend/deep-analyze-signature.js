#!/usr/bin/env node

/**
 * Deep Analysis of Signature Structure
 * 
 * Analyzes the signature format and tries to understand
 * how it was created by examining the data structure
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

function deepAnalyzeSignature() {
  try {
    const specFile = path.join(__dirname, '../docs/Spezialisierungen/fitness-ernaehrung.ari-spec');
    const fileContent = fs.readFileSync(specFile, 'utf-8');
    const specialization = JSON.parse(fileContent);

    console.log('📊 DEEP ANALYSIS OF SIGNATURE STRUCTURE\n');
    console.log('File:', path.basename(specFile));
    console.log('---\n');

    // Analyze the signature itself
    const sigBuffer = Buffer.from(specialization.signature, 'base64');
    console.log('🔐 Signature Analysis:');
    console.log('  Format: Base64 encoded');
    console.log('  Decoded size:', sigBuffer.length, 'bytes (exactly RSA-4096)');
    console.log('  First 10 hex bytes:', sigBuffer.slice(0, 10).toString('hex'));
    console.log('  Last 10 hex bytes:', sigBuffer.slice(-10).toString('hex'));

    // Test HMAC-SHA256 as alternative (maybe it's HMAC instead of RSA signature?)
    console.log('\n🔄 Testing alternative signature type (HMAC):\n');
    
    const hmacTests = [
      { key: specialization.signature, name: 'Using signature as key' },
      { key: 'secret', name: 'With "secret" as key' },
      { key: PUBLIC_KEY, name: 'With public key as HMAC key' }
    ];

    for (const test of hmacTests) {
      try {
        const hmac = crypto.createHmac('sha256', test.key);
        hmac.update(JSON.stringify(specialization.data));
        const digest = hmac.digest('base64');
        
        console.log(`Checking ${test.name}:`);
        console.log(`  Generated HMAC: ${digest.substring(0, 20)}...`);
        console.log(`  Actual sig:     ${specialization.signature.substring(0, 20)}...`);
        console.log(`  Match: ${digest === specialization.signature ? '✅' : '❌'}`);
      } catch (e) {
        // skip
      }
    }

    // Check if maybe the JSON was different - let's try all possible field combinations
    console.log('\n🧪 Testing if different fields were used in the signature:\n');

    // Maybe only certain fields were signed?
    const testConfigs = [
      {
        name: 'Only "id"',
        data: specialization.data.id
      },
      {
        name: 'Only "name"',
        data: specialization.data.name
      },
      {
        name: 'id + name',
        data: JSON.stringify({ id: specialization.data.id, name: specialization.data.name })
      },
      {
        name: 'All data + issuer + timestamp',
        data: JSON.stringify({
          data: specialization.data,
          issuer: specialization.issuer,
          timestamp: specialization.timestamp
        })
      }
    ];

    for (const config of testConfigs) {
      try {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(typeof config.data === 'string' ? config.data : JSON.stringify(config.data), 'utf-8');
        
        const isValid = verify.verify(PUBLIC_KEY, sigBuffer);
        if (isValid) {
          console.log(`✅ SUCCESS! ${config.name}`);
        }
      } catch (e) {
        // silent
      }
    }

    // Let's check: maybe the signature was created with crypto.sign() instead of createSign()?
    console.log('\n📝 Checking file structure to infer signing method:\n');
    console.log('Full specialization object keys:', Object.keys(specialization));
    console.log('Data object size:', JSON.stringify(specialization.data).length, 'bytes');
    console.log('Signature position in file: seems to be base64 encoded string');
    
    // Try canonical JSON (deterministic)
    console.log('\n🔤 Testing with different canonicalization methods:\n');
    
    const canonicalize = (obj) => {
      if (obj === null) return 'null';
      if (typeof obj !== 'object') return JSON.stringify(obj);
      if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalize).join(',') + ']';
      }
      const keys = Object.keys(obj).sort();
      return '{' + keys.map(k => `"${k}":${canonicalize(obj[k])}`).join(',') + '}';
    };

    const canonicalJson = canonicalize(specialization.data);
    
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(canonicalJson, 'utf-8');
      const isValid = verify.verify(PUBLIC_KEY, sigBuffer);
      console.log(`Canonical JSON + RSA-SHA256: ${isValid ? '✅ SUCCESS!' : '❌ Failed'}`);
      if (isValid) {
        console.log(`\n🎉 FOUND IT! Use canonical JSON serialization!`);
      }
    } catch (e) {
      console.log(`Canonical JSON error: ${e.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deepAnalyzeSignature();
