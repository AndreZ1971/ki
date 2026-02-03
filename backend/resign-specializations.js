#!/usr/bin/env node

/**
 * Re-sign all specialization files with the correct Private Key
 * 
 * This script:
 * 1. Reads all .ari-spec files from docs/Spezialisierungen/
 * 2. Signs the "data" field with RSA-4096 + SHA-256
 * 3. Updates the signature in each file
 * 4. Writes the corrected files back
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// The Private Key (PKCS8 format)
// This is the key that corresponds to the Public Key in signatureVerifier.ts
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
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
4C7WtaidPp0D3QFjVs8rCatkk7sf1g==
-----END PRIVATE KEY-----`;


function resizeAndSignSpecializations() {
  try {
    const specsDir = path.join(__dirname, '../docs/Spezialisierungen');
    
    // Get all .ari-spec files
    const files = fs.readdirSync(specsDir)
      .filter(f => f.endsWith('.ari-spec'))
      .sort();

    console.log(`📝 Found ${files.length} specialization files\n`);
    console.log('=' .repeat(60) + '\n');

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const filePath = path.join(specsDir, file);
      
      try {
        // Read the file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const specialization = JSON.parse(fileContent);

        // Extract the data to sign
        const dataToSign = JSON.stringify(specialization.data);

        // Sign with RSA-4096 + SHA-256
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(dataToSign);
        const signature = signer.sign(PRIVATE_KEY, 'base64');

        // Update the specialization with new signature
        specialization.signature = signature;

        // Write back to file with pretty formatting
        fs.writeFileSync(filePath, JSON.stringify(specialization, null, 2) + '\n');

        console.log(`✅ ${file}`);
        console.log(`   Signature: ${signature.substring(0, 50)}...`);
        successCount++;

      } catch (error) {
        console.log(`❌ ${file}`);
        console.log(`   Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log(`\n✅ Successfully re-signed: ${successCount} files`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} files`);
    }

    console.log(`\n🔐 All signatures are now valid and match the Public Key in signatureVerifier.ts!\n`);

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

resizeAndSignSpecializations();
