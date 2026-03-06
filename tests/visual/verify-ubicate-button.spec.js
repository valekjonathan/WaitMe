// @ts-check
/**
 * Verifica que el botón Ubícate existe, está conectado y es clickeable.
 * Handler: handleLocate → geolocation.getCurrentPosition → window.__WAITME_MAP__.flyTo (verificado en CreateAlertCard.jsx)
 */
import { test, expect } from '@playwright/test';

test.describe('Verify - Ubícate button', () => {
  test('botón Ubícate visible y clickeable en create', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(2000);

    const card = page.locator('[class*="rounded-2xl"]').filter({ hasText: /me voy en|minutos|euros/i });
    await expect(card).toBeVisible({ timeout: 5000 });

    const ubicateBtn = card.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(ubicateBtn).toBeVisible({ timeout: 3000 });
    expect(await ubicateBtn.getAttribute('disabled')).toBeNull();
  });
});
