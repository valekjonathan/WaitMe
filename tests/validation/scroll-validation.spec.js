// @ts-check
/**
 * FASE 2 — Validación de scroll.
 * Verifica: document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight.
 * Confirmar scrollHeight == innerHeight en HOME, CREATE, NAVIGATE.
 */
import { test, expect } from '@playwright/test';

async function getScrollMetrics(page) {
  return page.evaluate(() => {
    const docScroll = document.documentElement.scrollHeight;
    const bodyScroll = document.body.scrollHeight;
    const innerH = window.innerHeight;
    return {
      documentScrollHeight: docScroll,
      bodyScrollHeight: bodyScroll,
      innerHeight: innerH,
      docEqualsInner: docScroll === innerH,
      bodyEqualsInner: bodyScroll === innerH,
    };
  });
}

test.describe('Validación - Scroll', () => {
  test('HOME: scrollHeight == innerHeight', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }
    await page.waitForTimeout(500);
    const m = await getScrollMetrics(page);
    console.log('[HOME]', m);
    expect(
      m.documentScrollHeight,
      `documentScrollHeight=${m.documentScrollHeight} debe ser == innerHeight=${m.innerHeight}`
    ).toBe(m.innerHeight);
  });

  test('CREATE: scrollHeight == innerHeight', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }
    await createBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    const m = await getScrollMetrics(page);
    console.log('[CREATE]', m);
    expect(
      m.documentScrollHeight,
      `documentScrollHeight=${m.documentScrollHeight} debe ser == innerHeight=${m.innerHeight}`
    ).toBe(m.innerHeight);
  });

  test('NAVIGATE (search): scrollHeight == innerHeight', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const searchBtn = page.getByRole('button', { name: /dónde quieres aparcar/i });
    if (!(await searchBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }
    await searchBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    const m = await getScrollMetrics(page);
    console.log('[NAVIGATE]', m);
    expect(
      m.documentScrollHeight,
      `documentScrollHeight=${m.documentScrollHeight} debe ser == innerHeight=${m.innerHeight}`
    ).toBe(m.innerHeight);
  });

  test('NAVIGATE page (/navigate): scrollHeight == innerHeight', async ({ page }) => {
    await page.goto('/navigate');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const m = await getScrollMetrics(page);
    console.log('[NAVIGATE PAGE]', m);
    expect(
      m.documentScrollHeight,
      `documentScrollHeight=${m.documentScrollHeight} debe ser == innerHeight=${m.innerHeight}`
    ).toBe(m.innerHeight);
  });
});
