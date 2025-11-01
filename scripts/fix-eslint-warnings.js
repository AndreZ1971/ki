/**
 * Script to automatically fix common ESLint warnings
 * Runs eslint --fix on all TypeScript and JavaScript files
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Fixing ESLint warnings automatically...\n');

try {
  // Run ESLint with --fix flag
  execSync('npx eslint . --fix --ext .ts,.tsx,.js,.jsx', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  console.log('\n✅ Auto-fix complete! Running final lint check...\n');
  
  // Run lint again to see remaining issues
  execSync('npm run lint', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
} catch (_error) {
  console.log('\n⚠️  Some warnings remain. Manual fixes needed.');
  process.exit(0); // Don't fail, just warn
}
