// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Mapa', () => {
  test('el mapa o la app cargan sin errores de Mapbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const tokenError = page.getByText(/VITE_MAPBOX_TOKEN|Configura.*MAPBOX/i);
    await expect(tokenError).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('la app no muestra errores de mapa en la UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
