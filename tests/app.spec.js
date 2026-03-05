// @ts-check
import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('abre la app y carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('muestra Login o contenido principal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loginOrContent = page.locator('text=WaitMe!').or(page.locator('text=Continuar con Google'));
    await expect(loginOrContent.first()).toBeVisible({ timeout: 10000 });
  });
});
