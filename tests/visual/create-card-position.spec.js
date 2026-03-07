// @ts-check
/**
 * Test visual: posición de la tarjeta "Estoy aparcado aquí" respecto al menú inferior.
 * Base para comprobar cambios de posición.
 * Usa visual comparison oficial de Playwright (toHaveScreenshot).
 */
import { test, expect } from '@playwright/test';

test.describe('Visual - Create card position', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    const isVisible = await createBtn.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Botón "Estoy aparcado aquí" no visible (¿Login en curso?)');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(2000);
  });

  test('tarjeta create y menú inferior visibles', async ({ page }) => {
    const card = page
      .locator('[class*="rounded-2xl"]')
      .filter({ hasText: /me voy en|minutos|euros/i })
      .first();
    const nav = page.locator('[data-waitme-nav]');

    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(nav).toBeVisible({ timeout: 3000 });
  });

  test('screenshot: tarjeta create + menú inferior', async ({ page }) => {
    test.skip(!!process.env.CI, 'CI: layout variable para screenshot (docs/TESTS_SKIPPED.md)');
    const card = page
      .locator('[class*="rounded-2xl"]')
      .filter({ hasText: /me voy en|minutos|euros/i })
      .first();
    const nav = page.locator('[data-waitme-nav]');

    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(nav).toBeVisible({ timeout: 3000 });

    // Viewport fijo para screenshots consistentes (iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });

    // Screenshot del viewport para validar posición tarjeta vs menú
    await expect(page).toHaveScreenshot('create-card-and-nav.png');
  });
});
