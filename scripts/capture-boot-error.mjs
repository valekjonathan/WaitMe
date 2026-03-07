#!/usr/bin/env node
/**
 * Captura el error exacto del boot de WaitMe.
 * Ejecutar: node scripts/capture-boot-error.mjs
 */
import { chromium } from 'playwright';

const baseURL = 'http://localhost:5173';
const errors = [];
const consoleLogs = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push({ type: 'console', text });
    }
    consoleLogs.push({ type, text: text.slice(0, 200) });
  });

  page.on('pageerror', (err) => {
    errors.push({
      type: 'pageerror',
      message: err.message,
      stack: err.stack,
    });
  });

  try {
    const res = await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent();
    const hasErrorBoundary = bodyText && bodyText.includes('Error cargando WaitMe');
    const hasMissingEnv = bodyText && bodyText.includes('Falta configuración');
    const hasWaitMe = bodyText && bodyText.includes('WaitMe');

    console.log('\n=== RESULTADO ===');
    console.log('Status:', res?.status());
    console.log('Error cargando WaitMe:', hasErrorBoundary);
    console.log('MissingEnvScreen:', hasMissingEnv);
    console.log('WaitMe visible:', hasWaitMe);
    console.log('\n=== CONSOLE ERRORS ===');
    errors.forEach((e, i) => console.log(`[${i}]`, JSON.stringify(e, null, 2)));
    console.log('\n=== PAGE ERRORS (stack) ===');
    const pageErrs = errors.filter((e) => e.type === 'pageerror');
    pageErrs.forEach((e) => {
      console.log('Message:', e.message);
      console.log('Stack:\n', e.stack);
    });
  } catch (e) {
    console.error('Capture error:', e.message);
  } finally {
    await browser.close();
  }
}

main();
