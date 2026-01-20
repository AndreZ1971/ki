#!/usr/bin/env node
// backend/scripts/generate-admin-hash.ts
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const SALT_ROUNDS = 12;

async function generateHash() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve) => {
    rl.question('Enter password for admin user: ', async (password) => {
      if (!password || password.trim().length < 8) {
        console.error('❌ Password must be at least 8 characters long');
        rl.close();
        process.exit(1);
      }

      try {
        console.log('\n🔐 Generating bcrypt hash...');
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        
        console.log('\n✅ Hash generated successfully!\n');
        console.log('Add this to your .env file:');
        console.log('─'.repeat(80));
        console.log(`ADMIN_PASS_HASH="${hash}"`);
        console.log('─'.repeat(80));
        console.log('\nOr set as environment variable:');
        console.log(`export ADMIN_PASS_HASH="${hash}"`);
        console.log('\n⚠️  Keep this hash secure and never commit it to version control!');
      } catch (error) {
        console.error('❌ Failed to generate hash:', error);
        process.exit(1);
      }

      rl.close();
      resolve();
    });
  });
}

generateHash().then(() => process.exit(0));
