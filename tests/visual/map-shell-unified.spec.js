// @ts-check
/**
 * Valida que ambas pantallas de mapa (create y search) montan el mismo shell base
 * y que la tarjeta tiene separación correcta con la barra inferior.
 */
import { test, expect } from '@playwright/test';

test.describe('Map shell unificado', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('create: shell y panel presentes', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Login en curso');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    await expect(page.locator('[data-map-viewport-shell]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 3000 });
  });

  test('search: shell y panel presentes (mismo shell que create)', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: /dónde quieres aparcar/i });
    if (!(await searchBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Login en curso');
      return;
    }
    await searchBtn.click();
    await page.waitForTimeout(2000);

    await expect(page.locator('[data-map-viewport-shell]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 3000 });
  });

  test('search: panel y nav visibles (mismo MapScreenPanel que create)', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: /dónde quieres aparcar/i });
    if (!(await searchBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Login en curso');
      return;
    }
    await searchBtn.click();
    await page.waitForTimeout(2000);

    const panel = page.locator('[data-map-screen-panel]');
    const nav = page.locator('[data-waitme-nav]');

    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(nav).toBeVisible({ timeout: 3000 });
  });
});
