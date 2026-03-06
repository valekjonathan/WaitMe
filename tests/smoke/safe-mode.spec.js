// @ts-check
/**
 * Smoke tests: SAFE MODE.
 * Ejecutar con: VITE_SAFE_MODE=true npm run test:e2e tests/smoke/safe-mode.spec.js
 */
import { test, expect } from '@playwright/test';

const isSafeMode = process.env.VITE_SAFE_MODE === 'true';

test.describe('Smoke - Safe Mode', { skip: !isSafeMode }, () => {
  test('SAFE MODE carga y muestra shell', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
    await expect(root).not.toBeEmpty();

    const safeMode = page.getByText('SAFE MODE', { exact: false });
    await expect(safeMode.first()).toBeVisible({ timeout: 5000 });
  });

  test('no hay pantalla blanca en SAFE MODE', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    const hasFatalError =
      (bodyText && bodyText.includes('dispatcher')) ||
      (bodyText && bodyText.includes('TypeError: null is not an object'));

    expect(hasFatalError).toBeFalsy();
  });

  test('ruta /dev-diagnostics carga en SAFE MODE', async ({ page }) => {
    await page.goto('/#/dev-diagnostics');
    await page.waitForLoadState('domcontentloaded');

    const diag = page.getByText('Dev Diagnostics', { exact: false });
    await expect(diag.first()).toBeVisible({ timeout: 5000 });
  });
});
