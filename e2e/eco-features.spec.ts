import { test, expect } from '@playwright/test';

test.describe('Eco Features', () => {
  test('should load eco page successfully @smoke', async ({ page }) => {
    await page.goto('/eco');
    await expect(page).toHaveTitle(/.*Eco.*|.*SneakerVault.*/);
    await expect(page.locator('h1')).toContainText(/Eco.*Responsible|Sustainability/i);
  });

  test('should display carbon footprint calculator', async ({ page }) => {
    await page.goto('/eco');

    // Navigate to calculator tab if exists
    const calculatorTab = page.locator('button:has-text("Calculator"), button:has-text("Carbon")');
    if (await calculatorTab.isVisible()) {
      await calculatorTab.click();
    }

    // Check for calculator component
    await expect(page.locator('[data-testid="carbon-calculator"], .carbon-calculator')).toBeVisible({ timeout: 10000 });
  });

  test('should show second life products', async ({ page }) => {
    await page.goto('/eco');

    // Navigate to second life tab if exists
    const secondLifeTab = page.locator('button:has-text("Second Life"), button:has-text("Refurbished")');
    if (await secondLifeTab.isVisible()) {
      await secondLifeTab.click();
    }

    // Check for second life products
    await expect(page.locator('[data-testid="second-life-products"], .second-life')).toBeVisible({ timeout: 10000 });
  });

  test('should display sustainability metrics', async ({ page }) => {
    await page.goto('/eco');

    // Check for sustainability stats or metrics
    const metrics = page.locator('.sustainability-meter, [data-testid="sustainability-meter"], .eco-metrics');
    await expect(metrics).toBeVisible({ timeout: 10000 });
  });
});