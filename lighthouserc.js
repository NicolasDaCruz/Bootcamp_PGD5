module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products',
        'http://localhost:3000/eco',
        'http://localhost:3000/loyalty',
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],

        // Performance budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 1500000 }], // 1.5MB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 256000 }], // 256KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 2000000 }], // 2MB
        'resource-summary:total:size': ['warn', { maxNumericValue: 3000000 }], // 3MB

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',

        // Best Practices
        'errors-in-console': 'warn',
        'uses-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',

        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'link-text': 'error',
        'is-crawlable': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};