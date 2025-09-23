import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully @smoke', async ({ page }) => {
    await expect(page).toHaveTitle(/SneakerVault/);

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Find Your Perfect Sneakers');

    // Check for search functionality
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Nike Air Max');
    await searchInput.press('Enter');

    // Should navigate to products or show suggestions
    await expect(page).toHaveURL(/.*search.*|.*products.*|.*#.*/);
  });

  test('should display featured products', async ({ page }) => {
    // Wait for featured products section to load
    await page.waitForSelector('[data-testid="featured-products"], .featured-products, section:has-text("Featured")', { timeout: 10000 });

    // Check if products are displayed
    const products = page.locator('.product-card, [data-testid="product-card"]');
    await expect(products.first()).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have working footer links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for footer content
    const footer = page.locator('footer, [data-testid="footer"]');
    await expect(footer).toBeVisible();
  });

  test('should load performance assets efficiently', async ({ page }) => {
    // Monitor network requests
    const responses: any[] = [];
    page.on('response', response => {
      responses.push(response);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that critical resources loaded successfully
    const htmlResponse = responses.find(r => r.url().includes('/') && r.request().resourceType() === 'document');
    expect(htmlResponse.status()).toBe(200);

    // Check for performance
    const metrics = await page.evaluate(() => JSON.stringify(performance.timing));
    const timing = JSON.parse(metrics);
    const loadTime = timing.loadEventEnd - timing.navigationStart;

    // Load time should be reasonable (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });
});