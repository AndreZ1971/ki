#!/usr/bin/env node

/**
 * Verify Test Specializations Encrypted Backups
 *
 * Prüft die Integrität aller verschlüsselten .enc Dateien
 * - Können alle entschlüsselt werden?
 * - Stimmt das SHA-256 Hash?
 * - Fehlen .enc Dateien?
 *
 * Verwendung:
 *   npm run verify:test-specializations
 */

import path from 'path';
import { getTestSpecializationBackupManager } from '../security/testSpecializationBackupManager';
import { logger } from '../logger';

async function verifyBackups(): Promise<void> {
  console.log('\n🔍 Verifying Test Specialization Encrypted Backups...\n');

  const dataDir = path.join(__dirname, '../data/test-specializations');
  const manager = getTestSpecializationBackupManager(dataDir);

  try {
    // 1. List all specs
    const allSpecs = manager.listAll();
    console.log(`📊 Found ${allSpecs.length} test specializations:\n`);

    // Show current state
    for (const spec of allSpecs) {
      const status = [];
      if (spec.plaintext) status.push('📄 plaintext');
      if (spec.encrypted) status.push('🔐 encrypted');

      console.log(`  ${spec.id}`);
      console.log(`    ${status.join(' + ')} (${spec.size} bytes)`);
    }

    // 2. Verify encrypted backups
    console.log('\n🔓 Verifying Decryption...\n');
    const verification = await manager.verifyAll();

    for (const result of verification.results) {
      if (result.verified) {
        console.log(`✅ ${result.id}`);
      } else {
        console.error(`❌ ${result.id}`);
        console.error(`   Error: ${result.error}\n`);
      }
    }

    // 3. Summary
    console.log('\n' + '═'.repeat(60));
    console.log(`\n📋 Summary:`);
    console.log(`  Total Specs: ${verification.total}`);
    console.log(`  Verified: ${verification.verified}`);
    console.log(`  Failed: ${verification.failed}`);

    if (verification.failed === 0) {
      console.log('\n✨ All encrypted backups verified successfully!\n');
      logger.info(
        { total: verification.total, verified: verification.verified },
        'Test specialization verification complete'
      );
    } else {
      console.log('\n⚠️  Some backups failed verification!\n');
      logger.error(
        {
          total: verification.total,
          verified: verification.verified,
          failed: verification.failed,
        },
        'Test specialization verification failed'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification error:', error);
    logger.error({ err: error }, 'Test specialization verification error');
    process.exit(1);
  }
}

verifyBackups().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
