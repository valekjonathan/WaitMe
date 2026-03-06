// @ts-check
/**
 * Smoke tests: la app carga sin errores fatales.
 * Sin dependencia de Percy. Ejecutar con: npm run test:e2e tests/smoke/
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke - Carga', () => {
  test('la app carga y #root tiene contenido', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
    await expect(root).not.toBeEmpty();
  });

  test('no hay pantalla blanca ni error fatal (dispatcher, TypeError)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();

    const bodyText = await body.textContent();
    const hasFatalError =
      (bodyText && bodyText.includes('dispatcher')) ||
      (bodyText && bodyText.includes('TypeError: null is not an object'));

    expect(hasFatalError).toBeFalsy();
  });

  test('muestra Login o Home (WaitMe! visible)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const waitMe = page.getByText('WaitMe!', { exact: false });
    await expect(waitMe.first()).toBeVisible({ timeout: 15000 });
  });
});
