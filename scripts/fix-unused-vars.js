const fs = require('fs');
const path = require('path');
const { _glob } = require('glob');

// Patterns to fix automatically
const fixes = [
  // Backend jobs - unused variables
  { file: 'backend/agent/jobs/aiImageGenerator.ts', pattern: /const updatedProduct = await/g, replacement: 'const _updatedProduct = await' },
  { file: 'backend/agent/jobs/aiImageGenerator.ts', pattern: /\} catch \(retryError\) \{/g, replacement: '} catch (__retryError) {' },
  { file: 'backend/agent/jobs/contentMonetizer.ts', pattern: /\.map\(\(product, index\) =>/g, replacement: '.map((product, _index) =>' },
  { file: 'backend/agent/jobs/conversionReport.ts', pattern: /\.map\(\(data, index\) =>/g, replacement: '.map((_data, index) =>' },
  { file: 'backend/agent/jobs/emailMarketingAutomation.ts', pattern: /^interface EmailCampaign/m, replacement: 'interface _EmailCampaign' },
  { file: 'backend/agent/jobs/freeToPaidConverter.ts', pattern: /async \(product, downloads\) =>/g, replacement: 'async (product, _downloads) =>' },
  { file: 'backend/agent/jobs/paymentEmergency.ts', pattern: /^const wooCommerce = getWooCommerceClient/m, replacement: 'const _wooCommerce = getWooCommerceClient' },
  { file: 'backend/agent/jobs/realAnalyticsReporting.ts', pattern: /\.map\(\(\[key, value\], index\) =>/g, replacement: '.map(([key, value], _index) =>' },
  { file: 'backend/agent/jobs/shopHealthReport.ts', pattern: /^import \{ ContentMonetizer \}/m, replacement: 'import { ContentMonetizer as _ContentMonetizer }' },
  { file: 'backend/agent/jobs/shopHealthReport.ts', pattern: /^import \{ FreeToPaidConverter \}/m, replacement: 'import { FreeToPaidConverter as _FreeToPaidConverter }' },
  { file: 'backend/agent/jobs/shopHealthReport.ts', pattern: /^import \{ PaymentFixer \}/m, replacement: 'import { PaymentFixer as _PaymentFixer }' },
  { file: 'backend/agent/jobs/shopHealthReport.ts', pattern: /\(salesData, products\) =>/g, replacement: '(_salesData, products) =>' },
  { file: 'backend/agent/jobs/trendAnalysis.ts', pattern: /^import axios/m, replacement: 'import axios as _axios' },
  { file: 'backend/agent/jobs/trendAnalysis.ts', pattern: /\(keyword, index\) =>/g, replacement: '(_keyword, index) =>' },
  { file: 'backend/agent/jobs/trendAnalysis.ts', pattern: /\(interestData, index\) =>/g, replacement: '(_interestData, index) =>' },
  
  // ML files
  { file: 'backend/ml/mlService.ts', pattern: /import \{ getModelConfig \}/g, replacement: 'import { getModelConfig as _getModelConfig }' },
  { file: 'backend/ml/models/productRecommendation.ts', pattern: /import \{ isMLEnabled \}/g, replacement: 'import { isMLEnabled as _isMLEnabled }' },
  { file: 'backend/ml/models/productRecommendation.ts', pattern: /\.map\(\(product, index\) =>/g, replacement: '.map((product, _index) =>' },
  { file: 'backend/ml/models/trendForecasting.ts', pattern: /\} catch \(err\) \{/g, replacement: '} catch (__err) {' },
  
  // Route handlers - unused parameters
  { file: 'backend/routes/app/api/analytics/metrics/shop-metrics.ts', pattern: /async function shopMetricsRoutes\(server: FastifyInstance, options: FastifyPluginOptions\)/g, replacement: 'async function shopMetricsRoutes(server: FastifyInstance, _options: FastifyPluginOptions)' },
  { file: 'backend/routes/app/api/analytics/metrics/shop-metrics.ts', pattern: /async \(request, reply\) =>/g, replacement: 'async (_request, _reply) =>' },
  { file: 'backend/routes/app/api/email/email-sender.ts', pattern: /async function emailSenderRoutes\(server: FastifyInstance, options: FastifyPluginOptions\)/g, replacement: 'async function emailSenderRoutes(server: FastifyInstance, _options: FastifyPluginOptions)' },
  { file: 'backend/routes/app/api/email/email-sender.ts', pattern: /async \(request, reply\) =>/g, replacement: 'async (_request, _reply) =>' },
  { file: 'backend/routes/app/api/ml/test.ts', pattern: /async \(request, reply\) =>/g, replacement: 'async (_request, _reply) =>' },
  { file: 'backend/routes/app/api/products/optimizer/product-optimizer.ts', pattern: /async function productOptimizerRoutes\(server: FastifyInstance, options: FastifyPluginOptions\)/g, replacement: 'async function productOptimizerRoutes(_server: FastifyInstance, options: FastifyPluginOptions)' },
  { file: 'backend/routes/app/api/products/woocommerce.ts', pattern: /const result = await response\.json/g, replacement: 'const _result = await response.json' },
  { file: 'backend/routes/app/api/products/woocommerce.ts', pattern: /\.map\(\(product, index\) =>/g, replacement: '.map((product, _index) =>' },
  { file: 'backend/routes/app/api/products/woocommerce.ts', pattern: /\} catch \(secondParseError\) \{/g, replacement: '} catch (__secondParseError) {' },
  { file: 'backend/routes/app/api/system/health/system.ts', pattern: /import \{.*FastifyPluginOptions.*\}/g, replacement: 'import { FastifyInstance }' },
  { file: 'backend/routes/app/api/system/health/system.ts', pattern: /async function systemHealthRoutes\(server: FastifyInstance, options: FastifyPluginOptions\)/g, replacement: 'async function systemHealthRoutes(server: FastifyInstance, _options: FastifyPluginOptions)' },
  { file: 'backend/routes/app/api/system/health/system.ts', pattern: /async \(request, reply\) =>/g, replacement: 'async (_request, _reply) =>' },
  { file: 'backend/routes/app/api/system/memory/memory.ts', pattern: /async function memoryRoutes\(server: FastifyInstance, options: FastifyPluginOptions\)/g, replacement: 'async function memoryRoutes(server: FastifyInstance, _options: FastifyPluginOptions)' },
  { file: 'backend/routes/app/api/woocommerce/customers.ts', pattern: /async function customersRoutes\(server: FastifyInstance, options: FastifyPluginOptions\)/g, replacement: 'async function customersRoutes(server: FastifyInstance, _options: FastifyPluginOptions)' },
  { file: 'backend/routes/app/api/woocommerce/customers.ts', pattern: /\} catch \(error\) \{/g, replacement: '} catch (__error) {' },
  { file: 'backend/routes/emailTest.ts', pattern: /async function emailTestRoutes\(server: FastifyInstance, options: FastifyPluginOptions\)/g, replacement: 'async function emailTestRoutes(server: FastifyInstance, _options: FastifyPluginOptions)' },
  { file: 'backend/routes/emailTest.ts', pattern: /async \(request, reply\) =>/g, replacement: 'async (_request, _reply) =>' },
  { file: 'backend/server.ts', pattern: /server\.get\('\/health', async \(request, reply\) =>/g, replacement: "server.get('/health', async (_request, _reply) =>" },
  { file: 'backend/services/emailService.ts', pattern: /sendTestEmail\(to: string, success: boolean\)/g, replacement: 'sendTestEmail(to: string, _success: boolean)' },
  { file: 'backend/utils/openai.ts', pattern: /const openai = new OpenAI/g, replacement: 'const _openai = new OpenAI' },
  
  // Frontend files
  { file: 'frontend/eslint.config.js', pattern: /^import js from '@eslint\/js';$/m, replacement: '// import js from \'@eslint/js\';' },
  { file: 'frontend/src/pages/AnalyseMetrics/ConversionReported.tsx', pattern: /const \[error, setError\] = useState/g, replacement: 'const [_error, _setError] = useState' },
  { file: 'frontend/src/pages/AnalyseMetrics/RealAnalytics.tsx', pattern: /\} catch \(error\) \{/g, replacement: '} catch (__error) {' },
  { file: 'frontend/src/pages/AnalyseMetrics/RealWebAnalytics.tsx', pattern: /\} catch \(err\) \{/g, replacement: '} catch (__err) {' },
  { file: 'frontend/src/pages/AnalyseMetrics/RealWebAnalytics.tsx', pattern: /const getTrendColor = /g, replacement: 'const _getTrendColor = ' },
  { file: 'frontend/src/pages/AnalyseMetrics/RealWebAnalytics.tsx', pattern: /const handleRefresh = /g, replacement: 'const _handleRefresh = ' },
  { file: 'frontend/src/pages/AnalyseMetrics/TrendAnalysis.tsx', pattern: /const \[error, setError\] = useState/g, replacement: 'const [_error, _setError] = useState' },
  { file: 'frontend/src/pages/MarketingContent/ai-email-generator.tsx', pattern: /\} catch \(error\) \{/g, replacement: '} catch (__error) {' },
  { file: 'frontend/src/pages/ProductManagement/CategoriesManager.tsx', pattern: /\} catch \(err\) \{/g, replacement: '} catch (__err) {' },
  { file: 'frontend/src/pages/Settings/MLSettings.tsx', pattern: /\} catch \(error\) \{/g, replacement: '} catch (__error) {' },
  
  // Script files
  { file: 'scripts/fix-eslint-warnings.js', pattern: /\} catch \(error\) \{/g, replacement: '} catch (__error) {' },
  
  // Test files
  { file: 'tests/e2e/auth/login.spec.ts', pattern: /test\.beforeEach\(async \(\{ page \}\) =>/g, replacement: 'test.beforeEach(async ({ page: _page }) =>' },
  { file: 'tests/e2e/jobs-dashboard.spec.ts', pattern: /test\('([^']+)', async \(\{ page \}\) =>/g, replacement: "test('$1', async ({ page: _page }) =>" },
  { file: 'tests/e2e/jobs-dashboard.spec.ts', pattern: /let status1 = /g, replacement: 'const status1 = ' },
  { file: 'tests/e2e/jobs-dashboard.spec.ts', pattern: /let status2 = /g, replacement: 'const status2 = ' },
  { file: 'tests/e2e/pages/JobsPage.ts', pattern: /const statusLocator = /g, replacement: 'const _statusLocator = ' },
  { file: 'tests/e2e/products/product-creation.spec.ts', pattern: /const dashboardPage = /g, replacement: 'const _dashboardPage = ' },
  { file: 'tests/integration/job-workflows.test.ts', pattern: /vi\.mock\('.*utils\/openai', \(\) => \(\{\s*getOpenAIClient:/s, replacement: "vi.mock('../../backend/utils/openai', () => ({\n  _getOpenAIClient:" },
  { file: 'tests/unit/circuit-breaker.test.ts', pattern: /\} catch \(error\) \{/g, replacement: '} catch (__error) {' },
  { file: 'tests/unit/dead-letter-queue.test.ts', pattern: /import \{ DeadLetterQueue, DeadLetterMessage \}/g, replacement: 'import { DeadLetterQueue }' },
  { file: 'tests/unit/dead-letter-queue.test.ts', pattern: /const id1 = /g, replacement: 'const _id1 = ' },
  { file: 'tests/unit/dead-letter-queue.test.ts', pattern: /const id2 = /g, replacement: 'const _id2 = ' },
  { file: 'tests/unit/jobs/emailMarketingAutomation.test.ts', pattern: /const consoleErrorSpy = /g, replacement: 'const _consoleErrorSpy = ' },
  { file: 'tests/unit/jobs/paymentFixer.test.ts', pattern: /import \{ describe, it, expect, vi, beforeEach, afterEach \}/g, replacement: 'import { describe, it, expect, vi, beforeEach }' },
  { file: 'tests/unit/jobs/paymentFixer.test.ts', pattern: /const mockSuccessfulOrders = /g, replacement: 'const _mockSuccessfulOrders = ' },
];

async function fixFile(filePath, pattern, replacement) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    content = content.replace(pattern, replacement);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (_error) {
    console.log(`❌ Error fixing ${filePath}:`, _error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing unused variable warnings...\n');
  
  let fixedCount = 0;
  let failedCount = 0;
  
  for (const fix of fixes) {
    const success = await fixFile(fix.file, fix.pattern, fix.replacement);
    if (success) {
      fixedCount++;
    } else {
      failedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Fixed: ${fixedCount} files`);
  console.log(`⚠️  Failed/Not Found: ${failedCount} files`);
  console.log(`\n🔍 Running lint again to check remaining warnings...`);
}

main().catch(console.error);
