// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('la app abre y carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    await page.waitForLoadState('domcontentloaded');
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('muestra contenido principal o Login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hasContent =
      (await page.locator('text=WaitMe!').isVisible()) ||
      (await page.locator('text=Continuar con Google').isVisible()) ||
      (await page.locator('#root').isVisible());
    expect(hasContent).toBeTruthy();
  });
});
