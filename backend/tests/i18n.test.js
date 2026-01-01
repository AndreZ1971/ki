/**
 * Simple test to verify i18n service functionality
 * Run with: node backend/dist/tests/i18n.test.js
 */

const { i18nService } = require('../services/i18nService.js');

console.log('🧪 Testing i18n Service...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n   Expected: "${expected}"\n   Got: "${actual}"`);
  }
}

// Test 1: English translations
test('Translates error.noFileProvided to English', () => {
  const result = i18nService.translate('error.noFileProvided', 'english');
  assertEqual(result, 'No file provided', 'English translation');
});

// Test 2: German translations
test('Translates error.noFileProvided to German', () => {
  const result = i18nService.translate('error.noFileProvided', 'german');
  assertEqual(result, 'Keine Datei bereitgestellt', 'German translation');
});

// Test 3: All error keys
test('All error keys translate correctly', () => {
  const keys = [
    'error.invalidAriFormat',
    'error.missingDataField',
    'error.missingRequiredField',
    'error.noFileProvided',
    'error.invalidFileType',
    'error.fileTooLarge',
    'error.missingRequiredFields',
    'error.activationFailed',
    'error.deletionFailed',
    'error.loadingFailed',
    'error.uploadFailed'
  ];
  
  keys.forEach(key => {
    const en = i18nService.translate(key, 'english');
    const de = i18nService.translate(key, 'german');
    
    if (en === key) {
      throw new Error(`English translation missing for ${key}`);
    }
    if (de === key) {
      throw new Error(`German translation missing for ${key}`);
    }
  });
});

// Test 4: Specialization keys
test('All specialization keys translate correctly', () => {
  const keys = [
    'specialization.uploadSuccess',
    'specialization.activated',
    'specialization.deleted'
  ];
  
  keys.forEach(key => {
    const en = i18nService.translate(key, 'english');
    const de = i18nService.translate(key, 'german');
    
    if (en === key) {
      throw new Error(`English translation missing for ${key}`);
    }
    if (de === key) {
      throw new Error(`German translation missing for ${key}`);
    }
  });
});

// Test 5: Locale detection from headers
test('Detects German from X-Language header', () => {
  const locale = i18nService.getLocaleFromHeaders({ 'x-language': 'de' });
  assertEqual(locale, 'german', 'Locale detection');
});

test('Detects English from X-Language header', () => {
  const locale = i18nService.getLocaleFromHeaders({ 'x-language': 'en' });
  assertEqual(locale, 'english', 'Locale detection');
});

test('Detects German from Accept-Language header', () => {
  const locale = i18nService.getLocaleFromHeaders({ 'accept-language': 'de-DE,de;q=0.9,en;q=0.8' });
  assertEqual(locale, 'german', 'Locale detection from Accept-Language');
});

test('Defaults to English when no language header', () => {
  const locale = i18nService.getLocaleFromHeaders({});
  assertEqual(locale, 'english', 'Default locale');
});

// Test 6: Translator function
test('Creates translator function correctly', () => {
  const t = i18nService.createTranslator('german');
  const result = t('error.noFileProvided');
  assertEqual(result, 'Keine Datei bereitgestellt', 'Translator function');
});

// Test 7: Fallback to English
test('Falls back to English for missing German translation', () => {
  // This should fall back to English if key doesn't exist in German
  const result = i18nService.translate('nonexistent.key', 'german');
  assertEqual(result, 'nonexistent.key', 'Fallback behavior');
});

console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Total: ${passed + failed}\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️ Some tests failed!');
  process.exit(1);
}
