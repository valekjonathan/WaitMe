// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test('al abrir perfil no aparece "Error al guardar"', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForLoadState('networkidle');
    const errorText = page.getByText('Error al guardar');
    await expect(errorText).not.toBeVisible({ timeout: 5000 });
  });

  test('pantalla perfil carga sin errores visibles', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: 'Error al guardar' });
    await expect(errorAlert).not.toBeVisible();
  });
});
