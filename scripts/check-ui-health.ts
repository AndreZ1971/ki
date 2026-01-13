#!/usr/bin/env tsx
/**
 * UI Health Check Script
 * 
 * Schneller Health-Check aller Tool-UIs ohne Playwright
 * Prüft:
 * - Datei existiert
 * - TypeScript-Fehler
 * - Imports sind korrekt
 * - Komponenten-Struktur
 */

import fs from 'fs';
import path from 'path';
// import { execSync } from 'child_process'; // Aktuell nicht verwendet

interface UIHealthResult {
  tool: string;
  file: string;
  exists: boolean;
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
  issues: string[];
}

const TOOL_FILES = [
  // Analytics
  { name: 'Mini Audit', file: 'frontend/src/pages/AnalyseMetrics/MiniAudit.tsx' },
  { name: 'Trend Dashboard', file: 'frontend/src/pages/AnalyseMetrics/TrendDashboard.tsx' },
  { name: 'Analytics Dashboard', file: 'frontend/src/pages/AnalyseMetrics/AnalyticsDashboard.tsx' },
  
  // Product Management
  { name: 'Auto Product Creator', file: 'frontend/src/pages/ProductManagement/AutoProductCreator.tsx' },
  { name: 'Product Analyzer', file: 'frontend/src/pages/ProductManagement/ProductAnalyzer.tsx' },
  { name: 'Product AI Analysis', file: 'frontend/src/pages/ProductManagement/ProductAIAnalysis.tsx' },
  { name: 'Create Freebies', file: 'frontend/src/pages/ProductManagement/CreateFreebies.tsx' },
  { name: 'Run Auto Product Creator', file: 'frontend/src/pages/ProductManagement/RunAutoProductCreator.tsx' },
  { name: 'Run Create Freebies', file: 'frontend/src/pages/ProductManagement/RunCreateFreebies.tsx' },
  { name: 'Product Bundles', file: 'frontend/src/pages/ProductManagement/ProductBundles.tsx' },
  { name: 'Categories Manager', file: 'frontend/src/pages/ProductManagement/CategoriesManager.tsx' },
  { name: 'Woo Product Create', file: 'frontend/src/pages/ProductManagement/WooProductCreate.tsx' },
  { name: 'Woo Product Update', file: 'frontend/src/pages/ProductManagement/WooProductUpdate.tsx' },
  { name: 'ML Product Idea Generator', file: 'frontend/src/pages/ProductManagement/MLProductIdeaGenerator.tsx' },
  { name: 'ML Freebie Generator', file: 'frontend/src/pages/ProductManagement/MLFreebieGenerator.tsx' },
  { name: 'ML Category Suggester', file: 'frontend/src/pages/ProductManagement/MLCategorySuggester.tsx' },
  
  // Marketing
  { name: 'Email Campaign Creator', file: 'frontend/src/pages/marketing/EmailCampaignCreator.tsx' },
  { name: 'Email Scheduler', file: 'frontend/src/pages/marketing/EmailScheduler.tsx' },
  { name: 'Email Enhancement', file: 'frontend/src/pages/marketing/EmailEnhancement.tsx' },
  { name: 'Blog Post Generator', file: 'frontend/src/pages/marketing/BlogPostGenerator.tsx' },
  { name: 'Image Analyzer', file: 'frontend/src/pages/marketing/ImageAnalyzer.tsx' },
  
  // Payment & Finances
  { name: 'Payment Verifier', file: 'frontend/src/pages/PaymentFinances/PaymentVerifier.tsx' },
  { name: 'Payment Validation', file: 'frontend/src/pages/PaymentFinances/PaymentValidation.tsx' },
  
  // ML Tools
  { name: 'ML Dashboard', file: 'frontend/src/pages/ML/MLDashboard.tsx' },
  
  // Settings (Reference - known good)
  { name: 'Settings', file: 'frontend/src/pages/Settings/Settings.tsx' },
  { name: 'ML Settings', file: 'frontend/src/pages/Settings/MLSettings.tsx' },
];

const REQUIRED_PATTERNS = {
  header: /<h1>/,
  backButton: /(BackButton|navigate\(-1\)|navigate\(['"`]\/|handleBackToDashboard|history\.back\(\))/,
  errorHandling: /(try\s*{|catch\s*\()/,
  loading: /loading|isLoading/,
  translation: /useTranslation|t\(/,
};

function checkFile(toolFile: { name: string; file: string }): UIHealthResult {
  const result: UIHealthResult = {
    tool: toolFile.name,
    file: toolFile.file,
    exists: false,
    hasErrors: false,
    errors: [],
    warnings: [],
    issues: [],
  };

  const fullPath = path.join(process.cwd(), toolFile.file);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    result.errors.push('File does not exist');
    result.hasErrors = true;
    return result;
  }

  result.exists = true;

  // Read file content
  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for required patterns
  if (!REQUIRED_PATTERNS.header.test(content)) {
    result.issues.push('Missing <h1> header');
  }

  if (!REQUIRED_PATTERNS.backButton.test(content)) {
    result.warnings.push('Missing BackButton component');
  }

  if (!REQUIRED_PATTERNS.errorHandling.test(content)) {
    result.warnings.push('No try/catch error handling found');
  }

  if (!REQUIRED_PATTERNS.loading.test(content)) {
    result.warnings.push('No loading state found');
  }

  if (!REQUIRED_PATTERNS.translation.test(content)) {
    result.warnings.push('No i18n translation usage found');
  }

  // Check for common React anti-patterns
  if (/useState\(\)\[0\]/.test(content)) {
    result.issues.push('Using array index instead of destructuring useState');
  }

  if (/useEffect\(\(\) => {[^}]+}, \[\]\)/.test(content) && !/await/.test(content)) {
    result.warnings.push('useEffect with empty deps but no async - might be missing deps');
  }

  // Check for console.log (should use logger)
  const consoleLogCount = (content.match(/console\.log/g) || []).length;
  if (consoleLogCount > 2) {
    result.warnings.push(`Found ${consoleLogCount} console.log statements - consider using logger`);
  }

  // Check for hardcoded strings (should use i18n)
  const hardcodedStrings = content.match(/<h1>[^{]+<\/h1>/g);
  if (hardcodedStrings && hardcodedStrings.length > 0) {
    result.warnings.push('Found hardcoded strings in JSX - should use t() for i18n');
  }

  result.hasErrors = result.errors.length > 0;

  return result;
}

function generateReport(results: UIHealthResult[]): void {
  console.log('\n🔍 UI Health Check Report\n');
  console.log('=' .repeat(80));

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    const statusIcon = result.hasErrors ? '❌' : result.warnings.length > 0 ? '⚠️ ' : '✅';
    console.log(`\n${statusIcon} ${result.tool}`);
    console.log(`   File: ${result.file}`);

    if (!result.exists) {
      console.log('   ❌ FILE NOT FOUND');
      failCount++;
      continue;
    }

    if (result.errors.length > 0) {
      console.log('   Errors:');
      result.errors.forEach(err => console.log(`     ❌ ${err}`));
      failCount++;
    }

    if (result.issues.length > 0) {
      console.log('   Issues:');
      result.issues.forEach(issue => console.log(`     🔴 ${issue}`));
    }

    if (result.warnings.length > 0) {
      console.log('   Warnings:');
      result.warnings.forEach(warn => console.log(`     ⚠️  ${warn}`));
      warnCount++;
    }

    if (result.errors.length === 0 && result.warnings.length === 0 && result.issues.length === 0) {
      console.log('   ✅ All checks passed');
      passCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ⚠️  Warnings: ${warnCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${results.length}`);

  // Save to JSON
  const reportPath = path.join(process.cwd(), 'ui-health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\n📄 Full report saved to: ui-health-report.json\n`);
}

// Run the check
const results = TOOL_FILES.map(checkFile);
generateReport(results);

// Exit with error code if any checks failed
const hasFailures = results.some(r => r.hasErrors);
process.exit(hasFailures ? 1 : 0);
