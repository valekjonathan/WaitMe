// @ts-check
/**
 * Smoke tests: ruta /dev-diagnostics (solo en DEV).
 * Ejecutar con: npm run test:e2e tests/smoke/diagnostics.spec.js
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke - Diagnostics', () => {
  test('ruta /dev-diagnostics carga en modo normal', async ({ page }) => {
    await page.goto('/#/dev-diagnostics');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });

    // En DEV la ruta existe; en prod puede no existir
    const diag = page.getByText('Dev Diagnostics', { exact: false });
    const waitMe = page.getByText('WaitMe!', { exact: false });
    const hasContent = (await diag.isVisible().catch(() => false)) || (await waitMe.isVisible().catch(() => false));
    expect(hasContent).toBeTruthy();
  });
});
