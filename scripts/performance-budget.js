#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Performance budgets in bytes
const PERFORMANCE_BUDGETS = {
  // Total bundle size limits
  maxTotalSize: 2 * 1024 * 1024, // 2MB
  maxJSSize: 1.5 * 1024 * 1024,  // 1.5MB
  maxCSSSize: 256 * 1024,         // 256KB

  // Individual file size limits
  maxChunkSize: 512 * 1024,       // 512KB per chunk
  maxAssetSize: 256 * 1024,       // 256KB per asset

  // Count limits
  maxChunks: 20,
  maxAssets: 50,
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkPerformanceBudget() {
  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static');

  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  console.log('🔍 Checking performance budget...\n');

  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let chunkCount = 0;
  let assetCount = 0;
  const oversizedFiles = [];

  function analyzeDirectory(dir, type = '') {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach(file => {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        analyzeDirectory(filePath, type);
      } else {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        totalSize += fileSize;
        assetCount++;

        // Categorize by file type
        if (file.name.endsWith('.js')) {
          jsSize += fileSize;
          chunkCount++;

          if (fileSize > PERFORMANCE_BUDGETS.maxChunkSize) {
            oversizedFiles.push({
              file: path.relative(process.cwd(), filePath),
              size: fileSize,
              type: 'JS Chunk',
              limit: PERFORMANCE_BUDGETS.maxChunkSize,
            });
          }
        } else if (file.name.endsWith('.css')) {
          cssSize += fileSize;

          if (fileSize > PERFORMANCE_BUDGETS.maxAssetSize) {
            oversizedFiles.push({
              file: path.relative(process.cwd(), filePath),
              size: fileSize,
              type: 'CSS Asset',
              limit: PERFORMANCE_BUDGETS.maxAssetSize,
            });
          }
        } else if (fileSize > PERFORMANCE_BUDGETS.maxAssetSize) {
          oversizedFiles.push({
            file: path.relative(process.cwd(), filePath),
            size: fileSize,
            type: 'Asset',
            limit: PERFORMANCE_BUDGETS.maxAssetSize,
          });
        }
      }
    });
  }

  // Analyze static files
  analyzeDirectory(staticDir);

  // Check against budgets
  const violations = [];

  if (totalSize > PERFORMANCE_BUDGETS.maxTotalSize) {
    violations.push({
      metric: 'Total Bundle Size',
      actual: totalSize,
      budget: PERFORMANCE_BUDGETS.maxTotalSize,
    });
  }

  if (jsSize > PERFORMANCE_BUDGETS.maxJSSize) {
    violations.push({
      metric: 'JavaScript Size',
      actual: jsSize,
      budget: PERFORMANCE_BUDGETS.maxJSSize,
    });
  }

  if (cssSize > PERFORMANCE_BUDGETS.maxCSSSize) {
    violations.push({
      metric: 'CSS Size',
      actual: cssSize,
      budget: PERFORMANCE_BUDGETS.maxCSSSize,
    });
  }

  if (chunkCount > PERFORMANCE_BUDGETS.maxChunks) {
    violations.push({
      metric: 'JavaScript Chunks',
      actual: chunkCount,
      budget: PERFORMANCE_BUDGETS.maxChunks,
    });
  }

  if (assetCount > PERFORMANCE_BUDGETS.maxAssets) {
    violations.push({
      metric: 'Total Assets',
      actual: assetCount,
      budget: PERFORMANCE_BUDGETS.maxAssets,
    });
  }

  // Report results
  console.log('📊 Bundle Analysis:');
  console.log(`   Total Size: ${formatBytes(totalSize)} (Budget: ${formatBytes(PERFORMANCE_BUDGETS.maxTotalSize)})`);
  console.log(`   JavaScript: ${formatBytes(jsSize)} (Budget: ${formatBytes(PERFORMANCE_BUDGETS.maxJSSize)})`);
  console.log(`   CSS: ${formatBytes(cssSize)} (Budget: ${formatBytes(PERFORMANCE_BUDGETS.maxCSSSize)})`);
  console.log(`   JS Chunks: ${chunkCount} (Budget: ${PERFORMANCE_BUDGETS.maxChunks})`);
  console.log(`   Total Assets: ${assetCount} (Budget: ${PERFORMANCE_BUDGETS.maxAssets})\n`);

  if (oversizedFiles.length > 0) {
    console.log('⚠️  Oversized Files:');
    oversizedFiles.forEach(file => {
      console.log(`   ${file.file}: ${formatBytes(file.size)} (${file.type} limit: ${formatBytes(file.limit)})`);
    });
    console.log('');
  }

  if (violations.length > 0) {
    console.log('❌ Performance Budget Violations:');
    violations.forEach(violation => {
      const actualStr = typeof violation.actual === 'number' && violation.metric.includes('Size')
        ? formatBytes(violation.actual)
        : violation.actual.toString();
      const budgetStr = typeof violation.budget === 'number' && violation.metric.includes('Size')
        ? formatBytes(violation.budget)
        : violation.budget.toString();

      console.log(`   ${violation.metric}: ${actualStr} exceeds budget of ${budgetStr}`);
    });

    console.log('\n💡 Suggestions:');
    console.log('   - Use dynamic imports for code splitting');
    console.log('   - Optimize images and use next/image');
    console.log('   - Remove unused dependencies');
    console.log('   - Enable gzip/brotli compression');
    console.log('   - Consider lazy loading for non-critical components\n');

    process.exit(1);
  } else {
    console.log('✅ All performance budgets are within limits!\n');
  }
}

// Add bundle analyzer suggestion
function suggestBundleAnalysis() {
  console.log('🔍 For detailed bundle analysis, run:');
  console.log('   npx @next/bundle-analyzer');
  console.log('   or set ANALYZE=true when building\n');
}

checkPerformanceBudget();
suggestBundleAnalysis();