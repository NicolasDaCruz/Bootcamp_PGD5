# SneakerVault Deployment Guide

This document outlines the deployment process and CI/CD pipeline for SneakerVault.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git
- Vercel account
- Required API keys (see Environment Variables)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd sneaker-store

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Required Variables

Create a `.env.local` file with the following variables:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# External APIs
NEXT_PUBLIC_KICKSDB_API_KEY=your-kicksdb-api-key

# Email
RESEND_API_KEY=re_your-resend-api-key

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Vercel Environment Variables

In your Vercel project settings, add these environment variables:

1. **Production Environment:**
   - All variables from `.env.example`
   - Set `NODE_ENV=production`
   - Set `NEXT_PUBLIC_APP_URL=https://your-domain.com`

2. **Preview Environment:**
   - Same as production but with staging/test API keys
   - Set `NODE_ENV=preview`

## 🏗️ CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline runs automatically on:
- Push to `main` branch (production deployment)
- Push to `develop` branch (staging deployment)
- Pull requests to `main` (preview deployment)

### Pipeline Stages

1. **Code Quality & Testing**
   - TypeScript type checking
   - ESLint code linting
   - Prettier formatting check
   - Unit tests with Jest
   - Coverage reporting

2. **E2E Testing**
   - Playwright end-to-end tests
   - Cross-browser testing
   - Mobile responsiveness tests

3. **Security Scanning**
   - npm audit for vulnerabilities
   - Snyk security scanning
   - CodeQL static analysis

4. **Performance Budgets**
   - Bundle size analysis
   - Performance budget enforcement
   - Lighthouse CI scores

5. **Deployment**
   - Vercel deployment
   - Environment-specific configuration
   - Health check validation

### Required GitHub Secrets

Add these secrets in your GitHub repository settings:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

NEXT_PUBLIC_KICKSDB_API_KEY=your-kicksdb-api-key
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id

SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token

SNYK_TOKEN=your-snyk-token (optional)
SLACK_WEBHOOK_URL=your-slack-webhook (optional)
```

## 📦 Vercel Deployment

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Project Configuration

1. **Framework Preset:** Next.js
2. **Build Command:** `npm run build`
3. **Output Directory:** `.next`
4. **Install Command:** `npm ci`
5. **Development Command:** `npm run dev`

### Domain Configuration

1. Add your custom domain in Vercel dashboard
2. Configure DNS records as instructed
3. Enable automatic HTTPS
4. Set up domain redirects if needed

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

The application includes a health check endpoint at `/api/health` that monitors:

- Application uptime
- Memory usage
- Database connectivity
- External API availability
- Environment configuration

### Lighthouse CI

Performance monitoring with Lighthouse CI:

```bash
# Run Lighthouse CI locally
npm run build
npm run start
npx lhci autorun
```

### Performance Budgets

The application enforces performance budgets:

- Total bundle size: 2MB
- JavaScript size: 1.5MB
- CSS size: 256KB
- Individual chunk size: 512KB
- Asset count limits

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:headed

# Run smoke tests only
npm run test:smoke
```

### Pre-commit Hooks

Pre-commit hooks are configured with Husky:

- Type checking
- Linting and formatting
- Commit message validation

```bash
# Install Husky
npm run prepare
```

## 🐛 Debugging

### Build Issues

```bash
# Check TypeScript errors
npm run type-check

# Check linting issues
npm run lint:check

# Check formatting
npm run format:check

# Bundle analysis
npm run analyze
```

### Runtime Issues

1. Check Vercel function logs
2. Monitor Sentry error reports
3. Use `/api/health` endpoint
4. Check browser console for client-side errors

## 🔒 Security

### Security Headers

The application includes security headers:

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Permissions Policy

### Environment Security

- Never commit secrets to version control
- Use Vercel environment variables
- Enable Vercel Security Headers
- Regular dependency updates

## 📊 Performance

### Optimization Strategies

1. **Code Splitting:** Dynamic imports for routes
2. **Image Optimization:** Next.js Image component
3. **Caching:** Static generation and ISR
4. **Bundle Analysis:** Regular bundle size monitoring
5. **CDN:** Vercel Edge Network

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check TypeScript errors
   - Verify environment variables
   - Check dependency versions

2. **Deployment Failures:**
   - Verify Vercel configuration
   - Check function timeout limits
   - Validate environment variables

3. **Performance Issues:**
   - Run bundle analysis
   - Check Lighthouse reports
   - Monitor Core Web Vitals

### Support

For deployment issues:

1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Monitor application health endpoint
4. Check Sentry error reports

## 📝 Changelog

Track deployment changes and updates in the project's CHANGELOG.md file.

## 🤝 Contributing

Before contributing:

1. Set up local development environment
2. Run tests locally
3. Follow code style guidelines
4. Test deployment in preview environment