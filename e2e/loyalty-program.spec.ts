import { test, expect } from '@playwright/test';

test.describe('Loyalty Program', () => {
  test('should load loyalty page successfully @smoke', async ({ page }) => {
    await page.goto('/loyalty');
    await expect(page).toHaveTitle(/.*Loyalty.*|.*SneakerVault.*/);
    await expect(page.locator('h1')).toContainText(/Loyalty.*Program|SneakerVault.*Loyalty/i);
  });

  test('should display loyalty dashboard', async ({ page }) => {
    await page.goto('/loyalty');

    // Check for loyalty dashboard components
    await expect(page.locator('[data-testid="loyalty-dashboard"], .loyalty-dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should show tier information', async ({ page }) => {
    await page.goto('/loyalty');

    // Check for tier information (Bronze, Silver, Gold)
    const tierInfo = page.locator('text=/Bronze|Silver|Gold/i');
    await expect(tierInfo.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display points earning methods', async ({ page }) => {
    await page.goto('/loyalty');

    // Check for points earning information
    const pointsInfo = page.locator('text=/points|earn|purchase/i');
    await expect(pointsInfo.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show social sharing features', async ({ page }) => {
    await page.goto('/loyalty');

    // Check for social sharing component
    const socialShare = page.locator('[data-testid="social-share"], .social-share, text=/share.*earn/i');
    await expect(socialShare.first()).toBeVisible({ timeout: 10000 });
  });
});